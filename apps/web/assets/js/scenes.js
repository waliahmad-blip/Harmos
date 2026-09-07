/* HARMOS // SCENES — per-page 3D worlds sharing the observation theme.
   squeeze (the method), ghosts (threats), lattice (economy), gate (quantum), void (text pages). */
(function (root) {
  "use strict";
  var TAU = Math.PI * 2;
  function es(t) { return t * t * (3 - 2 * t); }

  function ensure(cb) {
    function go() {
      var T = root.THREE;
      if (T && T.BufferGeometry && !T.BufferGeometry.prototype.setAttribute && T.BufferGeometry.prototype.addAttribute) {
        T.BufferGeometry.prototype.setAttribute = function (n, a) { return this.addAttribute(n, a); };
      }
      cb();
    }
    if (root.THREE) return go();
    var s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
    s.onload = go;
    s.onerror = function () { var n = document.getElementById("nogl"); if (n) n.style.display = "flex"; };
    document.head.appendChild(s);
  }

  var FRAG = [
    "precision highp float;varying vec3 vC;varying float vA;",
    "void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,0.,d);a*=a;",
    "gl_FragColor=vec4(vC*(.55+pow(a,3.))*a*vA,a*vA);}"
  ].join("\n");

  function glom(THREE) {
    var c = document.createElement("canvas"); c.width = c.height = 128;
    var x = c.getContext("2d"), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,.95)"); g.addColorStop(.3, "rgba(140,230,255,.2)");
    g.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }
  function mk(THREE, canvas) {
    var r = new THREE.WebGLRenderer({ canvas: canvas, antialias: false });
    r.setPixelRatio(Math.min(root.devicePixelRatio || 1, 1.75));
    r.setSize(innerWidth, innerHeight);
    return r;
  }
  function fit(r, cam, uni) {
    addEventListener("resize", function () {
      cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix();
      r.setSize(innerWidth, innerHeight); if (uni) uni.uPR.value = r.getPixelRatio();
    });
  }
  function points(THREE, N) {
    var g = new THREE.BufferGeometry(), aR = new Float32Array(N * 3), aS = new Float32Array(N), i;
    for (i = 0; i < N; i++) {
      aR[i * 3] = Math.random(); aR[i * 3 + 1] = Math.random(); aR[i * 3 + 2] = Math.random();
      aS[i] = .4 + Math.pow(Math.random(), 3) * 2.4;
    }
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    g.setAttribute("aR", new THREE.BufferAttribute(aR, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(aS, 1));
    return g;
  }

  /* ================= SQUEEZE — the method ================= */
  function squeeze(canvas) {
    var api = { demo: function () { if (api._i) api._i.demo(); } };
    ensure(function () {
      var THREE = root.THREE, r = mk(THREE, canvas), sc = new THREE.Scene(),
          cam = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, .1, 400),
          N = innerWidth < 760 ? 4000 : 9000, i, g = points(THREE, N),
          aT = new Float32Array(N);
      for (i = 0; i < N; i++) aT[i] = Math.random();
      g.setAttribute("aT", new THREE.BufferAttribute(aT, 1));
      var U = { uTime: { value: 0 }, uPR: { value: r.getPixelRatio() } };
      sc.add(new THREE.Points(g, new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: U,
        fragmentShader: FRAG,
        vertexShader: [
          "precision highp float;attribute float aT;attribute vec3 aR;attribute float aSize;",
          "uniform float uTime,uPR;varying vec3 vC;varying float vA;",
          "void main(){float u=fract(aT+uTime*.05);float z=24.-u*95.;",
          " float x=(aR.x-.5)*14.;float y=2.+(aR.y-.5)*7.;x+=sin(z*.08+uTime+aR.z*9.)*1.6;",
          " float sq=exp(-pow((z+20.)/5.5,2.));",
          " x*=mix(1.,.14,sq);y=2.+(y-2.)*mix(1.,.14,sq);",
          " float past=step(z,-21.);x*=mix(1.,.3,past);y=2.+(y-2.)*mix(1.,.3,past);",
          " vec4 mv=modelViewMatrix*vec4(vec3(x,y,z),1.);float d=-mv.z;",
          " gl_Position=projectionMatrix*mv;",
          " gl_PointSize=min(aSize*uPR*(1.+sq)*(200./max(d,.001)),9.*uPR)*smoothstep(0.,3.,d);",
          " float lit=min(1.,max(sq,past*.7));",
          " float fk=mix(.5+.5*sin(uTime*9.+aR.y*60.),1.,step(.3,lit));",
          " vC=mix(vec3(.2,.26,.34),vec3(.75,1.,1.),lit);",
          " vA=(.1+.8*lit)*fk*exp(-max(0.,d-45.)*.02);}"
        ].join("\n")
      })));
      var TG = THREE.TorusGeometry || THREE.TorusBufferGeometry;
      var ring1 = new THREE.Mesh(new TG(9, .14, 8, 160), new THREE.MeshBasicMaterial({ color: 0xbff7ff, transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false }));
      var ring2 = new THREE.Mesh(new TG(6.3, .07, 8, 120), new THREE.MeshBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: .8, blending: THREE.AdditiveBlending, depthWrite: false }));
      ring1.position.z = ring2.position.z = -20; sc.add(ring1, ring2);
      var dot = new THREE.Sprite(new THREE.SpriteMaterial({ map: glom(THREE), color: 0x8affff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
      sc.add(dot);
      var from = new THREE.Vector3(6, 4, 22), mid = new THREE.Vector3(0, 2, -20), to = new THREE.Vector3(0, 2, -74), pos = new THREE.Vector3();
      var anim = null;
      cam.position.set(0, 4, 28); cam.lookAt(0, 2, -30);
      fit(r, cam, U);
      var t = 0;
      (function frame() {
        requestAnimationFrame(frame); if (document.hidden) return;
        t += .016; U.uTime.value = t;
        ring1.rotation.z = t * .4; ring2.rotation.z = -t * .6;
        if (anim) {
          anim.t += .016; var q = anim.t / 2.6;
          if (q >= 1) { anim = null; dot.material.opacity = 0; }
          else {
            if (q < .5) pos.lerpVectors(from, mid, es(q * 2)); else pos.lerpVectors(mid, to, es((q - .5) * 2));
            dot.position.copy(pos);
            var flash = Math.exp(-Math.pow((q - .5) * 10, 2));
            dot.scale.set(5 + flash * 14, 5 + flash * 14, 1);
            dot.material.opacity = .95;
            var s = 1 + flash * .3; ring1.scale.set(s, s, 1); ring2.scale.set(s, s, 1);
          }
        }
        cam.position.x = Math.sin(t * .1) * 2;
        r.render(sc, cam);
      })();
      api._i = { demo: function () { if (!anim) anim = { t: 0 }; } };
    });
    return api;
  }

  /* ================= GHOSTS — threat model ================= */
  function ghosts(canvas, onStat) {
    var api = { target: function (i, v) { if (api._i) api._i.target(i, v); } };
    ensure(function () {
      var THREE = root.THREE, r = mk(THREE, canvas), sc = new THREE.Scene(),
          cam = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, .1, 600),
          CL = 10, P = innerWidth < 760 ? 320 : 620, N = CL * P, i, j;
      var pos = new Float32Array(N * 3), aC = new Float32Array(N), aR = new Float32Array(N * 3), aS = new Float32Array(N);
      for (i = 0; i < CL; i++) {
        var cx = (i % 2 ? 9 : -9) + (Math.random() - .5) * 4, cz = -18 - i * 12, cy = 4 + Math.random() * 5;
        for (j = 0; j < P; j++) {
          var k = i * P + j, a = Math.random() * TAU, rr = Math.pow(Math.random(), .6) * 3.4;
          pos[k * 3] = cx + Math.cos(a) * rr; pos[k * 3 + 1] = cy + Math.sin(a) * rr * .8; pos[k * 3 + 2] = cz + (Math.random() - .5) * 6;
          aC[k] = i; aR[k * 3] = Math.random(); aR[k * 3 + 1] = Math.random(); aR[k * 3 + 2] = Math.random();
          aS[k] = .4 + Math.pow(Math.random(), 2) * 2.2;
        }
      }
      var g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      g.setAttribute("aC", new THREE.BufferAttribute(aC, 1));
      g.setAttribute("aR", new THREE.BufferAttribute(aR, 3));
      g.setAttribute("aSize", new THREE.BufferAttribute(aS, 1));
      var cur = new Float32Array(CL), tgt = new Float32Array(CL);
      var litU = { value: cur };
      var U = { uTime: { value: 0 }, uPR: { value: r.getPixelRatio() }, uLit: litU };
      sc.add(new THREE.Points(g, new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: U,
        fragmentShader: FRAG,
        vertexShader: [
          "precision highp float;attribute float aC;attribute vec3 aR;attribute float aSize;",
          "uniform float uTime,uPR;uniform float uLit[10];varying vec3 vC;varying float vA;",
          "void main(){int gi=int(aC+.5);float lit=uLit[gi];",
          " vec3 p=position;p.x+=sin(uTime*.5+aR.x*20.)*1.4;p.y+=cos(uTime*.42+aR.y*20.)*1.1;",
          " p+=normalize(position+vec3(.001))*lit*(22.+aR.z*16.);p.y+=lit*7.;",
          " vec4 mv=modelViewMatrix*vec4(p,1.);float d=-mv.z;gl_Position=projectionMatrix*mv;",
          " gl_PointSize=min(aSize*uPR*(200./max(d,.001)),9.*uPR)*smoothstep(0.,3.,d);",
          " vC=mix(vec3(.15,.09,.26),vec3(.5,.85,1.),lit*step(.55,lit));",
          " vA=(.35+.4*aR.y)*(1.-lit)*exp(-max(0.,d-45.)*.022);}"
        ].join("\n")
      })));
      cam.position.set(0, 4, 16);
      fit(r, cam, U);
      var t = 0, last = -1;
      (function frame() {
        requestAnimationFrame(frame); if (document.hidden) return;
        t += .016; U.uTime.value = t;
        cam.position.x = Math.sin(t * .12) * 3 + Math.sin(t * .03) * 6;
        cam.position.z = 14 - Math.sin(t * .05) * 4;
        cam.lookAt(0, 3, -60);
        var dead = 0;
        for (var q = 0; q < CL; q++) {
          cur[q] += (tgt[q] - cur[q]) * .02; if (cur[q] > .9) dead++;
        }
        if (dead !== last) { last = dead; if (onStat) onStat(dead); }
        r.render(sc, cam);
      })();
      api._i = { target: function (i2, v) { tgt[i2] = v; } };
    });
    return api;
  }

  /* ================= LATTICE — the economy ================= */
  function lattice(canvas) {
    var api = { select: function (i2) { if (api._i) api._i.select(i2); } };
    ensure(function () {
      var THREE = root.THREE, r = mk(THREE, canvas), sc = new THREE.Scene(),
          cam = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, .1, 600),
          NODES = 70, N = innerWidth < 760 ? 4000 : 9000, i, j;
      var nv = [];
      for (i = 0; i < NODES; i++) {
        var y = 1 - i * 2 / (NODES - 1), rr = Math.sqrt(Math.max(0, 1 - y * y)), a = i * 2.3999632;
        nv.push([Math.cos(a) * rr * 24, y * 14, Math.sin(a) * rr * 24]);
      }
      var pairs = [];
      for (i = 0; i < NODES; i++) {
        var nb = [];
        for (j = 0; j < NODES; j++) {
          if (i === j) continue;
          var dx = nv[i][0] - nv[j][0], dy = nv[i][1] - nv[j][1], dz = nv[i][2] - nv[j][2];
          nb.push([dx * dx + dy * dy + dz * dz, j]);
        }
        nb.sort(function (a2, b2) { return a2[0] - b2[0]; });
        for (var e = 0; e < 3; e++) pairs.push([i, nb[e][1]]);
      }
      var pos = new Float32Array(N * 3), aI = new Float32Array(N), aR = new Float32Array(N * 3), aS = new Float32Array(N);
      for (i = 0; i < N; i++) {
        aR[i * 3] = Math.random(); aR[i * 3 + 1] = Math.random(); aR[i * 3 + 2] = Math.random();
        if (i < NODES) {
          pos[i * 3] = nv[i][0]; pos[i * 3 + 1] = nv[i][1]; pos[i * 3 + 2] = nv[i][2];
          aI[i] = i; aS[i] = 3.2;
        } else {
          var pr = pairs[(Math.random() * pairs.length) | 0], u = Math.random(),
              A = nv[pr[0]], B = nv[pr[1]];
          pos[i * 3] = A[0] + (B[0] - A[0]) * u + (Math.random() - .5) * .4;
          pos[i * 3 + 1] = A[1] + (B[1] - A[1]) * u + (Math.random() - .5) * .4;
          pos[i * 3 + 2] = A[2] + (B[2] - A[2]) * u + (Math.random() - .5) * .4;
          aI[i] = -1; aS[i] = .5 + Math.pow(Math.random(), 3) * 1.4;
        }
      }
      var g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      g.setAttribute("aI", new THREE.BufferAttribute(aI, 1));
      g.setAttribute("aR", new THREE.BufferAttribute(aR, 3));
      g.setAttribute("aSize", new THREE.BufferAttribute(aS, 1));
      var U = { uTime: { value: 0 }, uPR: { value: r.getPixelRatio() }, uSel: { value: new THREE.Vector2(-9, 0) } };
      sc.add(new THREE.Points(g, new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: U,
        fragmentShader: FRAG,
        vertexShader: [
          "precision highp float;attribute float aI;attribute vec3 aR;attribute float aSize;",
          "uniform float uTime,uPR;uniform vec2 uSel;varying vec3 vC;varying float vA;",
          "void main(){float node=aI>-.5?1.:0.;",
          " vec3 p=position;p+=normalize(position+.001)*sin(uTime*.6+aR.x*25.)*.5;",
          " vec4 mv=modelViewMatrix*vec4(p,1.);float d=-mv.z;gl_Position=projectionMatrix*mv;",
          " float sel=0.;",
          " if(abs(aI-uSel.x)<.5){float t=uSel.y;sel=1.5*exp(-t*1.2)*(0.6+0.4*sin(t*22.));",
          "   p+=normalize(position+.001)*exp(-t*1.4)*2.;}",
          " gl_PointSize=min(aSize*uPR*(1.+sel*.8)*(230./max(d,.001)),14.*uPR)*smoothstep(0.,3.,d);",
          " float breathe=1.8+1.2*sin(uTime*1.2+aR.y*9.);",
          " float pulse=step(.6,fract(uTime*.35+aR.z))*node;",
          " vC=mix(vec3(.18,.4,.5),mix(vec3(1.),vec3(.5,1.,1.),node),.35+.65*max(node*breathe*.06,pulse*.8)+sel);",
          " vA=(.12+.55*node+.25*(1.-node)+sel)*exp(-max(0.,d-55.)*.018);}"
        ].join("\n")
      })));
      cam.position.set(0, 6, 42);
      fit(r, cam, U);
      var t = 0, st = 0;
      addEventListener("scroll", function () {
        st = scrollY / Math.max(1, document.body.scrollHeight - innerHeight);
      }, { passive: true });
      (function frame() {
        requestAnimationFrame(frame); if (document.hidden) return;
        t += .016; U.uTime.value = t;
        U.uSel.value.y += .016;
        var rad = 46 - st * 14;
        cam.position.set(Math.sin(t * .06) * rad, 6 + st * 6, Math.cos(t * .06) * rad);
        cam.lookAt(0, 0, 0);
        r.render(sc, cam);
      })();
      api._i = { select: function (i2) { U.uSel.value.set(i2, 0); } };
    });
    return api;
  }

  /* ================= GATE — quantum ================= */
  function gate(canvas) {
    ensure(function () {
      var THREE = root.THREE, r = mk(THREE, canvas), sc = new THREE.Scene(),
          cam = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, .1, 600),
          N = innerWidth < 760 ? 3500 : 8000, i, g = points(THREE, N), aT = new Float32Array(N);
      for (i = 0; i < N; i++) aT[i] = Math.random();
      g.setAttribute("aT", new THREE.BufferAttribute(aT, 1));
      var U = { uTime: { value: 0 }, uPR: { value: r.getPixelRatio() }, uP: { value: 0 } };
      sc.add(new THREE.Points(g, new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: U,
        fragmentShader: FRAG,
        vertexShader: [
          "precision highp float;attribute float aT;attribute vec3 aR;attribute float aSize;",
          "uniform float uTime,uPR,uP;varying vec3 vC;varying float vA;",
          "void main(){float u=fract(aT+uTime*.04);",
          " float z=30.-u*80.;float rr=(1.-u)*30.+2.5;",
          " float a=u*14.0+aR.x*6.28+uTime*.3;",
          " vec3 p=vec3(cos(a)*rr,sin(a)*rr*.6,z);",
          " float d0=abs(z+44.);p*=mix(1.,.05,exp(-d0*d0*.01));",
          " vec4 mv=modelViewMatrix*vec4(p,1.);float dd=-mv.z;gl_Position=projectionMatrix*mv;",
          " gl_PointSize=min(aSize*uPR*(220./max(dd,.001))*(1.+step(dd,3.)),11.*uPR)*smoothstep(0.,3.,dd);",
          " float e=smoothstep(-30.,-46.,z);",
          " vC=mix(vec3(.35,.2,.75),mix(vec3(.6,.95,1.),vec3(1.),e),e);",
          " vA=(.2+.6*e)*exp(-max(0.,dd-60.)*.02);}"
        ].join("\n")
      })));
      var TG = THREE.TorusGeometry || THREE.TorusBufferGeometry;
      var ring = new THREE.Mesh(new TG(7, .25, 10, 180), new THREE.MeshBasicMaterial({ color: 0x8affff, transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false }));
      ring.position.z = -50; sc.add(ring);
      var halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glom(THREE), color: 0xbfe9ff, transparent: true, opacity: .35, blending: THREE.AdditiveBlending, depthWrite: false }));
      halo.scale.set(30, 30, 1); halo.position.z = -50; sc.add(halo);
      cam.position.set(0, 0, 34);
      fit(r, cam, U);
      var t = 0, st = 0;
      addEventListener("scroll", function () {
        st = scrollY / Math.max(1, document.body.scrollHeight - innerHeight);
      }, { passive: true });
      (function frame() {
        requestAnimationFrame(frame); if (document.hidden) return;
        t += .016; U.uTime.value = t; U.uP.value = st;
        cam.position.set(0, 0, 34 - st * 22);
        cam.position.x = Math.sin(t * .1) * 2;
        cam.lookAt(0, 0, -50);
        ring.rotation.z = t * .3; halo.material.opacity = .2 + .15 * Math.sin(t * 1.3);
        r.render(sc, cam);
      })();
    });
  }

  /* ================= VOID — quiet backdrop for text pages ================= */
  function voids(canvas) {
    ensure(function () {
      var THREE = root.THREE, r = mk(THREE, canvas), sc = new THREE.Scene(),
          cam = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, .1, 800),
          N = 1600, i, g = points(THREE, N);
      var pos = g.attributes.position.array;
      for (i = 0; i < N; i++) {
        pos[i * 3] = (Math.random() - .5) * 300;
        pos[i * 3 + 1] = (Math.random() - .5) * 140;
        pos[i * 3 + 2] = -Math.random() * 400;
      }
      var U = { uTime: { value: 0 }, uPR: { value: r.getPixelRatio() } };
      sc.add(new THREE.Points(g, new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: U,
        vertexShader: "uniform float uTime,uPR;varying float vA;void main(){vec3 p=position;p.x+=sin(uTime*.1+p.z*.02)*2.;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=min(1.6*uPR*(180./max(-mv.z,.001)),5.*uPR);vA=.35*exp(-max(0.,-mv.z-60.)*.01);}",
        fragmentShader: "varying float vA;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,0.,d);gl_FragColor=vec4(vec3(.5,.7,.8)*a*vA,a*vA);}"
      })));
      cam.position.z = 20; fit(r, cam, U);
      var t = 0, st = 0;
      addEventListener("scroll", function () { st = scrollY; }, { passive: true });
      (function frame() {
        requestAnimationFrame(frame); if (document.hidden) return;
        t += .016; U.uTime.value = t;
        cam.position.z = 20 - st * .02; r.render(sc, cam);
      })();
    });
  }

  root.Scenes = { squeeze: squeeze, ghosts: ghosts, lattice: lattice, gate: gate, void: voids };
})(window);

