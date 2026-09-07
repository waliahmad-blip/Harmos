/* ═══════════════════════════════════════════════════════════════════
   SCENE FIXES v1 — loads after film-upgrade.js
   1 · Vanishing Witness REBUILT — "The Ledger of Eras" (zero candles)
   2 · Terminology tooltips — real-world meanings on story terms
   3 · Candle scrub — 🕯️ can never render again
   ═══════════════════════════════════════════════════════════════════ */
(function () {
'use strict';
const A = window.CL_ENGINE_A; if (!A) return;
const CL = A.CL, PAL = A.PAL, DPR = A.DPR;
const $ = A.$, el = A.el, rnd = A.rnd, TAU = A.TAU, E = A.E;
const sfx = A.sfx, SC = A.SCENES;
const fit = A.fitCanvas, glow = A.glowDot, ln = A.line;
const PX = () => A.px(), PY = () => A.py();

/* ═══ 3 · CANDLE SCRUB — defensive, permanent ═══ */
(function scrub() {
  function cleanNode(n) { if (n.nodeType === 3 && /🕯/.test(n.nodeValue))
      n.nodeValue = n.nodeValue.replace(/🕯️?/g, ''); }
  function walk(root) { const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n; while ((n = w.nextNode())) cleanNode(n); }
  walk(document.body);
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => {
    if (n.nodeType === 3) cleanNode(n); else if (n.nodeType === 1) walk(n);
  }))).observe(document.body, { childList: true, subtree: true });
  const t = document.getElementById('clToast');
  if (t) new MutationObserver(() => {
    if (/seals need fire/i.test(t.textContent))
      t.textContent = t.textContent.replace(/seals need fire/i, 'seals need intent');
  }).observe(t, { childList: true });
})();

/* ═══════════════════════════════════════════════════════════════════
   1 · CH2 REBUILT — THE LEDGER OF ERAS
   A holographic transaction ledger across four eras. Pre-internet
   records carry hex verification seals. The internet era: seals are
   NULL. Your cursor is the scanner — it reveals the missing witness.
   ═══════════════════════════════════════════════════════════════════ */
