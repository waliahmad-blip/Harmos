/* ═══════════════════════════════════════════════════════════════════
   HARMOS FILM UPGRADE v1.0
   Glass transition · autoplay · 3D lattice scenes · zero emojis ·
   cursor magic everywhere · defensive canvas
   Loads AFTER chronolattice.js. Overrides 7 scenes, adds systems.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
'use strict';
if (window.CL_UPGRADE) return; window.CL_UPGRADE = true;
const A = window.CL_ENGINE_A; if (!A) { console.error('upgrade: engine A missing'); return; }
const CL = A.CL, PAL = A.PAL, DPR = A.DPR;
const $ = A.$, el = A.el, rnd = A.rnd, TAU = A.TAU, E = A.E;
const sfx = A.sfx, toast = A.toast, SC = A.SCENES;
const fit = A.fitCanvas, glow = A.glowDot, ln = A.line;
const PX = () => A.px(), PY = () => A.py();
const biOf = (b, c) => Math.max(0, c.beats.indexOf(b));
const TOUCH = matchMedia('(pointer:coarse)').matches;

/* ═══ 0 · DEFENSIVE CANVAS — negative radius can never throw again ═══ */
(function () {
  const P = CanvasRenderingContext2D.prototype;
  const _arc = P.arc;   P.arc   = function (x, y, r, a, b, c) { return _arc.call(this, x, y, Math.max(0, r || 0), a, b, c); };
  const _at  = P.arcTo; P.arcTo = function (x1, y1, x2, y2, r) { return _at.call(this, x1, y1, x2, y2, Math.max(0, r || 0)); };
  const _rg  = P.createRadialGradient;
  P.createRadialGradient = function (x0, y0, r0, x1, y1, r1) { return _rg.call(this, x0, y0, Math.max(0, r0 || 0), x1, y1, Math.max(0, r1 || 0)); };
  const _ep = P.ellipse; if (_ep) P.ellipse = function (x, y, rx, ry, rot, a, b, c) { return _ep.call(this, x, y, Math.max(0, rx || 0), Math.max(0, ry || 0), rot, a, b, c); };
})();

/* shared 3D helpers */
function rotP(p, CY, SY, CX, SX) {
  let x = p[0] * CY - p[2] * SY, z = p[0] * SY + p[2] * CY, y = p[1];
  let Y = y * CX - z * SX; z = y * SX + z * CX;
  return [x, Y, z];
}

/* ═══════════════════════════════════════════════════════════════════
   1 · CH1 — SYNTHETIC DAWN v2 · the 3D lattice + ghost frames
   Cursor dissolves fakes on contact. Light propagates at the finale.
   ═══════════════════════════════════════════════════════════════════ */
SC.swarm = function (vis, ch) {
  const cv = el('canvas'); vis.appendChild(cv);
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, ok = fit(cv);
  const N = 5, pts = [], edges = [], eDist = [];
  const id = (i, j, k) => (i * N + j) * N + k;
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) for (let k = 0; k < N; k++) {
    pts.push([(i - 2) * 1.35, (j - 2) * 1.35, (k - 2) * 1.35]);
    if (i < N - 1) edges.push([id(i, j, k), id(i + 1, j, k)]);
    if (j < N - 1) edges.push([id(i, j, k), id(i, j + 1, k)]);
    if (k < N - 1) edges.push([id(i, j, k), id(i, j, k + 1)]);
  }
  edges.forEach(e => { const a = pts[e[0]], b = pts[e[1]];
    eDist.push(Math.hypot((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2)); });

  let mode = 'void', t0 = performance.now(), realGlow = 0, lightR = 0;
  let stats = null; const chips = [];
  const fakes = [], parts = [];
  function spawnFake(burst) {
    const a = rnd(0, TAU), r = burst ? rnd(.2, 1.1) : rnd(2.1, 3.4);
    fakes.push({ x: Math.cos(a) * r, y: rnd(-2.2, 2.2), z: Math.sin(a) * r,
      sz: rnd(.5, 1.2), glitch: Math.random() < .45, corrupt: 0,
      spin: rnd(0, TAU), sp: rnd(.12, .45) * (Math.random() < .5 ? 1 : -1) });
  }
  for (let i = 0; i < 6; i++) spawnFake(false);
  let mx = -1e5, my = -1e5;
  cv.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect();
    mx = (e.clientX - r.left) * DPR; my = (e.clientY - r.top) * DPR; }, { passive: true });
  cv.addEventListener('pointerleave', () => { mx = my = -1e5; });

  function makeStats() {
    if (stats) stats.remove();
    stats = el('div'); vis.appendChild(stats);
    const defs = [
      { cls: 'cyan', n: 500000, p: '', s: '+', css: 'left:5%;top:11%', l: 'synthetic files / month — caught only' },
      { cls: '', n: 5, p: '$', s: 'T', css: 'left:50%;top:3%;transform:translateX(-50%)', l: 'lost to fraud every year' },
      { cls: 'gold', n: 30, p: '', s: '%', css: 'right:5%;bottom:15%', l: 'COD parcels refused — Pakistan' },
      { cls: '', n: 450000, p: '', s: '', css: 'left:7%;bottom:11%', l: 'rolled-back odometers — US, yearly' },
      { cls: '', n: 650, p: '$', s: 'M', css: 'right:7%;top:15%', l: 'lost to fake lovers — one year' }];
    defs.forEach((d, i) => {
      const c = el('div', 'cl-stat ' + d.cls, '<div class="cl-num"></div><div class="cl-lbl">' + d.l + '</div>');
      c.style.cssText = d.css; c.style.opacity = 0;
      stats.appendChild(c); chips[i] = c;
      const num = c.querySelector('.cl-num'), t1 = performance.now();
      (function step(now) { const p = Math.min(1, (now - t1) / 1500);
        num.textContent = d.p + Math.round(d.n * E.out(p)).toLocaleString() + d.s;
        if (p < 1) requestAnimationFrame(step); })(t1);
      setTimeout(() => { c.style.transition = 'opacity .5s, transform .5s'; c.style.opacity = 1; }, i * 130);
    });
  }

  const api = {
    setBeat(beat) {
      t0 = performance.now();
      const f = beat.fx;
      if (f === 'void-real') mode = 'void';
      if (f === 'fracture') { mode = 'fracture'; if (sfx.sub) sfx.sub();
        const want = Math.min(80, fakes.length * 3 + 14);
        while (fakes.length < want) spawnFake(true); }
      if (f === 'stat-flood') { mode = 'flood'; makeStats(); }
      const si = { 'stat-parcel': 2, 'stat-odo': 3, 'stat-heart': 4 }[f];
      if (si != null) chips.forEach((c, i) => { if (!c) return;
        c.style.opacity = i === si ? 1 : .16;
        c.style.transform = i === si ? 'scale(1.1)' : 'scale(1)'; });
      if (f === 'swarm-turn') { mode = 'turn'; if (stats) stats.style.opacity = 0; }
      if (f === 'real-pixel') { mode = 'real'; lightR = 0; sfx.chime(); }
    },
    tick(t) {
      if (!ok && (ok = fit(cv))) {} if (!ok) return;
      W = cv.width; H = cv.height; ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H * .48;
      const ry = t * .00016 + PX() * 1.1, rx = .5 + PY() * .55;
      const CY = Math.cos(ry), SY = Math.sin(ry), CX = Math.cos(rx), SX = Math.sin(rx);
      const base = Math.min(W, H) / 7.2, D = 7;
      const P = pts.map(p => { const r = rotP(p, CY, SY, CX, SX);
        const s = base * (D / (D + r[2]));
        return [cx + r[0] * s, cy + r[1] * s, r[2]]; });

      if (mode === 'real') { lightR = Math.min(4.8, lightR + .02); realGlow = Math.min(1, realGlow + .02); }

      /* lattice edges — light propagates from center in finale */
      edges.forEach((e, i) => {
        const a = P[e[0]], b = P[e[1]], d = eDist[i];
        let col = 'rgba(143,168,255,' + (.05 + .1 * (1 - (a[2] + 2) / 4)) + ')', lw = .9;
        if (mode === 'real' && d < lightR) { const k = 1 - d / Math.max(.001, lightR);
          col = 'rgba(68,237,247,' + (.22 + .5 * k) + ')'; lw = 1 + k * 1.6; }
        ctx.strokeStyle = col; ctx.lineWidth = lw * DPR;
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      });
      P.forEach(p => {
        const d = Math.hypot((p[0] - cx) / base, (p[1] - cy) / base);
        let r = 1.2, col = 'rgba(190,200,255,.38)';
        if (mode === 'real' && d < lightR) { r = 1.2 + (1 - d / lightR) * 2.2; col = 'rgba(120,248,255,.9)'; }
        glow(ctx, p[0], p[1], r * DPR, col, 6);
      });

      /* ghost frames — cursor dissolves them */
      const spd = (mode === 'flood' || mode === 'turn') ? 2.6 : 1;
      for (let i = fakes.length - 1; i >= 0; i--) {
        const f = fakes[i];
        const a = Math.atan2(f.z, f.x) + .0016 * f.sp * spd;
        const rr = Math.hypot(f.x, f.z);
        f.x = Math.cos(a) * rr; f.z = Math.sin(a) * rr;
        f.spin += .01 * f.sp * spd;
        const hs = f.sz / 2, cs = Math.cos(f.spin), sn = Math.sin(f.spin);
        const proj = [[-hs, -hs * 1.25], [hs, -hs * 1.25], [hs, hs * 1.25], [-hs, hs * 1.25]].map(c => {
          const wx = f.x + c[0] * cs, wy = f.y + c[1], wz = f.z + c[0] * sn;
          const r = rotP([wx, wy, wz], CY, SY, CX, SX), s = base * (D / (D + r[2]));
          return [cx + r[0] * s, cy + r[1] * s, r[2]];
        });
        const ccx = (proj[0][0] + proj[2][0]) / 2, ccy = (proj[0][1] + proj[2][1]) / 2;
        const pd = Math.hypot(ccx - mx, ccy - my);
        if (pd < 70 * DPR && mode !== 'void') f.corrupt += .045;
        if (mode === 'real' && Math.hypot(f.x, f.y, f.z) < lightR) f.corrupt += .03;
        if (f.corrupt >= 1) {
          for (let k = 0; k < 7; k++) parts.push({ x: ccx, y: ccy, vx: rnd(-2.6, 2.6), vy: rnd(-2.6, 2.6), life: 1 });
          fakes.splice(i, 1); if (sfx.on) sfx.blip(); continue;
        }
        const jit = f.corrupt * 3 * DPR;
        const fog = Math.max(.08, .5 * (1 - (proj[0][2] + 3.4) / 7));
        ctx.strokeStyle = 'rgba(232,228,216,' + (fog * (1 - f.corrupt * .4)) + ')';
        ctx.lineWidth = 1 * DPR;
        ctx.beginPath();
        proj.forEach((p2, k) => { const X = p2[0] + (jit ? rnd(-jit, jit) : 0), Y = p2[1] + (jit ? rnd(-jit, jit) : 0);
          k ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
        ctx.closePath(); ctx.stroke();
        ctx.globalAlpha = fog * .4;
        ctx.beginPath(); ctx.moveTo(proj[0][0], proj[0][1]); ctx.lineTo(proj[2][0], proj[2][1]); ctx.stroke();
        ctx.globalAlpha = 1;
        if (f.glitch && Math.sin(t * .02 + f.spin * 5) > .6) {
          ctx.strokeStyle = 'rgba(255,90,95,.8)'; ctx.lineWidth = 1.2 * DPR;
          const gy = (proj[0][1] + proj[3][1]) / 2 + rnd(-6, 6) * DPR;
          const x1 = Math.min(proj[0][0], proj[3][0]), x2 = Math.max(proj[1][0], proj[2][0]);
          ctx.beginPath(); ctx.moveTo(x1, gy); ctx.lineTo(x2, gy); ctx.stroke();
        }
      }

      /* the one real coordinate */
      const pulse = .7 + .3 * Math.sin(t * .004);
      glow(ctx, cx, cy, 3.2 * DPR * pulse, '#44EDF7', 22);
      if (realGlow > 0) glow(ctx, cx, cy, (18 + 12 * Math.sin(t * .002)) * DPR * realGlow, 'rgba(68,237,247,.15)', 44);

      /* dissolve particles */
      for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i];
        p.life -= .02; p.x += p.vx * DPR; p.y += p.vy * DPR;
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.life > .5 ? '#E8E4D8' : '#44EDF7';
        ctx.fillRect(p.x, p.y, 2.4 * DPR, 2.4 * DPR); ctx.globalAlpha = 1; }
    }
  };
  return api;
};

