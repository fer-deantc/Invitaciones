/* =========================================================
   villa.js — la Villa de Santa, dibujada a pluma.

   Cada hueco (.slot) entre tarjetas es una viñeta en capas:
   fondo (colinas, desenfocado), plano medio (casas, pinos),
   personajes (duendes y renos que trabajan sin parar) y
   primer plano (pinos grandes, nieve). Al hacer scroll las
   capas se desplazan a distinta velocidad: la profundidad
   sale de las capas, no del volumen.
   ========================================================= */
(function () {
  'use strict';
  const P = window.POSADA, C = P.C;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const W = 400, H = 460, GY = 392;   // suelo de la viñeta

  /* ---------- Viñetas ---------- */
  // Cada una dibuja en: mid (estático), act (lo que se mueve) y front (primer plano).
  const SITES = [
    // 0 · Casa de Santa
    (pen, L) => {
      P.tree(pen, L.mid, 62, GY - 4, 112, { orn: 'many' });
      const h = P.house(pen, L.mid, 128, GY - 6, 132, 86, { roof: C.wine, wall: C.sand, wreath: true, round: [.78, .26], windows: [[.08, .3, .18, .26], [.58, .52, .16, .22]], doorX: .36 });
      if (h.smoke) P.smoke(pen, L.mid, h.smoke[0], h.smoke[1], 1.3);
      P.tree(pen, L.mid, 352, GY - 2, 104, { orn: true });
      P.pole(pen, L.mid, 104, GY + 10, 52);
      P.giftPile(pen, L.mid, 312, GY + 16);
      P.lamp(pen, L.mid, 284, GY + 8);
      return [
        { type: 'walk', fig: { coat: C.forest, hat: C.wine, carry: 'gift', color: C.wine }, path: [[300, GY + 22], [250, GY + 26], [196, GY + 6]], speed: 18, pause: [1.4, .9], carry: 'back', phase: 0 },
        { type: 'walk', fig: { coat: C.wine, hat: C.forest, carry: 'gift', color: C.goldL }, path: [[318, GY + 34], [262, GY + 38], [204, GY + 14]], speed: 15, pause: [1.1, 1.3], carry: 'back', phase: .55 },
        { type: 'idle', fig: { type: 'santa', pose: 'wave' }, at: [150, GY + 30], face: 1, anim: 'wave' },
        { type: 'idle', fig: { type: 'kid', coat: C.night, hat: C.wine }, at: [118, GY + 44], face: 1, anim: 'hold' }
      ];
    },
    // 1 · Taller de juguetes
    (pen, L) => {
      P.tree(pen, L.mid, 48, GY - 6, 96, { orn: true });
      const h = P.house(pen, L.mid, 96, GY - 4, 170, 84, { roof: C.forest, wall: C.wine, side: C.wineD, open: true, doorX: .4, doorW: .24, doorH: .62, sign: 'TALLER', signX: .3, windows: [[.06, .3, .16, .26], [.74, .3, .16, .26]] });
      if (h.smoke) P.smoke(pen, L.mid, h.smoke[0], h.smoke[1], 1.2);
      P.giftPile(pen, L.mid, 330, GY + 18, 5);
      const wb = P.el('g', {}, L.mid);
      pen.rect(60, GY + 14, 44, 5, { fill: C.brown, fillStyle: 'solid' }, wb);
      pen.line(64, GY + 19, 64, GY + 34, { strokeWidth: 1.4 }, wb); pen.line(100, GY + 19, 100, GY + 34, { strokeWidth: 1.4 }, wb);
      P.gift(pen, wb, 68, GY + 14, 10, C.night);
      return [
        { type: 'walk', fig: { prop: 'cart', carry: 'gift', coat: C.forest, hat: C.wine, color: C.goldL }, path: [[176, GY + 10], [236, GY + 26], [300, GY + 30]], speed: 13, pause: [1.6, 1.2], carry: 'out', phase: .2 },
        { type: 'walk', fig: { coat: C.wine, hat: C.forest, carry: 'gift', color: C.forest }, path: [[160, GY + 8], [230, GY + 40], [312, GY + 46]], speed: 19, pause: [1, .8], carry: 'out', phase: .4 },
        { type: 'idle', fig: { coat: C.forest, hat: C.forest, prop: 'hammer' }, at: [114, GY + 36], face: -1, anim: 'hammer' }
      ];
    },
    // 2 · Correo (la casita del boceto)
    (pen, L) => {
      P.tree(pen, L.mid, 70, GY - 2, 116, { orn: true });
      const h = P.house(pen, L.mid, 128, GY - 4, 130, 92, { roof: C.wine, wall: C.sand, sign: 'CORREO', signX: .1, round: [.78, .2], windows: [[.62, .48, .16, .2]], doorX: .64, doorW: .18, doorH: .46, doorColor: C.brown, rows: 4 });
      if (h.smoke) P.smoke(pen, L.mid, h.smoke[0], h.smoke[1], 1.2);
      P.tree(pen, L.mid, 346, GY + 4, 108, { orn: true });
      P.mailbox(pen, L.mid, 110, GY + 22);
      return [
        { type: 'walk', fig: { coat: C.night, hat: C.wine, carry: 'letters' }, path: [[60, GY + 40], [150, GY + 36], [222, GY + 4]], speed: 17, pause: [1.2, 1], carry: 'out', phase: .1 },
        { type: 'walk', fig: { coat: C.wine, hat: C.forest, carry: 'sack' }, path: [[340, GY + 44], [270, GY + 38], [228, GY + 8]], speed: 14, pause: [1, 1.2], carry: 'out', phase: .55 },
        { type: 'idle', fig: { type: 'kid', coat: C.forest, hat: C.wine, carry: 'letters' }, at: [300, GY + 52], face: -1, anim: 'read' },
        { type: 'flutter', at: [210, 205], amp: [80, 24], w: .55, phase: 0 },
        { type: 'flutter', at: [210, 205], amp: [80, 24], w: .55, phase: 2.1 },
        { type: 'flutter', at: [210, 205], amp: [80, 24], w: .55, phase: 4.2 }
      ];
    },
    // 3 · Plaza del árbol
    (pen, L) => {
      pen.ellipse(200, GY + 20, 330, 64, { fill: C.sand, fillStyle: 'solid', strokeWidth: 1 }, L.mid);
      pen.ellipse(200, GY + 20, 330, 64, { stroke: 'none', fill: C.ink, fillStyle: 'cross-hatch', hachureGap: 9, fillWeight: .4 }, L.mid).setAttribute('opacity', .18);
      P.lamp(pen, L.mid, 64, GY + 8); P.lamp(pen, L.mid, 336, GY + 8);
      L.back = P.el('g', { class: 'behind' }, L.mid);
      P.tree(pen, L.mid, 200, GY + 18, 250, { orn: 'many', star: true, color: C.forest });
      const lad = P.el('g', {}, L.mid);
      pen.line(262, GY + 26, 236, GY - 150, { stroke: C.brown, strokeWidth: 1.8 }, lad);
      pen.line(274, GY + 24, 248, GY - 152, { stroke: C.brown, strokeWidth: 1.8 }, lad);
      for (let i = 1; i < 11; i++) { const t = i / 11; pen.line(262 - 26 * t, GY + 26 - 176 * t, 274 - 26 * t, GY + 24 - 176 * t, { stroke: C.brown, strokeWidth: 1.3 }, lad); }
      P.bench(pen, L.mid, 92, GY + 44); P.bench(pen, L.mid, 312, GY + 48);
      return [
        { type: 'orbit', fig: { coat: C.wine, hat: C.forest, carry: 'star' }, c: [200, GY + 26], r: [118, 22], w: .32, phase: 0 },
        { type: 'orbit', fig: { coat: C.forest, hat: C.wine, carry: 'gift', color: C.goldL }, c: [200, GY + 26], r: [118, 22], w: .32, phase: Math.PI },
        { type: 'climb', fig: { coat: C.night, hat: C.wine, carry: 'star' }, from: [266, GY + 24], to: [242, GY - 150], t: [.08, .72], speed: 16, pause: [2, 2.4] },
        { type: 'idle', fig: { type: 'kid', coat: C.wine, hat: C.forest }, at: [300, GY + 44], face: -1, anim: 'hold' }
      ];
    },
    // 4 · Lago helado
    (pen, L) => {
      P.tree(pen, L.mid, 44, GY - 30, 90, { orn: false });
      P.tree(pen, L.mid, 360, GY - 34, 84, { orn: false });
      const cab = P.house(pen, L.mid, 300, GY - 44, 58, 40, { roof: C.brown, wall: C.beige, rows: 2, bricks: false, windows: [[.12, .3, .26, .3]], doorX: .55, doorW: .26, doorH: .62, doorColor: C.wine });
      if (cab.smoke) P.smoke(pen, L.mid, cab.smoke[0], cab.smoke[1], 1);
      pen.ellipse(190, GY + 18, 300, 92, { fill: C.ice, fillStyle: 'solid', strokeWidth: 1.3 }, L.mid);
      pen.ellipse(190, GY + 18, 300, 92, { stroke: 'none', fill: '#8fa0a3', fillStyle: 'hachure', hachureAngle: 20, hachureGap: 7, fillWeight: .5 }, L.mid).setAttribute('opacity', .4);
      pen.path(`M90,${GY + 10} q30,-8 60,-2 M190,${GY + 30} q36,-8 70,0 M120,${GY + 40} q30,-4 50,0`, { stroke: C.snow, strokeWidth: 2.4, roughness: .6 }, L.mid);
      P.bench(pen, L.mid, 346, GY + 54);
      return [
        { type: 'skate', fig: { pose: 'skate', coat: C.wine, hat: C.forest, scarf: C.goldL }, c: [190, GY + 22], r: [108, 28], w: .55, phase: 0 },
        { type: 'skate', fig: { pose: 'skate', coat: C.forest, hat: C.wine, scarf: C.wine }, c: [176, GY + 18], r: [60, 16], w: -.75, phase: 1.4 },
        { type: 'skate', fig: { pose: 'skate', type: 'kid', coat: C.night, hat: C.wine, scarf: C.cream }, c: [200, GY + 24], r: [128, 32], w: .4, phase: 3.2 }
      ];
    },
    // 5 · Establo de los renos
    (pen, L) => {
      P.tree(pen, L.mid, 40, GY - 8, 96, { orn: false });
      const h = P.house(pen, L.mid, 120, GY - 30, 140, 84, { roof: C.brown, wall: C.wine, side: C.wineD, chimney: false, bricks: false, rows: 3, windows: [[.08, .26, .14, .2], [.78, .26, .14, .2]], doorX: .34, doorW: .32, doorH: .6, doorColor: C.wineD });
      void h;
      pen.line(168, GY - 30, 213, GY - 80, { stroke: C.cream, strokeWidth: 2 }, L.mid); pen.line(168, GY - 80, 213, GY - 30, { stroke: C.cream, strokeWidth: 2 }, L.mid);
      P.fence(pen, L.mid, 70, GY - 10, 360, GY - 10, 9);
      const hay = P.el('g', {}, L.mid);
      pen.path(`M44,${GY + 30} q20,-34 44,0 z`, { fill: C.goldL, fillStyle: 'solid' }, hay);
      pen.hatch([[66, GY + 2], [88, GY + 30], [66, GY + 30]], { op: .4 }, hay);
      L.frontFence = true;
      return [
        { type: 'deer', at: [200, GY + 30], face: 1, graze: true },
        { type: 'deer', at: [318, GY + 22], face: -1, graze: true },
        { type: 'deerwalk', path: [[230, GY + 4], [320, GY + 8]], speed: 7, pause: [3.4, 2.6], phase: .3 },
        { type: 'walk', fig: { coat: C.wine, hat: C.forest, prop: 'barrow', carry: 'hay' }, path: [[80, GY + 44], [130, GY + 30], [170, GY + 2]], speed: 12, pause: [1.8, 1.4], carry: 'out', phase: .1 }
      ];
    }
  ];

  /* ---------- Capas de una viñeta ---------- */
  function build(slot) {
    const i = +slot.dataset.site, seed = 31 + i * 17;
    // fondo a lo ancho: colinas y pinos lejanos, desenfocados
    const land = P.svg(1200, 400, 'land', 'xMidYMax slice');
    slot.appendChild(land);
    const pl = P.pen(land);
    P.hills(pl, land, 1200, 250, '#e1dbc9', seed);
    const r = P.rngFrom(seed);
    for (let k = 0; k < 18; k++) { const x = r() * 1200; if (x > 420 && x < 780) continue; P.tree(pl, land, x, 262 + r() * 30, 50 + r() * 40, { orn: false, snow: true, shadow: false, color: '#7f8e7c' }); }
    P.hills(pl, land, 1200, 300, '#ece6d6', seed + 3);

    const wrap = document.createElement('div'); wrap.className = 'scene'; slot.appendChild(wrap);
    // se recorta el cielo vacío: la viñeta va de y=150 a y=460
    const mk = cls => { const s = P.svg(W, H, 'layer ' + cls); s.setAttribute('viewBox', '0 150 400 310'); wrap.appendChild(s); return s; };
    const mid = mk('mid'), act = mk('act'), front = mk('front');
    const pen = P.pen(mid);
    // la nieve del suelo, con orilla irregular
    pen.path(`M-30,${GY - 22} q60,-14 120,-4 q70,-16 140,-2 q60,-12 110,-2 q40,-6 90,2 L430,500 L-30,500 Z`, { fill: C.snow, fillStyle: 'solid', strokeWidth: 1.1 }, mid);
    pen.path(`M30,${GY + 70} q40,-6 80,0 M240,${GY + 80} q50,-8 100,0`, { strokeWidth: .7, stroke: '#a7a596' }, mid);
    const L = { mid: P.el('g', {}, mid), front, back: null };
    const specs = SITES[i](pen, L);
    // primer plano: un pino grande cortado y un montículo de nieve
    const pf = P.pen(front);
    if (i % 2) P.tree(pf, front, 392, H + 34, 210, { orn: i === 3 ? 'many' : true, shadow: false });
    else P.tree(pf, front, 4, H + 34, 200, { orn: true, shadow: false });
    if (L.frontFence) P.fence(pf, front, 40, GY + 70, 380, GY + 66, 10);
    pf.path(`M${i % 2 ? -20 : 120},${H + 4} q80,-30 160,-6 q60,-16 140,4 L420,${H + 30} L-20,${H + 30} Z`, { fill: C.snow, fillStyle: 'solid', strokeWidth: 1 }, front);

    const actLayer = P.el('g', {}, act);
    const ap = P.pen(act);
    const actors = specs.map(s => makeActor(s, ap, actLayer, L.back));
    return { slot, wrap, land, front, actors, layer: actLayer, active: false };
  }

  /* ---------- Actores (mismos recorridos de antes) ---------- */
  function polyline(path) {
    const segs = []; let L = 0;
    for (let i = 1; i < path.length; i++) { const a = path[i - 1], b = path[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]); segs.push({ a, b, l, s0: L }); L += l; }
    return { L, at(s) { for (const g of segs) if (s <= g.s0 + g.l) { const t = (s - g.s0) / g.l; return { x: g.a[0] + (g.b[0] - g.a[0]) * t, y: g.a[1] + (g.b[1] - g.a[1]) * t, dx: g.b[0] - g.a[0] }; } const g = segs[segs.length - 1]; return { x: g.b[0], y: g.b[1], dx: g.b[0] - g.a[0] }; } };
  }
  function makeActor(spec, pen, layer, back) {
    const node = P.el('g', {}, layer);
    let fig;
    if (spec.type === 'deer' || spec.type === 'deerwalk') fig = P.deer(pen, node);
    else if (spec.type === 'flutter') { fig = P.el('g', { class: 'letter' }, node); const fl = P.el('g', { class: 'flap' }, fig); pen.rect(-5, -3.5, 10, 7, { fill: C.snow, fillStyle: 'solid', strokeWidth: .8 }, fl); pen.path('M-5,-3.5 L0,.5 L5,-3.5', { strokeWidth: .6 }, fl); }
    else fig = P.figure(pen, node, spec.fig);
    const face = fig.face;
    const a = { node, fig, x: 0, y: 0, facing: 1 };
    node._a = a;
    const rng = Math.random;
    a.setFace = d => { if (d !== a.facing && face) { a.facing = d; face.setAttribute('transform', d < 0 ? 'scale(-1,1)' : ''); } };
    a.place = (x, y) => { a.x = x; a.y = y; node.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)})`); };
    const setLoad = on => { if (fig.load) fig.load.style.opacity = on ? 1 : 0; };
    switch (spec.type) {
      case 'walk': case 'deerwalk': {
        const pl = polyline(spec.path);
        a.s = (spec.phase || 0) * pl.L; a.dir = 1; a.wait = 0;
        a.update = dt => {
          if (a.wait > 0) { a.wait -= dt; fig.classList.remove('walking'); return; }
          fig.classList.add('walking');
          a.s += a.dir * spec.speed * dt;
          if (a.s >= pl.L) { a.s = pl.L; a.dir = -1; a.wait = spec.pause[1] * (.8 + rng() * .5); }
          else if (a.s <= 0) { a.s = 0; a.dir = 1; a.wait = spec.pause[0] * (.8 + rng() * .5); }
          const p = pl.at(a.s);
          a.place(p.x, p.y);
          if (Math.abs(p.dx) > .5) a.setFace(Math.sign(p.dx) * a.dir);
          if (spec.carry) setLoad(spec.carry === 'out' ? a.dir > 0 : a.dir < 0);
        };
        break;
      }
      case 'skate': case 'orbit': {
        a.th = spec.phase || 0;
        if (spec.type === 'orbit') fig.classList.add('walking');
        a.update = dt => {
          a.th += spec.w * dt;
          const c = Math.cos(a.th), s = Math.sin(a.th);
          a.place(spec.c[0] + spec.r[0] * c, spec.c[1] + spec.r[1] * s);
          a.setFace(-s * Math.sign(spec.w) >= 0 ? 1 : -1);
          if (spec.type === 'orbit' && back) {
            // detrás del árbol cuando va por la parte de atrás
            const inFront = s > 0;
            if (inFront && node.parentNode !== layer) layer.appendChild(node);
            else if (!inFront && node.parentNode !== back) back.appendChild(node);
          }
        };
        break;
      }
      case 'climb': {
        a.t = spec.t[0]; a.dir = 1; a.wait = 0;
        const L = Math.hypot(spec.to[0] - spec.from[0], spec.to[1] - spec.from[1]);
        a.setFace(-1);
        a.update = dt => {
          if (a.wait > 0) { a.wait -= dt; fig.classList.remove('walking'); return; }
          fig.classList.add('walking');
          a.t += a.dir * spec.speed * dt / L;
          if (a.t >= spec.t[1]) { a.t = spec.t[1]; a.dir = -1; a.wait = spec.pause[1]; setLoad(false); }
          else if (a.t <= spec.t[0]) { a.t = spec.t[0]; a.dir = 1; a.wait = spec.pause[0]; setLoad(true); }
          a.place(spec.from[0] + (spec.to[0] - spec.from[0]) * a.t, spec.from[1] + (spec.to[1] - spec.from[1]) * a.t);
        };
        break;
      }
      case 'flutter': {
        a.t = 0;
        a.update = dt => {
          a.t += dt;
          const t = a.t * spec.w + spec.phase;
          const x = spec.at[0] + spec.amp[0] * Math.sin(t), y = spec.at[1] + spec.amp[1] * Math.sin(2 * t + .6) + Math.sin(a.t * 2.3 + spec.phase) * 3;
          a.x = x; a.y = y;
          node.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${(Math.sin(a.t * 3.1 + spec.phase) * 24).toFixed(1)})`);
        };
        break;
      }
      default: {
        if (spec.anim) fig.classList.add({ read: 'reading', hammer: 'hammering', wave: 'waving' }[spec.anim] || 'holding');
        if (spec.graze) { fig.classList.add('graze'); fig.style.setProperty('--gd', (-rng() * 6).toFixed(2) + 's'); }
        a.update = null;
      }
    }
    const st = spec.at || (spec.path && spec.path[0]) || spec.c || spec.from;
    a.place(st[0], st[1]);
    if (spec.face) a.setFace(spec.face);
    setLoad(true);
    if (a.update) a.update(.001);
    return a;
  }

  /* ---------- Arranque, parallax y animación ---------- */
  let scenes = [], running = false, last = 0;
  function parallax() {
    const vh = innerHeight;
    for (const s of scenes) {
      const r = s.slot.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) continue;
      const d = (r.top + r.height / 2 - vh / 2) / vh;
      s.land.style.transform = `translate3d(0,${(d * 70).toFixed(1)}px,0)`;
      s.front.style.transform = `translate3d(0,${(-d * 46).toFixed(1)}px,0)`;
    }
  }
  P.villa = {
    layout() { parallax(); },
    start() {
      if (running) return;
      running = true;
      addEventListener('scroll', parallax, { passive: true });
      parallax();
      if (reduce) return;
      last = performance.now();
      const loop = now => {
        const dt = Math.min(.05, (now - last) / 1000); last = now;
        for (const sc of scenes) {
          if (!sc.active) continue;
          for (const a of sc.actors) if (a.update) a.update(dt);
          const kids = sc.layer.children;
          for (let i = 1; i < kids.length; i++) if (kids[i]._a && kids[i - 1]._a && kids[i]._a.y < kids[i - 1]._a.y) { sc.layer.insertBefore(kids[i], kids[i - 1]); break; }
        }
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
  };
  function init() {
    scenes = [...document.querySelectorAll('.slot[data-site]')].map(build);
    const io = new IntersectionObserver(es => es.forEach(e => { const sc = scenes.find(s => s.slot === e.target); if (sc) sc.active = e.isIntersecting; }), { rootMargin: '80px 0px' });
    scenes.forEach(s => io.observe(s.slot));
    addEventListener('resize', parallax);
    if (P.opened) P.villa.start();
  }
  if (document.fonts && document.fonts.ready) Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1500))]).then(init); else init();
})();
