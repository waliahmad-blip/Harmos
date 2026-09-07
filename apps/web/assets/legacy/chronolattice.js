/* ═══════════════════════════════════════════════════════════════════
   HARMOS · FIRST LIGHT — chronolattice.js · v1.0 · HALF A (of 2)
   The engine: reads chapters-data.js, drives beats + canvas scenes.
   HALF A: core + scenes 1–8.  HALF B (separate paste): scenes 9–16.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
'use strict';

/* ═══════════ 0 · GLOBAL STATE ═══════════ */
const CL = window.CL_FILM;
const SH = window.CL_SHARED || {};
const PAL = (SH.palette) || { void:"#070818", panel:"#0C1022", violet:"#8FA8FF", cyan:"#44EDF7",
  gold:"#F5B84A", red:"#FF5A5F", ivory:"#F4F1E8", lux:"#E0AAFF", blue:"#7FB8FF" };

const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const TOUCH = matchMedia('(pointer:coarse)').matches;
const DPR = Math.min(devicePixelRatio || 1, 2);

let curCh = 0;          // current chapter index
let curBeat = -1;       // current beat index within chapter
let busy = false;       // transition lock
let engine = null;      // active scene engine (object with tick/destroy)
let px = 0, py = 0;     // normalized pointer (-.5..+.5)
addEventListener('pointermove', e => {
  px = e.clientX / innerWidth - .5; py = e.clientY / innerHeight - .5;
}, { passive:true });

/* ═══════════ 1 · UTILITIES ═══════════ */
const $ = s => document.querySelector(s);
const $$ = s => [].slice.call(document.querySelectorAll(s));
const el = (tag, cls, html) => { const d = document.createElement(tag);
  if (cls) d.className = cls; if (html != null) d.innerHTML = html; return d; };
const rnd = (a, b) => a + Math.random() * (b - a);
const TAU = Math.PI * 2;

/* toast */
let toastT = null;
function toast(msg) {
  const t = $('#clToast'); if (!t) return;
  t.textContent = msg; t.style.transform = 'translate(-50%,24px)'; t.style.opacity = 1;
  clearTimeout(toastT);
  toastT = setTimeout(() => { t.style.transform = 'translate(-50%,-160%)'; t.style.opacity = 0; }, 2600);
}
window.clToast = toast;

/* easing */
const E = {
  io: t => t < .5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2) / 2,
  out: t => 1 - Math.pow(1 - t, 3),
  in: t => t * t * t,
  back: t => { const c = 1.70158; return 1 + (c+1) * Math.pow(t-1,3) + c * Math.pow(t-1,2); }
};

/* canvas helpers */
function fitCanvas(cv) {
  const r = cv.getBoundingClientRect();
  if (!r.width || !r.height) return false;
  cv.width = Math.round(r.width * DPR); cv.height = Math.round(r.height * DPR);
  return true;
}
function glowDot(ctx, x, y, r, color, blur) {
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
  ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = blur * DPR;
  ctx.fill(); ctx.restore();
}
function line(ctx, x1, y1, x2, y2, color, w) {
  ctx.strokeStyle = color; ctx.lineWidth = w * DPR;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}

/* ═══════════ 2 · SFX (procedural, opt-in) ═══════════ */
const sfx = {
  ctx: null, on: false,
  init() { try { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){} },
  tone(f, d, type, vol, slide) {
    if (!this.on || !this.ctx) return;
    try {
      const c = this.ctx, o = c.createOscillator(), g = c.createGain(), n = c.currentTime;
      o.type = type || 'sine'; o.frequency.setValueAtTime(f, n);
      if (slide) o.frequency.exponentialRampToValueAtTime(slide, n + d);
      g.gain.setValueAtTime(vol || .1, n); g.gain.exponentialRampToValueAtTime(.0001, n + d);
      o.connect(g); g.connect(c.destination); o.start(n); o.stop(n + d);
    } catch(e){}
  },
  pad()  { this.tone(96, 1.5, 'sine', .06); this.tone(144, 1.5, 'sine', .04); },
  chime(){ this.tone(660, .5, 'sine', .1); setTimeout(()=>this.tone(880,.7,'sine',.1), 140); },
  buzz() { this.tone(150, .5, 'sawtooth', .09, 70); },
  blip() { this.tone(520, .08, 'sine', .06); },
  sub()  { this.tone(52, .6, 'sine', .16); }
};
window.clSfx = sfx;

/* ═══════════ 3 · THE NARRATION LAYER ═══════════ */
function buildNarr() {
  const narr = $('#clNarr');
  narr.innerHTML =
    '<span class="cl-actbadge" id="clActBadge"><i></i><span id="clActName"></span></span>' +
    '<div class="cl-chnum" id="clChNum"></div>' +
    '<div class="cl-kicker" id="clKicker"></div>' +
    '<h2 class="cl-chtitle" id="clChTitle"></h2>' +
    '<p class="cl-beat" id="clBeat"></p>' +
    '<div class="cl-beatnav">' +
      '<button class="cl-bbtn" id="clBeatPrev" aria-label="Previous beat">‹</button>' +
      '<div class="cl-bdots" id="clBeatDots"></div>' +
      '<button class="cl-bbtn" id="clBeatNext" aria-label="Next beat">›</button>' +
    '</div>' +
    '<div class="cl-hint">← → beat · ↑↓ chapter · space next</div>';
}

function splitWords(text) {
  return text.split(' ').map(w => '<span class="w">' + w + '</span>').join(' ');
}

function showBeat(ci, bi) {
  const ch = CL.chapters[ci];
  const beat = ch.beats[bi];
  const beatEl = $('#clBeat');
  curBeat = bi;

  /* heading (only updates on chapter entry, but harmless to set) */
  const act = CL.acts[ch.act];
  $('#clActName').textContent = 'ACT ' + act.id + ' · ' + act.name.toUpperCase();
  $('#clActBadge').style.color = act.color;
  $('#clActBadge').style.borderColor = act.color + '59';
  $('#clChNum').textContent = String(ch.n).padStart(2, '0');
  $('#clKicker').textContent = ch.kicker;
  $('#clChTitle').textContent = ch.title;

  /* words */
  beatEl.innerHTML = splitWords(beat.text);
  const words = $$('#clBeat .w');
  words.forEach((w, i) => {
    w.style.transition = 'opacity .5s cubic-bezier(.2,.8,.2,1), transform .5s cubic-bezier(.2,.8,.2,1)';
    w.style.transitionDelay = (i * 42) + 'ms';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      w.style.opacity = 1; w.style.transform = 'none';
    }));
  });

  /* dots */
  const dots = $('#clBeatDots'); dots.innerHTML = '';
  ch.beats.forEach((b, i) => {
    const d = el('i'); if (i === bi) d.className = 'on';
    else if (i < bi) d.className = 'seen';
    d.title = 'Beat ' + (i + 1);
    d.addEventListener('click', () => showBeat(ci, i));
    dots.appendChild(d);
  });

  /* fire the scene cue */
  fireScene(ch, beat);
}

/* ═══════════ 4 · THE SCENE REGISTRY ═══════════ */
const SCENES = {};   // filled by HALF A + HALF B: SCENES[sceneName] = factory

function fireScene(ch, beat) {
  const vis = $('#clVisual');
  if (engine && engine.setBeat) {
    /* reuse running engine */
    try { engine.setBeat(beat, ch); return; } catch(e) { /* fall through & rebuild */ }
  }
  const factory = SCENES[ch.scene];
  if (!factory) return;
  engine = factory(vis, ch);
  try { engine.setBeat(beat, ch); } catch(e) {}
}

/* ═══════════ 5 · SCENE · CH1 — THE SWARM ═══════════ */
SCENES.swarm = function (vis, ch) {
  const cv = el('canvas'); vis.appendChild(cv);
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, ok = fitCanvas(cv);
  const cfg = ch.cfg || {};
  const fakes = [];
  const N = RM ? 60 : (cfg.swarmCount || 200);
  let mode = 'void';          // void → fracture → flood → turn → pixel
  let t0 = performance.now();
  let glitchT = 0;
  const real = { x: .5, y: .5, glow: 0 };
  let stats = null;           // DOM callouts

  function seed() {
    fakes.length = 0;
    for (let i = 0; i < N; i++) {
      const a = Math.random() * TAU, r = Math.pow(Math.random(), .6);
      fakes.push({ a, r, sz: rnd(10, 42), sp: rnd(.12, .5) * (Math.random() < .5 ? 1 : -1),
        wob: Math.random() * TAU, glitch: Math.random() < (cfg.glitchRate || .35) });
    }
  }
  seed();

  function makeStats() {
    if (stats) stats.remove();
    stats = el('div');
    const s1 = el('div', 'cl-stat cyan', '<div class="cl-num" data-n="500000" data-pfx="" data-sfx="+" data-fmt="k">0</div><div class="cl-lbl">synthetic files / month — caught only</div>');
    const s2 = el('div', 'cl-stat', '<div class="cl-num" data-n="5" data-pfx="$" data-sfx="T" data-fmt="s">0</div><div class="cl-lbl">lost to fraud every year</div>');
    const s3 = el('div', 'cl-stat gold', '<div class="cl-num" data-n="30" data-pfx="" data-sfx="%" data-fmt="s">0</div><div class="cl-lbl">of COD parcels refused — Pakistan</div>');
    s1.style.cssText = 'left:8%;top:14%'; s2.style.cssText = 'left:50%;top:6%;transform:translateX(-50%)';
    s3.style.cssText = 'right:8%;bottom:16%';
    stats.append(s1, s2, s3);
    vis.appendChild(stats);
    /* count-up */
    $$('.cl-stat .cl-num', ).forEach(num => {
      const target = +num.dataset.n, pfx = num.dataset.pfx || '', sfxS = num.dataset.sfx || '';
      const start = performance.now(), dur = 1600;
      (function step(now) {
        const p = Math.min(1, (now - start) / dur), v = target * E.out(p);
        num.textContent = pfx + Math.round(v).toLocaleString() + sfxS;
        if (p < 1) requestAnimationFrame(step);
      })(start);
    });
  }

  const api = {
    setBeat(beat) {
      t0 = performance.now();
      if (beat.fx === 'void-real') mode = 'void';
      if (beat.fx === 'fracture') { mode = 'fracture'; sfx.sub(); }
      if (beat.fx === 'stat-flood') { mode = 'flood'; makeStats(); }
      if (beat.fx === 'stat-parcel' || beat.fx === 'stat-odo' || beat.fx === 'stat-heart') {
        /* highlight one stat at a time */
        const idx = { 'stat-parcel': 2, 'stat-odo': 1, 'stat-heart': 0 }[beat.fx];
        const list = $$('.cl-stat', stats || document);
        list.forEach((s, i) => {
          s.style.transition = 'opacity .4s, transform .4s';
          if (i === idx) { s.style.opacity = 1; s.style.transform = 'translateX(0) scale(1.06)';
            s.style.zIndex = 6; }
          else { s.style.opacity = .25; }
        });
      }
      if (beat.fx === 'swarm-turn') { mode = 'turn'; if (stats) stats.style.opacity = 0; }
      if (beat.fx === 'real-pixel') { mode = 'pixel'; real.glow = 0; sfx.chime(); }
    },
    tick(t) {
      if (!ok && (ok = fitCanvas(cv))) {}
      if (!ok) return;
      W = cv.width; H = cv.height;
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H * .48;
      const age = (t - t0) / 1000;
      const spread = mode === 'void' ? .06 : mode === 'fracture' ? Math.min(.85, .06 + age * .5) : .95;

      /* glitch flicker */
      glitchT += .16;

      for (const f of fakes) {
        const rr = f.r * spread;
        const a = f.a + t * .0001 * f.sp * (mode === 'turn' ? 2.4 : 1);
        const wob = Math.sin(t * .001 + f.wob) * .04;
        const x = cx + Math.cos(a + wob) * rr * W * .5;
        const y = cy + Math.sin(a + wob) * rr * H * .46;
        const sz = f.sz * DPR * (mode === 'void' ? .8 : 1);
        /* fake polaroid: white frame, dark fill */
        ctx.save();
        ctx.translate(x, y);
        if (mode === 'turn') ctx.rotate(Math.atan2(H * .6 - y, W * .6 - x) * .18);
        else ctx.rotate(Math.sin(t * .0004 + f.wob) * .12);
        ctx.globalAlpha = mode === 'void' ? .9 : .8;
        ctx.fillStyle = '#E8E4D8';
        ctx.fillRect(-sz/2, -sz/2, sz, sz * 1.18);
        ctx.fillStyle = '#1a1d2c';
        ctx.fillRect(-sz/2 + sz*.07, -sz/2 + sz*.07, sz*.86, sz*.86);
        if (f.glitch && Math.sin(glitchT + f.wob * 3) > .82) {
          ctx.fillStyle = 'rgba(255,90,95,.5)';
          ctx.fillRect(-sz/2, rnd(-sz/2, sz/2), sz, 1.6 * DPR);
        }
        ctx.restore();
      }

      /* the one real pixel */
      if (mode === 'pixel' || mode === 'turn') {
        real.glow = Math.min(1, real.glow + .02);
        const rx = cx, ry = cy;
        const pulse = .7 + .3 * Math.sin(t * .004);
        glowDot(ctx, rx, ry, 3.4 * DPR * pulse, PAL.cyan, 26);
        glowDot(ctx, rx, ry, (16 + 10 * Math.sin(t * .002)) * DPR * real.glow, 'rgba(68,237,247,.16)', 40);
        /* fading fakes clear a ring around it */
        ctx.save();
        const grd = ctx.createRadialGradient(rx, ry, 0, rx, ry, 90 * DPR);
        grd.addColorStop(0, 'rgba(7,8,24,.9)'); grd.addColorStop(1, 'rgba(7,8,24,0)');
        ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }
    }
  };
  return api;
};

