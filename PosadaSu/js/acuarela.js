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
      if (o.teddy && floors === 1) windowLit(g, A1[0] - 9, top - rh * .7, 18, 18, { teddy: true }); else windowLit(g, A1[0] - 5, top - rh * .55, 10, 11, {});
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
  // Yorkie: lomo gris acero con pelo largo y sedoso, cara y patas doradas, orejitas paradas y moño rojo
  function teddyBody(g, x, y, s, frame, sit) {
    g.save(); g.translate(x, y); g.scale(s, s);
    // yorkie café: lomo café oscuro con pelo sedoso, cara y patas doradas, moño rojo
    const steel = '#6e4526', steelL = '#9a6638', tan = '#c4823e', tanL = '#e3ad66', bow = '#c0282f';
    const ear = (ex, ey, k) => { wash(g, [[ex - 1.4 * k, ey], [ex, ey - 4.6 * k], [ex + 1.6 * k, ey]], tan, 1, { j: .2, ew: .5 }); dab(g, ex, ey - 1.6 * k, .5 * k, 1.4 * k, '#e8b98a', .9); };
    if (sit) {
      // sentado, de frente
      dab(g, -2, -1, 2.2, 1.4, tan, 1); dab(g, 2.4, -1, 2.2, 1.4, tan, 1);
      wash(g, [[-5.4, -1.5], [5.4, -1.5], [4.2, -9.5], [-4.2, -9.5]], steel, 1, { j: .4, ew: .6 });
      for (let k = 0; k < 7; k++) brush(g, -4 + k * 1.35, -9, -4.4 + k * 1.45, -1.2, .7, k % 2 ? steelL : steel, .9);
      dab(g, 0, -5, 2.2, 3.4, tanL, .85);
      brush(g, 4.6, -6, 7.5 + (frame ? 1.6 : -.4), -11.5 - (frame ? 0 : 1), 1.6, steel, 1);
      dab(g, 0, -12.6, 4.2, 3.8, tan, 1); dab(g, 0, -11, 2.6, 2.2, tanL, .9);
      ear(-2.8, -15, 1); ear(2.8, -15, 1);
      dab(g, -1.4, -13, .7, .7, '#15110e', 1); dab(g, 1.4, -13, .7, .7, '#15110e', 1); dab(g, 0, -11.2, .9, .65, '#15110e', 1);
      dab(g, -1, -16.2, 1.5, .9, bow, 1, .4); dab(g, 1, -16.2, 1.5, .9, bow, 1, -.4); dab(g, 0, -16.2, .6, .6, '#8f1c22', 1);
      // volumen: sombra azulada a un lado, brillo en la coronilla y en el lomo, ojitos con brillo
      dab(g, 3.2, -5, 2, 4, 'rgba(40,24,40,.32)', 1); dab(g, 0, -9.6, 3.4, 1, 'rgba(60,30,20,.35)', 1);
      brush(g, -3, -14.6, 1.6, -15.2, 1.1, '#f2cf96', .8); brush(g, -3.6, -8.6, -3.8, -3, .8, '#c08850', .7);
      for (let k = 0; k < 5; k++) ink(g, [[-2.4 + k * 1.2, -10.6], [-2.6 + k * 1.3, -8.6]], .25, false, .5, '#7a4a22');
      dab(g, -1.2, -13.3, .25, .25, '#ffffff', 1); dab(g, 1.6, -13.3, .25, .25, '#ffffff', 1); dab(g, -.2, -11.5, .3, .2, '#ffffff', .7);
      ink(g, [[-5.4, -1.5], [-4.6, -9], [-3.6, -14], [0, -16.4], [3.6, -14], [4.6, -9], [5.4, -1.5]], .45, false, .6);
    } else {
      // corriendo, de perfil hacia la derecha
      const a = frame ? 3 : -1;
      [[-5, -a], [-3, a], [3.5, a], [5.5, -a]].forEach(([lx, d]) => brush(g, lx, -3.5, lx + d * .6, 0, 1.5, tan, 1));
      wash(g, [[-7.5, -4], [5.5, -4], [6.5, -8.6], [-6.5, -9.2]], steel, 1, { j: .4, ew: .6 });
      for (let k = 0; k < 8; k++) brush(g, -6.6 + k * 1.6, -8.6, -7 + k * 1.6, -3, .7, k % 2 ? steelL : steel, .9);
      brush(g, -7, -8, -9.5, -12.5 - (frame ? 1.4 : 0), 1.6, steel, 1);
      dab(g, 7.6, -9.6, 3.6, 3.2, tan, 1); dab(g, 10.4, -8.8, 1.8, 1.3, tanL, 1); dab(g, 11.8, -9.2, .7, .6, '#15110e', 1); dab(g, 8.6, -10.6, .6, .6, '#15110e', 1);
      ear(6.2, -12.2, .95); ear(8.6, -12.4, .95);
      dab(g, 7.2, -13.2, 1.4, .8, bow, 1, .4); dab(g, 8.8, -13.2, 1.4, .8, bow, 1, -.4);
      brush(g, -5.6, -9, 3.6, -9.2, .9, '#c08850', .7); dab(g, 0, -4.4, 6, 1, 'rgba(40,24,40,.3)', 1); dab(g, 11.6, -9.6, .22, .22, '#ffffff', 1); dab(g, 8.4, -10.8, .22, .22, '#ffffff', 1);
      ink(g, [[-7.5, -4], [-6.5, -9.2], [4, -9.4], [6.5, -12], [10.5, -11], [12, -9], [10, -7.6], [6, -6.5], [5.5, -4]], .45, false, .6);
    }
    g.restore();
  }
  A.teddy = (frame, sit, k = 1) => { A.seed(41); const [c, g] = cv(40 * k, 34 * k); teddyBody(g, (sit ? 20 : 17) * k, 31 * k, 1.45 * k, frame, sit); grain(g, 40 * k, 34 * k, .3); return c; };
  function teddyInWindow(g, x, y, w) { const s = w / 18; teddyBody(g, x, y, s, 0, true); }

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

  /* =========================================================
     PANTALLA DE APERTURA — la misma luz de la villa, en acuarela:
     hora azul afuera (plaza nevada con ventanas encendidas),
     luz de lámpara adentro, sombras azuladas y profundidad.
     (la plaza nevada en acuarela + la fachada estilo Ralph Lauren)
     ========================================================= */
  const PAPER = '#f6f1e5';
  // tinta suelta: la misma línea dos o tres veces, un poco movida, como boceto a pluma
  const sketch = A.sketch = (g, pts, w = .7, n = 2, a = .75, closed = false) => { for (let k = 0; k < n; k++) ink(g, pts.map(([x, y]) => [x + (rnd() - .5) * 1.6, y + (rnd() - .5) * 1.6]), w * (k ? .7 : 1), closed, a * (k ? .6 : 1)); };
  const loose = (g, pts, col, a = .75) => { g.save(); g.fillStyle = col; for (let k = 0; k < 2; k++) { g.globalAlpha = a * .5; path(g, pts.map(([x, y]) => [x + (rnd() - .5) * 3, y + (rnd() - .5) * 3]), 2.5); g.fill(); } g.restore(); };
  const splat = (g, x0, y0, x1, y1, n, col, a = .5) => { for (let i = 0; i < n; i++) dab(g, x0 + rnd() * (x1 - x0), y0 + rnd() * (y1 - y0), .6 + rnd() * 1.6, .6 + rnd() * 1.6, col, a * (.4 + rnd() * .6)); };
  const bbox = pts => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of pts) { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; } return [x0, y0, x1, y1]; };
  // contorno suave (curvas por los puntos medios)
  function curve(g, pts, j = .6, closed = true) {
    const q = pts.map(([x, y]) => [x + (rnd() - .5) * j, y + (rnd() - .5) * j]), n = q.length, m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    g.beginPath();
    if (closed) { const s = m(q[n - 1], q[0]); g.moveTo(s[0], s[1]); for (let i = 0; i < n; i++) { const e = m(q[i], q[(i + 1) % n]); g.quadraticCurveTo(q[i][0], q[i][1], e[0], e[1]); } g.closePath(); }
    else { g.moveTo(q[0][0], q[0][1]); for (let i = 1; i < n - 1; i++) { const e = m(q[i], q[i + 1]); g.quadraticCurveTo(q[i][0], q[i][1], e[0], e[1]); } g.lineTo(q[n - 1][0], q[n - 1][1]); }
  }
  // volumen pintado: lavado en capas + luz cálida de un lado + sombra azul del otro,
  // granulado del pigmento y borde más oscuro donde se seca el agua
  const vol = A.vol = (g, pts, col, o = {}) => {
    const [x0, y0, x1, y1] = bbox(pts), w = x1 - x0 || 1, h = y1 - y0 || 1, L = o.l || [.3, .2], sm = o.poly ? (q, j) => path(g, q, j) : (q, j) => curve(g, q, j);
    g.save(); g.fillStyle = col;
    for (let k = 0; k < 3; k++) { g.globalAlpha = (o.a || 1) * .45; sm(pts, o.j == null ? .8 : o.j); g.fill(); }
    g.globalAlpha = o.a || 1; sm(pts, 0); g.clip();
    const lx = x0 + w * L[0], ly = y0 + h * L[1], R = Math.max(w, h), lc = o.light || '255,238,205';
    let gr = g.createRadialGradient(lx, ly, 0, lx, ly, R * (o.r || .8)); gr.addColorStop(0, `rgba(${lc},${o.hi == null ? .42 : o.hi})`); gr.addColorStop(1, `rgba(${lc},0)`);
    g.fillStyle = gr; g.fillRect(x0 - 2, y0 - 2, w + 4, h + 4);
    const sx = x0 + w * (1 - L[0]), sy = y0 + h * (1 - L[1]);
    gr = g.createLinearGradient(lx, ly, sx + (sx - lx) * .15, sy + (sy - ly) * .15); gr.addColorStop(.32, 'rgba(26,38,92,0)'); gr.addColorStop(1, `rgba(26,38,92,${o.sh == null ? .5 : o.sh})`);
    g.fillStyle = gr; g.fillRect(x0 - 2, y0 - 2, w + 4, h + 4);
    if (o.gran !== false) { const n = Math.min(900, w * h / 26); for (let i = 0; i < n; i++) dab(g, x0 + rnd() * w, y0 + rnd() * h, .3 + rnd() * .8, .3 + rnd() * .8, shade(col, .55), .1); }
    g.restore();
    if (o.edge !== false) { g.save(); g.strokeStyle = shade(col, .6); g.globalAlpha = .5; g.lineWidth = o.ew || .9; sm(pts, .5); g.stroke(); g.restore(); }
    if (o.ink) { g.save(); g.strokeStyle = K.ink; g.globalAlpha = o.ink; g.lineWidth = o.iw || .6; sm(pts, .7); g.stroke(); g.restore(); }
  };
  // esfera de adorno con brillo y sombra
  const bauble = (g, x, y, r, col) => { dab(g, x + r * .25, y + r * .3, r, r, shade(col, .55), .7); dab(g, x, y, r, r, col, 1); dab(g, x - r * .35, y - r * .35, r * .38, r * .32, '#fff6dc', .85); };
  // foquito encendido
  const bulb = (g, x, y, r = 1.4, rgb = '255,206,120') => { glow(g, x, y, r * 6, rgb, .55); dab(g, x, y, r, r, '#fff1c8', 1); };
  const goldWreath = (g, x, y, r) => {
    dab(g, x + r * .1, y + r * .16, r * 1.2, r * 1.2, 'rgba(30,40,60,.18)', 1);
    for (let i = 0; i < 34; i++) { const a = i / 34 * 6.283, lit = Math.sin(a + 2.4) > 0; dab(g, x + Math.cos(a) * r, y + Math.sin(a) * r, r * .28, r * .17, lit ? (rnd() < .5 ? '#6d9a45' : '#5a8a3c') : (rnd() < .5 ? '#2f5a2c' : '#24482a'), .9, a + 1.2); }
    for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283, rr = r * (.86 + rnd() * .28); dab(g, x + Math.cos(a) * rr + .4, y + Math.sin(a) * rr + .4, r * .1, r * .08, '#2a3a18', .5); dab(g, x + Math.cos(a) * rr - r * .05, y + Math.sin(a) * rr - r * .05, r * .08, r * .08, '#b08a3a', .8, a); }
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283 + rnd() * .3, rr = r * (.85 + rnd() * .3); bauble(g, x + Math.cos(a) * rr, y + Math.sin(a) * rr, r * .12, '#d9a93e'); }
    vol(g, [[x - r * .05, y + r * 1.02], [x - r * .55, y + r * .8], [x - r * .6, y + r * 1.2]], K.burg, { sh: .4, gran: false, ew: .6 });
    vol(g, [[x + r * .05, y + r * 1.02], [x + r * .55, y + r * .8], [x + r * .6, y + r * 1.2]], K.burg, { sh: .4, gran: false, ew: .6 });
    brush(g, x - r * .05, y + r * 1.05, x - r * .3, y + r * 1.6, r * .1, K.burgL, .9); brush(g, x + r * .05, y + r * 1.05, x + r * .34, y + r * 1.55, r * .1, K.burg, .9);
    dab(g, x, y + r * 1.02, r * .12, r * .1, '#5a1420', 1);
  };
  // fachada de la plaza (como en la acuarela): muro crema con la luz cálida de la plaza
  // abajo y el azul del cielo arriba, costado en sombra, mansarda nevada, ventanas encendidas
  const facade = (g, x, y, w, h, o = {}) => {
    const roof = o.roof || 30, side = o.side || 0, haze = o.haze || 0, chims = [];
    // costado en sombra (da la perspectiva)
    if (side) { const sx = side > 0 ? x + w : x; loose(g, [[sx, y], [sx + side, y - 6], [sx + side, y - h - 4], [sx, y - h]], mix('#7d8db3', '#a7b4cf', haze), .95); }
    // muro
    g.save(); path(g, [[x, y], [x + w, y], [x + w, y - h], [x, y - h]], 1.2); g.clip();
    const gr = g.createLinearGradient(0, y - h, 0, y); gr.addColorStop(0, mix('#b9c3da', '#c8d1e4', haze)); gr.addColorStop(.55, mix('#e2d9c8', '#cdd3e2', haze)); gr.addColorStop(1, mix('#f1dcb8', '#d6d6dc', haze));
    g.fillStyle = gr; g.fillRect(x - 2, y - h - 2, w + 4, h + 4);
    for (let i = 0; i < w * h / 700; i++) dab(g, x + rnd() * w, y - rnd() * h, 6 + rnd() * 16, 4 + rnd() * 10, rnd() < .5 ? 'rgba(140,155,195,.12)' : 'rgba(250,236,210,.14)', 1, rnd());
    g.restore();
    // mansarda de pizarra con nieve
    const rp = [[x - 3, y - h], [x + w + 3, y - h], [x + w - 7, y - h - roof], [x + 7, y - h - roof]];
    vol(g, rp, mix('#5f6f96', '#8d9cc0', haze), { poly: true, l: [.2, 0], sh: .35, hi: .15, gran: false });
    loose(g, [[x + 5, y - h - roof + 1], [x + w - 5, y - h - roof + 1], [x + w - 9, y - h - roof - 4], [x + 9, y - h - roof - 4]], '#f6f4ef', .95);
    for (let k = 0; k < 3; k++) loose(g, [[x - 3 + k * w / 3, y - h - 1], [x + k * w / 3 + w / 3, y - h - 1], [x + k * w / 3 + w / 3 - 6, y - h - roof * .45], [x + k * w / 3 + 2, y - h - roof * .4]], k % 2 ? '#e9edf5' : '#f8f6f1', .8);
    // buhardillas encendidas
    for (let d = 0; d < (o.dorm || 2); d++) { const dx = x + w * (d + .5) / (o.dorm || 2) - 6, dy = y - h - roof * .78; loose(g, [[dx - 3, dy + 16], [dx + 15, dy + 16], [dx + 15, dy + 2], [dx + 6, dy - 5], [dx - 3, dy + 2]], '#ece6da', .95); loose(g, [[dx + 1, dy + 15], [dx + 11, dy + 15], [dx + 11, dy + 4], [dx + 1, dy + 4]], '#f3c35e', .95); glow(g, dx + 6, dy + 9, 13, '255,196,100', .4); sketch(g, [[dx - 3, dy + 2], [dx + 6, dy - 5], [dx + 15, dy + 2]], .45, 2, .6); }
    // chimeneas con antenas
    for (let c = 0; c < (o.chim || 2); c++) {
      const cx = x + w * (.18 + c * .58) + (rnd() - .5) * 6, top = y - h - roof - 14 - rnd() * 6;
      vol(g, [[cx, y - h - roof * .5], [cx + 9, y - h - roof * .5], [cx + 9, top], [cx, top]], mix('#d9cdb8', '#c3c9da', haze), { poly: true, l: [0, .2], sh: .5, gran: false });
      loose(g, [[cx - 1, top + 1], [cx + 10, top + 1], [cx + 10, top - 2], [cx - 1, top - 2]], '#f7f5f0', .95);
      sketch(g, [[cx, y - h - roof * .5], [cx, top], [cx + 9, top], [cx + 9, y - h - roof * .5]], .45, 2, .6);
      if (rnd() < .7) { line(g, cx + 4, top, cx + 3, top - 16, .4, .55); line(g, cx - 2, top - 11, cx + 9, top - 12, .35, .5); line(g, cx, top - 15, cx + 7, top - 15.5, .3, .45); }
      chims.push([cx + 4.5, top - 2]);
    }
    // ventanas: encendidas (ámbar, con silueta a veces) o con el reflejo azul del cielo
    const rows = o.rows || 3, cols = o.cols || 3, ww = o.ww || 12, wh = o.wh || 17;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const wx = x + (c + .5) * w / cols - ww / 2, wy = y - h + 12 + r * (h - 26 - (o.shop ? 30 : 0)) / rows, lit = rnd() < (o.lit || .6);
      if (lit) {
        const wg = g.createLinearGradient(0, wy, 0, wy + wh); wg.addColorStop(0, '#ffe7a6'); wg.addColorStop(1, '#e89a3a');
        g.save(); g.fillStyle = wg; path(g, [[wx, wy], [wx + ww, wy], [wx + ww, wy + wh], [wx, wy + wh]], .8); g.fill(); g.restore();
        if (rnd() < .3) { dab(g, wx + ww * .5, wy + wh * .72, ww * .26, wh * .26, 'rgba(110,60,30,.6)', 1); dab(g, wx + ww * .5, wy + wh * .4, ww * .15, ww * .15, 'rgba(110,60,30,.6)', 1); }
        glow(g, wx + ww / 2, wy + wh / 2, ww * 1.6, '255,190,90', .38 * (1 - haze * .5));
      } else loose(g, [[wx, wy], [wx + ww, wy], [wx + ww, wy + wh], [wx, wy + wh]], mix('#566a96', '#8a9bc2', haze), .85);
      sketch(g, [[wx, wy], [wx + ww, wy], [wx + ww, wy + wh], [wx, wy + wh], [wx, wy]], .42, 2, .55 * (1 - haze * .5));
      line(g, wx + ww / 2, wy, wx + ww / 2, wy + wh, .35, .45);
      brush(g, wx - 2, wy + wh + 1.2, wx + ww + 2, wy + wh + 1.2, 1.8, '#fbfaf6', .9);
    }
    // cornisa
    sketch(g, [[x - 2, y - h + 4], [x + w + 2, y - h + 4]], .5, 2, .5);
    // planta baja: aparador cálido con toldo
    if (o.shop) {
      const sy = y - 26;
      loose(g, [[x + 6, y], [x + w - 6, y], [x + w - 6, sy], [x + 6, sy]], '#f0b85a', .95); glow(g, x + w / 2, sy + 14, w * .55, '255,186,90', .5);
      for (let k = 0; k < 4; k++) line(g, x + 6 + k * (w - 12) / 3, sy, x + 6 + k * (w - 12) / 3, y, .5, .6);
      loose(g, [[x + 2, sy], [x + w - 2, sy], [x + w + 2, sy - 8], [x - 2, sy - 8]], o.awning || K.burg, .95);
      for (let k = 0; k < 7; k++) line(g, x + k * w / 6, sy, x + k * w / 6 + 2, sy - 8, .7, .5, '#f2e8d2');
    }
    sketch(g, [[x, y], [x, y - h], [x + w, y - h], [x + w, y]], .55, 2, .6 * (1 - haze * .6));
    return chims;
  };
  // árbol enorme de la plaza con foquitos y esferas (como en la acuarela)
  const plazaTree = (g, tx, top, base, half) => {
    const H = base - top;
    for (let i = 0; i < 22; i++) {
      const t = i / 21, y = top + 10 + t * (H - 10), w = 4 + t * half;
      for (let k = 0; k < 12; k++) { const s2 = k % 2 ? 1 : -1, dx = s2 * rnd() * w, lit = s2 < 0 || rnd() < .3; dab(g, tx + dx, y + Math.abs(dx) / w * 9, 4 + rnd() * w * .2, 2.2 + rnd() * 3, lit ? (rnd() < .5 ? '#3f7a66' : '#4c8a70') : (rnd() < .5 ? '#24524a' : '#1d4440'), .78, s2 * (.3 + rnd() * .4)); }
      for (let k = 0; k < 3; k++) { const dx = (rnd() - .5) * 2 * w; ink(g, [[tx + dx * .2, y], [tx + dx, y + 8]], .45, false, .45); }
    }
    line(g, tx, top - 4, tx, base, .8, .6);
    for (let i = 0; i < 40; i++) { const y = top + 20 + rnd() * (H - 30), w = 4 + (y - top) / H * half * .9, x = tx + (rnd() * 2 - 1) * w; if (rnd() < .55) bulb(g, x, y, 1.3); else bauble(g, x, y, 2.6, rnd() < .5 ? '#b8323a' : '#d9a93e'); }
    const st = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 4 : 10; st.push([tx + Math.cos(a) * r, top - 8 + Math.sin(a) * r]); }
    glow(g, tx, top - 8, 30, '255,214,120', .7); loose(g, st, '#f1c453', 1); sketch(g, st, .5, 1, .7, true);
  };
  // copia suave (desenfoque barato): la vista lejana se ve fuera de foco, como en una foto
  const soft = (src, k = .42) => { const [b, bg] = cv(src.lw * k, src.lh * k); bg.drawImage(src, 0, 0, src.lw * k, src.lh * k); return b; };

  // la sala: ventanal en arco hacia la plaza nevada a la hora azul; se ve detrás de la esfera
  A.room = () => {
    A.seed(331); const W = 400, H = 820, [c, g] = cv(W, H);
    const wx = 34, wy = 92, ww = 332, wh = 508, arch = (gg, inset = 0, keep) => { if (!keep) gg.beginPath(); gg.moveTo(wx + inset, wy + wh); gg.lineTo(wx + inset, wy + 130); gg.bezierCurveTo(wx + inset, wy + 30 + inset, wx + ww * .25, wy + inset, wx + ww / 2, wy + inset); gg.bezierCurveTo(wx + ww * .75, wy + inset, wx + ww - inset, wy + 30 + inset, wx + ww - inset, wy + 130); gg.lineTo(wx + ww - inset, wy + wh); };

    /* --- 1. la vista: se pinta aparte y se desenfoca un poco (profundidad) --- */
    const [v, q] = cv(W, H);
    const sky = q.createLinearGradient(0, wy, 0, wy + 420); sky.addColorStop(0, '#2a4a8a'); sky.addColorStop(.4, '#4b70b0'); sky.addColorStop(.78, '#8ea7d2'); sky.addColorStop(1, '#e3c9a4');
    q.fillStyle = sky; q.fillRect(0, 0, W, H);
    for (let i = 0; i < 90; i++) { const y = wy + rnd() * 360, t = (y - wy) / 360; brush(q, rnd() * W - 20, y, rnd() * W + 20, y + (rnd() - .5) * 8, 3 + rnd() * 7, ['#2c4d8e', '#3d62a6', '#6688c2', '#a6b8d8', '#d6c2a8'][Math.min(4, Math.floor(t * 4 + rnd()))], .22); }
    glow(q, 210, 520, 260, '255,200,130', .35);
    // edificios lejanos, azulados por la distancia
    for (let i = 0; i < 9; i++) { const bx = -20 + i * 50 + rnd() * 10, bw = 40 + rnd() * 30, bh = 150 + rnd() * 90; loose(q, [[bx, 560], [bx + bw, 560], [bx + bw, 560 - bh], [bx + bw * .5, 560 - bh - 14], [bx, 560 - bh]], '#7a90c0', .7); for (let k = 0; k < 6; k++) if (rnd() < .5) dab(q, bx + 6 + rnd() * (bw - 12), 560 - 10 - rnd() * (bh - 20), 1.6, 2.2, '#f5c66a', .8); }
    // la plaza: fachadas como en la acuarela (las de atrás más pálidas)
    facade(q, 110, 520, 180, 190, { roof: 34, rows: 3, cols: 5, ww: 11, wh: 15, dorm: 3, chim: 2, haze: .45 });
    plazaTree(q, 212, 150, 590, 92);
    facade(q, -14, 600, 120, 330, { roof: 38, rows: 6, cols: 3, side: 12, dorm: 2, shop: true, awning: K.racing });
    facade(q, 292, 600, 130, 350, { roof: 34, rows: 6, cols: 3, side: -12, dorm: 2, shop: true, awning: K.burg });
    // nieve en la plaza con charcos de luz cálida y gente diminuta
    loose(q, [[0, 640], [0, 580], [W, 576], [W, 640]], '#e8e6ee', .95);
    for (const [px, r] of [[60, 50], [200, 70], [340, 50]]) glow(q, px, 590, r, '255,206,140', .45);
    for (let i = 0; i < 16; i++) { const px = 20 + rnd() * 360, py = 586 + rnd() * 12; dab(q, px + 2, py + 1, 4, 1.2, 'rgba(60,70,120,.35)', 1); dab(q, px, py - 5, 2.2, 4.6, ['#9e2430', '#24426e', '#2f6b47', '#7a5638', '#c79a64'][i % 5], .95); dab(q, px, py - 11, 1.7, 1.7, '#e9c4a0', .95); dab(q, px, py - 12.4, 1.8, 1, ['#7d1e2e', '#f2e8d2', '#1f4d35'][i % 3], .95); }
    splat(q, 0, wy, W, 600, 220, '#ffffff', .85);
    // se pega la vista dentro del arco: una pasada suave y otra muy tenue nítida
    g.fillStyle = PAPER; g.fillRect(0, 0, W, H);
    g.save(); arch(g); g.closePath(); g.clip();
    g.drawImage(soft(v), 0, 0, W, H);
    g.globalAlpha = .28; g.drawImage(v, 0, 0, W, H); g.globalAlpha = 1;
    // reflejo cálido de la sala en el vidrio
    const rf = g.createLinearGradient(wx, wy, wx + ww, wy + wh); rf.addColorStop(0, 'rgba(255,232,196,.10)'); rf.addColorStop(.5, 'rgba(255,232,196,0)'); rf.addColorStop(1, 'rgba(255,232,196,.12)');
    g.fillStyle = rf; g.fillRect(wx, wy, ww, wh);
    for (let k = 0; k < 4; k++) { const x0 = wx + 30 + k * 80 + rnd() * 20; brush(g, x0, wy + 140, x0 + 60, wy + 40, 5 + rnd() * 6, '#ffffff', .06); }
    g.restore();

    /* --- 2. la sala: muro crema iluminado por la lámpara, sombras azuladas en las orillas --- */
    g.save();
    g.beginPath(); g.rect(0, 0, W, H); arch(g, 0, true); g.closePath(); g.clip('evenodd');
    const wall = g.createRadialGradient(200, 640, 40, 200, 560, 620); wall.addColorStop(0, '#f8e7c6'); wall.addColorStop(.45, '#eadcc2'); wall.addColorStop(1, '#bcb6ad');
    g.fillStyle = wall; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i++) dab(g, rnd() * W, rnd() * H, 30 + rnd() * 70, 20 + rnd() * 50, rnd() < .5 ? 'rgba(236,222,196,.35)' : 'rgba(150,158,185,.12)', 1, rnd() * 3);
    // moldura del techo con su sombra
    vol(g, [[0, 0], [W, 0], [W, 22], [0, 22]], '#efe4cf', { poly: true, l: [.5, 0], sh: .3, gran: false });
    const cs = g.createLinearGradient(0, 22, 0, 46); cs.addColorStop(0, 'rgba(70,72,100,.3)'); cs.addColorStop(1, 'rgba(70,72,100,0)'); g.fillStyle = cs; g.fillRect(0, 22, W, 24);
    sketch(g, [[0, 22], [W, 22]], .7, 2, .6); sketch(g, [[0, 14], [W, 14]], .45, 1, .45);
    g.restore();
    // marco de piedra del ventanal: moldura clara y el derrame interior en sombra
    g.save(); g.lineJoin = 'round';
    arch(g, -12); g.strokeStyle = '#f1e6d1'; g.lineWidth = 22; g.stroke();
    arch(g, -22); g.strokeStyle = 'rgba(255,248,232,.9)'; g.lineWidth = 2; g.stroke();
    arch(g, -1); g.strokeStyle = 'rgba(30,44,92,.35)'; g.lineWidth = 6; g.stroke();
    arch(g, 5); g.strokeStyle = 'rgba(30,44,92,.16)'; g.lineWidth = 8; g.stroke();
    g.restore();
    sketch(g, [[wx - 23, wy + wh], [wx - 23, wy + 128], [wx - 10, wy + 40], [wx + 60, wy - 12], [wx + ww / 2, wy - 22], [wx + ww - 60, wy - 12], [wx + ww + 10, wy + 40], [wx + ww + 23, wy + 128], [wx + ww + 23, wy + wh]], .9, 3, .75);
    sketch(g, [[wx, wy + wh], [wx, wy + 130], [wx + 30, wy + 34], [wx + ww / 2, wy], [wx + ww - 30, wy + 34], [wx + ww, wy + 130], [wx + ww, wy + wh]], .7, 2, .6);
    // clave del arco
    vol(g, [[wx + ww / 2 - 14, wy - 26], [wx + ww / 2 + 14, wy - 26], [wx + ww / 2 + 10, wy + 6], [wx + ww / 2 - 10, wy + 6]], '#efe3cc', { poly: true, l: [.3, .1], sh: .4, ink: .6 });
    // parteluces de herrería verde oscuro con filo de luz cálida
    for (const [x1, y1, x2, y2] of [[wx + ww / 2, wy, wx + ww / 2, wy + wh], [wx, wy + 300, wx + ww, wy + 300], [wx, wy + 130, wx + ww, wy + 130]]) { brush(g, x1, y1, x2, y2, 4.4, '#23332e', .95); brush(g, x1 - 1.2, y1 - 1.2, x2 - 1.2, y2 - 1.2, 1, '#d9bf8e', .55); }
    // guirnalda siguiendo el arco, con bolas doradas y foquitos encendidos
    const gp = []; for (let k = 0; k <= 46; k++) { const t = k / 46, a = Math.PI + t * Math.PI; gp.push([wx + ww / 2 + Math.cos(a) * (ww / 2 + 10), wy + 132 + Math.sin(a) * 140 + Math.sin(t * Math.PI * 6) * 6]); }
    for (const [x, y] of gp) { dab(g, x + 3, y + 5, 8, 4, 'rgba(40,48,80,.12)', 1); for (let k = 0; k < 5; k++) { const top = rnd() < .45; dab(g, x + (rnd() - .5) * 12, y + (rnd() - .5) * 9, 5.5, 2.6, top ? (rnd() < .5 ? '#6d9a45' : '#5a8a3c') : (rnd() < .5 ? '#2f5a2c' : '#24482a'), .88, rnd() * 3); } }
    for (let k = 1; k < gp.length; k += 3) bauble(g, gp[k][0], gp[k][1] + 4, 3.2, '#d9a93e');
    for (let k = 2; k < gp.length; k += 3) bulb(g, gp[k][0], gp[k][1] + 1, 1.3);
    for (const sx of [wx - 14, wx + ww + 14]) for (let k = 0; k < 16; k++) { const y = wy + 140 + k * 26; dab(g, sx + (rnd() - .5) * 8, y, 6, 3, rnd() < .5 ? '#5a8a3c' : '#2f5a2c', .85, rnd() * 3); if (k % 2) bauble(g, sx + (rnd() - .5) * 6, y + 4, 3, '#d9a93e'); else bulb(g, sx, y + 6, 1.2); }
    // la corona dorada colgada de un listón borgoña
    brush(g, wx + ww / 2, wy + 6, wx + ww / 2, wy + 136, 3, K.burg, .95);
    goldWreath(g, wx + ww / 2, wy + 172, 36);
    // alféizar de piedra con su sombra
    vol(g, [[wx - 26, wy + wh - 2], [wx + ww + 26, wy + wh - 2], [wx + ww + 30, wy + wh + 16], [wx - 30, wy + wh + 16]], '#e7dcc6', { poly: true, l: [.5, 0], sh: .35, ink: .55 });
    const ss = g.createLinearGradient(0, wy + wh + 16, 0, wy + wh + 44); ss.addColorStop(0, 'rgba(60,60,90,.35)'); ss.addColorStop(1, 'rgba(60,60,90,0)'); g.fillStyle = ss; g.fillRect(wx - 30, wy + wh + 16, ww + 60, 28);
    // topiarios en macetas blancas: luz cálida de un lado, filo azul de la ventana del otro
    for (const [px, sideL] of [[wx + 26, 1], [wx + ww - 26, -1]]) {
      const by = wy + wh - 2;
      dab(g, px + sideL * 10, by - 2, 24, 4, 'rgba(40,40,80,.28)', 1);
      vol(g, [[px - 15, by], [px + 15, by], [px + 18, by - 26], [px - 18, by - 26]], '#f7f4ee', { poly: true, l: [sideL > 0 ? .15 : .85, .1], sh: .45, ink: .55 });
      brush(g, px - 19, by - 26, px + 19, by - 26, 3, '#ffffff', .9);
      for (let k = 0; k < 70; k++) { const t = rnd(), dx = (rnd() - .5) * (1 - t) * 38, lit = dx * sideL < 0 ? rnd() < .75 : rnd() < .2; dab(g, px + dx, by - 30 - t * 120, 6.5 * (1 - t) + 3, 4, lit ? (rnd() < .5 ? '#86ad52' : '#6d9a45') : (rnd() < .5 ? '#2f5a2c' : '#24482a'), .85, rnd() * 3); }
      for (let k = 0; k < 10; k++) { const t = rnd(); dab(g, px - sideL * (1 - t) * 17, by - 30 - t * 120, 2, 3, '#cfdcf0', .5); }
      sketch(g, [[px - 19, by - 30], [px, by - 152], [px + 19, by - 30]], .45, 1, .35);
    }
    // cortinas de lino con pliegues: luz de lámpara en las crestas, sombra azul en los valles
    for (const [x0, dir] of [[0, 1], [W, -1]]) {
      const cw = 40;
      g.save(); g.beginPath(); g.moveTo(x0, 30); g.lineTo(x0 + dir * cw, 30); g.quadraticCurveTo(x0 + dir * (cw - 8), 560, x0 + dir * (cw + 6), H); g.lineTo(x0, H); g.closePath(); g.clip();
      const cg = g.createLinearGradient(x0, 0, x0 + dir * cw * 1.2, 0); for (let k = 0; k <= 8; k++) cg.addColorStop(k / 8, k % 2 ? '#f6ecd9' : '#c9c2b6'); g.fillStyle = cg; g.fillRect(Math.min(x0, x0 + dir * 60), 0, 60, H);
      const rim = g.createLinearGradient(x0 + dir * (cw - 10), 0, x0 + dir * cw, 0); rim.addColorStop(0, 'rgba(190,206,236,0)'); rim.addColorStop(1, 'rgba(190,206,236,.6)'); g.fillStyle = rim; g.fillRect(Math.min(x0, x0 + dir * 60), 0, 60, H);
      g.restore();
      for (let k = 1; k < 5; k++) sketch(g, [[x0 + dir * k * 9, 34], [x0 + dir * (k * 9 - 2), 560], [x0 + dir * (k * 9 + 2), H]], .4, 1, .35);
      brush(g, x0, 566, x0 + dir * (cw - 4), 560, 4, '#c79a3c', .95); dab(g, x0 + dir * (cw - 6), 562, 3.6, 3.6, '#e0b54d', 1);
    }
    // barra de la cortina
    brush(g, 0, 30, W, 30, 4, '#8a6a3a', .9); brush(g, 0, 29, W, 29, 1, '#e8cf9a', .7);
    // piso de madera en sombra
    loose(g, [[0, 640], [W, 640], [W, H], [0, H]], '#9a7550', .85);
    // viñeta azulada y luz de lámpara (lo que da la profundidad)
    const vg = g.createRadialGradient(200, 470, 160, 200, 430, 560); vg.addColorStop(0, 'rgba(30,40,90,0)'); vg.addColorStop(1, 'rgba(30,40,90,.38)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
    glow(g, 200, 600, 300, '255,214,150', .3);
    grain(g, W, H, .3);
    return c;
  };
  // la mesa de madera: el filo del fondo refleja la ventana, el frente cae en sombra,
  // y la esfera deja un charco de luz cálida
  A.tableTop = () => {
    A.seed(333); const W = 1000, H = 400, [c, g] = cv(W, H);
    const tg = g.createLinearGradient(0, 0, 0, H); tg.addColorStop(0, '#c6925c'); tg.addColorStop(.3, '#a8703f'); tg.addColorStop(1, '#5a3418');
    g.fillStyle = tg; g.fillRect(0, 0, W, H);
    // vetas largas y suaves de la madera
    for (let i = 0; i < 26; i++) { const y = 16 + rnd() * 380; brush(g, -20, y, W + 20, y + (rnd() - .5) * 6, 1 + rnd() * 2.5, rnd() < .5 ? '#d9a46c' : '#7a4a26', .28); }
    for (let i = 0; i < 40; i++) dab(g, rnd() * W, 20 + rnd() * 370, 30 + rnd() * 80, 3 + rnd() * 5, rnd() < .5 ? 'rgba(230,180,120,.12)' : 'rgba(90,50,25,.14)', 1);
    // reflejo de la ventana (azul) y el charco de luz cálida que deja la esfera
    glow(g, 500, 24, 440, '160,180,225', .2);
    glow(g, 500, 40, 260, '255,200,130', .32);
    for (let k = 0; k < 4; k++) brush(g, 478 + k * 14, 24, 474 + k * 15, 120 + rnd() * 40, 7, 'rgba(255,214,150,.1)', 1);
    brush(g, 0, 4, W, 4, 6, '#e3bd8a', .95);
    sketch(g, [[0, 8], [W, 8]], 1.2, 3, .75);
    g.save(); const sh = g.createLinearGradient(0, 10, 0, 50); sh.addColorStop(0, 'rgba(60,34,20,.35)'); sh.addColorStop(1, 'rgba(60,34,20,0)'); g.fillStyle = sh; g.fillRect(0, 10, W, 40); g.restore();
    const vg = g.createLinearGradient(0, 0, W, 0); vg.addColorStop(0, 'rgba(30,26,60,.4)'); vg.addColorStop(.3, 'rgba(30,26,60,0)'); vg.addColorStop(.7, 'rgba(30,26,60,0)'); vg.addColorStop(1, 'rgba(30,26,60,.4)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
    grain(g, W, H, .25);
    return c;
  };
  // adentro de la esfera: la misma plaza a la hora azul, ventanas encendidas, el árbol con foquitos y Teddy
  A.globeInside = (ground) => {
    A.seed(335); const W = 400, H = 400, [c, g] = cv(W, H);
    g.save(); g.beginPath(); g.arc(200, 200, 194, 0, 6.2832); g.clip();
    const sky = g.createLinearGradient(0, 0, 0, 330); sky.addColorStop(0, '#2f5193'); sky.addColorStop(.6, '#7895c8'); sky.addColorStop(1, '#e4cba6');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 50; i++) { const y = rnd() * 260; brush(g, rnd() * W - 20, y, rnd() * W + 20, y + (rnd() - .5) * 6, 3 + rnd() * 6, y < 120 ? '#3a5fa4' : '#9bb0d6', .2); }
    glow(g, 200, 300, 200, '255,200,130', .35);
    const ch = facade(g, 52, 308, 104, 150, { roof: 26, rows: 3, cols: 3, side: 8, dorm: 2, chim: 2, shop: true, awning: K.racing, lit: .7 });
    facade(g, 246, 312, 104, 160, { roof: 24, rows: 3, cols: 3, side: -8, dorm: 2, chim: 1, shop: true, awning: K.burg, lit: .7 });
    plazaTree(g, 200, 188, 312, 38);
    // la nieve del suelo (la misma curva donde se asienta la nieve), con sombra azul y luz cálida
    g.beginPath(); g.moveTo(-5, 405);
    for (let i = 0; i <= 40; i++) { const x = -1 + i / 20; g.lineTo(200 + 196 * x, 200 + 196 * ground(x)); }
    g.lineTo(405, 405); g.closePath();
    const sn = g.createLinearGradient(0, 300, 0, 400); sn.addColorStop(0, '#f9f4ea'); sn.addColorStop(1, '#b9c6e2'); g.fillStyle = sn; g.fill();
    for (const [px, r] of [[104, 60], [200, 70], [298, 60]]) glow(g, px, 322, r, '255,200,130', .45);
    g.beginPath(); for (let i = 0; i <= 40; i++) { const x = -1 + i / 20; g.lineTo(200 + 196 * x, 200 + 196 * ground(x)); } g.strokeStyle = 'rgba(26,29,48,.45)'; g.lineWidth = .8; g.stroke();
    for (let i = 0; i < 12; i++) dab(g, 40 + rnd() * 320, 330 + rnd() * 50, 20 + rnd() * 30, 3 + rnd() * 3, 'rgba(120,145,200,.3)', 1);
    // Teddy, el yorkie café, sentado en la nieve con su sombrita
    dab(g, 258, 331, 13, 3, 'rgba(50,60,110,.35)', 1);
    teddyBody(g, 252, 330, 2.1, 0, true);
    splat(g, 20, 20, 380, 300, 110, '#ffffff', .95);
    // el vidrio oscurece la orilla (como lo que se ve por una lupa)
    const edge = g.createRadialGradient(200, 200, 120, 200, 200, 196); edge.addColorStop(0, 'rgba(30,50,110,0)'); edge.addColorStop(1, 'rgba(30,50,110,.45)');
    g.fillStyle = edge; g.fillRect(0, 0, W, H);
    g.restore();
    grain(g, W, H, .25);
    c.smoke = ch[0];
    return c;
  };
  // el vidrio: borde que refleja la sala, el ventanal reflejado, brillos y contorno de tinta
  A.globeGlass = () => {
    A.seed(337); const W = 400, H = 400, [c, g] = cv(W, H);
    g.save(); g.beginPath(); g.arc(200, 200, 194, 0, 6.2832); g.clip();
    // borde: el vidrio se vuelve espejo hacia la orilla
    const fr = g.createRadialGradient(200, 190, 150, 200, 200, 196); fr.addColorStop(0, 'rgba(230,240,255,0)'); fr.addColorStop(.8, 'rgba(230,240,255,.12)'); fr.addColorStop(1, 'rgba(240,246,255,.5)');
    g.fillStyle = fr; g.fillRect(0, 0, W, H);
    // el ventanal reflejado (curvado por la esfera)
    g.save(); g.translate(124, 128); g.rotate(-.5);
    g.globalAlpha = .13; g.fillStyle = '#ffffff';
    g.beginPath(); g.moveTo(-30, 50); g.lineTo(-30, -6); g.quadraticCurveTo(-30, -40, 0, -42); g.quadraticCurveTo(30, -40, 30, -6); g.lineTo(30, 50); g.closePath(); g.fill();
    g.globalAlpha = .32; g.strokeStyle = '#2a3550'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(0, -42); g.lineTo(0, 50); g.moveTo(-30, 4); g.lineTo(30, 4); g.stroke();
    g.restore();
    // luz cálida de la lámpara rebotando abajo a la derecha
    const wl = g.createRadialGradient(300, 320, 0, 300, 320, 120); wl.addColorStop(0, 'rgba(255,214,150,.4)'); wl.addColorStop(1, 'rgba(255,214,150,0)'); g.fillStyle = wl; g.fillRect(0, 0, W, H);
    g.restore();
    g.save(); g.lineCap = 'round';
    g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 8; g.beginPath(); g.arc(200, 200, 170, Math.PI * 1.1, Math.PI * 1.38); g.stroke();
    g.lineWidth = 3.5; g.beginPath(); g.arc(200, 200, 170, Math.PI * 1.44, Math.PI * 1.5); g.stroke();
    g.strokeStyle = 'rgba(255,230,180,.7)'; g.lineWidth = 4; g.beginPath(); g.arc(200, 200, 182, Math.PI * .1, Math.PI * .32); g.stroke();
    g.restore();
    dab(g, 116, 112, 7, 3.4, '#ffffff', .85, -.7); glow(g, 116, 112, 16, '255,255,255', .6);
    const p = []; for (let k = 0; k <= 40; k++) { const a = k / 40 * 6.2832; p.push([200 + Math.cos(a) * 194, 200 + Math.sin(a) * 194]); }
    sketch(g, p, 1.2, 3, .8, true);
    return c;
  };
  // la base: verde inglés con dorado (estilo Ralph Lauren), con volumen y brillo
  A.globeBase = (date) => {
    A.seed(339); const W = 400, H = 160, [c, g] = cv(W, H);
    // collar donde asienta el vidrio
    vol(g, (() => { const q = []; for (let k = 0; k <= 24; k++) { const a = Math.PI + k / 24 * Math.PI; q.push([200 + Math.cos(a) * 128, 24 + Math.sin(a) * 16]); } return q.concat([[328, 32], [72, 32]]); })(), '#183424', { poly: true, l: [.3, 0], sh: .5, hi: .2, gran: false });
    const body = [[76, 24], [324, 24], [350, 128], [50, 128]];
    vol(g, body, '#2c6443', { poly: true, l: [.22, .1], sh: .62, hi: .38, r: .9 });
    // reflejo vertical del barniz
    brush(g, 112, 30, 98, 122, 7, 'rgba(255,240,210,.18)', 1); brush(g, 126, 30, 114, 122, 2, 'rgba(255,240,210,.22)', 1);
    // filetes dorados con su brillo
    for (const [y, x0, x1, w] of [[40, 78, 322, 3.6], [118, 66, 334, 2.8]]) { brush(g, x0, y, x1, y, w, '#c99a3a', .95); brush(g, x0 + 4, y - w * .3, x0 + (x1 - x0) * .45, y - w * .3, w * .4, '#fff0b8', .8); brush(g, x0 + (x1 - x0) * .7, y + w * .2, x1, y + w * .2, w * .4, '#7a5a1a', .5); }
    // zócalo
    vol(g, [[36, 128], [364, 128], [364, 148], [36, 148]], '#1f4a33', { poly: true, l: [.2, 0], sh: .55, hi: .25, gran: false, ink: .6 });
    brush(g, 38, 129, 362, 129, 1.4, '#e3c06a', .8);
    // placa dorada
    const pl = []; for (let k = 0; k <= 28; k++) { const a = k / 28 * 6.2832; pl.push([200 + Math.cos(a) * 72, 84 + Math.sin(a) * 22]); }
    g.save(); path(g, pl, .4); g.clip();
    const pg = g.createLinearGradient(130, 62, 270, 106); pg.addColorStop(0, '#f6dc8a'); pg.addColorStop(.45, '#d9a93e'); pg.addColorStop(.7, '#f0cf78'); pg.addColorStop(1, '#9a7428');
    g.fillStyle = pg; g.fillRect(120, 58, 160, 52); g.restore();
    glow(g, 176, 74, 34, '255,248,210', .5); sketch(g, pl, .7, 2, .7, true);
    g.save(); g.textAlign = 'center';
    g.fillStyle = 'rgba(255,240,190,.6)'; g.font = '18px "IM Fell English SC", Georgia, serif'; g.fillText('Posada', 200, 85); g.font = 'italic 10.5px "IM Fell English", Georgia, serif'; g.fillText(date || 'MMXXVI', 200, 101);
    g.fillStyle = '#3a2608'; g.font = '18px "IM Fell English SC", Georgia, serif'; g.fillText('Posada', 200, 84);
    g.font = 'italic 10.5px "IM Fell English", Georgia, serif'; g.fillText(date || 'MMXXVI', 200, 100); g.restore();
    for (const s2 of [-1, 1]) goldWreath(g, 200 + s2 * 104, 80, 12);
    sketch(g, [[76, 24], [50, 128], [350, 128], [324, 24]], .8, 2, .75);
    grain(g, W, H, .3);
    return c;
  };
  // la etiqueta de Teddy: tarjetita de papel con ojillo dorado, atada con hilo rojo a su collar
  A.teddyTag = () => {
    A.seed(43); const W = 100, H = 80, [c, g] = cv(W, H);
    const tag = [[12, 44], [20, 37], [86, 39], [90, 43], [89, 72], [85, 75], [19, 74], [11, 66]];
    g.save(); g.translate(2.5, 3); g.fillStyle = 'rgba(60,36,20,.35)'; path(g, tag, 1); g.fill(); g.restore();
    vol(g, tag, '#f4ead3', { poly: true, l: [.15, 0], sh: .22, hi: .4, ink: .8, iw: .8 });
    sketch(g, [[22, 42], [83, 44], [84, 70], [22, 70], [22, 42]], .4, 1, .4);
    dab(g, 24, 56, 4.2, 4.2, '#c99a3a', 1); dab(g, 24, 56, 2.2, 2.2, '#6a4a22', 1); dab(g, 23, 55, 1, 1, '#fff0b8', .9);
    // hilo rojo hasta el collar
    ink(g, [[24, 56], [30, 40], [42, 20], [50, 2]], 1.2, false, .95, '#b3202c');
    g.save(); g.fillStyle = '#2b1f16'; g.textAlign = 'center'; g.font = 'italic 22px "IM Fell English", Georgia, serif'; g.fillText('Teddy', 58, 64); g.restore();
    grain(g, W, H, .3);
    return c;
  };
  // letrero de madera clavado en la nieve, para Teddy en la villa
  A.teddySign = () => {
    A.seed(47); const W = 80, H = 70, [c, g] = cv(W, H);
    vol(g, [[37, 68], [43, 68], [43, 26], [37, 26]], K.wood, { poly: true, l: [0, .2], sh: .5, gran: false, ink: .6 });
    const b = [[6, 10], [74, 8], [76, 34], [4, 36]];
    vol(g, b, '#f1e4c8', { poly: true, l: [.2, 0], sh: .3, ink: .85, iw: .9 });
    brush(g, 6, 9, 74, 7, 3, '#fbfaf6', .95);
    g.save(); g.fillStyle = '#2b1f16'; g.textAlign = 'center'; g.font = 'italic 21px "IM Fell English", Georgia, serif'; g.fillText('Teddy', 40, 29); g.restore();
    dab(g, 40, 67, 14, 3, 'rgba(240,240,250,.95)', 1);
    grain(g, W, H, .3);
    return c;
  };

  /* =========================================================
     SANTA Y SUS RENOS — clásicos, pintados con volumen (luz cálida
     arriba, sombra azulada abajo), en piezas separadas para que se muevan
     ========================================================= */
  // acuarela mojada: el pigmento se corre más allá del contorno, se queda papel blanco
  // del lado de la luz, una segunda veladura más oscura en la sombra, coliflores
  // donde el agua regresó, granulado y tinta suelta, cortada y un poco desfasada
  const wv = (g, pts, col, o = {}) => {
    const [x0, y0, x1, y1] = bbox(pts), w = x1 - x0 || 1, h = y1 - y0 || 1, sm = o.poly ? (q, j) => path(g, q, j) : (q, j) => curve(g, q, j);
    const L = o.l || [.3, .2], lx = x0 + w * L[0], ly = y0 + h * L[1], sx = x0 + w * (1 - L[0]), sy = y0 + h * (1 - L[1]), sh = o.sh == null ? .5 : o.sh;
    g.save(); g.fillStyle = col;
    for (let k = 0; k < 5; k++) { g.globalAlpha = .21; sm(pts.map(([x, y]) => [x + (rnd() - .5) * 1.6, y + (rnd() - .5) * 1.6]), 1); g.fill(); }
    g.globalAlpha = 1; sm(pts, 0); g.clip();
    const gr = g.createRadialGradient(lx, ly, 0, lx, ly, Math.max(w, h) * .65); gr.addColorStop(0, `rgba(255,250,238,${o.hi == null ? .5 : o.hi})`); gr.addColorStop(1, 'rgba(255,250,238,0)');
    g.fillStyle = gr; g.fillRect(x0 - 2, y0 - 2, w + 4, h + 4);
    for (let k = 0; k < 5; k++) dab(g, sx + (rnd() - .5) * w * .5, sy + (rnd() - .5) * h * .5, w * (.25 + rnd() * .25), h * (.25 + rnd() * .25), shade(col, .58), sh * .28, rnd() * 3);
    dab(g, sx, sy, w * .45, h * .45, 'rgb(40,52,112)', sh * .14);
    for (let k = 0; k < (o.blooms == null ? 2 : o.blooms); k++) { const bx = x0 + w * (.2 + rnd() * .6), by = y0 + h * (.2 + rnd() * .6), br = Math.min(w, h) * (.12 + rnd() * .14); dab(g, bx, by, br, br, mix(col, '#ffffff', .45), .28); g.save(); g.strokeStyle = shade(col, .6); g.globalAlpha = .22; g.lineWidth = .35; g.beginPath(); for (let a = 0; a <= 6.3; a += .5) { const rr = br * (1 + (rnd() - .5) * .35); a ? g.lineTo(bx + Math.cos(a) * rr, by + Math.sin(a) * rr) : g.moveTo(bx + rr, by); } g.closePath(); g.stroke(); g.restore(); }
    const n = Math.min(500, w * h / 6); for (let i = 0; i < n; i++) dab(g, x0 + rnd() * w, y0 + rnd() * h, .2 + rnd() * .5, .2 + rnd() * .5, shade(col, .5), .14);
    g.restore();
    g.save(); g.strokeStyle = shade(col, .66); g.lineWidth = .6;
    for (let k = 0; k < 2; k++) { g.globalAlpha = .28; sm(pts, 1); g.stroke(); }
    g.restore();
    if (o.ink) { g.save(); g.translate(.5, -.4); g.strokeStyle = K.ink; g.globalAlpha = o.ink * .6; g.lineWidth = (o.iw || .6) * .8; g.setLineDash([5 + rnd() * 4, 1.6 + rnd() * 2]); sm(pts, 1.1); g.stroke(); g.restore(); }
  };
  // lienzo con más resolución, para piezas chicas con detalle
  const cvHi = (w, h) => { const c = document.createElement('canvas'); c.width = Math.ceil(w * 4); c.height = Math.ceil(h * 4); const g = c.getContext('2d'); g.scale(4, 4); g.lineCap = 'round'; g.lineJoin = 'round'; c.lw = w; c.lh = h; return [c, g]; };
  // un reno en pleno galope volador (mira a la izquierda), dos cuadros: estirado y recogido
  A.reindeer = (frame) => {
    A.seed(411); const W = 80, H = 66, [c, g] = cvHi(W, H);
    const fur = '#8b5a34', furD = '#5c3a22', leg = (pts, w0) => { for (let i = 0; i < pts.length - 1; i++) brush(g, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], w0 * (1 - i * .3), i ? furD : fur, 1); const e = pts[pts.length - 1]; dab(g, e[0], e[1], 1.6, 1.1, '#20140d', 1); };
    const far = frame ? [[[31, 44], [26, 52], [30, 59]], [[57, 43], [52, 51], [47, 56]]] : [[[31, 44], [21, 50], [14, 53]], [[57, 43], [66, 49], [75, 51]]];
    const near = frame ? [[[28, 44], [24, 53], [27, 60]], [[61, 43], [57, 52], [52, 58]]] : [[[28, 44], [18, 51], [10, 55]], [[61, 43], [70, 50], [78, 54]]];
    // patas del fondo, más oscuras
    g.save(); g.globalAlpha = .8; far.forEach(p => leg(p, 2.8)); g.restore();
    // cuerpo
    wv(g, [[24, 34], [30, 28], [44, 27], [58, 28], [67, 31], [69, 37], [65, 44], [52, 46], [38, 46], [27, 44]], fur, { l: [.35, 0], sh: .6, hi: .45, ink: .5 });
    dab(g, 46, 44, 13, 2.4, '#e9dcc6', .55);
    dab(g, 68, 34, 3, 4, '#f3ece0', .95); brush(g, 69, 32, 73, 29, 1.6, '#f3ece0', .9);
    for (let i = 0; i < 16; i++) { const x = 30 + rnd() * 34, y = 30 + rnd() * 12; line(g, x, y, x + 2.4, y + .6, .35, .35, furD); }
    // pecho y cuello con la melena clara
    wv(g, [[22, 36], [16, 26], [13, 18], [19, 14], [25, 20], [31, 30]], '#7d4f2e', { l: [.4, 0], sh: .5, gran: false, ink: .45 });
    for (let k = 0; k < 7; k++) brush(g, 16 + k * .8, 22 + k * 1.6, 13 + k * .9, 27 + k * 1.8, 1.4, '#efe4d0', .85);
    // cabeza
    wv(g, [[16, 17], [10, 14], [4, 15.5], [2, 19], [6, 21], [12, 21], [18, 19]], fur, { l: [.4, .1], sh: .5, gran: false, ink: .55 });
    dab(g, 4, 19, 2.6, 2, '#4a2e1c', 1); dab(g, 2.6, 18.4, 1.1, .9, '#1a100a', 1);
    dab(g, 10.5, 16.4, 1, 1, '#15100c', 1); dab(g, 10.2, 16, .35, .35, '#ffffff', 1);
    wv(g, [[16, 14], [20, 10.5], [21, 13], [18, 16]], fur, { gran: false, edge: false, ink: .4 });
    // astas ramificadas
    const ant = '#6b5236';
    for (const [ox, k] of [[0, 1], [3, .85]]) { g.save(); g.globalAlpha = k; ink(g, [[14 + ox, 13], [15 + ox, 7], [20 + ox, 3], [26 + ox, 1.5]], 1.3, false, .95, ant); ink(g, [[15 + ox, 8], [12 + ox, 3]], .9, false, .95, ant); ink(g, [[18 + ox, 4.6], [18 + ox, .5]], .8, false, .95, ant); ink(g, [[22 + ox, 2.6], [23 + ox, -.5]], .7, false, .95, ant); g.restore(); }
    // arnés borgoña con cascabeles dorados
    brush(g, 20, 25, 27, 34, 2.8, K.burg, 1); brush(g, 20.4, 24.6, 26.6, 33, .7, K.burgL, .9);
    for (const [bx, by] of [[21.5, 28], [23.5, 31], [25.8, 34]]) bauble(g, bx, by + 1.6, 1.5, '#d9a93e');
    brush(g, 36, 28, 37, 46, 2.4, K.burg, 1); brush(g, 30, 30, 70, 31, 1.4, K.burg, .9);
    for (let k = 0; k < 4; k++) dab(g, 40 + k * 7, 30.8, .8, .8, '#e8c56a', 1);
    // patas del frente
    near.forEach(p => leg(p, 3.2));
    grain(g, W, H, .28);
    return c;
  };
  // el trineo clásico: laca roja, volutas y patines dorados, manta escocesa y el costal de juguetes
  A.sleighBody = () => {
    A.seed(413); const W = 150, H = 100, [c, g] = cvHi(W, H);
    // costal de yute con juguetes asomándose
    wv(g, [[94, 46], [92, 30], [98, 18], [110, 14], [122, 20], [126, 34], [124, 46]], '#b48a5a', { l: [.3, 0], sh: .55, ink: .55 });
    for (let k = 0; k < 12; k++) line(g, 96 + rnd() * 26, 20 + rnd() * 24, 99 + rnd() * 26, 21 + rnd() * 24, .3, .35, '#6a4a2a');
    wv(g, [[100, 20], [112, 18], [112, 8], [100, 10]], '#9e1f2b', { poly: true, l: [.2, 0], sh: .5, gran: false, ink: .6 }); brush(g, 106, 19, 106, 9, 1.6, '#d9a93e', 1); brush(g, 100, 14, 112, 13, 1.4, '#d9a93e', 1);
    wv(g, [[113, 20], [122, 21], [121, 12], [113, 12]], K.sage, { poly: true, l: [.2, 0], sh: .45, gran: false, ink: .6 }); brush(g, 117.5, 20, 117.5, 12, 1.2, K.burg, 1);
    dab(g, 109, 8, 4, 3.6, '#a8774a', 1); dab(g, 106, 5, 1.6, 1.6, '#a8774a', 1); dab(g, 112, 5, 1.6, 1.6, '#a8774a', 1); dab(g, 108, 8, .5, .5, '#15100c', 1); dab(g, 110.4, 8, .5, .5, '#15100c', 1); dab(g, 109.2, 9.6, 1.2, .8, '#d9b896', 1);
    // el interior en sombra (da la profundidad)
    loose(g, [[28, 46], [104, 46], [104, 38], [28, 38]], '#3d0c14', .9);
    // la caja del trineo
    const body = [[24, 74], [14, 66], [10, 52], [12, 40], [18, 34], [26, 37], [30, 44], [104, 44], [110, 30], [116, 18], [124, 14], [131, 17], [129, 26], [122, 32], [120, 50], [114, 64], [100, 74]];
    wv(g, body, '#9c1621', { l: [.3, .05], sh: .6, hi: .3, light: '255,170,140', r: .9, ink: .75, iw: .8 });
    // brillo de la laca
    brush(g, 34, 50, 102, 50, 2.2, 'rgba(255,170,150,.35)', 1); brush(g, 118, 22, 122, 44, 1.6, 'rgba(255,190,180,.4)', 1);
    // filete dorado y volutas en el costado
    brush(g, 30, 45, 104, 45, 2.2, '#d9a93e', 1); brush(g, 32, 44.2, 80, 44.2, .7, '#fff0b8', .9);
    for (const [cx, s] of [[52, 1], [84, -1]]) { ink(g, [[cx - s * 12, 62], [cx - s * 6, 55], [cx, 54], [cx + s * 6, 57], [cx + s * 4, 62], [cx - s * 1, 61], [cx, 58]], 1, false, .95, '#d9a93e'); ink(g, [[cx - s * 12, 62], [cx - s * 18, 60], [cx - s * 20, 56]], .8, false, .9, '#d9a93e'); }
    dab(g, 68, 58, 2.6, 2.6, '#d9a93e', 1); dab(g, 67.4, 57.4, .9, .9, '#fff0b8', 1);
    // voluta del frente
    ink(g, [[24, 72], [13, 62], [10, 48], [13, 38], [19, 34], [24, 36], [23, 41], [19, 41]], 2.2, false, .95, '#d9a93e'); ink(g, [[23, 70], [13, 60], [11, 48]], .7, false, .9, '#fff0b8');
    // manta escocesa verde colgando por el costado
    const bl = [[66, 43], [100, 43], [98, 64], [92, 61], [86, 66], [80, 62], [72, 65], [68, 58]];
    wv(g, bl, K.racing, { poly: true, l: [.2, 0], sh: .5, gran: false, ink: .6 });
    for (let k = 0; k < 5; k++) { line(g, 69 + k * 7, 44, 68 + k * 7, 63, .9, .7, '#c9a24a'); line(g, 72 + k * 7, 44, 71 + k * 7, 63, .6, .5, K.burg); }
    for (let k = 0; k < 3; k++) line(g, 67, 48 + k * 6, 99, 48 + k * 6, .8, .6, K.burg);
    // patines dorados con voluta al frente y sus soportes
    for (const [x1, x2] of [[34, 32], [66, 66], [98, 102]]) { brush(g, x1, 72, x2, 85, 2, '#b8862f', 1); brush(g, x1 - .6, 72, x2 - .6, 85, .6, '#fff0b8', .8); }
    g.save(); g.lineCap = 'round';
    g.strokeStyle = '#b8862f'; g.lineWidth = 3; g.beginPath(); g.moveTo(126, 84); g.lineTo(16, 86); g.bezierCurveTo(2, 86, -2, 74, 6, 70); g.bezierCurveTo(12, 67, 14, 74, 9, 75); g.stroke();
    g.strokeStyle = '#fff0b8'; g.lineWidth = .9; g.beginPath(); g.moveTo(120, 83); g.lineTo(18, 84.6); g.stroke();
    g.restore();
    grain(g, W, H, .28);
    return c;
  };
  // Santa clásico, sentado en el trineo (se corta en el borde de la caja), saludando: dos cuadros
  A.santa = (frame) => {
    A.seed(415); const W = 60, H = 70, [c, g] = cvHi(W, H);
    const red = '#b01e2a', fur = '#f7f3ec', furS = '#a9b6d6';
    g.save(); g.beginPath(); g.rect(-5, -5, W + 10, 55.5 + 5); g.clip();
    // brazo de las riendas (adelante, a la izquierda)
    wv(g, [[18, 34], [10, 38], [6, 42], [8, 45], [14, 43], [22, 40]], red, { l: [.3, 0], sh: .55, gran: false, ink: .55 });
    brush(g, 7, 41, 9, 45, 3, fur, 1); dab(g, 5, 43.6, 2.6, 2.4, '#1f1a1a', 1);
    ink(g, [[5, 44], [0, 47]], .8, false, .8, '#3b2a20');
    // abrigo, con volumen
    wv(g, [[12, 58], [12, 44], [16, 34], [24, 30], [36, 30], [44, 35], [47, 46], [47, 58]], red, { l: [.3, .1], sh: .62, hi: .45, r: .9, ink: .6 });
    // ribete de piel con sombra azulada
    brush(g, 27, 31, 26.5, 56, 4.4, fur, 1); brush(g, 28.6, 33, 28.2, 56, 1.4, furS, .6);
    brush(g, 12, 47.6, 47, 47.6, 3.8, '#201a1a', 1); brush(g, 14, 46.4, 40, 46.4, .7, '#5a5050', .7);
    wv(g, [[24, 45], [30, 45], [30, 50.6], [24, 50.6]], '#d9a93e', { poly: true, gran: false, ink: .5, sh: .4 }); dab(g, 27, 47.8, 1.4, 1, '#3a2a10', 1);
    // brazo que saluda (cuadro 0 arriba, cuadro 1 de lado)
    const hand = frame ? [50, 20] : [44, 13];
    wv(g, [[37, 32], [42, 34], [hand[0] + 2.6, hand[1] + 4], [hand[0] - 2.6, hand[1] + 2]], red, { l: [.3, 0], sh: .5, gran: false, ink: .55, poly: true });
    brush(g, hand[0] - 2.6, hand[1] + 3, hand[0] + 2.6, hand[1] + 4.6, 3, fur, 1);
    wv(g, [[hand[0] - 2.4, hand[1] + 2], [hand[0] - 2.8, hand[1] - 2], [hand[0], hand[1] - 3.6], [hand[0] + 2.6, hand[1] - 1.4], [hand[0] + 2.4, hand[1] + 2.6]], '#2a2222', { gran: false, edge: false, sh: .3 });
    // cara: mejillas chapeadas y nariz redonda
    wv(g, [[19, 21], [21, 15], [27, 13], [32, 16], [33, 22], [29, 27], [22, 27]], '#f1c9a8', { l: [.3, .1], sh: .35, gran: false, ink: .45 });
    dab(g, 21.5, 22, 2.4, 1.8, '#e07a6a', .6); dab(g, 30, 22, 2, 1.6, '#e07a6a', .45);
    dab(g, 19.6, 20.4, 2, 1.7, '#e08a78', 1); dab(g, 19, 19.8, .6, .5, '#ffffff', .8);
    ink(g, [[22, 18.2], [23.4, 17.4], [24.6, 18.2]], .55, false, .9);
    // barba blanca abundante, ondeando hacia atrás con el viento
    const bw = frame ? 1.5 : 0;
    wv(g, [[19, 23], [17, 30], [20, 38], [26, 43], [33 + bw, 41], [39 + bw, 35], [41 + bw, 28], [35, 25], [30, 27]], fur, { l: [.3, .1], sh: .42, hi: .2, light: '255,250,240', gran: false, ink: .4 });
    for (let k = 0; k < 9; k++) ink(g, [[21 + k * 2, 26 + rnd() * 3], [22 + k * 2.2, 33 + rnd() * 5]], .35, false, .4, '#8a96b8');
    dab(g, 21, 24, 3.4, 1.6, fur, 1, -.2); dab(g, 26, 24.2, 3.4, 1.6, fur, 1, .2); ink(g, [[18, 24.6], [21, 23.4], [24, 24.6], [27, 23.4], [30, 24.8]], .4, false, .5, '#8a96b8');
    brush(g, 21, 16.4, 25, 16, 1.6, fur, 1);
    // gorro rojo con ribete de piel y pompón que vuela hacia atrás
    const pom = frame ? [53, 15] : [52, 18];
    wv(g, [[18, 16], [20, 9], [28, 6], [38, 8], [46, 11], [pom[0] - 1, pom[1] - 1], [44, 15], [34, 14]], red, { l: [.25, 0], sh: .55, gran: false, ink: .55 });
    brush(g, 17.6, 15.6, 34, 14.6, 4.6, fur, 1); brush(g, 19, 17, 33, 16.4, 1.4, furS, .55);
    dab(g, pom[0], pom[1], 3.6, 3.4, fur, 1); dab(g, pom[0] + 1, pom[1] + 1, 2, 1.8, furS, .5);
    g.restore();
    grain(g, W, H, .26);
    return c;
  };
  // estela de chispas doradas con polvo de nieve
  A.sparkTrail = () => { A.seed(417); const [c, g] = cv(80, 50); for (let i = 0; i < 22; i++) { const t = i / 22; glow(g, 4 + t * 70, 40 - t * 26 + (rnd() - .5) * 10, 6 - t * 4, '255,214,140', .7 - t * .45); if (rnd() < .5) dab(g, 4 + t * 70 + (rnd() - .5) * 6, 40 - t * 26 + (rnd() - .5) * 12, 1, 1, '#ffffff', .8 - t * .5); } return c; };
})();
