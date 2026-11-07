/* =========================================================
   dibujo.js — las piezas con las que se pinta la villa.

   Todo es SVG en texto: casas vistas desde arriba (a vuelo
   de pájaro, como los planos de ciudad del siglo XVIII),
   pinos, duendes, renos, el trineo y los adornos. Las
   sombras van con trama de grabado (#hatch) y la luz entra
   siempre por la izquierda.
   ========================================================= */
(function () {
  'use strict';
  const P = window.POSADA = window.POSADA || {};

  const f = n => Math.round(n * 10) / 10;
  const pts = a => a.map(p => f(p[0]) + ',' + f(p[1])).join(' ');
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const rngFrom = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  P.f = f; P.pts = pts; P.lerp = lerp; P.rngFrom = rngFrom;

  const INK = '#2b2018';
  const SH = 'rgba(62,82,118,.2)';
  P.INK = INK; P.SH = SH;

  /* ---------- Degradados, tramas y piezas repetidas ---------- */
  function pineG(id, tiers, w0, hTot, green) {
    let s = `<g id="${id}">`;
    s += `<ellipse cx="${f(w0 * .55)}" cy="1.2" rx="${f(w0 * 1.05)}" ry="${f(w0 * .24)}" fill="${SH}"/>`;
    s += `<rect x="-2.6" y="-9" width="5.2" height="10" fill="#4a3424" stroke="${INK}" stroke-width=".7"/>`;
    const th = hTot / (tiers + .7);
    for (let i = 0; i < tiers; i++) {
      const w = w0 * (1 - i / (tiers + .5));
      const yb = -7 - i * th * .9, ya = yb - th * 1.55, sag = th * .14;
      const Lp = u => [-w * u, ya + (yb - ya) * u], Rp = u => [w * u, ya + (yb - ya) * u];
      s += `<path d="M${f(-w)},${f(yb)} L0,${f(ya)} L${f(w)},${f(yb)} Q${f(w * .5)},${f(yb + sag)} 0,${f(yb - sag * .2)} Q${f(-w * .5)},${f(yb + sag)} ${f(-w)},${f(yb)} Z" fill="${green}" stroke="${INK}" stroke-width=".8" stroke-linejoin="round"/>`;
      s += `<path d="M0,${f(ya)} L${f(w)},${f(yb)} Q${f(w * .5)},${f(yb + sag)} 0,${f(yb - sag * .2)} Z" fill="url(#hatch)"/>`;
      const a = Lp(.86), b = Rp(.42), m1 = lerp(a, b, .33), m2 = lerp(a, b, .66);
      s += `<path d="M0,${f(ya + .4)} L${f(a[0])},${f(a[1])} Q${f(m1[0] - 2)},${f(m1[1] + th * .2)} ${f(m1[0])},${f(m1[1])} Q${f(m2[0] - 1)},${f(m2[1] + th * .18)} ${f(m2[0])},${f(m2[1])} Q${f(b[0] - 1)},${f(b[1] + th * .12)} ${f(b[0])},${f(b[1])} Z" fill="url(#gSnow)" stroke="${INK}" stroke-width=".45" stroke-linejoin="round"/>`;
      s += `<path d="M${f(-w * .96)},${f(yb - .6)} Q${f(-w * .8)},${f(yb + 1.6)} ${f(-w * .62)},${f(yb + .2)}" fill="none" stroke="#f7f5ef" stroke-width="1.6" stroke-linecap="round"/>`;
    }
    return s + '</g>';
  }

  P.DEFS = `
  <linearGradient id="gSnow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fdfcf8"/><stop offset="1" stop-color="#dde3e8"/></linearGradient>
  <radialGradient id="gWin" cx=".5" cy=".6" r=".65"><stop offset="0" stop-color="#fff3bf"/><stop offset=".55" stop-color="#ffc95e"/><stop offset="1" stop-color="#c47526"/></radialGradient>
  <radialGradient id="gGlow"><stop offset="0" stop-color="#ffcf72" stop-opacity=".62"/><stop offset=".45" stop-color="#ffcf72" stop-opacity=".22"/><stop offset="1" stop-color="#ffcf72" stop-opacity="0"/></radialGradient>
  <linearGradient id="gCoatG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#62845a"/><stop offset="1" stop-color="#2c482e"/></linearGradient>
  <linearGradient id="gCoatR" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#bf4a33"/><stop offset="1" stop-color="#76211a"/></linearGradient>
  <linearGradient id="gCoatB" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5a7597"/><stop offset="1" stop-color="#2b3f5c"/></linearGradient>
  <linearGradient id="gGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a6a2a"/><stop offset=".45" stop-color="#ead08a"/><stop offset="1" stop-color="#9a7832"/></linearGradient>
  <linearGradient id="gIce" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="#dbe6ee"/><stop offset=".5" stop-color="#a7bdcf"/><stop offset="1" stop-color="#c6d5e1"/></linearGradient>
  <linearGradient id="gDeer" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8d6544"/><stop offset="1" stop-color="#583c27"/></linearGradient>
  <linearGradient id="gRed" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c24a34"/><stop offset="1" stop-color="#7a231a"/></linearGradient>
  <linearGradient id="gWood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7a5235"/><stop offset="1" stop-color="#553620"/></linearGradient>
  <pattern id="hatch" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(38)"><line x1="0" y1="0" x2="0" y2="3" stroke="${INK}" stroke-width=".7" stroke-opacity=".36"/></pattern>
  <pattern id="hatch2" width="3.4" height="3.4" patternUnits="userSpaceOnUse" patternTransform="rotate(-42)"><line x1="0" y1="0" x2="0" y2="3.4" stroke="${INK}" stroke-width=".6" stroke-opacity=".24"/></pattern>
  <pattern id="hatchS" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(38)"><line x1="0" y1="0" x2="0" y2="4" stroke="#4a6488" stroke-width=".8" stroke-opacity=".26"/></pattern>
  <pattern id="planks" width="9" height="5" patternUnits="userSpaceOnUse"><path d="M0,4.6 H9 M3,0 V4.6" stroke="${INK}" stroke-width=".5" stroke-opacity=".38" fill="none"/></pattern>
  <pattern id="vplanks" width="5" height="9" patternUnits="userSpaceOnUse"><path d="M4.6,0 V9" stroke="${INK}" stroke-width=".55" stroke-opacity=".4" fill="none"/></pattern>
  <pattern id="stones" width="12" height="8" patternUnits="userSpaceOnUse"><path d="M0,3.8 H12 M0,7.8 H12 M4,0 V3.8 M10,3.8 V7.8" stroke="${INK}" stroke-width=".55" stroke-opacity=".42" fill="none"/></pattern>
  <pattern id="shingle" width="6" height="4" patternUnits="userSpaceOnUse"><path d="M0,3.6 Q1.5,2.3 3,3.6 Q4.5,2.3 6,3.6" stroke="${INK}" stroke-width=".5" stroke-opacity=".34" fill="none"/></pattern>
  <pattern id="cobble" width="10" height="7" patternUnits="userSpaceOnUse"><ellipse cx="2.5" cy="2" rx="2.1" ry="1.3" fill="none" stroke="${INK}" stroke-opacity=".22" stroke-width=".5"/><ellipse cx="7.5" cy="5.5" rx="2.1" ry="1.3" fill="none" stroke="${INK}" stroke-opacity=".22" stroke-width=".5"/></pattern>
  ${pineG('pine', 4, 24, 80, '#2f4a38')}
  ${pineG('pine2', 5, 19, 92, '#263d30')}
  ${pineG('pine3', 3, 22, 58, '#35523d')}
  <g id="rock"><ellipse cx="4" cy="1" rx="11" ry="3" fill="${SH}"/><path d="M-9,0 C-10,-5 -5,-9 0,-9 C6,-9 10,-5 9,0 Z" fill="#8d8a84" stroke="${INK}" stroke-width=".7"/><path d="M0,-9 C6,-9 10,-5 9,0 L3,0 C5,-4 4,-7 0,-9Z" fill="url(#hatch)"/><path d="M-8,-4 C-6,-9 4,-11 8,-5 C4,-6 -2,-7 -8,-4Z" fill="#f7f5ef" stroke="${INK}" stroke-width=".45"/></g>
  <g id="bush"><ellipse cx="3" cy="1" rx="10" ry="2.6" fill="${SH}"/><path d="M-8,0 C-10,-5 -6,-8 -2,-7 C0,-10 6,-9 7,-5 C10,-4 10,0 8,0Z" fill="#3e5a40" stroke="${INK}" stroke-width=".7"/><path d="M-7,-3 C-6,-6 -3,-7 -1,-6 C1,-9 5,-8 6,-5 C2,-6 -2,-4 -7,-3Z" fill="#f7f5ef"/></g>
  `;

  /* ---------- Utilidades ---------- */
  function snowPlane(P0, P1, Q0, Q1, t, seed) {
    // Nieve sobre un faldón de techo: de la cumbrera (P0→P1) hacia el alero (Q0→Q1).
    const rng = rngFrom(seed || 7), M0 = lerp(P0, Q0, t), M1 = lerp(P1, Q1, t);
    let d = `M${f(P0[0])},${f(P0[1])} L${f(P1[0])},${f(P1[1])} L${f(M1[0])},${f(M1[1])} `;
    const n = 4;
    for (let i = 1; i <= n; i++) {
      const a = lerp(M1, M0, (i - .5) / n), b = lerp(M1, M0, i / n);
      const bulge = lerp(lerp(P1, Q1, t + .08 + rng() * .07), lerp(P0, Q0, t + .08 + rng() * .07), (i - .5) / n);
      d += `Q${f(bulge[0])},${f(bulge[1])} ${f(b[0])},${f(b[1])} `;
      void a;
    }
    return d + 'Z';
  }

  P.ribbon = (x, y, text, s = 1) => {
    const w = text.length * 5.3 + 22, h = 14;
    return `<g class="ribbon" transform="translate(${f(x)},${f(y)}) scale(${s})">
      <path d="M${f(-w / 2 - 9)},${-h / 2 + 3} h11 v${h} h-11 l4,${-h / 2} Z" fill="#d9c9a4" stroke="${INK}" stroke-width=".7" stroke-linejoin="round"/>
      <path d="M${f(w / 2 + 9)},${-h / 2 + 3} h-11 v${h} h11 l-4,${-h / 2} Z" fill="#d9c9a4" stroke="${INK}" stroke-width=".7" stroke-linejoin="round"/>
      <path d="M${f(-w / 2)},${-h / 2} Q0,${-h / 2 - 3} ${f(w / 2)},${-h / 2} V${h / 2} Q0,${h / 2 - 3} ${f(-w / 2)},${h / 2} Z" fill="#f1e7cd" stroke="${INK}" stroke-width=".8"/>
      <text x="0" y="3.4" text-anchor="middle" font-family="IM Fell English SC, Georgia, serif" font-size="10" letter-spacing=".6" fill="#7e271d">${text}</text>
    </g>`;
  };

  P.road = d => `<path d="${d}" fill="none" stroke="#c8bba3" stroke-width="30" stroke-linecap="round"/>
    <path d="${d}" fill="none" stroke="#ece5d6" stroke-width="26.5" stroke-linecap="round"/>
    <path d="${d}" fill="none" stroke="#d3c8b3" stroke-width="10" stroke-linecap="round"/>
    <path d="${d}" fill="none" stroke="#ece5d6" stroke-width="7.4" stroke-linecap="round"/>
    <path d="${d}" fill="none" stroke="#cdbfa6" stroke-width="2.2" stroke-dasharray="1.4 5" stroke-linecap="round" opacity=".7"/>`;

  P.drifts = (seed, n, box) => {
    // Curvas de ventisca: el "relieve" de la nieve, a la manera de un grabado.
    const rng = rngFrom(seed);
    let s = '';
    for (let i = 0; i < n; i++) {
      const x = box[0] + rng() * (box[2] - box[0]), y = box[1] + rng() * (box[3] - box[1]), w = 14 + rng() * 26;
      s += `<path d="M${f(x)},${f(y)} q${f(w / 2)},${f(-3 - rng() * 3)} ${f(w)},0" fill="none" stroke="#9fb0c3" stroke-width=".8" stroke-opacity=".5" stroke-linecap="round"/>`;
    }
    return s;
  };

  P.tree = (x, y, s = 1, v = 'pine') => `<use href="#${v}" transform="translate(${f(x)},${f(y)}) scale(${f(s * 100) / 100})"/>`;

  /* ---------- Casa vista a vuelo de pájaro ---------- */
  // x,y: esquina inferior izquierda de la fachada · w,h: fachada · gh: altura del frontón
  // D: fondo del techo (hacia arriba en pantalla) · dx: corrimiento a la derecha del fondo
  P.house = o => {
    const { x, y, w, h, gh, D } = o, dx = o.dx != null ? o.dx : D * .28;
    const L = x, R = x + w, T = y - h, A = [x + w / 2, T - gh];
    const back = p => [p[0] + dx, p[1] - D];
    const roofL = o.roof ? o.roof[0] : '#a63a2b', roofR = o.roof ? o.roof[1] : '#6f2119';
    const wall = o.wall || '#e7d9bc', wallD = o.wallD || '#b9a888';
    let s = `<g class="house">`;
    // sombra arrojada (luz desde la izquierda)
    const S = h * .9;
    s += `<polygon points="${pts([[R, y], [R + dx, y - D], [R + dx + S, y - D + S * .3], [R + S * .9, y + S * .28]])}" fill="${SH}"/>`;
    // muro lateral
    s += `<polygon points="${pts([[R, y], [R, T], back([R, T]), back([R, y])])}" fill="${wallD}" stroke="${INK}" stroke-width=".8" stroke-linejoin="round"/>`;
    s += `<polygon points="${pts([[R, y], [R, T], back([R, T]), back([R, y])])}" fill="url(#hatch)"/>`;
    if (o.tex) s += `<polygon points="${pts([[R, y], [R, T], back([R, T]), back([R, y])])}" fill="url(#${o.tex})" opacity=".8"/>`;
    // techo: faldón derecho (sombra) y luego el izquierdo (luz)
    const pR = [A, [R, T], back([R, T]), back(A)], pL = [[L, T], A, back(A), back([L, T])];
    s += `<polygon points="${pts(pR)}" fill="${roofR}" stroke="${INK}" stroke-width=".8" stroke-linejoin="round"/>`;
    s += `<polygon points="${pts(pR)}" fill="url(#shingle)"/><polygon points="${pts(pR)}" fill="url(#hatch)" opacity=".7"/>`;
    s += `<polygon points="${pts(pL)}" fill="${roofL}" stroke="${INK}" stroke-width=".8" stroke-linejoin="round"/>`;
    s += `<polygon points="${pts(pL)}" fill="url(#shingle)"/>`;
    // nieve en el techo
    s += `<path d="${snowPlane(back(A), A, back([L, T]), [L, T], .78, x + 3)}" fill="url(#gSnow)" stroke="${INK}" stroke-width=".55" stroke-linejoin="round"/>`;
    s += `<path d="${snowPlane(A, back(A), [R, T], back([R, T]), .7, x + 9)}" fill="#dfe5ea" stroke="${INK}" stroke-width=".55" stroke-linejoin="round"/>`;
    s += `<path d="${snowPlane(A, back(A), [R, T], back([R, T]), .7, x + 9)}" fill="url(#hatchS)"/>`;
    // chimeneas (sobre el faldón izquierdo)
    (o.chimneys || []).forEach((c, i) => {
      const base = lerp(lerp([L, T], A, .55 + (c.side || 0)), lerp(back([L, T]), back(A), .55 + (c.side || 0)), c.t);
      const cw = c.w || 9, ch = c.h || 16, cx = base[0], cy = base[1];
      s += `<polygon points="${pts([[cx + cw, cy], [cx + cw, cy - ch], [cx + cw + 3, cy - ch - 4], [cx + cw + 3, cy - 4]])}" fill="#5e3a2a" stroke="${INK}" stroke-width=".7"/>`;
      s += `<rect x="${f(cx)}" y="${f(cy - ch)}" width="${cw}" height="${ch}" fill="#8a4a35" stroke="${INK}" stroke-width=".7"/>`;
      s += `<rect x="${f(cx)}" y="${f(cy - ch)}" width="${cw}" height="${ch}" fill="url(#stones)" opacity=".7"/>`;
      s += `<polygon points="${pts([[cx - 1, cy - ch], [cx + cw + 1, cy - ch], [cx + cw + 4, cy - ch - 4], [cx + 2, cy - ch - 4]])}" fill="#f6f4ee" stroke="${INK}" stroke-width=".6"/>`;
      s += P.smoke(cx + cw / 2 + 1.5, cy - ch - 4, i * 1.3 + x * .01);
    });
    // fachada
    s += `<rect x="${f(L)}" y="${f(T)}" width="${f(w)}" height="${f(h)}" fill="${wall}" stroke="${INK}" stroke-width=".9"/>`;
    s += `<polygon points="${pts([[L, T], A, [R, T]])}" fill="${wall}" stroke="${INK}" stroke-width=".9" stroke-linejoin="round"/>`;
    if (o.tex) s += `<rect x="${f(L)}" y="${f(T)}" width="${f(w)}" height="${f(h)}" fill="url(#${o.tex})"/><polygon points="${pts([[L, T], A, [R, T]])}" fill="url(#${o.tex})"/>`;
    if (o.timber) {
      const bc = '#4b3424';
      s += `<g stroke="${bc}" stroke-width="2.6" stroke-linecap="square" fill="none">
        <path d="M${f(L + 1.3)},${f(y)} V${f(T)} M${f(R - 1.3)},${f(y)} V${f(T)} M${f(L)},${f(T + 1.3)} H${f(R)} M${f(L)},${f(T + h * .5)} H${f(R)} M${f(A[0])},${f(A[1] + 3)} V${f(T)}"/>
        <path d="M${f(L + 2)},${f(T + h * .5)} L${f(L + w * .14)},${f(T + 2)} M${f(R - 2)},${f(T + h * .5)} L${f(R - w * .14)},${f(T + 2)} M${f(A[0] - gh * .5)},${f(T)} L${f(A[0])},${f(T - gh * .55)} L${f(A[0] + gh * .5)},${f(T)}"/>
      </g>`;
    }
    // sombra del alero sobre la fachada
    s += `<polygon points="${pts([[L, T], [R, T], [R, T + 5], [L, T + 5]])}" fill="url(#hatch)" opacity=".8"/>`;
    // ventanas
    (o.windows || []).forEach(wi => {
      const wx = L + wi[0], wy = T + wi[1], ww = wi[2], wh = wi[3];
      s += `<ellipse class="glow" cx="${f(wx + ww / 2)}" cy="${f(wy + wh / 2)}" rx="${f(ww * 1.5)}" ry="${f(wh * 1.3)}" fill="url(#gGlow)"/>`;
      s += `<rect x="${f(wx)}" y="${f(wy)}" width="${ww}" height="${wh}" fill="url(#gWin)" stroke="${INK}" stroke-width=".8"/>`;
      s += `<path d="M${f(wx + ww / 2)},${f(wy)} V${f(wy + wh)} M${f(wx)},${f(wy + wh * .45)} H${f(wx + ww)}" stroke="#5a3a24" stroke-width="1.1"/>`;
      s += `<path d="M${f(wx - 1.5)},${f(wy + wh + .8)} H${f(wx + ww + 1.5)}" stroke="#f7f5ef" stroke-width="2.4" stroke-linecap="round"/>`;
      if (wi[4]) s += `<path d="M${f(wx - 3.5)},${f(wy - 1)} V${f(wy + wh + 1)} M${f(wx + ww + 3.5)},${f(wy - 1)} V${f(wy + wh + 1)}" stroke="${wi[4]}" stroke-width="4"/>`;
    });
    if (o.round) {
      const [rx, ry, rr] = [A[0], T - gh * .38, o.round];
      s += `<circle class="glow" cx="${f(rx)}" cy="${f(ry)}" r="${f(rr * 2.2)}" fill="url(#gGlow)"/><circle cx="${f(rx)}" cy="${f(ry)}" r="${rr}" fill="url(#gWin)" stroke="${INK}" stroke-width=".8"/><path d="M${f(rx - rr)},${f(ry)} H${f(rx + rr)} M${f(rx)},${f(ry - rr)} V${f(ry + rr)}" stroke="#5a3a24" stroke-width="1"/>`;
    }
    // puerta
    if (o.door) {
      const d = o.door, dxp = L + d.x, dw = d.w, dh = d.h;
      if (d.open) {
        s += `<ellipse class="glow" cx="${f(dxp + dw / 2)}" cy="${f(y - dh * .4)}" rx="${f(dw)}" ry="${f(dh * .8)}" fill="url(#gGlow)"/>`;
        s += `<path d="M${f(dxp)},${f(y)} V${f(y - dh + dw * .3)} Q${f(dxp + dw / 2)},${f(y - dh - dw * .15)} ${f(dxp + dw)},${f(y - dh + dw * .3)} V${f(y)} Z" fill="url(#gWin)" stroke="${INK}" stroke-width=".9"/>`;
        s += `<path d="M${f(dxp)},${f(y)} V${f(y - dh + dw * .3)} L${f(dxp - dw * .22)},${f(y - dh + dw * .45)} V${f(y + 2)} Z M${f(dxp + dw)},${f(y)} V${f(y - dh + dw * .3)} L${f(dxp + dw * 1.22)},${f(y - dh + dw * .45)} V${f(y + 2)} Z" fill="${d.color || '#3f5b3c'}" stroke="${INK}" stroke-width=".8"/>`;
      } else {
        s += `<path d="M${f(dxp)},${f(y)} V${f(y - dh + dw * .35)} Q${f(dxp + dw / 2)},${f(y - dh - dw * .1)} ${f(dxp + dw)},${f(y - dh + dw * .35)} V${f(y)} Z" fill="${d.color || '#3f5b3c'}" stroke="${INK}" stroke-width=".9"/>`;
        s += `<path d="M${f(dxp)},${f(y)} V${f(y - dh + dw * .35)} Q${f(dxp + dw / 2)},${f(y - dh - dw * .1)} ${f(dxp + dw)},${f(y - dh + dw * .35)} V${f(y)} Z" fill="url(#vplanks)"/>`;
        s += `<circle cx="${f(dxp + dw * .78)}" cy="${f(y - dh * .42)}" r="1" fill="url(#gGold)"/>`;
        if (d.wreath) s += `<circle cx="${f(dxp + dw / 2)}" cy="${f(y - dh * .66)}" r="${f(dw * .22)}" fill="none" stroke="#2f5034" stroke-width="2.4"/><path d="M${f(dxp + dw / 2 - 2)},${f(y - dh * .66 + dw * .2)} l2,-1.6 l2,1.6" stroke="#b23a2a" stroke-width="1.4" fill="none"/>`;
      }
    }
    if (o.sign) {
      const [sx, sy, sw, text] = o.sign;
      s += `<rect x="${f(L + sx)}" y="${f(T + sy)}" width="${sw}" height="11" fill="#efe4c6" stroke="${INK}" stroke-width=".8"/><text x="${f(L + sx + sw / 2)}" y="${f(T + sy + 8.2)}" text-anchor="middle" font-family="IM Fell English SC, Georgia, serif" font-size="8" letter-spacing=".5" fill="#7e271d">${text}</text>`;
    }
    // nieve del frontón y montículos al pie del muro
    s += `<path d="M${f(L - 2)},${f(T + 1)} L${f(A[0])},${f(A[1] - 1.5)} L${f(R + 2)},${f(T + 1)}" fill="none" stroke="#f7f5ef" stroke-width="3.4" stroke-linejoin="round" stroke-linecap="round"/>`;
    s += `<path d="M${f(L - 2)},${f(T + 2.6)} L${f(A[0])},${f(A[1] + 1.2)} L${f(R + 2)},${f(T + 2.6)}" fill="none" stroke="${INK}" stroke-width=".6" stroke-linejoin="round"/>`;
    const rng = rngFrom(x * 3 + 1);
    let dr = `M${f(L - 6)},${f(y + 2)} `;
    for (let px = L - 6; px < R + dx * .3 + 4;) { const step = 7 + rng() * 9; dr += `q${f(step / 2)},${f(-3 - rng() * 4)} ${f(step)},0 `; px += step; }
    s += `<path d="${dr}" fill="#f7f5ef" stroke="${INK}" stroke-width=".55"/>`;
    return s + '</g>';
  };

  /* ---------- Humo, faroles y adornos ---------- */
  P.smoke = (x, y, delay = 0) => {
    let s = `<g class="smoke" transform="translate(${f(x)},${f(y)})">`;
    for (let i = 0; i < 4; i++) s += `<circle r="3.4" fill="#e9ebee" stroke="${INK}" stroke-opacity=".25" stroke-width=".5" style="animation-delay:${f(-(delay + i * 1.1))}s"/>`;
    return s + '</g>';
  };

  P.lamp = (x, y, s = 1) => `<g transform="translate(${f(x)},${f(y)}) scale(${s})">
    <ellipse cx="3" cy=".8" rx="6" ry="1.6" fill="${SH}"/>
    <path d="M0,0 V-24" stroke="#2a2420" stroke-width="1.6"/><path d="M-2.5,0 h5" stroke="#2a2420" stroke-width="2"/>
    <circle class="glow" cx="0" cy="-28" r="13" fill="url(#gGlow)"/>
    <path d="M-3.4,-24 h6.8 l-1,-7 h-4.8 z" fill="url(#gWin)" stroke="#2a2420" stroke-width=".9"/>
    <path d="M-4.4,-31 h8.8 l-4.4,-3.6 z" fill="#2a2420"/><path d="M-4,-33 q4,-3.4 8,0" stroke="#f7f5ef" stroke-width="1.4" fill="none"/>
  </g>`;

  P.gift = (x, y, w, h, c, r = '#e2c26c') => `<g><rect x="${f(x)}" y="${f(y - h)}" width="${w}" height="${h}" fill="${c}" stroke="${INK}" stroke-width=".7"/>
    <rect x="${f(x + w * .55)}" y="${f(y - h)}" width="${f(w * .45)}" height="${h}" fill="url(#hatch)"/>
    <path d="M${f(x + w / 2)},${f(y - h)} V${f(y)} M${f(x)},${f(y - h / 2)} H${f(x + w)}" stroke="${r}" stroke-width="1.6"/>
    <path d="M${f(x + w / 2)},${f(y - h)} q-3,-3.2 -3.8,-.4 M${f(x + w / 2)},${f(y - h)} q3,-3.2 3.8,-.4" stroke="${r}" stroke-width="1.1" fill="none"/></g>`;

  P.giftPile = (x, y, seed) => {
    const rng = rngFrom(seed), C = ['#a8362a', '#3f6a45', '#c9a24a', '#3e5878', '#8a2f4a', '#e9e2cf'];
    let s = `<ellipse cx="${f(x + 14)}" cy="${f(y + 2)}" rx="26" ry="5" fill="${SH}"/>`;
    const boxes = [[-14, 0, 13, 11], [0, 1, 15, 12], [14, 0, 11, 10], [-8, -11, 12, 10], [5, -11, 11, 11], [-1, -21, 10, 8]];
    boxes.forEach(b => { s += P.gift(x + b[0], y + b[1], b[2], b[3], C[Math.floor(rng() * C.length)], rng() < .5 ? '#e2c26c' : '#b23a2a'); });
    return s;
  };

  P.fence = (x1, y1, x2, y2, n) => {
    let s = '';
    const posts = [];
    for (let i = 0; i <= n; i++) posts.push(lerp([x1, y1], [x2, y2], i / n));
    s += `<path d="M${f(x1)},${f(y1 - 6)} L${f(x2)},${f(y2 - 6)} M${f(x1)},${f(y1 - 11)} L${f(x2)},${f(y2 - 11)}" stroke="#4a3424" stroke-width="1.8"/>`;
    s += `<path d="M${f(x1)},${f(y1 - 12.2)} L${f(x2)},${f(y2 - 12.2)}" stroke="#f7f5ef" stroke-width="1.3" stroke-linecap="round"/>`;
    posts.forEach(p => { s += `<path d="M${f(p[0])},${f(p[1])} V${f(p[1] - 14)}" stroke="${INK}" stroke-width="3.2" stroke-linecap="round"/><path d="M${f(p[0])},${f(p[1])} V${f(p[1] - 14)}" stroke="#6b4a32" stroke-width="2" stroke-linecap="round"/><circle cx="${f(p[0])}" cy="${f(p[1] - 15)}" r="1.9" fill="#f7f5ef" stroke="${INK}" stroke-width=".4"/>`; });
    return s;
  };

  P.bench = (x, y) => `<g transform="translate(${f(x)},${f(y)})"><ellipse cx="3" cy="1" rx="14" ry="2.4" fill="${SH}"/><path d="M-10,0 v-5 M10,0 v-5 M-11,-5 h22" stroke="#4a3424" stroke-width="2"/><path d="M-11,-6.4 h22" stroke="#f7f5ef" stroke-width="1.6" stroke-linecap="round"/><path d="M-10,-9 h20" stroke="#4a3424" stroke-width="1.6"/></g>`;

  P.sleigh = (x, y) => `<g transform="translate(${f(x)},${f(y)})">
    <ellipse cx="6" cy="2" rx="40" ry="5" fill="${SH}"/>
    <path d="M-34,0 H26 Q36,0 36,-8 Q36,-13 31,-13" fill="none" stroke="${INK}" stroke-width="3.2" stroke-linecap="round"/>
    <path d="M-34,0 H26 Q36,0 36,-8 Q36,-13 31,-13" fill="none" stroke="url(#gGold)" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M-22,0 v-6 M14,0 v-6" stroke="${INK}" stroke-width="2"/>
    <path d="M-32,-6 C-36,-20 -30,-30 -20,-30 L-16,-24 L18,-24 C22,-34 32,-32 30,-22 C28,-12 22,-6 14,-6 Z" fill="url(#gRed)" stroke="${INK}" stroke-width=".9" stroke-linejoin="round"/>
    <path d="M18,-24 C22,-34 32,-32 30,-22 C28,-12 22,-6 14,-6 L4,-6 C14,-10 18,-16 18,-24Z" fill="url(#hatch)"/>
    <path d="M-29,-9 C-32,-19 -28,-26 -21,-26 M-24,-9 Q-6,-12 12,-9" fill="none" stroke="url(#gGold)" stroke-width="1.4"/>
    <circle cx="-26" cy="-17" r="2.4" fill="none" stroke="url(#gGold)" stroke-width="1.2"/>
    <path d="M-17,-24 C-19,-34 -6,-40 4,-36 C12,-38 16,-30 14,-24 Z" fill="#9a7448" stroke="${INK}" stroke-width=".8"/>
    <path d="M-2,-37 C4,-38 12,-34 14,-24 L6,-24 C8,-30 4,-34 -2,-37Z" fill="url(#hatch)"/>
    ${P.gift(-14, -30, 9, 8, '#3f6a45')}${P.gift(2, -33, 8, 8, '#c9a24a', '#b23a2a')}
  </g>`;

  P.star = (x, y, r) => {
    const p = [];
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; p.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); }
    return `<g class="star"><circle class="glow" cx="${f(x)}" cy="${f(y)}" r="${f(r * 3)}" fill="url(#gGlow)"/><polygon points="${pts(p)}" fill="url(#gGold)" stroke="${INK}" stroke-width=".7" stroke-linejoin="round"/></g>`;
  };

  /* ---------- Duende ---------- */
  const LOADS = {
    gift: c => `<rect x="3.6" y="-13.4" width="7.6" height="6.6" fill="${c || '#a8362a'}" stroke="${INK}" stroke-width=".6"/><path d="M7.4,-13.4 V-6.8 M3.6,-10.1 H11.2" stroke="#e2c26c" stroke-width="1.2"/><path d="M7.4,-13.4 q-2,-2.2 -2.6,-.3 M7.4,-13.4 q2,-2.2 2.6,-.3" stroke="#e2c26c" stroke-width=".9" fill="none"/>`,
    sack: () => `<path d="M-2,-17 C-11,-19 -13,-8 -7,-5 C-3,-3.6 0,-8 -1,-12 Z" fill="#a8824f" stroke="${INK}" stroke-width=".6"/><path d="M-6,-16 C-8,-12 -9,-9 -7.6,-6" stroke="${INK}" stroke-opacity=".4" stroke-width=".5" fill="none"/>`,
    letters: () => `<rect x="3.4" y="-12.8" width="7.4" height="5" fill="#f6f1e2" stroke="${INK}" stroke-width=".5" transform="rotate(-8 7 -10)"/><rect x="3.8" y="-15" width="7.4" height="5" fill="#efe6cf" stroke="${INK}" stroke-width=".5" transform="rotate(6 7 -12)"/><path d="M4,-15 L7.6,-12.6 L11,-14.2" stroke="${INK}" stroke-width=".45" fill="none" transform="rotate(6 7 -12)"/>`,
    ornament: () => `<circle cx="7.4" cy="-13.6" r="2.6" fill="url(#gGold)" stroke="${INK}" stroke-width=".5"/><path d="M7.4,-16.2 v-1.4" stroke="${INK}" stroke-width=".7"/>`,
    list: () => `<path d="M3.6,-12.6 h5.4 v13 q0,1.8 -1.8,1.8 h-5" fill="#f3ead6" stroke="${INK}" stroke-width=".5"/><path d="M4.6,-10.4 h3.4 M4.6,-8.4 h3.4 M4.6,-6.4 h3.4 M4.6,-4.4 h3.4 M4.6,-2.4 h3.4" stroke="${INK}" stroke-opacity=".5" stroke-width=".4"/>`,
    hay: () => `<path d="M6.5,-6.6 Q11.5,-12.5 17.5,-6.6 Z" fill="#d9b860" stroke="${INK}" stroke-width=".5"/><path d="M8,-7.4 l1.4,-2.4 M11,-8.6 l.4,-2.6 M14,-8.2 l1.2,-2" stroke="#9c7a2e" stroke-width=".5"/>`,
    cartGifts: () => `${P.gift(8, -7, 5, 5, '#3f6a45')}${P.gift(13, -7, 4.6, 6.4, '#a8362a')}`
  };
  const PROPS = {
    barrow: `<g><path d="M6,-6.6 L18,-6.6 L16,-1.4 L8,-1.4 Z" fill="#7a5638" stroke="${INK}" stroke-width=".6"/><circle cx="16.6" cy="-.6" r="2.3" fill="#3b2a1f" stroke="${INK}" stroke-width=".4"/><path d="M6.4,-6.4 L2.6,-9.6" stroke="#3b2a1f" stroke-width="1.1" stroke-linecap="round"/></g>`,
    cart: `<g><rect x="7" y="-7" width="12" height="5.6" fill="#8a5a3a" stroke="${INK}" stroke-width=".6"/><rect x="7" y="-7" width="12" height="5.6" fill="url(#vplanks)"/><circle cx="9.5" cy="-.8" r="1.6" fill="#2b2018"/><circle cx="16.5" cy="-.8" r="1.6" fill="#2b2018"/><path d="M7,-6 L3,-9.4" stroke="#3b2a1f" stroke-width="1.1" stroke-linecap="round"/></g>`,
    hammer: `<g class="arm"><path d="M3.6,-12 Q6.6,-12.6 7.8,-14.6" stroke="#2c482e" stroke-width="2.1" stroke-linecap="round" fill="none"/><path d="M7.8,-14.6 L10.4,-19" stroke="#6b4a32" stroke-width="1.2"/><rect x="8.4" y="-21.2" width="5" height="2.6" rx=".6" fill="#55504a" stroke="${INK}" stroke-width=".4" transform="rotate(-28 10.9 -19.9)"/></g>`
  };

  P.elf = (o = {}) => {
    const coat = { g: 'url(#gCoatG)', r: 'url(#gCoatR)', b: 'url(#gCoatB)' }[o.coat || 'g'];
    const arm = { g: '#2c482e', r: '#76211a', b: '#2b3f5c' }[o.coat || 'g'];
    const hat = o.hat === 'g' ? '#3d5e3a' : o.hat === 'b' ? '#3a5277' : '#a8362a';
    const holds = !!o.carry || !!o.prop;
    const arms = holds
      ? `<path d="M-3.4,-12.2 Q1.4,-10.4 4.4,-9.6 M3.6,-12.4 Q6.2,-11 5.6,-9" stroke="${arm}" stroke-width="2.1" stroke-linecap="round" fill="none"/>`
      : o.prop === undefined && o.pose === 'skate'
        ? `<path d="M-4,-12 Q-8,-11 -10,-13 M4,-12 Q8,-11 10,-13" stroke="${arm}" stroke-width="2.1" stroke-linecap="round" fill="none"/>`
        : `<path d="M-4.4,-12 Q-6,-9 -5.6,-7 M4.4,-12 Q6,-9 5.6,-7" stroke="${arm}" stroke-width="2.1" stroke-linecap="round" fill="none"/>`;
    const legs = o.pose === 'skate'
      ? `<path class="leg l" d="M-1.6,-6.5 L-4,0" stroke="#3b2a1f" stroke-width="2.3" stroke-linecap="round"/><path class="leg r" d="M1.6,-6.5 L3.2,-.6" stroke="#3b2a1f" stroke-width="2.3" stroke-linecap="round"/><path d="M-6.4,.6 h4.6 M1.2,0 h4.6" stroke="#bfc7cf" stroke-width=".9" stroke-linecap="round"/>`
      : `<path class="leg l" d="M-1.7,-6.5 V0" stroke="#3b2a1f" stroke-width="2.3" stroke-linecap="round"/><path class="leg r" d="M1.7,-6.5 V0" stroke="#3b2a1f" stroke-width="2.3" stroke-linecap="round"/>`;
    const scarf = o.scarf ? `<path d="M-3.8,-13.6 Q0,-12 3.8,-13.6 L3.4,-11.8 Q0,-10.6 -3.4,-11.8 Z M-3,-12 l-2.2,5" fill="${o.scarf}" stroke="${o.scarf}" stroke-width="1.2" stroke-linecap="round"/>` : '';
    const load = o.carry ? `<g class="load">${LOADS[o.carry](o.color)}</g>` : '';
    const prop = o.prop ? PROPS[o.prop] : '';
    return `<g class="elf${o.cls ? ' ' + o.cls : ''}">
      <ellipse cx="1.6" cy=".7" rx="6.4" ry="1.9" fill="${SH}"/>
      <g class="face"><g class="bob">
        ${o.carry === 'sack' ? load : ''}
        ${legs}
        <path d="M-5.2,-5 C-5.4,-10.6 -3.6,-14.2 0,-14.2 C3.6,-14.2 5.4,-10.6 5.2,-5 Q0,-3.4 -5.2,-5 Z" fill="${coat}" stroke="${INK}" stroke-width=".7"/>
        <path d="M-5,-7.7 Q0,-6.3 5,-7.7" stroke="#2b2018" stroke-width="1.3" fill="none"/><rect x="-1.1" y="-8.4" width="2.2" height="1.7" fill="#d8b45a"/>
        <path d="M-4.3,-13 Q0,-11 4.3,-13 Q0,-14.9 -4.3,-13Z" fill="#f2efe6" stroke="${INK}" stroke-width=".4"/>
        ${scarf}
        ${prop}
        ${o.prop === 'hammer' ? '' : arms}
        <circle cx="0" cy="-16.7" r="3.4" fill="#ecc7a6" stroke="${INK}" stroke-width=".6"/>
        <circle cx="2.7" cy="-16.2" r=".95" fill="#d98c76"/><circle cx="1.5" cy="-17.4" r=".45" fill="${INK}"/>
        <path d="M-1.8,-17 l-3,-1.7 l2,3 z" fill="#ecc7a6" stroke="${INK}" stroke-width=".5" stroke-linejoin="round"/>
        <path d="M-3.8,-18.1 C-3.4,-22.2 0,-25.8 5.8,-25.1 C3.1,-23.7 2.5,-21.1 3.9,-18.1 Z" fill="${hat}" stroke="${INK}" stroke-width=".6"/>
        <path d="M-4,-18.3 Q0,-16.6 4.1,-18.3" stroke="#f2efe6" stroke-width="1.9" stroke-linecap="round" fill="none"/>
        <circle cx="5.8" cy="-25.1" r="1.35" fill="#f6f3ea" stroke="${INK}" stroke-width=".4"/>
        ${o.carry && o.carry !== 'sack' ? load : ''}
      </g></g></g>`;
  };

  /* ---------- Reno ---------- */
  P.deer = (o = {}) => `<g class="deer${o.cls ? ' ' + o.cls : ''}">
    <ellipse cx="3" cy=".8" rx="17" ry="3.2" fill="${SH}"/>
    <g class="face"><g class="bob">
      <path class="leg a" d="M-9.5,-11 V0" stroke="#4a3220" stroke-width="2.4" stroke-linecap="round"/>
      <path class="leg b" d="M-5.5,-11 V0" stroke="#3a2618" stroke-width="2.4" stroke-linecap="round"/>
      <path class="leg b" d="M7,-11 V0" stroke="#4a3220" stroke-width="2.4" stroke-linecap="round"/>
      <path class="leg a" d="M11,-11 V0" stroke="#3a2618" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M-13.4,-12 C-14.4,-19 -6,-21 2,-20.2 C9,-20.8 14.4,-18 14.4,-13 C14.4,-9 10,-8 2,-8.6 C-6,-8 -13.4,-8 -13.4,-12 Z" fill="url(#gDeer)" stroke="${INK}" stroke-width=".7"/>
      <path d="M2,-20.2 C9,-20.8 14.4,-18 14.4,-13 C14.4,-9 10,-8 2,-8.6 C8,-11 9,-16 2,-20.2Z" fill="url(#hatch)" opacity=".6"/>
      <path d="M-9,-9.4 Q2,-7.2 11,-9.8" stroke="#d2b791" stroke-width="2" fill="none" opacity=".8"/>
      <path d="M-13.2,-15.4 l-3,-1.4 l1.6,3.2 z" fill="#f2efe6" stroke="${INK}" stroke-width=".4"/>
      <path d="M-11,-19.4 Q0,-21.6 10,-19.6" stroke="#f7f5ef" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".9"/>
      <g class="head">
        <path d="M9,-17 C12,-22 14,-27 16,-29 L20,-27 C18,-23 15,-18 13,-14 Z" fill="url(#gDeer)" stroke="${INK}" stroke-width=".7"/>
        <path d="M15,-30 C17,-33 22,-32.6 25,-29.6 C26.6,-28 26,-26.4 24.5,-26.4 C22,-26.4 19,-26.6 17,-26.8 C15.5,-27 14.5,-28.5 15,-30Z" fill="#7d5a3b" stroke="${INK}" stroke-width=".6"/>
        <circle cx="25.3" cy="-27.6" r="1.1" fill="#2b2018"/><circle cx="20" cy="-29.6" r=".55" fill="${INK}"/>
        <path d="M16.4,-30.6 l-3.8,-1.2 l2.8,2.6z" fill="#7d5a3b" stroke="${INK}" stroke-width=".5"/>
        <path d="M17,-32 C16,-36 14,-39 11,-41 M15.4,-36 l-3.4,-.6 M14,-38.6 l-1,-3 M18.6,-32.2 C19.6,-36 21,-38.5 23.6,-40.5 M20.2,-36.3 l3,-.8 M21.6,-38.6 l.6,-3" stroke="${INK}" stroke-width="2.2" stroke-linecap="round" fill="none"/>
        <path d="M17,-32 C16,-36 14,-39 11,-41 M15.4,-36 l-3.4,-.6 M14,-38.6 l-1,-3 M18.6,-32.2 C19.6,-36 21,-38.5 23.6,-40.5 M20.2,-36.3 l3,-.8 M21.6,-38.6 l.6,-3" stroke="#dcc7a0" stroke-width="1.2" stroke-linecap="round" fill="none"/>
        <path d="M11.4,-19.2 Q14,-17 16.6,-19.6" stroke="#8f2a20" stroke-width="1.9" fill="none"/><circle cx="14" cy="-17.4" r="1.25" fill="url(#gGold)" stroke="${INK}" stroke-width=".4"/>
      </g>
    </g></g></g>`;

  P.envelope = () => `<g class="letter"><g class="flap"><rect x="-4" y="-2.7" width="8" height="5.4" fill="#f6f1e2" stroke="${INK}" stroke-width=".5"/><path d="M-4,-2.7 L0,.4 L4,-2.7" stroke="${INK}" stroke-width=".45" fill="none"/><circle cx="0" cy=".2" r=".9" fill="#a8362a"/></g></g>`;
})();
