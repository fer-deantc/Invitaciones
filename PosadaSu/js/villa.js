/* =========================================================
   villa.js — el plano de la Villa de Santa Claus.

   La página es un recorrido: un camino baja desde la casa
   de Santa y pasa por cada lugar de la villa. Cada lugar
   es una escena (un SVG de 400×300) que vive en un hueco
   (.slot) entre las tarjetas; el fondo dibuja el camino
   que las une, el bosque y la nieve. Los duendes se mueven
   con requestAnimationFrame, solo en las escenas visibles.
   ========================================================= */
(function () {
  'use strict';
  const P = window.POSADA;
  const { f, pts, lerp, rngFrom, INK, SH } = P;
  const NS = 'http://www.w3.org/2000/svg';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Pino grande con adornos (plaza) ---------- */
  function bigPine(x, y, s) {
    const tiers = 5, w0 = 27 * s, hTot = 86 * s, th = hTot / (tiers + .7);
    let out = `<g class="bigpine"><ellipse cx="${f(x + w0 * .7)}" cy="${f(y + 2)}" rx="${f(w0 * 1.25)}" ry="${f(w0 * .25)}" fill="${SH}"/>`;
    out += `<rect x="${f(x - 3 * s)}" y="${f(y - 9 * s)}" width="${f(6 * s)}" height="${f(10 * s)}" fill="#4a3424" stroke="${INK}" stroke-width=".8"/>`;
    let deco = '', lights = '', apex = 0;
    const colors = ['#a8362a', '#c9a24a', '#3e5878', '#a8362a', '#e9e2cf'];
    for (let i = 0; i < tiers; i++) {
      const w = w0 * (1 - i / (tiers + .5));
      const yb = y - 7 * s - i * th * .9, ya = yb - th * 1.55, sag = th * .14;
      apex = ya;
      out += `<path d="M${f(x - w)},${f(yb)} L${f(x)},${f(ya)} L${f(x + w)},${f(yb)} Q${f(x + w * .5)},${f(yb + sag)} ${f(x)},${f(yb - sag * .2)} Q${f(x - w * .5)},${f(yb + sag)} ${f(x - w)},${f(yb)} Z" fill="#2c4636" stroke="${INK}" stroke-width=".9" stroke-linejoin="round"/>`;
      out += `<path d="M${f(x)},${f(ya)} L${f(x + w)},${f(yb)} Q${f(x + w * .5)},${f(yb + sag)} ${f(x)},${f(yb - sag * .2)} Z" fill="url(#hatch)"/>`;
      const a = [x - w * .86, ya + (yb - ya) * .86], b = [x + w * .42, ya + (yb - ya) * .42], m1 = lerp(a, b, .33), m2 = lerp(a, b, .66);
      out += `<path d="M${f(x)},${f(ya + .5)} L${f(a[0])},${f(a[1])} Q${f(m1[0] - 2)},${f(m1[1] + th * .2)} ${f(m1[0])},${f(m1[1])} Q${f(m2[0] - 1)},${f(m2[1] + th * .18)} ${f(m2[0])},${f(m2[1])} Q${f(b[0] - 1)},${f(b[1] + th * .12)} ${f(b[0])},${f(b[1])} Z" fill="url(#gSnow)" stroke="${INK}" stroke-width=".5"/>`;
      // guirnalda dorada
      const gl = [x - w * .78, yb - th * .32], gr = [x + w * .78, yb - th * .32];
      deco += `<path d="M${f(gl[0])},${f(gl[1])} Q${f(x)},${f(yb + th * .28)} ${f(gr[0])},${f(gr[1])}" fill="none" stroke="#7d5f22" stroke-width="2.2"/><path d="M${f(gl[0])},${f(gl[1])} Q${f(x)},${f(yb + th * .28)} ${f(gr[0])},${f(gr[1])}" fill="none" stroke="url(#gGold)" stroke-width="1.3"/>`;
      // esferas
      const nb = 3 + (i < 2 ? 1 : 0);
      for (let j = 0; j < nb; j++) {
        const u = (j + .5) / nb, bx = x - w * .92 + w * 1.84 * u, by = yb - 1 + Math.sin(u * Math.PI) * 2;
        deco += `<path d="M${f(bx)},${f(by - 4)} v2" stroke="${INK}" stroke-width=".6"/><circle cx="${f(bx)}" cy="${f(by)}" r="${f(2.4 * s * .5 + 1.4)}" fill="${colors[(i + j) % colors.length]}" stroke="${INK}" stroke-width=".6"/><circle cx="${f(bx - .8)}" cy="${f(by - .8)}" r=".8" fill="#fff" opacity=".7"/>`;
      }
      // focos de vela
      const nl = 7 - i;
      for (let j = 0; j < nl; j++) {
        const u = (j + .5) / nl, t = u;
        const lx = (1 - t) * (1 - t) * gl[0] + 2 * (1 - t) * t * x + t * t * gr[0];
        const ly = (1 - t) * (1 - t) * gl[1] + 2 * (1 - t) * t * (yb + th * .28) + t * t * gr[1];
        lights += `<circle class="tw" cx="${f(lx)}" cy="${f(ly - 1.4)}" r="1.5" fill="#ffe7a3" style="animation-delay:${f(-((i * 7 + j) * .37) % 2.6)}s"/>`;
      }
    }
    out += deco + lights + P.star(x, apex - 2, 7.5);
    return out + '</g>';
  }

  /* ---------- Piezas sueltas de las escenas ---------- */
  const mailbox = (x, y) => `<g transform="translate(${x},${y})"><ellipse cx="4" cy="1" rx="9" ry="2.2" fill="${SH}"/><rect x="-5.5" y="-22" width="11" height="22" fill="url(#gRed)" stroke="${INK}" stroke-width=".8"/><rect x="1" y="-22" width="4.5" height="22" fill="url(#hatch)"/><path d="M-6.5,-22 Q0,-30 6.5,-22 Z" fill="#8f2a20" stroke="${INK}" stroke-width=".8"/><path d="M-5,-25.5 Q0,-31.5 5,-25.5" stroke="#f7f5ef" stroke-width="2" fill="none" stroke-linecap="round"/><rect x="-3.4" y="-17" width="6.8" height="1.6" fill="${INK}"/><rect x="-6.5" y="-2" width="13" height="2" fill="${INK}"/><text x="0" y="-8" text-anchor="middle" font-family="IM Fell English SC, Georgia, serif" font-size="4.6" fill="#e2c26c">S·C</text></g>`;
  const sacks = (x, y) => [[-10, 2], [4, 0], [-3, -7]].map(([dx, dy]) => `<g transform="translate(${x + dx},${y + dy})"><ellipse cx="3" cy="1" rx="8" ry="2" fill="${SH}"/><path d="M-6,0 C-8,-8 -4,-13 0,-13 C4,-13 8,-8 6,0 Z" fill="#a8824f" stroke="${INK}" stroke-width=".7"/><path d="M0,-13 C4,-13 8,-8 6,0 L2,0 C4,-5 3,-10 0,-13Z" fill="url(#hatch)"/><path d="M-2,-12.6 l2,-2.6 l2,2.6" stroke="${INK}" stroke-width=".7" fill="#a8824f"/><path d="M-4,-9 Q0,-8 4,-9" stroke="#f7f5ef" stroke-width="1.2" fill="none"/></g>`).join('');
  const workbench = (x, y) => `<g transform="translate(${x},${y})"><ellipse cx="6" cy="1" rx="22" ry="3" fill="${SH}"/><path d="M-16,0 v-11 M16,0 v-11 M-12,0 v-9 M12,0 v-9" stroke="#3b2a1f" stroke-width="2"/><rect x="-19" y="-14" width="38" height="4" fill="url(#gWood)" stroke="${INK}" stroke-width=".7"/><path d="M-19,-14.4 h38" stroke="#f7f5ef" stroke-width="1" opacity=".8"/>${P.gift(-14, -14, 8, 7, '#3e5878')}<g transform="translate(6,-14)"><rect x="-4" y="-7" width="8" height="7" fill="#a8362a" stroke="${INK}" stroke-width=".6"/><ellipse cx="0" cy="-7" rx="4" ry="1.4" fill="#efe4c6" stroke="${INK}" stroke-width=".5"/><path d="M-4,-5 L4,-1.5 M-4,-1.5 L4,-5" stroke="#e2c26c" stroke-width=".7"/></g><path d="M12,-14 l3,-6 M14,-20 l2.4,1" stroke="#3b2a1f" stroke-width="1"/></g>`;
  const rails = (a, b) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), nx = -dy / L * 3.2, ny = dx / L * 3.2;
    let s = `<path d="M${f(a[0] + nx)},${f(a[1] + ny)} L${f(b[0] + nx)},${f(b[1] + ny)} M${f(a[0] - nx)},${f(a[1] - ny)} L${f(b[0] - nx)},${f(b[1] - ny)}" stroke="#5a4a3c" stroke-width="1.1"/>`;
    for (let i = 0; i <= L / 7; i++) { const p = lerp(a, b, i * 7 / L); s += `<path d="M${f(p[0] + nx * 1.5)},${f(p[1] + ny * 1.5)} L${f(p[0] - nx * 1.5)},${f(p[1] - ny * 1.5)}" stroke="#6b4a32" stroke-width="1.4"/>`; }
    return s;
  };
  const ladder = (a, b) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), nx = -dy / L * 3.6, ny = dx / L * 3.6;
    let s = `<path d="M${f(a[0] + nx)},${f(a[1] + ny)} L${f(b[0] + nx)},${f(b[1] + ny)} M${f(a[0] - nx)},${f(a[1] - ny)} L${f(b[0] - nx)},${f(b[1] - ny)}" stroke="#4a3424" stroke-width="1.8"/>`;
    for (let i = 1; i < L / 8; i++) { const p = lerp(a, b, i * 8 / L); s += `<path d="M${f(p[0] + nx)},${f(p[1] + ny)} L${f(p[0] - nx)},${f(p[1] - ny)}" stroke="#4a3424" stroke-width="1.3"/>`; }
    return s;
  };
  const hay = (x, y) => `<g transform="translate(${x},${y})"><ellipse cx="6" cy="1.5" rx="22" ry="4" fill="${SH}"/><path d="M-18,0 C-18,-14 -8,-22 2,-22 C12,-22 20,-12 18,0 Z" fill="#d6b45c" stroke="${INK}" stroke-width=".8"/><path d="M2,-22 C12,-22 20,-12 18,0 L8,0 C12,-8 10,-16 2,-22Z" fill="url(#hatch)"/><path d="M-12,-6 l3,-5 M-6,-14 l2,-4 M2,-10 l1,-5 M8,-16 l3,-3 M-2,-3 l2,-4" stroke="#8f6e26" stroke-width=".6"/><path d="M-14,-12 C-8,-21 6,-23 13,-13 C6,-17 -6,-17 -14,-12Z" fill="#f7f5ef" stroke="${INK}" stroke-width=".45"/></g>`;
  const pitchfork = (x, y) => `<g transform="translate(${x},${y}) rotate(18)"><path d="M0,0 V-24" stroke="#6b4a32" stroke-width="1.2"/><path d="M-3,-24 v-6 M0,-24 v-6 M3,-24 v-6 M-3,-24 h6" stroke="#55504a" stroke-width=".8"/></g>`;

  /* ---------- Las seis escenas ---------- */
  // Cada escena: enter = x donde el camino entra por arriba (sale siempre por 200,300).
  // items: piezas estáticas con su "y" para ordenarlas en profundidad.
  // actors: lo que se mueve. front: lo que va por encima de los actores.
  const SCENES = {
    casa: () => ({
      enter: 200,
      ground: P.road('M200,214 C198,242 206,268 200,300') + P.drifts(11, 14, [10, 120, 390, 290]),
      items: [
        [104, P.tree(78, 104, .9, 'pine2')], [52, P.tree(70, 52, .7, 'pine3')], [58, P.tree(318, 58, .75)],
        [118, P.tree(352, 118, 1, 'pine2')], [150, P.tree(40, 150, 1.1)], [182, P.tree(374, 182, .85)],
        [190, P.tree(100, 192, .7, 'pine3')],
        [212, P.house({ x: 120, y: 212, w: 160, h: 62, gh: 46, D: 78, dx: 22, timber: true, roof: ['#a63a2b', '#6f2119'],
          windows: [[13, 16, 18, 20, '#3f5b3c'], [43, 16, 18, 20, '#3f5b3c'], [99, 16, 18, 20, '#3f5b3c'], [129, 16, 18, 20, '#3f5b3c']],
          door: { x: 70, w: 20, h: 36, color: '#2f5034', wreath: true }, round: 7, chimneys: [{ t: .45, side: -.18, h: 18 }] })],
        [236, P.lamp(176, 236)], [236, P.lamp(224, 236)],
        [238, P.tree(24, 240, .8, 'pine3')], [252, P.giftPile(88, 252, 4)], [262, P.sleigh(292, 262)],
        [264, P.tree(386, 266, .8, 'pine3')]
      ],
      actors: [
        { type: 'walk', elf: { coat: 'g', hat: 'r', carry: 'gift', color: '#3f6a45' }, path: [[106, 262], [160, 272], [252, 272]], speed: 19, pause: [1.4, .9], carry: 'out', phase: 0 },
        { type: 'walk', elf: { coat: 'r', hat: 'g', carry: 'gift', color: '#c9a24a' }, path: [[112, 270], [166, 280], [258, 280]], speed: 16, pause: [1.1, 1.2], carry: 'out', phase: .55 },
        { type: 'idle', elf: { coat: 'b', hat: 'r', carry: 'list' }, at: [334, 280], face: -1, anim: 'read' }
      ],
      front: [[292, P.tree(26, 296, .7, 'pine3')], [296, P.tree(378, 298, .65)]],
      label: [96, 280, 'Casa de Santa Claus']
    }),

    taller: () => ({
      enter: 60,
      ground: P.road('M60,0 C56,70 36,130 58,190 C80,250 170,262 200,300') + P.drifts(23, 14, [80, 190, 390, 290]) + rails([186, 186], [300, 262]),
      items: [
        [40, P.tree(24, 40, .8, 'pine2')], [100, P.tree(92, 102, .72, 'pine3')], [205, P.tree(386, 205, .75, 'pine2')],
        [178, P.house({ x: 118, y: 178, w: 228, h: 62, gh: 32, D: 74, dx: 18, roof: ['#44694c', '#27402f'], wall: '#8b5236', wallD: '#5e3622', tex: 'planks',
          windows: [[10, 18, 18, 18], [124, 16, 20, 20], [156, 16, 20, 20], [190, 16, 20, 20]],
          door: { x: 44, w: 42, h: 42, open: true, color: '#2f5034' }, sign: [37, 4, 56, 'TALLER'],
          chimneys: [{ t: .28, side: -.15, h: 16 }, { t: .72, side: -.15, h: 19 }] })],
        [215, P.tree(22, 218, .8, 'pine3')], [250, workbench(86, 250)], [262, P.giftPile(318, 266, 9)]
      ],
      actors: [
        { type: 'walk', elf: { coat: 'g', hat: 'r', prop: 'cart', carry: 'cartGifts' }, path: [[182, 194], [240, 232], [292, 258]], speed: 13, pause: [1.6, 1.2], carry: 'out', phase: .2 },
        { type: 'walk', elf: { coat: 'r', hat: 'g', carry: 'gift', color: '#3e5878' }, path: [[160, 190], [214, 244], [300, 276]], speed: 20, pause: [1, .8], carry: 'out', phase: .4 },
        { type: 'walk', elf: { coat: 'b', hat: 'r', carry: 'gift', color: '#a8362a' }, path: [[206, 188], [262, 228], [338, 250]], speed: 17, pause: [1.3, 1], carry: 'out', phase: .8 },
        { type: 'idle', elf: { coat: 'g', hat: 'g', prop: 'hammer' }, at: [120, 258], face: -1, anim: 'hammer' }
      ],
      front: [[290, P.tree(128, 294, .65, 'pine3')], [292, P.tree(384, 294, .7)]],
      label: [262, 280, 'Taller de Juguetes']
    }),

    correo: () => ({
      enter: 200,
      ground: P.road('M200,0 C200,50 112,92 102,160 C94,222 170,262 200,300') + P.drifts(37, 12, [150, 200, 390, 290]),
      items: [
        [40, P.tree(124, 42, .7, 'pine3')], [46, P.tree(38, 46, .85, 'pine2')], [36, P.tree(374, 36, .7, 'pine3')],
        [122, P.tree(36, 122, .8)], [198, P.tree(26, 200, .75, 'pine3')],
        [192, P.house({ x: 206, y: 192, w: 148, h: 58, gh: 40, D: 62, dx: 16, roof: ['#62748a', '#3c4a5b'], wall: '#bdb6a6', wallD: '#857e72', tex: 'stones',
          windows: [[12, 18, 18, 20], [118, 18, 18, 20]], door: { x: 62, w: 24, h: 36, color: '#7e271d' }, sign: [40, 4, 68, 'CORREO'], round: 6,
          chimneys: [{ t: .6, side: -.2, h: 14 }] })],
        [238, mailbox(174, 240)], [238, sacks(340, 238)], [266, P.bench(344, 268)]
      ],
      actors: [
        { type: 'walk', elf: { coat: 'g', hat: 'r', carry: 'sack' }, path: [[118, 254], [196, 250], [280, 198]], speed: 16, pause: [1.2, 1], carry: 'out', phase: .1 },
        { type: 'walk', elf: { coat: 'b', hat: 'r', carry: 'letters' }, path: [[96, 214], [182, 228], [264, 200]], speed: 19, pause: [1, 1.2], carry: 'out', phase: .55 },
        { type: 'idle', elf: { coat: 'r', hat: 'g', carry: 'letters' }, at: [330, 274], face: -1, anim: 'read' },
        { type: 'flutter', at: [262, 70], amp: [74, 24], w: .55, phase: 0 },
        { type: 'flutter', at: [262, 70], amp: [74, 24], w: .55, phase: 2.1 },
        { type: 'flutter', at: [262, 70], amp: [74, 24], w: .55, phase: 4.2 }
      ],
      front: [[262, P.tree(386, 266, .7)]],
      label: [296, 280, 'Oficina de Cartas']
    }),

    pino: () => ({
      enter: 56,
      ground: P.road('M56,0 C66,62 36,132 66,192 C96,250 170,265 200,300') +
        `<ellipse cx="226" cy="224" rx="150" ry="54" fill="#e3dccb" stroke="#bcae95" stroke-width="2"/><ellipse cx="226" cy="224" rx="150" ry="54" fill="url(#cobble)"/>` +
        `<ellipse cx="226" cy="224" rx="138" ry="46" fill="none" stroke="#f7f5ef" stroke-width="3" stroke-dasharray="18 10 6 14" stroke-linecap="round"/>` + P.drifts(41, 8, [20, 40, 390, 150]),
      items: [
        [40, P.tree(26, 42, .8, 'pine2')], [60, P.tree(380, 62, .8)], [72, P.tree(112, 72, .7, 'pine3')], [150, P.tree(388, 152, .75, 'pine2')],
        [214, P.lamp(90, 214)], [214, P.lamp(362, 214)], [232, P.tree(18, 232, .8, 'pine3')]
      ],
      back: true,
      centerpiece: bigPine(226, 238, 2.5) + ladder([298, 256], [266, 122]),
      actors: [
        { type: 'orbit', elf: { coat: 'r', hat: 'g', carry: 'ornament' }, c: [226, 240], r: [104, 28], w: .32, phase: 0 },
        { type: 'orbit', elf: { coat: 'g', hat: 'r', carry: 'gift', color: '#c9a24a' }, c: [226, 240], r: [104, 28], w: .32, phase: Math.PI },
        { type: 'climb', elf: { coat: 'b', hat: 'r', carry: 'ornament' }, from: [292, 252], to: [270, 140], t: [.08, .78], speed: 14, pause: [2, 2.4] },
        { type: 'idle', elf: { coat: 'g', hat: 'g' }, at: [312, 262], face: -1, anim: 'hold' }
      ],
      front: [[262, P.bench(128, 264)], [270, P.bench(336, 272)], [292, P.tree(382, 294, .7, 'pine3')]],
      label: [110, 280, 'Plaza del Gran Pino']
    }),

    lago: () => {
      let lake = `<defs><clipPath id="clipLake"><ellipse cx="176" cy="138" rx="148" ry="76"/></clipPath></defs>`;
      lake += `<ellipse cx="176" cy="140" rx="156" ry="82" fill="#f7f5ef" stroke="${INK}" stroke-width=".7"/>`;
      lake += `<ellipse cx="176" cy="138" rx="148" ry="76" fill="url(#gIce)" stroke="${INK}" stroke-width=".9"/>`;
      lake += `<g clip-path="url(#clipLake)">`;
      for (let i = 0; i < 9; i++) lake += `<path d="M${40 + i * 34},40 l-60,200" stroke="#fff" stroke-opacity="${i % 2 ? .18 : .32}" stroke-width="${3 + (i % 3) * 3}"/>`;
      lake += `<path d="M86,104 l18,10 l10,-6 l16,14 M220,170 l14,-6 l12,10 l20,-4 M140,190 l10,-12 l14,4" stroke="#6f8aa3" stroke-width=".7" fill="none"/>`;
      lake += `<ellipse cx="176" cy="140" rx="100" ry="44" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width=".8"/><ellipse cx="150" cy="128" rx="56" ry="24" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width=".7"/><ellipse cx="200" cy="150" rx="124" ry="54" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width=".7"/>`;
      lake += `<path d="M30,150 C70,200 250,226 324,140 L324,240 L30,240Z" fill="url(#hatchS)" opacity=".7"/></g>`;
      for (let i = 0; i < 6; i++) lake += `<path class="tw" d="M${f(80 + i * 40)},${f(100 + (i % 3) * 30)} l0,-4 M${f(78 + i * 40)},${f(98 + (i % 3) * 30)} l4,0" stroke="#fff" stroke-width="1" style="animation-delay:${f(-i * .7)}s"/>`;
      return {
        enter: 330,
        ground: P.road('M330,0 C350,62 384,124 362,184 C340,244 240,264 200,300') + lake + P.drifts(53, 8, [10, 220, 300, 290]),
        items: [
          [40, P.tree(30, 40, .85, 'pine2')], [44, P.tree(92, 44, .7, 'pine3')], [36, P.tree(250, 36, .75)], [42, P.tree(296, 42, .7, 'pine3')],
          [150, P.tree(16, 150, .8)], [250, P.house({ x: 26, y: 254, w: 36, h: 22, gh: 14, D: 20, dx: 6, roof: ['#6b4a35', '#45301f'], wall: '#8a5a3a', wallD: '#5e3a22', tex: 'planks', windows: [[22, 6, 8, 8]], door: { x: 6, w: 9, h: 15, color: '#3f5b3c' }, chimneys: [{ t: .5, side: -.2, h: 8, w: 5 }] })],
          [236, P.bench(256, 238)]
        ],
        actors: [
          { type: 'skate', elf: { coat: 'r', hat: 'g', pose: 'skate', scarf: '#e9e2cf' }, c: [176, 140], r: [100, 44], w: .55, phase: 0 },
          { type: 'skate', elf: { coat: 'g', hat: 'r', pose: 'skate', scarf: '#a8362a' }, c: [150, 128], r: [56, 24], w: -.75, phase: 1.4 },
          { type: 'skate', elf: { coat: 'b', hat: 'r', pose: 'skate', scarf: '#c9a24a' }, c: [200, 150], r: [124, 54], w: .4, phase: 3.2 },
          { type: 'idle', elf: { coat: 'g', hat: 'g' }, at: [272, 244], face: -1, anim: 'hold' }
        ],
        front: [[284, P.tree(60, 286, .7, 'pine3')], [282, P.tree(380, 284, .7)]],
        label: [150, 262, 'Lago Helado']
      };
    },

    establo: () => ({
      enter: 200,
      ground: P.road('M200,0 C200,60 122,100 112,160 C102,228 180,262 200,300') + P.drifts(67, 10, [150, 190, 390, 280]),
      items: [
        [36, P.tree(112, 38, .7, 'pine3')], [50, P.tree(40, 50, .85, 'pine2')], [60, P.tree(388, 60, .75, 'pine3')],
        [120, P.tree(36, 122, .8)], [130, P.tree(384, 132, .7, 'pine2')], [228, P.tree(38, 230, .75, 'pine3')],
        [152, P.house({ x: 176, y: 152, w: 150, h: 56, gh: 46, D: 60, dx: 16, roof: ['#6e4c36', '#45301f'], wall: '#96412d', wallD: '#62291c', tex: 'vplanks',
          windows: [[12, 16, 16, 16], [122, 16, 16, 16]], door: { x: 52, w: 46, h: 40, color: '#8a3a28' }, sign: [44, 3, 62, 'RENOS'], round: 7 })
          + `<path d="M228,152 L274,116 M228,116 L274,152 M228,116 H274" stroke="#efe6d2" stroke-width="2.2"/>`],
        [178, P.fence(160, 178, 214, 178, 3) + P.fence(288, 178, 392, 178, 5)],
        [180, P.fence(160, 178, 152, 282, 5)], [182, P.fence(392, 178, 392, 282, 5)],
        [262, hay(186, 264) + pitchfork(206, 262)]
      ],
      actors: [
        { type: 'deer', at: [240, 248], face: 1, graze: true },
        { type: 'deer', at: [346, 238], face: -1, graze: true },
        { type: 'deerwalk', path: [[290, 206], [366, 214]], speed: 7, pause: [3.4, 2.6], phase: .3 },
        { type: 'walk', elf: { coat: 'r', hat: 'g', prop: 'barrow', carry: 'hay' }, path: [[214, 254], [236, 216], [248, 186]], speed: 12, pause: [1.8, 1.4], carry: 'out', phase: .1 }
      ],
      front: [[282, P.fence(152, 282, 392, 282, 12)]],
      label: [90, 280, 'Establo de los Renos']
    })
  };

  /* ---------- Construcción de una escena ---------- */
  function buildScene(slot) {
    const def = SCENES[slot.dataset.scene]();
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 400 300');
    svg.setAttribute('aria-hidden', 'true');
    svg.classList.add('scene');
    const items = def.items.slice().sort((a, b) => a[0] - b[0]).map(i => i[1]).join('');
    const front = (def.front || []).sort((a, b) => a[0] - b[0]).map(i => i[1]).join('');
    let actors = '';
    def.actors.forEach((a, i) => {
      let inner = '';
      if (a.elf) inner = P.elf(a.elf);
      else if (a.type === 'deer' || a.type === 'deerwalk') inner = P.deer();
      else if (a.type === 'flutter') inner = P.envelope();
      actors += `<g data-a="${i}">${inner}</g>`;
    });
    svg.innerHTML = def.ground + items + (def.back ? '<g class="layer-back"></g>' : '') + (def.centerpiece || '') +
      `<g class="layer-actors">${actors}</g>` + front + P.ribbon(def.label[0], def.label[1], def.label[2]);
    slot.appendChild(svg);
    const back = svg.querySelector('.layer-back'), layer = svg.querySelector('.layer-actors');
    const list = def.actors.map((spec, i) => makeActor(spec, svg.querySelector(`[data-a="${i}"]`), back, layer));
    return { slot, svg, def, actors: list, layer, active: false };
  }

  /* ---------- Actores ---------- */
  function polyline(path) {
    const segs = [];
    let L = 0;
    for (let i = 1; i < path.length; i++) { const a = path[i - 1], b = path[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]); segs.push({ a, b, l, s0: L }); L += l; }
    return { segs, L, at(s) { for (const g of segs) if (s <= g.s0 + g.l) { const t = (s - g.s0) / g.l; return { x: g.a[0] + (g.b[0] - g.a[0]) * t, y: g.a[1] + (g.b[1] - g.a[1]) * t, dx: g.b[0] - g.a[0] }; } const g = segs[segs.length - 1]; return { x: g.b[0], y: g.b[1], dx: g.b[0] - g.a[0] }; } };
  }

  function makeActor(spec, node, back, layer) {
    const fig = node.firstElementChild, face = node.querySelector('.face');
    const a = { spec, node, fig, face, x: 0, y: 0, facing: 1, back, layer };
    node._a = a;
    const rng = Math.random;
    a.setFace = d => { if (d !== a.facing) { a.facing = d; face.setAttribute('transform', d < 0 ? 'scale(-1,1)' : ''); } };
    const sc = spec.type === 'flutter' ? 1 : spec.elf ? 1.22 : 1.08;
    a.place = (x, y) => { a.x = x; a.y = y; node.setAttribute('transform', `translate(${f(x)},${f(y)}) scale(${sc})`); };
    switch (spec.type) {
      case 'walk': case 'deerwalk': {
        const pl = polyline(spec.path);
        a.pl = pl; a.s = (spec.phase || 0) * pl.L; a.dir = 1; a.wait = 0;
        a.update = dt => {
          if (a.wait > 0) { a.wait -= dt; fig.classList.remove('walking'); return; }
          fig.classList.add('walking');
          a.s += a.dir * spec.speed * dt;
          if (a.s >= pl.L) { a.s = pl.L; a.dir = -1; a.wait = spec.pause[1] * (.8 + rng() * .5); }
          else if (a.s <= 0) { a.s = 0; a.dir = 1; a.wait = spec.pause[0] * (.8 + rng() * .5); }
          const p = pl.at(a.s);
          a.place(p.x, p.y);
          if (Math.abs(p.dx) > .5) a.setFace(Math.sign(p.dx) * a.dir);
          if (spec.carry) fig.classList.toggle('loaded', spec.carry === 'out' ? a.dir > 0 : a.dir < 0);
        };
        break;
      }
      case 'skate': case 'orbit': {
        a.th = spec.phase || 0;
        if (spec.type === 'orbit') fig.classList.add('walking', 'loaded');
        else fig.classList.add('loaded');
        a.update = dt => {
          a.th += spec.w * dt;
          const c = Math.cos(a.th), s = Math.sin(a.th);
          a.place(spec.c[0] + spec.r[0] * c, spec.c[1] + spec.r[1] * s);
          a.setFace(-s * Math.sign(spec.w) >= 0 ? 1 : -1);
          if (spec.type === 'orbit' && back) {
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
        fig.classList.add('loaded');
        a.setFace(-1);
        a.update = dt => {
          if (a.wait > 0) { a.wait -= dt; fig.classList.remove('climbing'); return; }
          fig.classList.add('climbing');
          a.t += a.dir * spec.speed * dt / L;
          if (a.t >= spec.t[1]) { a.t = spec.t[1]; a.dir = -1; a.wait = spec.pause[1]; fig.classList.remove('loaded'); }
          else if (a.t <= spec.t[0]) { a.t = spec.t[0]; a.dir = 1; a.wait = spec.pause[0]; fig.classList.add('loaded'); }
          const p = lerp(spec.from, spec.to, a.t);
          a.place(p[0], p[1]);
        };
        break;
      }
      case 'flutter': {
        a.t = 0;
        a.update = dt => {
          a.t += dt;
          const w = spec.w, t = a.t * w + spec.phase;
          const x = spec.at[0] + spec.amp[0] * Math.sin(t), y = spec.at[1] + spec.amp[1] * Math.sin(2 * t + .6) + Math.sin(a.t * 2.3 + spec.phase) * 3;
          a.x = x; a.y = y;
          node.setAttribute('transform', `translate(${f(x)},${f(y)}) rotate(${f(Math.sin(a.t * 3.1 + spec.phase) * 24)})`);
        };
        break;
      }
      default: { // idle, deer
        if (spec.anim) fig.classList.add(spec.anim === 'read' ? 'reading' : spec.anim === 'hammer' ? 'hammering' : 'holding');
        if (spec.graze) { fig.classList.add('graze'); fig.style.setProperty('--gd', f(-rng() * 6) + 's'); }
        if (fig.classList.contains('elf') || fig.classList.contains('deer')) fig.classList.add('loaded');
        a.update = null;
      }
    }
    a.place(spec.at ? spec.at[0] : spec.path ? spec.path[0][0] : spec.c ? spec.c[0] : spec.from[0], spec.at ? spec.at[1] : spec.path ? spec.path[0][1] : spec.c ? spec.c[1] : spec.from[1]);
    if (spec.face) a.setFace(spec.face);
    if (a.update) a.update(0.001);
    return a;
  }

  /* ---------- Fondo: camino, bosque y nieve ---------- */
  function buildBg(scenes) {
    const main = document.getElementById('invite'), svg = document.getElementById('villaBg');
    const W = main.clientWidth, H = main.scrollHeight, mr = main.getBoundingClientRect();
    const rel = r => ({ x: r.left - mr.left, y: r.top - mr.top, w: r.width, h: r.height });
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('width', W); svg.setAttribute('height', H);
    const slots = scenes.map(s => ({ r: rel(s.slot.getBoundingClientRect()), enter: s.def.enter }));
    const blocks = [...document.querySelectorAll('.card, .hero-text, .cartouche, .legend, .scale')].map(el => rel(el.getBoundingClientRect()));
    const k = slots[0].r.w / 400;
    if (!k || !isFinite(k) || !W) return;
    const rng = rngFrom(1225);
    let out = '';

    // camino entre escenas
    const roadPts = [];
    const link = (a, b) => {
      const dy = b[1] - a[1];
      const d = `M${f(a[0] / k)},${f(a[1] / k)} C${f(a[0] / k)},${f((a[1] + dy * .45) / k)} ${f(b[0] / k)},${f((b[1] - dy * .45) / k)} ${f(b[0] / k)},${f(b[1] / k)}`;
      out += `<g transform="scale(${f(k * 1000) / 1000})">${P.road(d)}</g>`;
      for (let i = 0; i <= 24; i++) { const t = i / 24, u = 1 - t; roadPts.push([u * u * u * a[0] + 3 * u * u * t * a[0] + 3 * u * t * t * b[0] + t * t * t * b[0], u * u * u * a[1] + 3 * u * u * t * (a[1] + dy * .45) + 3 * u * t * t * (b[1] - dy * .45) + t * t * t * b[1]]); }
    };
    for (let i = 0; i < slots.length - 1; i++) {
      const s = slots[i].r, n = slots[i + 1].r;
      link([s.x + 200 * k, s.y + 300 * k - 1], [n.x + slots[i + 1].enter * k, n.y + 1]);
    }
    const last = slots[slots.length - 1].r, cart = document.querySelector('.cartouche');
    if (cart) { const c = rel(cart.getBoundingClientRect()); link([last.x + 200 * k, last.y + 300 * k - 1], [c.x + c.w / 2, c.y + 20]); }

    // bosque
    const inRect = (x, y, r, m) => x > r.x - m && x < r.x + r.w + m && y > r.y - m && y < r.y + r.h + m;
    const nearRoad = (x, y, m) => roadPts.some(p => Math.abs(p[0] - x) < m && Math.abs(p[1] - y) < m * .7);
    const cell = 50 * Math.max(.8, k), trees = [];
    for (let gy = -10; gy < H + 20; gy += cell * .78) {
      for (let gx = -10; gx < W + 20; gx += cell) {
        const x = gx + rng() * cell, y = gy + rng() * cell * .7;
        if (slots.some(s => inRect(x, y, s.r, -4))) continue;
        if (blocks.some(b => inRect(x, y, b, 10))) continue;
        if (nearRoad(x, y, 24 * k)) continue;
        if (rng() < .3) continue;
        trees.push([x, y, rng()]);
      }
    }
    const heroText = document.querySelector('.hero-text');
    const ht = heroText ? rel(heroText.getBoundingClientRect()) : null;
    trees.sort((a, b) => a[1] - b[1]).forEach(([x, y, r]) => {
      if (ht && inRect(x, y, ht, 36)) return;
      const s = k * (.6 + r * .5), v = r < .4 ? 'pine' : r < .75 ? 'pine2' : 'pine3';
      if (r > .93) out += `<use href="#rock" transform="translate(${f(x)},${f(y)}) scale(${f(k * .9 * 100) / 100})"/>`;
      else if (r > .86) out += `<use href="#bush" transform="translate(${f(x)},${f(y)}) scale(${f(k * 100) / 100})"/>`;
      else out += P.tree(x, y, s, v);
    });
    // ventisca
    for (let i = 0; i < W * H / 9000; i++) {
      const x = rng() * W, y = rng() * H;
      if (blocks.some(b => inRect(x, y, b, 0))) continue;
      const w = (14 + rng() * 26) * k;
      out += `<path d="M${f(x)},${f(y)} q${f(w / 2)},${f(-(3 + rng() * 3) * k)} ${f(w)},0" fill="none" stroke="#9fb0c3" stroke-width=".8" stroke-opacity=".45" stroke-linecap="round"/>`;
    }
    svg.innerHTML = out;
  }

  /* ---------- Arranque ---------- */
  let scenes = [], running = false, last = 0, lastW = 0, lastH = 0;
  P.villa = {
    init() {
      document.getElementById('defs').innerHTML = P.DEFS;
      scenes = [...document.querySelectorAll('.slot[data-scene]')].map(buildScene);
      const io = new IntersectionObserver(es => es.forEach(e => { const sc = scenes.find(s => s.slot === e.target); if (sc) sc.active = e.isIntersecting; }), { rootMargin: '80px 0px' });
      scenes.forEach(s => io.observe(s.slot));
    },
    layout(force) {
      const main = document.getElementById('invite');
      const W = main.clientWidth, H = main.scrollHeight;
      if (!force && W === lastW && Math.abs(H - lastH) < 30) return;
      lastW = W; lastH = H;
      buildBg(scenes);
    },
    start() {
      if (running || reduce) return;
      running = true;
      last = performance.now();
      const loop = now => {
        const dt = Math.min(.05, (now - last) / 1000); last = now;
        for (const sc of scenes) {
          if (!sc.active) continue;
          for (const a of sc.actors) if (a.update) a.update(dt);
          // orden por profundidad: el que está más abajo va adelante
          const kids = sc.layer.children;
          for (let i = 1; i < kids.length; i++) {
            if (kids[i]._a.y < kids[i - 1]._a.y) { sc.layer.insertBefore(kids[i], kids[i - 1]); break; }
          }
        }
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
  };
})();