/* ═══════════ 6 · SCENE · CH2 — THE VANISHING WITNESS ═══════════ */
SCENES.timeline = function (vis, ch) {
  const cv = el('canvas'); vis.appendChild(cv);
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, ok = fitCanvas(cv);
  let mode = 'ancient';
  let t0 = performance.now();
  const eras = ['market', 'scroll', 'notary', 'handshake', 'screen'];
  let eraIdx = 0;
  let witnessAlpha = 1;

  function drawWitness(x, y, alpha, color) {
    if (alpha <= 0) return;
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 14 * DPR;
    /* simple silhouette: head + body */
    ctx.beginPath(); ctx.arc(x, y - 26 * DPR, 8 * DPR, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 11 * DPR, y);
    ctx.quadraticCurveTo(x, y - 18 * DPR, x + 11 * DPR, y);
    ctx.lineTo(x + 8 * DPR, y + 26 * DPR); ctx.lineTo(x - 8 * DPR, y + 26 * DPR);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function drawDeal(x, y, alpha, verified) {
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.strokeStyle = verified ? PAL.gold : 'rgba(244,241,232,.5)';
    ctx.lineWidth = 1.4 * DPR;
    ctx.strokeRect(x - 14 * DPR, y - 10 * DPR, 28 * DPR, 20 * DPR);
    if (verified) { ctx.shadowColor = PAL.gold; ctx.shadowBlur = 10 * DPR;
      ctx.strokeRect(x - 14 * DPR, y - 10 * DPR, 28 * DPR, 20 * DPR); }
    ctx.restore();
  }

  const api = {
    setBeat(beat) {
      t0 = performance.now();
      mode = { 'era-ancient': 'ancient', 'era-handshake': 'flow', 'era-screen': 'screen',
               'padlock-door': 'door', 'drift-dark': 'dark' }[beat.fx] || mode;
      if (beat.fx === 'era-screen') { witnessAlpha = 1; }
    },
    tick(t) {
      if (!ok && (ok = fitCanvas(cv))) {}
      if (!ok) return;
      W = cv.width; H = cv.height;
      ctx.clearRect(0, 0, W, H);
      const age = (t - t0) / 1000;

      if (mode === 'ancient' || mode === 'flow') {
        /* horizontal river of deals, witness above each */
        const n = 5;
        for (let i = 0; i < n; i++) {
          const x = W * (.12 + .76 * i / (n - 1));
          const y = H * .62;
          drawDeal(x, y, .9, true);
          drawWitness(x, y - 42 * DPR, mode === 'ancient' ? 1 : Math.max(0, 1 - age * .4), PAL.gold);
        }
        if (mode === 'flow') { eraIdx = Math.min(4, Math.floor(age * 1.4)); }
      }

      if (mode === 'screen') {
        /* timeline collapses into one glowing screen; witness dissolves */
        const p = Math.min(1, age / 1.8);
        const sx = W / 2, sy = H * .5;
        ctx.save();
        ctx.strokeStyle = 'rgba(143,168,255,' + (.5 * (1 - p)) + ')';
        ctx.lineWidth = 2 * DPR;
        ctx.strokeRect(sx - 60 * DPR, sy - 40 * DPR, 120 * DPR, 80 * DPR);
        ctx.restore();
        witnessAlpha = Math.max(0, 1 - p * 1.2);
        /* particles of dissolution */
        if (p > .2) {
          ctx.save();
          for (let i = 0; i < 40; i++) {
            const a = Math.random() * TAU, r = p * 120 * DPR * Math.random();
            ctx.fillStyle = 'rgba(245,184,74,' + (1 - p) * .5 + ')';
            ctx.fillRect(sx + Math.cos(a) * r, sy - 30 * DPR + Math.sin(a) * r, 2 * DPR, 2 * DPR);
          }
          ctx.restore();
        }
        drawWitness(sx, sy - 10 * DPR, witnessAlpha, PAL.gold);
      }

      if (mode === 'door' || mode === 'dark') {
        /* the padlock on the door, deals outside in the dark */
        const dx = W / 2, dy = H * .46;
        const dark = mode === 'dark' ? Math.min(1, age / 2) : .35;
        ctx.save();
        /* door */
        ctx.strokeStyle = 'rgba(244,241,232,.4)';
        ctx.lineWidth = 2 * DPR;
        ctx.strokeRect(dx - 70 * DPR, dy - 90 * DPR, 140 * DPR, 180 * DPR);
        /* padlock */
        ctx.strokeStyle = PAL.cyan; ctx.lineWidth = 2.4 * DPR;
        ctx.shadowColor = PAL.cyan; ctx.shadowBlur = 12 * DPR;
        ctx.beginPath();
        ctx.arc(dx, dy - 18 * DPR, 14 * DPR, Math.PI, 0);
        ctx.stroke();
        ctx.fillStyle = 'rgba(68,237,247,.15)';
        ctx.fillRect(dx - 18 * DPR, dy - 18 * DPR, 36 * DPR, 30 * DPR);
        ctx.strokeRect(dx - 18 * DPR, dy - 18 * DPR, 36 * DPR, 30 * DPR);
        ctx.restore();
        /* deals floating OUTSIDE the door, unverified */
        for (let i = 0; i < 4; i++) {
          const a = t * .0003 + i * TAU / 4;
          const x = dx + Math.cos(a) * (150 * DPR + i * 22 * DPR);
          const y = dy + Math.sin(a) * (70 * DPR);
          drawDeal(x, y, (1 - dark) * .8, false);
        }
        if (mode === 'dark') {
          ctx.fillStyle = 'rgba(7,8,24,' + dark * .85 + ')';
          ctx.fillRect(0, 0, W, H);
        }
      }
    }
  };
  return api;
};

/* ═══════════ 7 · SCENE · CH3 — THE FIRST SEALING ═══════════ */
SCENES.ignition = function (vis, ch) {
  const cv = el('canvas'); vis.appendChild(cv);
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, ok = fitCanvas(cv);
  const cfg = ch.cfg || {};
  const rings = cfg.ringLabels || ['ATTESTATION', 'LIGHT', 'MOTION', 'CHAIN'];
  let stage = 'question';       // question → ignite → rings → seal → sunrise
  let litRings = 0;
  let t0 = performance.now();
  const node = { x: .5, y: .5, glow: 0 };
  let sunriseP = 0;

  const api = {
    setBeat(beat) {
      t0 = performance.now();
      const map = { 'question': 'question', 'ignite': 'ignite', 'zerith': 'ignite',
        'ring-attest': 'rings', 'ring-light': 'rings', 'ring-motion': 'rings', 'ring-chain': 'rings',
        'seal': 'seal', 'sunrise': 'sunrise' };
      stage = map[beat.fx] || stage;
      litRings = { 'ring-attest': 1, 'ring-light': 2, 'ring-motion': 3, 'ring-chain': 4 }[beat.fx] || litRings;
      if (beat.fx === 'ring-attest') sfx.sub();
      if (beat.fx === 'seal') sfx.chime();
    },
    tick(t) {
      if (!ok && (ok = fitCanvas(cv))) {}
      if (!ok) return;
      W = cv.width; H = cv.height;
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H * .5;
      const age = (t - t0) / 1000;

      /* perspective grid floor */
      ctx.save();
      ctx.strokeStyle = 'rgba(143,168,255,.10)';
      const hz = H * .78;
      for (let i = 0; i <= 10; i++) {
        const gx = W * i / 10;
        line(ctx, gx, H, W / 2 + (gx - W / 2) * .3, hz, 'rgba(143,168,255,.09)', 1);
      }
      for (let i = 1; i <= 7; i++) {
        const yy = hz + (H - hz) * Math.pow(i / 7, 2);
        line(ctx, 0, yy, W, yy, 'rgba(143,168,255,.07)', 1);
      }
      ctx.restore();

      if (stage === 'question') {
        /* a faint question-mark constellation */
        ctx.save(); ctx.globalAlpha = .35 + .15 * Math.sin(t * .003);
        ctx.font = (90 * DPR) + 'px "Space Grotesk"';
        ctx.fillStyle = PAL.violet; ctx.textAlign = 'center';
        ctx.fillText('?', cx, cy + 30 * DPR);
        ctx.restore();
      }

      /* the node */
      node.glow = Math.min(1, node.glow + (stage !== 'question' ? .02 : -.02));
      const pulse = .75 + .25 * Math.sin(t * .005);
      glowDot(ctx, cx, cy, 5 * DPR * pulse, PAL.cyan, 24);
      glowDot(ctx, cx, cy, 26 * DPR * node.glow, 'rgba(68,237,247,.14)', 40);

      /* the rings — stamp in one by one */
      if (stage === 'rings' || stage === 'seal' || stage === 'sunrise') {
        rings.forEach((label, i) => {
          if (i >= litRings) return;
          const rr = (46 + i * 26) * DPR;
          const spin = t * .0004 * (i % 2 ? -1 : 1);
          ctx.save();
          ctx.strokeStyle = i === litRings - 1 ? PAL.cyan : 'rgba(143,168,255,.45)';
          ctx.lineWidth = 1.4 * DPR;
          ctx.setLineDash([6 * DPR, 8 * DPR]);
          ctx.translate(cx, cy); ctx.rotate(spin);
          ctx.beginPath(); ctx.arc(0, 0, rr, 0, TAU); ctx.stroke();
          ctx.setLineDash([]);
          /* label */
          const la = spin + (i * TAU / 4);
          const lx = Math.cos(la) * rr, ly = Math.sin(la) * rr;
          ctx.rotate(-spin);
          ctx.font = (8.5 * DPR) + 'px "Space Grotesk"';
          ctx.fillStyle = i === litRings - 1 ? PAL.cyan : 'rgba(143,168,255,.7)';
          ctx.textAlign = 'center';
          ctx.fillText(label, lx, ly - 5 * DPR);
          ctx.restore();
        });
      }

      if (stage === 'seal') {
        /* the seal stamps */
        const p = Math.min(1, age / .8);
        ctx.save();
        ctx.translate(cx, cy); ctx.scale(E.back(p), E.back(p));
        ctx.strokeStyle = PAL.gold; ctx.lineWidth = 2.4 * DPR;
        ctx.shadowColor = PAL.gold; ctx.shadowBlur = 22 * DPR;
        ctx.beginPath(); ctx.arc(0, 0, 34 * DPR, 0, TAU); ctx.stroke();
        ctx.font = (10 * DPR) + 'px "Space Grotesk"';
        ctx.fillStyle = PAL.gold; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('SEALED', 0, 0);
        ctx.restore();
      }

      if (stage === 'sunrise') {
        /* light travels outward along grid lines */
        sunriseP = Math.min(1, sunriseP + .012 * (cfg.sunriseSpeed || 2));
        const sr = sunriseP * W * .75;
        ctx.save();
        const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, sr);
        grd.addColorStop(0, 'rgba(68,237,247,.22)');
        grd.addColorStop(.8, 'rgba(143,168,255,.08)');
        grd.addColorStop(1, 'rgba(143,168,255,0)');
        ctx.fillStyle = grd;
        ctx.beginPath(); ctx.arc(cx, cy, sr, 0, TAU); ctx.fill();
        /* travelling nodes on the horizon */
        for (let i = 0; i < 14; i++) {
          const a = i * TAU / 14 + t * .0002;
          const rr = sr * (.5 + .5 * Math.sin(i * 3.7));
          if (rr < sr) glowDot(ctx, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * .6,
            2.2 * DPR, PAL.violet, 10);
        }
        ctx.restore();
      }
    }
  };
  return api;
};

/* ═══════════ 8 · SCENE · CH4 — THE FOUR SENSES ═══════════ */
SCENES.senses = function (vis, ch) {
  const cv = el('canvas'); vis.appendChild(cv);
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, ok = fitCanvas(cv);
  const guards = (ch.cfg && ch.cfg.guardians) || [];
  let mode = 'intro';
  let active = -1;
  let objState = 'wait';      // wait → verified
  let forgery = null;         // shatter particle system
  const dom = [];

  function buildGuards() {
    dom.forEach(d => d.remove()); dom.length = 0;
    const pos = [[14, 16], [78, 16], [14, 74], [78, 74]]; // % positions
    guards.forEach((g, i) => {
      const card = el('div', 'cl-guard', '<span class="cl-glyph" style="color:' + g.color + '">' + g.glyph + '</span>' + g.name + '<small>' + g.case + '</small>');
      card.style.cssText = 'left:' + pos[i][0] + '%;top:' + pos[i][1] + '%;color:' + g.color;
      card.dataset.key = g.key;
      vis.appendChild(card); dom.push(card);
    });
  }
  buildGuards();

  function igniteCard(i) {
    dom.forEach((c, j) => {
      c.style.opacity = j <= i ? 1 : 0;
      c.classList.toggle('on', j === i);
      if (j === i) { c.style.transition = 'opacity .5s, transform .5s';
        c.style.transform = 'translateY(0)'; }
    });
  }

  function spawnForgery() {
    forgery = { x: .5, y: .5, pieces: [] };
    for (let i = 0; i < 26; i++) {
      forgery.pieces.push({ a: Math.random() * TAU, v: rnd(1, 4),
        vr: rnd(-.1, .1), s: rnd(3, 9), life: 1 });
    }
  }

  const api = {
    setBeat(beat) {
      const f = beat.fx;
      if (f === 'intro') { mode = 'intro'; dom.forEach(c => c.style.opacity = 0); }
      const gIdx = { 'guardian-see': 0, 'guardian-hear': 1, 'guardian-feel': 2, 'guardian-swear': 3 }[f];
      if (gIdx != null) { mode = 'guardian'; active = gIdx; igniteCard(gIdx); sfx.blip(); }
      if (f.startsWith('case-')) { mode = 'case'; }
      if (f === 'converge') { mode = 'converge'; objState = 'charging'; sfx.pad(); }
      if (f === 'shatter') { mode = 'shatter'; spawnForgery(); sfx.buzz(); }
    },
    tick(t) {
      if (!ok && (ok = fitCanvas(cv))) {}
      if (!ok) return;
      W = cv.width; H = cv.height;
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H * .5;

      /* center object — the mango */
      const objScale = mode === 'shatter' ? 0 : 1;
      if (objScale > 0) {
        ctx.save();
        ctx.translate(cx, cy);
        const s = 1 + (objState === 'charging' ? .08 * Math.sin(t * .01) : 0);
        ctx.scale(s, s);
        ctx.font = (54 * DPR) + 'px serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        if (objState === 'verified') { ctx.shadowColor = PAL.cyan; ctx.shadowBlur = 30 * DPR; }
        ctx.fillText('🥭', 0, 0);
        ctx.restore();
      }

      /* guardian beams during converge */
      if (mode === 'converge' || objState === 'verified') {
        const corners = [[.14, .16], [.78, .16], [.14, .74], [.78, .74]];
        corners.forEach((c, i) => {
          const gx = W * c[0], gy = H * c[1];
          const alpha = objState === 'verified' ? .5 : .2 + .2 * Math.sin(t * .006 + i);
          line(ctx, gx, gy, cx, cy, 'rgba(68,237,247,' + alpha + ')', 1.2);
        });
        if (mode === 'converge' && Math.sin(t * .004) > .96) { objState = 'verified'; sfx.chime(); }
      }

      /* case vignettes: per-sense mini-animations */
      if (mode === 'case') {
        ctx.save();
        const label = ['THE FLASH', 'THE ECHO', 'THE TREMOR', 'THE KEY'][active] || '';
        ctx.font = (10 * DPR) + 'px "Space Grotesk"';
        ctx.fillStyle = 'rgba(244,241,232,.5)'; ctx.textAlign = 'center';
        ctx.fillText(label, cx, H * .12);
        ctx.restore();
        if (active === 0) { /* light flash bars */
          for (let i = 0; i < 3; i++) {
            if (Math.sin(t * .008 + i * 2) > .4) {
              ctx.fillStyle = 'rgba(68,237,247,' + (.12 + .1 * Math.random()) + ')';
              ctx.fillRect(W * .25, H * (.3 + i * .12), W * .5, 8 * DPR);
            }
          }
        }
        if (active === 1) { /* chirp arcs */
          for (let i = 0; i < 3; i++) {
            const p = ((t * .0012 + i * .33) % 1);
            ctx.strokeStyle = 'rgba(127,184,255,' + (1 - p) * .6 + ')';
            ctx.lineWidth = 1.6 * DPR;
            ctx.beginPath(); ctx.arc(cx, cy, p * 70 * DPR, -0.6, 0.6); ctx.stroke();
            ctx.beginPath(); ctx.arc(cx, cy, p * 70 * DPR, Math.PI - .6, Math.PI + .6); ctx.stroke();
          }
        }
        if (active === 2) { /* tremor trace */
          ctx.beginPath();
          for (let x = 0; x <= W * .6; x += 4 * DPR) {
            const y = cy + Math.sin(x * .05 + t * .02) * 12 * DPR * Math.sin(x / (W * .3) * Math.PI);
            const X = W * .2 + x;
            x === 0 ? ctx.moveTo(X, y) : ctx.lineTo(X, y);
          }
          ctx.strokeStyle = PAL.violet; ctx.lineWidth = 1.8 * DPR;
          ctx.shadowColor = PAL.violet; ctx.shadowBlur = 8 * DPR; ctx.stroke();
        }
        if (active === 3) { /* the key */
          ctx.save();
          ctx.strokeStyle = PAL.lux || '#E0AAFF'; ctx.lineWidth = 2 * DPR;
          ctx.shadowColor = '#E0AAFF'; ctx.shadowBlur = 14 * DPR;
          const p = .5 + .5 * Math.sin(t * .003);
          ctx.beginPath(); ctx.arc(cx, cy - 8 * DPR, (8 + p * 2) * DPR, 0, TAU); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + 22 * DPR);
          ctx.moveTo(cx, cy + 16 * DPR); ctx.lineTo(cx + 8 * DPR, cy + 16 * DPR); ctx.stroke();
          ctx.restore();
        }
      }

      /* shatter debris */
      if (forgery) {
        for (const p of forgery.pieces) {
          p.life -= .012;
          p.a += p.vr;
          const r = (1 - p.life) * 120 * DPR;
          ctx.save();
          ctx.translate(cx + Math.cos(p.a) * r, cy + Math.sin(p.a) * r * .7);
          ctx.rotate(p.a * 3);
          ctx.globalAlpha = Math.max(0, p.life);
          ctx.fillStyle = PAL.red;
          ctx.fillRect(-p.s * DPR / 2, -p.s * DPR / 2, p.s * DPR, p.s * DPR);
          ctx.restore();
        }
        forgery = forgery.pieces.some(p => p.life > 0) ? forgery : null;
      }
    }
  };
  return api;
};

