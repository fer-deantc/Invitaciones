/* =========================================================
   esfera.js — la bola de nieve de la entrada.

   1. El invitado toca "Tomar la esfera": ahí se pide el
      permiso del acelerómetro (iOS lo exige) y se desbloquea
      el audio.
   2. Al agitar el teléfono, la esfera se sacude igual y la
      nieve de adentro se arremolina. La nieve cae hacia
      donde está el suelo de verdad: si inclinas el teléfono,
      la nieve se acomoda de lado.
   3. Cada sacudida acerca la esfera. Cuando el vidrio llena
      la pantalla, suena el vidrio, cae una ventisca y se
      descubre la invitación.

   Sin acelerómetro (computadora, o si niegan el permiso) la
   esfera se agita arrastrándola con el dedo o el ratón.
   ========================================================= */
(function () {
  'use strict';
  const P = window.POSADA, C = window.FIESTA;
  const $ = s => document.querySelector(s);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const og = new URLSearchParams(location.search).has('og');
  const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const gate = $('#gate'), globe = $('#globe'), sphere = $('#sphere'), cvs = $('#snowGlobe'), ctx = cvs.getContext('2d');
  const take = $('#take'), note = $('#gateNote'), copy = $('.gate-copy'), skip = $('#skip');

  /* ---------- Dibujo de la esfera ---------- */
  const ground = x => .5 + .16 * x * x;   // superficie de la nieve adentro, en radios
  function paintGlobe() {
    const { f, INK } = P;
    let mound = 'M0,400 ';
    for (let i = 0; i <= 40; i++) { const x = -1 + i / 20, y = ground(x); mound += `L${f(200 + 196 * x)},${f(200 + 196 * y)} `; }
    mound += 'L400,400 Z';
    let stars = '';
    const rng = P.rngFrom(77);
    for (let i = 0; i < 46; i++) stars += `<circle cx="${f(20 + rng() * 360)}" cy="${f(20 + rng() * 200)}" r="${f(.5 + rng() * 1)}" fill="#f4ecd2" opacity="${f(.3 + rng() * .6)}"/>`;
    $('#globeScene').innerHTML = `
      <defs>
        <clipPath id="clipGlobe"><circle cx="200" cy="200" r="195"/></clipPath>
        <radialGradient id="gNight" cx=".5" cy=".3" r=".8"><stop offset="0" stop-color="#3a5075"/><stop offset=".55" stop-color="#1c2944"/><stop offset="1" stop-color="#0d1322"/></radialGradient>
        <linearGradient id="gMount" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7486a0"/><stop offset="1" stop-color="#3a4a64"/></linearGradient>
        <radialGradient id="gMoon"><stop offset="0" stop-color="#f6eccb" stop-opacity=".55"/><stop offset="1" stop-color="#f6eccb" stop-opacity="0"/></radialGradient>
      </defs>
      <g clip-path="url(#clipGlobe)">
        <rect width="400" height="400" fill="url(#gNight)"/>
        ${stars}
        <circle cx="290" cy="104" r="44" fill="url(#gMoon)"/>
        <circle cx="290" cy="104" r="15" fill="#efe4c3"/><circle cx="296" cy="100" r="13" fill="#2a3a5a" opacity=".55"/>
        <path d="M0,262 L40,214 L66,236 L104,178 L140,226 L176,196 L214,240 L258,170 L300,222 L336,192 L400,250 L400,300 L0,300 Z" fill="url(#gMount)" stroke="${INK}" stroke-width=".7"/>
        <path d="M94,190 L104,178 L116,194 L108,190 L100,198 Z M248,184 L258,170 L270,186 L262,182 L254,190 Z M166,206 L176,196 L186,208 L178,205 Z M326,202 L336,192 L348,204 L340,201 Z" fill="#eef1f4"/>
        <path d="M0,276 Q100,250 200,262 Q300,252 400,272 L400,400 L0,400 Z" fill="#cfd7df" stroke="${INK}" stroke-width=".6"/>
        <path d="M0,276 Q100,250 200,262 Q300,252 400,272 L400,400 L0,400 Z" fill="url(#hatchS)"/>
        ${P.tree(104, 282, .95, 'pine2')}${P.tree(304, 278, .9)}${P.tree(58, 300, .8, 'pine3')}${P.tree(346, 302, .78, 'pine3')}
        ${P.house({ x: 144, y: 300, w: 112, h: 44, gh: 34, D: 40, dx: 12, timber: true, roof: ['#a63a2b', '#6f2119'],
          windows: [[10, 12, 16, 16, '#3f5b3c'], [86, 12, 16, 16, '#3f5b3c']], door: { x: 48, w: 16, h: 28, color: '#2f5034', wreath: true }, round: 5,
          chimneys: [{ t: .5, side: -.18, h: 14 }] })}
        ${P.lamp(278, 312, 1.15)}
        <g transform="translate(118,318) scale(1.25)">${P.elf({ coat: 'g', hat: 'r', carry: 'gift', cls: 'loaded' })}</g>
        <path d="${mound}" fill="url(#gSnow)" stroke="${INK}" stroke-width=".8"/>
        ${P.drifts(5, 10, [60, 320, 340, 380])}
      </g>`;
  }

  /* ---------- Sensores ---------- */
  const S = { gx: 0, gy: 1, ax: 0, ay: 0, mag: 0, rot: 0, lastRot: 0, motion: false, sign: null, lp: null };
  const scrAngle = () => ((screen.orientation && screen.orientation.angle) || window.orientation || 0) * Math.PI / 180;
  const rot = (x, y) => { const a = scrAngle(), c = Math.cos(a), s = Math.sin(a); return [x * c + y * s, -x * s + y * c]; };
  P.sensor = S;

  function onMotion(e) {
    const ig = e.accelerationIncludingGravity, la = e.acceleration, rr = e.rotationRate;
    if (!ig || ig.x == null) return;
    S.motion = true;
    if (!S.lp) S.lp = { x: ig.x, y: ig.y, z: ig.z };
    const k = .12;
    S.lp.x += (ig.x - S.lp.x) * k; S.lp.y += (ig.y - S.lp.y) * k; S.lp.z += (ig.z - S.lp.z) * k;
    const s = S.sign != null ? S.sign : (isIOS ? -1 : 1);
    const [gx, gy] = rot(-s * S.lp.x / 9.81, s * S.lp.y / 9.81);
    const m = Math.hypot(gx, gy);
    S.gx = m > 1 ? gx / m : gx; S.gy = m > 1 ? gy / m : gy;
    let lx, ly, lz;
    if (la && la.x != null) { lx = la.x; ly = la.y; lz = la.z || 0; }
    else { lx = ig.x - S.lp.x; ly = ig.y - S.lp.y; lz = ig.z - S.lp.z; }
    const [ax, ay] = rot(s * lx, -s * ly);
    S.ax = clamp(ax, -40, 40); S.ay = clamp(ay, -40, 40);
    S.raw = Math.min(45, Math.hypot(lx, ly, lz));
    if (rr && rr.alpha != null) S.rot = rr.alpha * Math.PI / 180;
  }
  function onOrient(e) {
    if (S.sign != null || !S.lp || e.beta == null) return;
    if (scrAngle() === 0 && e.beta > 35 && e.beta < 145 && Math.abs(S.lp.y) > 5) S.sign = Math.sign(S.lp.y);
  }
  function askMotion() {
    const listen = () => { addEventListener('devicemotion', onMotion); addEventListener('deviceorientation', onOrient); };
    const DME = window.DeviceMotionEvent, DOE = window.DeviceOrientationEvent;
    // Se escucha desde ya: si el sistema manda datos, se usan, aunque el permiso diga otra cosa.
    listen();
    if (DME && typeof DME.requestPermission === 'function') {
      const asks = [DME.requestPermission()];
      if (DOE && typeof DOE.requestPermission === 'function') asks.push(DOE.requestPermission().catch(() => 'denied'));
      return Promise.all(asks).then(r => { if (r[0] === 'granted') { listen(); return true; } return false; }).catch(() => false);
    }
    if (DME) listen();
    return Promise.resolve(!!DME);
  }

  /* ---------- Nieve dentro de la esfera ---------- */
  const N = 360, parts = [];
  const fluid = { ux: 0, uy: 0, om: 0, e: 0, t: 0 };
  function initSnow() {
    const rng = Math.random;
    for (let i = 0; i < N; i++) {
      const gl = i < N * .1;
      const r = gl ? .007 + rng() * .004 : .005 + Math.pow(rng(), 2.2) * .017;
      let x = (rng() * 2 - 1) * .93, y;
      const floating = rng() < .3;
      if (floating) { y = -.85 + rng() * 1.3; } else { y = ground(x) - rng() * .025; }
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
  function stepSnow(dt, ax, ay) {
    const F = fluid;
    const am = Math.hypot(ax, ay);
    F.ux += -ax * dt * .9; F.uy += -ay * dt * .9;
    const du = Math.exp(-dt / .35); F.ux *= du; F.uy *= du;
    F.e = Math.min(1.8, F.e + am * dt * .1);
    F.e *= Math.exp(-dt / 2.6);
    const dw = S.rot - S.lastRot; S.lastRot = S.rot;
    F.om = clamp(F.om - dw * .9, -3, 3) * Math.exp(-dt / 1.6);
    F.t += dt * (.35 + F.e * 1.2);
    const gx = S.gx, gy = S.gy, gm = Math.hypot(gx, gy);
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
      if (p.y > g) {
        p.y = g; if (p.vy > 0) p.vy *= -.1;
        if (gy > .35 && F.e < .3 && Math.abs(p.vx) + Math.abs(p.vy) < .14) p.set = true;
      }
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

  const sprite = (rgb, core) => {
    const c = document.createElement('canvas'); c.width = c.height = 32;
    const g = c.getContext('2d'), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(core, `rgba(${rgb},.9)`); gr.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, 32, 32); return c;
  };
  const FLAKE = sprite('255,255,255', .42), GLIT = sprite('255,236,190', .3), SOFT = sprite('250,251,255', .15);
  let cw = 0, res = 1;
  function sizeCanvas(scale = 1) {
    const w = sphere.offsetWidth, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const target = Math.min(2048, Math.round(w * dpr * scale));
    if (Math.abs(target - cw) < 4) return;
    cw = target; res = target / w;
    cvs.width = cvs.height = target;
  }
  function drawSnow(t) {
    const W = cw, c = W / 2, R = W / 2 * .975;
    ctx.clearRect(0, 0, W, W);
    ctx.save(); ctx.beginPath(); ctx.arc(c, c, R, 0, 6.2832); ctx.clip();
    for (const p of parts) {
      const x = c + p.x * R, y = c + p.y * R, s = p.r * R * 2.3;
      if (p.gl) { ctx.globalAlpha = .25 + .75 * Math.max(0, Math.sin(t * 5 + p.ph)); ctx.drawImage(GLIT, x - s, y - s, s * 2, s * 2); }
      else { ctx.globalAlpha = p.set ? .8 : .95; ctx.drawImage(FLAKE, x - s, y - s, s * 2, s * 2); }
    }
    ctx.restore(); ctx.globalAlpha = 1;
  }

  /* ---------- La esfera en pantalla ---------- */
  const G = { x: 0, y: 0, vx: 0, vy: 0, p: 0, ps: 0, rest: null, armed: false, done: false };
  let drag = null, tArm = 0, mode = null, shakes = 0, jingleAt = 0, lastMagHigh = false;
  function measure() {
    const tr = globe.style.transform; globe.style.transform = 'none';
    const r = sphere.getBoundingClientRect();
    G.rest = { cx: r.left + r.width / 2, cy: r.top + r.height / 2, d: r.width };
    // la orilla de la mesa queda justo donde se apoya la base
    const b = $('.base').getBoundingClientRect();
    gate.style.setProperty('--table', Math.round(b.bottom - b.height * .1) + 'px');
    globe.style.transform = tr;
  }

  sphere.addEventListener('pointerdown', e => {
    if (!G.armed) { arm(); }
    if (G.done) return;
    drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, pvx: 0, pvy: 0, px: 0, py: 0, t: performance.now() };
    try { sphere.setPointerCapture(e.pointerId); } catch (err) { /* nada */ }
  });
  sphere.addEventListener('pointermove', e => { if (drag && e.pointerId === drag.id) { drag.x = e.clientX; drag.y = e.clientY; } });
  const endDrag = e => { if (drag && e.pointerId === drag.id) drag = null; };
  sphere.addEventListener('pointerup', endDrag);
  sphere.addEventListener('pointercancel', endDrag);
  sphere.addEventListener('keydown', e => {
    if (e.key !== ' ' && e.key !== 'Enter') return;
    e.preventDefault();
    if (!G.armed) { arm(); return; }
    G.vx += (Math.random() < .5 ? -1 : 1) * 260; fluid.e = Math.min(1.7, fluid.e + .6); G.p = Math.min(1, G.p + .2);
    P.audio.jingle(1);
  });

  let lastT = 0;
  function frame(now) {
    const dt = Math.min(.05, (now - lastT) / 1000 || .016); lastT = now;
    const t = now / 1000;
    let ax = 0, ay = 0, mag = 0;
    if (G.armed && !G.done) {
      if (drag) {
        const ox = clamp(drag.x - drag.x0, -G.rest.d * .22, G.rest.d * .22), oy = clamp(drag.y - drag.y0, -G.rest.d * .22, G.rest.d * .22);
        const vx = (ox - drag.px) / dt, vy = (oy - drag.py) / dt;
        const axp = (vx - drag.pvx) / dt, ayp = (vy - drag.pvy) / dt;
        drag.px = ox; drag.py = oy; drag.pvx = vx; drag.pvy = vy;
        ax = clamp(-axp / 900, -40, 40); ay = clamp(-ayp / 900, -40, 40);
        mag = Math.hypot(ax, ay);
        G.x += (ox - G.x) * (1 - Math.exp(-dt / .04)); G.y += (oy - G.y) * (1 - Math.exp(-dt / .04));
        G.vx = vx; G.vy = vy;
      } else {
        if (S.motion) { ax = S.ax; ay = S.ay; mag = S.raw || 0; }
        const k = 190, c = 12, F = 95;
        G.vx += (-k * G.x - c * G.vx - ax * F) * dt; G.vy += (-k * G.y - c * G.vy - ay * F) * dt;
        G.x += G.vx * dt; G.y += G.vy * dt;
        const lim = G.rest.d * .16;
        G.x = clamp(G.x, -lim, lim); G.y = clamp(G.y, -lim, lim);
      }
      S.mag += (mag - S.mag) * (1 - Math.exp(-dt / .12));
      const rate = clamp((S.mag - 6) / 12, 0, 1.6) / 2.4;
      if (rate > 0) { G.p = Math.min(1, G.p + rate * dt); if (G.p > .06 && shakes === 0) { shakes = 1; say('Sin miedo: el vidrio aguanta. Creemos.'); } }
      const high = mag > 13;
      if (high && !lastMagHigh && now - jingleAt > 110) { P.audio.jingle(clamp(mag / 22, .4, 1.4)); jingleAt = now; }
      lastMagHigh = high;
      if (!skip.dataset.shown && now - tArm > 12000) { skip.hidden = false; skip.dataset.shown = '1'; }
    }
    stepSnow(dt, G.armed ? ax : 0, G.armed ? ay : 0);

    // acercamiento
    G.ps += (G.p - G.ps) * (1 - Math.exp(-dt / (G.p >= 1 ? .16 : .45)));
    const e = G.ps, ease = e * e * (3 - 2 * e);
    const W = innerWidth, H = innerHeight, smax = 1.06 * Math.hypot(W, H) / G.rest.d;
    const sc = 1 + (smax - 1) * Math.pow(e, 2.1);
    const tx = (W / 2 - G.rest.cx) * ease, ty = (H / 2 - G.rest.cy) * ease;
    const idle = G.armed ? 0 : Math.sin(t * .9) * .7;
    const wob = G.x * .09 + idle;
    globe.style.transform = `translate(${(tx + G.x * (1 - e * .6)).toFixed(1)}px,${(ty + G.y * (1 - e * .6) + (G.armed ? 0 : Math.sin(t * 1.3) * 2)).toFixed(1)}px) rotate(${wob.toFixed(2)}deg) scale(${sc.toFixed(3)})`;
    copy.style.opacity = String(clamp(1 - e * 4, 0, 1));
    gate.style.setProperty('--dim', (e * .8).toFixed(3));
    if (sc > 1.5) sizeCanvas(Math.min(sc, 4));
    drawSnow(t);
    if (G.armed && !G.done && G.ps > .985) tope();
    if (!G.finished) requestAnimationFrame(frame);
  }

  function say(text) { note.textContent = text; }

  function arm() {
    if (G.armed) return;
    G.armed = true; tArm = performance.now();
    P.audio.unlock();
    take.hidden = true;
    gate.classList.add('armed');
    if (reduce) { say('Abriendo…'); setTimeout(() => P.reveal(), 400); G.done = true; return; }
    say(isIOS || 'ontouchstart' in window ? 'Agita el teléfono.' : 'Arrástrala de un lado a otro.');
    askMotion().then(ok => {
      mode = ok ? 'motion' : 'drag';
      setTimeout(() => { if (!S.motion && !G.done && shakes === 0) say('Arrástrala de un lado a otro.'); }, 1400);
    });
  }

  /* ---------- Ventisca ---------- */
  const bz = $('#blizzard'), bctx = bz.getContext('2d'), flakes = [];
  function blizzard() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5), W = innerWidth, H = innerHeight;
    bz.width = W * dpr; bz.height = H * dpr; bz.hidden = false;
    bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const t0 = performance.now();
    let spawnAcc = 0, prev = t0;
    const loop = now => {
      const dt = Math.min(.05, (now - prev) / 1000); prev = now;
      const el = (now - t0) / 1000;
      const rate = el < 1.3 ? 1500 : el < 3 ? 1500 * (1 - (el - 1.3) / 1.7) : 0;
      spawnAcc += rate * dt;
      while (spawnAcc > 1 && flakes.length < 1700) {
        spawnAcc--;
        const z = Math.random(), big = Math.random() < .06;
        const s = big ? 12 + Math.random() * 18 : 1.5 + z * z * 8;
        flakes.push({ x: -W * .1 + Math.random() * W * 1.2, y: -30 - Math.random() * H * .25, vx: 60 + Math.random() * 80, vy: (420 + z * 900) * (big ? 1.5 : 1), s, a: big ? .35 : .55 + z * .45, big, ph: Math.random() * 6 });
      }
      bctx.clearRect(0, 0, W, H);
      for (let i = flakes.length - 1; i >= 0; i--) {
        const p = flakes[i];
        p.x += (p.vx + Math.sin(el * 3 + p.ph) * 40) * dt; p.y += p.vy * dt;
        if (p.y > H + 40) { flakes.splice(i, 1); continue; }
        bctx.globalAlpha = p.a;
        bctx.drawImage(p.big ? SOFT : FLAKE, p.x - p.s, p.y - p.s, p.s * 2, p.s * 2);
      }
      bctx.globalAlpha = 1;
      if (el < 3.2 || flakes.length) requestAnimationFrame(loop); else bz.hidden = true;
    };
    requestAnimationFrame(loop);
  }

  function lumps() {
    const W = innerWidth, H = Math.round(innerHeight * .28), svg = $('#lumps'), rng = Math.random;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('width', W); svg.setAttribute('height', H);
    let s = `<defs><linearGradient id="gDrift" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3f5f6"/><stop offset="1" stop-color="#dfe6ec"/></linearGradient></defs>`;
    for (let x = -20; x < W + 40;) { const r = 18 + rng() * 46; s += `<circle cx="${(x + r * .6).toFixed(0)}" cy="${(rng() * 18).toFixed(0)}" r="${r.toFixed(0)}" fill="url(#gDrift)"/>`; x += r * (.9 + rng() * .5); }
    for (let i = 0; i < W / 14; i++) { const r = 2 + rng() * 9; s += `<circle cx="${(rng() * W).toFixed(0)}" cy="${(30 + rng() * (H - 40)).toFixed(0)}" r="${r.toFixed(1)}" fill="#f6f7f8" opacity="${(.5 + rng() * .5).toFixed(2)}"/>`; }
    svg.innerHTML = s;
  }

  function tope() {
    G.done = true;
    P.audio.clink();
    setTimeout(() => P.audio.whoosh(), 120);
    if (navigator.vibrate) try { navigator.vibrate([25, 40, 70]); } catch (e) { /* nada */ }
    const flash = $('#flash'), drift = $('#drift');
    flash.animate([{ opacity: 0 }, { opacity: .7, offset: .15 }, { opacity: 0 }], { duration: 700, easing: 'ease-out' });
    lumps();
    drift.hidden = false;
    setTimeout(blizzard, 150);
    // Los tiempos van con setTimeout y no con onfinish: si el teléfono deja de
    // pintar a media transición (cambio de app), la invitación igual se abre.
    setTimeout(() => drift.animate([{ transform: 'translateY(-130%)' }, { transform: 'translateY(0)' }], { duration: 900, easing: 'cubic-bezier(.5,0,.7,.55)', fill: 'forwards' }), 520);
    setTimeout(() => {
      G.finished = true;
      gate.hidden = true;
      P.reveal();
      drift.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(112%)', opacity: 1, offset: .85 }, { transform: 'translateY(135%)', opacity: 0 }], { duration: 1600, delay: 150, easing: 'cubic-bezier(.4,.1,.6,1)', fill: 'forwards' });
    }, 1480);
    setTimeout(() => { drift.hidden = true; }, 3400);
  }

  /* ---------- Nieve ambiental sobre la invitación ---------- */
  P.flurry = function () {
    if (reduce) return;
    const c = $('#flurry'), x = c.getContext('2d'), dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;
    const size = () => { W = innerWidth; H = innerHeight; c.width = W * dpr; c.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size(); addEventListener('resize', size);
    const fl = [];
    for (let i = 0; i < 60; i++) { const z = Math.random(); fl.push({ x: Math.random() * W, y: Math.random() * H, z, s: 1 + z * z * 3.4, ph: Math.random() * 6 }); }
    c.hidden = false;
    let prev = performance.now();
    const loop = now => {
      const dt = Math.min(.05, (now - prev) / 1000); prev = now;
      let gx = S.motion ? S.gx : 0, gy = S.motion ? S.gy : 1;
      const gm = Math.hypot(gx, gy);
      if (gm < .25) { gx = 0; gy = 1; } else { gx /= gm; gy /= gm; }
      x.clearRect(0, 0, W, H);
      for (const p of fl) {
        const sp = 22 + p.z * 48, sw = Math.sin(now / 1000 * (.6 + p.z) + p.ph) * 14;
        p.x += (gx * sp - gy * sw * .6) * dt; p.y += (gy * sp + gx * sw * .6) * dt;
        if (p.y > H + 10) p.y = -10; else if (p.y < -10) p.y = H + 10;
        if (p.x > W + 10) p.x = -10; else if (p.x < -10) p.x = W + 10;
        x.globalAlpha = .45 + p.z * .45;
        x.drawImage(FLAKE, p.x - p.s, p.y - p.s, p.s * 2, p.s * 2);
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  };

  /* ---------- Arranque ---------- */
  paintGlobe();
  initSnow();
  measure();
  sizeCanvas(1);
  addEventListener('resize', () => { if (!G.done) { measure(); cw = 0; sizeCanvas(1); if (og) drawSnow(1.3); } });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!G.armed) measure(); });
  take.addEventListener('click', arm);
  skip.addEventListener('click', () => { if (!G.done) { G.p = 1; } });
  if (og) {
    // Imagen para compartir: un cuadro fijo, sin animación.
    for (let i = 0; i < 8; i++) stepSnow(.03, 0, 0);
    drawSnow(1.3);
  } else {
    requestAnimationFrame(frame);
  }
})();
