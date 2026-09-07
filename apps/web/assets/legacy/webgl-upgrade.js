/* ═══════════════════════════════════════════════════════════════════
   WEBGL UPGRADE v1 — Three.js layer for the flagship scenes
   Swarm · Ignition · Vault → additive shader glow, true 3D, no cartoons
   Loads after film-upgrade.js. Falls back gracefully if THREE missing.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
'use strict';
if (!window.THREE) { console.warn('Harmos WebGL: three.min.js not found — keeping canvas scenes'); return; }
const A = window.CL_ENGINE_A; if (!A) return;
const CL = A.CL, DPR = A.DPR;
const el = A.el, rnd = A.rnd, TAU = A.TAU, E = A.E, sfx = A.sfx, SC = A.SCENES;
const PX = () => A.px(), PY = () => A.py();
const biOf = (b, c) => Math.max(0, c.beats.indexOf(b));
const PR = Math.min(devicePixelRatio || 1, 2);
const PREV = { swarm: SC.swarm, ignition: SC.ignition, vault: SC.vault };

/* ── GL harness: renderer + scene + camera + 2D overlay canvas ── */
function makeGL(vis) {
  const cv = el('canvas');
  cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
  vis.insertBefore(cv, vis.firstChild);
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: true, powerPreference: 'high-performance' }); }
  catch (e) { cv.remove(); return null; }
  renderer.setPixelRatio(PR);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, .1, 300);
  const ov = el('canvas');
  ov.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
  vis.appendChild(ov);
  let lw = 0, lh = 0;
  function resize() {
    const r = vis.getBoundingClientRect(); if (!r.width || !r.height) return false;
    if (r.width !== lw || r.height !== lh) {
      lw = r.width; lh = r.height;
      renderer.setSize(r.width, r.height, false);
      camera.aspect = r.width / r.height; camera.updateProjectionMatrix();
      ov.width = Math.round(r.width * PR); ov.height = Math.round(r.height * PR);
    }
    return true;
  }
  return { renderer, scene, camera, cv, ov, octx: ov.getContext('2d'), resize };
}

/* ── shared point shader: soft additive glow, depth-mixed color ── */
function pointsMat(hex, sizeMul) {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(hex) },
      uSize: { value: sizeMul || 1 }, uLight: { value: 0 } },
    vertexShader: [
      'attribute float aSize; attribute float aSeed;',
      'uniform float uTime, uSize, uLight;',
      'varying float vGlow; varying float vSeed;',
      'void main(){',
      '  vec3 p = position;',
      '  float d = length(p);',
      '  vGlow = clamp(1.0 - d / uLight, 0.0, 1.0);',
      '  vSeed = aSeed;',
      '  vec4 mv = modelViewMatrix * vec4(p, 1.0);',
      '  gl_PointSize = aSize * uSize * (140.0 / -mv.z);',
      '  gl_Position = projectionMatrix * mv;',
      '}'].join('\n'),
    fragmentShader: [
      'uniform vec3 uColor; varying float vGlow; varying float vSeed;',
      'void main(){',
      '  vec2 c = gl_PointCoord - 0.5;',
      '  float r = length(c);',
      '  float a = smoothstep(0.5, 0.04, r);',
      '  float tw = 0.75 + 0.25 * sin(vSeed * 12.0);',
      '  vec3 col = mix(uColor * 0.5, vec3(0.44, 0.93, 0.97), vGlow * 0.9);',
      '  gl_FragColor = vec4(col, a * (0.35 + vGlow * 0.65) * tw);',
      '}'].join('\n'),
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
  });
}
const lineMat = (hex, op) => new THREE.LineBasicMaterial({
  color: hex, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false });

