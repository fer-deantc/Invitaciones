/* =========================================================
   acuarela.js — las pinturas de la villa.

   Cada pieza de la escena se pinta aquí, a mano, en un canvas:
   lavados de acuarela con el borde más oscuro donde se junta el
   pigmento, toques de gouache, contorno de tinta suelto y grano
   de papel. Después villa.js las coloca en el espacio 3D.

   Referencias: toile de Jouy (pinos, cabañas y venados con
   grabado), Navidad en Nueva York de trazo suelto (el árbol de
   puntos de colores), la portada pintada con espátula (cielo y
   reflejos), la plaza nevada en acuarela (ventanas encendidas,
   nieve en las azoteas) y la fachada estilo Ralph Lauren (letrero
   verde con dorado, coronas con bolas doradas, camioneta verde).
   ========================================================= */
(function () {
  'use strict';
  const P = window.POSADA = window.POSADA || {};
  const A = P.paint = {};

  /* ---------- Paleta ---------- */
  const K = A.K = {
    ink: '#1a1d30', navy: '#0f1d42', navy2: '#16295a', cobalt: '#2350a8', electric: '#3d7ce0', mist: '#8aa2cf',
    snow: '#f5efe2', snowLit: '#fbf3df', snowB: '#c3d3ee', snowS: '#7f9cd6', snowD: '#4e6db3',
    gold: '#f6c453', goldW: '#ffe39a', amber: '#eb9634', goldD: '#c79a3c',
    pine: '#2c5a40', pineD: '#1b3d2c', racing: '#1f4d35', racingL: '#2f7049', sage: '#9fb79a', sageD: '#7b9878',
    burg: '#7d1e2e', burgL: '#a3303f', cream: '#f2e8d2', camel: '#c79a64', wood: '#7a5638', woodD: '#4a3222',
    stone: '#d9d1c1', stoneS: '#9ea8c2', brick: '#9a4b3b', slate: '#5d6b88', iron: '#22252f',
    skin: ['#f1d0b2', '#e3b48f', '#c99068', '#9e6e4c'], hair: ['#3b2a20', '#6b4a2a', '#c99a5b', '#1e1a1a', '#8a3b22']
  };
  const COATS = A.COATS = ['#7d1e2e', '#1f4d35', '#16295a', '#c79a64', '#2350a8', '#5a6b4b', '#8a4a2e', '#3c3f55', '#a3303f', '#d7c7a6', '#2f7049', '#6e2a4a'];
  const HATS = A.HATS = ['#7d1e2e', '#f2e8d2', '#1f4d35', '#16295a', '#c79a3c', '#a3303f', '#2350a8'];

  /* ---------- Utilidades ---------- */
  let seed = 1;
  const rnd = A.rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  A.seed = s => { seed = (Math.abs(s | 0) % 2147483646) + 1; };
  const S = 2;
  const cv = A.cv = (w, h) => { const c = document.createElement('canvas'); c.width = Math.ceil(w * S); c.height = Math.ceil(h * S); const g = c.getContext('2d'); g.scale(S, S); g.lineCap = 'round'; g.lineJoin = 'round'; c.lw = w; c.lh = h; return [c, g]; };
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const shade = A.shade = (h, k) => { const [r, g, b] = hex(h); return `rgb(${Math.min(255, r * k) | 0},${Math.min(255, g * k) | 0},${Math.min(255, b * k) | 0})`; };
  const mix = A.mix = (a, b, t) => { const x = hex(a), y = hex(b); return `rgb(${x[0] + (y[0] - x[0]) * t | 0},${x[1] + (y[1] - x[1]) * t | 0},${x[2] + (y[2] - x[2]) * t | 0})`; };
  let noiseCanvas = null;
  function grain(g, w, h, a = .55) {
    if (!noiseCanvas) {
      noiseCanvas = document.createElement('canvas'); noiseCanvas.width = noiseCanvas.height = 128;
      const ng = noiseCanvas.getContext('2d'), id = ng.createImageData(128, 128);
      for (let i = 0; i < id.data.length; i += 4) { const v = Math.random() < .5 ? 30 : 230; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = Math.random() < .55 ? 34 : 0; }
      ng.putImageData(id, 0, 0);
    }
    g.save(); g.globalCompositeOperation = 'source-atop'; g.globalAlpha = a; g.fillStyle = g.createPattern(noiseCanvas, 'repeat'); g.fillRect(0, 0, w, h); g.restore();
  }
  A.grain = grain;
  function path(g, pts, j = 1.6, closed = true) {
    g.beginPath();
    for (let i = 0; i < pts.length; i++) { const x = pts[i][0] + (rnd() - .5) * j, y = pts[i][1] + (rnd() - .5) * j; i ? g.lineTo(x, y) : g.moveTo(x, y); }
    if (closed) g.closePath();
  }
  // lavado de acuarela: tres capas transparentes + borde con más pigmento
  const wash = A.wash = (g, pts, col, a = .9, o = {}) => {
    g.save(); g.fillStyle = col;
    for (let k = 0; k < 3; k++) { g.globalAlpha = a * .42; path(g, pts, o.j == null ? 2 : o.j); g.fill(); }
    if (o.edge !== false) { g.globalAlpha = a * .5; g.strokeStyle = shade(col, .7); g.lineWidth = o.ew || 1.1; path(g, pts, .9); g.stroke(); }
    g.restore();
  };
  // tinta: trazo suelto, con pequeños temblores
  const ink = A.ink = (g, pts, w = .8, closed = false, a = .88, col = K.ink) => {
    g.save(); g.strokeStyle = col; g.globalAlpha = a; g.lineWidth = w; g.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const x = pts[i][0] + (rnd() - .5) * .7, y = pts[i][1] + (rnd() - .5) * .7;
      if (!i) g.moveTo(x, y); else { const p = pts[i - 1]; g.quadraticCurveTo((p[0] + x) / 2 + (rnd() - .5) * 1.1, (p[1] + y) / 2 + (rnd() - .5) * 1.1, x, y); }
    }
    if (closed) g.closePath(); g.stroke(); g.restore();
  };
  const line = A.line = (g, x1, y1, x2, y2, w = .8, a = .85, col = K.ink) => ink(g, [[x1, y1], [x2, y2]], w, false, a, col);
  const dab = A.dab = (g, x, y, rx, ry, col, a = .8, rot = 0) => { g.save(); g.globalAlpha = a; g.fillStyle = col; g.translate(x, y); g.rotate(rot); g.beginPath(); g.ellipse(0, 0, Math.max(.3, rx), Math.max(.3, ry), 0, 0, 6.2832); g.fill(); g.restore(); };
  const brush = A.brush = (g, x1, y1, x2, y2, w, col, a = .8) => {
    g.save(); g.strokeStyle = col; g.globalAlpha = a; g.lineWidth = w; g.beginPath(); g.moveTo(x1, y1);
    g.quadraticCurveTo((x1 + x2) / 2 + (rnd() - .5) * w * 1.6, (y1 + y2) / 2 + (rnd() - .5) * w * 1.6, x2, y2); g.stroke();
    g.globalAlpha = a * .45; g.lineWidth = w * .5; g.beginPath(); g.moveTo(x1 + w * .3, y1 - w * .2); g.lineTo(x2 + w * .2, y2 - w * .2); g.stroke(); g.restore();
  };
  const glow = A.glow = (g, x, y, r, rgb = '255,196,96', a = .6) => {
    const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(.4, `rgba(${rgb},${a * .35})`); gr.addColorStop(1, `rgba(${rgb},0)`);
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore();
  };
  const shadeSide = (g, w, h, x0, x1, a = .45) => { g.save(); g.globalCompositeOperation = 'source-atop'; const gr = g.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, 'rgba(18,34,86,0)'); gr.addColorStop(1, `rgba(18,34,86,${a})`); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.restore(); };

  /* ---------- Ventana encendida ---------- */
  function windowLit(g, x, y, w, h, o = {}) {
    const gr = g.createRadialGradient(x + w / 2, y + h * .6, 1, x + w / 2, y + h / 2, Math.max(w, h));
    gr.addColorStop(0, K.goldW); gr.addColorStop(.5, K.gold); gr.addColorStop(1, K.amber);
    g.save(); g.fillStyle = gr; path(g, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], .5); g.fill(); g.restore();
    if (o.silh) { dab(g, x + w * .5, y + h * .62, w * .28, h * .3, 'rgba(40,30,40,.7)'); dab(g, x + w * .5, y + h * .32, w * .17, w * .17, 'rgba(40,30,40,.72)'); }
    if (o.teddy) teddyInWindow(g, x + w * .5, y + h * .9, w * .8);
    ink(g, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], .75, true);
    line(g, x + w / 2, y, x + w / 2, y + h, .55, .7); line(g, x, y + h * .45, x + w, y + h * .45, .55, .7);
    brush(g, x - 1.5, y + h + 1, x + w + 1.5, y + h + 1, 2.2, K.snowLit, .95);
    if (o.wreath) wreath(g, x + w / 2, y - 3.5, w * .32);
    glow(g, x + w / 2, y + h / 2, Math.max(w, h) * 1.25, '255,190,90', .42);
  }
  function wreath(g, x, y, r) {
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; dab(g, x + Math.cos(a) * r, y + Math.sin(a) * r, r * .42, r * .3, i % 2 ? K.pine : K.racingL, .9, a); }
    for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283 + .3; dab(g, x + Math.cos(a) * r, y + Math.sin(a) * r, r * .17, r * .17, K.gold, 1); }
    dab(g, x - r * .25, y + r * .9, r * .3, r * .18, K.burg, 1, .5); dab(g, x + r * .25, y + r * .9, r * .3, r * .18, K.burg, 1, -.5);
  }
  function garland(g, pts, w = 3) {
    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[i + 1], n = Math.max(2, Math.round(Math.hypot(x2 - x1, y2 - y1) / 2.6));
      for (let k = 0; k < n; k++) { const t = k / n, x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t; dab(g, x, y, w * .7, w * .45, k % 2 ? K.pine : K.racingL, .9, rnd() * 3); if (k % 3 === 0) dab(g, x, y + w * .3, w * .32, w * .32, K.gold, 1); }
    }
  }
  A.wreath = wreath;

  /* ---------- Pino nevado (toile / acuarela) ---------- */
  A.pine = (o = {}) => {
    A.seed(o.seed || 7);
    const W = 90, H = 150, [c, g] = cv(W, H), cx = 45, base = 146, top = 8, snow = o.snow == null ? 1 : o.snow, col = o.color || K.pine;
    brush(g, cx, base, cx, base - 20, 3.4, K.woodD, .9);
    const sil = [[cx, top - 2]]; for (let i = 0; i <= 10; i++) { const t = i / 10, y = top + (base - 26 - top) * t + 8; sil.push([cx + (4 + t * 37) * (i % 2 ? .78 : 1), y]); }
    for (let i = 10; i >= 0; i--) { const t = i / 10, y = top + (base - 26 - top) * t + 8; sil.push([cx - (4 + t * 37) * (i % 2 ? .78 : 1), y]); }
    wash(g, sil, shade(col, .82), .85, { ew: .8 });
    const n = 10;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1), y = top + (base - 26 - top) * t + 4, w = 4 + t * 37;
      dab(g, cx, y + 5, w * .82, 2.6, shade(col, .5), .45);
      for (let k = 0; k < 9; k++) { const s = k % 2 ? 1 : -1, dx = s * rnd() * w, dr = Math.abs(dx) / Math.max(1, w) * 6; dab(g, cx + dx, y + dr, 3 + rnd() * w * .26, 2.2 + rnd() * 2.4, shade(col, .78 + rnd() * .4), .55, s * (.25 + rnd() * .35)); }
      if (snow) for (let k = 0; k < 5; k++) { const s = k % 2 ? 1 : -1, dx = s * rnd() * w * .85; dab(g, cx + dx, y - 1.4 + Math.abs(dx) / Math.max(1, w) * 5, 2.6 + rnd() * w * .2, 1.4 + rnd() * 1.1, s > 0 ? K.snowB : K.snowLit, .92 * snow, s * .3); }
      ink(g, [[cx - w, y + 6], [cx - w * .5, y + 2], [cx, y - 1.5], [cx + w * .5, y + 2], [cx + w, y + 6]], .5, false, .5);
    }
    shadeSide(g, W, H, cx - 25, cx + 42, .5);
    for (let k = 0; k < 18; k++) { const y = 28 + rnd() * 104, x = cx + 4 + rnd() * (y / 4); line(g, x, y, x + 5, y + 4, .35, .38); }
    grain(g, W, H);
    return c;
  };

  /* ---------- Árbol de Navidad enorme (puntos de colores sueltos) ---------- */
  A.bigTree = () => {
    A.seed(99);
    const W = 260, H = 430, [c, g] = cv(W, H), cx = 130, base = 424, top = 26;
    brush(g, cx, base, cx, base - 36, 9, K.woodD, .95);
    { const sil = [[cx, top]]; for (let i = 0; i <= 18; i++) { const y = top + (base - 46 - top) * i / 18 + 14; sil.push([cx + (6 + (y - top) / (base - 40 - top) * 112) * (i % 2 ? .82 : 1), y]); } for (let i = 18; i >= 0; i--) { const y = top + (base - 46 - top) * i / 18 + 14; sil.push([cx - (6 + (y - top) / (base - 40 - top) * 112) * (i % 2 ? .82 : 1), y]); } wash(g, sil, shade(K.pine, .85), .9, { ew: 1 }); }
    const tw = y => 6 + (y - top) / (base - 40 - top) * 112;
    for (let i = 0; i < 18; i++) {
      const t = i / 17, y = top + (base - 46 - top) * t + 6, w = tw(y);
      dab(g, cx, y + 9, w * .86, 4, K.pineD, .5);
      for (let k = 0; k < 16; k++) { const s = k % 2 ? 1 : -1, dx = s * rnd() * w, dr = Math.abs(dx) / w * 11; dab(g, cx + dx, y + dr, 5 + rnd() * w * .22, 3 + rnd() * 4, shade(K.pine, .75 + rnd() * .45), .55, s * (.3 + rnd() * .3)); }
      for (let k = 0; k < 3; k++) { const s = k % 2 ? 1 : -1, dx = s * rnd() * w * .7; dab(g, cx + dx, y + Math.abs(dx) / w * 9, 4 + rnd() * 6, 1.6, K.snowLit, .55, s * .35); }
      ink(g, [[cx - w, y + 11], [cx - w * .5, y + 4], [cx, y], [cx + w * .5, y + 4], [cx + w, y + 11]], .6, false, .45);
    }
    shadeSide(g, W, H, cx - 40, cx + 120, .38);
    const lights = [];
    // cadenas de luces doradas en espiral
    for (let s = 0; s < 5; s++) {
      const y0 = 70 + s * 66, pts = [];
      for (let k = 0; k <= 16; k++) { const t = k / 16, y = y0 + t * 40, w = tw(y) * .92; pts.push([cx - w + 2 * w * t, y + Math.sin(t * Math.PI) * 8]); }
      for (let k = 0; k < pts.length; k++) { const [x, y] = pts[k]; dab(g, x, y, 1.7, 1.7, K.goldW, 1); if (k % 2) lights.push([x / W, y / H, 0xffd27a]); }
    }
    // puntos de colores (como la ilustración de Nueva York)
    const dots = [K.burgL, K.gold, '#f3f0e6', K.racingL, '#3d6fd0', K.amber, '#e05a4a'];
    for (let i = 0; i < 240; i++) { const y = top + 24 + rnd() * (base - 70 - top), w = tw(y) * .95, x = cx + (rnd() * 2 - 1) * w; dab(g, x, y, 1.6 + rnd() * 1.6, 1.4 + rnd() * 1.4, dots[i % dots.length], .9, rnd() * 3); }
    // esferas rojas, doradas y blancas
    const balls = [K.burg, K.gold, '#f5f0e4'];
    for (let i = 0; i < 46; i++) {
      const y = top + 40 + rnd() * (base - 90 - top), w = tw(y) * .88, x = cx + (rnd() * 2 - 1) * w, r = 3 + rnd() * 2.6, col = balls[i % 3];
      line(g, x, y - r - 2, x, y - r, .5, .6);
      dab(g, x, y, r, r, col, 1); dab(g, x - r * .35, y - r * .35, r * .3, r * .3, '#fff', .7); ink(g, [[x - r, y], [x, y - r], [x + r, y], [x, y + r], [x - r, y]], .45, true, .6);
      if (i % 4 === 0) lights.push([x / W, y / H, col === K.burg ? 0xff8a6a : 0xffe0a0]);
    }
    // estrella dorada
    const st = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 6 : 15; st.push([cx + Math.cos(a) * r, top - 4 + Math.sin(a) * r]); }
    glow(g, cx, top - 4, 40, '255,210,120', .7);
    wash(g, st, K.gold, 1); ink(g, st, .8, true);
    lights.push([cx / W, (top - 4) / H, 0xffe7a0]);
    grain(g, W, H, .45);
    c.lights = lights;
    return c;
  };

  /* ---------- Casas (cabañas, piedra, fachadas de ciudad) ---------- */
  A.house = (o = {}) => {
    A.seed(o.seed || 3);
    const W = 230, H = 240, [c, g] = cv(W, H), base = 232;
    const floors = o.floors || 1, fh = o.fh || 38, w = o.w || 110, d = o.d || 34, hgt = fh * floors;
    const fx = W / 2 - w / 2 - d * .3, top = base - hgt;
    const dx = d * .85, dy = -d * .42;
    const wall = o.wall || K.stone, roof = o.roof || K.slate;
    // muro lateral (en sombra azul)
    const side = [[fx + w, base], [fx + w + dx, base + dy], [fx + w + dx, top + dy], [fx + w, top]];
    wash(g, side, mix(wall, K.snowD, .45), .95);
    // fachada
    const front = [[fx, base], [fx + w, base], [fx + w, top], [fx, top]];
    wash(g, front, wall, .95);
    if (o.type === 'cabin') for (let y = top + 5; y < base - 2; y += 5) { line(g, fx + 1, y, fx + w - 1, y + (rnd() - .5), .4, .4); line(g, fx + w + 1, y, fx + w + dx - 1, y + dy, .35, .35); }
    if (o.type === 'stone') for (let y = top + 6; y < base - 3; y += 7) for (let x = fx + 2 + (y % 14 ? 0 : 6); x < fx + w - 8; x += 13) ink(g, [[x, y], [x + 11, y], [x + 11, y + 6]], .35, false, .35);
    if (o.type === 'town') { brush(g, fx - 2, top + 3, fx + w + 2, top + 3, 3, shade(wall, .75), .8); if (floors > 1) brush(g, fx, top + fh + 2, fx + w, top + fh + 2, 2, shade(wall, .8), .6); }
    // techo nevado
    const rh = o.rh || 30;
    let smoke;
    if (o.gable === 'front') {
      const A1 = [fx + w / 2, top - rh];
      wash(g, [[fx, top], A1, [fx + w, top]], wall, .95);
      const R = [[A1[0], A1[1]], [fx + w + 5, top + 3], [fx + w + dx + 5, top + dy + 3], [A1[0] + dx, A1[1] + dy]];
      wash(g, R, roof, .95);
      wash(g, [[A1[0] + 1, A1[1] + 2], [fx + w + 2, top - 1], [fx + w + dx + 2, top + dy - 1], [A1[0] + dx + 1, A1[1] + dy + 2]], K.snowB, .95);
      wash(g, [[A1[0], A1[1] - 1], [fx - 5, top + 3], [fx - 2, top + 6], [A1[0], A1[1] + 5]], K.snowLit, .95);
      ink(g, [[fx - 5, top + 3], A1, [fx + w + 5, top + 3], [fx + w + dx + 5, top + dy + 3], [A1[0] + dx, A1[1] + dy], A1], .8);
      windowLit(g, A1[0] - 5, top - rh * .55, 10, 11, { teddy: o.teddy && floors === 1 });
      smoke = [fx + w * .78 + dx * .5, top - rh * .7 + dy * .5];
    } else {
      const R = [[fx - 6, top + 3], [fx + w + 6, top + 3], [fx + w + dx * .55 + 4, top - rh], [fx + dx * .55 - 4, top - rh]];
      wash(g, R, roof, .95);
      wash(g, [[fx - 5, top], [fx + w + 5, top], [fx + w + dx * .55 + 3, top - rh - 1], [fx + dx * .55 - 3, top - rh - 1]], K.snowLit, .95);
      wash(g, [[fx - 5, top + 1], [fx + w + 5, top + 1], [fx + w + 5, top - 4], [fx - 5, top - 4]], K.snowB, .85, { edge: false });
      wash(g, [[fx + w, top], [fx + w + dx, top + dy], [fx + w + dx * .55 + 3, top - rh - 1]], mix(wall, K.snowD, .45), .95);
      ink(g, [[fx - 6, top + 3], [fx + w + 6, top + 3], [fx + w + dx * .55 + 4, top - rh], [fx + dx * .55 - 4, top - rh], [fx - 6, top + 3]], .8);
      if (o.dormer) { const x = fx + w * .4; wash(g, [[x, top - 6], [x + 16, top - 6], [x + 16, top - 20], [x + 8, top - 27], [x, top - 20]], wall, .95); windowLit(g, x + 3, top - 19, 10, 11, { teddy: o.teddy }); }
      smoke = [fx + w * .78, top - rh * .8];
    }
    // carámbanos
    for (let x = fx; x < fx + w; x += 6 + rnd() * 6) line(g, x, top + 3, x + .4, top + 5 + rnd() * 4, .5, .45, '#e8f0ff');
    // chimenea
    if (o.chimney !== false) {
      const [sx, sy] = smoke;
      wash(g, [[sx - 5, sy + 10], [sx + 5, sy + 10], [sx + 5, sy - 6], [sx - 5, sy - 6]], K.brick, .95);
      wash(g, [[sx - 7, sy - 6], [sx + 7, sy - 6], [sx + 6, sy - 10], [sx - 6, sy - 10]], K.snowLit, .95);
      ink(g, [[sx - 5, sy + 10], [sx - 5, sy - 6], [sx + 5, sy - 6], [sx + 5, sy + 10]], .6);
      smoke = [sx, sy - 11];
    }
    // ventanas encendidas (algunas con gente o con Teddy)
    const per = Math.max(2, Math.floor(w / 30));
    for (let f = 0; f < floors; f++) {
      const wy = top + f * fh + fh * .26;
      for (let i = 0; i < per; i++) {
        const wx = fx + (i + .5) * (w / per) - 6;
        if (f === floors - 1 && i === Math.floor(per / 2) && o.door !== false) continue;
        const idx = f * per + i;
        windowLit(g, wx, wy, 12, 15, { silh: o.silh && idx % 3 === 1, teddy: o.teddy && floors > 1 && f === 0 && i === 0, wreath: o.wreaths && f === 0 });
        if (o.balcony && f === 0 && floors > 1) { ink(g, [[wx - 3, wy + 19], [wx + 15, wy + 19]], .7); for (let k = 0; k < 5; k++) ink(g, [[wx - 2 + k * 4, wy + 19], [wx - 2 + k * 4, wy + 24]], .4, false, .7); ink(g, [[wx - 3, wy + 24], [wx + 15, wy + 24]], .6); }
      }
    }
    // puerta con corona y guirnalda
    if (o.door !== false) {
      const dw = 15, dh = 24, x = fx + w / 2 - dw / 2;
      wash(g, [[x, base], [x + dw, base], [x + dw, base - dh], [x, base - dh]], o.doorColor || K.burg, .95);
      glow(g, x + dw / 2, base - dh * .5, 22, '255,190,90', .3);
      ink(g, [[x, base], [x, base - dh], [x + dw, base - dh], [x + dw, base]], .7);
      wreath(g, x + dw / 2, base - dh * .62, 4.4);
      if (o.garland) garland(g, [[x - 4, base], [x - 4, base - dh - 3], [x + dw / 2, base - dh - 7], [x + dw + 4, base - dh - 3], [x + dw + 4, base]], 3);
      dab(g, x - 6, base - dh * .7, 2, 2.6, K.gold, 1); glow(g, x - 6, base - dh * .7, 10, '255,200,110', .5);
    }
    // contornos de tinta
    ink(g, front, .85, true); ink(g, side, .7, true, .7);
    // nieve al pie
    for (let x = fx - 8; x < fx + w + dx + 6; x += 7) dab(g, x, base + 1 - (x > fx + w ? (x - fx - w) * .42 : 0), 6 + rnd() * 4, 2.6 + rnd() * 1.6, rnd() < .5 ? K.snowLit : K.snowB, .95);
    grain(g, W, H);
    c.smoke = [smoke[0] / W, smoke[1] / H];
    c.lightAt = [.5, (top + hgt * .4) / H];
    return c;
  };

  /* ---------- La tienda "Santa & Co." ---------- */
  A.store = () => {
    A.seed(77);
    const W = 300, H = 250, [c, g] = cv(W, H), base = 242, w = 214, fx = 26, top = base - 120, dx = 30, dy = -14;
    wash(g, [[fx + w, base], [fx + w + dx, base + dy], [fx + w + dx, top + dy], [fx + w, top]], mix(K.stone, K.snowD, .45), .95);
    wash(g, [[fx, base], [fx + w, base], [fx + w, top], [fx, top]], '#e6dcc8', .95);
    for (let y = top + 8; y < base - 4; y += 9) line(g, fx + 2, y, fx + w - 2, y, .3, .3);
    // cornisa y techo nevado
    brush(g, fx - 4, top + 2, fx + w + 4, top + 2, 4, '#cfc4ae', .9);
    wash(g, [[fx - 6, top + 1], [fx + w + 6, top + 1], [fx + w + dx * .6, top - 22], [fx + dx * .6, top - 22]], K.snowLit, .95);
    wash(g, [[fx - 6, top + 2], [fx + w + 6, top + 2], [fx + w + 6, top - 3], [fx - 6, top - 3]], K.snowB, .85, { edge: false });
    // planta alta: ventanas con coronas y balcones de hierro
    for (let i = 0; i < 3; i++) { const wx = fx + 30 + i * 66, wy = top + 14; windowLit(g, wx, wy, 22, 26, { wreath: true, silh: i === 1 }); ink(g, [[wx - 4, wy + 30], [wx + 26, wy + 30]], .8); for (let k = 0; k < 8; k++) dab(g, wx - 3 + k * 4, wy + 33, 1.3, 2.4, 'rgba(0,0,0,0)', 0); ink(g, [[wx - 4, wy + 36], [wx + 26, wy + 36]], .6); for (let k = 0; k < 7; k++) ink(g, [[wx - 2 + k * 4.5, wy + 30], [wx - 2 + k * 4.5, wy + 36]], .45, false, .7); }
    // planta baja: arco de entrada con guirnalda, escaparates
    const ex = fx + w / 2, ey = base;
    const arch = (x, wdt, hgt) => { const p = []; for (let k = 0; k <= 12; k++) { const a = Math.PI - k / 12 * Math.PI; p.push([x + Math.cos(a) * wdt / 2, ey - hgt + wdt / 2 - Math.sin(a) * wdt / 2]); } return [[x - wdt / 2, ey], ...p, [x + wdt / 2, ey]]; };
    const door = arch(ex, 34, 58);
    wash(g, door, K.goldW, 1); glow(g, ex, ey - 25, 40, '255,200,110', .55); ink(g, door, .9);
    wash(g, [[ex - 2, ey], [ex - 2, ey - 40], [ex - 14, ey - 38], [ex - 14, ey]], K.navy2, .9);
    garland(g, door.slice(1, -1).map(([x, y]) => [x + (x < ex ? -4 : 4), y - 4]), 3.4);
    for (const s of [-1, 1]) {
      const wx = ex + s * 64, win = arch(wx, 40, 52);
      wash(g, win, '#f7d98a', 1); glow(g, wx, ey - 26, 34, '255,200,110', .45); ink(g, win, .8);
      if (s < 0) { // escaparate con dos ositos
        [[wx - 8, '#7d1e2e'], [wx + 8, '#1f4d35']].forEach(([bx, sw]) => { dab(g, bx, ey - 14, 6, 7, sw, 1); dab(g, bx, ey - 26, 5, 5, K.camel, 1); dab(g, bx - 4, ey - 30, 1.8, 1.8, K.camel, 1); dab(g, bx + 4, ey - 30, 1.8, 1.8, K.camel, 1); dab(g, bx, ey - 24.5, 1.8, 1.4, K.cream, 1); ink(g, [[bx - 5, ey - 26], [bx, ey - 31], [bx + 5, ey - 26], [bx, ey - 21], [bx - 5, ey - 26]], .4, true, .6); });
      } else for (let k = 0; k < 9; k++) dab(g, wx - 14 + rnd() * 28, ey - 40 + rnd() * 30, 1.5, 1.5, k % 2 ? K.burgL : K.goldW, 1);
    }
    // letrero verde con borde dorado (nombre inventado, sin marcas)
    const sx = ex - 52, sy = ey - 84;
    wash(g, [[sx, sy], [sx + 104, sy], [sx + 104, sy + 20], [sx, sy + 20]], K.racing, 1);
    g.save(); g.strokeStyle = K.goldD; g.lineWidth = 1.6; g.strokeRect(sx + 2.5, sy + 2.5, 99, 15); g.restore();
    g.save(); g.fillStyle = K.cream; g.font = 'italic 600 13px "Cormorant Garamond", Georgia, serif'; g.textAlign = 'center'; g.fillText('Santa & Co.', ex, sy + 14.5); g.restore();
    ink(g, [[sx, sy], [sx + 104, sy], [sx + 104, sy + 20], [sx, sy + 20]], .8, true);
    // coníferas recortadas en macetas
    for (const s of [-1, 1]) {
      const tx = ex + s * 30;
      wash(g, [[tx - 6, ey], [tx + 6, ey], [tx + 7, ey - 10], [tx - 7, ey - 10]], '#efe8da', .95); ink(g, [[tx - 6, ey], [tx - 7, ey - 10], [tx + 7, ey - 10], [tx + 6, ey]], .6);
      for (let k = 0; k < 14; k++) { const t = k / 14; dab(g, tx + (rnd() - .5) * (1 - t) * 14, ey - 12 - t * 40, 4 * (1 - t) + 2, 3, shade(K.pine, .8 + rnd() * .4), .8, rnd()); }
      ink(g, [[tx - 8, ey - 12], [tx, ey - 54], [tx + 8, ey - 12]], .5, false, .5);
    }
    // pizarrón con menú y flores rojas en cubetas
    wash(g, [[fx + w - 16, ey], [fx + w + 6, ey], [fx + w + 4, ey - 30], [fx + w - 14, ey - 30]], '#2b2f2c', .95);
    for (let k = 0; k < 5; k++) line(g, fx + w - 12, ey - 25 + k * 5, fx + w + (rnd() * 2), ey - 25 + k * 5, .5, .7, '#e8e6dc');
    for (const bx of [fx + 10, fx + 24]) { wash(g, [[bx - 5, ey], [bx + 5, ey], [bx + 6, ey - 9], [bx - 6, ey - 9]], '#b8bcc6', .95); for (let k = 0; k < 9; k++) { brush(g, bx + (rnd() - .5) * 6, ey - 9, bx + (rnd() - .5) * 12, ey - 20 - rnd() * 8, 1, K.pine, .8); dab(g, bx + (rnd() - .5) * 12, ey - 19 - rnd() * 9, 2, 2.6, K.burgL, .95); } }
    ink(g, [[fx, base], [fx, top], [fx + w, top], [fx + w, base]], .9);
    for (let x = fx - 8; x < fx + w + dx; x += 7) dab(g, x, base + 1, 6 + rnd() * 4, 2.4, rnd() < .5 ? K.snowLit : K.snowB, .95);
    grain(g, W, H);
    return c;
  };

  /* ---------- Camioneta verde vintage ---------- */
  A.truck = () => {
    A.seed(55);
    const W = 190, H = 120, [c, g] = cv(W, H), gb = 108;
    dab(g, 98, gb + 2, 84, 7, 'rgba(30,50,110,.35)', 1);
    const body = [[22, gb - 10], [24, gb - 54], [40, gb - 74], [120, gb - 76], [150, gb - 70], [170, gb - 46], [174, gb - 12], [22, gb - 10]];
    wash(g, body, K.racingL, 1);
    wash(g, [[120, gb - 76], [150, gb - 70], [170, gb - 46], [174, gb - 12], [150, gb - 12], [146, gb - 66]], shade(K.racingL, .7), .7, { edge: false });
    for (let x = 34; x < 116; x += 7) line(g, x, gb - 66, x, gb - 20, .5, .4);
    wash(g, [[128, gb - 70], [148, gb - 66], [164, gb - 46], [130, gb - 46]], '#a9c4e8', .95);
    wash(g, [[52, gb - 64], [104, gb - 64], [104, gb - 40], [52, gb - 40]], K.goldW, .95); glow(g, 78, gb - 52, 46, '255,200,110', .5);
    brush(g, 48, gb - 66, 108, gb - 66, 3, K.cream, .9);
    ink(g, body, .9, true); ink(g, [[52, gb - 64], [104, gb - 64], [104, gb - 40], [52, gb - 40]], .6, true);
    for (const wx of [48, 148]) { dab(g, wx, gb - 8, 13, 13, K.iron, 1); dab(g, wx, gb - 8, 6, 6, K.cream, 1); dab(g, wx, gb - 8, 2, 2, K.iron, 1); }
    dab(g, 172, gb - 30, 4, 4, K.goldW, 1); glow(g, 176, gb - 30, 18, '255,220,140', .6);
    A.wreath(g, 166, gb - 54, 7);
    brush(g, 20, gb - 12, 176, gb - 12, 2, '#c9ccd4', .8);
    grain(g, W, H);
    return c;
  };

  /* ---------- Personas (abrigos de lana, gorros con pompón, bufandas) ---------- */
  function drawPerson(g, o, ox = 0) {
    const cx = 22 + ox, foot = 74, pose = o.pose || 'stand';
    const coat = o.coat, pants = o.pants || '#2a2f45', skin = o.skin || K.skin[0], hat = o.hat, scarf = o.scarf, k = o.kid ? .76 : 1;
    g.save(); g.translate(cx, foot); g.scale(k, k); g.translate(-cx, -foot);
    let lf = [cx - 3.5, foot], rf = [cx + 3.5, foot], hip = [cx, 52], lean = 0;
    if (pose === 'walkA') { lf = [cx - 7, foot]; rf = [cx + 6, foot - 1]; }
    if (pose === 'walkB') { lf = [cx - 1, foot]; rf = [cx + 1.5, foot - 1]; }
    if (pose === 'skateA') { lf = [cx - 2, foot]; rf = [cx + 12, foot - 4]; lean = -.12; }
    if (pose === 'skateB') { lf = [cx - 10, foot - 4]; rf = [cx + 3, foot]; lean = .12; }
    if (pose === 'kid') { lf = [cx - 6, foot]; rf = [cx + 6, foot]; }
    if (pose === 'fall') { hip = [cx - 2, 66]; lf = [cx + 12, foot - 2]; rf = [cx + 15, foot - 5]; }
    // las piernas pueden caminar aunque los brazos carguen algo
    if (o.legs === 'A') { lf = [cx - 7, foot]; rf = [cx + 6, foot - 1]; }
    if (o.legs === 'B') { lf = [cx - 1, foot]; rf = [cx + 1.5, foot - 1]; }
    g.save(); g.translate(cx, foot); g.rotate(lean); g.translate(-cx, -foot);
    const top = pose === 'fall' ? 46 : 32;
    // piernas y botas
    brush(g, hip[0] - 2, hip[1], lf[0], lf[1] - 3, 4, pants, .95); brush(g, hip[0] + 2, hip[1], rf[0], rf[1] - 3, 4, pants, .95);
    dab(g, lf[0] + 1, lf[1] - 1.6, 3.6, 2.2, '#3b2618', 1); dab(g, rf[0] + 1, rf[1] - 1.6, 3.6, 2.2, '#3b2618', 1);
    if (pose.startsWith('skate') || pose === 'kid' || pose === 'fall') { line(g, lf[0] - 3, lf[1] + .5, lf[0] + 5, lf[1] + .5, .6, .8, '#dfe6f2'); line(g, rf[0] - 3, rf[1] + .5, rf[0] + 5, rf[1] + .5, .6, .8, '#dfe6f2'); }
    // abrigo
    const hem = pose === 'fall' ? 68 : 56;
    const coatP = [[cx - 7, top], [cx + 7, top], [cx + 10, hem], [cx - 10, hem]].map(([x, y]) => [x + (pose === 'fall' ? -2 : 0), y]);
    wash(g, coatP, coat, 1);
    wash(g, [[cx + 1, top + 1], [cx + 7, top], [cx + 10, hem], [cx + 2, hem]], shade(coat, .65), .55, { edge: false });
    line(g, cx, top + 3, cx, hem - 1, .4, .5);
    ink(g, coatP, .75, true, .8);
    // brazos según la pose
    const sh = [[cx - 6.5, top + 3], [cx + 6.5, top + 3]];
    const hands = {
      stand: [[cx - 8.5, 52], [cx + 8.5, 52]], walkA: [[cx - 4, 52], [cx + 9.5, 50]], walkB: [[cx - 9.5, 50], [cx + 4, 52]],
      cup: [[cx - 8.5, 52], [cx + 4, 41]], toast: [[cx - 8.5, 52], [cx + 9, 24]], phone: [[cx - 2, 30], [cx + 3, 30]], carry: [[cx - 3, 44], [cx + 3, 44]],
      skateA: [[cx - 16, 40], [cx + 15, 38]], skateB: [[cx - 15, 38], [cx + 16, 40]], kid: [[cx - 18, 34], [cx + 18, 34]], fall: [[cx - 12, 64], [cx + 8, 50]],
      throwA: [[cx - 8, 46], [cx + 11, 24]], throwB: [[cx - 8, 46], [cx + 15, 40]], warm: [[cx + 9, 44], [cx + 11, 46]], bottle: [[cx - 8.5, 52], [cx + 8.5, 52]], rope: [[cx - 8.5, 52], [cx + 13, 50]]
    }[pose] || [[cx - 8.5, 52], [cx + 8.5, 52]];
    for (let i = 0; i < 2; i++) { brush(g, sh[i][0], sh[i][1], hands[i][0], hands[i][1], 3.4, shade(coat, i ? .8 : 1), .95); dab(g, hands[i][0], hands[i][1], 1.9, 1.9, o.glove || '#3b2a2a', 1); }
    // bufanda larga
    wash(g, [[cx - 6, top], [cx + 6, top], [cx + 6, top + 3.6], [cx - 6, top + 3.6]], scarf, 1, { edge: false });
    brush(g, cx + 3, top + 2, cx + 4.5, top + 14, 2.6, scarf, .95);
    // cabeza, pelo y gorro con pompón
    const hy = top - 7;
    dab(g, cx, hy, 5.6, 6, skin, 1);
    if (o.hair) dab(g, cx - 3.6, hy + 2, 2.2, 3.4, o.hair, .9);
    dab(g, cx + 2.2, hy + 1.6, 1.2, .9, '#e58f80', .6);
    ink(g, [[cx - 5.5, hy], [cx - 4, hy + 4.8], [cx, hy + 6.2], [cx + 4, hy + 4.8], [cx + 5.5, hy]], .55, false, .7);
    if (hat) {
      wash(g, [[cx - 6.4, hy - 1], [cx - 5, hy - 6], [cx, hy - 8.6], [cx + 5, hy - 6], [cx + 6.4, hy - 1]], hat, 1);
      brush(g, cx - 6.6, hy - 1.4, cx + 6.6, hy - 1.4, 2.4, shade(hat, .75), .95);
      dab(g, cx + .5, hy - 9.8, 2.8, 2.8, o.pom || K.cream, 1);
    }
    // accesorios
    if (pose === 'cup' || pose === 'toast' || o.cup) { const [x, y] = hands[1]; wash(g, [[x - 1.6, y + 1], [x + 1.6, y + 1], [x + 2, y - 4.5], [x - 2, y - 4.5]], '#f4efe6', 1, { edge: false }); brush(g, x - 1.8, y - 1.6, x + 1.8, y - 1.6, 1.4, '#8a5a3a', 1); }
    if (pose === 'bottle') { brush(g, hands[1][0], hands[1][1] + 2, hands[1][0] + 1, hands[1][1] - 9, 2.2, '#2f5a3a', 1); wash(g, [[hands[0][0] - 4, hands[0][1] + 6], [hands[0][0] + 3, hands[0][1] + 6], [hands[0][0] + 3, hands[0][1] - 4], [hands[0][0] - 4, hands[0][1] - 4]], K.camel, 1); }
    if (pose === 'carry') { wash(g, [[cx - 6, 47], [cx + 6, 47], [cx + 6, 39], [cx - 6, 39]], K.sage, 1); wash(g, [[cx - 4, 39], [cx + 5, 39], [cx + 5, 33], [cx - 4, 33]], K.burg, 1); line(g, cx, 47, cx, 39, 1.2, 1, K.burgL); line(g, cx + .5, 39, cx + .5, 33, 1, 1, K.gold); }
    if (pose === 'phone') { wash(g, [[cx - 2.5, 26], [cx + 3.5, 26], [cx + 3.5, 32], [cx - 2.5, 32]], '#2a2a33', 1, { edge: false }); }
    if (pose === 'rope') line(g, hands[1][0], hands[1][1], 44, 66, .6, .8, '#7a5a3a');
    g.restore(); g.restore();
  }
  A.person = (o = {}) => {
    A.seed(o.seed || 5);
    const W = o.pose === 'couple' ? 66 : 44, H = 78, [c, g] = cv(W, H);
    if (o.pose === 'couple') {
      drawPerson(g, Object.assign({}, o, { pose: o.frame ? 'skateB' : 'skateA' }), 0);
      drawPerson(g, Object.assign({}, o.b, { pose: o.frame ? 'skateB' : 'skateA' }), 22);
      brush(g, 37, 40, 44, 40, 2, '#3b2a2a', .9);
    } else drawPerson(g, o);
    grain(g, W, H, .45);
    return c;
  };
  // ángel de nieve, visto desde arriba (va acostado sobre el suelo)
  A.angel = (o, frame) => {
    A.seed(o.seed || 9);
    const W = 60, H = 60, [c, g] = cv(W, H), cx = 30, cy = 30, sp = frame ? .9 : .4;
    dab(g, cx, cy + 2, 22, 24, 'rgba(120,150,210,.25)', 1);
    for (const s of [-1, 1]) { brush(g, cx + s * 4, cy - 4, cx + s * (10 + sp * 9), cy - 12 - sp * 6, 3.4, o.coat, .95); brush(g, cx + s * 2, cy + 8, cx + s * (5 + sp * 8), cy + 20, 3.6, '#2a2f45', .95); }
    wash(g, [[cx - 6, cy - 6], [cx + 6, cy - 6], [cx + 7, cy + 9], [cx - 7, cy + 9]], o.coat, 1);
    dab(g, cx, cy - 11, 5, 5, o.skin || K.skin[1], 1); dab(g, cx, cy - 15, 5, 3, o.hat, 1); dab(g, cx, cy - 18.5, 2.4, 2.4, K.cream, 1);
    grain(g, W, H, .4);
    return c;
  };

  /* ---------- Teddy, el yorkie ---------- */
  function teddyBody(g, x, y, s, frame, sit) {
    g.save(); g.translate(x, y); g.scale(s, s);
    const steel = '#6f7a8c', tan = '#c98d4a';
    if (sit) {
      dab(g, 0, -7, 5, 6, steel, 1); dab(g, 0, -3, 4.4, 3.6, tan, 1);
      dab(g, 1, -14, 4, 3.6, tan, 1); dab(g, 3.8, -13.4, 2, 1.4, tan, 1); dab(g, 5.4, -13.6, .7, .7, '#1a1a1a', 1);
      wash(g, [[-2.6, -16], [-1.6, -21], [-.2, -16]], tan, 1, { edge: false }); wash(g, [[1.4, -16.4], [2.6, -21], [3.4, -16]], tan, 1, { edge: false });
      dab(g, .6, -18.2, 1.5, .9, '#c0282f', 1);
      brush(g, -4.6, -6, -7.5 - (frame ? 1.5 : -1), -12, 1.6, steel, 1);
      dab(g, -1.5, -.6, 1.4, 1, tan, 1); dab(g, 1.8, -.6, 1.4, 1, tan, 1);
    } else {
      const l = frame ? 3.2 : 1.2;
      for (const lx of [-4, -2, 3, 5]) brush(g, lx, -4, lx + (lx < 0 ? -l : l) * (frame ? 1 : -1) * .6, 0, 1.4, tan, 1);
      dab(g, 0, -6, 7, 3.6, steel, 1); dab(g, 6.8, -8, 3.4, 3, tan, 1); dab(g, 9.6, -7.4, 1.4, 1, tan, 1); dab(g, 10.6, -7.6, .6, .6, '#1a1a1a', 1);
      wash(g, [[5, -10], [5.6, -14.6], [6.8, -10.4]], tan, 1, { edge: false }); wash(g, [[7.2, -10.6], [8.4, -14.6], [9, -10.2]], tan, 1, { edge: false });
      dab(g, 7, -11.4, 1.4, .9, '#c0282f', 1);
      brush(g, -6.4, -7, -9, -10 - (frame ? 2.5 : 0), 1.5, steel, 1);
    }
    g.restore();
  }
  A.teddy = (frame, sit) => { A.seed(41); const [c, g] = cv(28, 24); teddyBody(g, sit ? 14 : 12, 22, 1, frame, sit); return c; };
  function teddyInWindow(g, x, y, w) { const s = w / 14; teddyBody(g, x, y, s * .8, 0, true); }

  /* ---------- Osos de peluche (genéricos) con gorro y suéter Fair Isle ---------- */
  function bear(g, x, y, s, sweater, hat, scarf) {
    g.save(); g.translate(x, y); g.scale(s, s);
    const fur = '#c4945c', furD = '#9c6c3c';
    dab(g, -8, -2, 7, 5, fur, 1); dab(g, 8, -2, 7, 5, fur, 1);
    wash(g, [[-12, -6], [12, -6], [11, -30], [-11, -30]], sweater, 1);
    for (let r = 0; r < 3; r++) for (let i = 0; i < 7; i++) dab(g, -9 + i * 3, -24 + r * 6, 1, 1, r % 2 ? K.burg : K.cream, 1);
    brush(g, -10, -12, 10, -12, 1.6, K.burg, .9);
    brush(g, -11, -27, -15, -12, 5, sweater, 1); brush(g, 11, -27, 15, -12, 5, sweater, 1);
    dab(g, -15, -11, 3, 2.6, fur, 1); dab(g, 15, -11, 3, 2.6, fur, 1);
    wash(g, [[-9, -32], [9, -32], [9, -29], [-9, -29]], scarf, 1, { edge: false }); brush(g, 5, -30, 7, -18, 3, scarf, 1);
    dab(g, 0, -40, 10, 9, fur, 1); dab(g, -8, -46, 3.4, 3.4, fur, 1); dab(g, 8, -46, 3.4, 3.4, fur, 1);
    dab(g, 0, -37, 4.4, 3.4, '#e2c39a', 1); dab(g, 0, -38.6, 1.6, 1.2, '#2a1c14', 1); dab(g, -3.6, -42, .9, .9, '#1a1a1a', 1); dab(g, 3.6, -42, .9, .9, '#1a1a1a', 1);
    wash(g, [[-10, -45], [-8, -51], [0, -54], [8, -51], [10, -45]], hat, 1); brush(g, -10.5, -45.5, 10.5, -45.5, 2.6, shade(hat, .75), 1); dab(g, 0, -56, 3.4, 3.4, K.cream, 1);
    ink(g, [[-11, -6], [-12, -28], [-8, -32]], .6, false, .6); ink(g, [[11, -6], [12, -28], [8, -32]], .6, false, .6); ink(g, [[-10, -40], [-7, -48], [0, -50], [7, -48], [10, -40], [6, -33], [-6, -33], [-10, -40]], .55, true, .6);
    g.restore();
    void furD;
  }
  A.bears = () => { A.seed(13); const W = 120, H = 90, [c, g] = cv(W, H); bear(g, 38, 86, 1.25, '#f2e8d2', K.navy2, K.burg); bear(g, 84, 86, 1.18, K.navy2, K.burg, K.racingL); grain(g, W, H, .4); return c; };
  A.sled = (withBear) => {
    A.seed(17); const W = 70, H = 54, [c, g] = cv(W, H);
    wash(g, [[8, 44], [56, 44], [60, 36], [12, 36]], K.wood, 1); for (let x = 14; x < 56; x += 8) line(g, x, 37, x - 2, 44, .4, .5);
    brush(g, 4, 48, 60, 48, 1.8, K.burg, 1); brush(g, 60, 48, 66, 42, 1.8, K.burg, 1);
    if (withBear) bear(g, 34, 38, .62, '#c79a3c', K.burg, K.racingL);
    grain(g, W, H, .4); return c;
  };
  A.gifts = () => {
    A.seed(19); const W = 130, H = 80, [c, g] = cv(W, H);
    const box = (x, y, w, h) => { wash(g, [[x, y], [x + w, y], [x + w, y - h], [x, y - h]], rnd() < .6 ? K.sage : K.sageD, 1); line(g, x + w / 2, y, x + w / 2, y - h, 1.6, 1, K.burg); line(g, x, y - h / 2, x + w, y - h / 2, 1.4, 1, K.burg); dab(g, x + w / 2 - 3, y - h - 2, 3.4, 2, K.burg, 1, .4); dab(g, x + w / 2 + 3, y - h - 2, 3.4, 2, K.burg, 1, -.4); ink(g, [[x, y], [x, y - h], [x + w, y - h], [x + w, y]], .55, false, .7); };
    box(8, 76, 34, 24); box(44, 76, 40, 30); box(88, 76, 30, 20); box(24, 52, 26, 18); box(58, 46, 22, 16); box(92, 56, 20, 14);
    grain(g, W, H, .4); return c;
  };

  /* ---------- Faroles, mesas, braseros ---------- */
  A.lamp = () => {
    A.seed(23); const W = 30, H = 120, [c, g] = cv(W, H);
    brush(g, 15, 118, 15, 30, 2.4, K.iron, 1); dab(g, 15, 117, 5, 2.4, K.iron, 1);
    wash(g, [[9, 30], [21, 30], [19, 14], [11, 14]], K.goldW, 1); ink(g, [[9, 30], [11, 14], [19, 14], [21, 30], [9, 30]], .8, true);
    wash(g, [[7, 14], [23, 14], [15, 6]], K.iron, 1); dab(g, 15, 6, 6, 2.2, K.snowLit, 1);
    glow(g, 15, 22, 15, '255,210,120', .7);
    grain(g, W, H, .35); return c;
  };
  A.table = () => {
    A.seed(29); const W = 180, H = 70, [c, g] = cv(W, H);
    wash(g, [[10, 46], [170, 46], [160, 30], [20, 30]], '#efe6d3', 1);
    brush(g, 16, 50, 16, 64, 2, K.woodD, 1); brush(g, 164, 50, 164, 64, 2, K.woodD, 1);
    for (let i = 0; i < 9; i++) { const x = 26 + i * 16; dab(g, x, 38 + (i % 2) * 2, 4, 1.8, '#d9cfbf', 1); dab(g, x, 37.5 + (i % 2) * 2, 2.4, 1.2, i % 3 ? K.burgL : K.amber, .9); }
    for (const x of [44, 98, 140]) { brush(g, x, 36, x, 24, 2.4, '#3d6b45', 1); }
    for (const x of [30, 72, 120, 158]) { brush(g, x, 37, x, 31, 1.4, '#f4efe6', 1); dab(g, x, 29.5, 1, 1.6, K.goldW, 1); glow(g, x, 29, 10, '255,200,110', .7); }
    ink(g, [[10, 46], [20, 30], [160, 30], [170, 46], [10, 46]], .7, true);
    grain(g, W, H, .35); return c;
  };
  A.brazier = () => { A.seed(31); const W = 44, H = 30, [c, g] = cv(W, H); wash(g, [[6, 12], [38, 12], [32, 22], [12, 22]], K.iron, 1); brush(g, 14, 22, 10, 29, 1.6, K.iron, 1); brush(g, 30, 22, 34, 29, 1.6, K.iron, 1); dab(g, 22, 12, 15, 3, '#e86a2a', 1); grain(g, W, H, .3); return c; };
  A.flame = (f) => {
    A.seed(37 + f); const W = 34, H = 48, [c, g] = cv(W, H);
    glow(g, 17, 34, 22, '255,150,60', .7);
    for (let i = 0; i < 6; i++) { const x = 17 + (rnd() - .5) * 12; brush(g, x, 46, x + (rnd() - .5) * 8, 14 + rnd() * 16, 5 - i * .5, i % 2 ? '#f39a32' : '#ffd36a', .9); }
    brush(g, 17, 46, 17 + (f - 1) * 3, 8, 3, '#fff1b8', .9);
    return c;
  };

  /* ---------- Venados en grabado (toile) ---------- */
  A.deer = (graze) => {
    A.seed(graze ? 61 : 63); const W = 96, H = 90, [c, g] = cv(W, H), col = '#7a2a2a';
    wash(g, [[26, 54], [66, 52], [70, 40], [30, 38]], '#c9a27a', .8, { edge: false });
    ink(g, [[26, 50], [30, 40], [52, 37], [68, 40], [70, 50], [62, 55], [32, 56], [26, 50]], .8, true, .9, col);
    for (let x = 32; x < 66; x += 3) ink(g, [[x, 46], [x + 3, 54]], .4, false, .6, col);
    for (const lx of [32, 38, 60, 66]) ink(g, [[lx, 54], [lx + (rnd() - .5) * 3, 76], [lx + 1.5, 78]], .8, false, .9, col);
    const hx = graze ? 76 : 74, hy = graze ? 64 : 20;
    ink(g, [[66, 42], [hx - 4, hy + 10], [hx, hy], [hx + 9, hy + 3], [hx + 4, hy + 8], [hx - 2, hy + 12]], .8, false, .9, col);
    if (!graze) { ink(g, [[hx, hy], [hx - 4, hy - 12], [hx - 10, hy - 18]], .7, false, .9, col); ink(g, [[hx - 4, hy - 9], [hx - 11, hy - 10]], .6, false, .9, col); ink(g, [[hx + 2, hy], [hx + 6, hy - 13], [hx + 12, hy - 18]], .7, false, .9, col); ink(g, [[hx + 5, hy - 9], [hx + 12, hy - 9]], .6, false, .9, col); }
    for (let i = 0; i < 10; i++) dab(g, 36 + rnd() * 28, 42 + rnd() * 8, .9, .9, '#f4ead8', 1);
    dab(g, 26, 44, 2.6, 3, '#f4ead8', 1);
    grain(g, W, H, .35); return c;
  };

  /* ---------- Rama nevada para las esquinas ---------- */
  A.branch = (flip) => {
    A.seed(flip ? 71 : 73); const W = 260, H = 200, [c, g] = cv(W, H);
    if (flip) { g.translate(W, H); g.scale(-1, -1); }
    brush(g, -10, 20, 200, 120, 6, K.woodD, 1);
    for (let i = 0; i < 26; i++) {
      const t = i / 26, x = -10 + 210 * t, y = 20 + 100 * t;
      for (let k = 0; k < 9; k++) { const a = (k / 9 - .5) * 2.4 + (i % 2 ? .4 : -.4); brush(g, x, y, x + Math.cos(a + .6) * (18 - t * 6), y + Math.sin(a + .6) * (18 - t * 6), 1.6, shade(K.pine, .7 + rnd() * .5), .9); }
      dab(g, x + 4, y - 5, 10 - t * 4, 4, K.snowLit, .95, .4); dab(g, x + 6, y - 2, 8 - t * 3, 2.4, K.snowB, .8, .4);
    }
    dab(g, 120, 72, 5, 5, K.burg, 1); dab(g, 128, 76, 4.4, 4.4, K.gold, 1);
    grain(g, W, H, .4); return c;
  };

  /* ---------- Fondo: cielo, luna, montañas y bosques en capas ---------- */
  A.sky = () => {
    A.seed(81); const W = 1024, H = 1024, [c, g] = cv(W / 2, H / 2);
    const w = W / 2, h = H / 2;
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#081433'); gr.addColorStop(.45, '#13275e'); gr.addColorStop(.8, '#2350a8'); gr.addColorStop(1, '#4a7fd0');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    // pinceladas de espátula
    for (let i = 0; i < 260; i++) { const y = rnd() * h, x = rnd() * w, l = 20 + rnd() * 60, col = mix('#13275e', '#5a86d0', y / h * .7 + rnd() * .2); brush(g, x, y, x + l, y + (rnd() - .5) * 6, 4 + rnd() * 6, col, .35); }
    // nubes pintadas a pincel
    for (let n = 0; n < 7; n++) { const cx = rnd() * w, cy = h * (.35 + rnd() * .35); for (let k = 0; k < 24; k++) brush(g, cx + (rnd() - .5) * 120, cy + (rnd() - .5) * 18, cx + (rnd() - .5) * 140, cy + (rnd() - .5) * 18, 6 + rnd() * 8, rnd() < .5 ? '#6f8fc8' : '#9fb4dc', .22); }
    grain(g, w, h, .35);
    return c;
  };
  A.moon = () => {
    A.seed(83); const [c, g] = cv(160, 160);
    glow(g, 80, 80, 80, '200,215,255', .55);
    dab(g, 80, 80, 34, 34, '#f4ecd2', 1);
    for (let i = 0; i < 9; i++) dab(g, 66 + rnd() * 30, 66 + rnd() * 30, 3 + rnd() * 6, 3 + rnd() * 5, 'rgba(160,170,200,.35)', 1);
    ink(g, (() => { const p = []; for (let k = 0; k <= 24; k++) { const a = k / 24 * 6.283; p.push([80 + Math.cos(a) * 34, 80 + Math.sin(a) * 34]); } return p; })(), .7, true, .5);
    return c;
  };
  A.mountains = () => {
    A.seed(85); const W = 1200, H = 300, [c, g] = cv(W, H);
    for (let layer = 0; layer < 2; layer++) {
      const col = layer ? '#3b5fa8' : '#5a7cc0', base = H, yb = layer ? 150 : 110, pts = [[0, base]];
      let x = 0; while (x <= W) { pts.push([x, yb - rnd() * (layer ? 90 : 70) - 20]); x += 60 + rnd() * 90; pts.push([x, yb + 10 + rnd() * 30]); x += 40 + rnd() * 70; }
      pts.push([W, base]);
      wash(g, pts, col, .95);
      for (let i = 1; i < pts.length - 1; i += 2) { const [px, py] = pts[i]; wash(g, [[px, py], [px + 24, py + 26], [px + 8, py + 20], [px - 6, py + 30], [px - 20, py + 24]], '#dfe8f8', .85, { edge: false }); }
    }
    const gr = g.createLinearGradient(0, 120, 0, H); gr.addColorStop(0, 'rgba(138,162,207,0)'); gr.addColorStop(1, 'rgba(138,162,207,.85)');
    g.save(); g.globalCompositeOperation = 'source-atop'; g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore();
    grain(g, W, H, .3);
    return c;
  };
  A.forestBand = (haze, seedN) => {
    A.seed(seedN); const W = 1400, H = 260, [c, g] = cv(W, H);
    const pines = [0, 1, 2, 3].map(k => A.pine({ seed: seedN + k * 5, snow: .9, color: k % 2 ? K.pine : K.racing }));
    g.save(); g.globalAlpha = .9; g.fillStyle = mix(K.snowB, '#7f98cc', haze); g.fillRect(0, 222, W, 38); g.restore();
    for (let row = 0; row < 3; row++) for (let i = 0; i < 110; i++) {
      const h = (70 + rnd() * 90) * (1 - row * .18), w = h * .6, x = rnd() * W, y = 226 + row * 10 + rnd() * 8;
      g.drawImage(pines[(i + row) % 4], x - w / 2, y - h, w, h);
    }
    g.save(); g.globalCompositeOperation = 'source-atop'; g.globalAlpha = .25 + haze * .6; g.fillStyle = '#5f7fc4'; g.fillRect(0, 0, W, H); g.restore();
    const m = g.createLinearGradient(0, 120, 0, H); m.addColorStop(0, 'rgba(120,150,210,0)'); m.addColorStop(1, `rgba(120,150,210,${.2 + haze * .4})`);
    g.save(); g.globalCompositeOperation = 'source-atop'; g.fillStyle = m; g.fillRect(0, 0, W, H); g.restore();
    return c;
  };

  /* ---------- El suelo de la villa (pintado desde arriba) ---------- */
  // m: metros por lado; layout: { streets, houses, lamps, plaza, rink, terraces, trees }
  A.ground = (L) => {
    A.seed(91);
    const PX = 2048, M = L.size, s = PX / M, [c, g] = cv(PX / 2, PX / 2);
    const k = s / 2, X = x => (x + M / 2) * k, Z = z => (z + M / 2) * k, R = r => r * k;
    const w = PX / 2;
    g.fillStyle = '#b4c6e8'; g.fillRect(0, 0, w, w);
    // lavados azules: el relieve de la nieve, con zonas sin pintar (el papel) donde le da la luz
    for (let i = 0; i < 220; i++) dab(g, rnd() * w, rnd() * w, 30 + rnd() * 90, 10 + rnd() * 30, rnd() < .55 ? '#8fa8da' : '#d3def2', .35, rnd() * 3);
    // calles empedradas bajo la nieve
    L.streets.forEach(([x1, z1, x2, z2]) => {
      g.save(); g.strokeStyle = '#a9b6d2'; g.globalAlpha = .7; g.lineWidth = R(5.4); g.beginPath(); g.moveTo(X(x1), Z(z1)); g.lineTo(X(x2), Z(z2)); g.stroke(); g.restore();
      const n = Math.hypot(x2 - x1, z2 - z1) * 3;
      for (let i = 0; i < n; i++) { const t = rnd(), o = (rnd() - .5) * 4.4, dx = x2 - x1, dz = z2 - z1, l = Math.hypot(dx, dz); dab(g, X(x1 + dx * t - dz / l * o), Z(z1 + dz * t + dx / l * o), R(.35), R(.25), rnd() < .5 ? '#7e8db0' : '#c4cee3', .7, rnd() * 3); }
      g.save(); g.strokeStyle = '#8a9cc4'; g.globalAlpha = .45; g.lineWidth = 1; for (const o of [-.9, .9]) { const dx = x2 - x1, dz = z2 - z1, l = Math.hypot(dx, dz); g.beginPath(); g.moveTo(X(x1 - dz / l * o), Z(z1 + dx / l * o)); g.lineTo(X(x2 - dz / l * o), Z(z2 + dx / l * o)); g.stroke(); } g.restore();
    });
    // plaza empedrada
    const pl = L.plaza;
    g.save(); g.fillStyle = '#b4c0da'; g.globalAlpha = .75; g.beginPath(); g.ellipse(X(0), Z(0), R(pl[0]), R(pl[1]), 0, 0, 6.283); g.fill(); g.restore();
    for (let i = 0; i < 1400; i++) { const a = rnd() * 6.283, r = Math.sqrt(rnd()); dab(g, X(Math.cos(a) * pl[0] * r), Z(Math.sin(a) * pl[1] * r), R(.32), R(.22), rnd() < .5 ? '#8494b8' : '#d6deee', .6, a); }
    for (let i = 0; i < 70; i++) { const a = rnd() * 6.283, r = .3 + rnd() * .7; dab(g, X(Math.cos(a) * pl[0] * r), Z(Math.sin(a) * pl[1] * r), R(.5 + rnd()), R(.3 + rnd() * .5), '#dfe7f6', .6, a); }
    // pista de hielo ovalada, con marcas de patines
    const rk = L.rink;
    g.save(); g.fillStyle = '#b9d0ee'; g.beginPath(); g.ellipse(X(0), Z(0), R(rk[2]), R(rk[3]), 0, 0, 6.283); g.fill(); g.restore();
    for (let i = 0; i < 70; i++) { const a = rnd() * 6.283, rr = .5 + rnd() * .5; g.save(); g.strokeStyle = '#e8f1fc'; g.globalAlpha = .7; g.lineWidth = .8; g.beginPath(); g.ellipse(X(0), Z(0), R(rk[2] * rr), R(rk[3] * rr), 0, a, a + .6 + rnd()); g.stroke(); g.restore(); }
    for (let i = 0; i < 30; i++) { const x = (rnd() - .5) * rk[2] * 1.7; brush(g, X(x), Z(-rk[3] * .7), X(x + (rnd() - .5)), Z(rk[3] * .7), 1.2, '#dbe8fa', .35); }
    g.save(); g.strokeStyle = K.snowLit; g.lineWidth = R(.9); g.beginPath(); g.ellipse(X(0), Z(0), R(rk[2]), R(rk[3]), 0, 0, 6.283); g.stroke(); g.restore();
    // isla del árbol
    g.save(); g.fillStyle = K.snowLit; g.beginPath(); g.ellipse(X(0), Z(0), R(rk[0]), R(rk[1]), 0, 0, 6.283); g.fill(); g.restore();
    g.save(); g.strokeStyle = '#8fa6d6'; g.lineWidth = 1.4; g.beginPath(); g.ellipse(X(0), Z(0), R(rk[0]), R(rk[1]), 0, 0, 6.283); g.stroke(); g.restore();
    // terrazas de madera
    L.terraces.forEach(([x, z, ww, dd]) => { g.save(); g.fillStyle = '#8a6a4c'; g.globalAlpha = .8; g.fillRect(X(x - ww / 2), Z(z - dd / 2), R(ww), R(dd)); g.restore(); for (let i = 0; i < ww; i += .8) line(g, X(x - ww / 2 + i), Z(z - dd / 2), X(x - ww / 2 + i), Z(z + dd / 2), .3, .3); });
    // sombras azules proyectadas (la luna está al fondo: caen hacia acá)
    L.shadows.forEach(([x, z, r, len]) => { g.save(); g.globalAlpha = .32; g.fillStyle = K.snowD; g.beginPath(); g.ellipse(X(x + len * .12), Z(z + len * .32), R(r * .7), R(len * .32), .2, 0, 6.283); g.fill(); g.restore(); });
    // charcos de luz ámbar
    L.pools.forEach(([x, z, r, a]) => { glow(g, X(x), Z(z), R(r * .8), '225,135,45', (a || .55) * .55); glow(g, X(x), Z(z), R(r * .3), '255,205,130', (a || .55) * .3); });
    // huellas
    for (let i = 0; i < 260; i++) { const a = rnd() * 6.283, r = 12 + rnd() * 8; dab(g, X(Math.cos(a) * r), Z(Math.sin(a) * r * .8), R(.12), R(.2), '#9fb2d8', .6, a); }
    grain(g, w, w, .4);
    return c;
  };

  /* ---------- Texturas pequeñas: halo, charco, sombra, humo, chispa, copos, reflejo ---------- */
  A.halo = () => { const [c, g] = cv(64, 64); glow(g, 32, 32, 32, '255,200,110', 1); return c; };
  A.blob = () => { const [c, g] = cv(64, 64); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(40,70,150,.75)'); gr.addColorStop(1, 'rgba(40,70,150,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c; };
  A.smoke = () => { A.seed(95); const [c, g] = cv(64, 64); for (let i = 0; i < 9; i++) dab(g, 22 + rnd() * 20, 22 + rnd() * 20, 8 + rnd() * 10, 7 + rnd() * 8, rnd() < .5 ? '#c6d2ea' : '#9fb0d4', .22, rnd() * 3); return c; };
  A.spark = () => { const [c, g] = cv(16, 16); glow(g, 8, 8, 8, '255,190,90', 1); return c; };
  A.flake = (soft) => { const [c, g] = cv(32, 32); const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(250,248,240,1)'); gr.addColorStop(soft ? .2 : .45, 'rgba(250,248,240,.9)'); gr.addColorStop(1, 'rgba(250,248,240,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); return c; };
  A.streak = () => {
    A.seed(97); const [c, g] = cv(32, 128);
    for (let i = 0; i < 5; i++) { const x = 16 + (rnd() - .5) * 12, gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, 'rgba(255,214,140,0)'); gr.addColorStop(.25, 'rgba(255,214,140,.35)'); gr.addColorStop(1, 'rgba(255,214,140,0)'); g.save(); g.strokeStyle = gr; g.lineWidth = 3 + rnd() * 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, 4); for (let y = 4; y <= 124; y += 10) g.lineTo(x + Math.sin(y * .09 + i) * 1.6, y); g.stroke(); g.restore(); }
    return c;
  };
  A.snowball = () => { const [c, g] = cv(10, 10); dab(g, 5, 5, 3.6, 3.6, K.snowLit, 1); ink(g, [[1.6, 5], [5, 1.6], [8.4, 5], [5, 8.4], [1.6, 5]], .4, true, .6); return c; };
})();
