/* ═══════════════════════════════════════════════════════════════════
   WEBGL EVERYWHERE v1 — the Chrono-Field + Transition WOW
   1 · A shader-driven 3D field behind every non-native chapter
   2 · The glass transition: orbits · rays · particle burst · chapter title
   ═══════════════════════════════════════════════════════════════════ */
(function () {
'use strict';
if (!window.THREE) return;
const A = window.CL_ENGINE_A; if (!A) return;
const CL = A.CL;
const el = A.el, rnd = A.rnd, TAU = A.TAU, E = A.E, sfx = A.sfx;
const PX = () => A.px(), PY = () => A.py();
const PR = Math.min(devicePixelRatio || 1, 1.6);
const MOBILE = matchMedia('(max-width:920px)').matches;
const NATIVE_GL = ['swarm', 'ignition', 'vault'];

/* per-chapter field shapes — every slide gets its own 3D character */
const ACT_COL = ['#FF5A5F', '#44EDF7', '#F5B84A', '#8FA8FF'];
const CFG = {
  timeline:   { shape: 'field',    count: 1300, spread: 13, speed: .30, links: true,  linkN: 100 },
  senses:     { shape: 'sphere',   count: 1500, spread: 4.2, speed: .45, links: false },
  deal60:     { shape: 'field',    count: 1100, spread: 11, speed: .55, links: true,  linkN: 80 },
  five:       { shape: 'clusters', count: 1400, spread: 10, speed: .28, links: false },
  receipt:    { shape: 'layers',   count: 1200, spread: 8.5, speed: .22, links: true,  linkN: 70 },
  lanes:      { shape: 'lanes',    count: 1500, spread: 12, speed: .80, links: false },
  worlds:     { shape: 'stars',    count: 1700, spread: 15, speed: .14, links: false },
  globe:      { shape: 'sphere',   count: 1600, spread: 5.2, speed: .38, links: false },
  grid:       { shape: 'grid',     count: 1200, spread: 12, speed: .30, links: true,  linkN: 110 },
  moneyflow:  { shape: 'torus',    count: 1400, spread: 4.8, speed: .50, links: false },
  honesty:    { shape: 'ring',     count: 1000, spread: 6.5, speed: .18, links: false },
  quantummask:{ shape: 'turb',     count: 1500, spread: 13, speed: .95, links: false },
  cta:        { shape: 'ring',     count: 1300, spread: 8.5, speed: .24, links: false }
};

/* ═══ PART 1 · THE CHRONO-FIELD ═══ */
(function () {
  const vis = document.getElementById('clVisual');
  if (!vis) return;
  const cv = el('canvas');
  cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;opacity:0;transition:opacity .6s';
  vis.insertBefore(cv, vis.firstChild);
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: false }); }
  catch (e) { cv.remove(); return; }
  renderer.setPixelRatio(PR);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, .1, 200);
  camera.position.z = 9.5;

  const pmat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 }, uPulse: { value: 0 },
      uColor: { value: new THREE.Color('#8FA8FF') }, uAlpha: { value: 0 }
    },
    vertexShader: [
      'attribute float aSize; attribute float aSeed;',
      'uniform float uTime, uPulse;',
      'varying float vA;',
      'void main(){',
      '  vec3 p = position;',
      '  p.x += sin(uTime*0.0004 + aSeed*6.28)*0.4;',
      '  p.y += cos(uTime*0.0003 + aSeed*4.0)*0.34;',
      '  vec4 mv = modelViewMatrix * vec4(p,1.0);',
      '  gl_PointSize = aSize * (1.0 + uPulse*1.3) * (150.0 / -mv.z);',
      '  vA = 0.45 + 0.55*sin(uTime*0.002 + aSeed*10.0);',
      '  gl_Position = projectionMatrix * mv;',
      '}'].join('\n'),
    fragmentShader: [
      'uniform vec3 uColor; uniform float uAlpha;',
      'varying float vA;',
      'void main(){',
      '  vec2 c = gl_PointCoord - 0.5;',
      '  float a = smoothstep(0.5, 0.05, length(c));',
      '  gl_FragColor = vec4(uColor, a * vA * uAlpha);',
      '}'].join('\n'),
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
  });
  const lmat = new THREE.LineBasicMaterial({
    color: 0x8fa8ff, transparent: true, opacity: .07,
    blending: THREE.AdditiveBlending, depthWrite: false });

  const shock = new THREE.Mesh(
    new THREE.RingGeometry(.97, 1, 80),
    new THREE.MeshBasicMaterial({ color: 0x44edf7, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }));
  scene.add(shock);

  let ptsObj = null, linesObj = null, cfg = null, pulse = 0, fade = 0;

  function build(c) {
    if (ptsObj) { scene.remove(ptsObj); ptsObj.geometry.dispose(); }
    if (linesObj) { scene.remove(linesObj); linesObj.geometry.dispose(); }
    const count = MOBILE ? Math.floor(c.count * .55) : c.count;
    const pos = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const seeds = new Float32Array(count);
    const sp = c.spread;
    for (let i = 0; i < count; i++) {
      let x = 0, y = 0, z = 0;
      switch (c.shape) {
        case 'sphere': { const yy = 1 - 2 * (i + .5) / count, r = Math.sqrt(1 - yy * yy), a = i * 2.39996;
          x = Math.cos(a) * r * sp; y = yy * sp; z = Math.sin(a) * r * sp; break; }
        case 'ring': { const a = i * TAU / count + rnd(-.12, .12), rr = sp * (.82 + rnd(0, .34));
          x = Math.cos(a) * rr; y = rnd(-sp * .24, sp * .24); z = Math.sin(a) * rr; break; }
        case 'lanes': { x = rnd(-sp, sp); y = (i % 2 ? 1 : -1) * sp * .2 + rnd(-.55, .55); z = rnd(-sp, sp) * .55; break; }
        case 'grid': { const s = Math.ceil(Math.sqrt(count)), gi = i % s, gj = Math.floor(i / s);
          x = (gi / s - .5) * sp * 1.7; y = rnd(-.35, .35); z = (gj / s - .5) * sp * 1.7; break; }
        case 'clusters': { const cl = i % 5, a = rnd(0, TAU);
          const cx = Math.cos(cl * TAU / 5) * sp * .52, cz = Math.sin(cl * TAU / 5) * sp * .52;
          const rr = Math.sqrt(Math.random()) * sp * .22;
          x = cx + Math.cos(a) * rr; y = (Math.random() - .5) * sp * .3; z = cz + Math.sin(a) * rr; break; }
        case 'layers': { const l = i % 5, a = rnd(0, TAU), rr = Math.sqrt(Math.random()) * sp * .46;
          x = Math.cos(a) * rr; y = (l - 2) * sp * .27; z = Math.sin(a) * rr; break; }
        case 'torus': { const a = i * TAU / count, b = rnd(0, TAU), r2 = sp * .3;
          x = (sp + r2 * Math.cos(b)) * Math.cos(a); y = r2 * Math.sin(b); z = (sp + r2 * Math.cos(b)) * Math.sin(a); break; }
        case 'turb': case 'stars': default:
          x = rnd(-sp, sp); y = rnd(-sp * .62, sp * .62); z = rnd(-sp, sp);
      }
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
      sizes[i] = 1 + Math.random() * 1.5; seeds[i] = Math.random() * 10;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    ptsObj = new THREE.Points(g, pmat);
    scene.add(ptsObj);
    if (c.links && !MOBILE) {
      const lp = [], n = c.linkN || 90;
      for (let k = 0; k < n; k++) {
        const i = (Math.random() * count) | 0, j = (Math.random() * count) | 0;
        lp.push(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2], pos[j * 3], pos[j * 3 + 1], pos[j * 3 + 2]);
      }
      const lg = new THREE.BufferGeometry();
      lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
      linesObj = new THREE.LineSegments(lg, lmat);
      scene.add(linesObj);
    }
  }

  /* chain onto showBeat: rebuild the field per chapter */
  const origShow = A.showBeat;
  A.showBeat = function (ci, bi) {
    origShow(ci, bi);
    const ch = CL.chapters[ci]; if (!ch) return;
    if (NATIVE_GL.indexOf(ch.scene) >= 0) { fade = 0; return; }
    cfg = CFG[ch.scene] || CFG.timeline;
    build(cfg);
    pmat.uniforms.uColor.value.set(ACT_COL[ch.act] || '#8FA8FF');
    lmat.color.set(ACT_COL[ch.act] || '#8FA8FF');
    shock.material.color.set(ACT_COL[ch.act] || '#44EDF7');
    fade = 0; pulse = 1;
  };

  let lw = 0, lh = 0;
  function resize() {
    const r = vis.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    if (r.width !== lw || r.height !== lh) {
      lw = r.width; lh = r.height;
      renderer.setSize(r.width, r.height, false);
      camera.aspect = r.width / r.height; camera.updateProjectionMatrix();
    }
    return true;
  }

  (function loop(t) {
    requestAnimationFrame(loop);
    if (document.hidden || !cfg) return;
    if (!resize()) return;
    fade = Math.min(1, fade + .02);
    pulse = Math.max(0, pulse - .02);
    cv.style.opacity = fade;
    pmat.uniforms.uTime.value = t;
    pmat.uniforms.uPulse.value = pulse;
    pmat.uniforms.uAlpha.value = fade * .85;
    const sp = cfg.speed;
    scene.rotation.y = t * .00008 * sp + PX() * .45;
    scene.rotation.x = PY() * .3 + Math.sin(t * .0001) * .06;
    camera.position.x = PX() * 1.4;
    camera.position.y = -PY() * .9;
    camera.lookAt(0, 0, 0);
    if (linesObj) lmat.opacity = fade * (.05 + pulse * .1);
    if (pulse > 0) {
      const k = 1 - pulse;
      shock.scale.setScalar(.4 + k * 9);
      shock.material.opacity = pulse * .5;
    } else shock.material.opacity = 0;
    renderer.render(scene, camera);
  })(0);
})();