SC.timeline = function (vis, ch) {
  const cv = el('canvas'); vis.appendChild(cv);
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, ok = fit(cv);

  const ERAS = ['THE WELL', 'THE MARKET', 'THE NOTARY', 'THE INTERNET'];
  const zones = ERAS.map((label, i) => ({ label, i, records: [], active: false,
    dim: 0, scan: 0, spawnT: 0 }));
  let stage = -1, born = performance.now();
  let coverage = 100, covTarget = 100;
  let darkA = 0, floodNulls = [], ghostSeal = null, lastToast = 0;
  let pmx = -1e5, pmy = -1e5;
  cv.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect();
    pmx = (e.clientX - r.left) * DPR; pmy = (e.clientY - r.top) * DPR; }, { passive: true });
  cv.addEventListener('pointerleave', () => { pmx = pmy = -1e5; });
  cv.addEventListener('click', () => {
    const c = nullChipNear();
    if (c) { ghostSeal = { x: c.x, y: c.y, t: 0 }; sfx.blip();
      const now = performance.now();
      if (now - lastToast > 4000) { lastToast = now;
        A.toast('Preview only — Harmos brings the witness back.'); } }
  });

  function zoneBox(z) {
    const x0 = W * (.04 + z.i * .245), x1 = x0 + W * .215;
    return { x0, x1, cx: (x0 + x1) / 2 };
  }
  function chipRect(z, k) { const b = zoneBox(z);
    const cols = 2, rows = 3;
    const col = k % cols, row = Math.floor(k / cols);
    const cw = (b.x1 - b.x0) * .42, chh = 20 * DPR;
    const x = b.cx + (col - .5) * (cw + 10 * DPR) - cw / 2;
    const y = H * .56 - rows * (chh + 9 * DPR) / 2 + row * (chh + 9 * DPR);
    return { x, y, w: cw, h: chh }; }
  function drawChip(c, sealed, a, t, ghost) {
    ctx.save(); ctx.globalAlpha = a;
    ctx.strokeStyle = sealed ? 'rgba(68,237,247,.75)' : 'rgba(255,90,95,.65)';
    ctx.lineWidth = 1.1 * DPR;
    if (!sealed) ctx.setLineDash([3 * DPR, 3 * DPR]);
    ctx.beginPath(); ctx.roundRect(c.x, c.y, c.w, c.h, 4 * DPR); ctx.stroke();
    ctx.setLineDash([]);
    /* ledger lines inside */
    ln(ctx, c.x + 5 * DPR, c.y + c.h * .38, c.x + c.w - 16 * DPR, c.y + c.h * .38,
      'rgba(244,241,232,.22)', .7);
    ln(ctx, c.x + 5 * DPR, c.y + c.h * .68, c.x + c.w - 16 * DPR, c.y + c.h * .68,
      'rgba(244,241,232,.22)', .7);
    /* the seal — hexagon */
    const hx = c.x + c.w - 9 * DPR, hy = c.y + c.h / 2, R = 6.5 * DPR;
    ctx.beginPath();
    for (let k = 0; k <= 6; k++) { const an = k * TAU / 6 - Math.PI / 2;
      const X = hx + Math.cos(an) * R, Y = hy + Math.sin(an) * R;
      k ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
    if (sealed) { ctx.fillStyle = 'rgba(68,237,247,.16)'; ctx.fill();
      ctx.strokeStyle = '#44EDF7'; ctx.stroke();
      ln(ctx, hx - 2.5 * DPR, hy, hx - .5 * DPR, hy + 2.2 * DPR, '#44EDF7', 1.1);
      ln(ctx, hx - .5 * DPR, hy + 2.2 * DPR, hx + 2.8 * DPR, hy - 2.4 * DPR, '#44EDF7', 1.1); }
    else { ctx.strokeStyle = ghost ? 'rgba(68,237,247,.8)' : 'rgba(255,90,95,.7)';
      ctx.setLineDash(ghost ? [] : [2 * DPR, 2 * DPR]); ctx.stroke(); ctx.setLineDash([]);
      if (ghost) { glow(ctx, hx, hy, 3 * DPR, '#44EDF7', 12); }
      else { ctx.font = (6.5 * DPR) + 'px "Space Grotesk"';
        ctx.fillStyle = 'rgba(255,90,95,.85)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('?', hx, hy + .5 * DPR); ctx.textBaseline = 'alphabetic'; } }
    ctx.restore();
  }
  function nullChipNear() {
    let best = null, bd = 34 * DPR;
    zones[3].records.forEach(rc => { const d = Math.hypot(rc.x - pmx, rc.y - pmy);
      if (d < bd) { bd = d; best = rc; } });
    floodNulls.forEach(rc => { const d = Math.hypot(rc.x - pmx, rc.y - pmy);
      if (d < bd) { bd = d; best = rc; } });
    return best;
  }

  const api = {
    setBeat(beat) {
      stage = ['era-ancient', 'era-handshake', 'era-screen', 'padlock-door', 'drift-dark'].indexOf(beat.fx);
      born = performance.now();
      if (stage === 0) zones[0].active = true;
      if (stage === 1) { zones[1].active = zones[2].active = true; zones[1].scan = 0; }
      if (stage === 2) { zones[3].active = true; covTarget = 0; }
      if (stage >= 3) zones.forEach(z => z.dim = 1);
      if (stage === 4) for (let i = 0; i < 16; i++)
        floodNulls.push({ x: rnd(0, W || 600), y: rnd(0, H || 400),
          vx: rnd(-.2, .2), vy: rnd(-.12, .12) });
    },
    tick(t) {
      if (!ok && (ok = fit(cv))) {} if (!ok) return;
      W = cv.width; H = cv.height; ctx.clearRect(0, 0, W, H);
      coverage += (covTarget - coverage) * .018;

      /* coverage meter — top */
      const bw = Math.min(220 * DPR, W * .5), bx = W / 2 - bw / 2, by = 12 * DPR;
      ctx.font = (8.5 * DPR) + 'px "Space Grotesk"'; ctx.textAlign = 'center';
      ctx.fillStyle = coverage > 50 ? '#44EDF7' : '#FF5A5F';
      ctx.fillText('VERIFICATION COVERAGE', W / 2, by + 5 * DPR);
      ctx.strokeStyle = 'rgba(244,241,232,.25)'; ctx.lineWidth = 1 * DPR;
      ctx.strokeRect(bx, by + 10 * DPR, bw, 5 * DPR);
      const pct = coverage / 100;
      ctx.fillStyle = coverage > 50 ? '#44EDF7' : '#FF5A5F';
      ctx.fillRect(bx, by + 10 * DPR, bw * pct, 5 * DPR);
      ctx.font = (11 * DPR) + 'px "Space Grotesk"';
      ctx.fillText(Math.round(coverage) + '%', W / 2, by + 34 * DPR);

      /* the timeline axis */
      const ay = H * .82;
      ln(ctx, W * .04, ay, W * .96, ay, 'rgba(143,168,255,.35)', 1.2);
      zones.forEach(z => {
        const b = zoneBox(z);
        const a = z.active ? 1 : .35;
        ctx.save(); ctx.globalAlpha = a * (1 - z.dim * .75);
        /* zone divider + label */
        if (z.i > 0) ln(ctx, b.x0 - W * .015, ay - 8 * DPR, b.x0 - W * .015, ay + 8 * DPR, 'rgba(143,168,255,.4)', 1);
        ctx.font = (8 * DPR) + 'px "Space Grotesk"'; ctx.textAlign = 'center';
        ctx.fillStyle = z.i === 3 && z.active ? '#FF5A5F' : 'rgba(244,241,232,.55)';
        ctx.fillText(z.label, b.cx, ay + 20 * DPR);
        /* era number */
        ctx.fillStyle = 'rgba(143,168,255,.5)';
        ctx.fillText('ERA ' + (z.i + 1), b.cx, ay - 14 * DPR);
        /* scan sweep for activation */
        if (z.scan > 0 && z.scan < 1) {
          const sx = b.x0 + (b.x1 - b.x0) * z.scan;
          ln(ctx, sx, H * .2, sx, ay, 'rgba(68,237,247,.7)', 1.6);
          z.scan += .02;
        }
        /* spawn records */
        if (z.active && z.records.length < 6 && t - z.spawnT > (z.i === 3 ? 500 : 700)) {
          z.spawnT = t;
          const c = chipRect(z, z.records.length);
          z.records.push({ x: c.x, y: c.y, w: c.w, h: c.h, born: t });
          if (z.i < 3) { z.scan = .01; if (sfx.on) sfx.blip(); }
        }
        /* draw records */
        z.records.forEach(rc => {
          const age = Math.min(1, (t - rc.born) / 600);
          const dy = (1 - E.out(age)) * -26 * DPR;
          ctx.save(); ctx.translate(0, dy);
          drawChip(rc, z.i < 3, E.out(age), t, false);
          ctx.restore();
        });
        ctx.restore();
      });

      /* cursor = scanner over NULL chips */
      const near = (stage === 2 || stage >= 3) ? nullChipNear() : null;
      if (near) {
        drawChip(near, false, 1, t, true);
        ctx.font = (8 * DPR) + 'px "Space Grotesk"'; ctx.textAlign = 'center';
        ctx.fillStyle = '#44EDF7';
        ctx.fillText('WITNESS: MISSING — CLICK TO PREVIEW', near.x + near.w / 2, near.y - 8 * DPR);
      }
      if (ghostSeal) { ghostSeal.t += .025;
        const g = ghostSeal, k = Math.min(1, g.t);
        ctx.save(); ctx.globalAlpha = 1 - Math.max(0, g.t - 1.2) / .8;
        const hx = g.x + 0, hy = g.y;  /* near chip center-ish */
        ctx.strokeStyle = 'rgba(68,237,247,.9)'; ctx.lineWidth = 1.6 * DPR;
        ctx.beginPath();
        for (let k2 = 0; k2 <= 6; k2++) { const an = k2 * TAU / 6 - Math.PI / 2;
          const X = g.x + g.w - 9 * DPR + Math.cos(an) * 6.5 * DPR;
          const Y = g.y + g.h / 2 + Math.sin(an) * 6.5 * DPR;
          k2 ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
        ctx.stroke();
        ctx.beginPath(); ctx.arc(g.x + g.w - 9 * DPR, g.y + g.h / 2, k * 30 * DPR, 0, TAU);
        ctx.strokeStyle = 'rgba(68,237,247,' + (1 - k) * .6 + ')'; ctx.stroke();
        ctx.restore();
        if (g.t > 2) ghostSeal = null;
      }

      /* the door + padlock (geometric, cold) */
      if (stage >= 3) {
        const dx = W * .5, dy = H * .46;
        const dw = Math.min(96 * DPR, W * .16), dh = dw * 1.7;
        ctx.save();
        ctx.strokeStyle = 'rgba(68,237,247,.7)'; ctx.lineWidth = 1.6 * DPR;
        ctx.shadowColor = 'rgba(68,237,247,.4)'; ctx.shadowBlur = 16 * DPR;
        ctx.beginPath(); ctx.roundRect(dx - dw / 2, dy - dh / 2, dw, dh, 8 * DPR); ctx.stroke();
        ctx.shadowBlur = 0;
        /* padlock above door */
        const py2 = dy - dh / 2 - 26 * DPR;
        ctx.beginPath(); ctx.arc(dx, py2 - 8 * DPR, 10 * DPR, Math.PI, 0); ctx.stroke();
        ctx.beginPath(); ctx.roundRect(dx - 12 * DPR, py2 - 8 * DPR, 24 * DPR, 18 * DPR, 3 * DPR); ctx.stroke();
        glow(ctx, dx, py2 + 1 * DPR, 2 * DPR, '#44EDF7', 10);
        ctx.font = (7.5 * DPR) + 'px "Space Grotesk"'; ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(244,241,232,.5)';
        ctx.fillText('THE PADLOCK PROVED THE SHOP', dx, dy + dh / 2 + 16 * DPR);
        ctx.fillText('NEVER THE DEAL INSIDE', dx, dy + dh / 2 + 27 * DPR);
        /* NULL chips orbit the door — unguarded */
        for (let i = 0; i < 5; i++) {
          const an = t * .0006 + i * TAU / 5;
          const ox = dx + Math.cos(an) * (dw * 1.6), oy = dy + Math.sin(an) * (dh * .55);
          drawChip({ x: ox - 16 * DPR, y: oy - 8 * DPR, w: 32 * DPR, h: 16 * DPR }, false, .8, t, false);
        }
        ctx.restore();
      }

      /* the dark + the flood */
      if (stage === 4) {
        darkA = Math.min(.72, darkA + .006);
        floodNulls.forEach(n => { n.x += n.vx * DPR; n.y += n.vy * DPR;
          if (n.x < 0 || n.x > W) n.vx *= -1; if (n.y < 0 || n.y > H) n.vy *= -1;
          drawChip({ x: n.x - 16 * DPR, y: n.y - 8 * DPR, w: 32 * DPR, h: 16 * DPR }, false, .5, t, false); });
        ctx.fillStyle = 'rgba(7,8,24,' + darkA + ')'; ctx.fillRect(0, 0, W, H);
        ctx.font = (46 * DPR) + 'px "Space Grotesk"'; ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,90,95,' + (.5 + .2 * Math.sin(t * .004)) + ')';
        ctx.fillText('0%', W / 2, H * .3);
        ctx.font = (9 * DPR) + 'px "Space Grotesk"';
        ctx.fillStyle = 'rgba(244,241,232,.55)';
        ctx.fillText('FIVE BILLION PEOPLE · ZERO WITNESSES', W / 2, H * .38);
      }
    }
  };
  return api;
};

/* ═══════════════════════════════════════════════════════════════════
   2 · TERMINOLOGY TOOLTIPS — story words carry real-world meaning
   ═══════════════════════════════════════════════════════════════════ */
const TERMS = [
  { w: ['vanishing', 'witness'],        m: 'the trusted third person every pre-internet deal relied on — notary, elder, peer' },
  { w: ['the', 'synthetic'],            m: 'the flood of AI-generated fakes — deepfakes, cloned voices, forged records' },
  { w: ['synthetic'],                   m: 'AI-generated fake media — deepfakes, cloned voices, forged records' },
  { w: ['witness'],                     m: 'a trusted third party who watches a deal so both sides can relax' },
  { w: ['zerith'],                      m: 'our origin legend — the first moment ever sealed by mathematics' },
  { w: ['coordinate'],                  m: 'a verified point in reality — sealed, timestamped, returnable forever' },
  { w: ['coordinates'],                 m: 'verified points in reality — sealed, timestamped, returnable forever' },
  { w: ['lattice'],                     m: 'the post-quantum grid where every verified moment becomes a sealed coordinate' },
  { w: ['chronolattice'],               m: 'our name for the post-quantum grid of sealed, returnable moments' },
  { w: ['receipt'],                     m: 'the court-ready proof artifact: media + sensor seals + consensus, PQ-signed' },
  { w: ['the', 'five'],                 m: 'five certified experts on two continents, working blind and isolated' },
  { w: ['kaelith'],                     m: 'the adversarial AI paid to destroy every verdict before the client sees it' },
  { w: ['verdict'],                     m: 'the consensus output — confidence score on its face, dissent published in full' },
  { w: ['attests'],                     m: 'gives cryptographic proof from the phone\u2019s chip that it is a real device' },
  { w: ['attestation'],                 m: 'cryptographic proof from a device\u2019s chip that it is genuine and unmodified' },
  { w: ['post-quantum'],                m: 'lattice-based signature math that quantum computers cannot forge' },
  { w: ['noorish'],                     m: 'a student in our story — pays to use the network, earns to power it' },
  { w: ['release', 'signal'],           m: 'our API that tells a marketplace\u2019s own bank: proof arrived, you may release funds' },
  { w: ['network', 'memory'],           m: 'fraud anywhere exiles the device everywhere — no shop-hopping for ghosts' },
  { w: ['zero-knowledge'],              m: 'prove something true without revealing the data itself' },
  { w: ['honesty', 'ledger'],           m: 'our published-limits page — accuracy as a number, not a slogan' },
  { w: ['make-it-right'],               m: 'if we err: refund up to 3\u00D7 the fee — capped so it is always honorable' },
  { w: ['care', 'layer'],               m: 'humans around the machine: disputes, appeals, duress PIN, 72h recovery' },
  { w: ['truth', 'fee'],                m: 'the 15\u201320% enterprise fee for high-stakes verification' },
  { w: ['q-day'],                       m: 'the day quantum computers break today\u2019s locks — we sealed before it' },
  { w: ['exile'],                       m: 'permanent ban of a fraudulent device across all seventy worlds' }
];
const norm = w => w.toLowerCase().replace(/[^a-z0-9-]/g, '');

(function termTips() {
  /* tooltip element */
  const tip = el('div'); tip.id = 'clTermTip';
  tip.innerHTML = '<span class="cl-tt-br">\u300C</span><span class="cl-tt-m"></span><span class="cl-tt-br">\u300D</span>';
  document.body.appendChild(tip);
  const tipM = tip.querySelector('.cl-tt-m');
  function showTip(term) {
    tipM.textContent = term.dataset.m;
    tip.classList.add('on');
    const r = term.getBoundingClientRect();
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    let x = r.left + r.width / 2 - tw / 2;
    x = Math.max(10, Math.min(innerWidth - tw - 10, x));
    let y = r.top - th - 10; if (y < 60) y = r.bottom + 10;
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
  }
  function hideTip() { tip.classList.remove('on'); }
  document.addEventListener('pointerover', e => {
    const t = e.target.closest('.cl-term');
    if (t) showTip(t); else if (!e.target.closest('#clTermTip')) hideTip();
  });
  document.addEventListener('focusin', e => {
    const t = e.target.closest && e.target.closest('.cl-term');
    if (t) showTip(t); });
  document.addEventListener('focusout', hideTip);

  /* annotate beats after every showBeat */
  const beatEl = document.getElementById('clBeat');
  function annotate() {
    if (!beatEl) return;
    const spans = [].slice.call(beatEl.querySelectorAll('.w'));
    if (!spans.length) return;
    const used = new Set();
    const words = spans.map(s => norm(s.textContent));
    TERMS.forEach(term => {
      const tl = term.w.map(norm);
      for (let i = 0; i <= words.length - tl.length; i++) {
        if (tl.some((tw, k) => words[i + k] !== tw)) continue;
        const seq = spans.slice(i, i + tl.length);
        if (seq.some(s => used.has(s))) continue;
        seq.forEach(s => used.add(s));
        const wrap = el('span', 'cl-term');
        wrap.dataset.m = term.m;
        wrap.tabIndex = 0;
        seq[0].parentNode.insertBefore(wrap, seq[0]);
        seq.forEach(s => wrap.appendChild(s));
        i += tl.length - 1;
      }
    });
  }
  if (beatEl) new MutationObserver(() => setTimeout(annotate, 30))
    .observe(beatEl, { childList: true });
  annotate();
})();

/* hint text override for the rebuilt scene */
(function () {
  const chNum = document.getElementById('clChNum');
  const box = document.getElementById('clHint');
  if (!chNum || !box) return;
  new MutationObserver(() => {
    setTimeout(() => {
      if (!window.CL_ENGINE_A) return;
      const ch = CL.chapters[A.curCh]; if (!ch || ch.scene !== 'timeline') return;
      box.querySelector('.cl-hglyph').textContent = '\u25A4';
      box.querySelector('.cl-ht').innerHTML = '<b>Your cursor is the scanner.</b>';
      box.querySelector('.cl-hs').textContent = 'Hover a NULL record to see the missing witness \u00B7 click to preview the seal Harmos brings back';
    }, 60);
  }).observe(chNum, { childList: true });
})();

})();
