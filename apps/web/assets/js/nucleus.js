/* HARMOS // NUCLEUS ENGINE — the one continuous object:
   quantum foam -> unverified crystal -> lattice of proof.
   Observation (cursor) collapses geometry into solid truth.
   Core Three.js API only — runs on any local r6x+ UMD, CDN fallback. */
(function (root) {
  "use strict";
  var TAU = Math.PI * 2;

  function ensureTHREE(cb) {
    if (root.THREE) return cb();
    var s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
    s.onload = cb;
    s.onerror = function () { noGL(); };
    document.head.appendChild(s);
  }
  function noGL() {
    var n = document.getElementById("nogl");
    if (n) n.style.display = "flex";
  }
  function band(x, a, b) {
    var t = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  }
  function es(t) { return t * t * (3 - 2 * t); }

  /* ---------------- formations ---------------- */
  function buildFormations(N, NODES) {
    var i, j, F1 = new Float32Array(N * 3), F2 = new Float32Array(N * 3),
        F3 = new Float32Array(N * 3), RD = new Float32Array(N * 3), SZ = new Float32Array(N);

    for (i = 0; i < N; i++) {                                   /* 1 · foam */
      var r = 30 + Math.pow(Math.random(), .5) * 34,
          t = Math.random() * TAU, ph = Math.acos(2 * Math.random() - 1);
      F1[i*3] = r*Math.sin(ph)*Math.cos(t);
      F1[i*3+1] = 2 + r*Math.cos(ph)*.55;
      F1[i*3+2] = r*Math.sin(ph)*Math.sin(t)*.55 - 5;
    }
    var P = 3.4, R = 13.2, ROT = Math.PI/4;                     /* 2 · gem (superellipsoid surface) */
    for (i = 0; i < N; i++) {
      var gx = Math.random()*2-1, gy = Math.random()*2-1, gz = Math.random()*2-1;
      var nrm = Math.pow(Math.pow(Math.abs(gx),P)+Math.pow(Math.abs(gy),P)+Math.pow(Math.abs(gz),P), 1/P) || 1;
      var sx = gx/nrm*R, sy = gy/nrm*R*1.18, sz = gz/nrm*R;
      F2[i*3]   =  sx*Math.cos(ROT) - sz*Math.sin(ROT) + (Math.random()-.5)*.3;
      F2[i*3+1] = 2 + sy + (Math.random()-.5)*.3;
      F2[i*3+2] = (sx*Math.sin(ROT) + sz*Math.cos(ROT))*0.8 + (Math.random()-.5)*.3 - 5;
    }
    var nv = [];                                                /* 3 · lattice: 70 nodes + edge streams */
    for (i = 0; i < NODES; i++) {
      var y = 1 - i*2/(NODES-1), rr = Math.sqrt(Math.max(0,1-y*y)), a = i*2.3999632;
      nv.push([Math.cos(a)*rr*23, 2 + y*13, Math.sin(a)*rr*23 - 5]);
    }
    var pairs = [];
    for (i = 0; i < NODES; i++) {
      var nb = [];
      for (j = 0; j < NODES; j++) {
        if (i === j) continue;
        var dx = nv[i][0]-nv[j][0], dy = nv[i][1]-nv[j][1], dz = nv[i][2]-nv[j][2];
        nb.push([dx*dx+dy*dy+dz*dz, j]);
      }
      nb.sort(function(a,b){return a[0]-b[0];});
      for (var e = 0; e < 3; e++) pairs.push([i, nb[e][1]]);
    }
    for (i = 0; i < N; i++) {
      if (i < NODES) { F3[i*3]=nv[i][0]; F3[i*3+1]=nv[i][1]; F3[i*3+2]=nv[i][2]; }
      else {
        var pr = pairs[(Math.random()*pairs.length)|0], u = Math.random(),
            A = nv[pr[0]], B = nv[pr[1]];
        F3[i*3]   = A[0]+(B[0]-A[0])*u + (Math.random()-.5)*.5;
        F3[i*3+1] = A[1]+(B[1]-A[1])*u + (Math.random()-.5)*.5;
        F3[i*3+2] = A[2]+(B[2]-A[2])*u + (Math.random()-.5)*.5;
      }
    }
    for (i = 0; i < N; i++) {
      RD[i*3]=Math.random(); RD[i*3+1]=Math.random(); RD[i*3+2]=Math.random();
      SZ[i] = i < NODES ? 2.9+Math.random()*.5 : .35+Math.pow(Math.random(),3)*2.1;
    }
    return { F1:F1, F2:F2, F3:F3, RD:RD, SZ:SZ };
  }

  /* ---------------- universe ---------------- */
  function create(THREE, o) {
    var MO = innerWidth < 760, N = MO ? 8000 : 18000, NODES = 70;
    var canvas = o.canvas, mode = o.mode || "home";
    var renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false }); }
    catch (e) { noGL(); return null; }
    renderer.setPixelRatio(Math.min(root.devicePixelRatio || 1, 1.75));
    renderer.setSize(innerWidth, innerHeight);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(58, innerWidth/innerHeight, .1, 900);
    var C = new THREE.Vector3(0, 2, 0);
    if (!THREE.BufferGeometry.prototype.setAttribute && THREE.BufferGeometry.prototype.addAttribute) { THREE.BufferGeometry.prototype.setAttribute = function (n, a) { return this.addAttribute(n, a); }; }

    var f = buildFormations(N, NODES);
    var g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(f.F1, 3));
    g.setAttribute("P2", new THREE.BufferAttribute(f.F2, 3));
    g.setAttribute("P3", new THREE.BufferAttribute(f.F3, 3));
    g.setAttribute("aR", new THREE.BufferAttribute(f.RD, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(f.SZ, 1));

    var U = {
      uTime:{value:0}, uM:{value:0}, uL:{value:0}, uD:{value:0}, uV:{value:0},
      uPR:{value:renderer.getPixelRatio()}, uObs:{value:new THREE.Vector3(1e4,1e4,1e4)},
      uC:{value:C}, uPing:{value:new THREE.Vector4(0,0,0,9)}
    };
    var mat = new THREE.ShaderMaterial({
      transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, uniforms:U,
      vertexShader: [
        "precision highp float;",
        "attribute vec3 P2,P3,aR; attribute float aSize;",
        "uniform float uTime,uM,uL,uD,uV,uPR; uniform vec3 uObs,uC; uniform vec4 uPing;",
        "varying vec3 vC; varying float vA;",
        "float es(float t){return t*t*(3.0-2.0*t);}",
        "void main(){",
        " float m=es(uM), l=es(uL), d=es(uD);",
        " vec3 p=mix(position,P2,m); p=mix(p,P3,l);",
        " p=mix(p,uC+(aR-.5)*.12,d);",
        " float fl=length(position); float sw=uTime*(.25+.6/max(fl,1.))*(1.-m);",
        " float cs=cos(sw), sn=sin(sw); p.xz=mat2(cs,-sn,sn,cs)*p.xz;",
        " float prox=1.0-smoothstep(0.0,8.0,length(p-uObs));",
        " float pw=0.0;",
        " if(uPing.w<4.){ pw=exp(-abs(length(p-uPing.xyz)-uPing.w*14.0)*.35)*max(0.0,1.0-uPing.w*.3); }",
        " float crystal=m*(1.0-l);",
        " float v=max(max(uV*.6+.06,prox),pw);",
        " v=min(1.0,v+crystal*.12); v=mix(v,1.0,l*.75); v=mix(v,1.0,d);",
        " v*=mix(.5+.5*sin(uTime*9.0+aR.y*60.0),1.0,step(.42,v));",
        " vec4 mv=modelViewMatrix*vec4(p,1.0); float dist=-mv.z;",
        " gl_Position=projectionMatrix*mv;",
        " gl_PointSize=min(aSize*uPR*(1.0+.9*v)*(250.0/max(dist,.001)),12.0*uPR)*smoothstep(0.0,3.0,dist);",
        " vec3 ghost=vec3(.20,.26,.34);",
        " vec3 solid=mix(vec3(1.0),vec3(.86,.95,1.0),aR.x);",
        " float node=aSize>2.5?1.0:0.0;",
        " vC=mix(ghost,solid,v);",
        " vC=mix(vC,vec3(.45,.94,1.0),l*.6*(.4+.6*node));",
        " vA=(.05+.75*v+.3*d)*mix(.55,1.0,m)*mix(.6,1.0,l)*exp(-max(0.0,dist-60.0)*.016);",
        "}"].join("\n"),
      fragmentShader: [
        "precision highp float; varying vec3 vC; varying float vA;",
        "void main(){ float d=length(gl_PointCoord-.5);",
        " float a=smoothstep(.5,0.,d); a*=a;",
        " gl_FragColor=vec4(vC*(.55+pow(a,3.))*a*vA, a*vA); }"].join("\n")
    });
    var pts = new THREE.Points(g, mat); scene.add(pts);

    var halo = (function () {                                  /* cheap bloom substitute */
      var c = document.createElement("canvas"); c.width = c.height = 128;
      var x = c.getContext("2d"), gr = x.createRadialGradient(64,64,0,64,64,64);
      gr.addColorStop(0,"rgba(255,255,255,.9)"); gr.addColorStop(.3,"rgba(160,235,255,.16)");
      gr.addColorStop(1,"rgba(0,0,0,0)"); x.fillStyle = gr; x.fillRect(0,0,128,128);
      var s = new THREE.Sprite(new THREE.SpriteMaterial({ map:new THREE.CanvasTexture(c),
        transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false }));
      s.scale.set(54,54,1); s.position.copy(C); scene.add(s); return s;
    })();

    var mouse = new THREE.Vector2(0,0), ray = new THREE.Raycaster(),
        coarse = matchMedia("(pointer:coarse)").matches;
    addEventListener("pointermove", function (e) {
      mouse.set(e.clientX/innerWidth*2-1, -(e.clientY/innerHeight*2-1));
    }, { passive:true });
    function updateObs(t) {
      if (coarse) {                                            /* touch: the witness orbits by itself */
        var a = t*.7;
        U.uObs.value.set(C.x+Math.cos(a)*12, C.y+Math.sin(a*1.3)*7, C.z+Math.sin(a)*12);
        return;
      }
      ray.setFromCamera(mouse, camera);
      var oc = ray.ray.origin.clone().sub(C), b = 2*oc.dot(ray.ray.direction),
          cq = oc.lengthSq()-289, disc = b*b-4*cq;
      if (disc >= 0) {
        var s2 = Math.sqrt(disc), t0 = (-b-s2)/2, t1 = (-b+s2)/2, tt = t0>0?t0:(t1>0?t1:-1);
        if (tt > 0) { U.uObs.value.copy(ray.ray.origin).addScaledVector(ray.ray.direction, tt); return; }
      }
      var cl = oc.clone().addScaledVector(ray.ray.direction, -oc.dot(ray.ray.direction));
      if (cl.lengthSq() < 1e-5) cl.set(1,0,0);
      U.uObs.value.copy(cl).normalize().multiplyScalar(17).add(C);
    }
    var api = { /* public surface */
      progress: function (p) { api._p = p; },
      pulse: function () { U.uPing.value.set(U.uObs.value.x, U.uObs.value.y, U.uObs.value.z, 0); },
      _p: 0
    };
    addEventListener("pointerdown", function (e) {
      if (e.target.closest && e.target.closest("a,button")) return;
      api.pulse(); if (o.onPulse) o.onPulse();
    }, { passive:true });

    var clock = 0, RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
    var pS = 0;
    function frame() {
      requestAnimationFrame(frame);
      if (document.hidden) return;
      clock += RM ? .0001 : .016;
      pS += (api._p - pS) * .05;
      var p = pS;
      U.uTime.value = clock;
      if (mode === "boot") {
        U.uM.value = 0; U.uL.value = 0;
        U.uD.value = band(p, .52, .94);
        U.uV.value = band(p, .28, .6) * .95;
        var rad = 52 - U.uD.value * 22;
        camera.position.set(Math.cos(clock*.05)*rad, 6, Math.sin(clock*.05)*rad - 5);
        camera.lookAt(C);
        halo.material.opacity = .12 + U.uD.value * .8;
        halo.scale.setScalar(54 - U.uD.value * 26);
      } else {
        U.uM.value = band(p, .02, .16);
        U.uL.value = band(p, .66, .82);
        U.uV.value = band(p, .18, .5) * .8;
        U.uD.value = 0;
        var ang = p * Math.PI * 1.6 + Math.sin(clock*.08)*.12 + (coarse ? 0 : mouse.x*.22);
        var R2 = 44 - band(p, 0, .5)*14 + band(p, .62, 1)*16;
        camera.position.set(Math.cos(ang)*R2, 4 + Math.sin(p*4)*3 + (coarse?0:mouse.y*4), Math.sin(ang)*R2);
        camera.lookAt(0, 2, -5);
        halo.material.opacity = (.1 + .5*U.uV.value) * U.uM.value * (1-U.uL.value);
      }
      if (U.uPing.value.w < 4) U.uPing.value.w += .016*1.3; else U.uPing.value.w = 9;
      updateObs(clock);
      pts.rotation.y = clock * .02;
      renderer.render(scene, camera);
      if (o.onStats) o.onStats(U.uM.value * (U.uV.value*.85+.15)*(1-U.uL.value)*100 + U.uL.value*70);
    }
    frame();
    addEventListener("resize", function () {
      camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight); U.uPR.value = renderer.getPixelRatio();
    });
    return api;
  }

  /* ---------------- audio ---------------- */
  var ac = null, mst = null, muted = false;
  var audio = {
    ensure: function () {
      if (ac) return;
      try {
        ac = new (root.AudioContext || root.webkitAudioContext)();
        mst = ac.createGain(); mst.gain.value = .7; mst.connect(ac.destination);
        [48, 48.7].forEach(function (f) {
          var o = ac.createOscillator(), gn = ac.createGain(), lp = ac.createBiquadFilter();
          o.type = "sine"; o.frequency.value = f; gn.gain.value = .014;
          lp.type = "lowpass"; lp.frequency.value = 170;
          o.connect(gn); gn.connect(lp); lp.connect(mst); o.start();
        });
      } catch (e) {}
    },
    ping: function (f, dur, vol, type) {
      if (!ac || muted) return;
      var now = ac.currentTime, o = ac.createOscillator(), gn = ac.createGain();
      o.type = type || "sine"; o.frequency.value = f || 720;
      gn.gain.setValueAtTime(.0001, now);
      gn.gain.exponentialRampToValueAtTime(vol || .09, now + .012);
      gn.gain.exponentialRampToValueAtTime(.0001, now + (dur || .9));
      o.connect(gn); gn.connect(mst); o.start(now); o.stop(now + (dur || .9) + .1);
    },
    lock: function () { [523.25, 784, 1046.5].forEach(function (f, i) {
      setTimeout(function () { audio.ping(f, 1.6, .07, "triangle"); }, i * 90); }); },
    toggle: function () { this.ensure(); muted = !muted; if (mst) mst.gain.value = muted ? 0 : .7; return !muted; }
  };

  /* ---------------- shared UI ---------------- */
  function reveals() {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) e.target.classList.add("in"); });
    }, { threshold: .18 });
    document.querySelectorAll(".rv").forEach(function (el) { io.observe(el); });
  }
  function scrollLink(api) {
    var bar = document.querySelector(".prog");
    addEventListener("scroll", function () {
      var p = scrollY / Math.max(1, document.body.scrollHeight - innerHeight);
      api.progress(p); if (bar) bar.style.width = (p*100) + "%";
    }, { passive: true });
  }
  function countdown(el) {
    if (!el) return;
    var gate = new Date("2027-06-24T00:00:00");
    function upd() {
      var ms = Math.max(0, gate - new Date());
      var d = Math.floor(ms/864e5), h = Math.floor(ms%864e5/36e5),
          m = Math.floor(ms%36e5/6e4), s = Math.floor(ms%6e4/1e3);
      el.textContent = d + "D " + h + "H " + m + "M " + s + "S";
    }
    upd(); setInterval(upd, 1000);
  }

  function launch(opts) {
    ensureTHREE(function () {
      try {
        opts.canvas = document.getElementById(opts.canvas);
        var api = create(root.THREE, opts);
        if (!api) return;
        if (opts.autoScroll) scrollLink(api);
        if (opts.onReady) opts.onReady(api);
      } catch (e) { noGL(); }
    });
  }

  root.Nucleus = { launch: launch, audio: audio, reveals: reveals,
                   countdown: countdown, band: band };
})(window);

