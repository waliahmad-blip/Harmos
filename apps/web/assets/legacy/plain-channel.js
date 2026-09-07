/* ═══════════════════════════════════════════════════════════════════
   THE INTERCEPT — threat / response, per chapter
   Threat decodes in red → connector fires → response decodes in gold
   Plays once per chapter, then sits still. Never touches the beat text.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
'use strict';
const A = window.CL_ENGINE_A; if (!A) return;

const INT = [
  { p:"Fake videos and scam listings cost the world $5 trillion a year.",
    s:"Harmos builds the verification layer the internet never had." },
  { p:"Online, nobody checks if a deal is real — the trusted middleman vanished.",
    s:"We bring the witness back — as mathematics, in every pocket." },
  { p:"Any video can be generated. Evidence itself stopped being believable.",
    s:"The phone testifies — chip-sworn, light-tested, tamper-proof." },
  { p:"Deepfakes pass every visual check. Detectors are always one step behind.",
    s:"Light flash + sound + motion + secure chip — four tests no fake can pass." },
  { p:"Buying remotely means trusting a stranger's video and hoping.",
    s:"A full deal verified in 60 seconds — from 1,100 kilometers away." },
  { p:"One AI's confident answer can be wrong — or bought.",
    s:"Five blind experts review it; a second AI is paid to attack the verdict." },
  { p:"Screenshots and PDFs prove nothing to a court or a bank.",
    s:"A tamper-proof receipt — notarized proof anyone can independently check." },
  { p:"Trust platforms profit while users carry all the risk.",
    s:"Users pay small fees; everyday people earn by verifying — a trust economy." },
  { p:"Fraud hops industries — banned on one platform, reborn on the next.",
    s:"70 specialist worlds; banned in one, exiled from all of them." },
  { p:"Marketplaces bleed from fake listings, refused parcels, ghost sellers.",
    s:"Money only moves when proof arrives — through their own bank." },
  { p:"Startups announce roadmaps that never arrive.",
    s:"Phases gated by hard numbers — 10 jobs, 500 verifications, 1,000 earners." },
  { p:"Whoever holds the money holds the risk — and the regulator's attention.",
    s:"We never touch your money. Your bank releases it on our proof." },
  { p:"Trust companies hide their error rates and their limits.",
    s:"Accuracy published quarterly, errors refunded 3×, humans handle disputes." },
  { p:"Quantum computers will break the encryption the world runs on.",
    s:"Our seals are already post-quantum — sealed before the race began." },
  { p:"Proving something today means exposing all the data behind it.",
    s:"Coming: prove without revealing — zero-knowledge, sealed 300 years." },
  { p:"Your next deal crosses the dark, like every deal before it.",
    s:"Hold to seal yours — proof, returnable forever." }
];

const GLYPHS = '<>/\\|+=*#01▓▒░';
function decrypt(el, text, dur) {
  const t0 = performance.now(); dur = dur || 1250;
  cancelAnimationFrame(el._raf);
  (function step(now) {
    const p = Math.min(1, (now - t0) / dur);
    let out = '';
    for (let i = 0; i < text.length; i++) {
      const reveal = (i / Math.max(1, text.length)) * .62 + .38;
      out += (p >= reveal || text[i] === ' ') ? text[i]
        : GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }
    el.textContent = out;
    if (p < 1) el._raf = requestAnimationFrame(step);
  })(t0);
}

/* build the panel once */
const title = document.getElementById('clChTitle');
if (!title) return;
const box = document.createElement('div');
box.className = 'cl-int';
box.innerHTML =
  '<span class="cl-int-idx"></span>' +
  '<div class="cl-int-row prob">' +
    '<span class="cl-int-tag"><i></i>THREAT DETECTED</span>' +
    '<span class="cl-int-text"></span>' +
  '</div>' +
  '<div class="cl-int-link"><i></i></div>' +
  '<div class="cl-int-row sol">' +
    '<span class="cl-int-tag"><i></i>HARMOS RESPONSE</span>' +
    '<span class="cl-int-text"></span>' +
  '</div>';
title.parentNode.insertBefore(box, title.nextSibling);

const rows = box.querySelectorAll('.cl-int-text');
const pText = rows[0], sText = rows[1];
const idx = box.querySelector('.cl-int-idx');
const link = box.querySelector('.cl-int-link');

/* fire once per chapter */
let lastCh = -1, timers = [];
const origShow = A.showBeat;
A.showBeat = function (ci, bi) {
  origShow(ci, bi);
  if (ci === lastCh) return;
  lastCh = ci;
  timers.forEach(clearTimeout); timers = [];
  const d = INT[ci];
  if (!d) { box.classList.remove('on'); return; }

  idx.textContent = String(ci + 1).padStart(2, '0') + ' / ' + INT.length;
  box.classList.remove('on');
  link.classList.remove('fire');
  pText.textContent = ''; sText.textContent = '';

  /* let the heading land first, then run the sequence */
  timers.push(setTimeout(() => {
    box.classList.add('on');                                    /* rows slide in   */
    timers.push(setTimeout(() => decrypt(pText, d.p, 1250), 300));   /* threat decodes  */
    timers.push(setTimeout(() => link.classList.add('fire'), 1100));/* connector pulse */
    timers.push(setTimeout(() => decrypt(sText, d.s, 1250), 1250));  /* response decodes*/
  }, 450));
};
})();
