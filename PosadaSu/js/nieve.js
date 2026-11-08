/* =========================================================
   nieve.js — la ventisca que abre la invitación y la nieve
   que sigue cayendo, ligera, mientras la lees.
   ========================================================= */
(function () {
  'use strict';
  const P = window.POSADA = window.POSADA || {};
  const $ = s => document.querySelector(s);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const sprite = (rgb, core) => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(core, `rgba(${rgb},.85)`); gr.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c;
  };
  const FLAKE = sprite('255,255,255', .4), SOFT = sprite('248,250,255', .12);

  /* ---------- Ventisca ---------- */
  function blizzard() {
    const bz = $('#blizzard'), ctx = bz.getContext('2d'), flakes = [];
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5), W = innerWidth, H = innerHeight;
    bz.width = W * dpr; bz.height = H * dpr; bz.hidden = false;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const t0 = performance.now();
    let acc = 0, prev = t0;
    const loop = now => {
      const dt = Math.min(.05, (now - prev) / 1000); prev = now;
      const el = (now - t0) / 1000;
      acc += (el < 1.3 ? 1500 : el < 3 ? 1500 * (1 - (el - 1.3) / 1.7) : 0) * dt;
      while (acc > 1 && flakes.length < 1700) {
        acc--;
        const z = Math.random(), big = Math.random() < .07;
        flakes.push({ x: -W * .1 + Math.random() * W * 1.2, y: -40 - Math.random() * H * .25, vx: 50 + Math.random() * 90, vy: (380 + z * 900) * (big ? 1.6 : 1), s: big ? 14 + Math.random() * 22 : 1.5 + z * z * 8, a: big ? .3 : .5 + z * .5, big, ph: Math.random() * 6 });
      }
      ctx.clearRect(0, 0, W, H);
      for (let i = flakes.length - 1; i >= 0; i--) {
        const p = flakes[i];
        p.x += (p.vx + Math.sin(el * 3 + p.ph) * 40) * dt; p.y += p.vy * dt;
        if (p.y > H + 50) { flakes.splice(i, 1); continue; }
        ctx.globalAlpha = p.a;
        ctx.drawImage(p.big ? SOFT : FLAKE, p.x - p.s, p.y - p.s, p.s * 2, p.s * 2);
      }
      ctx.globalAlpha = 1;
      if (el < 3.2 || flakes.length) requestAnimationFrame(loop); else bz.hidden = true;
    };
    requestAnimationFrame(loop);
  }

  function lumps() {
    const W = innerWidth, H = Math.round(innerHeight * .28), svg = $('#lumps'), rng = Math.random;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('width', W); svg.setAttribute('height', H);
    let s = `<defs><linearGradient id="gDrift" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f5f6"/><stop offset="1" stop-color="#dfe6ec"/></linearGradient></defs>`;
    for (let x = -20; x < W + 40;) { const r = 18 + rng() * 46; s += `<circle cx="${(x + r * .6).toFixed(0)}" cy="${(rng() * 18).toFixed(0)}" r="${r.toFixed(0)}" fill="url(#gDrift)"/>`; x += r * (.9 + rng() * .5); }
    for (let i = 0; i < W / 14; i++) { const r = 2 + rng() * 9; s += `<circle cx="${(rng() * W).toFixed(0)}" cy="${(30 + rng() * (H - 40)).toFixed(0)}" r="${r.toFixed(1)}" fill="#f6f7f8" opacity="${(.5 + rng() * .5).toFixed(2)}"/>`; }
    svg.innerHTML = s;
  }

  P.snowfall = {
    // Cae la ventisca, un manto de nieve cubre la pantalla y, debajo, aparece la invitación.
    burst(onCovered) {
      const flash = $('#flash'), drift = $('#drift');
      flash.animate([{ opacity: 0 }, { opacity: .7, offset: .15 }, { opacity: 0 }], { duration: 700, easing: 'ease-out' });
      lumps();
      drift.hidden = false;
      setTimeout(blizzard, 150);
      // Los tiempos van con setTimeout y no con onfinish: si el teléfono deja de
      // pintar a media transición (cambio de app), la invitación igual se abre.
      setTimeout(() => drift.animate([{ transform: 'translateY(-130%)' }, { transform: 'translateY(0)' }], { duration: 900, easing: 'cubic-bezier(.5,0,.7,.55)', fill: 'forwards' }), 520);
      setTimeout(() => {
        onCovered();
        drift.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(112%)', opacity: 1, offset: .85 }, { transform: 'translateY(135%)', opacity: 0 }], { duration: 1600, delay: 150, easing: 'cubic-bezier(.4,.1,.6,1)', fill: 'forwards' });
      }, 1480);
      setTimeout(() => { drift.hidden = true; }, 3400);
    }
  };

  /* ---------- Nieve ambiental ---------- */
  P.flurry = function () {
    if (reduce) return;
    const c = $('#flurry'), x = c.getContext('2d'), dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;
    const size = () => { W = innerWidth; H = innerHeight; c.width = W * dpr; c.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size(); addEventListener('resize', size);
    const fl = [];
    for (let i = 0; i < 55; i++) { const z = Math.random(); fl.push({ x: Math.random() * W, y: Math.random() * H, z, s: 1 + z * z * 3.6, ph: Math.random() * 6 }); }
    c.hidden = false;
    let prev = performance.now();
    const loop = now => {
      const dt = Math.min(.05, (now - prev) / 1000); prev = now;
      const S = P.sensor;
      let gx = S && S.motion ? S.g.x : 0, gy = S && S.motion ? -S.g.y : 1;
      const gm = Math.hypot(gx, gy);
      if (gm < .25) { gx = 0; gy = 1; } else { gx /= gm; gy /= gm; }
      x.clearRect(0, 0, W, H);
      for (const p of fl) {
        const sp = 22 + p.z * 48, sw = Math.sin(now / 1000 * (.6 + p.z) + p.ph) * 14;
        p.x += (gx * sp - gy * sw * .6) * dt; p.y += (gy * sp + gx * sw * .6) * dt;
        if (p.y > H + 10) p.y = -10; else if (p.y < -10) p.y = H + 10;
        if (p.x > W + 10) p.x = -10; else if (p.x < -10) p.x = W + 10;
        x.globalAlpha = .4 + p.z * .5;
        x.drawImage(FLAKE, p.x - p.s, p.y - p.s, p.s * 2, p.s * 2);
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  };

  /* ---------- Fondo de la sala (desenfocado) ---------- */
  P.paintRoom = function () {
    const c = $('#room'); if (!c) return;
    const W = innerWidth, H = innerHeight, dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    c.width = W * dpr; c.height = H * dpr;
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const rnd = (s => () => { s = (s * 16807) % 2147483647; return s / 2147483647; })(97);
    // muro verde de biblioteca con lambrín
    let gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, '#16201a'); gr.addColorStop(.45, '#1f2b22'); gr.addColorStop(.62, '#1a231c'); gr.addColorStop(1, '#0f1510');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 6;
    for (let x = W * .04; x < W; x += Math.max(160, W * .22)) g.strokeRect(x, H * .5, Math.max(130, W * .18), H * .4);
    g.strokeStyle = 'rgba(214,180,110,.08)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(0, H * .47); g.lineTo(W, H * .47); g.stroke();
    // ventana fría a la izquierda, con nieve afuera
    const wx = W * -.06, wy = H * .06, ww = Math.max(150, W * .3), wh = H * .5;
    gr = g.createLinearGradient(wx, wy, wx, wy + wh); gr.addColorStop(0, '#30486e'); gr.addColorStop(1, '#1b2a44');
    g.fillStyle = gr; g.fillRect(wx, wy, ww, wh);
    for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(230,238,250,${.2 + rnd() * .5})`; g.beginPath(); g.arc(wx + rnd() * ww, wy + rnd() * wh, .8 + rnd() * 2, 0, 7); g.fill(); }
    g.strokeStyle = '#0c120e'; g.lineWidth = 10; g.strokeRect(wx, wy, ww, wh);
    g.lineWidth = 6; g.beginPath(); g.moveTo(wx + ww / 2, wy); g.lineTo(wx + ww / 2, wy + wh); g.moveTo(wx, wy + wh / 2); g.lineTo(wx + ww, wy + wh / 2); g.stroke();
    // cortina de terciopelo
    gr = g.createLinearGradient(wx + ww - 20, 0, wx + ww + 70, 0); gr.addColorStop(0, '#3d0f12'); gr.addColorStop(.5, '#6a1a1e'); gr.addColorStop(1, '#2a090b');
    g.fillStyle = gr; g.fillRect(wx + ww - 24, 0, 90, H * .62);
    // lámpara cálida a la derecha
    gr = g.createRadialGradient(W * .86, H * .2, 0, W * .86, H * .2, Math.max(W, H) * .5);
    gr.addColorStop(0, 'rgba(255,196,120,.55)'); gr.addColorStop(.25, 'rgba(255,170,90,.2)'); gr.addColorStop(1, 'rgba(255,160,80,0)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // chimenea: brillo naranja abajo a la izquierda
    gr = g.createRadialGradient(W * .08, H * .78, 0, W * .08, H * .78, Math.max(W, H) * .45);
    gr.addColorStop(0, 'rgba(255,120,40,.35)'); gr.addColorStop(1, 'rgba(255,120,40,0)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // guirnalda de luces y el árbol, fuera de foco (bokeh)
    const bokeh = (x, y, r, col, a) => { const b = g.createRadialGradient(x, y, 0, x, y, r); b.addColorStop(0, `rgba(${col},${a})`); b.addColorStop(.7, `rgba(${col},${a * .8})`); b.addColorStop(1, `rgba(${col},0)`); g.fillStyle = b; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); };
    const warm = ['255,206,130', '255,186,100', '255,228,170', '255,150,80'];
    for (let i = 0; i < 26; i++) { const t = i / 25, x = W * (.2 + .8 * t), y = H * (.1 + .1 * Math.sin(t * Math.PI) + .02 * rnd()); bokeh(x, y, 8 + rnd() * 18, warm[i % 4], .35 + rnd() * .3); }
    for (let i = 0; i < 40; i++) { const x = W * (.74 + rnd() * .3), y = H * (.08 + rnd() * .42); bokeh(x, y, 6 + rnd() * 22, rnd() < .2 ? '220,60,50' : rnd() < .2 ? '120,190,120' : warm[i % 4], .25 + rnd() * .35); }
  };
})();