/* ═══════════ 9 · SCENE · CH5 — THE SIXTY-SECOND DEAL ═══════════ */
SCENES.deal60 = function (vis, ch) {
  const cv = el('canvas'); vis.appendChild(cv);
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, ok = fitCanvas(cv);
  const markers = (ch.cfg && ch.cfg.markers) || [];
  let phase = -1;    // index into markers
  let t0 = performance.now();
  const car = { x: .5, y: .55 };
  let chain = [];    // welded links
  const dom = [];

  function buildTimeline() {
    dom.forEach(d => d.remove()); dom.length = 0;
    const bar = el('div', 'cl-timer', '<i id="clTimerFill"></i>');
    vis.appendChild(bar); dom.push(bar);
    markers.forEach((m, i) => {
      const mk = el('div', 'cl-tmarker', '<div class="cl-tl">' + m.label + '</div><div class="cl-tt">' + m.tag + '</div>');
      mk.style.left = (m.t / 60 * 92 + 4) + '%';
      mk.style.opacity = 0;
      vis.appendChild(mk); dom.push(mk); mk._i = i;
    });
    const hb = el('canvas', 'cl-heart'); hb.id = 'clHeart';
    vis.appendChild(hb); dom.push(hb);
  }
  buildTimeline();

  function setPhase(i) {
    phase = i; t0 = performance.now();
    dom.forEach(d => {
      if (d._i != null) d.style.opacity = (d._i <= i) ? 1 : 0;
    });
    const fill = $('#clTimerFill');
    if (fill) fill.style.transition = 'width .8s cubic-bezier(.2,.8,.2,1)';
    if (fill) fill.style.width = (markers[i] ? markers[i].t / 60 * 100 : 100) + '%';
    if (i === 3) chain = [];
    if (i === 4) sfx.chime();
  }

  function drawHeart(t) {
    const hb = $('#clHeart'); if (!hb) return;
    const hctx = hb.getContext('2d');
    if (hb.width !== Math.round(hb.offsetWidth * DPR)) {
      hb.width = Math.round(hb.offsetWidth * DPR); hb.height = Math.round(hb.offsetHeight * DPR);
    }
    const w = hb.width, h = hb.height; hctx.clearRect(0, 0, w, h);
    const calm = phase >= 4 ? 1 : Math.max(0, 1 - (phase >= 0 ? (phase + 1) / 5 : 1));
    hctx.beginPath();
    for (let x = 0; x <= w; x += 2) {
      const beat = Math.pow(Math.max(0, Math.sin(x * .04 + t * .004)), 6) * 14 * DPR * calm;
      const y = h / 2 - beat - Math.sin(x * .12 + t * .002) * 2 * DPR * calm;
      x === 0 ? hctx.moveTo(x, y) : hctx.lineTo(x, y);
    }
    hctx.strokeStyle = 'rgba(255,90,95,.85)'; hctx.lineWidth = 1.6 * DPR;
    hctx.shadowColor = 'rgba(255,90,95,.6)'; hctx.shadowBlur = 6 * DPR; hctx.stroke();
  }

  const api = {
    setBeat(beat) {
      const i = ['t00','t07','t15','t38','t49','t60','close'].indexOf(beat.fx);
      if (i >= 0) setPhase(Math.min(i, markers.length - 1));
    },
    tick(t) {
      if (!ok && (ok = fitCanvas(cv))) {}
      if (!ok) return;
      W = cv.width; H = cv.height;
      ctx.clearRect(0, 0, W, H);
      const cx = W * car.x, cy = H * car.y;
      drawHeart(t);

      /* the two parties — left & right */
      const lx = W * .18, rx = W * .82, ly = H * .38;
      ctx.font = (30 * DPR) + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.globalAlpha = phase >= 0 ? 1 : .3;
      ctx.fillText('👤', lx, ly); ctx.fillText('👤', rx, ly);
      ctx.globalAlpha = 1;
      ctx.font = (9 * DPR) + 'px "Space Grotesk"'; ctx.fillStyle = 'rgba(244,241,232,.5)';
      ctx.fillText('BUYER · 1100 KM', lx, ly + 26 * DPR);
      ctx.fillText('SELLER', rx, ly + 26 * DPR);

      /* the car center */
      ctx.font = (44 * DPR) + 'px serif';
      if (phase >= 2 && phase < 4) {
        /* walkaround: orbit slightly */
        const a = t * .0012;
        ctx.fillText('🚗', cx + Math.cos(a) * 18 * DPR, cy + Math.sin(a) * 8 * DPR);
      } else {
        ctx.fillText('🚗', cx, cy);
      }

      /* phase 1: attestation handshake */
      if (phase === 1) {
        for (let i = 0; i < 2; i++) {
          const p = (t * .0016 + i * .5) % 1;
          const x = lx + (rx - lx) * p;
          glowDot(ctx, x, ly, 2.4 * DPR, PAL.cyan, 10);
          glowDot(ctx, rx - (rx - lx) * p, ly, 2.4 * DPR, PAL.violet, 10);
        }
        ctx.strokeStyle = 'rgba(68,237,247,.25)';
        ctx.setLineDash([4 * DPR, 6 * DPR]); ctx.lineWidth = 1.2 * DPR;
        ctx.beginPath(); ctx.moveTo(lx + 20 * DPR, ly); ctx.lineTo(rx - 20 * DPR, ly); ctx.stroke();
        ctx.setLineDash([]);
      }

      /* phase 2: light flash on paint */
      if (phase === 2 && Math.sin(t * .009) > .5) {
        ctx.fillStyle = 'rgba(68,237,247,.18)';
        ctx.beginPath(); ctx.ellipse(cx, cy + 8 * DPR, 60 * DPR, 20 * DPR, 0, 0, TAU); ctx.fill();
      }

      /* phase 3: chain welding */
      if (phase >= 3) {
        const targets = [[.42, .3], [.5, .26], [.58, .3], [.5, .62], [.44, .66], [.56, .66]];
        if (phase === 3) {
          const want = Math.min(targets.length, Math.floor((t - t0) / 500));
          while (chain.length < want) {
            chain.push({ p: 0, i: chain.length });
            sfx.blip();
          }
        } else chain.forEach(l => l.p = Math.min(1, l.p + .08));
        chain.forEach((l, i) => {
          const tx = W * targets[i][0], ty = H * targets[i][1];
          const p = E.out(l.p);
          const a = Math.atan2(ty - cy, tx - cx);
          const x = cx + Math.cos(a) * p * (tx - cx);
          const y = cy + Math.sin(a) * p * (ty - cy);
          line(ctx, cx, cy, x, y, 'rgba(143,168,255,.5)', 1);
          glowDot(ctx, x, y, 2.6 * DPR, PAL.violet, 8);
        });
      }

      /* phase 4: receipt stamp */
      if (phase >= 4) {
        const p = Math.min(1, (t - t0) / 900);
        ctx.save();
        ctx.translate(cx, cy - H * .16);
        ctx.scale(E.back(p), E.back(p));
        ctx.strokeStyle = PAL.gold; ctx.lineWidth = 2 * DPR;
        ctx.shadowColor = PAL.gold; ctx.shadowBlur = 18 * DPR;
        ctx.strokeRect(-46 * DPR, -16 * DPR, 92 * DPR, 32 * DPR);
        ctx.font = (10 * DPR) + 'px "Space Grotesk"'; ctx.fillStyle = PAL.gold;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('RECEIPT ✓', 0, 0);
        ctx.restore();
      }

      /* phase 5: money moves around, not through */
      if (phase >= 5) {
        const p = ((t * .0008) % 1);
        const arcY = ly - 70 * DPR;
        const mx = lx + (rx - lx) * p;
        const my = arcY + Math.sin(p * Math.PI) * -20 * DPR;
        glowDot(ctx, mx, my, 3.4 * DPR, PAL.gold, 14);
        ctx.strokeStyle = 'rgba(245,184,74,.3)';
        ctx.setLineDash([3 * DPR, 5 * DPR]);
        ctx.beginPath(); ctx.arc(W/2, arcY + 20*DPR, (rx-lx)/2, Math.PI, 0); ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  };
  return api;
};

/* ═══════════ 10 · SCENE · CH6 — THE FIVE & KAELITH ═══════════ */
SCENES.five = function (vis, ch) {
  const cv = el('canvas'); vis.appendChild(cv);
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, ok = fitCanvas(cv);
  let mode = 'question';
  let t0 = performance.now();
  const cities = [ [.18,.3,'MUMBAI'], [.32,.62,'DELHI'], [.5,.42,'DHAKA'], [.68,.3,'NAIROBI'], [.84,.55,'LONDON'] ];
  let glyphs = null;       // five distinct shapes
  let verdict = 0;
  let alarm = 0;           // capture alarm level
  const dom = [];

  function glyphShape(ctx, i, x, y, s, color, alpha) {
    ctx.save(); ctx.translate(x, y); ctx.globalAlpha = alpha;
    ctx.strokeStyle = color; ctx.lineWidth = 1.8 * DPR;
    ctx.shadowColor = color; ctx.shadowBlur = 10 * DPR;
    ctx.beginPath();
    if (i === 0) { ctx.arc(0, 0, s, 0, TAU); }
    if (i === 1) { ctx.moveTo(0, -s); ctx.lineTo(s, s); ctx.lineTo(-s, s); ctx.closePath(); }
    if (i === 2) { ctx.rect(-s * .8, -s * .8, s * 1.6, s * 1.6); }
    if (i === 3) { ctx.moveTo(0, -s); ctx.lineTo(s, 0); ctx.lineTo(0, s); ctx.lineTo(-s, 0); ctx.closePath(); }
    if (i === 4) { for (let k = 0; k < 5; k++) { const a = -Math.PI/2 + k * TAU/5;
      const X = Math.cos(a) * s, Y = Math.sin(a) * s;
      k ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); } ctx.closePath(); }
    ctx.stroke(); ctx.restore();
  }

  function buildLabels() {
    dom.forEach(d => d.remove()); dom.length = 0;
    cities.forEach(c => {
      const l = el('div', 'cl-plabel', c[2]);
      l.style.left = c[0] * 100 + '%'; l.style.top = (c[1] * 100 + 6) + '%';
      vis.appendChild(l); dom.push(l);
    });
  }
  buildLabels();

  const api = {
    setBeat(beat) {
      t0 = performance.now();
      const f = beat.fx;
      if (f === 'question') { mode = 'question'; dom.forEach(d => d.style.opacity = 0); }
      if (f === 'dispatch') { mode = 'dispatch'; }
      if (f === 'isolate') { mode = 'isolate';
        glyphs = [0,1,2,3,4].map(() => ({ p: 0, ang: rnd(0, TAU) })); verdict = 0; alarm = 0; }
      if (f === 'kaelith') { mode = 'kaelith'; }
      if (f === 'survive') { mode = 'survive'; }
      if (f === 'capture') { mode = 'capture'; alarm = 1; sfx.buzz(); }
    },
    tick(t) {
      if (!ok && (ok = fitCanvas(cv))) {}
      if (!ok) return;
      W = cv.width; H = cv.height;
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H * .48;

      /* world arc */
      ctx.strokeStyle = 'rgba(143,168,255,.14)'; ctx.lineWidth = 1 * DPR;
      ctx.beginPath(); ctx.ellipse(cx, H * .8, W * .42, H * .5, 0, Math.PI, 0); ctx.stroke();

      if (mode !== 'question') {
        dom.forEach((d, i) => d.style.opacity = mode === 'dispatch' && (t - t0) < (300 + i * 180) ? 0 : 1);
      }

      /* the five points */
      cities.forEach((c, i) => {
        const x = W * c[0], y = H * c[1];
        const active = mode !== 'question' && (mode !== 'dispatch' || (t - t0) > (300 + i * 180));
        if (!active) { glowDot(ctx, x, y, 2 * DPR, 'rgba(244,241,232,.3)', 6); return; }
        /* privacy shroud ring */
        ctx.strokeStyle = 'rgba(68,237,247,.35)';
        ctx.setLineDash([3 * DPR, 4 * DPR]); ctx.lineWidth = 1 * DPR;
        ctx.beginPath(); ctx.arc(x, y, 20 * DPR, t * .001 + i, t * .001 + i + TAU * .8); ctx.stroke();
        ctx.setLineDash([]);
        glowDot(ctx, x, y, 3 * DPR, PAL.cyan, 12);

        /* document fragments flow inward (isolate mode) */
        if (mode === 'isolate' || mode === 'kaelith' || mode === 'survive') {
          const p = ((t * .0006) + i * .2) % 1;
          const fx = cx + (x - cx) * (1 - p), fy = cy + (y - cy) * (1 - p);
          glowDot(ctx, fx, fy, 1.6 * DPR, 'rgba(244,241,232,.4)', 4);
        }

        /* returning glyph */
        if (glyphs && (mode === 'isolate' || mode === 'kaelith' || mode === 'survive' || mode === 'capture')) {
          glyphs[i].p = Math.min(1, glyphs[i].p + .01);
          const gp = E.out(glyphs[i].p);
          const gx = x + (cx - x) * gp, gy = y + (cy - y) * gp;
          const col = alarm ? PAL.red : PAL.violet;
          glyphShape(ctx, i, gx, gy, 7 * DPR, col, .8);
        }
      });

      /* Kaelith — the red adversary striking glyphs */
      if (mode === 'kaelith' || mode === 'survive' || mode === 'capture') {
        const kx = cx + Math.sin(t * .002) * W * .3, ky = cy - H * .2;
        glowDot(ctx, kx, ky, 6 * DPR, PAL.red, 26);
        ctx.font = (9 * DPR) + 'px "Space Grotesk"'; ctx.fillStyle = PAL.red; ctx.textAlign = 'center';
        ctx.fillText('KAELITH — ADVERSARY', kx, ky - 16 * DPR);
        /* strikes */
        const strike = Math.floor(t / 700) % 5;
        if (glyphs) {
          const c = cities[strike];
          const sx = c[0] * W + (cx - c[0] * W) * .5, sy = c[1] * H + (cy - c[1] * H) * .5;
          const p = (t % 700) / 700;
          line(ctx, kx, ky, sx, sy, 'rgba(255,90,95,' + (1 - p) * .7 + ')', 1.6);
        }
      }

      /* verdict crystallization */
      if (mode === 'survive') {
        verdict = Math.min(1, verdict + .008);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(t * .0003);
        ctx.strokeStyle = PAL.gold; ctx.lineWidth = 2 * DPR;
        ctx.shadowColor = PAL.gold; ctx.shadowBlur = 20 * DPR;
        const n = 5, R = 30 * DPR * E.back(verdict);
        ctx.beginPath();
        for (let k = 0; k <= n; k++) { const a = -Math.PI/2 + k * TAU / n * 2;
          const X = Math.cos(a) * R, Y = Math.sin(a) * R;
          k ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
        ctx.stroke();
        ctx.restore();
        if (verdict > .95) {
          ctx.font = (11 * DPR) + 'px "Space Grotesk"'; ctx.fillStyle = PAL.gold; ctx.textAlign = 'center';
          ctx.fillText('GOLDEN VERDICT · 87.5%', cx, cy + 52 * DPR);
        }
      }

      /* capture alarm — identical glyphs */
      if (mode === 'capture') {
        cities.forEach((c, i) => {
          if (glyphs) {
            const gx = c[0] * W + (cx - c[0] * W) * .55, gy = c[1] * H + (cy - c[1] * H) * .55;
            glyphShape(ctx, 0, gx, gy, 7 * DPR, PAL.red, .9);   // all SAME shape
          }
        });
        ctx.strokeStyle = 'rgba(255,90,95,' + (.4 + .3 * Math.sin(t * .01)) + ')';
        ctx.lineWidth = 2 * DPR;
        ctx.strokeRect(6 * DPR, 6 * DPR, W - 12 * DPR, H - 12 * DPR);
        ctx.font = (10 * DPR) + 'px "Space Grotesk"'; ctx.fillStyle = PAL.red; ctx.textAlign = 'center';
        ctx.fillText('⚠ IDENTICAL — COLLUSION ALARM', cx, 14 * DPR);
      }
    }
  };
  return api;
};

/* ═══════════ 11 · SCENE · CH7 — THE RECEIPT ═══════════ */
SCENES.receipt = function (vis, ch) {
  const cv = el('canvas'); vis.appendChild(cv);
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, ok = fitCanvas(cv);
  const layers = (ch.cfg && ch.cfg.layers) || ['MEDIA','SENSORS','CONSENSUS','ANCHOR','PQ'];
  let stage = 0;          // 0 idle → 1 assembling → layers..n → sweep → wall
  let layerP = 0;
  let rot = 0;
  let sweepP = 0;
  let wallP = 0;
  const dom = [];

  function buildLabels() {
    dom.forEach(d => d.remove()); dom.length = 0;
    layers.forEach((L, i) => {
      const l = el('div', 'cl-rlayer', L);
      l.style.top = (10 + i * 17) + '%';
      vis.appendChild(l); dom.push(l);
    });
    const dial = el('div', 'cl-dial', '⚙ 50 YEARS');
    dial.style.cssText = 'right:8%;bottom:12%';
    vis.appendChild(dial); dom.push(dial);
  }
  buildLabels();

  const api = {
    setBeat(beat) {
      const f = beat.fx;
      if (f === 'assemble-open') { stage = 1; layerP = 0; dom.forEach(d => d.style.opacity = 0); }
      const li = ['layer-media','layer-sensors','layer-consensus','layer-anchor','layer-pq'].indexOf(f);
      if (li >= 0) { stage = 2 + li; layerP = 0; sfx.blip();
        dom.forEach((d, i) => { if (i < li) d.style.opacity = .5; if (i === li) d.style.opacity = 1; }); }
      if (f === 'sweep') { stage = 7; sweepP = 0; sfx.chime(); }
      if (f === 'wall') { stage = 8; wallP = 0; }
    },
    tick(t) {
      if (!ok && (ok = fitCanvas(cv))) {}
      if (!ok) return;
      W = cv.width; H = cv.height;
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H * .5;
      rot += .003;

      const L = Math.max(0, Math.min(layers.length, stage - 1));
      if (stage >= 2) layerP = Math.min(1, layerP + .02);

      /* stacked glass sheets in 3D */
      for (let i = 0; i < L; i++) {
        const p = (i === L - 1) ? E.out(layerP) : 1;
        if (p <= 0) continue;
        const depth = (i - (layers.length - 1) / 2);
        const yOff = depth * 16 * DPR;
        const w = W * .5 * p, h = H * .34 * p;
        ctx.save();
        ctx.translate(cx, cy + yOff);
        ctx.transform(1, 0, -.28, 1, 0, 0);       // shear → 3D card look
        ctx.rotate(Math.sin(rot + i) * .04);
        ctx.strokeStyle = 'rgba(143,168,255,' + (.5 - i * .06) + ')';
        ctx.fillStyle = 'rgba(143,168,255,' + (.05 - i * .008) + ')';
        ctx.lineWidth = 1.4 * DPR;
        ctx.shadowColor = 'rgba(143,168,255,.4)'; ctx.shadowBlur = 12 * DPR;
        ctx.beginPath(); ctx.roundRect(-w/2, -h/2, w, h, 14 * DPR); ctx.fill(); ctx.stroke();
        /* layer index mark */
        ctx.shadowBlur = 0;
        ctx.font = (8 * DPR) + 'px "Space Grotesk"';
        ctx.fillStyle = 'rgba(244,241,232,.4)'; ctx.textAlign = 'center';
        ctx.fillText(layers[i], 0, 0);
        ctx.restore();
      }

      /* the serial number */
      if (stage >= 7) {
        ctx.font = (10 * DPR) + 'px monospace';
        ctx.fillStyle = PAL.cyan; ctx.textAlign = 'center';
        const serial = 'HAR-' + Math.floor(t / 100).toString(16).toUpperCase().padStart(8, '0');
        ctx.fillText(serial, cx, cy + H * .3);
      }

      /* verification sweep */
      if (stage === 7) {
        sweepP = Math.min(1, sweepP + .014);
        const sx = W * (.2 + .6 * sweepP);
        ctx.save();
        const grd = ctx.createLinearGradient(sx - 40 * DPR, 0, sx + 40 * DPR, 0);
        grd.addColorStop(0, 'rgba(68,237,247,0)');
        grd.addColorStop(.5, 'rgba(68,237,247,.35)');
        grd.addColorStop(1, 'rgba(68,237,247,0)');
        ctx.fillStyle = grd; ctx.fillRect(sx - 40 * DPR, H * .1, 80 * DPR, H * .8);
        ctx.restore();
        if (sweepP > .95) {
          ctx.font = (11 * DPR) + 'px "Space Grotesk"';
          ctx.fillStyle = PAL.cyan; ctx.textAlign = 'center';
          ctx.fillText('VALID · INDEPENDENTLY CHECKABLE', cx, H * .12);
        }
      }

      /* archive wall */
      if (stage === 8) {
        wallP = Math.min(1, wallP + .01);
        const n = Math.floor(wallP * 40);
        for (let i = 0; i < n; i++) {
          const gx = (i % 8) * (W / 8) + W / 16, gy = Math.floor(i / 8) * (H / 5) + H / 10;
          const s = 5 * DPR;
          ctx.save(); ctx.globalAlpha = .25;
          ctx.translate(gx, gy); ctx.transform(1, 0, -.28, 1, 0, 0);
          ctx.strokeStyle = 'rgba(143,168,255,.5)';
          ctx.strokeRect(-s * 2, -s * 1.2, s * 4, s * 2.4);
          ctx.restore();
        }
      }

      /* dial spin */
      const dial = dom[dom.length - 1];
      if (dial && stage >= 6) dial.style.opacity = 1;
    }
  };
  return api;
};

/* ═══════════ 12 · SCENE · CH8 — NOORISH, TWO LANES ═══════════ */
SCENES.lanes = function (vis, ch) {
  const cv = el('canvas'); vis.appendChild(cv);
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, ok = fitCanvas(cv);
  const currencies = (ch.cfg && ch.cfg.currencies) || ['₨','KSh','₹','AED'];
  let mode = 'meet';
  let t0 = performance.now();
  let cityScale = 1;
  const flow = { coins: [], payouts: [] };
  const dom = [];

  function buildLedger() {
    dom.forEach(d => d.remove()); dom.length = 0;
    const bar = el('div', 'cl-ledgerbar', '<span>70% · WITNESSES</span><i></i><span>PUBLICLY ATTESTED</span>');
    vis.appendChild(bar); dom.push(bar);
  }
  buildLedger();

  const api = {
    setBeat(beat) {
      t0 = performance.now();
      mode = { 'meet':'meet', 'use-lane':'use', 'earn-lane':'earn', 'both':'both',
               'multiply':'multiply', 'ledger':'ledger', 'close':'close' }[beat.fx] || mode;
      if (beat.fx === 'multiply') cityScale = 1;
      if (beat.fx === 'ledger') { dom[0].style.opacity = 1; }
    },
    tick(t) {
      if (!ok && (ok = fitCanvas(cv))) {}
      if (!ok) return;
      W = cv.width; H = cv.height;
      ctx.clearRect(0, 0, W, H);
      const age = (t - t0) / 1000;
      const cx = W / 2, cy = H * .5;

      /* Noorish center */
      ctx.font = (40 * DPR) + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('👩‍🎓', cx, cy);
      ctx.font = (9.5 * DPR) + 'px "Space Grotesk"'; ctx.fillStyle = 'rgba(244,241,232,.6)';
      ctx.fillText('NOORISH', cx, cy + 34 * DPR);

      /* the two lanes — bezier rivers */
      const laneY = H * .72;
      const drawLane = (dir, color, alpha) => {
        ctx.save(); ctx.globalAlpha = alpha;
        ctx.strokeStyle = color; ctx.lineWidth = 2 * DPR;
        ctx.shadowColor = color; ctx.shadowBlur = 8 * DPR;
        ctx.beginPath();
        ctx.moveTo(dir > 0 ? W * .06 : W * .94, laneY);
        ctx.bezierCurveTo(W * .3, laneY - 40 * DPR, W * .7, laneY - 40 * DPR, dir > 0 ? W * .94 : W * .06, laneY);
        ctx.stroke(); ctx.restore();
      };

      const showUse = mode !== 'meet';
      const showEarn = ['earn','both','multiply','ledger','close'].includes(mode);
      if (showUse) drawLane(1, PAL.cyan, mode === 'use' ? 1 : .4);
      if (showEarn) drawLane(-1, PAL.gold, mode === 'earn' ? 1 : .4);

      /* coins: Noorish → network (left lane, rightward) */
      if (showUse && Math.random() < .06) flow.coins.push({ p: 0 });
      flow.coins.forEach(c => c.p += .012);
      flow.coins = flow.coins.filter(c => c.p < 1);
      flow.coins.forEach(c => {
        const x = W * (.06 + .88 * c.p), y = laneY - Math.sin(c.p * Math.PI) * 40 * DPR;
        glowDot(ctx, x, y, 2.6 * DPR, PAL.cyan, 8);
      });

      /* payouts: network → Noorish (right lane, leftward) + currency morph */
      if (showEarn && Math.random() < .1) {
        flow.payouts.push({ p: 0, cur: currencies[Math.random() * currencies.length | 0] });
      }
      flow.payouts.forEach(c => c.p += .014);
      flow.payouts = flow.payouts.filter(c => c.p < 1);
      flow.payouts.forEach(c => {
        const x = W * (.94 - .88 * c.p), y = laneY - Math.sin((1 - c.p) * Math.PI) * 40 * DPR;
        ctx.font = (13 * DPR) + 'px "Space Grotesk"';
        ctx.fillStyle = PAL.gold; ctx.shadowColor = PAL.gold; ctx.shadowBlur = 8 * DPR;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(c.cur, x, y); ctx.shadowBlur = 0;
      });

      /* lane labels */
      ctx.font = (8.5 * DPR) + 'px "Space Grotesk"'; ctx.textAlign = 'center';
      if (showUse) { ctx.fillStyle = PAL.cyan;
        ctx.fillText('LANE 1 · USES THE NETWORK', W * .5, laneY + 18 * DPR); }
      if (showEarn) { ctx.fillStyle = PAL.gold;
        ctx.fillText('LANE 2 · POWERS THE NETWORK', W * .5, laneY + 32 * DPR); }

      /* multiply: pull back into a city of witnesses */
      if (mode === 'multiply' || mode === 'ledger' || mode === 'close') {
        cityScale = Math.min(24, cityScale + .25);
        const n = Math.min(24, Math.floor(cityScale));
        for (let i = 0; i < n; i++) {
          const a = i * 2.399963;           /* golden angle */
          const r = Math.sqrt(i) * 26 * DPR;
          const x = cx + Math.cos(a) * r, y = cy - 60 * DPR + Math.sin(a) * r * .6;
          ctx.globalAlpha = .8;
          ctx.font = (13 * DPR) + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('📱', x, y);
          ctx.globalAlpha = 1;
          glowDot(ctx, x + 5 * DPR, y - 8 * DPR, 1.2 * DPR, PAL.cyan, 6);
        }
      }
    }
  };
  return api;
};

/* ═══════════ 13 · CHAPTER TRANSITION ENGINE ═══════════ */
const transition = {
  to(ci) {
    if (busy || ci === curCh || ci < 0 || ci >= CL.chapters.length) return;
    busy = true; sfx.pad();
    const sceneEl = $('#clScene');
    const wipe = $('#clWipe');
    navMark(ci);

    gsapTimeline(() => {
      /* narration out */
      const items = $('#clNarr').children;
      for (const it of items) { it.style.transition = 'opacity .3s, transform .3s';
        it.style.opacity = 0; it.style.transform = 'translateY(-18px)'; }
      /* visual out */
      const vis = $('#clVisual');
      vis.style.transition = 'opacity .3s';
      vis.style.opacity = 0;
    }, 300, () => {
      /* wipe up */
      wipe.style.transformOrigin = 'bottom';
      wipe.style.transition = 'transform .38s cubic-bezier(.7,0,.3,1)';
      wipe.style.transform = 'scaleY(1)';
    }, 400, () => {
      /* swap scene */
      if (engine && engine.destroy) { try { engine.destroy(); } catch(e){} }
      engine = null;
      $('#clVisual').innerHTML = '';
      curCh = ci; curBeat = -1;
      sceneEl.classList.remove('active');
      sceneEl.classList.add('active');
      sceneEl.style.setProperty('--act-c', CL.acts[CL.chapters[ci].act].color);
    }, 60, () => {
      /* wipe down */
      wipe.style.transformOrigin = 'top';
      wipe.style.transition = 'transform .38s cubic-bezier(.7,0,.3,1)';
      wipe.style.transform = 'scaleY(0)';
      $('#clVisual').style.opacity = 1;
    }, 420, () => {
      showBeat(ci, 0);
      busy = false;
    });
  }
};

/* tiny sequencer (no external deps) */
function gsapTimeline() {
  const steps = [].slice.call(arguments);
  let i = 0;
  (function next() {
    if (i >= steps.length) return;
    const fn = steps[i], delay = steps[i + 1] || 0;
    if (typeof fn === 'function') { fn(); i += 2; setTimeout(next, delay); }
    else i++;
  })();
}

function navMark(ci) {
  const dots = $$('#clNav i');
  dots.forEach((d, i) => {
    d.className = i === ci ? 'on' : (i < ci ? 'seen' : '');
  });
}

/* ═══════════ 14 · BOOT (HALF A ends here — HALF B continues) ═══════════ */
window.CL_ENGINE_A = {
  CL, PAL, RM, TOUCH, DPR, px: () => px, py: () => py,
  $, $$, el, rnd, TAU, E, toast, sfx, fitCanvas, glowDot, line,
  SCENES, showBeat, fireScene, transition, navMark, splitWords,
  get curCh() { return curCh; }, get curBeat() { return curBeat; },
  set curCh(v) { curCh = v; }, set curBeat(v) { curBeat = v; },
  get busy() { return busy; }, set busy(v) { busy = v; },
  get engine() { return engine; }, set engine(v) { engine = v; }
};

})();
/* ═══════════════════════════════════════════════════════════════════
   chronolattice.js · HALF B (of 2) — scenes 9–16 · nav · boot
   APPENDED after Half A. Reads window.CL_ENGINE_A.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
'use strict';

/* roundRect polyfill (receipt scene) */
if (window.CanvasRenderingContext2D && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    this.moveTo(x + r, y); this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r); this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r); this.closePath(); return this;
  };
}

