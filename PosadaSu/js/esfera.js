/* =========================================================
   esfera.js — la bola de nieve de la entrada.

   La lógica es la misma de antes (sensor, sacudida, resortes,
   tiempos, acercamiento y ventisca); lo que cambió es el
   dibujo: ahora es una ilustración a pluma en SVG y la nieve
   vive en un lienzo 2D dentro del vidrio.

   · La nieve obedece al sensor: cae hacia donde está el suelo
     de verdad y se arremolina al agitar.
   · La bola descansa en la mesa; al agitar se levanta y se
     sacude como en la mano, y al soltarla se asienta.
   · Cada sacudida la acerca. Cuando llena la pantalla suena el
     vidrio, cae la ventisca y se abre la invitación.
   ========================================================= */
(function () {
  'use strict';
  const P = window.POSADA, C = P.C;
  const $ = s => document.querySelector(s);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const og = new URLSearchParams(location.search).has('og');
  const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const V3 = () => ({ x: 0, y: 0, z: 0 });

  const gate = $('#gate'), globe = $('#globe'), rig = $('#rig'), sphere = $('#sphere'), cvs = $('#snowGlobe'), ctx = cvs.getContext('2d');
  const open = $('#open'), shakeText = $('#shakeText'), skip = $('#skip'), shadow = $('#globeShadow');
  P.globeLoaded = true;

  /* ---------- Sensores (igual que antes) ---------- */
  const S = { g: { x: 0, y: -1, z: 0 }, a: V3(), raw: 0, mag: 0, rot: 0, lastRot: 0, motion: false, sign: null, lp: null };
  P.sensor = S;
  const scrAngle = () => ((screen.orientation && screen.orientation.angle) || window.orientation || 0) * Math.PI / 180;
  const rot2 = (x, y) => { const a = scrAngle(), c = Math.cos(a), s = Math.sin(a); return [x * c + y * s, -x * s + y * c]; };
  function onMotion(e) {
    const ig = e.accelerationIncludingGravity, la = e.acceleration, rr = e.rotationRate;
    if (!ig || ig.x == null) return;
    S.motion = true;
    if (!S.lp) S.lp = { x: ig.x, y: ig.y, z: ig.z || 0 };
    const k = .12;
    S.lp.x += (ig.x - S.lp.x) * k; S.lp.y += (ig.y - S.lp.y) * k; S.lp.z += ((ig.z || 0) - S.lp.z) * k;
    const s = S.sign != null ? S.sign : (isIOS ? -1 : 1);
    // gravedad en ejes del teléfono: x derecha, y arriba, z hacia ti
    const [gx, gy] = rot2(-s * S.lp.x / 9.81, -s * S.lp.y / 9.81);
    const gz = -s * S.lp.z / 9.81, m = Math.hypot(gx, gy, gz);
    if (m < .1) { S.g.x = 0; S.g.y = -1; S.g.z = 0; } else { S.g.x = gx / m; S.g.y = gy / m; S.g.z = gz / m; }
    let lx, ly, lz;
    if (la && la.x != null) { lx = la.x; ly = la.y; lz = la.z || 0; } else { lx = ig.x - S.lp.x; ly = ig.y - S.lp.y; lz = (ig.z || 0) - S.lp.z; }
    const [ax, ay] = rot2(s * lx, s * ly);
    S.a.x = clamp(ax, -40, 40); S.a.y = clamp(ay, -40, 40); S.a.z = clamp(s * lz, -40, 40);
    S.raw = Math.min(45, Math.hypot(lx, ly, lz));
    if (rr && rr.alpha != null) S.rot = rr.alpha * Math.PI / 180;
  }
  function onOrient(e) {
    if (S.sign != null || !S.lp || e.beta == null) return;
    if (scrAngle() === 0 && e.beta > 35 && e.beta < 145 && Math.abs(S.lp.y) > 5) S.sign = Math.sign(S.lp.y);
  }
  function askMotion() {
    const DME = window.DeviceMotionEvent, DOE = window.DeviceOrientationEvent;
    addEventListener('devicemotion', onMotion); addEventListener('deviceorientation', onOrient);
    if (DME && typeof DME.requestPermission === 'function') {
      const asks = [DME.requestPermission()];
      if (DOE && typeof DOE.requestPermission === 'function') asks.push(DOE.requestPermission().catch(() => 'denied'));
      return Promise.all(asks).then(r => r[0] === 'granted').catch(() => false);
    }
    return Promise.resolve(!!DME);
  }

  /* ---------- Dibujo de la esfera ---------- */
  const ground = x => .5 + .16 * x * x;   // superficie de la nieve adentro, en radios
  // Todo pintado en acuarela y tinta, como la villa (acuarela.js); aquí solo se coloca.
  const A = P.paint;
  const img = (svg, canvas, x, y, w, h) => P.el('image', { href: canvas.toDataURL(), x, y, width: w, height: h, preserveAspectRatio: 'none' }, svg);
  function paint() {
    // adentro: noche, nieve, cabañita, dos pinos y Teddy
    const back = $('#globeBack'); back.innerHTML = '';
    const inside = A.globeInside(ground);
    img(back, inside, 0, 0, 400, 400);
    // humo de la chimenea (mismo movimiento de siempre: clases smoke/puff)
    const sm = P.el('g', { class: 'smoke', transform: `translate(${inside.smoke[0].toFixed(1)},${inside.smoke[1].toFixed(1)}) scale(1.4)` }, back);
    const puffC = A.smoke();
    for (let k = 0; k < 3; k++) { const pg = P.el('g', { class: 'puff', style: `animation-delay:${-k * 1.6}s` }, sm); img(pg, puffC, -9, -14, 18, 18); }
    // el vidrio
    const front = $('#globeFront'); front.innerHTML = '';
    img(front, A.globeGlass(), 0, 0, 400, 400);
    // la base de caoba con placa dorada
    const base = $('#globeBase'); base.innerHTML = '';
    img(base, A.globeBase(P.plaqueDate), 0, 0, 400, 160);
    // rayos de luz dorados (mismo parpadeo: clase ray)
    const rays = $('#globeRays'); rays.innerHTML = '';
    const defs = P.el('defs', {}, rays), rg = P.el('radialGradient', { id: 'rayGlow' }, defs);
    P.el('stop', { offset: '0', 'stop-color': '#ffd27a', 'stop-opacity': '.35' }, rg); P.el('stop', { offset: '1', 'stop-color': '#ffd27a', 'stop-opacity': '0' }, rg);
    P.el('circle', { cx: 250, cy: 250, r: 250, fill: 'url(#rayGlow)' }, rays);
    for (let i = 0; i < 14; i++) {
      const a = -Math.PI * .95 + i / 13 * Math.PI * .9 + (i % 2 ? .05 : -.05), r1 = 222 + (i % 3) * 8, r2 = r1 + 26 + (i % 2) * 14;
      const g = P.el('g', { class: 'ray', style: `animation-delay:${-i * .4}s` }, rays);
      P.el('line', { x1: 250 + Math.cos(a) * r1, y1: 250 + Math.sin(a) * r1, x2: 250 + Math.cos(a) * r2, y2: 250 + Math.sin(a) * r2, stroke: i % 2 ? '#f6c453' : '#ffe39a', 'stroke-width': i % 2 ? 3 : 2, 'stroke-linecap': 'round', opacity: .9 }, g);
    }
    // la mesa de madera
    const table = $('#table'); table.innerHTML = '';
    img(table, A.tableTop(), 0, 0, 1000, 400);
    // Teddy, el yorkie café de la casa, sentado en la mesa junto a la esfera (mueve la cola)
    let td = $('#teddyGate');
    if (!td) { td = document.createElement('div'); td.id = 'teddyGate'; td.setAttribute('aria-hidden', 'true'); gate.appendChild(td); }
    td.innerHTML = '';
    [A.teddy(0, true, 3), A.teddy(1, true, 3)].forEach((c, k) => { c.className = 'fr f' + k; td.appendChild(c); });
    // su etiqueta, para que sepan que es él
    const tag = A.teddyTag(); tag.className = 'ttag'; td.appendChild(tag);
  }

  /* ---------- Nieve dentro de la esfera (2D) ---------- */
  const N = 340, parts = [];
  const fluid = { ux: 0, uy: 0, om: 0, e: 0, t: 0 };
  function initSnow() {
    const rng = P.rngFrom(19);
    for (let i = 0; i < N; i++) {
      const gl = i < N * .08;
      const r = gl ? .008 + rng() * .004 : .006 + Math.pow(rng(), 2.2) * .016;
      let x = (rng() * 2 - 1) * .93, y;
      const floating = rng() < .3;
      if (floating) y = -.85 + rng() * 1.3; else y = ground(x) - rng() * .025;
      const lim = .96 - r;
      if (x * x + y * y > lim * lim) { const d = Math.hypot(x, y); x *= lim / d; y *= lim / d; }
      parts.push({ x, y, vx: 0, vy: 0, r, vt: .06 + r * 5, set: !floating, gl, ph: rng() * 6.283 });
    }
  }
  function turb(x, y, t) {
    const a = 2.1 * x + 1.3 * t, b = 1.7 * y - .9 * t, c = 3.3 * y + 2.4 * x + .7 * t + 1, d = 4.7 * x - 3.9 * y - 1.6 * t;
    const dy = 1.7 * Math.sin(a) * Math.cos(b) + 1.98 * Math.cos(c) - 1.365 * Math.cos(d);
    const dx = 2.1 * Math.cos(a) * Math.sin(b) + 1.44 * Math.cos(c) + 1.645 * Math.cos(d);
    return [dy * .42, -dx * .42];
  }
  // ax, ay en ejes de pantalla (y hacia abajo)
  function stepSnow(dt, ax, ay) {
    const F = fluid, am = Math.hypot(ax, ay);
    F.ux += -ax * dt * .9; F.uy += -ay * dt * .9;
    const du = Math.exp(-dt / .35); F.ux *= du; F.uy *= du;
    F.e = Math.min(1.8, F.e + am * dt * .1) * Math.exp(-dt / 2.6);
    const dw = S.rot - S.lastRot; S.lastRot = S.rot;
    F.om = clamp(F.om - dw * .9, -3, 3) * Math.exp(-dt / 1.6);
    F.t += dt * (.35 + F.e * 1.2);
    // la gravedad en el plano de la pantalla; si el teléfono está acostado, casi no jala
    const gx = S.g.x, gy = -S.g.y, gm = Math.hypot(gx, gy);
    const kRelax = 1 - Math.exp(-dt / .2);
    for (const p of parts) {
      const r2 = p.x * p.x + p.y * p.y, wall = Math.max(0, 1 - r2);
      if (p.set) {
        const sp = Math.hypot(F.ux, F.uy) * wall + Math.abs(F.om) * Math.sqrt(r2) * .6 + F.e * .55 * wall;
        if (sp < .16) continue;
        p.set = false;
      }
      const [tx, ty] = turb(p.x, p.y, F.t + p.ph * .05);
      const fx = F.ux * wall - F.om * p.y + tx * F.e * wall;
      const fy = F.uy * wall + F.om * p.x + ty * F.e * wall;
      p.vx += (fx + gx * p.vt - p.vx) * kRelax - ax * dt * .02;
      p.vy += (fy + gy * p.vt - p.vy) * kRelax - ay * dt * .02;
      p.x += p.vx * dt; p.y += p.vy * dt;
      const g = ground(p.x);
      if (p.y > g) { p.y = g; if (p.vy > 0) p.vy *= -.1; if (gy > .35 && F.e < .3 && Math.abs(p.vx) + Math.abs(p.vy) < .14) p.set = true; }
      const lim = .965 - p.r, d2 = p.x * p.x + p.y * p.y;
      if (d2 > lim * lim) {
        const d = Math.sqrt(d2), nx = p.x / d, ny = p.y / d;
        p.x = nx * lim; p.y = ny * lim;
        const vr = p.vx * nx + p.vy * ny;
        if (vr > 0) { p.vx -= vr * nx * 1.15; p.vy -= vr * ny * 1.15; }
        if (gm > .35 && F.e < .3 && (gx * nx + gy * ny) / gm > .75 && Math.abs(p.vx) + Math.abs(p.vy) < .12) p.set = true;
      }
    }
  }
  // copos de pluma: punto blanco con contorno café
  const sprite = (rgb) => { const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d'), gr = g.createRadialGradient(16, 16, 0, 16, 16, 15); gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(.55, `rgba(${rgb},.9)`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); return c; };
  const FLAKE = sprite('251,248,240'), GLIT = sprite('255,220,140');
  let cw = 0;
  function sizeCanvas(scale = 1) {
    const w = sphere.offsetWidth, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const target = Math.min(2048, Math.round(w * dpr * scale));
    if (Math.abs(target - cw) < 4) return;
    cw = target; cvs.width = cvs.height = target;
  }
  function drawSnow(t) {
    const W = cw, c = W / 2, R = W / 2 * .96;
    ctx.clearRect(0, 0, W, W);
    ctx.save(); ctx.beginPath(); ctx.arc(c, c, R, 0, 6.2832); ctx.clip();
    for (const p of parts) {
      const x = c + p.x * R, y = c + p.y * R, s = Math.max(1.4, p.r * R * 1.5);
      ctx.globalAlpha = p.gl ? .5 + .5 * Math.max(0, Math.sin(t * 4 + p.ph)) : 1;
      ctx.drawImage(p.gl ? GLIT : FLAKE, x - s, y - s, s * 2, s * 2);
    }
    ctx.restore(); ctx.globalAlpha = 1;
  }

  /* ---------- Encuadre ---------- */
  const G = { rest: null };
  function measure() {
    const tr = globe.style.transform, tr2 = rig.style.transform;
    globe.style.transform = 'none'; rig.style.transform = 'none';
    const r = sphere.getBoundingClientRect();
    G.rest = { cx: r.left + r.width / 2, cy: r.top + r.height / 2, d: r.width };
    const b = $('#globeBase').getBoundingClientRect();
    gate.style.setProperty('--table', Math.round(b.bottom - b.height * .12) + 'px');
    globe.style.transform = tr; rig.style.transform = tr2;
  }

  /* ---------- La sacudida (mismos resortes y tiempos) ---------- */
  const B = { p: V3(), v: V3(), rx: 0, rz: 0, vrx: 0, vrz: 0, lift: 0, vl: 0, p0: 0, ps: 0, armed: false, done: false, finished: false };
  let drag = null, tArm = 0, shakes = 0, jingleAt = 0, high = false, landed = true;

  sphere.addEventListener('pointerdown', e => {
    if (!B.armed || B.done) return;
    drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, px: 0, py: 0, pvx: 0, pvy: 0 };
    try { sphere.setPointerCapture(e.pointerId); } catch (err) { /* nada */ }
  });
  sphere.addEventListener('pointermove', e => { if (drag && e.pointerId === drag.id) { drag.x = e.clientX; drag.y = e.clientY; } });
  const endDrag = e => { if (drag && e.pointerId === drag.id) drag = null; };
  sphere.addEventListener('pointerup', endDrag); sphere.addEventListener('pointercancel', endDrag);

  const aW = V3();
  let last = performance.now();
  function tick(now) {
    const dt = Math.min(.05, (now - last) / 1000 || .016); last = now;
    const t = now / 1000;
    aW.x = aW.y = aW.z = 0;
    let mag = 0;
    if (B.armed && !B.done) {
      if (drag) {
        const ppu = G.rest.d / 2;
        const ox = clamp((drag.x - drag.x0) / ppu, -.35, .35), oy = clamp(-(drag.y - drag.y0) / ppu, -.2, .35);
        const vx = (ox - drag.px) / dt, vy = (oy - drag.py) / dt;
        aW.x = clamp((vx - drag.pvx) / dt / 4, -40, 40); aW.y = clamp((vy - drag.pvy) / dt / 4, -40, 40);
        drag.px = ox; drag.py = oy; drag.pvx = vx; drag.pvy = vy;
        mag = Math.hypot(aW.x, aW.y);
        const kk = 1 - Math.exp(-dt / .05);
        B.p.x += (ox - B.p.x) * kk; B.p.y += (Math.max(0, oy) - B.p.y) * kk; B.v.x = B.v.y = B.v.z = 0;
        B.rz += (-vx * .04 - B.rz) * (1 - Math.exp(-dt / .1)); B.vrz = 0;
      } else if (S.motion) {
        aW.x = S.a.x; aW.y = S.a.y; aW.z = S.a.z; mag = S.raw || 0;
      }
      S.mag += (mag - S.mag) * (1 - Math.exp(-dt / .12));
      const rate = clamp((S.mag - 3) / 8, 0, 1.6) / 2;
      if (rate > 0) {
        B.p0 = Math.min(1, B.p0 + rate * dt);
        if (B.p0 > .05 && !shakes) { shakes = 1; shakeText.textContent = 'Sigue. La nieve ya despertó.'; }
        if (B.p0 > .5 && shakes === 1) { shakes = 2; shakeText.textContent = 'Un poco más.'; }
      }
      const hi = mag > 13;
      if (hi && !high && now - jingleAt > 110) { P.audio.jingle(clamp(mag / 22, .4, 1.4)); jingleAt = now; }
      high = hi;
      if (!skip.dataset.shown && now - tArm > 7000) { skip.hidden = false; skip.dataset.shown = '1'; }
    }
    if (!drag) {
      const k = 160, c = 11, F = 2.4;
      B.v.x += (aW.x * F - k * B.p.x - c * B.v.x) * dt;
      B.v.y += (aW.y * F * .6 - k * B.p.y - c * B.v.y) * dt;
      B.v.z += (aW.z * F * .5 - k * B.p.z - c * B.v.z) * dt;
      B.p.x = clamp(B.p.x + B.v.x * dt, -.3, .3); B.p.y = clamp(B.p.y + B.v.y * dt, -.3, .3); B.p.z = clamp(B.p.z + B.v.z * dt, -.3, .3);
      const kr = 150, cr = 10;
      B.vrz += (-aW.x * 2.6 - kr * B.rz - cr * B.vrz) * dt;
      B.vrx += (aW.z * 1.8 - aW.y * .6 - kr * B.rx - cr * B.vrx) * dt;
      B.rz = clamp(B.rz + B.vrz * dt, -.35, .35); B.rx = clamp(B.rx + B.vrx * dt, -.3, .3);
    }
    const holding = B.armed && !B.done && (S.mag > 5 || drag);
    const liftT = holding ? Math.min(.22, .06 + Math.max(0, S.mag - 5) * .012) : 0;
    B.vl += ((liftT - B.lift) * 90 - B.vl * 12) * dt;
    B.lift += B.vl * dt;
    if (B.lift < 0) { if (B.vl < -.2 && !landed) P.audio.thud(Math.min(1, -B.vl * 1.5)); B.lift = 0; B.vl *= -.25; landed = true; }
    if (B.lift > .03) landed = false;
    const off = Math.max(0, B.lift + B.p.y), tilt = Math.min(1, off * 8 + .15), R = G.rest.d / 2;
    // la esfera en la mano: se mueve, se levanta y se ladea (pivote en la base)
    rig.style.transform = `translate(${(B.p.x * R).toFixed(1)}px,${(-off * R).toFixed(1)}px) rotate(${(-B.rz * tilt * 57.3).toFixed(2)}deg) scaleY(${(1 - Math.abs(B.rx * tilt) * .12).toFixed(3)})`;
    shadow.style.opacity = (.75 * clamp(1 - off * 3.2, .25, 1)).toFixed(3);
    shadow.style.transform = `translateX(${(B.p.x * R).toFixed(1)}px) scale(${(1 + off * 1.2).toFixed(3)})`;

    stepSnow(dt, B.armed ? aW.x : 0, B.armed ? -aW.y : 0);

    // el acercamiento
    B.ps += (B.p0 - B.ps) * (1 - Math.exp(-dt / (B.p0 >= 1 ? .18 : .5)));
    const e = B.ps, ease = e * e * (3 - 2 * e);
    const W = innerWidth, H = innerHeight, smax = 1.06 * Math.hypot(W, H) / G.rest.d;
    const sc = 1 + (smax - 1) * Math.pow(e, 2.1);
    globe.style.transform = `translate(${((W / 2 - G.rest.cx) * ease).toFixed(1)}px,${((H / 2 - G.rest.cy) * ease).toFixed(1)}px) scale(${sc.toFixed(3)})`;
    gate.style.setProperty('--p', e.toFixed(3));
    if (sc > 1.5) sizeCanvas(Math.min(sc, 4));
    drawSnow(t);
    if (B.armed && !B.done && B.ps > .985) tope();
    if (!B.finished) requestAnimationFrame(tick);
  }

  function arm() {
    if (B.armed) return;
    B.armed = true; tArm = performance.now();
    P.audio.unlock();
    gate.classList.add('armed');
    if (reduce) { B.done = true; setTimeout(() => P.reveal(), 400); return; }
    const touch = isIOS || 'ontouchstart' in window;
    shakeText.textContent = touch ? 'Agita para descubrir.' : 'Arrastra la esfera de un lado a otro.';
    gate.classList.toggle('desk', !touch);
    askMotion().then(() => setTimeout(() => { if (!S.motion && !B.done && !shakes) { shakeText.textContent = 'Arrastra la esfera de un lado a otro.'; gate.classList.add('desk'); } }, 1400));
  }

  function tope() {
    B.done = true;
    P.audio.clink();
    setTimeout(() => P.audio.whoosh(), 120);
    if (navigator.vibrate) try { navigator.vibrate([25, 40, 70]); } catch (err) { /* nada */ }
    P.snowfall.burst(() => { B.finished = true; P.reveal(); });
  }

  /* ---------- Arranque ---------- */
  function start() {
    if (gate.classList.contains('nogl')) return;
    paint();
    initSnow();
    measure();
    sizeCanvas(1);
    addEventListener('resize', () => { if (!B.done) { measure(); cw = 0; sizeCanvas(1); if (og) drawSnow(1.3); } });
    open.addEventListener('click', arm);
    skip.addEventListener('click', () => { if (B.armed && !B.done) B.p0 = 1; });
    if (og) { for (let i = 0; i < 6; i++) stepSnow(.03, 0, 0); drawSnow(1.3); document.documentElement.classList.add('og-ready'); return; }
    gate.classList.add('ready');
    P.globeReady = true;
    requestAnimationFrame(tick);
  }
  if (document.fonts && document.fonts.ready && !og) Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1500))]).then(start);
  else start();
})();