/* ═══════════════════════════════════════════════════════════════════
   2 · CH4 — THE FOUR SENSES v2 · holographic lattice core (no mango)
   ═══════════════════════════════════════════════════════════════════ */
SC.senses = function (vis, ch) {
  const cv = el('canvas'); vis.appendChild(cv);
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, ok = fit(cv);
  const guards = (ch.cfg && ch.cfg.guardians) || [];
  const RUNES = ['\u25C9', '\u224B', '\u2307', '\u2B22']; /* ◉ ≋ ⌇ ⬢ — glyphs, not emoji */
  let mode = 'intro', active = -1, objState = 'wait';
  let cube = null, parts = [];
  const dom = [];

  const SP = [];
  for (let i = 0; i < 64; i++) { const y = 1 - 2 * (i + .5) / 64, r = Math.sqrt(1 - y * y), a = i * 2.39996;
    SP.push([Math.cos(a) * r, y, Math.sin(a) * r]); }
  const RINGS = [0, 1, 2].map(ax => { const pts2 = [];
    for (let i = 0; i <= 40; i++) { const a = i / 40 * TAU, c = Math.cos(a), s = Math.sin(a);
      pts2.push(ax === 0 ? [c, s, 0] : ax === 1 ? [c, 0, s] : [0, c, s]); } return pts2; });

  function buildGuards() {
    dom.forEach(d => d.remove()); dom.length = 0;
    const pos = [[6, 8], [72, 8], [6, 72], [72, 72]];
    guards.forEach((g, i) => {
      const card = el('div', 'cl-guard',
        '<span class="cl-glyph" style="color:' + g.color + '">' + RUNES[i] + '</span>' + g.name +
        '<small>' + g.case + '</small>');
      card.style.cssText = 'left:' + pos[i][0] + '%;top:' + pos[i][1] + '%;color:' + g.color + ';opacity:0';
      vis.appendChild(card); dom.push(card);
    });
  }
  buildGuards();

  const api = {
    setBeat(beat) {
      const f = beat.fx;
      if (f === 'intro') { mode = 'intro'; dom.forEach(c => c.style.opacity = 0); objState = 'wait'; }
      const gi = { 'guardian-see': 0, 'guardian-hear': 1, 'guardian-feel': 2, 'guardian-swear': 3 }[f];
      if (gi != null) { mode = 'guardian'; active = gi; sfx.blip();
        dom.forEach((c, j) => { c.style.transition = 'opacity .5s, transform .5s';
          c.style.opacity = j === gi ? 1 : .28; }); }
      if (f.indexOf('case-') === 0) mode = 'case';
      if (f === 'converge') { mode = 'converge'; objState = 'charging'; if (sfx.pad) sfx.pad(); }
      if (f === 'shatter') { mode = 'shatter'; cube = { x: -60, y: 0, scan: 0, split: 0 };
        parts = []; sfx.buzz(); }
    },
    tick(t) {
      if (!ok && (ok = fit(cv))) {} if (!ok) return;
      W = cv.width; H = cv.height; ctx.clearRect(0, 0, W, H);
      const cx = W / 2 + PX() * 26 * DPR, cy = H * .5 + PY() * 18 * DPR;
      const R = Math.min(W, H) * .17;
      const ry = t * .0005 + PX() * .9, rx = .3 + PY() * .5;
      const CY = Math.cos(ry), SY = Math.sin(ry), CX = Math.cos(rx), SX = Math.sin(rx);
      const charge = objState === 'charging' ? (Math.sin(t * .01) * .5 + .5) : (objState === 'verified' ? 1 : 0);
      const col = charge > 0 ? 'rgba(68,237,247,' + (.5 + .5 * charge) + ')' : 'rgba(143,168,255,.55)';

      /* lattice sphere — points */
      SP.forEach(p => { const r = rotP(p, CY, SY, CX, SX);
        const x = cx + r[0] * R, y = cy + r[1] * R, z = r[2];
        const al = .25 + .45 * (z + 1) / 2 + charge * .3;
        glow(ctx, x, y, (1.2 + charge * 1.2) * DPR, 'rgba(120,200,255,' + al + ')', 6); });
      /* great circles */
      RINGS.forEach(ring => { ctx.beginPath(); let pen = false;
        ring.forEach(p => { const r = rotP(p, CY, SY, CX, SX);
          const x = cx + r[0] * R, y = cy + r[1] * R;
          pen ? ctx.lineTo(x, y) : ctx.moveTo(x, y); pen = true; });
        ctx.strokeStyle = col; ctx.lineWidth = 1.1 * DPR;
        if (objState === 'verified') { ctx.shadowColor = '#44EDF7'; ctx.shadowBlur = 14 * DPR; }
        ctx.stroke(); ctx.shadowBlur = 0; });
      /* core */
      glow(ctx, cx, cy, (3 + charge * 3) * DPR, objState === 'verified' ? '#44EDF7' : '#F4F1E8', objState === 'verified' ? 30 : 14);
      if (objState === 'verified') {
        const rp = (t % 1800) / 1800;
        ctx.strokeStyle = 'rgba(68,237,247,' + (1 - rp) * .7 + ')'; ctx.lineWidth = 1.6 * DPR;
        ctx.beginPath(); ctx.arc(cx, cy, R + rp * 60 * DPR, 0, TAU); ctx.stroke();
        ctx.fillStyle = '#44EDF7'; ctx.font = (9.5 * DPR) + 'px "Space Grotesk"'; ctx.textAlign = 'center';
        ctx.fillText('VERIFIED — IT ACTUALLY EXISTS', cx, cy + R + 26 * DPR);
      }
      /* guardian beams — bent by cursor */
      const corners = [[.08, .1], [.76, .1], [.08, .78], [.76, .78]];
      corners.forEach((c, i) => {
        const gx = W * c[0] + 60 * DPR, gy = H * c[1] + 40 * DPR;
        if (mode !== 'intro') {
          const al = mode === 'converge' || objState === 'verified' ? .5 : (active === i ? .45 : .1);
          const mxp = (gx + cx) / 2 + PX() * 60 * DPR, myp = (gy + cy) / 2 + PY() * 40 * DPR;
          ctx.strokeStyle = 'rgba(68,237,247,' + al + ')'; ctx.lineWidth = 1.2 * DPR;
          ctx.beginPath(); ctx.moveTo(gx, gy); ctx.quadraticCurveTo(mxp, myp, cx, cy); ctx.stroke();
        }
      });
      if (mode === 'converge' && Math.sin(t * .004) > .95 && objState !== 'verified') { objState = 'verified'; sfx.chime(); }

      /* case vignettes — abstract, per sense */
      if (mode === 'case' && active >= 0) {
        const label = ['THE FLASH', 'THE ECHO', 'THE TREMOR', 'THE KEY'][active];
        ctx.font = (10 * DPR) + 'px "Space Grotesk"'; ctx.fillStyle = 'rgba(244,241,232,.5)';
        ctx.textAlign = 'center'; ctx.fillText(label, W / 2, H * .1);
        if (active === 0) for (let i = 0; i < 3; i++) if (Math.sin(t * .008 + i * 2) > .4) {
          ctx.fillStyle = 'rgba(68,237,247,' + (.12 + .1 * Math.random()) + ')';
          ctx.fillRect(W * .25, H * (.3 + i * .12), W * .5, 8 * DPR); }
        if (active === 1) for (let i = 0; i < 3; i++) { const p = (t * .0012 + i * .33) % 1;
          ctx.strokeStyle = 'rgba(127,184,255,' + (1 - p) * .6 + ')'; ctx.lineWidth = 1.6 * DPR;
          ctx.beginPath(); ctx.arc(cx, cy + R + 30 * DPR, p * 60 * DPR, -.6, .6); ctx.stroke(); }
        if (active === 2) { ctx.beginPath();
          for (let x = 0; x <= W * .5; x += 4 * DPR) {
            const y = H * .86 + Math.sin(x * .05 + t * .02) * 10 * DPR * Math.sin(x / (W * .25) * Math.PI);
            const X = W * .25 + x; x === 0 ? ctx.moveTo(X, y) : ctx.lineTo(X, y); }
          ctx.strokeStyle = '#8FA8FF'; ctx.lineWidth = 1.6 * DPR;
          ctx.shadowColor = '#8FA8FF'; ctx.shadowBlur = 8 * DPR; ctx.stroke(); ctx.shadowBlur = 0; }
        if (active === 3) { ctx.save(); ctx.translate(cx, cy - R - 36 * DPR);
          ctx.strokeStyle = '#E0AAFF'; ctx.lineWidth = 1.8 * DPR;
          ctx.shadowColor = '#E0AAFF'; ctx.shadowBlur = 12 * DPR;
          const p = .5 + .5 * Math.sin(t * .003);
          ctx.beginPath(); ctx.arc(0, -8 * DPR, (7 + p * 2) * DPR, 0, TAU); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 18 * DPR);
          ctx.moveTo(0, 13 * DPR); ctx.lineTo(7 * DPR, 13 * DPR); ctx.stroke(); ctx.restore(); }
      }

      /* the forgery cube — scanned, split, shattered */
      if (cube) {
        cube.x += (W * .24 - cube.x) * .03;
        if (cube.x > W * .22 && cube.scan < 1) cube.scan += .02;
        if (cube.scan >= 1) cube.split += .02;
        const size = 22 * DPR;
        const split = Math.min(1, cube.split) * 14 * DPR;
        ctx.save(); ctx.translate(cube.x, cy);
        const drawHalf = off => { ctx.save(); ctx.translate(0, off);
          ctx.strokeStyle = 'rgba(255,90,95,.9)'; ctx.lineWidth = 1.4 * DPR;
          ctx.shadowColor = '#FF5A5F'; ctx.shadowBlur = 10 * DPR;
          ctx.strokeRect(-size, -size, size * 2, size * 2); ctx.restore(); };
        if (cube.split < 1) { drawHalf(-split); drawHalf(split); }
        if (cube.scan < 1 && cube.scan > 0) {
          const sx = -size + cube.scan * size * 2;
          ctx.strokeStyle = '#44EDF7'; ctx.lineWidth = 2 * DPR;
          ctx.shadowColor = '#44EDF7'; ctx.shadowBlur = 12 * DPR;
          ctx.beginPath(); ctx.moveTo(sx, -size * 1.4); ctx.lineTo(sx, size * 1.4); ctx.stroke(); ctx.shadowBlur = 0;
        }
        ctx.restore();
        if (cube.split >= 1) {
          if (parts.length === 0) for (let k = 0; k < 22; k++)
            parts.push({ x: cube.x, y: cy, vx: rnd(-3, 3), vy: rnd(-3, 3), life: 1 });
          cube = null;
        }
      }
      for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i];
        p.life -= .015; p.x += p.vx * DPR; p.y += p.vy * DPR;
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        ctx.globalAlpha = p.life; ctx.fillStyle = '#FF5A5F';
        ctx.fillRect(p.x, p.y, 2.6 * DPR, 2.6 * DPR); ctx.globalAlpha = 1; }
    }
  };
  return api;
};

