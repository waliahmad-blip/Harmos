/* HARMOS WATCHDOG — last line of defense · zero dependencies */
setTimeout(function () {
  try {
    if (!window.H || !H._booted) {
      if (window.H && typeof H.boot === 'function') { console.warn('watchdog: boot never fired — firing now'); H.boot(); }
    }
  } catch (e) {}
}, 2500);
setTimeout(function () {
  var pl = document.getElementById('preloader'); if (!pl) return;
  console.warn('watchdog: forcing door open');
  pl.style.transition = 'opacity .5s'; pl.style.opacity = '0';
  setTimeout(function () { if (pl.parentNode) pl.parentNode.removeChild(pl); }, 600);
  var s = document.querySelector('.scene'); if (s) s.classList.add('active');
}, 7000);
