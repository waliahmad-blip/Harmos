/* ═══════════════════════════════════════════════════════════════════
   THE QUANTUM FOLD v2 — calm, zero viewport motion
   Flaps fold IN PLACE and dissolve. No slide. No shake. Ever.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
'use strict';
const A = window.CL_ENGINE_A; if (!A) return;

const fold = document.createElement('div');
fold.id = 'clFold';
fold.innerHTML =
  '<div class="f-grid"></div>' +
  '<div class="f-flap f-a"></div>' +
  '<div class="f-flap f-b"></div>' +
  '<div class="f-crease">' +
    '<img src="assets/img/harmos.png" alt=""/>' +
    '<span class="f-ch"></span>' +
  '</div>' +
  '<div class="f-label"></div>';
document.body.appendChild(fold);

const chLabel = fold.querySelector('.f-ch');
const label = fold.querySelector('.f-label');

let nextCi = 0;
const origNav = A.navMark;
A.navMark = function (ci) { nextCi = ci; return origNav(ci); };

const wipe = document.getElementById('clWipe');
if (!wipe) return;
wipe.style.transition = 'none';
wipe.style.background = 'transparent';
wipe.style.transform = 'scaleY(0)';

const gw = document.getElementById('clGlassWipe');
if (gw) { gw.style.display = 'none'; }

let state = 0;
new MutationObserver(function () {
  const tf = wipe.style.transform || '';
  const going = tf.indexOf('scaleY(1)') >= 0;
  const gone = tf.indexOf('scaleY(0)') >= 0;

  if (going && state === 0) {
    state = 1;
    const ch = A.CL.chapters[nextCi] || A.CL.chapters[0];
    chLabel.textContent = 'CH ' + String(ch.n).padStart(2, '0');
    label.textContent = ch.title.toUpperCase();
    fold.classList.add('on');
    setTimeout(function () { fold.classList.add('fold'); }, 160);
  }
  if (gone && state === 1) {
    state = 2;
    fold.classList.add('out');
    setTimeout(function () {
      fold.classList.remove('on', 'fold', 'out');
      state = 0;
    }, 650);
  }
}).observe(wipe, { attributes: true, attributeFilter: ['style'] });
})();