/* ── lattice builder ── */
function buildLattice(N, spacing) {
  const pts = [], idx = [];
  const id = (i, j, k) => (i * N + j) * N + k;
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) for (let k = 0; k < N; k++) {
    pts.push((i - (N - 1) / 2) * spacing, (j - (N - 1) / 2) * spacing, (k - (N - 1) / 2) * spacing);
    if (i < N - 1) idx.push(id(i, j, k), id(i + 1, j, k));
    if (j < N - 1) idx.push(id(i, j, k), id(i, j + 1, k));
    if (k < N - 1) idx.push(id(i, j, k), id(i, j, k + 1));
  }
  const n = pts.length / 3;
  const sizes = new Float32Array(n), seeds = new Float32Array(n);
  for (let i = 0; i < n; i++) { sizes[i] = 1.5 + Math.random() * 1.1; seeds[i] = Math.random() * 10; }
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  pg.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  pg.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  const lp = [];
  for (let m = 0; m < idx.length; m += 2) {
    const a = idx[m], b = idx[m + 1];
    lp.push(pts[a * 3], pts[a * 3 + 1], pts[a * 3 + 2], pts[b * 3], pts[b * 3 + 1], pts[b * 3 + 2]);
  }
  const lg = new THREE.BufferGeometry();
  lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
  return { pg, lg };
}
function fibSphere(n, r) {
  const pts = [], sizes = new Float32Array(n), seeds = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const y = 1 - 2 * (i + .5) / n, rad = Math.sqrt(1 - y * y), a = i * 2.39996;
    pts.push(Math.cos(a) * rad * r, y * r, Math.sin(a) * rad * r);
    sizes[i] = 1.2 + Math.random(); seeds[i] = Math.random() * 10;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  g.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  return g;
}
const onePt = (size) => {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3));
  g.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array([size]), 1));
  g.setAttribute('aSeed', new THREE.BufferAttribute(new Float32Array([1]), 1));
  return g;
};

/* ═══════════════════════════════════════════════════════════════════
   CH1 · SWARM — WebGL lattice + 3D wireframe ghost records
   Cursor raycasts through space; touching a record dissolves it.
   ═══════════════════════════════════════════════════════════════════ */