const A = window.CL_ENGINE_A;
if (!A) { console.error('ChronoLattice: Half A not found'); return; }
const CL = A.CL, PAL = A.PAL, RM = A.RM, DPR = A.DPR;
const $ = A.$, $$ = A.$$, el = A.el, rnd = A.rnd, TAU = A.TAU, E = A.E;
const sfx = A.sfx, toast = A.toast;
const SH = window.CL_SHARED || {};
const SC = A.SCENES;
const biOf = (beat, ch) => Math.max(0, ch.beats.indexOf(beat));

/* ═══ THE 70 WORLDS DATA (fallback-safe) ═══ */
const W_FALL = {
  core:["Protocol","Telecom","Legal","Manufacturing","Cyber","Veterans","Agriculture","Real Estate","Finance","Education","Logistics","Media","Energy","Spatial","IoT","Forensics","Health","Supreme"],
  everyday:["E-Commerce","Autos","Travel","Weddings","Blue-Collar","Dining","Electronics"],
  luxury:["Yachts","Private Jets","Fine Art","Hypercars","Watches","Bloodstock","Gems","Numismatics","Islands","Armored","Classic Cars","Handbags","Instruments","Antiquities","Falconry","Sneakers","Vintage"],
  industry:["Carbon","Litigation","Franchise","Machinery","MedEquip","Mining","Minerals","Timber","Water","Spectrum","DataCenter","Robotics","Rotor","Marine","Claims","Pharma","Estates","ModelIP","Hospitality","Overland","Secondaries","SolarFin","Livestock","Produce","Creator","Digital","Esports","Endowment"]};
