/*
 * Hero point cloud: a vineyard corridor rendered as LiDAR-style points,
 * coloured by height (viridis), with a small mowing robot driving down the
 * corridor and cutting the grass in its lane. Plain WebGL, no dependencies.
 *
 * To use real data instead of the synthetic scene, load a script before this
 * one that sets  window.POINTCLOUD = { positions: Float32Array [x,y,z,...] }
 * with x forward, y left, z up (metres), sensor near the origin.
 * The robot is only drawn on the synthetic scene, whose corridor geometry is known.
 */
(function () {
  "use strict";

  const canvas = document.getElementById("cloud");
  if (!canvas) return;
  const gl = canvas.getContext("webgl", { antialias: true, alpha: false, powerPreference: "low-power" });
  if (!gl) { canvas.remove(); return; }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- corridor geometry (shared by scene and robot) ---------- */
  const K = 0.0032;                           // corridor curvature
  const HALF = 1.3;                           // half corridor width (m)
  const L = 38;                               // corridor length drawn (m)
  const CUT = 0.15;                           // first-pass cut line, m left of centre
  const LANE = [CUT, 0.92];                   // strip the robot mows on its pass
  const ROBOT_OFF = 0.55;                     // robot centre, m left of centre
  const yc = (x) => K * x * x;
  const normal = (x) => { const dy = 2 * K * x, n = Math.hypot(1, dy); return [-dy / n, 1 / n]; };
  const at = (x, off) => { const [nx, ny] = normal(x); return [x + nx * off, yc(x) + ny * off]; };

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- synthetic scene ---------- */
  function buildScene() {
    const rnd = mulberry32(7);
    const gauss = () => { let u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    const pts = [];
    const grass = [];                          // per point: lateral offset if it is grass, else -9
    const push = (x, y, z, g = -9) => { pts.push(x, y, z); grass.push(g); };

    const rows = [
      { off: HALF, d: 1 }, { off: -HALF, d: 1 },
      { off: HALF + 2.6, d: .35 }, { off: -HALF - 2.6, d: .35 },
    ];
    for (const row of rows) {
      const side = Math.sign(row.off);
      for (let x = 1.5; x < L; x += 6) {                         // posts
        const [px, py] = at(x, row.off);
        for (let i = 0; i < 90 * row.d; i++) {
          const a = rnd() * Math.PI * 2;
          push(px + Math.cos(a) * .04, py + Math.sin(a) * .04, rnd() * 1.95);
        }
      }
      for (const wz of [0.95, 1.38, 1.8]) {                      // wires
        for (let x = 1.5; x < L; x += 0.07 / row.d) {
          const [px, py] = at(x, row.off);
          push(px, py, wz - 0.03 * Math.sin((x % 6) / 6 * Math.PI));
        }
      }
      for (let x = 0.6; x < L; x += 1.0) {                       // vines
        const vx = x + (rnd() - .5) * .2;
        const lean = (rnd() - .5) * .12;
        for (let i = 0; i < 26 * row.d; i++) {
          const z = rnd() * .9;
          const [px, py] = at(vx + lean * z, row.off + (rnd() - .5) * .05);
          push(px, py, z);
        }
        const vigour = .35 + rnd() * .9;
        const n = Math.round(330 * vigour * row.d);
        for (let i = 0; i < n; i++) {
          const z = .88 + Math.pow(rnd(), .85) * 1.02;
          const w = .14 + .2 * Math.sin(Math.PI * Math.min(1, (z - .85) / 1.05));
          // returns are biased towards the face of the canopy that looks into the corridor
          const lat = -side * Math.abs(gauss()) * w * .85 + side * rnd() * w * .35;
          const [px, py] = at(vx + (rnd() - .5) * 1.05, row.off + lat);
          push(px, py, z);
        }
      }
    }

    // ground: concentric scan rings (like a spinning LiDAR) + random fill
    const H = 0.95;
    function ground(x, y) {
      const off = y - yc(x);
      const inCorridor = Math.abs(off) < HALF - 0.2;
      let z = 0.025 * Math.sin(x * .7) + 0.02 * Math.sin(y * 1.9);
      if (inCorridor) {
        if (off < CUT) return [z + 0.03 + rnd() * .05, -9];
        return [z + 0.12 + Math.pow(rnd(), .7) * .36, off];
      }
      return [z + rnd() * .06, -9];
    }
    for (let k = 0; k < 30; k++) {
      const elev = (-16 + k * 0.5) * Math.PI / 180;
      const r = H / Math.tan(-elev);
      if (r > L + 8) break;
      const step = Math.max(0.0016, 0.05 / r);
      for (let a = -1.15; a < 1.15; a += step) {
        const x = Math.cos(a) * r, y = Math.sin(a) * r;
        if (x < 0 || x > L) continue;
        if (Math.abs(y - yc(x)) > HALF + 2.9) continue;
        const [z, g] = ground(x, y);
        push(x, y, z, g);
      }
    }
    for (let i = 0; i < 26000; i++) {
      const x = Math.pow(rnd(), 1.6) * L;
      const off = (rnd() * 2 - 1) * (HALF + .3);
      const [px, py] = at(x, off);
      const [z, g] = ground(px, py);
      push(px, py, z, g);
    }
    return { positions: new Float32Array(pts), grass: new Float32Array(grass) };
  }

  /* ---------- robot: a small four-wheeled mower, as points in its own frame ---------- */
  function buildRobot() {
    const rnd = mulberry32(11);
    const body = [];
    const box = (x0, x1, y0, y1, z0, z1, n) => {
      const ax = x1 - x0, ay = y1 - y0, az = z1 - z0;
      const faces = [ay * az, ay * az, ax * az, ax * az, ax * ay, ax * ay];
      const total = faces.reduce((a, b) => a + b, 0);
      for (let f = 0; f < 6; f++) {
        const m = Math.round(n * faces[f] / total);
        for (let i = 0; i < m; i++) {
          const u = rnd(), v = rnd();
          if (f === 0) body.push(x0, y0 + u * ay, z0 + v * az);
          if (f === 1) body.push(x1, y0 + u * ay, z0 + v * az);
          if (f === 2) body.push(x0 + u * ax, y0, z0 + v * az);
          if (f === 3) body.push(x0 + u * ax, y1, z0 + v * az);
          if (f === 4) body.push(x0 + u * ax, y0 + v * ay, z0);
          if (f === 5) body.push(x0 + u * ax, y0 + v * ay, z1);
        }
      }
    };
    const cyl = (cx, cy, r, z0, z1, n) => {
      for (let i = 0; i < n; i++) {
        const a = rnd() * Math.PI * 2;
        body.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r, z0 + rnd() * (z1 - z0));
      }
    };
    box(-0.42, 0.42, -0.28, 0.28, 0.2, 0.46, 650);            // chassis
    box(-0.1, 0.3, -0.18, 0.18, 0.46, 0.54, 120);              // electronics bay
    cyl(0.22, 0, 0.022, 0.54, 0.95, 50);                      // mast
    cyl(0.22, 0, 0.065, 0.95, 1.04, 110);                      // LiDAR
    box(0.48, 0.8, -0.3, 0.3, 0.1, 0.16, 240);                 // mower deck, front
    box(0.42, 0.5, -0.04, 0.04, 0.14, 0.24, 60);               // deck arm

    // wheels: rim + tread + spokes, kept separate so they can turn
    const wheels = [];
    const R = 0.17, W = 0.09;
    for (const [wx, wy] of [[0.3, 0.36], [0.3, -0.36], [-0.3, 0.36], [-0.3, -0.36]]) {
      for (let i = 0; i < 90; i++) {                          // tread
        const a = rnd() * Math.PI * 2;
        wheels.push(wx, wy + (rnd() - .5) * W, a, R);
      }
      for (let s = 0; s < 5; s++) {                            // spokes (outer face)
        const a = s / 5 * Math.PI * 2;
        for (let i = 0; i < 8; i++) wheels.push(wx, wy + Math.sign(wy) * W / 2, a, R * i / 8);
      }
    }
    return { body: new Float32Array(body), wheels: new Float32Array(wheels) };
  }

  const external = window.POINTCLOUD && window.POINTCLOUD.positions;
  const scene = external ? { positions: external, grass: new Float32Array(external.length / 3).fill(-9) } : buildScene();
  const count = scene.positions.length / 3;
  const robot = external ? null : buildRobot();
  const robotCount = robot ? robot.body.length / 3 + robot.wheels.length / 4 : 0;
  const robotWorld = new Float32Array(robotCount * 3);

  /* ---------- GL setup ---------- */
  const vs = `
    attribute vec3 aPos;
    attribute float aGrass;
    uniform mat4 uMVP;
    uniform mat4 uMV;
    uniform float uScale;
    uniform float uMinSize;
    uniform float uReveal;
    uniform vec3 uSensor;
    uniform vec2 uShift;
    uniform float uCutX;
    uniform vec2 uLane;
    uniform float uGrow;
    varying float vH;
    varying float vFog;
    varying float vFront;
    varying float vHide;
    void main() {
      vec3 p = aPos;
      // grass in the robot's lane is mown once the deck has passed over it
      if (aGrass > uLane.x && aGrass < uLane.y && p.x < uCutX) {
        float stubble = 0.035 + 0.03 * fract(sin(dot(p.xy, vec2(12.9898, 78.233))) * 43758.5453);
        p.z = mix(min(p.z, stubble), p.z, uGrow);
      }
      vec4 mv = uMV * vec4(p, 1.0);
      gl_Position = uMVP * vec4(p, 1.0);
      gl_Position.xy += uShift * gl_Position.w;
      float depth = max(0.1, -mv.z);
      gl_PointSize = clamp(uScale / depth, uMinSize, uMinSize * 3.2);
      float range = distance(p, uSensor);
      vHide = step(uReveal, range);
      vFront = 1.0 - smoothstep(0.0, 1.6, uReveal - range);
      vH = clamp(p.z / 1.95, 0.0, 1.0);
      vFog = smoothstep(9.0, 46.0, depth);
    }`;
  const fs = `
    precision mediump float;
    uniform vec3 uBg;
    uniform float uRobot;
    uniform float uRobotFade;
    varying float vH;
    varying float vFog;
    varying float vFront;
    varying float vHide;
    vec3 viridis(float t) {
      const vec3 c0 = vec3(0.2777273272234177, 0.005407344544966578, 0.3340998053353061);
      const vec3 c1 = vec3(0.1050930431085774, 1.404613529898575, 1.384590162594685);
      const vec3 c2 = vec3(-0.3308618287255563, 0.214847559468213, 0.09509516302823659);
      const vec3 c3 = vec3(-4.634230498983486, -5.799100973351585, -19.33244095627987);
      const vec3 c4 = vec3(6.228269936347081, 14.17993336680509, 56.69055260068105);
      const vec3 c5 = vec3(4.776384997670288, -13.74514537774601, -65.35303263337234);
      const vec3 c6 = vec3(-5.435455855934631, 4.645852612178535, 26.3124352495832);
      return c0 + t * (c1 + t * (c2 + t * (c3 + t * (c4 + t * (c5 + t * c6)))));
    }
    void main() {
      if (vHide > 0.5) discard;
      vec2 c = gl_PointCoord - 0.5;
      if (dot(c, c) > 0.25) discard;
      vec3 col = viridis(0.1 + vH * 0.78) * 0.9;
      // the robot is the one thing drawn outside the height colour map
      col = mix(col, vec3(0.8, 0.86, 0.82), uRobot);
      col = mix(col, vec3(0.92, 1.0, 0.95), vFront * 0.7);
      col = mix(col, uBg, vFog * 0.92);
      col = mix(col, uBg, uRobot * (1.0 - uRobotFade));
      gl_FragColor = vec4(col, 1.0);
    }`;

  function shader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  const prog = gl.createProgram();
  gl.attachShader(prog, shader(gl.VERTEX_SHADER, vs));
  gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const aPos = gl.getAttribLocation(prog, "aPos");
  const aGrass = gl.getAttribLocation(prog, "aGrass");

  const sceneBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sceneBuf);
  gl.bufferData(gl.ARRAY_BUFFER, scene.positions, gl.STATIC_DRAW);
  const grassBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, grassBuf);
  gl.bufferData(gl.ARRAY_BUFFER, scene.grass, gl.STATIC_DRAW);
  const robotBuf = gl.createBuffer();
  if (robot) {
    gl.bindBuffer(gl.ARRAY_BUFFER, robotBuf);
    gl.bufferData(gl.ARRAY_BUFFER, robotWorld, gl.DYNAMIC_DRAW);
  }

  const U = {};
  for (const n of ["uMVP", "uMV", "uScale", "uMinSize", "uReveal", "uSensor", "uBg", "uShift",
    "uCutX", "uLane", "uGrow", "uRobot", "uRobotFade"]) U[n] = gl.getUniformLocation(prog, n);

  const BG = [0x16 / 255, 0x1c / 255, 0x19 / 255];
  gl.uniform3fv(U.uBg, BG);
  gl.uniform3fv(U.uSensor, [0, 0, 0.95]);
  gl.uniform2fv(U.uLane, LANE);
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(BG[0], BG[1], BG[2], 1);

  /* ---------- robot motion ---------- */
  const X0 = 1.5, X1 = 37, SPEED = 0.85;      // m, m, m/s
  const REGROW = 3;                           // s for the grass to come back before the next pass
  const state = { x: reduceMotion ? 10 : X0, grow: 0, fade: reduceMotion ? 1 : 0, wheel: 0, phase: "drive" };

  function placeRobot() {
    if (!robot) return;
    const [px, py] = at(state.x, ROBOT_OFF);
    const yaw = Math.atan(2 * K * state.x);
    const c = Math.cos(yaw), s = Math.sin(yaw);
    let o = 0;
    const b = robot.body;
    for (let i = 0; i < b.length; i += 3) {
      robotWorld[o++] = px + c * b[i] - s * b[i + 1];
      robotWorld[o++] = py + s * b[i] + c * b[i + 1];
      robotWorld[o++] = b[i + 2];
    }
    const w = robot.wheels, R = 0.17;
    for (let i = 0; i < w.length; i += 4) {
      const a = w[i + 2] - state.wheel, r = w[i + 3];
      const lx = w[i] + Math.cos(a) * r, ly = w[i + 1], lz = R + Math.sin(a) * r;
      robotWorld[o++] = px + c * lx - s * ly;
      robotWorld[o++] = py + s * lx + c * ly;
      robotWorld[o++] = lz;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, robotBuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, robotWorld);
  }

  function step(dt) {
    if (state.phase === "drive") {
      state.x += SPEED * dt;
      state.wheel += SPEED * dt / 0.17;
      state.fade = Math.min(1, state.fade + dt / 1.2);
      if (state.x >= X1) { state.phase = "regrow"; state.t = 0; }
    } else {
      state.t += dt;
      state.grow = Math.min(1, state.t / REGROW);
      state.fade = Math.max(0, 1 - state.t / 0.8);
      if (state.t >= REGROW) { state.phase = "drive"; state.x = X0; state.grow = 0; state.fade = 0; }
    }
    placeRobot();
  }

  /* ---------- camera ---------- */
  const target = [11, 0.5, 0.55];
  const cam = { yaw: Math.PI + 0.05, pitch: 0.3, dist: 15.5 };
  const home = { ...cam };

  function perspective(fovy, aspect, near, far) {
    const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0];
  }
  function lookAt(e, c, up) {
    let zx = e[0] - c[0], zy = e[1] - c[1], zz = e[2] - c[2];
    let l = Math.hypot(zx, zy, zz); zx /= l; zy /= l; zz /= l;
    let xx = up[1] * zz - up[2] * zy, xy = up[2] * zx - up[0] * zz, xz = up[0] * zy - up[1] * zx;
    l = Math.hypot(xx, xy, xz); xx /= l; xy /= l; xz /= l;
    const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    return [xx, yx, zx, 0, xy, yy, zy, 0, xz, yz, zz, 0,
      -(xx * e[0] + xy * e[1] + xz * e[2]), -(yx * e[0] + yy * e[1] + yz * e[2]), -(zx * e[0] + zy * e[1] + zz * e[2]), 1];
  }
  function mul(a, b) {
    const o = new Array(16);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
    return o;
  }

  let reveal = reduceMotion ? 1e3 : 0;
  let W = 0, Hh = 0, dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.round(canvas.clientWidth * dpr);
    Hh = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== W || canvas.height !== Hh) { canvas.width = W; canvas.height = Hh; }
    gl.viewport(0, 0, W, Hh);
  }

  function bind(buf, withGrass) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
    if (withGrass) {
      gl.bindBuffer(gl.ARRAY_BUFFER, grassBuf);
      gl.enableVertexAttribArray(aGrass);
      gl.vertexAttribPointer(aGrass, 1, gl.FLOAT, false, 0, 0);
    } else {
      gl.disableVertexAttribArray(aGrass);
      gl.vertexAttrib1f(aGrass, -9);
    }
  }

  function draw() {
    const aspect = W / Hh;
    const fov = aspect < 1 ? 0.95 : 0.62;     // narrow screens: wider lens so the corridor still fits
    const e = [
      target[0] + cam.dist * Math.cos(cam.pitch) * Math.cos(cam.yaw),
      target[1] + cam.dist * Math.cos(cam.pitch) * Math.sin(cam.yaw),
      target[2] + cam.dist * Math.sin(cam.pitch),
    ];
    const view = lookAt(e, target, [0, 0, 1]);
    const proj = perspective(fov, aspect, 0.1, 120);
    gl.uniformMatrix4fv(U.uMV, false, new Float32Array(view));
    gl.uniformMatrix4fv(U.uMVP, false, new Float32Array(mul(proj, view)));
    const pxPerUnit = (Hh / 2) / Math.tan(fov / 2);
    gl.uniform1f(U.uScale, 0.032 * pxPerUnit);
    gl.uniform1f(U.uMinSize, 1.15 * dpr);
    gl.uniform1f(U.uReveal, reveal);
    // lens shift: keep the vanishing point clear of the text block
    gl.uniform2fv(U.uShift, aspect > 1.1 ? [0.5, 0.1] : [0.0, 0.58]);
    // the deck sits at the front of the robot, so grass is cut up to there
    gl.uniform1f(U.uCutX, robot ? state.x + 0.5 : -1e3);
    gl.uniform1f(U.uGrow, state.grow);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    bind(sceneBuf, true);
    gl.uniform1f(U.uRobot, 0);
    gl.uniform1f(U.uRobotFade, 1);
    gl.drawArrays(gl.POINTS, 0, count);

    if (robot) {
      bind(robotBuf, false);
      gl.uniform1f(U.uRobot, 1);
      gl.uniform1f(U.uRobotFade, state.fade);
      gl.uniform1f(U.uScale, 0.022 * pxPerUnit);
      gl.drawArrays(gl.POINTS, 0, robotCount);
    }
  }

  /* ---------- loop: runs only while the hero is on screen ---------- */
  let visible = true, running = false, last = 0, revealStart = 0;
  const REVEAL_MS = 2600, REVEAL_R = 52;

  function frame(t) {
    if (!running) return;
    const dt = Math.min(0.05, (t - last) / 1000 || 0);
    last = t;
    if (reveal < 1e3) {
      const k = Math.min(1, (t - revealStart) / REVEAL_MS);
      reveal = k < 1 ? REVEAL_R * (1 - Math.pow(1 - k, 2.2)) : 1e3;
    }
    if (robot) step(dt);
    draw();
    requestAnimationFrame(frame);
  }
  function start() {
    if (running || reduceMotion || !visible || document.hidden) return;
    running = true; last = performance.now();
    requestAnimationFrame(frame);
  }
  function stop() { running = false; }

  let pending = false;
  function request() {
    if (running || pending) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; draw(); });
  }

  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    visible ? start() : stop();
  }).observe(canvas);
  document.addEventListener("visibilitychange", () => { document.hidden ? stop() : start(); });

  /* ---------- drag to look around ---------- */
  let drag = null;
  canvas.addEventListener("pointerdown", (ev) => {
    drag = { x: ev.clientX, y: ev.clientY, yaw: cam.yaw, pitch: cam.pitch, touch: ev.pointerType === "touch" };
    canvas.setPointerCapture(ev.pointerId);
  });
  canvas.addEventListener("pointermove", (ev) => {
    if (!drag) return;
    cam.yaw = drag.yaw - (ev.clientX - drag.x) * 0.005;
    if (!drag.touch) cam.pitch = Math.max(0.04, Math.min(1.25, drag.pitch + (ev.clientY - drag.y) * 0.004));
    request();
  });
  const end = () => { drag = null; };
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);
  canvas.addEventListener("dblclick", () => { Object.assign(cam, home); request(); });

  window.addEventListener("resize", () => { resize(); request(); });
  resize();
  placeRobot();
  revealStart = performance.now();
  if (reduceMotion) draw(); else start();
})();