SC.swarm = function (vis, ch) {
  const G = makeGL(vis); if (!G) return PREV.swarm(vis, ch);
  const { renderer, scene, camera, ov, octx, resize } = G;

  const lat = buildLattice(5, 1.35);
  const pmat = pointsMat('#8FA8FF', 2.1 * PR);
  scene.add(new THREE.Points(lat.pg, pmat));
  const lmat = lineMat(0x8fa8ff, .13);
  scene.add(new THREE.LineSegments(lat.lg, lmat));
  scene.add(new THREE.Points(onePt(7), pointsMat('#44EDF7', 1 * PR)));
  const shock = [];
  for (let i = 0; i < 3; i++) {
    const m = new THREE.Mesh(new THREE.RingGeometry(1, 1.04, 72),
      new THREE.MeshBasicMaterial({ color: 0x44edf7, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }));
    scene.add(m); shock.push(m);
  }

  const frames = [];
  function addFrame(burst) {
    const w = rnd(.9, 1.8), h = w * 1.3;
    const g = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(w, h)),
      new THREE.LineBasicMaterial({ color: 0xe8e4d8, transparent: true, opacity: .5,
        blending: THREE.AdditiveBlending, depthWrite: false }));
    const a = rnd(0, TAU), r = burst ? rnd(2.4, 4.6) : rnd(6.5, 9.5);
    g.position.set(Math.cos(a) * r, rnd(-3.2, 3.2), Math.sin(a) * r);
    g.userData = { r, a, sp: rnd(.1, .38) * (Math.random() < .5 ? 1 : -1), corrupt: 0, dying: 0 };
    scene.add(g); frames.push(g);
  }
  for (let i = 0; i < 6; i++) addFrame(false);

  const ndc = new THREE.Vector2(-10, -10), ray = new THREE.Raycaster();
  ray.params.Line.threshold = .25;
  G.cv.addEventListener('pointermove', e => {
    const r = G.cv.getBoundingClientRect();
    ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  }, { passive: true });
  G.cv.addEventListener('pointerleave', () => ndc.set(-10, -10));

  /* stats DOM — crisp, readable */
  let stats = null; const chips = [];
  function makeStats() {
    if (stats) stats.remove();
    stats = el('div'); vis.appendChild(stats);
    [{ c: 'cyan', n: 500000, p: '', s: '+', css: 'left:4%;top:9%', l: 'synthetic files / month — caught only' },
     { c: '', n: 5, p: '$', s: 'T', css: 'left:50%;top:2%;transform:translateX(-50%)', l: 'lost to fraud every year' },
     { c: 'gold', n: 30, p: '', s: '%', css: 'right:4%;bottom:14%', l: 'COD parcels refused — Pakistan' },
     { c: '', n: 450000, p: '', s: '', css: 'left:6%;bottom:10%', l: 'rolled-back odometers — US, yearly' },
     { c: '', n: 650, p: '$', s: 'M', css: 'right:6%;top:13%', l: 'lost to fake lovers — one year' }
    ].forEach((d, i) => {
      const c = el('div', 'cl-stat ' + d.c, '<div class="cl-num"></div><div class="cl-lbl">' + d.l + '</div>');
      c.style.cssText = d.css + ';pointer-events:none;opacity:0'; c.style.transition = 'opacity .5s';
      stats.appendChild(c); chips[i] = c;
      const num = c.querySelector('.cl-num'), t1 = performance.now();
      (function step(now) { const p = Math.min(1, (now - t1) / 1500);
        num.textContent = d.p + Math.round(d.n * E.out(p)).toLocaleString() + d.s;
        if (p < 1) requestAnimationFrame(step); })(t1);
      setTimeout(() => c.style.opacity = 1, i * 120);
    });
  }

  let mode = 'void', light = 0, parts = [];
  const api = {
    setBeat(beat) {
      const f = beat.fx;
      if (f === 'void-real') mode = 'void';
      if (f === 'fracture') { mode = 'fracture'; sfx.sub();
        while (frames.length < 46) addFrame(true); }
      if (f === 'stat-flood') { mode = 'flood'; makeStats(); }
      const si = { 'stat-parcel': 2, 'stat-odo': 3, 'stat-heart': 4 }[f];
      if (si != null) chips.forEach((c, i) => { if (c) c.style.opacity = i === si ? 1 : .18; });
      if (f === 'swarm-turn') { mode = 'turn'; if (stats) stats.style.opacity = 0; }
      if (f === 'real-pixel') { mode = 'real'; light = 0; sfx.chime();
        shock.forEach((m, i) => { m.scale.setScalar(.1); m.material.opacity = .8; m.userData = { t: -i * .18 }; }); }
    },
    tick(t) {
      if (!resize()) return;
      /* camera: slow orbit + pointer tilt */
      scene.rotation.y = t * .00013;
      camera.position.set(PX() * 2.4, -PY() * 1.6, 9.5);
      camera.lookAt(0, 0, 0);
      pmat.uniforms.uTime.value = t;
      if (mode === 'real') { light = Math.min(9, light + .025); pmat.uniforms.uLight.value = light;
        lmat.opacity = .13 + Math.min(.25, light * .03); }
      else pmat.uniforms.uLight.value = light * .5;

      /* shockwaves */
      shock.forEach(m => {
        if (m.userData && m.userData.t !== undefined) {
          m.userData.t += .014; const k = m.userData.t;
          if (k > 0 && k < 1) { m.scale.setScalar(.4 + k * 7); m.material.opacity = (1 - k) * .7; }
          else if (k >= 1) m.material.opacity = 0;
        }
      });

      /* frames orbit + raycast dissolve */
      const spd = (mode === 'flood' || mode === 'turn') ? 2.2 : 1;
      let hit = null;
      if (ndc.x > -5) { ray.setFromCamera(ndc, camera);
        const its = ray.intersectObjects(frames, false);
        if (its.length) hit = its[0].object; }
      for (let i = frames.length - 1; i >= 0; i--) {
        const g = frames[i], u = g.userData;
        u.a += .0016 * u.sp * spd;
        const rr = u.r * (mode === 'fracture' || mode === 'flood' || mode === 'turn' ? 1 : 1);
        g.position.x = Math.cos(u.a) * rr; g.position.z = Math.sin(u.a) * rr;
        g.rotation.y = -u.a; g.rotation.z = Math.sin(t * .001 + u.a * 3) * .2;
        if (g === hit) u.corrupt += .05;
        if (mode === 'real' && Math.hypot(g.position.x, g.position.y, g.position.z) < light) u.corrupt += .02;
        if (u.corrupt >= 1) u.dying = 1;
        if (u.dying) {
          u.dying += .12; const k = Math.max(0, 1 - (u.dying - 1));
          g.scale.setScalar(k);
          g.position.x += rnd(-.05, .05); g.position.y += rnd(-.05, .05);
          if (k <= 0.02) {
            const v = g.position.clone().project(camera);
            const x = (v.x * .5 + .5) * ov.width, y = (-v.y * .5 + .5) * ov.height;
            for (let p = 0; p < 9; p++) parts.push({ x, y, vx: rnd(-2.4, 2.4), vy: rnd(-2.4, 2.4), life: 1 });
            scene.remove(g); g.geometry.dispose(); g.material.dispose(); frames.splice(i, 1);
            if (sfx.on) sfx.blip(); continue;
          }
        } else if (u.corrupt > 0) {
          g.material.opacity = .5 * (1 - u.corrupt * .5);
          g.rotation.z += u.corrupt * rnd(-.06, .06);
        }
      }

      renderer.render(scene, camera);

      /* overlay: dissolve particles */
      octx.clearRect(0, 0, ov.width, ov.height);
      for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i];
        p.life -= .018; p.x += p.vx * PR; p.y += p.vy * PR;
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        octx.globalAlpha = p.life;
        octx.fillStyle = p.life > .5 ? '#E8E4D8' : '#44EDF7';
        octx.fillRect(p.x, p.y, 2.6 * PR, 2.6 * PR); }
      octx.globalAlpha = 1;
    },
    destroy() { renderer.dispose(); }
  };
  return api;
};