const WDATA = (SH.WORLDS && SH.WORLDS.core && SH.WORLDS.core.length >= 18) ? SH.WORLDS : W_FALL;
const VERIFY = SH.WORLD_VERIFY || {
  "Protocol":"routes tasks · runs consensus","Telecom":"signal logs · tower zoning","Legal":"contracts · clause risk","Manufacturing":"CAD stress · supply chain","Cyber":"pen-tests · ransomware playbooks","Veterans":"service records · credentials","Agriculture":"yields · soil truth","Real Estate":"zoning · milestones · title","Finance":"DeFi audits · quant risk","Education":"theses · plagiarism · peer review","Logistics":"freight · carbon routing","Media":"IP timestamps · script originality","Energy":"grid stability · renewables","Spatial":"computer-vision precision","IoT":"sensor firmware security","Forensics":"deepfake detection · custody","Health":"credentials · billing integrity","Supreme":"cross-domain arbitration",
  "E-Commerce":"COD proof · returns","Autos":"chassis · odometer · presence","Travel":"hotel truth · escrow milestones","Weddings":"vendor milestones · no-show proof","Blue-Collar":"wage protection · gig proof","Dining":"hygiene · discount honoring","Electronics":"refurb grading",
  "Yachts":"hull · charter logs","Private Jets":"maintenance oracles","Fine Art":"provenance · brushstroke topology","Hypercars":"matching numbers · build sheets","Watches":"micro-spatial gear alignment","Bloodstock":"DNA lineage · vet history","Gems":"spectral signature · lab-grown detection","Numismatics":"acoustic ping · micro-wear","Islands":"title escrow · mandate proof","Armored":"ballistic-glass batch hashing","Classic Cars":"VIN metallurgy · restoration proof","Handbags":"stitch-count AI","Instruments":"wood-ring dating · acoustic print","Antiquities":"looted-art registry · erosion dating","Falconry":"microchip · vet hash","Sneakers":"sole-topology authentication","Vintage":"fabric & hardware provenance",
  "Carbon":"satellite + LiDAR ground truth","Litigation":"case risk","Franchise":"FDD · territory truth","Machinery":"engine-hour memory the metal keeps","MedEquip":"MRI/CT grading","Mining":"concessions · core samples","Minerals":"rare earths · dilution","Timber":"illegal-logging detection","Water":"rights · desalination contracts","Spectrum":"tower lease truth","DataCenter":"SLA · uptime audits","Robotics":"fleet condition","Rotor":"fatigue logs","Marine":"hull & engine logs","Claims":"verified signals to insurers","Pharma":"trial data integrity","Estates":"coffee/cacao origin","ModelIP":"AI weights provenance","Hospitality":"management contract audits","Overland":"RV condition","Secondaries":"PE NAV checks","SolarFin":"yield verification","Livestock":"ear-tag · health & weight","Produce":"grading at handover","Creator":"metric verification","Digital":"domain appraisal","Esports":"franchise · viewership audits","Endowment":"grant oversight"};

/* ═══ SCENE · CH9 — THE SEVENTY WORLDS ═══ */
SC.worlds = function (vis, ch) {
  const cv = el('canvas'); vis.appendChild(cv);
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, ok = A.fitCanvas(cv);
  const colors = (ch.cfg && ch.cfg.armColors) || { core:"#44EDF7", everyday:"#F5B84A", luxury:"#E0AAFF", industry:"#7FB8FF" };
  const arms = [
    { key:'core',      a:-Math.PI*0.25, label:'THE CORE EIGHTEEN' },
    { key:'everyday',  a:-Math.PI*0.75, label:'THE EVERYDAY SEVEN' },
    { key:'luxury',    a: Math.PI*0.75, label:'RARE VALUE · SEVENTEEN' },
    { key:'industry',  a: Math.PI*0.25, label:'INDUSTRY · TWENTY-EIGHT' }
  ];
  const worlds = [];
  arms.forEach((arm, ai) => {
    const list = WDATA[arm.key] || [];
    list.forEach((name, i) => {
      const t = list.length === 1 ? .5 : i / (list.length - 1);
      const r = .18 + t * .72, ja = arm.a + rnd(-.16, .16);
      worlds.push({ name, arm: ai, nx:.5 + Math.cos(ja) * r * .92, ny:.5 + Math.sin(ja) * r * .8,
        tw: rnd(0, TAU), a: 0, sz: arm.key==='core' ? 3.4 : 2.7, sx:0, sy:0 });
    });
  });
  let stage = -1, born = performance.now();
  let hover = -1;
  const tip = el('div', 'cl-worldtip');
  const armtags = arms.map((arm, i) => {
    const t = el('div', 'cl-armtag', arm.label);
    t.style.color = colors[arm.key];
    t.style.left = (50 + Math.cos(arm.a) * 62) + '%';
    t.style.top  = (50 + Math.sin(arm.a) * 56) + '%';
    t.style.transform = 'translate(-50%,-50%)';
    vis.appendChild(t); return t;
  });
  vis.appendChild(tip);
  const ghost = { x:.5, y:.5, tx:.5, ty:.5, t0:0, active:false };
  const seals = []; let sealedCount = 0;

  function onMove(e) {
    const r = cv.getBoundingClientRect();
    const mx = (e.clientX - r.left) * DPR, my = (e.clientY - r.top) * DPR;
    let best = -1, bd = 20 * DPR;
    for (let i = 0; i < worlds.length; i++) {
      const d = Math.hypot(worlds[i].sx - mx, worlds[i].sy - my);
      if (d < bd) { bd = d; best = i; }
    }
    hover = best;
    cv.style.cursor = best >= 0 ? 'pointer' : 'default';
    if (best >= 0 && stage >= 1) {
      const w = worlds[best];
      tip.innerHTML = '<b style="color:' + colors[arms[w.arm].key] + '">' + w.name + '</b><small>' + (VERIFY[w.name] || 'verified specialization') + '</small>';
      tip.style.left = (w.sx / DPR) + 'px'; tip.style.top = (w.sy / DPR) + 'px'; tip.style.opacity = 1;
    } else tip.style.opacity = 0;
  }
  cv.addEventListener('pointermove', onMove);
  cv.addEventListener('pointerleave', () => { hover = -1; tip.style.opacity = 0; });
  cv.addEventListener('click', () => { if (hover >= 0) { sfx.blip();
    toast(worlds[hover].name + ' — ' + (VERIFY[worlds[hover].name] || 'verified')); } });

  const api = {
    setBeat(beat, c) {
      const bi = biOf(beat, c); stage = bi; born = performance.now();
      armtags.forEach((t, i) => t.style.opacity = (bi >= 1 && bi <= 4 && i === bi - 1) ? 1 : 0);
      if (bi >= 6) { ghost.active = true; ghost.t0 = performance.now(); }
    },
    tick(t) {
      if (!ok && (ok = A.fitCanvas(cv))) {}
      if (!ok) return;
      W = cv.width; H = cv.height; ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H * .5;
      const hl = (stage >= 1 && stage <= 4) ? stage - 1 : -1;

      /* arm guide lines */
      arms.forEach((arm, i) => {
        ctx.strokeStyle = colors[arm.key] + (hl === i ? '55' : '18');
        ctx.lineWidth = (hl === i ? 1.6 : 1) * DPR;
        ctx.setLineDash([3 * DPR, 6 * DPR]);
        ctx.beginPath(); ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(arm.a) * W * .46, cy + Math.sin(arm.a) * H * .42);
        ctx.stroke(); ctx.setLineDash([]);
      });

      /* worlds */
      const spawn = Math.min(1, (t - born) / 900);
      worlds.forEach((w, i) => {
        let target = .25;
        if (hl >= 0) target = (w.arm === hl) ? 1 : .18;
        else if (stage >= 5) target = .8;
        w.a += (target - w.a) * .06;
        const ap = w.a * (stage < 0 ? spawn : E.out(spawn));
        const px2 = cx + (w.nx - .5) * W * .96 * E.out(spawn);
        const py2 = cy + (w.ny - .5) * H * .92 * E.out(spawn);
        w.sx = px2; w.sy = py2;
        const col = colors[arms[w.arm].key];
        const tw = .6 + .4 * Math.abs(Math.sin(t * .0016 + w.tw));
        A.glowDot(ctx, px2, py2, w.sz * DPR * (hover === i ? 1.7 : 1), col, (hover === i ? 20 : 9) * DPR * tw);
        /* names: highlighted arm or hover */
        if ((hl === w.arm && w.a > .7) || hover === i) {
          ctx.font = (8.6 * DPR) + 'px "Space Grotesk"';
          ctx.fillStyle = hover === i ? '#F4F1E8' : col;
          ctx.textAlign = 'center';
          ctx.fillText(w.name, px2, py2 - (w.sz + 5) * DPR);
        }
      });

      /* center hub */
      A.glowDot(ctx, cx, cy, 3 * DPR, '#F4F1E8', 12);
      ctx.font = (9 * DPR) + 'px "Space Grotesk"'; ctx.fillStyle = 'rgba(244,241,232,.6)';
      ctx.textAlign = 'center'; ctx.fillText('ONE NETWORK · SEVENTY WORLDS', cx, cy + 20 * DPR);

      /* exile ghost */
      if (ghost.active) {
        if (t - ghost.t0 > 850) {
          ghost.t0 = t; const target = worlds[Math.random() * worlds.length | 0];
          ghost.tx = target.sx; ghost.ty = target.sy;
          if (stage >= 6) { seals.push({ x: ghost.tx, y: ghost.ty, life: 1, col: colors[arms[target.arm].key] }); sealedCount++; sfx.blip(); }
        }
        const p = Math.min(1, (t - ghost.t0) / 850);
        ghost.x += ((ghost.tx / W || .5) - ghost.x) * p * .2;
        ghost.y += ((ghost.ty / H || .5) - ghost.y) * p * .2;
        const gx = ghost.x * W, gy = ghost.y * H;
        ctx.font = (22 * DPR) + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.shadowColor = PAL.red; ctx.shadowBlur = 14 * DPR;
        ctx.fillText('👾', gx, gy); ctx.shadowBlur = 0; ctx.textBaseline = 'alphabetic';
        /* arms sealing against it */
        if (stage >= 6) arms.forEach(arm => {
          ctx.strokeStyle = 'rgba(68,237,247,.22)';
          ctx.setLineDash([2 * DPR, 3 * DPR]);
          ctx.beginPath(); ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(arm.a) * W * .46, cy + Math.sin(arm.a) * H * .42);
          ctx.stroke(); ctx.setLineDash([]);
        });
      }
      for (let i = seals.length - 1; i >= 0; i--) {
        const s = seals[i]; s.life -= .012;
        if (s.life <= 0) { seals.splice(i, 1); continue; }
        ctx.strokeStyle = s.col; ctx.globalAlpha = s.life;
        ctx.lineWidth = 2 * DPR;
        ctx.beginPath(); ctx.arc(s.x, s.y, (1 - s.life) * 46 * DPR, 0, TAU); ctx.stroke();
        ctx.globalAlpha = 1;
      }
      if (stage >= 7) {
        ctx.font = (10 * DPR) + 'px "Space Grotesk"'; ctx.fillStyle = PAL.cyan; ctx.textAlign = 'center';
        ctx.fillText('FRAUD ANYWHERE — EXILE EVERYWHERE', cx, H * .94);
      }
    }
  };
  return api;
};

/* ═══ SCENE · CH10 — THE GIANTS' GLOBE ═══ */
SC.globe = function (vis, ch) {
  const cv = el('canvas'); vis.appendChild(cv);
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, ok = A.fitCanvas(cv);
  const CITY = { Karachi:[24.9,67.0], Lahore:[31.5,74.3], Dubai:[25.2,55.3],
    Texas:[31.0,-99.0], Michigan:[43.0,-84.5], Guangzhou:[23.1,113.3], Ohio:[40.0,-83.0] };
  const CORR = (ch.cfg && ch.cfg.corridors && ch.cfg.corridors.length) ? ch.cfg.corridors : [
    {from:'Karachi',to:'Lahore',vignette:'COD parcel glows green on delivery'},
    {from:'Dubai',to:'Dubai',vignette:'drone verifies the foundation pour'},
    {from:'Texas',to:'Michigan',vignette:'chassis plate scans · presence verified'},
    {from:'Guangzhou',to:'Ohio',vignette:'container seal hashes at both ends'}];
  let stage = 0;
  const toVec = (name) => { const c = CITY[name] || [0,0];
    const la = c[0] * Math.PI / 180, lo = c[1] * Math.PI / 180;
    return [Math.cos(la) * Math.cos(lo), Math.sin(la), Math.cos(la) * Math.sin(lo)]; };

  const api = {
    setBeat(beat, c) { stage = biOf(beat, c); },
    tick(t) {
      if (!ok && (ok = A.fitCanvas(cv))) {}
      if (!ok) return;
      W = cv.width; H = cv.height; ctx.clearRect(0, 0, W, H);
      const R = Math.min(W, H) * .36, cx = W / 2, cy = H * .48;
      const rot = t * .00022 + A.px() * .8;
      const rx = .38 + A.py() * .4;
      const CY = Math.cos(rot), SY = Math.sin(rot), CX = Math.cos(rx), SX = Math.sin(rx);
      const proj = (v) => { let x = v[0] * CY - v[2] * SY, z = v[0] * SY + v[2] * CY, y = v[1];
        let Y = y * CX - z * SX; z = y * SX + z * CX; y = Y;
        const s = R * (3.2 / (3.2 + z)); return [cx + x * s, cy - y * s, z]; };
      /* wireframe */
      for (let la = -60; la <= 60; la += 30) { ctx.beginPath(); let pen = false;
        for (let i = 0; i <= 48; i++) { const p = proj(toVec('Protocol') && [Math.cos(la*Math.PI/180)*Math.cos(i/48*TAU), Math.sin(la*Math.PI/180), Math.cos(la*Math.PI/180)*Math.sin(i/48*TAU)]);
          if (p[2] > -.05) { pen ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); pen = true; } else pen = false; }
        ctx.strokeStyle = 'rgba(143,168,255,.22)'; ctx.lineWidth = 1 * DPR; ctx.stroke(); }
      for (let lo = 0; lo < 180; lo += 30) { ctx.beginPath(); let pen = false;
        for (let i = 0; i <= 36; i++) { const la = -90 + i / 36 * 180;
          const p = proj([Math.cos(la*Math.PI/180)*Math.cos(lo*Math.PI/180), Math.sin(la*Math.PI/180), Math.cos(la*Math.PI/180)*Math.sin(lo*Math.PI/180)]);
          if (p[2] > -.05) { pen ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); pen = true; } else pen = false; }
        ctx.strokeStyle = 'rgba(143,168,255,.14)'; ctx.stroke(); }
      /* cities + corridors */
      CORR.forEach((c, ci) => {
        const act = stage >= ci + 1;
        const same = c.from === c.to;
        const A2 = toVec(c.from), B2 = toVec(c.to);
        const pa = proj(A2), pb = proj(B2);
        if (pa[2] > -.05) A.glowDot(ctx, pa[0], pa[1], (act ? 3.4 : 2.2) * DPR, act ? PAL.gold : 'rgba(244,241,232,.5)', act ? 14 : 6);
        if (!same && pb[2] > -.05) A.glowDot(ctx, pb[0], pb[1], (act ? 3.4 : 2.2) * DPR, act ? PAL.gold : 'rgba(244,241,232,.5)', act ? 14 : 6);
        if (!act || pa[2] <= -.05 || (!same && pb[2] <= -.05)) return;
        /* arc */
        const lift = .3, mid = [0,0,0];
        for (let k = 0; k < 3; k++) mid[k] = (A2[k] + B2[k]) / 2;
        const ml = Math.hypot(mid[0], mid[1], mid[2]) || 1;
        const ctrl = [mid[0]/ml*(1+lift), mid[1]/ml*(1+lift), mid[2]/ml*(1+lift)];
        ctx.beginPath(); let pen = false;
        for (let s = 0; s <= 30; s++) {
          const u = s / 30, iu = 1 - u;
          let v = [0,0,0];
          for (let k = 0; k < 3; k++) v[k] = iu*iu*A2[k] + 2*iu*u*ctrl[k] + u*u*B2[k];
          const p = proj(v);
          if (p[2] > -.1) { pen ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); pen = true; } else pen = false;
        }
        ctx.strokeStyle = 'rgba(245,184,74,' + (.55 + .25 * Math.sin(t * .004 + ci)) + ')';
        ctx.lineWidth = 1.8 * DPR; ctx.shadowColor = PAL.gold; ctx.shadowBlur = 8 * DPR;
        ctx.stroke(); ctx.shadowBlur = 0;
        /* travelling pulse */
        const u = (t * .0004 + ci * .25) % 1, iu = 1 - u;
        let v = [0,0,0]; for (let k = 0; k < 3; k++) v[k] = iu*iu*A2[k] + 2*iu*u*ctrl[k] + u*u*B2[k];
        const pp = proj(v);
        if (pp[2] > -.1) A.glowDot(ctx, pp[0], pp[1], 2.6 * DPR, PAL.cyan, 12);
        /* vignette label */
        const lx = (pa[0] + (same ? 0 : pb[0])) / 2, ly = (pa[1] + (same ? 0 : pb[1])) / 2 - 18 * DPR;
        ctx.font = (9 * DPR) + 'px "Space Grotesk"'; ctx.textAlign = 'center';
        ctx.fillStyle = PAL.gold; ctx.fillText(c.from.toUpperCase() + (same ? '' : ' ⇄ ' + c.to.toUpperCase()), lx, ly);
        ctx.fillStyle = 'rgba(68,237,247,.85)'; ctx.font = (8 * DPR) + 'px "Inter"';
        ctx.fillText(c.vignette, lx, ly + 12 * DPR);
      });
      /* finale: lattice */
      if (stage >= 5) {
        const pts = Object.keys(CITY).map(n => proj(toVec(n))).filter(p => p[2] > 0);
        ctx.strokeStyle = 'rgba(68,237,247,.18)'; ctx.lineWidth = .8 * DPR;
        for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
          ctx.beginPath(); ctx.moveTo(pts[i][0], pts[i][1]); ctx.lineTo(pts[j][0], pts[j][1]); ctx.stroke(); }
        ctx.font = (10 * DPR) + 'px "Space Grotesk"'; ctx.fillStyle = PAL.cyan; ctx.textAlign = 'center';
        ctx.fillText('ONE LAYER · EVERY RAIL', cx, H * .93);
      }
    }
  };
  return api;
};

