/* CALM MODE v2 — words rise slowly, in flat space, at reading pace */
(function () {
'use strict';
const A = window.CL_ENGINE_A; if (!A) return;
const orig = A.showBeat;
A.showBeat = function (ci, bi) {
  orig(ci, bi);
  const ws = document.querySelectorAll('#clBeat .w');
  ws.forEach((w, i) => {
    w.style.transition = 'opacity 1.6s cubic-bezier(.25,.6,.35,1)';
    w.style.transitionDelay = (i * 90) + 'ms';
    w.style.transform = 'translateY(6px)';
  });
};
})();
