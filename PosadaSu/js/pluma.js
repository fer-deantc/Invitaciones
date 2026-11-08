/* =========================================================
   pluma.js — todo se dibuja como con pluma de gel en papel.

   Usa Rough.js para que cada línea salga a mano alzada:
   contorno café muy oscuro, rellenos planos de colores
   apagados (tipo gouache) y sombras con achurado. Aquí
   están la paleta y las piezas: pinos con esferas, casitas
   de tejas, personitas de palitos, renos, el trineo, la
   guirnalda de foquitos y la sala navideña de la entrada.
   ========================================================= */
(function () {
  'use strict';
  const P = window.POSADA = window.POSADA || {};
  const NS = 'http://www.w3.org/2000/svg';

  const C = P.C = {
    ink: '#2b1f16', wine: '#7a2832', wineD: '#5b1d25', forest: '#34503d', forestD: '#26392c', moss: '#61765a',
    cream: '#f1e6cd', paper: '#f5eddb', beige: '#d9c6a1', sand: '#e7d8b8', brown: '#7c5639', brownD: '#503524',
    gold: '#b8924c', goldL: '#dfc07a', snow: '#fbf8f1', snowS: '#e6e3da', ice: '#cdd6d3', stone: '#a89f8e',
    skin: '#edd2b2', sky: '#e3e5dc', night: '#3d4c5f', nightD: '#2c3848', glow: '#f2cf78', fire: '#d9873f'
  };
  const rngFrom = P.rngFrom = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const el = P.el = (tag, attrs = {}, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
  P.svg = (w, h, cls, par = 'xMidYMid meet') => el('svg', { viewBox: `0 0 ${w} ${h}`, preserveAspectRatio: par, class: cls || '', 'aria-hidden': 'true' });
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

  /* ---------- La pluma ---------- */
  let seedN = 7;
  P.pen = function (root) {
    const rc = rough.svg(root);
    const base = { stroke: C.ink, strokeWidth: 1.15, roughness: .85, bowing: .8, fillWeight: .7, hachureGap: 3.6, hachureAngle: -41 };
    const o = opt => Object.assign({ seed: seedN++ }, base, opt || {});
    const put = (n, parent) => { (parent || root).appendChild(n); return n; };
    const pen = {
      root, rc,
      rect: (x, y, w, h, opt, p) => put(rc.rectangle(x, y, w, h, o(opt)), p),
      poly: (pts, opt, p) => put(rc.polygon(pts, o(opt)), p),
      path: (d, opt, p) => put(rc.path(d, o(opt)), p),
      circle: (x, y, d, opt, p) => put(rc.circle(x, y, d, o(opt)), p),
      ellipse: (x, y, w, h, opt, p) => put(rc.ellipse(x, y, w, h, o(opt)), p),
      line: (x1, y1, x2, y2, opt, p) => put(rc.line(x1, y1, x2, y2, o(opt)), p),
      curve: (pts, opt, p) => put(rc.curve(pts, o(opt)), p),
      // relleno plano de color + contorno de pluma
      fill: (pts, color, opt, p) => put(rc.polygon(pts, o(Object.assign({ fill: color, fillStyle: 'solid' }, opt))), p),
      // achurado a mano, para las sombras
      hatch: (pts, opt, p) => { const n = rc.polygon(pts, o(Object.assign({ stroke: 'none', fill: C.ink, fillStyle: 'hachure', fillWeight: .55, hachureGap: 3.3, roughness: 1.1 }, opt))); n.setAttribute('opacity', (opt && opt.op) || .5); return put(n, p); },
      g: (attrs, p) => el('g', attrs || {}, p || root)
    };
    return pen;
  };

  /* ---------- Pino con esferas ---------- */
  P.tree = function (pen, g, x, y, h, opt = {}) {
    const w = h * .44, t = el('g', { class: 'tree' }, g);
    const S = [[0, -1], [.36, -.67], [.19, -.65], [.62, -.37], [.4, -.35], [.92, -.11], [-.92, -.11], [-.4, -.35], [-.62, -.37], [-.19, -.65], [-.36, -.67]].map(([a, b]) => [x + a * w, y + b * h]);
    if (opt.shadow !== false) pen.ellipse(x + w * .5, y - h * .02, w * 1.9, h * .12, { stroke: 'none', fill: C.ink, fillStyle: 'hachure', hachureGap: 4, fillWeight: .5, roughness: 1.2 }, t).setAttribute('opacity', .28);
    pen.rect(x - w * .09, y - h * .13, w * .18, h * .13, { fill: C.brown, fillStyle: 'solid' }, t);
    pen.fill(S, opt.color || C.forest, {}, t);
    pen.hatch([[x, y - h], [x + w * .36, y - h * .67], [x + w * .19, y - h * .65], [x + w * .62, y - h * .37], [x + w * .4, y - h * .35], [x + w * .92, y - h * .11], [x + w * .1, y - h * .11]], { op: .55 }, t);
    if (opt.snow !== false) {
      [[-.36, -.67, -.05, -.72], [-.62, -.37, -.2, -.42], [-.92, -.11, -.35, -.15]].forEach(([a, b, c, d]) => pen.line(x + a * w, y + b * h, x + c * w, y + d * h, { stroke: C.snow, strokeWidth: 2.4, roughness: .6 }, t));
    }
    if (opt.orn !== false) {
      const r = rngFrom(Math.round(x * 7 + y * 3)), cols = [C.wine, C.gold, C.wine, C.goldL];
      const spots = [[-.12, -.75], [.14, -.56], [-.3, -.47], [.28, -.27], [-.05, -.3], [-.5, -.2], [.55, -.17], [.1, -.85]];
      spots.slice(0, opt.orn === 'many' ? 8 : 5).forEach(([a, b], i) => pen.circle(x + (a + (r() - .5) * .05) * w, y + b * h, Math.max(3, h * .075), { fill: cols[i % 4], fillStyle: 'solid', strokeWidth: .9 }, t));
    }
    if (opt.star) {
      const s = h * .09, pts = [];
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? s * .45 : s; pts.push([x + Math.cos(a) * rr, y - h - s * .3 + Math.sin(a) * rr]); }
      pen.fill(pts, C.goldL, { strokeWidth: .9 }, t);
    }
    return t;
  };

  /* ---------- Casita de tejas (como la del boceto) ---------- */
  // x,y: esquina inferior izquierda de la fachada · w,h: fachada · d: fondo (el muro de lado)
  P.house = function (pen, g, x, y, w, h, opt = {}) {
    const t = el('g', { class: 'house' }, g), d = opt.d || w * .36, gh = opt.gh || h * .62, ov = w * .1;
    const dv = [d, -d * .45];
    const wall = opt.wall || C.sand, side = opt.side || C.beige, roof = opt.roof || C.wine;
    // sombra en la nieve
    pen.hatch([[x + w, y], [x + w + dv[0], y + dv[1]], [x + w + dv[0] + h * .55, y + dv[1] + h * .2], [x + w + h * .5, y + h * .22]], { op: .22 }, t);
    // muro lateral y su frontón
    const A = [x + w + dv[0] / 2, y - h + dv[1] / 2 - gh];
    pen.fill([[x + w, y], [x + w + dv[0], y + dv[1]], [x + w + dv[0], y - h + dv[1]], [x + w, y - h]], side, {}, t);
    pen.fill([[x + w, y - h], [x + w + dv[0], y - h + dv[1]], A], side, {}, t);
    pen.hatch([[x + w, y], [x + w + dv[0], y + dv[1]], [x + w + dv[0], y - h + dv[1]], A, [x + w, y - h]], { op: .45 }, t);
    // fachada
    pen.rect(x, y - h, w, h, { fill: wall, fillStyle: 'solid' }, t);
    // ladrillitos sueltos, como en el boceto
    const r = rngFrom(Math.round(x * 11 + w));
    for (let i = 0; i < (opt.bricks === false ? 0 : 5); i++) {
      const bx = x + w * (.08 + r() * .7), by = y - h * (.12 + r() * .55);
      pen.rect(bx, by, w * .12, h * .07, { strokeWidth: .7, roughness: .6 }, t);
    }
    // techo con tejas de escama
    const E1 = [x - ov, y - h + 3], E2 = [x + w + 3, y - h + 3], R2 = [A[0] + 2, A[1] - 1], R1 = [A[0] - w - ov - 1, A[1] - 1];
    pen.fill([E1, E2, R2, R1], roof, { strokeWidth: 1.3 }, t);
    const rows = opt.rows || 4;
    for (let i = 1; i <= rows; i++) {
      const a = lerp(E1, R1, i / (rows + .6)), b = lerp(E2, R2, i / (rows + .6)), n = Math.max(5, Math.round(w / 9));
      let dd = '';
      for (let k = 0; k < n; k++) { const p0 = lerp(a, b, k / n), p1 = lerp(a, b, (k + 1) / n), mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2; dd += `M${p0[0].toFixed(1)},${p0[1].toFixed(1)} Q${mx.toFixed(1)},${(my + 5.5).toFixed(1)} ${p1[0].toFixed(1)},${p1[1].toFixed(1)} `; }
      pen.path(dd, { strokeWidth: .8, roughness: .5 }, t);
    }
    // nieve en la cumbrera
    const s1 = lerp(R1, E1, .3), s2 = lerp(R2, E2, .3);
    pen.fill([R1, R2, s2, lerp(s2, s1, .3).map((v, i) => v + (i ? 4 : 0)), lerp(s2, s1, .65).map((v, i) => v + (i ? -1 : 0)), s1], C.snow, { strokeWidth: .9 }, t);
    // sombra del alero sobre la fachada
    pen.hatch([[x, y - h], [x + w, y - h], [x + w, y - h + 7], [x, y - h + 7]], { op: .5 }, t);
    // chimenea
    let smoke = null;
    if (opt.chimney !== false) {
      const cx = lerp(R1, R2, .72)[0] - w * .1, ct = lerp(R1, E1, .45)[1] + (lerp(R1, R2, .72)[1] - R1[1]);
      pen.rect(cx, ct - h * .42, w * .11, h * .42, { fill: C.wineD, fillStyle: 'solid' }, t);
      pen.rect(cx - 2, ct - h * .46, w * .11 + 4, h * .07, { fill: C.snow, fillStyle: 'solid', strokeWidth: .9 }, t);
      smoke = [cx + w * .055, ct - h * .48];
    }
    // ventanas encendidas
    (opt.windows || [[.12, .32, .22, .26], [.66, .32, .22, .26]]).forEach(([u, v, ww, wh]) => {
      const wx = x + u * w, wy = y - h + v * h, W = ww * w, H = wh * h;
      pen.rect(wx, wy, W, H, { fill: C.glow, fillStyle: 'solid' }, t);
      pen.line(wx + W / 2, wy, wx + W / 2, wy + H, { strokeWidth: .9 }, t);
      pen.line(wx, wy + H * .48, wx + W, wy + H * .48, { strokeWidth: .9 }, t);
      pen.line(wx - 2, wy + H + 2, wx + W + 2, wy + H + 2, { stroke: C.snow, strokeWidth: 2.4, roughness: .5 }, t);
    });
    // ventana redonda con cruz
    if (opt.round) { const [u, v] = opt.round, cx = x + u * w, cy = y - h + v * h, rr = w * .1; pen.circle(cx, cy, rr * 2, { fill: C.glow, fillStyle: 'solid' }, t); pen.line(cx - rr, cy, cx + rr, cy, { strokeWidth: .9 }, t); pen.line(cx, cy - rr, cx, cy + rr, { strokeWidth: .9 }, t); }
    // puerta
    const dw = w * (opt.doorW || .2), dh = h * (opt.doorH || .55), dx = x + w * (opt.doorX != null ? opt.doorX : .4);
    pen.rect(dx, y - dh, dw, dh, { fill: opt.doorColor || C.forest, fillStyle: 'solid' }, t);
    if (opt.open) { pen.rect(dx + 2, y - dh + 2, dw - 4, dh - 2, { fill: C.glow, fillStyle: 'solid', strokeWidth: .8 }, t); }
    pen.circle(dx + dw * .78, y - dh * .48, 2.4, { fill: C.gold, fillStyle: 'solid', strokeWidth: .6 }, t);
    if (opt.wreath) { pen.circle(dx + dw / 2, y - dh * .74, dw * .5, { stroke: C.forest, strokeWidth: 2.6, roughness: .8 }, t); pen.circle(dx + dw / 2, y - dh * .74 + dw * .24, 3, { fill: C.wine, fillStyle: 'solid', strokeWidth: .6 }, t); }
    // letrero
    if (opt.sign) {
      const sw = w * .42, sx = x + w * (opt.signX != null ? opt.signX : .14), sy = y - h * .93;
      pen.rect(sx, sy, sw, h * .14, { fill: C.cream, fillStyle: 'solid' }, t);
      el('text', { x: sx + sw / 2, y: sy + h * .105, 'text-anchor': 'middle', 'font-family': 'IM Fell English SC, Georgia, serif', 'font-size': Math.max(7, h * .1), 'letter-spacing': '.5', fill: C.ink }, t).textContent = opt.sign;
    }
    // nieve al pie
    pen.path(`M${x - 6},${y + 1} q${w * .2},-6 ${w * .4},-1 q${w * .25},-6 ${w * .6 + 8},0`, { fill: C.snow, fillStyle: 'solid', strokeWidth: .9 }, t);
    t.smoke = smoke; t.top = A[1];
    return t;
  };

  /* ---------- Humo de chimenea (dibujado; se mueve con CSS) ---------- */
  P.smoke = function (pen, g, x, y, k = 1) {
    const s = el('g', { class: 'smoke', transform: `translate(${x},${y}) scale(${k})` }, g);
    for (let i = 0; i < 3; i++) {
      const c = el('g', { class: 'puff', style: `animation-delay:${-i * 1.6}s` }, s);
      pen.path('M0,0 c-6,-4 -2,-10 3,-9 c2,-6 11,-5 10,1 c6,0 6,8 0,9 c-3,4 -11,3 -13,-1 z', { fill: C.snowS, fillStyle: 'solid', strokeWidth: .8, roughness: 1 }, c);
    }
    return s;
  };

  /* ---------- Personita de palitos ---------- */
  // tipos: 'elf' (gorro puntiagudo), 'santa', 'kid'. Mira a la derecha.
  P.figure = function (pen, g, opt = {}) {
    const f = el('g', { class: 'fig' + (opt.cls ? ' ' + opt.cls : '') }, g);
    const face = el('g', { class: 'face' }, f), bob = el('g', { class: 'bob' }, face);
    const coat = opt.coat || C.forest, hat = opt.hat || C.wine;
    pen.ellipse(2, .5, 13, 3, { stroke: 'none', fill: C.ink, fillStyle: 'hachure', hachureGap: 2.6, fillWeight: .5 }, f).setAttribute('opacity', .3);
    const legL = el('g', { class: 'leg l' }, bob), legR = el('g', { class: 'leg r' }, bob);
    pen.line(0, -10, -3.2, 0, { strokeWidth: 1.4 }, legL); pen.line(0, -10, 3.2, 0, { strokeWidth: 1.4 }, legR);
    if (opt.type === 'santa') {
      pen.fill([[-6, -9], [6, -9], [4.5, -20], [-4.5, -20]], C.wine, { strokeWidth: 1 }, bob);
      pen.line(-6, -9, 6, -9, { stroke: C.snow, strokeWidth: 2.2 }, bob);
      pen.line(-5, -13.5, 5, -13.5, { strokeWidth: 1.4 }, bob);
    } else {
      pen.fill([[-4.5, -9], [4.5, -9], [0, -19]], coat, { strokeWidth: 1 }, bob);
      pen.line(0, -9, 0, -19.5, { strokeWidth: 1.3 }, bob);
    }
    const arms = el('g', { class: 'arms' }, bob);
    if (opt.carry || opt.hold) { pen.line(0, -16, 6, -13, { strokeWidth: 1.3 }, arms); pen.line(0, -16, 6.5, -15, { strokeWidth: 1.3 }, arms); }
    else if (opt.pose === 'skate') { pen.line(0, -16, -7, -18, { strokeWidth: 1.3 }, arms); pen.line(0, -16, 7, -18, { strokeWidth: 1.3 }, arms); }
    else if (opt.pose === 'wave') { pen.line(0, -16, -6, -12, { strokeWidth: 1.3 }, arms); const w = el('g', { class: 'wave' }, arms); pen.line(0, -16, 6, -23, { strokeWidth: 1.3 }, w); }
    else { pen.line(0, -16, -5.5, -11, { strokeWidth: 1.3 }, arms); pen.line(0, -16, 5.5, -11, { strokeWidth: 1.3 }, arms); }
    pen.circle(0, -23.5, 8, { fill: C.skin, fillStyle: 'solid', strokeWidth: 1.1 }, bob);
    if (opt.type === 'santa') {
      pen.path('M-4,-22 q4,9 8,0 q-4,2 -8,0z', { fill: C.snow, fillStyle: 'solid', strokeWidth: .9 }, bob);
      pen.fill([[-4.4, -26], [4.4, -26], [6.5, -32]], C.wine, { strokeWidth: .9 }, bob);
      pen.circle(6.8, -32, 2.6, { fill: C.snow, fillStyle: 'solid', strokeWidth: .7 }, bob);
    } else if (opt.type !== 'kid') {
      pen.path('M-4,-26 q2,-3 4.5,-9 q2.5,-2 6.5,-1 q-3,2 -3,10 z', { fill: hat, fillStyle: 'solid', strokeWidth: .9 }, bob);
      pen.circle(7.2, -36, 2.4, { fill: C.snow, fillStyle: 'solid', strokeWidth: .7 }, bob);
    } else {
      pen.path('M-4,-26 q4,-5 8,0', { stroke: hat, strokeWidth: 2.2 }, bob);
    }
    if (opt.scarf) pen.line(-3, -19.5, 3.5, -19.5, { stroke: opt.scarf, strokeWidth: 2.2, roughness: .5 }, bob);
    let load = null;
    if (opt.carry) {
      load = el('g', { class: 'load' }, bob);
      if (opt.carry === 'letters') { pen.rect(5, -17, 7, 5, { fill: C.snow, fillStyle: 'solid', strokeWidth: .8 }, load); pen.line(5, -17, 8.5, -14.5, { strokeWidth: .6 }, load); pen.line(8.5, -14.5, 12, -17, { strokeWidth: .6 }, load); }
      else if (opt.carry === 'sack') { pen.ellipse(8, -15, 9, 10, { fill: C.beige, fillStyle: 'solid', strokeWidth: .9 }, load); }
      else if (opt.carry === 'hay') { pen.path('M3,-12 q5,-9 12,0 z', { fill: C.goldL, fillStyle: 'solid', strokeWidth: .8 }, load); }
      else if (opt.carry === 'star') { pen.circle(8, -17, 5, { fill: C.goldL, fillStyle: 'solid', strokeWidth: .8 }, load); }
      else { pen.rect(4.5, -18, 8, 7, { fill: opt.color || C.wine, fillStyle: 'solid', strokeWidth: .9 }, load); pen.line(8.5, -18, 8.5, -11, { stroke: C.goldL, strokeWidth: 1.4 }, load); }
    }
    if (opt.prop === 'barrow') { pen.path('M5,-7 h12 l-2,5 h-8 z', { fill: C.brown, fillStyle: 'solid', strokeWidth: .9 }, bob); pen.circle(16, -1, 4, { fill: C.ink, fillStyle: 'solid', strokeWidth: .6 }, bob); }
    if (opt.prop === 'cart') { pen.rect(6, -8, 13, 6, { fill: C.brown, fillStyle: 'solid', strokeWidth: .9 }, bob); pen.circle(9, -1, 3.4, { fill: C.ink, fillStyle: 'solid' }, bob); pen.circle(16, -1, 3.4, { fill: C.ink, fillStyle: 'solid' }, bob); }
    if (opt.prop === 'hammer') { const h = el('g', { class: 'hammer' }, arms); pen.line(5.5, -12, 9, -19, { stroke: C.brown, strokeWidth: 1.4 }, h); pen.rect(7, -22, 6, 3, { fill: C.stone, fillStyle: 'solid', strokeWidth: .7 }, h); }
    f.load = load; f.face = face;
    return f;
  };

  /* ---------- Reno ---------- */
  P.deer = function (pen, g, opt = {}) {
    const f = el('g', { class: 'deer' + (opt.cls ? ' ' + opt.cls : '') }, g);
    const face = el('g', { class: 'face' }, f), bob = el('g', { class: 'bob' }, face);
    pen.ellipse(2, .5, 30, 4, { stroke: 'none', fill: C.ink, fillStyle: 'hachure', hachureGap: 2.6 }, f).setAttribute('opacity', .3);
    [[-9, 'a'], [-5, 'b'], [7, 'b'], [11, 'a']].forEach(([lx, k]) => { const l = el('g', { class: 'leg ' + k }, bob); pen.line(lx, -10, lx + (k === 'a' ? -1 : 1), 0, { strokeWidth: 1.5 }, l); });
    pen.ellipse(1, -14, 28, 11, { fill: C.brown, fillStyle: 'solid' }, bob);
    pen.hatch([[1, -20], [14, -16], [14, -11], [1, -9]], { op: .45, hachureGap: 2.6 }, bob);
    pen.circle(-13, -16, 4, { fill: C.snow, fillStyle: 'solid', strokeWidth: .8 }, bob);
    const head = el('g', { class: 'head' }, bob);
    pen.fill([[9, -18], [15, -27], [19, -25], [14, -14]], C.brown, { strokeWidth: 1 }, head);
    pen.ellipse(19, -27.5, 10, 6, { fill: C.brown, fillStyle: 'solid', strokeWidth: 1 }, head);
    pen.circle(24, -27.5, 2.8, { fill: C.ink, fillStyle: 'solid' }, head);
    pen.path('M16,-30 q-2,-6 -6,-9 M14,-34 l-4,0 M18,-30 q2,-6 6,-9 M21,-35 l3,-2', { strokeWidth: 1.1 }, head);
    pen.line(11, -19, 17, -21, { stroke: C.wine, strokeWidth: 2, roughness: .5 }, head);
    pen.circle(14, -19, 3, { fill: C.goldL, fillStyle: 'solid', strokeWidth: .6 }, head);
    f.face = face;
    return f;
  };

  /* ---------- Otras piezas ---------- */
  P.lamp = function (pen, g, x, y, h = 34) {
    const t = el('g', {}, g);
    el('circle', { cx: x, cy: y - h - 2, r: 14, fill: C.glow, opacity: .28, class: 'glow' }, t);
    pen.line(x, y, x, y - h, { strokeWidth: 1.6 }, t);
    pen.rect(x - 4, y - h - 8, 8, 9, { fill: C.glow, fillStyle: 'solid', strokeWidth: 1 }, t);
    pen.path(`M${x - 6},${y - h - 8} L${x},${y - h - 13} L${x + 6},${y - h - 8} Z`, { fill: C.ink, fillStyle: 'solid', strokeWidth: .8 }, t);
    return t;
  };
  P.gift = function (pen, g, x, y, s, color, rib = C.goldL) {
    pen.rect(x, y - s, s, s * .9, { fill: color, fillStyle: 'solid', strokeWidth: .9 }, g);
    pen.line(x + s / 2, y - s, x + s / 2, y - s * .1, { stroke: rib, strokeWidth: 1.6, roughness: .4 }, g);
    pen.path(`M${x + s / 2},${y - s} q-3,-4 -5,-1 M${x + s / 2},${y - s} q3,-4 5,-1`, { stroke: rib, strokeWidth: 1.1 }, g);
  };
  P.giftPile = function (pen, g, x, y, n = 5) {
    const cols = [C.wine, C.forest, C.goldL, C.night, C.cream];
    [[-12, 0, 11], [0, 1, 13], [13, 0, 10], [-6, -10, 9], [6, -11, 10]].slice(0, n).forEach(([dx, dy, s], i) => P.gift(pen, g, x + dx, y + dy, s, cols[i % 5]));
  };
  P.fence = function (pen, g, x1, y1, x2, y2, n) {
    const t = el('g', {}, g);
    pen.line(x1, y1 - 7, x2, y2 - 7, { stroke: C.brown, strokeWidth: 1.6 }, t);
    pen.line(x1, y1 - 13, x2, y2 - 13, { stroke: C.brown, strokeWidth: 1.6 }, t);
    for (let i = 0; i <= n; i++) { const p = lerp([x1, y1], [x2, y2], i / n); pen.rect(p[0] - 2, p[1] - 17, 4, 17, { fill: C.brown, fillStyle: 'solid', strokeWidth: .8 }, t); pen.line(p[0] - 2.5, p[1] - 17.5, p[0] + 2.5, p[1] - 17.5, { stroke: C.snow, strokeWidth: 2, roughness: .4 }, t); }
    return t;
  };
  P.bench = function (pen, g, x, y) {
    pen.line(x - 11, y, x - 11, y - 6, { strokeWidth: 1.4 }, g); pen.line(x + 11, y, x + 11, y - 6, { strokeWidth: 1.4 }, g);
    pen.rect(x - 13, y - 8, 26, 3, { fill: C.brown, fillStyle: 'solid', strokeWidth: .9 }, g);
    pen.rect(x - 13, y - 14, 26, 3, { fill: C.brown, fillStyle: 'solid', strokeWidth: .9 }, g);
  };
  P.mailbox = function (pen, g, x, y) {
    pen.rect(x - 5, y - 20, 10, 20, { fill: C.wine, fillStyle: 'solid' }, g);
    pen.path(`M${x - 6},${y - 20} q6,-8 12,0 z`, { fill: C.wine, fillStyle: 'solid', strokeWidth: 1 }, g);
    pen.line(x - 3, y - 14, x + 3, y - 14, { strokeWidth: 1.4 }, g);
    pen.path(`M${x - 5},${y - 24} q5,-5 10,0`, { stroke: C.snow, strokeWidth: 2.2 }, g);
  };
  P.pole = function (pen, g, x, y, h = 46) {
    pen.rect(x - 3, y - h, 6, h, { fill: C.cream, fillStyle: 'solid', strokeWidth: 1 }, g);
    for (let k = 0; k < h - 6; k += 9) pen.line(x - 3, y - k - 2, x + 3, y - k - 7, { stroke: C.wine, strokeWidth: 2.4, roughness: .3 }, g);
    pen.circle(x, y - h - 4, 9, { fill: C.goldL, fillStyle: 'solid' }, g);
  };
  P.hills = function (pen, g, w, y, color, seed) {
    const r = rngFrom(seed);
    let d = `M-40,${y + 80} L-40,${y} `;
    for (let x = -40; x < w + 60; x += 60) d += `Q${x + 30},${y - 18 - r() * 22} ${x + 60},${y - r() * 8} `;
    d += `L${w + 60},${y + 80} Z`;
    return pen.path(d, { fill: color, fillStyle: 'solid', strokeWidth: .9, roughness: 1.2 }, g);
  };

  /* ---------- Guirnalda de foquitos ---------- */
  P.garland = function (svg, w, sag = 16) {
    const pen = P.pen(svg), g = pen.g({ class: 'garland' });
    const pts = [];
    const swags = Math.max(2, Math.round(w / 170));
    for (let i = 0; i <= swags * 8; i++) { const t = i / (swags * 8), x = -6 + (w + 12) * t, ph = (t * swags) % 1; pts.push([x, 6 + Math.sin(ph * Math.PI) * sag]); }
    pen.curve(pts, { strokeWidth: 1.2, roughness: .7 }, g);
    const cols = [C.wine, C.goldL, C.forest, C.cream];
    for (let i = 2; i < pts.length - 1; i += 2) {
      const [x, y] = pts[i], b = el('g', { class: 'bulb', style: `animation-delay:${-(i * .37) % 3}s` }, g);
      pen.rect(x - 1.8, y, 3.6, 3.4, { fill: C.ink, fillStyle: 'solid', strokeWidth: .5, roughness: .3 }, b);
      pen.ellipse(x, y + 8, 6.4, 9, { fill: cols[(i / 2) % 4], fillStyle: 'solid', strokeWidth: .9 }, b);
    }
    return g;
  };

  /* ---------- Marco a mano para tarjetas ---------- */
  P.frame = function (svg, w, h) {
    const pen = P.pen(svg);
    pen.rect(4, 4, w - 8, h - 8, { strokeWidth: 1.3, roughness: 1 });
    pen.rect(10, 10, w - 20, h - 20, { strokeWidth: .7, roughness: .9 });
  };

  /* ---------- El letrero "POSADA" (letras achuradas, marco ornamental) ---------- */
  let signN = 0;
  P.posadaSign = function (svg) {
    const id = 'ps' + (signN++);
    svg.setAttribute('viewBox', '0 0 360 132');
    svg.innerHTML = `<defs>
      <pattern id="${id}h" width="4.6" height="4.6" patternUnits="userSpaceOnUse" patternTransform="rotate(-38)"><rect width="4.6" height="4.6" fill="${C.wine}"/><line x1="0" y1="0" x2="0" y2="4.6" stroke="${C.ink}" stroke-width="1.5"/></pattern>
      <filter id="${id}w" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".045" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="2.6"/></filter></defs>`;
    const pen = P.pen(svg);
    const notch = (x0, y0, x1, y1, r) => `M${x0 + r},${y0} H${x1 - r} A${r},${r} 0 0 0 ${x1},${y0 + r} V${y1 - r} A${r},${r} 0 0 0 ${x1 - r},${y1} H${x0 + r} A${r},${r} 0 0 0 ${x0},${y1 - r} V${y0 + r} A${r},${r} 0 0 0 ${x0 + r},${y0} Z`;
    pen.path(notch(6, 8, 354, 124, 18), { fill: C.cream, fillStyle: 'solid', strokeWidth: 1.8, roughness: .9 });
    pen.path(notch(15, 17, 345, 115, 13), { strokeWidth: .9, roughness: .8 });
    [[22, 66], [338, 66]].forEach(([x, y]) => pen.poly([[x - 5, y], [x, y - 6], [x + 5, y], [x, y + 6]], { fill: C.gold, fillStyle: 'solid', strokeWidth: .8 }));
    const t = el('text', { x: 180, y: 92, 'text-anchor': 'middle', 'font-family': '"Playfair Display SC", Georgia, serif', 'font-weight': 900, 'font-size': 70, 'letter-spacing': 5, fill: `url(#${id}h)`, stroke: C.ink, 'stroke-width': 1.7, 'stroke-linejoin': 'round', filter: `url(#${id}w)` }, svg);
    t.textContent = 'POSADA';
    pen.path('M70,104 q110,10 220,0', { stroke: C.gold, strokeWidth: 1.1 });
  };

  /* ---------- Decorado: marcos a mano y guirnaldas en tarjetas ---------- */
  const sizes = new WeakMap();
  P.decorate = function () {
    document.querySelectorAll('.posada-sign').forEach(s => { if (!s.dataset.done) { P.posadaSign(s); s.dataset.done = 1; } });
    document.querySelectorAll('[data-frame]').forEach(box => {
      const w = Math.round(box.offsetWidth), h = Math.round(box.offsetHeight);
      if (!w || !h) return;
      const k = w + 'x' + h;
      if (sizes.get(box) === k) return;
      sizes.set(box, k);
      let f = box.querySelector(':scope > svg.frame'), gl = box.querySelector(':scope > svg.lights');
      if (!f) { f = el('svg', { class: 'frame', 'aria-hidden': 'true' }); box.prepend(f); }
      f.setAttribute('viewBox', `0 0 ${w} ${h}`); f.innerHTML = '';
      P.frame(f, w, h);
      if (box.dataset.frame === 'lights') {
        if (!gl) { gl = el('svg', { class: 'lights', 'aria-hidden': 'true' }); box.appendChild(gl); }
        gl.setAttribute('viewBox', `0 0 ${w} 40`); gl.innerHTML = '';
        P.garland(gl, w, 14);
      }
    });
  };
  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(P.decorate, 200); });
})();