/* ═══ PART 2 · TRANSITION WOW — orbits · rays · burst · chapter title ═══ */
(function () {
  const gw = document.getElementById('clGlassWipe');
  if (!gw) return;

  /* orbit rings around the core */
  for (let i = 0; i < 3; i++) {
    const o = el('div', 'gw-orbit o' + (i + 1));
    o.appendChild(el('i'));
    gw.appendChild(o);
  }
  /* fx canvas — rays + particle burst */
  const fx = el('canvas'); fx.id = 'gwFx';
  gw.appendChild(fx);
  const fctx = fx.getContext('2d');
  /* incoming chapter label */
  const chEl = el('div', 'gw-ch',
    '<div class="gwc-n"></div><div class="gwc-t"></div><div class="gwc-a"></div>');
  gw.appendChild(chEl);

  /* capture destination: navMark is called first in every goTo */
  let nextCi = 0;
  const origNav = A.navMark;
  A.navMark = function (ci) { nextCi = ci; origNav(ci); };

  let burst = null;
  function fitFx() { fx.width = Math.round(innerWidth * PR); fx.height = Math.round(innerHeight * PR); }
  fitFx(); addEventListener('resize', fitFx);

  new MutationObserver(() => {
    if (gw.classList.contains('in') && !burst) {
      const ch = CL.chapters[nextCi] || CL.chapters[0];
      chEl.querySelector('.gwc-n').textContent = 'CHAPTER ' + String(ch.n).padStart(2, '0');
      chEl.querySelector('.gwc-t').textContent = ch.title.toUpperCase();
      chEl.querySelector('.gwc-a').textContent =
        'ACT ' + CL.acts[ch.act].id + ' — ' + CL.acts[ch.act].name.toUpperCase();
      burst = { t: 0, parts: [] };
      const base = ACT_COL[ch.act] || '#44EDF7';
      for (let i = 0; i < (MOBILE ? 70 : 130); i++) {
        burst.parts.push({ a: rnd(0, TAU), v: rnd(2.4, 12), r: rnd(0, 26),
          life: rnd(.65, 1), col: Math.random() < .45 ? base : (Math.random() < .6 ? '#8FA8FF' : '#44EDF7') });
      }
    }
  }).observe(gw, { attributes: true, attributeFilter: ['class'] });

  (function loop() {
    requestAnimationFrame(loop);
    fctx.clearRect(0, 0, fx.width, fx.height);
    if (!burst) return;
    burst.t += .016;
    const cx = fx.width / 2, cy = fx.height / 2;
    const k = Math.min(1, burst.t);
    /* radial light rays */
    for (let i = 0; i < 12; i++) {
      const a = burst.t * .6 + i * TAU / 12;
      const len = (70 + 300 * E.out(k)) * PR;
      const g = fctx.createLinearGradient(cx, cy, cx + Math.cos(a) * len, cy + Math.sin(a) * len);
      g.addColorStop(0, 'rgba(143,168,255,.4)');
      g.addColorStop(1, 'rgba(143,168,255,0)');
      fctx.strokeStyle = g; fctx.lineWidth = 2 * PR;
      fctx.beginPath(); fctx.moveTo(cx, cy);
      fctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len); fctx.stroke();
    }
    /* particle burst */
    burst.parts.forEach(p => {
      p.r += p.v * PR; p.v *= .986; p.life -= .011;
      if (p.life <= 0) return;
      fctx.globalAlpha = Math.max(0, p.life);
      fctx.fillStyle = p.col;
      fctx.shadowColor = p.col; fctx.shadowBlur = 9 * PR;
      fctx.beginPath();
      fctx.arc(cx + Math.cos(p.a) * p.r, cy + Math.sin(p.a) * p.r, 2.3 * PR, 0, TAU);
      fctx.fill(); fctx.shadowBlur = 0;
    });
    fctx.globalAlpha = 1;
    if (burst.t > 2.6) burst = null;
  })();
})();

})();