/* ═══════════════════════════════════════════════════════════════════
   3 · CH5 — THE SIXTY-SECOND DEAL v2 · wireframe lattice car (no emoji)
   ═══════════════════════════════════════════════════════════════════ */
SC.deal60 = function (vis, ch) {
  const cv = el('canvas'); vis.appendChild(cv);
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, ok = fit(cv);
  const markers = (ch.cfg && ch.cfg.markers) || [];
  let phase = -1, t0 = performance.now();
  const chain = []; const dom = [];

  const PROF = [[-1.75, .15], [-1.8, .5], [-1.45, .58], [-1.05, .62], [-.62, 1.0], [.42, 1.05],
    [.85, .62], [1.55, .58], [1.82, .42], [1.85, .15], [1.55, .05], [-1.55, .05]];
  const WHEELS = [[-1.05, .05], [1.15, .05]];
  let flashEdges = [];

  function build() {
    dom.forEach(d => d.remove()); dom.length = 0;
    const bar = el('div', 'cl-timer', '<i id="clTimerFill"></i>');
    vis.appendChild(bar); dom.push(bar);
    markers.forEach((m, i) => {
      const mk = el('div', 'cl-tmarker', '<div class="cl-tl">' + m.label + '</div><div class="cl-tt">' + m.tag + '</div>');
      mk.style.left = (m.t / 60 * 92 + 4) + '%'; mk.style.opacity = 0; mk._i = i;
      vis.appendChild(mk); dom.push(mk);
    });
    const hb = el('canvas', 'cl-heart'); hb.id = 'clHeart';
    vis.appendChild(hb); dom.push(hb);
  }
  build();

  function setPhase(i) {
    phase = i; t0 = performance.now();
    dom.forEach(d => { if (d._i != null) d.style.opacity = d._i <= i ? 1 : 0; });
    const fill = document.getElementById('clTimerFill');
    if (fill) { fill.style.transition = 'width .8s cubic-bezier(.2,.8,.2,1)';
      fill.style.width = (markers[i] ? markers[i].t / 60 * 100 : 100) + '%'; }
    if (i === 3) chain.length = 0;
    if (i === 4) sfx.chime();
  }

  function drawHeart(t) {
    const hb = document.getElementById('clHeart'); if (!hb) return;
    const hctx = hb.getContext('2d');
    if (hb.width !== Math.round(hb.offsetWidth * DPR)) {
      hb.width = Math.round(hb.offsetWidth * DPR); hb.height = Math.round(hb.offsetHeight * DPR); }
    const w = hb.width, h = hb.height; hctx.clearRect(0, 0, w, h);
    const calm = phase >= 4 ? .12 : Math.max(.2, 1 - (phase + 1) / 5);
    hctx.beginPath();
    for (let x = 0; x <= w; x += 2) {
      const beat = Math.pow(Math.max(0, Math.sin(x * .04 + t * .004)), 6) * 13 * DPR * calm;
      const y = h / 2 - beat - Math.sin(x * .12 + t * .002) * 2 * DPR * calm;
      x === 0 ? hctx.moveTo(x, y) : hctx.lineTo(x, y);
    }
    hctx.strokeStyle = 'rgba(255,90,95,.85)'; hctx.lineWidth = 1.5 * DPR;
    hctx.shadowColor = 'rgba(255,90,95,.6)'; hctx.shadowBlur = 6 * DPR; hctx.stroke(); hctx.shadowBlur = 0;
  }

  function orb(x, y, color, label, attested, t) {
    glow(ctx, x, y, 5 * DPR, color, 14);
    ctx.strokeStyle = color; ctx.lineWidth = 1.2 * DPR;
    ctx.setLineDash([4 * DPR, 5 * DPR]);
    ctx.beginPath(); ctx.arc(x, y, 13 * DPR, t * .001, t * .001 + TAU); ctx.stroke();
    ctx.setLineDash([]);
    if (attested) { ctx.strokeStyle = 'rgba(68,237,247,.8)';
      ctx.beginPath(); ctx.arc(x, y, 19 * DPR, -t * .0008, -t * .0008 + TAU); ctx.stroke(); }
    ctx.font = (8.5 * DPR) + 'px "Space Grotesk"'; ctx.fillStyle = 'rgba(244,241,232,.55)';
    ctx.textAlign = 'center'; ctx.fillText(label, x, y + 34 * DPR);
  }

  const api = {
    setBeat(beat) {
      const i = ['t00', 't07', 't15', 't38', 't49', 't60', 'close'].indexOf(beat.fx);
      if (i >= 0) setPhase(Math.min(i, markers.length - 1));
    },
    tick(t) {
      if (!ok && (ok = fit(cv))) {} if (!ok) return;
      W = cv.width; H = cv.height; ctx.clearRect(0, 0, W, H);
      drawHeart(t);
      const cx = W * .5, cy = H * .55;
      const lx = W * .14, rx = W * .86, ly = H * .34;
      orb(lx, ly, '#F4F1E8', 'BUYER · 1100 KM', phase >= 1, t);
      orb(rx, ly, '#F4F1E8', 'SELLER', phase >= 1, t);

      /* wireframe lattice car */
      const walk = (phase === 2 || phase === 3);
      const a = t * (walk ? .0009 : .00016) + PX() * .8;
      const unit = Math.min(W, H) * .16;
      const CY = Math.cos(a), SY = Math.sin(a);
      const proj = (x, y, z) => {
        const X = x * CY - z * SY, Z = x * SY + z * CY;
        const s = 4.4 / (4.4 + Z);
        return [cx + X * unit * s, cy - (y - .5) * unit * s, Z, s];
      };
      if (phase >= 0) {
        if (walk && Math.floor(t / 300) !== Math.floor((t - 16) / 300))
          flashEdges = PROF.map((_, i) => Math.random() < .3);
        const drawProfile = (z, fi) => {
          ctx.beginPath(); let started = false;
          PROF.forEach((p, i) => { const P2 = proj(p[0], p[1], z);
            started ? ctx.lineTo(P2[0], P2[1]) : ctx.moveTo(P2[0], P2[1]); started = true; });
          ctx.closePath();
          const hot = fi && flashEdges[PROF.indexOf ? 0 : 0];
          ctx.strokeStyle = 'rgba(143,168,255,.7)'; ctx.lineWidth = 1.2 * DPR;
          ctx.stroke();
        };
        [-.55, .55].forEach(z => {
          ctx.beginPath(); let started = false;
          PROF.forEach(p => { const P2 = proj(p[0], p[1], z);
            started ? ctx.lineTo(P2[0], P2[1]) : ctx.moveTo(P2[0], P2[1]); started = true; });
          ctx.closePath();
          ctx.strokeStyle = 'rgba(143,168,255,.65)'; ctx.lineWidth = 1.1 * DPR;
          ctx.shadowColor = 'rgba(143,168,255,.4)'; ctx.shadowBlur = 5 * DPR;
          ctx.stroke(); ctx.shadowBlur = 0;
        });
        /* connect profiles */
        PROF.forEach((p, i) => { const A = proj(p[0], p[1], -.55), B = proj(p[0], p[1], .55);
          const hot = walk && flashEdges[i];
          ln(ctx, A[0], A[1], B[0], B[1], hot ? 'rgba(180,250,255,.95)' : 'rgba(143,168,255,.35)', hot ? 1.8 : .8);
          if (hot) glow(ctx, (A[0] + B[0]) / 2, (A[1] + B[1]) / 2, 2.4 * DPR, '#44EDF7', 10);
        });
        /* wheels */
        WHEELS.forEach(w => [-.55, .55].forEach(z => { const P2 = proj(w[0], w[1], z);
          ctx.strokeStyle = 'rgba(68,237,247,.6)'; ctx.lineWidth = 1.2 * DPR;
          ctx.beginPath(); ctx.arc(P2[0], P2[1], .26 * unit * P2[3], 0, TAU); ctx.stroke(); }));
        /* chassis glow floor */
        if (phase >= 4) { ctx.fillStyle = 'rgba(68,237,247,.07)';
          ctx.beginPath(); ctx.ellipse(cx, cy + unit * .55, unit * 2.2, unit * .3, 0, 0, TAU); ctx.fill(); }
      }

      /* :07 attestation handshake */
      if (phase === 1) {
        ctx.strokeStyle = 'rgba(68,237,247,.3)'; ctx.setLineDash([4 * DPR, 6 * DPR]);
        ctx.lineWidth = 1.1 * DPR;
        ctx.beginPath(); ctx.moveTo(lx + 24 * DPR, ly); ctx.lineTo(rx - 24 * DPR, ly); ctx.stroke();
        ctx.setLineDash([]);
        for (let i = 0; i < 2; i++) { const p = (t * .0016 + i * .5) % 1;
          glow(ctx, lx + (rx - lx) * p, ly, 2.2 * DPR, '#44EDF7', 10);
          glow(ctx, rx - (rx - lx) * p, ly, 2.2 * DPR, '#8FA8FF', 10); }
      }

      /* :38 chaining — links weld to car vertices */
      if (phase >= 3) {
        const want = phase === 3 ? Math.min(6, Math.floor((t - t0) / 420)) : 6;
        while (chain.length < want) { chain.push({ vi: chain.length, p: 0 }); if (sfx.on) sfx.blip(); }
        chain.forEach(l => l.p = Math.min(1, l.p + .06));
        chain.forEach(l => { const vi = l.vi % PROF.length;
          const A = proj(PROF[vi][0], PROF[vi][1], .55);
          const p = E.out(l.p);
          const x = lx + (A[0] - lx) * p, y = ly + (A[1] - ly) * p;
          ln(ctx, lx, ly, x, y, 'rgba(143,168,255,.5)', 1);
          glow(ctx, x, y, 2.2 * DPR, '#8FA8FF', 8);
          if (p >= 1) glow(ctx, A[0], A[1], 3 * DPR, '#44EDF7', 12);
        });
      }

      /* :49 receipt — glass card */
      if (phase >= 4) {
        const p = Math.min(1, (t - t0) / 900);
        ctx.save(); ctx.translate(cx, cy - unit * 1.7); ctx.scale(E.back(p), E.back(p));
        ctx.fillStyle = 'rgba(12,16,34,.72)'; ctx.strokeStyle = '#F5B84A';
        ctx.lineWidth = 1.6 * DPR; ctx.shadowColor = '#F5B84A'; ctx.shadowBlur = 16 * DPR;
        ctx.beginPath(); ctx.roundRect(-56 * DPR, -18 * DPR, 112 * DPR, 36 * DPR, 8 * DPR);
        ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
        ctx.font = (9.5 * DPR) + 'px "Space Grotesk"'; ctx.fillStyle = '#F5B84A';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('RECEIPT ✓ · PQ-SIGNED', 0, 0); ctx.textBaseline = 'alphabetic';
        /* corner brackets */
        [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(c => {
          const X = c[0] * 64 * DPR, Y = c[1] * 26 * DPR;
          ln(ctx, X, Y, X - c[0] * 10 * DPR, Y, '#F5B84A', 1.4);
          ln(ctx, X, Y, X, Y - c[1] * 8 * DPR, '#F5B84A', 1.4); });
        ctx.restore();
      }

      /* :60 money — around, never through */
      if (phase >= 5) {
        const p = (t * .0008) % 1;
        const ay = ly - 60 * DPR;
        const mx2 = lx + (rx - lx) * p, my2 = ay + Math.sin(p * Math.PI) * -22 * DPR;
        ctx.strokeStyle = 'rgba(245,184,74,.3)'; ctx.setLineDash([3 * DPR, 5 * DPR]);
        ctx.beginPath(); ctx.arc(W / 2, ay + 22 * DPR, (rx - lx) / 2, Math.PI, 0); ctx.stroke();
        ctx.setLineDash([]);
        glow(ctx, mx2, my2, 3.2 * DPR, '#F5B84A', 14);
      }
    }
  };
  return api;
};

/* ═══════════════════════════════════════════════════════════════════
   4 · CH8 — TWO LANES v2 · figure of light + glass panels (no emoji)
   ═══════════════════════════════════════════════════════════════════ */
SC.lanes = function (vis, ch) {
  const cv = el('canvas'); vis.appendChild(cv);
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, ok = fit(cv);
  const currencies = (ch.cfg && ch.cfg.currencies) || ['\u20A8', 'KSh', '\u20B9', 'AED'];
  let mode = 'meet', t0 = performance.now(), cityScale = 1;
  const coins = [], payouts = [], panels = [];
  const dom = [];
  const bar = el('div', 'cl-ledgerbar', '<span>70% · WITNESSES</span><i></i><span>PUBLICLY ATTESTED</span>');
  vis.appendChild(bar); dom.push(bar);

  function figure(x, y, s, t) {
    ctx.save();
    glow(ctx, x, y - s * .58, s * .1 * (.8 + .2 * Math.sin(t * .004)), '#F4F1E8', 16);
    ctx.strokeStyle = 'rgba(244,241,232,.85)'; ctx.lineWidth = 1.6 * DPR;
    ctx.beginPath(); ctx.arc(x, y - s * .3, s * .27, Math.PI * 1.12, Math.PI * 1.88); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - s * .17, y - s * .24);
    ctx.quadraticCurveTo(x - s * .2, y + s * .1, x - s * .1, y + s * .34); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + s * .17, y - s * .24);
    ctx.quadraticCurveTo(x + s * .2, y + s * .1, x + s * .1, y + s * .34); ctx.stroke();
    for (let i = 0; i < 3; i++) { const a = t * .001 + i * TAU / 3;
      glow(ctx, x + Math.cos(a) * s * .5, y - s * .1 + Math.sin(a) * s * .3, 1.6 * DPR, '#44EDF7', 8); }
    ctx.restore();
  }

  const api = {
    setBeat(beat) {
      t0 = performance.now();
      mode = { 'meet': 'meet', 'use-lane': 'use', 'earn-lane': 'earn', 'both': 'both',
        'multiply': 'multiply', 'ledger': 'ledger', 'close': 'close' }[beat.fx] || mode;
      if (beat.fx === 'multiply') cityScale = 1;
      if (beat.fx === 'ledger') dom[0].style.opacity = 1;
    },
    tick(t) {
      if (!ok && (ok = fit(cv))) {} if (!ok) return;
      W = cv.width; H = cv.height; ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H * .46;
      const laneY = H * .74;
      const ctrlX = W / 2 + PX() * W * .18;

      figure(cx, cy, Math.min(W, H) * .3, t);
      ctx.font = (9.5 * DPR) + 'px "Space Grotesk"'; ctx.fillStyle = 'rgba(244,241,232,.6)';
      ctx.textAlign = 'center'; ctx.fillText('NOORISH', cx, cy + Math.min(W, H) * .14);

      const showUse = mode !== 'meet';
      const showEarn = ['earn', 'both', 'multiply', 'ledger', 'close'].indexOf(mode) >= 0;
      const lane = (dir, color, alpha) => { ctx.save(); ctx.globalAlpha = alpha;
        ctx.strokeStyle = color; ctx.lineWidth = 2 * DPR;
        ctx.shadowColor = color; ctx.shadowBlur = 8 * DPR;
        ctx.beginPath();
        ctx.moveTo(dir > 0 ? W * .05 : W * .95, laneY);
        ctx.bezierCurveTo(ctrlX - W * .18, laneY - 44 * DPR, ctrlX + W * .18, laneY - 44 * DPR, dir > 0 ? W * .95 : W * .05, laneY);
        ctx.stroke(); ctx.restore(); };
      if (showUse) lane(1, '#44EDF7', mode === 'use' ? 1 : .4);
      if (showEarn) lane(-1, '#F5B84A', mode === 'earn' ? 1 : .4);

      if (showUse && Math.random() < .07) coins.push({ p: 0 });
      coins.forEach(c => c.p += .012);
      for (let i = coins.length - 1; i >= 0; i--) if (coins[i].p >= 1) coins.splice(i, 1);
      coins.forEach(c => { const x = W * (.05 + .9 * c.p);
        const y = laneY - Math.sin(c.p * Math.PI) * 44 * DPR;
        glow(ctx, x, y, 2.4 * DPR, '#44EDF7', 8); });

      if (showEarn && Math.random() < .11)
        payouts.push({ p: 0, cur: currencies[Math.random() * currencies.length | 0] });
      payouts.forEach(c => c.p += .014);
      for (let i = payouts.length - 1; i >= 0; i--) if (payouts[i].p >= 1) payouts.splice(i, 1);
      payouts.forEach(c => { const x = W * (.95 - .9 * c.p);
        const y = laneY - Math.sin((1 - c.p) * Math.PI) * 44 * DPR;
        ctx.font = (13 * DPR) + 'px "Space Grotesk"'; ctx.fillStyle = '#F5B84A';
        ctx.shadowColor = '#F5B84A'; ctx.shadowBlur = 8 * DPR;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(c.cur, x, y); ctx.shadowBlur = 0; ctx.textBaseline = 'alphabetic'; });

      ctx.font = (8.5 * DPR) + 'px "Space Grotesk"'; ctx.textAlign = 'center';
      if (showUse) { ctx.fillStyle = '#44EDF7'; ctx.fillText('LANE 1 · USES THE NETWORK', W * .5, laneY + 16 * DPR); }
      if (showEarn) { ctx.fillStyle = '#F5B84A'; ctx.fillText('LANE 2 · POWERS THE NETWORK', W * .5, laneY + 30 * DPR); }

      /* multiply — glass witness panels spiral out (no phone emoji) */
      if (['multiply', 'ledger', 'close'].indexOf(mode) >= 0) {
        cityScale = Math.min(26, cityScale + .3);
        const n = Math.min(26, Math.floor(cityScale));
        while (panels.length < n) panels.push({ i: panels.length, bob: rnd(0, TAU) });
        panels.forEach(p => { const a = p.i * 2.39996;
          const r = Math.sqrt(p.i + 1) * Math.min(W, H) * .052;
          const x = cx + Math.cos(a) * r, y = cy - Math.min(W, H) * .18 + Math.sin(a) * r * .62;
          const bob = Math.sin(t * .0016 + p.bob) * 4 * DPR;
          ctx.save(); ctx.translate(x, y + bob); ctx.rotate(Math.sin(t * .0008 + p.i) * .12);
          const w = 15 * DPR, h = 26 * DPR;
          ctx.fillStyle = 'rgba(143,168,255,.08)'; ctx.strokeStyle = 'rgba(143,168,255,.55)';
          ctx.lineWidth = 1 * DPR;
          ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 3 * DPR); ctx.fill(); ctx.stroke();
          ln(ctx, -w / 2 + 3 * DPR, -h / 4, w / 2 - 3 * DPR, -h / 4, 'rgba(68,237,247,.35)', .7);
          ln(ctx, -w / 2 + 3 * DPR, 0, w / 2 - 3 * DPR, 0, 'rgba(68,237,247,.35)', .7);
          glow(ctx, 0, h / 2 - 4 * DPR, 1.4 * DPR, '#44EDF7', 6);
          ctx.restore(); });
      }
    }
  };
  return api;
};

