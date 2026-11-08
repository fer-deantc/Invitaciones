/* =========================================================
   trineo.js — de repente, el trineo cruza volando.

   Cuando ciertos banners entran a la pantalla, el trineo con
   sus renos atraviesa de un lado a otro, en arco, con un
   cascabeleo. Una vez por banner y con calma entre vuelos.
   ========================================================= */
(function () {
  'use strict';
  const P = window.POSADA, C = P.C;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const box = document.getElementById('sleigh');
  if (!box) return;

  // dibujo: cuatro renos en fila, las riendas y el trineo con Santa
  const svg = P.svg(420, 120, 'sleigh-svg');
  box.appendChild(svg);
  const pen = P.pen(svg);
  const team = [[40, 66], [96, 58], [152, 66], [208, 58]];
  team.forEach(([x, y], i) => {
    const g = P.el('g', { transform: `translate(${x},${y}) scale(-1,1)`, class: 'gallop', style: `animation-delay:${-i * .12}s` }, svg);
    P.deer(pen, g);
  });
  pen.curve([[232, 46], [260, 58], [292, 62], [312, 66]], { strokeWidth: .9 });
  pen.curve([[64, 50], [120, 44], [176, 50], [232, 46]], { strokeWidth: .9 });
  const s = P.el('g', { transform: 'translate(300,30)' }, svg);
  pen.path('M8,52 C2,30 14,18 26,22 L34,34 L92,34 C100,18 116,20 112,40 C108,56 96,62 80,62 L18,62 Z', { fill: C.wine, fillStyle: 'solid', strokeWidth: 1.3 }, s);
  pen.hatch([[80, 36], [110, 36], [104, 58], [80, 60]], { op: .45 }, s);
  pen.path('M0,72 L96,72 Q118,72 116,56', { stroke: C.gold, strokeWidth: 2.4, roughness: .5 }, s);
  pen.line(22, 62, 20, 72, { strokeWidth: 1.2 }, s); pen.line(76, 62, 78, 72, { strokeWidth: 1.2 }, s);
  pen.ellipse(70, 26, 26, 22, { fill: C.beige, fillStyle: 'solid' }, s);
  const santa = P.el('g', { transform: 'translate(46,36) scale(-1,1)' }, s);
  P.figure(pen, santa, { type: 'santa', pose: 'wave', cls: 'waving' });

  // vuelo
  let lastFlight = -1e9, busy = false;
  function fly() {
    const now = performance.now();
    if (busy || now - lastFlight < 12000) return;
    busy = true; lastFlight = now;
    const W = innerWidth, H = innerHeight, w = Math.min(380, W * .8);
    box.style.width = w + 'px';
    const y0 = H * (.16 + Math.random() * .2), rise = H * .12;
    box.hidden = false;
    const anim = box.animate([
      { transform: `translate(${W + 20}px,${y0}px) rotate(-6deg)` },
      { transform: `translate(${W * .5 - w * .5}px,${y0 - rise}px) rotate(-2deg)`, offset: .5 },
      { transform: `translate(${-w - 40}px,${y0 - rise * .3}px) rotate(4deg)` }
    ], { duration: 5200, easing: 'cubic-bezier(.35,.1,.6,.9)', fill: 'both' });
    if (P.audio && P.audio.playing) { P.audio.jingle(.7); setTimeout(() => P.audio.jingle(.5), 900); setTimeout(() => P.audio.jingle(.4), 1800); }
    setTimeout(() => { box.hidden = true; busy = false; anim.cancel(); }, 5300);
  }
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting && document.body.classList.contains('unlocked')) { fly(); io.unobserve(e.target); }
  }), { threshold: .35 });
  document.querySelectorAll('[data-sleigh]').forEach(n => io.observe(n));
})();
