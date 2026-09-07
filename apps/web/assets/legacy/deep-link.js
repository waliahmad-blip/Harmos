/* DEEP LINK — film.html?ch=N opens the film AT chapter N (0-indexed) */
(function () {
'use strict';
const A = window.CL_ENGINE_A; if (!A) return;
const q = new URLSearchParams(location.search);
const n = parseInt(q.get('ch'), 10);
if (isNaN(n) || n < 0 || n >= A.CL.chapters.length) return;
let fb = true, fn = true;
const os = A.showBeat;
A.showBeat = function (ci, bi) {
  if (fb) { fb = false; return os(n, 0); }
  return os(ci, bi);
};
const on = A.navMark;
A.navMark = function (ci) {
  if (fn) { fn = false; return on(n); }
  return on(ci);
};
})();