/* ═══════════════════════════════════════════════════════════════════
   5 · CH9 — SEVENTY WORLDS v2 · null-mass ghost + proximity glow
   ═══════════════════════════════════════════════════════════════════ */
SC.worlds = function (vis, ch) {
  const cv = el('canvas'); vis.appendChild(cv);
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, ok = fit(cv);
  const colors = { core: '#44EDF7', everyday: '#F5B84A', luxury: '#E0AAFF', industry: '#7FB8FF' };
  const SH = window.CL_SHARED || {};
  const WDATA = (SH.WORLDS && SH.WORLDS.core && SH.WORLDS.core.length >= 18) ? SH.WORLDS : {
    core: 'Protocol,Telecom,Legal,Manufacturing,Cyber,Veterans,Agriculture,Real Estate,Finance,Education,Logistics,Media,Energy,Spatial,IoT,Forensics,Health,Supreme'.split(','),
    everyday: 'E-Commerce,Autos,Travel,Weddings,Blue-Collar,Dining,Electronics'.split(','),
    luxury: 'Yachts,Private Jets,Fine Art,Hypercars,Watches,Bloodstock,Gems,Numismatics,Islands,Armored,Classic Cars,Handbags,Instruments,Antiquities,Falconry,Sneakers,Vintage'.split(','),
    industry: 'Carbon,Litigation,Franchise,Machinery,MedEquip,Mining,Minerals,Timber,Water,Spectrum,DataCenter,Robotics,Rotor,Marine,Claims,Pharma,Estates,ModelIP,Hospitality,Overland,Secondaries,SolarFin,Livestock,Produce,Creator,Digital,Esports,Endowment'.split(',') };
  const VERIFY = SH.WORLD_VERIFY || {};
  const VGEN = { core: 'civilization-grade verification', everyday: 'daily deals, proven',
    luxury: 'provenance that cannot be forged', industry: 'documents that move millions, sealed' };
  const arms = [
    { key: 'core', a: -Math.PI * .25, label: 'THE CORE EIGHTEEN' },
    { key: 'everyday', a: -Math.PI * .75, label: 'EVERYDAY MARKETS' },
    { key: 'luxury', a: Math.PI * .75, label: 'RARE VALUE · XVII' },
    { key: 'industry', a: Math.PI * .25, label: 'INDUSTRY CORRIDORS' }];
  const worlds = [];
  arms.forEach((arm, ai) => { const list = WDATA[arm.key] || [];
    list.forEach((name, i) => { const tt = list.length === 1 ? .5 : i / (list.length - 1);
      const r = .18 + tt * .72, ja = arm.a + rnd(-.15, .15);
      worlds.push({ name, arm: ai, nx: .5 + Math.cos(ja) * r * .94, ny: .5 + Math.sin(ja) * r * .8,
        tw: rnd(0, TAU), a: 0, sz: arm.key === 'core' ? 3.2 : 2.6, sx: 0, sy: 0 }); }); });
  let stage = -1, born = performance.now(), hover = -1, pmx = -1e5, pmy = -1e5;
  const tip = el('div', 'cl-worldtip');
  const armtags = arms.map((arm, i) => { const t2 = el('div', 'cl-armtag', arm.label);
    t2.style.color = colors[arm.key];
    t2.style.left = (50 + Math.cos(arm.a) * 60) + '%'; t2.style.top = (50 + Math.sin(arm.a) * 54) + '%';
    t2.style.transform = 'translate(-50%,-50%)'; vis.appendChild(t2); return t2; });
  vis.appendChild(tip);
  const ghost = { x: .5, y: .5, tx: 0, ty: 0, t0: 0, active: false };
  const seals = [];
  cv.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect();
    pmx = (e.clientX - r.left) * DPR; pmy = (e.clientY - r.top) * DPR;
    let best = -1, bd = 20 * DPR;
    for (let i = 0; i < worlds.length; i++) { const d = Math.hypot(worlds[i].sx - pmx, worlds[i].sy - pmy);
      if (d < bd) { bd = d; best = i; } }
    hover = best; cv.style.cursor = best >= 0 ? 'pointer' : 'default';
    if (best >= 0 && stage >= 1) { const w = worlds[best];
      tip.innerHTML = '<b style="color:' + colors[arms[w.arm].key] + '">' + w.name + '</b><small>' +
        (VERIFY[w.name] || VGEN[arms[w.arm].key]) + '</small>';
      tip.style.left = (w.sx / DPR) + 'px'; tip.style.top = (w.sy / DPR) + 'px'; tip.style.opacity = 1;
    } else tip.style.opacity = 0; }, { passive: true });
  cv.addEventListener('pointerleave', () => { hover = -1; pmx = pmy = -1e5; tip.style.opacity = 0; });
  cv.addEventListener('click', () => { if (hover >= 0) { sfx.blip();
    toast(worlds[hover].name + ' — ' + (VERIFY[worlds[hover].name] || VGEN[arms[worlds[hover].arm].key])); } });

  const api = {
    setBeat(beat, c) { stage = biOf(beat, c); born = performance.now();
      armtags.forEach((t2, i) => t2.style.opacity = (stage >= 1 && stage <= 4 && i === stage - 1) ? 1 : 0);
      if (stage >= 6 && !ghost.active) { ghost.active = true; ghost.t0 = performance.now();
        ghost.tx = worlds[10].sx; ghost.ty = worlds[10].sy; } },
    tick(t) {
      if (!ok && (ok = fit(cv))) {} if (!ok) return;
      W = cv.width; H = cv.height; ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H * .5;
      const hl = (stage >= 1 && stage <= 4) ? stage - 1 : -1;
      const rot = PX() * .1;
      arms.forEach((arm, i) => {
        ctx.strokeStyle = colors[arm.key] + (hl === i ? '55' : '16');
        ctx.lineWidth = (hl === i ? 1.6 : 1) * DPR;
        ctx.setLineDash([3 * DPR, 6 * DPR]);
        ctx.beginPath(); ctx.moveTo(cx, cy);
        const aa = arm.a + rot;
        ctx.lineTo(cx + Math.cos(aa) * W * .46, cy + Math.sin(aa) * H * .42);
        ctx.stroke(); ctx.setLineDash([]); });
      const spawn = Math.min(1, (t - born) / 900);
      worlds.forEach((w, i) => {
        let target = .25;
        if (hl >= 0) target = w.arm === hl ? 1 : .16;
        else if (stage >= 5) target = .8;
        w.a += (target - w.a) * .06;
        const aa = Math.atan2(w.ny - .5, w.nx - .5) + rot;
        const rr = Math.hypot(w.nx - .5, w.ny - .5);
        const nx = .5 + Math.cos(aa) * rr, ny = .5 + Math.sin(aa) * rr;
        const px2 = cx + (nx - .5) * W * .96 * E.out(spawn);
        const py2 = cy + (ny - .5) * H * .92 * E.out(spawn);
        w.sx = px2; w.sy = py2;
        const col = colors[arms[w.arm].key];
        const tw = .6 + .4 * Math.abs(Math.sin(t * .0016 + w.tw));
        const pd = Math.hypot(px2 - pmx, py2 - pmy);
        const near = pd < 90 * DPR ? (1 - pd / (90 * DPR)) : 0;
        const boost = Math.max(hover === i ? 1.7 : 1, 1 + near * .8);
        glow(ctx, px2, py2, w.sz * DPR * boost, col, (hover === i ? 20 : 9) * DPR * tw);
        if ((hl === w.arm && w.a > .7) || hover === i || near > .5) {
          ctx.font = (8.4 * DPR) + 'px "Space Grotesk"';
          ctx.fillStyle = hover === i ? '#F4F1E8' : col; ctx.textAlign = 'center';
          ctx.fillText(w.name, px2, py2 - (w.sz + 5) * DPR); }
      });
      glow(ctx, cx, cy, 3 * DPR, '#F4F1E8', 12);
      ctx.font = (9 * DPR) + 'px "Space Grotesk"'; ctx.fillStyle = 'rgba(244,241,232,.6)';
      ctx.textAlign = 'center'; ctx.fillText('ONE NETWORK · SEVENTY WORLDS', cx, cy + 20 * DPR);

      /* the Null — dark glitch mass (no emoji) */
      if (ghost.active) {
        if (t - ghost.t0 > 900) { ghost.t0 = t;
          const target = worlds[Math.random() * worlds.length | 0];
          ghost.tx = target.sx; ghost.ty = target.sy;
          if (stage >= 6) { seals.push({ x: ghost.tx, y: ghost.ty, life: 1, col: colors[arms[target.arm].key] });
            if (sfx.on) sfx.blip(); } }
        const p = Math.min(1, (t - ghost.t0) / 900);
        const gx = ghost.x * W + (ghost.tx - ghost.x * W) * p;
        const gy = ghost.y * H + (ghost.ty - ghost.y * H) * p;
        ghost.x = gx / W; ghost.y = gy / H;
        const grd = ctx.createRadialGradient(gx, gy, 0, gx, gy, 34 * DPR);
        grd.addColorStop(0, 'rgba(255,90,95,.28)'); grd.addColorStop(1, 'rgba(255,90,95,0)');
        ctx.fillStyle = grd; ctx.fillRect(gx - 34 * DPR, gy - 34 * DPR, 68 * DPR, 68 * DPR);
        for (let k = 0; k < 7; k++) { const a = t * .004 + k * TAU / 7;
          const rx = gx + Math.cos(a) * 14 * DPR + rnd(-2, 2) * DPR;
          const ry = gy + Math.sin(a) * 10 * DPR + rnd(-2, 2) * DPR;
          ctx.save(); ctx.translate(rx, ry); ctx.rotate(a + t * .002);
          ctx.strokeStyle = 'rgba(255,90,95,.85)'; ctx.lineWidth = 1.2 * DPR;
          ctx.beginPath(); ctx.moveTo(0, -5 * DPR); ctx.lineTo(5 * DPR, 4 * DPR);
          ctx.lineTo(-5 * DPR, 4 * DPR); ctx.closePath(); ctx.stroke(); ctx.restore(); }
      }
      for (let i = seals.length - 1; i >= 0; i--) { const s = seals[i]; s.life -= .012;
        if (s.life <= 0) { seals.splice(i, 1); continue; }
        ctx.strokeStyle = s.col; ctx.globalAlpha = s.life; ctx.lineWidth = 2 * DPR;
        ctx.beginPath(); ctx.arc(s.x, s.y, (1 - s.life) * 46 * DPR, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; }
      if (stage >= 7) { ctx.font = (10 * DPR) + 'px "Space Grotesk"'; ctx.fillStyle = '#44EDF7';
        ctx.textAlign = 'center'; ctx.fillText('FRAUD ANYWHERE — EXILE EVERYWHERE', cx, H * .94); }
    }
  };
  return api;
};