/* ═══ SCENE · CH11 — THE GRID LIGHTS UP ═══ */
SC.grid = function (vis, ch) {
  const cv = el('canvas'); vis.appendChild(cv);
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, ok = A.fitCanvas(cv);
  const GATES = [['10','PAID JOBS'],['500','VERIFICATIONS'],['1,000','WITNESSES'],['70','WORLDS OPEN']];
  const clusters = [[.2,.78],[.45,.55],[.7,.38],[.9,.2]];
  const nodes = [];
  clusters.forEach((c, ci) => { const n = [4,6,7,7][ci];
    for (let i = 0; i < n; i++) nodes.push({ x:c[0]+rnd(-.07,.07), y:c[1]+rnd(-.09,.09), c:ci, lit:0 }); });
  let stage = 0;
  const meters = [], gates = [], pulses = [];
  let lastPulse = 0;
  GATES.forEach((g, i) => {
    const m = el('div', 'cl-meter',
      '<div class="cl-mnum">0</div><div class="cl-mlbl">PHASE ' + i + ' · ' + g[1] + '</div><div class="cl-mbar"><i></i></div>');
    m.style.cssText = 'left:5%;top:' + (14 + i * 20) + '%';
    const gate = el('div', 'cl-gate', 'GATE · ' + g[0] + ' ' + g[1].split(' ')[0]);
    gate.style.cssText = 'left:5%;top:' + (14 + i * 20 + 13) + '%';
    vis.append(m, gate); meters.push(m); gates.push(gate);
  });
  const api = {
    setBeat(beat, c) { stage = biOf(beat, c); },
    tick(t) {
      if (!ok && (ok = A.fitCanvas(cv))) {}
      if (!ok) return;
      W = cv.width; H = cv.height; ctx.clearRect(0, 0, W, H);
      /* links */
      ctx.strokeStyle = 'rgba(143,168,255,.14)'; ctx.lineWidth = 1 * DPR;
      clusters.forEach((c, i) => { if (i < clusters.length - 1) {
        ctx.beginPath(); ctx.moveTo(c[0]*W, c[1]*H);
        ctx.lineTo(clusters[i+1][0]*W, clusters[i+1][1]*H); ctx.stroke(); } });
      /* nodes */
      nodes.forEach(n => {
        const active = stage - 1 >= n.c;
        n.lit += ((active ? 1 : .12) - n.lit) * .05;
        const p = stage === 5 ? .7 + .3 * Math.abs(Math.sin(t * .003 + n.x * 9)) : 1;
        A.glowDot(ctx, n.x * W, n.y * H, (active ? 3 : 1.8) * DPR,
          active ? PAL.cyan : 'rgba(244,241,232,.4)', active ? 12 * p : 4);
      });
      /* meters + gates */
      meters.forEach((m, i) => {
        const active = stage - 1 >= i;
        m.style.opacity = stage >= 1 ? 1 : 0;
        const bar = m.querySelector('.cl-mbar i');
        const target = active ? 100 : 0;
        const cur = parseFloat(bar.style.width || 0);
        const nv = cur + (target - cur) * .04;
        bar.style.width = nv + '%';
        m.querySelector('.cl-mnum').textContent = active
          ? Math.round(parseInt(GATES[i][0].replace(',','')) * nv / 100).toLocaleString() : '0';
        gates[i].style.opacity = (stage - 1 > i || stage === 5) ? 1 : 0;
      });
      /* transaction pulses → meters */
      if (stage >= 1 && t - lastPulse > 260) {
        lastPulse = t;
        const c = Math.min(3, stage - 1);
        const src = nodes.filter(n => n.c === c);
        if (src.length) { const s = src[Math.random() * src.length | 0];
          pulses.push({ x:s.x*W, y:s.y*H, tx:W*.11, ty:H*(.14+c*.2+.03), p:0 }); }
      }
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p2 = pulses[i]; p2.p += .03;
        if (p2.p >= 1) { pulses.splice(i, 1); continue; }
        const x = p2.x + (p2.tx - p2.x) * E.io(p2.p), y = p2.y + (p2.ty - p2.y) * E.io(p2.p);
        A.glowDot(ctx, x, y, 2 * DPR, PAL.gold, 8);
      }
      if (stage === 5) { ctx.font = (10 * DPR) + 'px "Space Grotesk"';
        ctx.fillStyle = PAL.gold; ctx.textAlign = 'center';
        ctx.fillText('NO PHASE OPENS ON HOPE · EVERY GATE HAS A NUMBER', W * .55, H * .9); }
    }
  };
  return api;
};