/* ═══════════════════════════════════════════════════════════════════
   CH3 · IGNITION — WebGL grid floor, node, orbiting proof-rings, sunrise
   ═══════════════════════════════════════════════════════════════════ */
SC.ignition = function (vis, ch) {
  const G = makeGL(vis); if (!G) return PREV.ignition(vis, ch);
  const { renderer, scene, camera, resize } = G;

  /* grid floor */
  const fp = [];
  for (let i = -9; i <= 9; i++) {
    fp.push(-9, -2.4, i * .9, 9, -2.4, i * .9);
    fp.push(i * .9, -2.4, -9, i * .9, -2.4, 9);
  }
  const fg = new THREE.BufferGeometry();
  fg.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3));
  const fmat = lineMat(0x8fa8ff, .14);
  scene.add(new THREE.LineSegments(fg, fmat));

  /* core node + aura + far shell */
  const cmat = pointsMat('#44EDF7', 1 * PR);
  scene.add(new THREE.Points(onePt(8), cmat));
  scene.add(new THREE.Points(fibSphere(70, .8), pointsMat('#44EDF7', 1.4 * PR)));
  const shellMat = pointsMat('#8FA8FF', 1.8 * PR);
  scene.add(new THREE.Points(fibSphere(150, 6.8), shellMat));

  /* proof rings */
  const LABELS = ['ATTESTATION', 'LIGHT', 'MOTION', 'CHAIN'];
  const rings = LABELS.map((L, i) => {
    const r = 1.25 + i * .7;
    const m = new THREE.Mesh(new THREE.RingGeometry(r - .012, r, 110),
      new THREE.MeshBasicMaterial({ color: i % 2 ? 0x8fa8ff : 0x44edf7, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }));
    m.userData.dir = i % 2 ? -1 : 1;
    scene.add(m); return m;
  });
  const tags = LABELS.map((L, i) => {
    const d = el('div', 'cl-vtag', L);
    d.style.cssText = ['left:50%;top:6%;transform:translateX(-50%)',
      'right:2%;top:50%;transform:translateY(-50%)',
      'left:50%;bottom:8%;transform:translateX(-50%)',
      'left:2%;top:50%;transform:translateY(-50%)'][i] + ';pointer-events:none;opacity:0';
    vis.appendChild(d); return d;
  });
  const sealTag = el('div', 'cl-vtag gold', 'SEALED · TIMELESS · RETURNABLE');
  sealTag.style.cssText = 'left:50%;bottom:-2%;transform:translateX(-50%);pointer-events:none;opacity:0';
  vis.appendChild(sealTag);

  let lit = 0, sealP = 0, sunrise = 0, stage = 'question';
  const waves = [];
  const api = {
    setBeat(beat) {
      const f = beat.fx;
      const map = { 'question': 'question', 'ignite': 'ignite', 'zerith': 'ignite',
        'ring-attest': 'rings', 'ring-light': 'rings', 'ring-motion': 'rings', 'ring-chain': 'rings',
        'seal': 'seal', 'sunrise': 'sunrise' };
      stage = map[f] || stage;
      lit = { 'ring-attest': 1, 'ring-light': 2, 'ring-motion': 3, 'ring-chain': 4 }[f] || lit;
      if (f === 'ring-attest') sfx.sub();
      if (f === 'seal') { sealP = .01; sfx.chime(); }
      if (f === 'sunrise') { sunrise = .01; sfx.pad(); }
    },
    tick(t) {
      if (!resize()) return;
      camera.position.set(PX() * 1.6, 1.6 - PY() * 1.2, 7.2);
      camera.lookAt(0, 0, 0);
      cmat.uniforms.uTime.value = t; shellMat.uniforms.uTime.value = t;
      fmat.opacity = .14 + (stage === 'sunrise' ? Math.min(.3, sunrise * .3) : 0);

      rings.forEach((m, i) => {
        const on = i < lit;
        m.material.opacity += ((on ? .75 : 0) - m.material.opacity) * .08;
        m.rotation.z += .004 * m.userData.dir;
        m.scale.setScalar(on ? 1 : .7);
        tags[i].style.opacity = on ? 1 : 0;
      });
      if (stage === 'question') {
        const q = .3 + .15 * Math.sin(t * .003);
        cmat.uniforms.uColor.value.setRGB(q * .56, q * .66, 1);
      }
      if (sealP > 0 && sealP < 1) {
        sealP += .03;
        sealTag.style.opacity = Math.min(1, sealP * 1.4);
      }
      if (sunrise > 0) {
        sunrise = Math.min(1, sunrise + .008);
        shellMat.uniforms.uColor.value.lerp(new THREE.Color('#44EDF7'), .02);
        shellMat.uniforms.uSize.value = 1.8 * PR + sunrise * 1.2 * PR;
        if (Math.random() < .1 && waves.length < 8) {
          const w = new THREE.Mesh(new THREE.RingGeometry(.98, 1, 90),
            new THREE.MeshBasicMaterial({ color: 0x44edf7, transparent: true, opacity: .5,
              blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }));
          w.userData = { t: 0 }; scene.add(w); waves.push(w);
        }
      }
      for (let i = waves.length - 1; i >= 0; i--) { const w = waves[i]; w.userData.t += .016;
        const k = w.userData.t; w.scale.setScalar(.5 + k * 8); w.material.opacity = .5 * (1 - k);
        if (k >= 1) { scene.remove(w); w.geometry.dispose(); w.material.dispose(); waves.splice(i, 1); } }

      renderer.render(scene, camera);
    },
    destroy() { renderer.dispose(); }
  };
  return api;
};