/* ═══════════════════════════════════════════════════════════════════
   6 · CH12 — THE PROMISE v2 · light orb + glass tower (no emoji)
   ═══════════════════════════════════════════════════════════════════ */
SC.moneyflow = function (vis, ch) {
  const cv = el('canvas'); vis.appendChild(cv);
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, ok = fit(cv);
  let stage = 0, debris = null, leverDone = false;
  const tags = [];
  function tag(cls, txt, css) { const d = el('div', 'cl-vtag ' + cls, txt);
    d.style.cssText = css; vis.appendChild(d); tags.push(d); return d; }
  const tClient = tag('', 'CLIENT', 'left:7%;top:38%;transform:translateX(-50%)');
  const tMarket = tag('', 'MARKETPLACE', 'left:93%;top:38%;transform:translateX(-50%)');
  const tCore = tag('violet', 'HARMOS · PROOF ONLY', 'left:50%;top:74%;transform:translateX(-50%)');
  const tRailT = tag('gold', 'THEIR LICENSED RAIL', 'left:50%;top:5%;transform:translateX(-50%)');
  const tRailB = tag('gold', 'THEIR LICENSED RAIL', 'left:50%;top:93%;transform:translateX(-50%)');
  const tNeut = tag('gold', 'NEUTRALITY IS ARCHITECTURE', 'left:50%;top:86%;transform:translateX(-50%)');
  const lever = el('div', 'cl-lever'); lever.style.cssText = 'left:64%;top:40%';
  vis.appendChild(lever);
  tClient.style.opacity = tMarket.style.opacity = 1;

  function orb(x, y) { glow(ctx, x, y, 5 * DPR, '#F4F1E8', 16);
    ctx.strokeStyle = 'rgba(244,241,232,.5)'; ctx.lineWidth = 1 * DPR;
    ctx.setLineDash([3 * DPR, 4 * DPR]);
    ctx.beginPath(); ctx.arc(x, y, 12 * DPR, 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
  function tower(x, y, t) {
    const hgt = 64 * DPR;
    [[0, .34], [-.06, .28], [.06, .22]].forEach((lv, li) => {
      const w2 = hgt * lv[1], y2 = y - hgt / 2 + li * hgt * .34;
      ctx.fillStyle = 'rgba(143,168,255,.07)'; ctx.strokeStyle = 'rgba(143,168,255,.7)';
      ctx.lineWidth = 1.2 * DPR;
      ctx.beginPath(); ctx.roundRect(x + lv[0] * hgt - w2, y2, w2 * 2, hgt * .34, 3 * DPR);
      ctx.fill(); ctx.stroke();
      for (let r2 = 0; r2 < 3; r2++) for (let c2 = 0; c2 < 4; c2++)
        if (Math.sin(t * .002 + r2 * 3 + c2 * 7 + li) > -.2) {
          ctx.fillStyle = 'rgba(68,237,247,.35)';
          ctx.fillRect(x + lv[0] * hgt - w2 + 4 * DPR + c2 * (w2 * 2 - 8 * DPR) / 4,
            y2 + 4 * DPR + r2 * (hgt * .34 - 8 * DPR) / 3, 2.4 * DPR, 2.4 * DPR); } });
    glow(ctx, x, y - hgt / 2 - 6 * DPR, 2.2 * DPR, '#8FA8FF', 12);
  }

  const api = {
    setBeat(beat, c) { stage = biOf(beat, c);
      tCore.style.opacity = stage >= 1 ? 1 : 0;
      tRailT.style.opacity = tRailB.style.opacity = stage >= 2 ? 1 : 0;
      if (stage >= 4 && !leverDone) { leverDone = true; lever.style.opacity = 1; sfx.buzz();
        setTimeout(() => { lever.style.transition = 'transform .6s cubic-bezier(.7,0,.3,1), opacity .6s';
          lever.style.transform = 'rotate(34deg) translate(26px,50px)'; lever.style.opacity = .1;
          debris = [];
          for (let i = 0; i < 14; i++) debris.push({ x: .64, y: .44, vx: rnd(-2, 2), vy: rnd(-4, -1), r: rnd(0, TAU), s: rnd(2, 5), life: 1 });
          if (sfx.tone) sfx.tone(90, .4, 'square', .08, 40); }, 900); }
      tNeut.style.opacity = stage >= 5 ? 1 : 0; },
    tick(t) {
      if (!ok && (ok = fit(cv))) {} if (!ok) return;
      W = cv.width; H = cv.height; ctx.clearRect(0, 0, W, H);
      const lx = W * .12, rx = W * .88, cx = W * .5, cy = H * .5;
      orb(lx, cy); tower(rx, cy, t);
      const ctrl = W / 2 + PX() * W * .1;
      const arcs = [[lx, cy, rx, cy, ctrl, H * .07], [rx, cy, lx, cy, ctrl, H * .93]];
      arcs.forEach(a => { ctx.strokeStyle = 'rgba(245,184,74,' + (stage >= 1 ? .4 : .15) + ')';
        ctx.lineWidth = 1.4 * DPR; ctx.setLineDash([4 * DPR, 7 * DPR]);
        ctx.beginPath(); ctx.moveTo(a[0], a[1]);
        ctx.quadraticCurveTo(a[4], a[5], a[2], a[3]); ctx.stroke(); ctx.setLineDash([]); });
      if (stage >= 1) for (let i = 0; i < 5; i++) { const u = (t * .00035 + i * .2) % 1;
        arcs.forEach(a => { const x = (1-u)*(1-u)*a[0] + 2*(1-u)*u*a[4] + u*u*a[2];
          const y = (1-u)*(1-u)*a[1] + 2*(1-u)*u*a[5] + u*u*a[3];
          glow(ctx, x, y, 3 * DPR, '#F5B84A', 12); }); }
      /* core hexagon + proof beam */
      ctx.strokeStyle = 'rgba(143,168,255,.7)'; ctx.lineWidth = 1.8 * DPR;
      ctx.shadowColor = '#8FA8FF'; ctx.shadowBlur = 14 * DPR;
      ctx.beginPath();
      for (let k = 0; k <= 6; k++) { const a = k * TAU / 6;
        const X = cx + Math.cos(a) * 34 * DPR, Y = cy + Math.sin(a) * 34 * DPR;
        k ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
      ctx.stroke(); ctx.shadowBlur = 0;
      const pulse = .5 + .5 * Math.sin(t * .006);
      ln(ctx, W * .28, cy, W * .72, cy, 'rgba(68,237,247,' + (.35 + .45 * pulse) + ')', 2);
      glow(ctx, W * .28 + (W * .44) * ((t * .0006) % 1), cy, 2.6 * DPR, '#44EDF7', 12);
      if (stage >= 1) { ctx.font = (8 * DPR) + 'px "Space Grotesk"';
        ctx.fillStyle = 'rgba(255,90,95,.7)'; ctx.textAlign = 'center';
        ctx.fillText('\u2715 NO CLIENT FUNDS', cx, cy + 48 * DPR); }
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

/* ═══════════════════════════════════════════════════════════════════
   7 · CH13 — HONESTY v2 · light-marks on the care ring (no emoji)
   ═══════════════════════════════════════════════════════════════════ */
SC.honesty = function (vis, ch) {
  const cv = el('canvas'); vis.appendChild(cv);
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, ok = fit(cv);
  const ENTRIES = ['accuracy: published · quarterly · red-teamed', 'hidden defects: physics cannot see',
    'coercion: no technology detects', 'errors: refunded 3\u00D7 the fee',
    'appeals: 2% — refunded if overturned', 'duress PIN: always on · recovery in 72h',
    'our limits: published on our own homepage'];
  const STAGE_N = [2, 4, 5, 6, 7, 7];
  let stage = 0;
  const ledger = el('div', 'cl-hledger', '<h4>THE HONESTY LEDGER</h4><ul></ul>');
  vis.appendChild(ledger);
  const lis = ENTRIES.map(txt => { const li = el('li');
    ledger.querySelector('ul').appendChild(li);
    li._full = txt; li._t0 = 0; return li; });
  const comp = el('div', 'cl-competitor', '100% GUARANTEED \u2728');
  comp.style.cssText = 'right:4%;top:12%;transform:scale(0)';
  vis.appendChild(comp);
  let shattered = false, shards = null;

  const api = {
    setBeat(beat, c) { stage = Math.min(biOf(beat, c), 5); ledger.style.opacity = 1;
      if (stage >= 4 && comp.style.opacity !== '1') {
        comp.style.transition = 'transform .5s cubic-bezier(.2,.8,.2,1), opacity .5s';
        comp.style.opacity = 1; comp.style.transform = 'scale(1)'; }
      if (stage >= 5 && !shattered) { shattered = true; sfx.buzz();
        comp.style.transition = 'transform .5s, opacity .5s';
        comp.style.transform = 'rotate(-12deg) scale(1.25)'; comp.style.opacity = 0;
        shards = []; for (let i = 0; i < 12; i++)
          shards.push({ x: .86, y: .16, vx: rnd(-3, 1), vy: rnd(-3, 1), r: rnd(0, TAU), s: rnd(2, 6), life: 1 }); } },
    tick(t) {
      if (!ok && (ok = fit(cv))) {} if (!ok) return;
      W = cv.width; H = cv.height; ctx.clearRect(0, 0, W, H);
      ledger.style.transform = 'translate(-50%,-50%) rotateY(' + (PX() * 5) + 'deg) rotateX(' + (-PY() * 4) + 'deg)';
      const want = STAGE_N[stage];
      lis.forEach((li, i) => { if (i < want) { if (!li._t0) li._t0 = t;
          const n = Math.min(li._full.length, (t - li._t0) / 22);
          li.style.opacity = n > 0 ? 1 : 0;
          li.textContent = li._full.slice(0, Math.floor(n)); } });
      const cx = W * .74, cy = H * .55;
      const ringP = Math.max(0, Math.min(1, stage - 2));
      ctx.strokeStyle = 'rgba(245,184,74,.75)'; ctx.lineWidth = 2.2 * DPR;
      ctx.shadowColor = '#F5B84A'; ctx.shadowBlur = 12 * DPR;
      ctx.beginPath(); ctx.arc(cx, cy, 44 * DPR, -Math.PI / 2, -Math.PI / 2 + TAU * ringP); ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(68,237,247,.8)'; ctx.lineWidth = 1.6 * DPR;
      ctx.beginPath();
      for (let k = 0; k <= 6; k++) { const a = k * TAU / 6;
        const X = cx + Math.cos(a) * 16 * DPR, Y = cy + Math.sin(a) * 16 * DPR;
        k ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
      ctx.closePath(); ctx.stroke();
      if (ringP > .1) { for (let i = 0; i < 6; i++) { const a = i * TAU / 6 - Math.PI / 2;
          if (a + Math.PI / 2 > TAU * ringP) break;
          glow(ctx, cx + Math.cos(a) * 44 * DPR, cy + Math.sin(a) * 44 * DPR,
            (2.4 + Math.sin(t * .004 + i) * .8) * DPR, '#F5B84A', 10); }
        ctx.font = (8.5 * DPR) + 'px "Space Grotesk"'; ctx.fillStyle = 'rgba(245,184,74,.8)';
        ctx.textAlign = 'center';
        ctx.fillText('THE CARE LAYER — HUMANS HOLD THE MACHINE', cx, cy + 66 * DPR); }
      if (shards) { shards.forEach(s => { s.life -= .01; s.vy += .1;
          s.x += s.vx * .004; s.y += s.vy * .004;
          if (s.life <= 0) return;
          ctx.save(); ctx.translate(s.x * W, s.y * H); ctx.rotate(s.r);
          ctx.globalAlpha = s.life; ctx.fillStyle = '#FF5A5F';
          ctx.fillRect(-s.s * DPR / 2, -s.s * DPR / 2, s.s * DPR, s.s * DPR); ctx.restore(); });
        if (shards.every(s => s.life <= 0)) shards = null; }
    }
  };
  return api;
};

/* ═══════════════════════════════════════════════════════════════════
   8 · THE GLASS TRANSITION — logo in frosted glass, panels shatter out
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  const oldWipe = document.getElementById('clWipe');
  const gw = document.getElementById('clGlassWipe');
  if (!oldWipe || !gw) return;
  oldWipe.style.opacity = '0';
  /* build 8 shards */
  const shards = gw.querySelector('.gw-shards');
  const defs = [[-30, -18, -62, -30], [30, -18, 62, -30], [-30, 18, -62, 30], [30, 18, 62, 30],
    [-8, -30, -20, -64], [8, -30, 20, -64], [-8, 30, -20, 64], [8, 30, 20, 64]];
  defs.forEach((d, i) => { const s = el('i');
    s.style.setProperty('--ix', d[0] + 'px'); s.style.setProperty('--iy', d[1] + 'px');
    s.style.setProperty('--ox', d[2] + 'vw'); s.style.setProperty('--oy', d[3] + 'vh');
    s.style.setProperty('--r0', (i % 2 ? 4 : -4) + 'deg');
    s.style.setProperty('--r1', (i % 2 ? 26 : -26) + 'deg');
    s.style.transitionDelay = (i * 45) + 'ms';
    shards.appendChild(s); });
  let gwState = 0;
  new MutationObserver(() => {
    const tf = oldWipe.style.transform || '';
    if (tf.indexOf('scaleY(1)') >= 0 && gwState !== 1) { gwState = 1;
      gw.classList.remove('out'); void gw.offsetWidth;
      gw.classList.add('on', 'in'); if (sfx.pad) sfx.pad(); }
    else if (tf.indexOf('scaleY(0)') >= 0 && gwState === 1) { gwState = 2;
      gw.classList.remove('in'); void gw.offsetWidth;
      gw.classList.add('out');
      setTimeout(() => { gw.classList.remove('on', 'out'); gwState = 0; }, 850); }
  }).observe(oldWipe, { attributes: true, attributeFilter: ['style'] });
})();

/* ═══════════════════════════════════════════════════════════════════
   9 · AUTOPLAY — ▶ PLAY THE FILM
   ═══════════════════════════════════════════════════════════════════ */
const auto = { on: false, timer: null, synth: false };
(function () {
  const btn = document.getElementById('clAuto');
  if (!btn) return;
  const fill = btn.querySelector('.cl-auto-fill');
  const label = btn.querySelector('.cl-auto-label');
  const origShow = A.showBeat;
  A.showBeat = function (ci, bi) { origShow(ci, bi); schedule(ci, bi); };
  function schedule(ci, bi) {
    clearTimeout(auto.timer);
    if (!auto.on) return;
    const ch = CL.chapters[ci];
    const last = ci === CL.chapters.length - 1 && bi === ch.beats.length - 1;
    if (last) { stop(); toast('The film ends where you begin. Sealing is yours.'); return; }
    const words = ch.beats[bi].text.split(/\s+/).length;
    const dur = Math.min(9500, Math.max(3200, 1100 + words * 340));
    fill.style.transition = 'none'; fill.style.width = '0%';
    void fill.offsetWidth;
    fill.style.transition = 'width ' + dur + 'ms linear'; fill.style.width = '100%';
    auto.timer = setTimeout(() => {
      auto.synth = true;
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      setTimeout(() => { auto.synth = false; }, 60);
    }, dur);
  }
  function start() { auto.on = true; btn.classList.add('playing');
    label.textContent = '\u23F8 PAUSE THE FILM'; sfx.init();
    schedule(A.curCh, A.curBeat < 0 ? 0 : A.curBeat); }
  function stop() { auto.on = false; clearTimeout(auto.timer);
    btn.classList.remove('playing'); label.textContent = '\u25B6 PLAY THE FILM';
    fill.style.transition = 'none'; fill.style.width = '0%'; }
  btn.addEventListener('click', () => auto.on ? stop() : start());
  ['pointerdown', 'keydown'].forEach(ev =>
    document.addEventListener(ev, e => {
      if (!auto.on || auto.synth) return;
      if (ev === 'pointerdown' && e.target.closest('#clAuto')) return;
      if (ev === 'keydown' && e.key === 'Escape') return;
      stop(); toast('Autoplay paused — the film waits for you.');
    }, true));
})();

/* ═══════════════════════════════════════════════════════════════════
   10 · CURSOR MAGIC — parallax on every scene + trail + seal ripples
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  const trail = document.getElementById('clTrail');
  const vis = document.getElementById('clVisual');
  if (!trail || !vis) return;
  const ctx = trail.getContext('2d');
  const pts = [], ripples = [];
  let lx = -1e5, ly = -1e5, vx = 0, vy = 0;
  function fitT() { trail.width = Math.round(innerWidth * DPR); trail.height = Math.round(innerHeight * DPR); }
  fitT(); addEventListener('resize', fitT);
  addEventListener('pointermove', e => {
    const x = e.clientX * DPR, y = e.clientY * DPR;
    if (Math.hypot(x - lx, y - ly) > 7 * DPR) { pts.push({ x, y, life: 1 }); lx = x; ly = y;
      if (pts.length > 42) pts.shift(); }
  }, { passive: true });
  addEventListener('pointerdown', e => {
    ripples.push({ x: e.clientX * DPR, y: e.clientY * DPR, r: 0 });
    if (sfx.on) sfx.blip();
  }, { passive: true });
  (function loop(t) {
    requestAnimationFrame(loop);
    if (document.hidden) return;
    /* trail */
    ctx.clearRect(0, 0, trail.width, trail.height);
    for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; p.life -= .028;
      if (p.life <= 0) { pts.splice(i, 1); continue; }
      const near = i / pts.length;
      glow(ctx, p.x, p.y, (1.6 + near * 1.6) * DPR,
        near > .5 ? 'rgba(68,237,247,' + p.life * .5 + ')' : 'rgba(143,168,255,' + p.life * .45 + ')', 8); }
    /* ripples — the seal */
    for (let i = ripples.length - 1; i >= 0; i--) { const r = ripples[i]; r.r += 3.4 * DPR;
      if (r.r > 120 * DPR) { ripples.splice(i, 1); continue; }
      const k = 1 - r.r / (120 * DPR);
      ctx.strokeStyle = 'rgba(68,237,247,' + k * .55 + ')'; ctx.lineWidth = 1.6 * DPR;
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, TAU); ctx.stroke();
      ctx.strokeStyle = 'rgba(143,168,255,' + k * .3 + ')';
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r * .6, 0, TAU); ctx.stroke(); }
    /* global scene parallax — every scene tilts with the cursor */
    if (!TOUCH) {
      vx += (A.px() * 3.2 - vx) * .06; vy += (A.py() * 2.4 - vy) * .06;
      vis.style.transform = 'perspective(1100px) rotateY(' + vx.toFixed(3) + 'deg) rotateX(' + (-vy).toFixed(3) + 'deg)';
    }
  })(0);
})();

})();