/* ═══ SCENE · CH12 — THE PROMISE (money flow) ═══ */
SC.moneyflow = function (vis, ch) {
  const cv = el('canvas'); vis.appendChild(cv);
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, ok = A.fitCanvas(cv);
  let stage = 0, debris = null, leverDone = false;
  const tags = [];
  function tag(cls, txt, css) { const d = el('div', 'cl-vtag ' + cls, txt);
    d.style.cssText = css; vis.appendChild(d); tags.push(d); return d; }
  const tClient = tag('', 'CLIENT', 'left:6%;top:38%;transform:translateX(-50%)');
  const tMarket = tag('', 'MARKETPLACE', 'left:94%;top:38%;transform:translateX(-50%)');
  const tCore = tag('violet', 'HARMOS · PROOF ONLY', 'left:50%;top:72%;transform:translateX(-50%)');
  const tRailT = tag('gold', 'THEIR LICENSED RAIL', 'left:50%;top:6%;transform:translateX(-50%)');
  const tRailB = tag('gold', 'THEIR LICENSED RAIL', 'left:50%;top:92%;transform:translateX(-50%)');
  const tNeut = tag('gold', 'NEUTRALITY IS ARCHITECTURE', 'left:50%;top:84%;transform:translateX(-50%)');
  const lever = el('div', 'cl-lever'); lever.style.cssText = 'left:64%;top:40%';
  vis.appendChild(lever);
  [tClient, tMarket].forEach(t => t.style.opacity = 1);
  const api = {
    setBeat(beat, c) { stage = biOf(beat, c);
      tCore.style.opacity = stage >= 1 ? 1 : 0;
      tRailT.style.opacity = tRailB.style.opacity = stage >= 2 ? 1 : 0;
      if (stage >= 4 && !leverDone) { leverDone = true; lever.style.opacity = 1; sfx.buzz();
        setTimeout(() => { lever.style.transition = 'transform .6s cubic-bezier(.7,0,.3,1), opacity .6s';
          lever.style.transform = 'rotate(34deg) translate(26px,50px)'; lever.style.opacity = .1;
          debris = []; for (let i = 0; i < 14; i++) debris.push({ x:.64, y:.44, vx:rnd(-2,2), vy:rnd(-4,-1), r:rnd(0,TAU), s:rnd(2,5), life:1 });
          sfx.tone && sfx.tone(90,.4,'square',.08,40); }, 900); }
      tNeut.style.opacity = stage >= 5 ? 1 : 0;
    },
    tick(t) {
      if (!ok && (ok = A.fitCanvas(cv))) {}
      if (!ok) return;
      W = cv.width; H = cv.height; ctx.clearRect(0, 0, W, H);
      const lx = W * .12, rx = W * .88, cx = W * .5, cy = H * .5;
      /* parties */
      ctx.font = (30 * DPR) + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('👤', lx, cy); ctx.fillText('🏢', rx, cy); ctx.textBaseline = 'alphabetic';
      /* money arcs AROUND the core */
      const arcs = [[lx, cy, rx, cy, W*.5, H*.08], [rx, cy, lx, cy, W*.5, H*.92]];
      arcs.forEach((a, ai) => {
        ctx.strokeStyle = 'rgba(245,184,74,' + (stage >= 1 ? .4 : .15) + ')';
        ctx.lineWidth = 1.4 * DPR; ctx.setLineDash([4 * DPR, 7 * DPR]);
        ctx.beginPath(); ctx.moveTo(a[0], a[1]);
        ctx.quadraticCurveTo(a[4], a[5], a[2], a[3]); ctx.stroke(); ctx.setLineDash([]);
      });
      if (stage >= 1) for (let i = 0; i < 5; i++) {
        const u = (t * .00035 + i * .2) % 1;
        const ax = arcs[0], x = (1-u)*(1-u)*ax[0] + 2*(1-u)*u*ax[4] + u*u*ax[2];
        const y = (1-u)*(1-u)*ax[1] + 2*(1-u)*u*ax[5] + u*u*ax[3];
        A.glowDot(ctx, x, y, 3 * DPR, PAL.gold, 12);
        const bx = arcs[1], x2 = (1-u)*(1-u)*bx[0] + 2*(1-u)*u*bx[4] + u*u*bx[2];
        const y2 = (1-u)*(1-u)*bx[1] + 2*(1-u)*u*bx[5] + u*u*bx[3];
        A.glowDot(ctx, x2, y2, 3 * DPR, PAL.gold, 12);
      }
      /* core: hexagon + proof beam (the ONLY thing inside) */
      ctx.strokeStyle = 'rgba(143,168,255,.7)'; ctx.lineWidth = 1.8 * DPR;
      ctx.shadowColor = PAL.violet; ctx.shadowBlur = 14 * DPR;
      ctx.beginPath();
      for (let k = 0; k <= 6; k++) { const a = k * TAU / 6;
        const X = cx + Math.cos(a) * 34 * DPR, Y = cy + Math.sin(a) * 34 * DPR;
        k ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
      ctx.stroke(); ctx.shadowBlur = 0;
      const pulse = .5 + .5 * Math.sin(t * .006);
      A.line(ctx, W*.28, cy, W*.72, cy, 'rgba(68,237,247,' + (.35 + .45 * pulse) + ')', 2);
      A.glowDot(ctx, W*.28 + (W*.44) * ((t*.0006)%1), cy, 2.6*DPR, PAL.cyan, 12);
      /* "no client funds" zone marker */
      if (stage >= 1) { ctx.font = (8*DPR) + 'px "Space Grotesk"';
        ctx.fillStyle = 'rgba(255,90,95,.7)'; ctx.textAlign = 'center';
        ctx.fillText('✕ NO CLIENT FUNDS', cx, cy + 48 * DPR); }
      /* lever debris */
      if (debris) { debris.forEach(d => { d.life -= .008; d.vy += .12;
          d.x += d.vx * .004; d.y += d.vy * .004; d.r += .05;
          if (d.life <= 0) return;
          ctx.save(); ctx.translate(d.x * W, d.y * H); ctx.rotate(d.r);
          ctx.globalAlpha = d.life; ctx.fillStyle = '#3a3f55';
          ctx.fillRect(-d.s * DPR, -d.s * DPR / 2, d.s * 2 * DPR, d.s * DPR); ctx.restore(); });
        if (debris.every(d => d.life <= 0)) debris = null; }
    }
  };
  return api;
};

/* ═══ SCENE · CH13 — THE HONESTY LEDGER ═══ */
SC.honesty = function (vis, ch) {
  const cv = el('canvas'); vis.appendChild(cv);
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, ok = A.fitCanvas(cv);
  const ENTRIES = [
    'accuracy: published · quarterly · red-teamed',
    'hidden defects: physics cannot see',
    'coercion: no technology detects',
    'errors: refunded 3× the fee',
    'appeals: 2% — refunded if overturned',
    'duress PIN: always on · recovery in 72h',
    'our limits: published on our own homepage'];
  const STAGE_N = [2, 4, 5, 6, 7, 7];
  let stage = 0;
  const ledger = el('div', 'cl-hledger', '<h4>THE HONESTY LEDGER</h4><ul></ul>');
  vis.appendChild(ledger);
  const lis = ENTRIES.map(txt => { const li = el('li'); ledger.querySelector('ul').appendChild(li);
    li._full = txt; li._n = 0; li._t0 = 0; return li; });
  const comp = el('div', 'cl-competitor', '100% GUARANTEED ✨');
  comp.style.cssText = 'right:4%;top:12%';
  vis.appendChild(comp);
  let shattered = false, shards = null;
  const api = {
    setBeat(beat, c) { stage = Math.min(biOf(beat, c), 5);
      ledger.style.opacity = 1;
      if (stage >= 4 && comp.style.opacity !== '1') {
        comp.style.transition = 'transform .5s cubic-bezier(.2,.8,.2,1), opacity .5s';
        comp.style.opacity = 1; comp.style.transform = 'scale(1)';
        comp.style.transform = 'scale(0)'; requestAnimationFrame(() => requestAnimationFrame(() => {
          comp.style.transform = 'scale(1)'; })); }
      if (stage >= 5 && !shattered) { shattered = true; sfx.buzz();
        comp.style.transition = 'transform .5s, opacity .5s';
        comp.style.transform = 'rotate(-12deg) scale(1.25)'; comp.style.opacity = 0;
        shards = []; for (let i = 0; i < 12; i++) shards.push({ x:.86, y:.16, vx:rnd(-3,1), vy:rnd(-3,1), r:rnd(0,TAU), s:rnd(2,6), life:1 }); }
    },
    tick(t) {
      if (!ok && (ok = A.fitCanvas(cv))) {}
      if (!ok) return;
      W = cv.width; H = cv.height; ctx.clearRect(0, 0, W, H);
      /* typing entries */
      const want = STAGE_N[stage];
      lis.forEach((li, i) => {
        if (i < want) { if (!li._t0) li._t0 = t;
          li._n = Math.min(li._full.length, (t - li._t0) / 22);
          li.style.opacity = li._n > 0 ? 1 : 0;
          li.textContent = li._full.slice(0, Math.floor(li._n)); }
      });
      /* care ring around cold core (right side) */
      const cx = W * .74, cy = H * .55;
      const ringP = Math.max(0, Math.min(1, (stage - 2)));
      ctx.strokeStyle = 'rgba(245,184,74,.75)'; ctx.lineWidth = 2.2 * DPR;
      ctx.shadowColor = PAL.gold; ctx.shadowBlur = 12 * DPR;
      ctx.beginPath(); ctx.arc(cx, cy, 44 * DPR, -Math.PI/2, -Math.PI/2 + TAU * ringP); ctx.stroke();
      ctx.shadowBlur = 0;
      /* cold core */
      ctx.strokeStyle = 'rgba(68,237,247,.8)'; ctx.lineWidth = 1.6 * DPR;
      ctx.beginPath();
      for (let k = 0; k <= 6; k++) { const a = k * TAU / 6;
        const X = cx + Math.cos(a) * 16 * DPR, Y = cy + Math.sin(a) * 16 * DPR;
        k ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
      ctx.stroke();
      /* humans on the ring */
      if (ringP > .1) { ctx.font = (13 * DPR) + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        for (let i = 0; i < 6; i++) { const a = i * TAU / 6 - Math.PI/2;
          if (a + Math.PI/2 > TAU * ringP) break;
          ctx.fillText('👤', cx + Math.cos(a) * 44 * DPR, cy + Math.sin(a) * 44 * DPR); }
        ctx.textBaseline = 'alphabetic';
        ctx.font = (8.5 * DPR) + 'px "Space Grotesk"'; ctx.fillStyle = 'rgba(245,184,74,.8)';
        ctx.fillText('THE CARE LAYER — HUMANS HOLD THE MACHINE', cx, cy + 66 * DPR); }
      if (shards) { shards.forEach(s => { s.life -= .01; s.vy += .1; s.x += s.vx * .004; s.y += s.vy * .004;
          if (s.life <= 0) return;
          ctx.save(); ctx.translate(s.x * W, s.y * H); ctx.rotate(s.r);
          ctx.globalAlpha = s.life; ctx.fillStyle = PAL.red;
          ctx.fillRect(-s.s * DPR / 2, -s.s * DPR / 2, s.s * DPR, s.s * DPR); ctx.restore(); });
        if (shards.every(s => s.life <= 0)) shards = null; }
    }
  };
  return api;
};

/* ═══ SCENE · CH14 — THE QUANTUM MASK ═══ */
SC.quantummask = function (vis, ch) {
  const cv = el('canvas'); vis.appendChild(cv);
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, ok = A.fitCanvas(cv);
  let stage = 0, crackT = -1;
  const cracks = [], frags = [];
  const gen = el('div', 'cl-genlabel'); gen.style.cssText = 'left:22%;top:8%';
  vis.appendChild(gen);
  const GENS = ['GEN-1 · REPLAY', 'GEN-2 · DEEPFAKE', 'GEN-3 · THE QUANTUM MASK', '', ''];
  const api = {
    setBeat(beat, c) { stage = biOf(beat, c);
      gen.textContent = GENS[Math.min(stage, 4)] || '';
      gen.style.opacity = stage <= 2 ? 1 : 0;
      if (stage === 3 && crackT < 0) { crackT = 0; sfx.buzz();
        for (let i = 0; i < 9; i++) { const a = i * TAU / 9 + rnd(-.2,.2);
          cracks.push([a, rnd(.3,.9)]); }
        for (let i = 0; i < 12; i++) frags.push({ a: rnd(0,TAU), v: rnd(1,3), s: rnd(2,6), life: 1 }); }
    },
    tick(t) {
      if (!ok && (ok = A.fitCanvas(cv))) {}
      if (!ok) return;
      W = cv.width; H = cv.height; ctx.clearRect(0, 0, W, H);
      const rx = W * .74, ry = H * .5;
      /* the receipt — always present */
      ctx.save();
      ctx.strokeStyle = PAL.gold; ctx.lineWidth = 1.8 * DPR;
      ctx.shadowColor = PAL.gold; ctx.shadowBlur = (stage >= 3 ? 22 : 12) * DPR;
      ctx.translate(rx, ry); ctx.transform(1, 0, -.22, 1, 0, 0);
      ctx.strokeRect(-30 * DPR, -40 * DPR, 60 * DPR, 80 * DPR);
      ctx.shadowBlur = 0;
      ctx.font = (7.5 * DPR) + 'px "Space Grotesk"'; ctx.fillStyle = PAL.gold; ctx.textAlign = 'center';
      ctx.fillText('RECEIPT', 0, -26 * DPR);
      ctx.fillText('PQ-INK', 0, 30 * DPR);
      ctx.restore();
      /* lattice armor on receipt (stage>=3) */
      if (stage >= 3) {
        const lp = Math.min(1, (crackT >= 0 ? crackT : 0) / .8);
        ctx.save(); ctx.translate(rx, ry); ctx.transform(1, 0, -.22, 1, 0, 0);
        ctx.strokeStyle = 'rgba(68,237,247,' + (.2 + .4 * lp) + ')'; ctx.lineWidth = .8 * DPR;
        for (let i = -3; i <= 3; i++) { A.line(ctx, -30*DPR, i*11*DPR, 30*DPR, i*11*DPR, 'rgba(68,237,247,'+(.15+.35*lp)+')', .8);
          A.line(ctx, i*9*DPR, -40*DPR, i*9*DPR, 40*DPR, 'rgba(68,237,247,'+(.15+.35*lp)+')', .8); }
        ctx.restore();
        if (crackT >= 0) crackT += .016;
      }
      /* the mask */
      const mx0 = W * .26, my = H * .5;
      const lunge = stage >= 3 ? Math.min(1, (crackT >= 0 ? crackT : 0) / .6) : 0;
      const mx = mx0 + (rx - 46 * DPR - mx0) * lunge;
      const dead = stage >= 3 && crackT > .8;
      if (!dead) {
        ctx.save(); ctx.translate(mx, my);
        const shim = Math.sin(t * .008) * 3 * DPR;
        if (stage === 0) { /* film strip */
          ctx.strokeStyle = PAL.red; ctx.lineWidth = 1.6 * DPR;
          ctx.shadowColor = PAL.red; ctx.shadowBlur = 12 * DPR;
          ctx.strokeRect(-34*DPR, -22*DPR, 68*DPR, 44*DPR);
          for (let i = 0; i < 5; i++) ctx.fillRect(-30*DPR + i*14*DPR, -26*DPR, 6*DPR, 5*DPR),
            ctx.fillRect(-30*DPR + i*14*DPR, 21*DPR, 6*DPR, 5*DPR);
        } else if (stage === 1) { /* glitch face */
          ctx.strokeStyle = PAL.red; ctx.lineWidth = 1.6 * DPR;
          ctx.shadowColor = PAL.red; ctx.shadowBlur = 12 * DPR;
          ctx.beginPath(); ctx.arc(0, 0, 26*DPR, 0, TAU); ctx.stroke();
          ctx.beginPath(); ctx.arc(-8*DPR, -5*DPR, 3*DPR, 0, TAU); ctx.stroke();
          ctx.beginPath(); ctx.arc(8*DPR, -5*DPR, 3*DPR, 0, TAU); ctx.stroke();
          for (let i = 0; i < 3; i++) if (Math.sin(t*.02+i*3) > .3)
            ctx.fillRect(-26*DPR, rnd(-20,20)*DPR, 52*DPR, 2*DPR);
        } else { /* quantum mask */
          ctx.strokeStyle = 'rgba(255,90,95,.9)'; ctx.lineWidth = 1.8 * DPR;
          ctx.shadowColor = PAL.red; ctx.shadowBlur = 16 * DPR;
          ctx.beginPath();
          for (let k = 0; k <= 40; k++) { const a = k / 40 * TAU;
            const wob = 1 + .18 * Math.sin(a * 5 + t * .005) + .1 * Math.sin(a * 9 - t * .003);
            const X = Math.cos(a) * 30 * DPR * wob + shim, Y = Math.sin(a) * 34 * DPR * wob;
            k ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
          ctx.stroke();
          ctx.beginPath(); ctx.arc(-9*DPR, -6*DPR, 3.5*DPR, 0, TAU); ctx.stroke();
          ctx.beginPath(); ctx.arc(9*DPR, -6*DPR, 3.5*DPR, 0, TAU); ctx.stroke();
        }
        /* cracks while lunging */
        if (stage === 3 && crackT > .3) cracks.forEach(c => {
          A.line(ctx, 0, 0, Math.cos(c[0]) * 40 * c[1] * DPR, Math.sin(c[0]) * 40 * c[1] * DPR,
            'rgba(255,255,255,.7)', 1.2); });
        ctx.restore();
      }
      /* dispersed fragments */
      if (stage >= 3) frags.forEach(f => { if (f.life <= 0) return; f.life -= .01;
        const r = (1 - f.life) * 130 * DPR;
        ctx.save(); ctx.globalAlpha = f.life;
        ctx.translate(mx + Math.cos(f.a) * r, my + Math.sin(f.a) * r * .7); ctx.rotate(f.a * 3);
        ctx.fillStyle = 'rgba(255,90,95,.7)';
        ctx.fillRect(-f.s * DPR / 2, -f.s * DPR / 2, f.s * DPR, f.s * DPR); ctx.restore(); });
      if (stage >= 4) { ctx.font = (10 * DPR) + 'px "Space Grotesk"';
        ctx.fillStyle = PAL.cyan; ctx.textAlign = 'center';
        ctx.fillText('IMMUNE BY DESIGN — NOT BY PATCH', W / 2, H * .9); }
    }
  };
  return api;
};

/* ═══ SCENE · CH15 — THE VAULT + COUNTDOWN ═══ */
SC.vault = function (vis, ch) {
  const cv = el('canvas'); vis.appendChild(cv);
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, ok = A.fitCanvas(cv);
  let stage = 0;
  const panels = []; for (let i = 0; i < 7; i++) panels.push({ z: .3 + i * .38, ox: rnd(-.3,.3) });
  const YEARS = ['2031','2029','2027','2026'];
  let yrEl = el('div', 'cl-vaultyr', '2031');
  yrEl.style.cssText = 'left:50%;top:10%;transform:translateX(-50%)';
  vis.appendChild(yrEl);
  let yrIdx = 0, yrT = 0, zkT = -1, proven = false;
  let cdDom = null, cdIv = null;
  function buildCountdown() {
    cdDom = el('div', 'cl-count',
      '<div class="cl-cgrp"><div class="cl-cd" id="clCdD">000</div><span>DAYS</span></div><div class="cl-csep">:</div>' +
      '<div class="cl-cgrp"><div class="cl-cd" id="clCdH">00</div><span>HOURS</span></div><div class="cl-csep">:</div>' +
      '<div class="cl-cgrp"><div class="cl-cd" id="clCdM">00</div><span>MINUTES</span></div><div class="cl-csep">:</div>' +
      '<div class="cl-cgrp"><div class="cl-cd" id="clCdS">00</div><span>SECONDS</span></div>');
    vis.appendChild(cdDom);
    const LA = new Date(CL.countdownISO || '2027-06-22T00:00:00Z');
    const set = (id, v) => { const e = document.getElementById(id);
      if (e && e.textContent !== v) { e.textContent = v;
        e.style.transition = 'none'; e.style.transform = 'scale(1.18)'; e.style.opacity = .4;
        requestAnimationFrame(() => requestAnimationFrame(() => {
          e.style.transition = 'transform .45s cubic-bezier(.2,.8,.2,1), opacity .45s';
          e.style.transform = 'scale(1)'; e.style.opacity = 1; })); } };
    const tick = () => { let ms = Math.max(0, LA - Date.now());
      set('clCdD', String(Math.floor(ms / 864e5)).padStart(3, '0'));
      set('clCdH', String(Math.floor(ms / 36e5) % 24).padStart(2, '0'));
      set('clCdM', String(Math.floor(ms / 6e4) % 60).padStart(2, '0'));
      set('clCdS', String(Math.floor(ms / 1e3) % 60).padStart(2, '0')); };
    tick(); cdIv = setInterval(tick, 1000);
  }
  const api = {
    setBeat(beat, c) { stage = biOf(beat, c);
      if (stage >= 1) yrEl.style.opacity = 1;
      if (stage === 2) { zkT = 0; }
      if (stage >= 4 && !cdDom) { buildCountdown(); sfx.chime();
        yrEl.style.opacity = stage === 4 ? 0 : 1; }
    },
    destroy() { if (cdIv) clearInterval(cdIv); },
    tick(t) {
      if (!ok && (ok = A.fitCanvas(cv))) {}
      if (!ok) return;
      W = cv.width; H = cv.height; ctx.clearRect(0, 0, W, H);
      const vx = W * .5, vy = H * .42;
      /* corridor panels */
      panels.forEach(p => { p.z -= .0035; if (p.z < .18) { p.z += 2.6; p.ox = rnd(-.3,.3); }
        const s = 1 / p.z;
        const pw = 46 * s * DPR, ph = 60 * s * DPR;
        const x = vx + p.ox * W * .5 * s * .5, y = vy;
        ctx.strokeStyle = 'rgba(68,237,247,' + Math.min(.6, .1 + p.z * .3) + ')';
        ctx.lineWidth = 1.4 * DPR;
        ctx.strokeRect(x - pw/2, y - ph/2, pw, ph);
        if (s > 1.6) { ctx.font = (7.5 * DPR) + 'px "Space Grotesk"';
          ctx.fillStyle = 'rgba(68,237,247,.6)'; ctx.textAlign = 'center';
          ctx.fillText('VALID ✓', x, y); } });
      /* years travel */
      if (stage <= 1 && t - yrT > 900) { yrT = t;
        yrIdx = (yrIdx + 1) % YEARS.length; yrEl.textContent = YEARS[yrIdx];
        yrEl.style.transition = 'none'; yrEl.style.transform = 'translateX(-50%) scale(1.25)';
        requestAnimationFrame(() => requestAnimationFrame(() => {
          yrEl.style.transition = 'transform .5s cubic-bezier(.2,.8,.2,1)';
          yrEl.style.transform = 'translateX(-50%) scale(1)'; })); }
      if (stage >= 2) yrEl.style.opacity = 0;
      /* ZK cave */
      if (stage === 2) { zkT += .016;
        ctx.strokeStyle = 'rgba(143,168,255,.5)'; ctx.lineWidth = 3 * DPR;
        ctx.beginPath(); ctx.arc(vx, vy + 40*DPR, 70*DPR, Math.PI*.15, Math.PI*.85); ctx.stroke();
        const rounds = Math.min(3, Math.floor(zkT / 1.4));
        const u = Math.sin(zkT * 4.5);
        const wx = vx + u * 44 * DPR;
        A.glowDot(ctx, wx, vy + 6 * DPR, 4 * DPR, '#F4F1E8', 10);
        ctx.font = (8 * DPR) + 'px "Space Grotesk"'; ctx.textAlign = 'center';
        ctx.fillStyle = PAL.cyan;
        ctx.fillText('RETURN ' + (u > 0 ? 'RIGHT!' : 'LEFT!'), vx, vy - 60 * DPR);
        ctx.fillStyle = 'rgba(244,241,232,.5)';
        ctx.fillText('ROUND ' + Math.min(3, rounds + 1) + ' OF 3', vx, vy - 76 * DPR);
        if (zkT > 4.4 && !proven) { proven = true; sfx.chime(); }
        if (proven) { ctx.fillStyle = PAL.cyan; ctx.font = (10 * DPR) + 'px "Space Grotesk"';
          ctx.fillText('PROVEN — THE SECRET WAS NEVER SPOKEN', vx, H * .88); } }
      /* horizon cards */
      if (stage >= 3) {
        const cards = [['ZK PROOFS', 'TESTING · 2027', PAL.cyan], ['ZKML', 'HORIZON', PAL.violet], ['QUANTUM RNG', 'HORIZON', PAL.violet]];
        cards.forEach((c, i) => { const bob = Math.sin(t * .002 + i * 2) * 6 * DPR;
          const x = W * (.3 + i * .2), y = H * .2 + bob;
          ctx.strokeStyle = c[2]; ctx.lineWidth = 1.2 * DPR; ctx.globalAlpha = stage === 3 ? 1 : .4;
          ctx.strokeRect(x - 52*DPR, y - 14*DPR, 104*DPR, 28*DPR);
          ctx.font = (8.5*DPR) + 'px "Space Grotesk"'; ctx.textAlign = 'center';
          ctx.fillStyle = c[2]; ctx.fillText(c[0], x, y - 1*DPR);
          ctx.font = (6.5*DPR) + 'px "Inter"'; ctx.fillStyle = 'rgba(244,241,232,.6)';
          ctx.fillText(c[1], x, y + 9*DPR); ctx.globalAlpha = 1; });
      }
    }
  };
  return api;
};

/* ═══ SCENE · CH16 — THE FIRST COORDINATE IS YOURS ═══ */
SC.cta = function (vis, ch) {
  const cv = el('canvas'); vis.appendChild(cv);
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, ok = A.fitCanvas(cv);
  let stage = 0;
  let sealed = false;
  try { sealed = !!localStorage.getItem('cl_sealed'); } catch(e){}
  const oath = el('button', 'cl-oath' + (sealed ? ' lit' : ''),
    '<span class="cl-ofill"></span><span class="cl-olabel">' +
    (sealed ? 'SEALED ✓ — RETURNABLE FOREVER' : 'HOLD TO SEAL YOUR COORDINATE') + '</span>');
  oath.style.cssText = 'position:absolute;left:50%;bottom:4%;transform:translateX(-50%);opacity:0;z-index:6';
  oath.setAttribute('aria-label', 'Hold to seal');
  vis.appendChild(oath);
  const fill = oath.querySelector('.cl-ofill');
  const label = oath.querySelector('.cl-olabel');
  let holdRAF = null, holdStart = 0, hintT = 0, burst = null;

  function seal() {
    sealed = true;
    try { localStorage.setItem('cl_sealed', '1'); } catch(e){}
    oath.classList.add('lit');
    label.textContent = 'SEALED ✓ — RETURNABLE FOREVER';
    fill.style.width = '0%';
    sfx.chime(); sfx.tone && sfx.tone(1200, .8, 'sine', .08);
    toast('Sealed. Your coordinate — lit by you. Returnable forever.');
    burst = { t: 0 };
  }
  function startHold(e) { if (sealed) return; e.preventDefault();
    holdStart = performance.now();
    const step = (now) => { if (sealed) return;
      const p = Math.min(1, (now - holdStart) / 2200);
      fill.style.width = (p * 100) + '%';
      if (p >= 1) { seal(); return; }
      holdRAF = requestAnimationFrame(step); };
    holdRAF = requestAnimationFrame(step);
    const hb = setInterval(() => { if (!holdRAF || sealed) { clearInterval(hb); return; }
      sfx.tone(72, .13, 'sine', .1); }, 650);
  }
  function endHold() { if (sealed || !holdRAF) return;
    cancelAnimationFrame(holdRAF); holdRAF = null;
    fill.style.transition = 'width .3s'; fill.style.width = '0%';
    setTimeout(() => fill.style.transition = '', 320);
    const now = performance.now();
    if (now - hintT > 2200) { hintT = now; toast('Hold the full two seconds — seals need fire.'); } }
  oath.addEventListener('pointerdown', startHold);
  oath.addEventListener('pointerup', endHold);
  oath.addEventListener('pointerleave', endHold);
  oath.addEventListener('pointercancel', endHold);
  oath.addEventListener('contextmenu', e => e.preventDefault());

  const GLY = [];
  for (let i = 0; i < 16; i++) GLY.push({ a: i / 16 * TAU - Math.PI/2, tw: rnd(0, TAU) });

  const api = {
    setBeat(beat, c) { stage = biOf(beat, c);
      oath.style.opacity = stage >= 2 ? 1 : 0;
      oath.style.pointerEvents = stage >= 2 ? 'auto' : 'none'; },
    tick(t) {
      if (!ok && (ok = A.fitCanvas(cv))) {}
      if (!ok) return;
      W = cv.width; H = cv.height; ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H * .44;
      const R = Math.min(W, H) * .34;
      /* 16-chapter constellation ring */
      GLY.forEach((g, i) => {
        const x = cx + Math.cos(g.a) * R, y = cy + Math.sin(g.a) * R * .82;
        const tw = .35 + .35 * Math.abs(Math.sin(t * .0014 + g.tw));
        const focus = stage >= 1;
        ctx.globalAlpha = focus ? .25 : tw + .3;
        A.glowDot(ctx, x, y, (i === 15 ? 2.6 : 2) * DPR, i === 15 ? PAL.cyan : PAL.violet, 8);
        /* connector ring */
        const nx = cx + Math.cos(g.a + TAU/16) * R, ny = cy + Math.sin(g.a + TAU/16) * R * .82;
        A.line(ctx, x, y, nx, ny, 'rgba(143,168,255,.10)', .8);
        ctx.globalAlpha = 1;
      });
      /* THE coordinate */
      const lit = sealed || burst;
      const pulse = .6 + .4 * Math.sin(t * (sealed ? .004 : .0022));
      if (sealed) {
        A.glowDot(ctx, cx, cy, 5 * DPR * pulse, PAL.cyan, 30);
        A.glowDot(ctx, cx, cy, 26 * DPR * pulse, 'rgba(143,168,255,.18)', 46);
        for (let k = 0; k < 4; k++) { const a = t * .0006 + k * TAU / 4;
          A.line(ctx, cx, cy, cx + Math.cos(a) * 40 * DPR, cy + Math.sin(a) * 34 * DPR, 'rgba(68,237,247,.35)', 1); }
      } else {
        A.glowDot(ctx, cx, cy, 2.4 * DPR * pulse, 'rgba(244,241,232,.6)', 10);
      }
      if (burst) { burst.t += .02;
        ctx.strokeStyle = 'rgba(68,237,247,' + Math.max(0, 1 - burst.t) + ')';
        ctx.lineWidth = 2 * DPR;
        ctx.beginPath(); ctx.arc(cx, cy, burst.t * 90 * DPR, 0, TAU); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, burst.t * 140 * DPR, 0, TAU); ctx.strokeStyle = 'rgba(143,168,255,' + Math.max(0, .8 - burst.t) + ')'; ctx.stroke();
        if (burst.t > 1.4) burst = null; }
      if (stage >= 1 && !sealed) { ctx.font = (9 * DPR) + 'px "Space Grotesk"';
        ctx.fillStyle = 'rgba(244,241,232,.55)'; ctx.textAlign = 'center';
        ctx.fillText('THE NEXT COORDINATE — WAITING', cx, cy + 52 * DPR); }
    }
  };
  return api;
};

/* ═══ NAVIGATION (fixed chapter transition) ═══ */
function goTo(ci) {
  if (A.busy || ci === A.curCh || ci < 0 || ci >= CL.chapters.length) return;
  A.busy = true; sfx.pad(); A.navMark(ci);
  const narr = $('#clNarr'), vis = $('#clVisual'), wipe = $('#clWipe');
  narr.style.transition = 'opacity .26s'; narr.style.opacity = 0;
  vis.style.transition = 'opacity .26s'; vis.style.opacity = 0;
  setTimeout(() => {
    wipe.style.transformOrigin = 'bottom';
    wipe.style.transition = 'transform .36s cubic-bezier(.7,0,.3,1)';
    wipe.style.transform = 'scaleY(1)';
  }, 260);
  setTimeout(() => {
    if (A.engine && A.engine.destroy) { try { A.engine.destroy(); } catch(e){} }
    A.engine = null; vis.innerHTML = ''; A.curCh = ci; A.curBeat = -1;
  }, 640);
  setTimeout(() => {
    wipe.style.transformOrigin = 'top';
    wipe.style.transform = 'scaleY(0)';
    narr.style.opacity = 1; vis.style.opacity = 1;
  }, 700);
  setTimeout(() => { A.showBeat(ci, 0); A.busy = false; }, 1060);
}
A.transition.to = goTo;

function nextBeat() {
  if (A.busy) return;
  const ch = CL.chapters[A.curCh];
  if (A.curBeat < ch.beats.length - 1) { sfx.blip(); A.showBeat(A.curCh, A.curBeat + 1); }
  else if (A.curCh < CL.chapters.length - 1) goTo(A.curCh + 1);
  else toast('The film ends where you begin.');
}
function prevBeat() {
  if (A.busy) return;
  if (A.curBeat > 0) A.showBeat(A.curCh, A.curBeat - 1);
  else if (A.curCh > 0) goTo(A.curCh - 1);
}

/* ═══ AMBIENT CHRONOLATTICE BACKGROUND ═══ */
const atmo = (function () {
  const cv = document.getElementById('clAtmo'); if (!cv) return { tick(){}, fit(){} };
  const ctx = cv.getContext('2d');
  let W = 0, H = 0;
  const parts = []; for (let i = 0; i < 34; i++)
    parts.push({ x: Math.random(), y: Math.random(), r: rnd(.6, 1.8), vx: rnd(-.02,.02), vy: rnd(-.015,.01), ph: rnd(0,TAU), g: Math.random() > .7 });
  const pulses = [];
  function fit() { W = cv.width = Math.round(innerWidth * DPR); H = cv.height = Math.round(innerHeight * DPR); }
  fit();
  return {
    fit,
    tick(t) {
      if (!W) fit();
      ctx.clearRect(0, 0, W, H);
      /* drifting diagonal lattice — two layers */
      const o1 = (t * .006) % (70 * DPR), o2 = (-t * .004) % (90 * DPR);
      ctx.lineWidth = 1;
      for (let x = -H; x < W + H; x += 70 * DPR)
        A.line(ctx, x + o1, 0, x + o1 + H * .4, H, 'rgba(143,168,255,.045)', 1);
      for (let x = -H; x < W + H; x += 90 * DPR)
        A.line(ctx, x + o2 + H * .4, 0, x + o2, H, 'rgba(68,237,247,.035)', 1);
      /* particles */
      parts.forEach(p => { p.x += p.vx * .001; p.y += p.vy * .001;
        if (p.x < 0 || p.x > 1) p.vx *= -1; if (p.y < 0 || p.y > 1) p.vy *= -1;
        const a = .14 + .18 * Math.abs(Math.sin(t * .001 + p.ph));
        A.glowDot(ctx, p.x * W, p.y * H, p.r * DPR, p.g ? 'rgba(68,237,247,' + a + ')' : 'rgba(143,168,255,' + a + ')', 6); });
      /* occasional seal pulse */
      if (Math.random() < .004) pulses.push({ x: Math.random(), y: Math.random(), life: 1 });
      for (let i = pulses.length - 1; i >= 0; i--) { const p = pulses[i]; p.life -= .008;
        if (p.life <= 0) { pulses.splice(i, 1); continue; }
        ctx.strokeStyle = 'rgba(143,168,255,' + p.life * .25 + ')';
        ctx.lineWidth = 1.2 * DPR;
        ctx.beginPath(); ctx.arc(p.x * W, p.y * H, (1 - p.life) * 120 * DPR, 0, TAU); ctx.stroke(); }
    }
  };
})();

/* ═══ CURSOR ═══ */
const curD = document.getElementById('clCurd'), curR = document.getElementById('clCurr');
let cmx = innerWidth/2, cmy = innerHeight/2, crx = cmx, cry = cmy;
if (curD && !matchMedia('(pointer:coarse)').matches) {
  addEventListener('pointermove', e => { cmx = e.clientX; cmy = e.clientY;
    curD.style.transform = 'translate(' + (cmx-3) + 'px,' + (cmy-3) + 'px)'; }, { passive:true });
  document.addEventListener('pointerover', e => {
    document.body.classList.toggle('cl-hot', !!e.target.closest('button, a, .cl-nav i, .cl-bdots i'));
  });
}
function cursorTick() { if (!curR || matchMedia('(pointer:coarse)').matches) return;
  crx += (cmx - crx) * .16; cry += (cmy - cry) * .16;
  curR.style.transform = 'translate(' + (crx-17) + 'px,' + (cry-17) + 'px)'; }

/* ═══ MAIN LOOP ═══ */
(function loop(t) {
  requestAnimationFrame(loop);
  if (document.hidden) return;
  atmo.tick(t);
  const e = A.engine;
  if (e && e.tick) { try { e.tick(t); } catch(err) { console.warn('scene:', err.message); } }
  cursorTick();
})(0);

/* ═══ BINDINGS ═══ */
function buildNav() {
  const nav = document.getElementById('clNav'); if (!nav) return;
  nav.innerHTML = '';
  CL.chapters.forEach((ch, i) => {
    if (i > 0 && ch.act !== CL.chapters[i-1].act) nav.appendChild(el('span', 'cl-actsep'));
    const d = el('i');
    d.dataset.name = String(ch.n).padStart(2, '0') + ' · ' + ch.title;
    d.setAttribute('aria-label', ch.title);
    d.addEventListener('click', () => goTo(i));
    nav.appendChild(d);
  });
}
function bindAll() {
  const bp = document.getElementById('clBeatPrev'), bn = document.getElementById('clBeatNext');
  if (bp) bp.addEventListener('click', prevBeat);
  if (bn) bn.addEventListener('click', nextBeat);
  const np = document.getElementById('clPrev'), nx = document.getElementById('clNext');
  if (np) np.addEventListener('click', () => { if (A.curCh > 0) goTo(A.curCh - 1); });
  if (nx) nx.addEventListener('click', () => { if (A.curCh < CL.chapters.length - 1) goTo(A.curCh + 1); });
  document.addEventListener('keydown', e => {
    if (e.key === ' ' || e.key === 'Enter') { if (e.target.closest('button, input, textarea, select')) return; }
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); nextBeat(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); prevBeat(); }
    else if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault();
      if (A.curCh < CL.chapters.length - 1) goTo(A.curCh + 1); }
    else if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault();
      if (A.curCh > 0) goTo(A.curCh - 1); }
  });
  let sx = 0, sy = 0;
  document.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive:true });
  document.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) { dx < 0 ? nextBeat() : prevBeat(); }
    else if (Math.abs(dy) > 60) { dy < 0 ? (A.curCh < CL.chapters.length-1 && goTo(A.curCh+1)) : (A.curCh > 0 && goTo(A.curCh-1)); }
  }, { passive:true });
  const sb = document.getElementById('clSound');
  if (sb) sb.addEventListener('click', () => { sfx.init(); sfx.on = !sfx.on;
    sb.textContent = sfx.on ? '🔊' : '🔇'; sb.classList.toggle('on', sfx.on);
    if (sfx.on) sfx.chime(); });
  const logo = document.querySelector('.cl-logo');
  if (logo) logo.addEventListener('click', () => { if (A.curCh !== 0) goTo(0); });
  /* iOS audio unlock */
  document.addEventListener('pointerdown', () => sfx.init(), { once:true });
  /* chapter chip follows the title */
  const chip = document.getElementById('clChip');
  const upChip = () => { if (!chip) return;
    const n = (document.getElementById('clChNum') || {}).textContent || '01';
    const tt = (document.getElementById('clChTitle') || {}).textContent || '';
    chip.textContent = 'CHAPTER ' + n + ' · ' + tt.toUpperCase(); };
  const titleEl = document.getElementById('clChTitle');
  if (titleEl && chip) new MutationObserver(upChip).observe(titleEl, { childList: true });
  /* resize refit */
  let rzT;
  addEventListener('resize', () => { clearTimeout(rzT); rzT = setTimeout(() => {
    atmo.fit();
    $$('#clVisual canvas').forEach(c => { const r = c.getBoundingClientRect();
      if (r.width) { c.width = Math.round(r.width * DPR); c.height = Math.round(r.height * DPR); } });
  }, 160); });
}

/* ═══ BOOT ═══ */
function boot() {
  buildNav(); bindAll(); A.navMark(0);
  const pl = document.getElementById('clPreloader');
  const pct = document.getElementById('clpPct'), bar = document.getElementById('clpBar');
  const seen = (function(){ try { return sessionStorage.getItem('cl_seen'); } catch(e){ return null; } })();
  let p = 0;
  const iv = setInterval(() => {
    p = Math.min(100, p + (seen ? 22 : 8) + Math.random() * 6);
    if (pct) pct.textContent = Math.floor(p);
    if (bar) bar.style.width = p + '%';
    if (p >= 100) {
      clearInterval(iv);
      try { sessionStorage.setItem('cl_seen', '1'); } catch(e){}
      if (pl) { pl.style.opacity = 0; setTimeout(() => pl.remove(), 650); }
      setTimeout(() => A.showBeat(0, 0), 380);
    }
  }, seen ? 60 : 130);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

})();