/* ═══════════════════════════════════════════════════════════════════
   CH15 · VAULT — WebGL infinite glass corridor + DOM countdown
   ═══════════════════════════════════════════════════════════════════ */
SC.vault = function (vis, ch) {
  const G = makeGL(vis); if (!G) return PREV.vault(vis, ch);
  const { renderer, scene, camera, ov, octx, resize } = G;
  camera.position.set(0, 0, 5.5);

  const panelMat = () => new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color('#44EDF7') }, uFade: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: [
      'uniform vec3 uColor; uniform float uFade; varying vec2 vUv;',
      'void main(){',
      '  vec2 d = min(vUv, 1.0 - vUv);',
      '  float b = min(d.x, d.y);',
      '  float edge = smoothstep(0.10, 0.0, b);',
      '  float fill = smoothstep(0.5, 0.0, b) * 0.12;',
      '  gl_FragColor = vec4(uColor, (edge * 0.9 + fill) * uFade);',
      '}'].join('\n'),
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide
  });
  const panels = [];
  for (let i = 0; i < 56; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.5), panelMat());
    m.position.set(rnd(-2.4, 2.4), rnd(-1.5, 1.5), -rnd(1.5, 58));
    m.rotation.z = rnd(-.1, .1);
    panels.push(m); scene.add(m);
  }
  scene.add(new THREE.Points(fibSphere(320, 40), pointsMat('#8FA8FF', 1.6 * PR)));

  /* DOM: years · horizon cards · countdown */
  const yr = el('div', 'cl-vaultyr', '2031');
  yr.style.cssText = 'left:50%;top:8%;transform:translateX(-50%);pointer-events:none;opacity:0';
  vis.appendChild(yr);
  const YEARS = ['2031', '2029', '2027', '2026'];
  let yrIdx = 0, yrT = 0, zkT = -1, proven = false;
  const cards = [['ZK PROOFS', 'TESTING · 2027', ''], ['ZKML', 'HORIZON', 'violet'], ['QUANTUM RNG', 'HORIZON', 'violet']]
    .map(c => { const d = el('div', 'cl-vtag ' + c[2], c[0] + ' — ' + c[1]);
      d.style.cssText = 'pointer-events:none;opacity:0'; vis.appendChild(d); return d; });
  cards[0].style.cssText = 'left:18%;top:6%;pointer-events:none;opacity:0';
  cards[1].style.cssText = 'left:50%;top:4%;transform:translateX(-50%);pointer-events:none;opacity:0';
  cards[2].style.cssText = 'right:16%;top:6%;pointer-events:none;opacity:0';
  let cdDom = null, cdIv = null;
  function buildCountdown() {
    cdDom = el('div', 'cl-count',
      '<div class="cl-cgrp"><div class="cl-cd" id="clCdD">000</div><span>DAYS</span></div><div class="cl-csep">:</div>' +
      '<div class="cl-cgrp"><div class="cl-cd" id="clCdH">00</div><span>HOURS</span></div><div class="cl-csep">:</div>' +
      '<div class="cl-cgrp"><div class="cl-cd" id="clCdM">00</div><span>MINUTES</span></div><div class="cl-csep">:</div>' +
      '<div class="cl-cgrp"><div class="cl-cd" id="clCdS">00</div><span>SECONDS</span></div>');
    vis.appendChild(cdDom);
    const LA = new Date(CL.countdownISO || '2027-06-22T00:00:00Z');
    const set = (id, v) => { const e = document.getElementById(id);
      if (e && e.textContent !== v) { e.textContent = v;
        e.style.transition = 'none'; e.style.transform = 'scale(1.16)'; e.style.opacity = .4;
        requestAnimationFrame(() => requestAnimationFrame(() => {
          e.style.transition = 'transform .45s cubic-bezier(.2,.8,.2,1), opacity .45s';
          e.style.transform = 'scale(1)'; e.style.opacity = 1; })); } };
    const tick = () => { const ms = Math.max(0, LA - Date.now());
      set('clCdD', String(Math.floor(ms / 864e5)).padStart(3, '0'));
      set('clCdH', String(Math.floor(ms / 36e5) % 24).padStart(2, '0'));
      set('clCdM', String(Math.floor(ms / 6e4) % 60).padStart(2, '0'));
      set('clCdS', String(Math.floor(ms / 1e3) % 60).padStart(2, '0')); };
    tick(); cdIv = setInterval(tick, 1000);
  }
  let stage = 0;

  const api = {
    setBeat(beat, c) { stage = biOf(beat, c);
      if (stage >= 1) yr.style.opacity = 1;
      if (stage === 2) zkT = 0;
      if (stage >= 3) cards.forEach(d => d.style.opacity = 1);
      if (stage >= 4 && !cdDom) { buildCountdown(); sfx.chime(); yr.style.opacity = 0; } },
    tick(t) {
      if (!resize()) return;
      camera.position.x = PX() * .9; camera.position.y = -PY() * .6;
      camera.lookAt(0, 0, -12);
      const spd = .06 + stage * .02 + (stage >= 4 ? .06 : 0);
      panels.forEach(m => {
        m.position.z += spd;
        if (m.position.z > 1.2) m.position.z -= 58;
        const k = Math.max(0, 1 - Math.abs(m.position.z) / 46);
        m.material.uniforms.uFade.value = k * .85;
        m.rotation.z += .0006;
      });
      if (stage <= 1 && t - yrT > 950) { yrT = t; yrIdx = (yrIdx + 1) % YEARS.length;
        yr.textContent = YEARS[yrIdx]; }
      if (stage >= 2) yr.style.opacity = stage === 2 ? 0 : 0;
      renderer.render(scene, camera);

      /* ZK cave on overlay — crisp, larger type */
      octx.clearRect(0, 0, ov.width, ov.height);
      if (stage === 2) {
        zkT += .016;
        const cx = ov.width / 2, cy = ov.height * .52, R = Math.min(ov.width, ov.height) * .3;
        octx.strokeStyle = 'rgba(143,168,255,.55)'; octx.lineWidth = 3 * PR;
        octx.beginPath(); octx.arc(cx, cy + R * .5, R, Math.PI * .12, Math.PI * .88); octx.stroke();
        const u = Math.sin(zkT * 4.2);
        const wx = cx + u * R * .62;
        octx.fillStyle = '#F4F1E8';
        octx.shadowColor = '#8FA8FF'; octx.shadowBlur = 12 * PR;
        octx.beginPath(); octx.arc(wx, cy - R * .1, 5 * PR, 0, TAU); octx.fill();
        octx.shadowBlur = 0;
        octx.font = '700 ' + (13 * PR) + 'px "Space Grotesk"';
        octx.fillStyle = '#44EDF7'; octx.textAlign = 'center';
        octx.fillText('RETURN ' + (u > 0 ? 'RIGHT' : 'LEFT') + '!', cx, cy - R * .95);
        octx.font = (11 * PR) + 'px "Space Grotesk"';
        octx.fillStyle = 'rgba(244,241,232,.65)';
        octx.fillText('ROUND ' + Math.min(3, Math.floor(zkT / 1.4) + 1) + ' OF 3', cx, cy - R * 1.22);
        if (zkT > 4.4 && !proven) { proven = true; sfx.chime(); }
        if (proven) { octx.font = '700 ' + (14 * PR) + 'px "Space Grotesk"';
          octx.fillStyle = '#44EDF7';
          octx.fillText('PROVEN — THE SECRET WAS NEVER SPOKEN', cx, ov.height * .92); }
      }
    },
    destroy() { if (cdIv) clearInterval(cdIv); renderer.dispose(); }
  };
  return api;
};

})();
