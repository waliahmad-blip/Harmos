/* ═══ HARMOS · LOGO ROLES v1 — the mark as a character ═══ */
(function(){
if(!window.H || !window.gsap) return;
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const LOGO = 'assets/img/harmos.png';

const st = document.createElement('style');
st.textContent = `
.role{display:grid;place-items:center;position:relative}
.role img,.roleimg{width:100%;height:100%;object-fit:contain;mix-blend-mode:screen;
  filter:drop-shadow(0 0 16px rgba(245,184,74,.5)) drop-shadow(0 0 40px rgba(245,184,74,.25))}
/* 1 · moon */
#moon.role{background:none!important;box-shadow:none!important}
#moon.role img{animation:breathe 6s ease-in-out infinite}
@keyframes breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
/* 2 · ember */
#preloader .role{width:66px;height:66px;animation:flick 1.1s infinite alternate}
@keyframes flick{from{transform:scale(1) rotate(-2deg)}to{transform:scale(1.1) rotate(2deg)}}
/* 3 · founder lamp */
.founderlamp{position:absolute;width:13%;transform:translate(-50%,-50%);pointer-events:none;
  mix-blend-mode:screen;filter:drop-shadow(0 0 12px var(--glow))}
/* 4 · seal */
#sealogo{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:58%;opacity:0;
  mix-blend-mode:screen;filter:drop-shadow(0 0 26px var(--glow));pointer-events:none;z-index:4}
/* 5 · ghostbane */
#bane{position:fixed;inset:0;z-index:83;display:grid;place-items:center;pointer-events:none;opacity:0}
#bane img{width:min(180px,40vw);mix-blend-mode:screen;filter:drop-shadow(0 0 40px rgba(245,184,74,.7)) drop-shadow(0 0 90px rgba(245,184,74,.4))}
/* 6 · crown */
#cero .crown{width:120px;height:120px;margin-bottom:10px}
/* 7 · wipe heart */
.wipelogo{position:fixed;left:50%;top:50%;z-index:61;width:min(140px,30vw);transform:translate(-50%,-50%);
  opacity:0;mix-blend-mode:screen;filter:drop-shadow(0 0 34px rgba(255,248,220,.8))}
`;
document.head.appendChild(st);
const img = () => { const i = new Image(); i.src = LOGO; i.alt = 'Harmos'; return i; };

/* ROLE 1 · THE MOON */
const moon = document.getElementById('moon');
if (moon) { moon.classList.add('role'); moon.appendChild(img()); }

/* ROLE 2 · THE FIRST EMBER */
const flame = document.querySelector('#preloader .flame');
if (flame) { const r = document.createElement('div'); r.className = 'role';
  r.appendChild(img()); flame.replaceWith(r); }

/* ROLE 3 · THE FOUNDER'S LAMP — bulb #1 in viewBox 640×90 sits at (42,42) */
const street = document.querySelector('.street');
if (street) { const s = img(); s.className = 'founderlamp';
  s.style.left = (42/640*100)+'%'; s.style.top = (42/90*100)+'%';
  street.style.position = 'relative'; street.appendChild(s);
  if (!RM) gsap.to(s, {scale:1.14, transformOrigin:'center', duration:1.6, yoyo:true, repeat:-1, ease:'sine.inOut'});
}

/* ROLE 4 · THE SEAL — flares behind every verdict */
const phone = document.getElementById('phone');
if (phone) { const s = img(); s.id = 'sealogo'; phone.appendChild(s);
  setInterval(() => { const v = document.getElementById('stamp');
    if (v && +getComputedStyle(v).opacity > .85 && s.dataset.on !== '1') {
      s.dataset.on = '1';
      gsap.fromTo(s, {opacity:0, scale:.5}, {opacity:.92, scale:1, duration:.5, ease:'back.out(2)'});
      setTimeout(() => { gsap.to(s, {opacity:0, duration:.6}); s.dataset.on = '0'; }, 2600);
    }}, 300);
}

/* ROLE 5 · GHOSTBANE — the logo is the weapon */
document.addEventListener('click', e => {
  if (!e.target.classList || !e.target.classList.contains('driftGhost')) return;
  const f = document.createElement('div'); f.id = 'bane';
  const i = img(); f.appendChild(i); document.body.appendChild(f);
  gsap.timeline()
    .fromTo(f, {opacity:0}, {opacity:1, duration:.12})
    .fromTo(i, {scale:.3}, {scale:1.25, duration:.3, ease:'back.out(2)'}, '<')
    .to(f, {opacity:0, duration:.5, delay:.15, onComplete:() => f.remove()});
});

/* ROLE 6 · THE KEEPER'S CROWN */
new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => {
  if (n.id === 'cero') { const c = document.createElement('div'); c.className = 'role crown';
    c.appendChild(img()); n.prepend(c); }
}))).observe(document.body, {childList:true});

/* ROLE 7 · THE WIPE'S HEART — every journey folds through the mark */
H.wipeTo = u => {
  const w = img(); w.className = 'wipelogo'; document.body.appendChild(w);
  gsap.timeline()
    .set('.wipe', {transformOrigin:'center', scale:0})
    .to('.wipe', {scale:1, duration:.38, ease:'power3.in'})
    .fromTo(w, {opacity:0, scale:.4}, {opacity:1, scale:1.1, duration:.32}, '-=.25')
    .add(() => location.href = u);
};
})();
