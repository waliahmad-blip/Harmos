/* ═══════════════════════════════════════════════════════════════
   HARMOS ENGINE v2 — complete · self-diagnosing · self-healing
   Every boot step is failure-isolated. The door cannot lock.
   ═══════════════════════════════════════════════════════════════ */
window.addEventListener('error', function (e) {
  console.warn('⚠️ Harmos radar:', e.message, '@', (e.filename || '?').split('/').pop() + ':' + e.lineno);
});
window.H = {};
(function () {

  var RM = false;
  try { RM = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  function lsGet(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function ssGet(k)    { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function ssSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }

  /* ═══ DATA ═══ */
  H.CAST = [
   {ava:"👵",name:"Nani Noreen, 74",tag:"The First Harmos",city:"Lahore",txt:"For fifty years she held the gold bangles until both sides smiled, then wrote the receipt in her diary. She is not a user of Harmos — she is what Harmos is. The elder at the well, back in every pocket."},
   {ava:"🔦",name:"Noorish, 21",tag:"Two-Lane Noorish",city:"Lahore",txt:"Pays $29.99 to audit her US freelance contract — and earns as a phone validator between classes. One girl, both lanes. The two-lane economy, walking."},
   {ava:"🚗",name:"Aliya, 29",tag:"The Squeeze",city:"Karachi",txt:"Buys a Civic on PakWheels. The odometer says 80,000 — the car whispers 180,000. Her phone squeezes the truth out. A $2 certificate vs an $8,000 mistake."},
   {ava:"🩺",name:"Dr. Amara, 44",tag:"The Witness with a License",city:"Nairobi",txt:"One of five blind experts who verify the world's hardest decisions. Global income, local life. She never sees the other four — independence is what makes her trustworthy."},
   {ava:"⚖️",name:"Elena, 39",tag:"The Signed Opinion",city:"London",txt:"Lawyer-validator. Her license, her signature, her insurance. Harmos stays the referee — referees don't score goals."},
   {ava:"🚜",name:"Kamau, 38",tag:"The Iron Buyer",city:"Nairobi",txt:"An excavator on Jiji with 'freshly reset' engine hours. Harmos reads the machine's memory — it forgets nothing. Paid out via M-Pesa in minutes."},
   {ava:"🐎",name:"Sarah, 34",tag:"The Long-Distance Trust",city:"Texas",txt:"Buys a '69 Camaro from a stranger in Michigan. Her money never leaves her bank until the verified car matches. Distance died."},
   {ava:"⌚",name:"Ahmed, 41",tag:"The Golden Receipt",city:"Dubai",txt:"His $40K Rolex arrives welded to its proof forever — camera, sound, light, chip. One day he builds Harmos Watches and earns the builder's share."}];

  H.GHOSTS = [
   {ico:"🦎",n:"The Chameleon",r:"Deepfake video calls — the $25M Hong Kong 'CFO'",k:"Killed by hardware attestation + live challenge"},
   {ico:"📼",n:"Mr. Replay",r:"Yesterday's video, played as 'live today'",k:"Killed by the light-flash a stolen video can't reflect"},
   {ico:"👥",n:"The Two Phones",r:"Remote scammer faking 'I'm in the room'",k:"Killed by the ultrasonic chirp both phones must hear"},
   {ico:"👻",n:"The Ghost Seller",r:"Sells what doesn't exist — COD parcels of bricks",k:"Killed by the Harmos Receipt + Release Signal"},
   {ico:"🪞",n:"The Polisher",r:"Odometer rollback — 450K rolled cars/yr in the US alone",k:"Killed by serial recording + Network Memory"},
   {ico:"⏱️",n:"The Flasher",r:"Resets machinery hour-meters before sale",k:"Killed by log oracles — the machine remembers"},
   {ico:"💌",n:"The Lonely Heart",r:"Romance & pig-butchering — $650M+ lost in a single year",k:"Killed by verified identity before money moves"},
   {ico:"🤖",n:"The Bot Choir",r:"Fake reviews, fake followers, fake love",k:"Killed by verified-creator attestations"},
   {ico:"📜",n:"The Certificate Forger",r:"Fake degrees, fake inspection papers",k:"Killed by hash-anchored originals"},
   {ico:"🏚️",n:"The Phantom Broker",r:"Fake listings & off-plan token fraud",k:"Killed by milestone-verified releases"}];

  H.PHASES = [
   {n:"0 · The First Lamp",lamps:1,h:"Days 1–7 — earn before the week ends",g:"Gate: 10 paid jobs",p:"No app yet. Founder, AI, WhatsApp and a payment link. Concierge audits at $19–99, live video verifies at $49–149. The founder is the first lamp."},
   {n:"1 · Streetlights",lamps:3,h:"Months 1–6 — the app ships",g:"Gate: 500 paid verifications",p:"$2 Truth Certificates. Hash-chained camera, consent engine, C2PA + on-chain receipts. Three verticals only: Autos, Docs, E-Comm."},
   {n:"2 · The Network",lamps:7,h:"Months 6–18 — the street starts earning",g:"Gate: 1 marketplace + 1,000 validators",p:"Five-witness consensus goes live. Validators paid through licensed rails. The 70/20/10 Promise, publicly attested. The Release Signal SDK lands in marketplaces."},
   {n:"3 · The Grid",lamps:12,h:"Year 2+ — the night ends",g:"Gate: enterprise contracts",p:"Enterprise API, continental shards, Supreme Arbitration, all seventy shops of the street lit. The elder at the well — at planetary scale."}];

  H.MENU = [["01","🏚️","The Street","index.html"],["02","🥭","The Squeeze","the-squeeze.html"],["03","👻","The Ghosts","the-ghosts.html"],["04","🔦","The Cast","the-cast.html"],["05","📖","The Book","the-book.html"],["06","💡","Earn a Lamp","earn.html"],["07","🏙️","For Giants","enterprise.html"],["08","✨","The Shops","the-shops.html"],["09","🌀","Quantum Verse","quantum.html"]];

  /* ═══ SOUND ═══ */
  H.sfx = {
    ctx: null, on: false,
    init: function () { try { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} },
    tone: function (f, d, t, v, s) {
      if (!this.on || !this.ctx) return;
      try {
        var c = this.ctx, o = c.createOscillator(), g = c.createGain(), n = c.currentTime;
        o.type = t || 'sine'; o.frequency.setValueAtTime(f, n);
        if (s) o.frequency.exponentialRampToValueAtTime(s, n + d);
        g.gain.setValueAtTime(v || .12, n); g.gain.exponentialRampToValueAtTime(.0001, n + d);
        o.connect(g); g.connect(c.destination); o.start(n); o.stop(n + d);
      } catch (e) {}
    },
    pad:   function () { this.tone(110, 1.4, 'sine', .07); this.tone(165, 1.4, 'sine', .05); },
    chime: function () { this.tone(660, .5); var self = this; setTimeout(function () { self.tone(880, .7); }, 140); },
    buzz:  function () { this.tone(160, .5, 'sawtooth', .1, 80); },
    blip:  function () { this.tone(520, .08, 'sine', .07); }
  };
  H.bindSound = function () {
    var b = document.getElementById('soundBtn'); if (!b) return;
    b.addEventListener('click', function () {
      H.sfx.init(); H.sfx.on = !H.sfx.on;
      b.textContent = H.sfx.on ? '🔊' : '🔇'; b.classList.toggle('on', H.sfx.on);
      if (H.sfx.on) H.sfx.chime();
    });
  };

  /* ═══ TOAST ═══ */
  H.toast = function (m) {
    var t = document.getElementById('toast'); if (!t) return;
    t.textContent = m;
    if (window.gsap) {
      gsap.timeline().to(t, { y: '+=160', duration: .5, ease: 'back.out(1.6)' })
                     .to(t, { y: '-=160', duration: .5, ease: 'power2.in', delay: 2.4 });
    } else {
      t.style.transform = 'translate(-50%,24px)';
      setTimeout(function () { t.style.transform = 'translate(-50%,-140%)'; }, 2600);
    }
  };

  /* ═══ TEXT + ENTER ═══ */
  H.split = function (el) {
    el.innerHTML = el.textContent.trim().split(' ').map(function (w) { return '<span class="rev">' + w + '</span>'; }).join(' ');
    return el.querySelectorAll('.rev');
  };
  H.enter = function () {
    var s = document.querySelector('.scene.active'); if (!s || !window.gsap) return;
    var tl = gsap.timeline();
    s.querySelectorAll('.split').forEach(function (sp, si) {
      tl.from(H.split(sp), { y: 34, autoAlpha: 0, rotateX: -40, duration: .7, stagger: .05, ease: 'back.out(1.6)' }, si * .16);
    });
    tl.from(s.querySelectorAll('.sub,.btn,.stats,.lockwrap,.ritual,.chips,.castnav,.ghosts,.steps,.street,.phasebox,form,.micro,.eyebrow,.stations,.lanes,.tiers,.cases,.rules,#sky-wrap,.jumpgrid,.honesty,#stationBox,.ladder,.qvill,.cave,.arsenal,.cd,.badge-soon,.gate-label,.proof,.cavemath'),
      { y: 24, autoAlpha: 0, duration: .6, stagger: .06, ease: 'power3.out' }, '-=.5');
  };

  /* ═══ PRELOADER v2 — cannot freeze ═══ */
  H.preload = function (cb) {
    var pl = document.getElementById('preloader');
    var pct = document.getElementById('pct'), bar = document.getElementById('bar');
    if (!pl) { if (cb) cb(); return; }
    var seen = !!ssGet('harmos_seen'); ssSet('harmos_seen', '1');
    var step = seen ? 26 : 14, tick = seen ? 45 : 130, p = 0;
    var t = setInterval(function () {
      p = Math.min(100, p + step * Math.random() + 2);
      if (pct) pct.textContent = Math.floor(p);
      if (bar) bar.style.width = p + '%';
      if (p >= 100) {
        clearInterval(t);
        var finish = function () { if (pl.parentNode) pl.parentNode.removeChild(pl); if (cb) cb(); };
        if (window.gsap) {
          try { gsap.to(pl, { autoAlpha: 0, duration: .6, delay: .2, onComplete: finish }); }
          catch (e) { finish(); }
        } else finish();
      }
    }, tick);
  };

  /* ═══ NAV WIPE ═══ */
  H.wipeTo = function (u) {
    if (window.gsap) {
      gsap.timeline().to('.wipe', { scaleY: 1, duration: .4, ease: 'power3.in', transformOrigin: 'bottom' })
                     .add(function () { location.href = u; });
    } else location.href = u;
  };
  H.bindNav = function () {
    document.querySelectorAll('a[data-nav]').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); H.closeMenu(); H.wipeTo(a.getAttribute('href')); });
    });
  };

  /* ═══ MENU ═══ */
  H.openMenu = function () {
    var m = document.getElementById('menu'); if (!m) return;
    m.style.display = 'flex';
    if (window.gsap) {
      gsap.fromTo(m, { autoAlpha: 0 }, { autoAlpha: 1, duration: .3 });
      gsap.fromTo('#menu .mcard', { y: 26, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .45, stagger: .05, ease: 'back.out(1.5)' });
    } else m.style.opacity = 1;
  };
  H.closeMenu = function () {
    var m = document.getElementById('menu'); if (!m || m.style.display !== 'flex') return;
    if (window.gsap) gsap.to(m, { autoAlpha: 0, duration: .25, onComplete: function () { m.style.display = 'none'; } });
    else m.style.display = 'none';
  };
  H.bindMenu = function () {
    var m = document.getElementById('menu'), b = document.getElementById('burger');
    if (m && !m.dataset.built) {
      m.innerHTML = '<button id="menuClose" aria-label="Close">✕</button><div class="mgrid">' +
        H.MENU.map(function (x) { return '<a class="mcard" data-nav href="' + x[3] + '"><div class="mn">' + x[0] + '</div><div class="mi">' + x[1] + '</div><div class="mt">' + x[2] + '</div></a>'; }).join('') +
        '</div>';
      m.dataset.built = '1';
      var c = document.getElementById('menuClose');
      if (c) c.addEventListener('click', H.closeMenu);
    }
    if (b) b.addEventListener('click', H.openMenu);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') H.closeMenu(); });
  };

  /* ═══ SKY (stars + fireflies) ═══ */
  H.sky = function () {
    var c = document.getElementById('ff'); if (!c) return;
    var x = c.getContext('2d'); if (!x) return;
    var W, Hh; var st = [], fl = [];
    function rs() {
      W = c.width = innerWidth * devicePixelRatio; Hh = c.height = innerHeight * devicePixelRatio;
      c.style.width = innerWidth + 'px'; c.style.height = innerHeight + 'px';
    }
    rs(); addEventListener('resize', rs);
    for (var i = 0; i < 110; i++) st.push({ x: Math.random(), y: Math.random() * .55, r: Math.random() * 1.3 + .3, ph: Math.random() * 7, s: Math.random() * .0015 + .0005 });
    for (var j = 0, n = innerWidth < 700 ? 24 : 52; j < n; j++) fl.push({ x: Math.random(), y: Math.random(), r: Math.random() * 2 + .6, vx: (Math.random() - .5) * .0006, vy: (Math.random() - .5) * .0004, ph: Math.random() * 7, g: Math.random() > .75 });
    var vis = true;
    document.addEventListener('visibilitychange', function () { vis = !document.hidden; });
    (function loop(t) {
      requestAnimationFrame(loop); if (!vis) return;
      x.clearRect(0, 0, W, Hh);
      for (var a = 0; a < st.length; a++) { var s = st[a]; var al = .25 + .45 * Math.abs(Math.sin(t * s.s + s.ph));
        x.beginPath(); x.arc(s.x * W, s.y * Hh, s.r * devicePixelRatio, 0, 7); x.fillStyle = 'rgba(244,241,232,' + (al * .7) + ')'; x.fill(); }
      for (var b = 0; b < fl.length; b++) { var p = fl[b];
        if (!RM) { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > 1) p.vx *= -1; if (p.y < 0 || p.y > 1) p.vy *= -1; }
        var aa = .22 + .32 * Math.abs(Math.sin(t / 900 + p.ph));
        x.beginPath(); x.arc(p.x * W, p.y * Hh, p.r * devicePixelRatio, 0, 7);
        x.fillStyle = p.g ? 'rgba(68,237,247,' + aa + ')' : 'rgba(245,184,74,' + aa + ')';
        x.shadowColor = p.g ? '#44EDF7' : '#F5B84A'; x.shadowBlur = 12 * devicePixelRatio; x.fill(); }
    })(0);
  };

  /* ═══ CURSOR ═══ */
  H.cursor = function () {
    var d = document.getElementById('curDot'), r = document.getElementById('curRing'); if (!d || !r) return;
    if (matchMedia('(pointer:coarse)').matches) return;
    var mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    addEventListener('pointermove', function (e) { mx = e.clientX; my = e.clientY; d.style.transform = 'translate(' + (mx - 3) + 'px,' + (my - 3) + 'px)'; });
    (function lerp() { requestAnimationFrame(lerp); rx += (mx - rx) * .14; ry += (my - ry) * .14; r.style.transform = 'translate(' + (rx - 17) + 'px,' + (ry - 17) + 'px)'; })();
  };

  /* ═══ MAGNETIC BUTTONS ═══ */
  H.mag = function () {
    if (!window.gsap) return;
    document.querySelectorAll('[data-mag]').forEach(function (el) {
      el.addEventListener('pointerenter', function () { document.body.classList.add('cur-hot'); });
      el.addEventListener('pointerleave', function () {
        document.body.classList.remove('cur-hot');
        gsap.to(el, { x: 0, y: 0, duration: .45, ease: 'elastic.out(1,.4)' });
      });
      el.addEventListener('pointermove', function (e) {
        var b = el.getBoundingClientRect();
        gsap.to(el, { x: (e.clientX - b.left - b.width / 2) * .25, y: (e.clientY - b.top - b.height / 2) * .25, duration: .3 });
      });
      el.addEventListener('click', function (e) {
        var b = el.getBoundingClientRect(), s = document.createElement('span');
        s.className = 'ripple'; var dd = Math.max(b.width, b.height) * 2.2;
        s.style.cssText += 'width:' + dd + 'px;height:' + dd + 'px;left:' + (e.clientX - b.left - dd / 2) + 'px;top:' + (e.clientY - b.top - dd / 2) + 'px';
        el.appendChild(s);
        gsap.to(s, { scale: 1, opacity: 0, duration: .7, ease: 'power2.out', onComplete: function () { s.remove(); } });
      });
    });
  };

  /* ═══ THE RITUAL (phone demo) ═══ */
  H.ritual = function () {
    var phone = document.getElementById('phone'); if (!phone || !window.gsap) return;
    var chips = [].slice.call(document.querySelectorAll('#chips .chip'));
    var rings = document.getElementById('rings'); if (rings) for (var i = 0; i < 3; i++) { var d = document.createElement('div'); d.className = 'ring'; rings.appendChild(d); }
    var busy = false, hashT = null;
    function reset() {
      gsap.set(['#flash', '#scan', '#imu', '#hashbar'], { clearProps: 'all' });
      gsap.set('#stamp', { opacity: 0, scale: 2.4 });
      chips.forEach(function (c) { c.classList.remove('on', 'bad'); });
      var hb = document.getElementById('hashbar'); if (hb) hb.textContent = '';
      clearInterval(hashT);
    }
    function chip(i, ok) { if (chips[i]) chips[i].classList.add(ok ? 'on' : 'bad'); ok ? H.sfx.blip() : H.sfx.buzz(); }
    function typeHash() {
      var hb = document.getElementById('hashbar'); if (!hb) return;
      var n = 0, hex = '0123456789abcdef';
      hashT = setInterval(function () {
        var s = ''; for (var i = 0; i < 10; i++) s += hex[Math.random() * 16 | 0];
        hb.textContent = 'SHA-512 ▸ ' + s;
        if (++n > 10) clearInterval(hashT);
      }, 90);
    }
    function run(ok) {
      if (busy) return; busy = true; reset();
      var st = document.getElementById('stamp'); if (!st) { busy = false; return; }
      st.textContent = ok ? 'VERIFIED ✅' : 'REJECTED ❌'; st.classList.toggle('bad', !ok);
      var obj = document.getElementById('obj'); if (obj) obj.textContent = ok ? '🥭' : '🦎';
      var bv = document.getElementById('doVerify'), bf = document.getElementById('doFake');
      if (bv) bv.style.opacity = .4; if (bf) bf.style.opacity = .4;
      var tl = gsap.timeline({ onComplete: function () { busy = false; if (bv) bv.style.opacity = 1; if (bf) bf.style.opacity = 1; } });
      tl.call(function () { chip(0, ok) })
        .set('#scan', { opacity: 1 }).fromTo('#scan', { top: '18%' }, { top: '46%', duration: ok ? 1.1 : .5, ease: 'none' })
        .to('#flash', { opacity: ok ? .55 : .8, duration: .14, repeat: ok ? 6 : 3, yoyo: true }, '<')
        .set(['#flash', '#scan'], { opacity: 0 });
      tl.call(function () { chip(1, ok) });
      for (var r = 0; r < 3; r++) {
        tl.fromTo('.ring', { width: 0, height: 0, opacity: .9 }, { width: 130, height: 130, opacity: 0, duration: 1, ease: 'power1.out' }, r * .32);
        tl.set('.ring', { width: 0, height: 0, opacity: 0 }, '>-0.05');
      }
      tl.call(function () { chip(2, ok) }).set('#imu', { opacity: 1 })
        .fromTo('#imuline', { strokeDasharray: 400, strokeDashoffset: 400 }, { strokeDashoffset: 0, duration: ok ? 1 : .5, ease: 'none' })
        .set('#imu', { opacity: 0 });
      tl.call(function () { chip(3, ok); typeHash(); }).set('#hashbar', { opacity: 1 })
        .to(phone, { rotation: ok ? 0 : 1.5, duration: .06, repeat: ok ? 0 : 8, yoyo: true, transformOrigin: 'center' }, '<')
        .to(st, { opacity: 1, scale: 1, duration: .5, ease: ok ? 'back.out(1.7)' : 'bounce.out' })
        .call(function () {
          ok ? H.sfx.chime() : H.sfx.buzz();
          H.toast(ok ? 'Verified. See, hear, feel, swear — all four passed.' : '🕯️ The light doesn\u2019t lie.');
        });
    }
    if (bv) bv.addEventListener('click', function () { run(true); });
    if (bf) bf.addEventListener('click', function () { run(false); });
  };

  /* ═══ WAITLIST (base — engage.js upgrades to oath) ═══ */
  H.waitlist = function () {
    var f = document.getElementById('waitlist'); if (!f || f.dataset.bound) return; f.dataset.bound = '1';
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var em = document.getElementById('email');
      if (!em || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em.value)) { H.toast('🕯️ A lamp needs a real email.'); return; }
      var l = lsGet('harmos_waitlist', []); if (l.indexOf(em.value) < 0) { l.push(em.value); lsSet('harmos_waitlist', l); }
      var b = f.querySelector('button');
      if (b) { b.innerHTML = '✦ Lamp Lit'; b.classList.remove('primary'); b.classList.add('ghosty'); }
      H.sfx.chime(); H.toast("You're on the street. We'll write soon. — Harmos");
    });
  };

  /* ═══ BOOT v2 — failure-isolated + self-healing ═══ */
  H.boot = function (pageInit) {
    H._booted = true;
    var safe = function (name, fn) { try { fn(); } catch (e) { console.warn('boot·' + name + ' skipped:', e.message); } };
    safe('sky', H.sky); safe('cursor', H.cursor); safe('menu', H.bindMenu);
    safe('nav', H.bindNav); safe('sound', H.bindSound); safe('waitlist', H.waitlist);
    H.preload(function () {
      safe('wipe', function () { if (window.gsap) gsap.set('.wipe', { scaleY: 0, transformOrigin: 'top' }); });
      safe('enter', H.enter);
      safe('pageInit', function () { if (pageInit) pageInit(); });
    });
    /* SELF-HEAL: if the preloader still stands after 6s, open the door ourselves */
    setTimeout(function () {
      var pl = document.getElementById('preloader'); if (!pl) return;
      console.warn('Harmos self-heal opened the door — the cause is warned above.');
      pl.style.transition = 'opacity .5s'; pl.style.opacity = '0';
      setTimeout(function () { if (pl.parentNode) pl.parentNode.removeChild(pl); }, 600);
      var s = document.querySelector('.scene'); if (s) s.classList.add('active');
    }, 6000);
  };

})();
