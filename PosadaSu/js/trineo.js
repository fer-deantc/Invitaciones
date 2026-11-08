/* =========================================================
   trineo.js — de repente, el trineo cruza volando.

   Cuando ciertos banners entran a la pantalla, el trineo con
   sus renos atraviesa de un lado a otro, en arco, con un
   cascabeleo. Una vez por banner y con calma entre vuelos.
   ========================================================= */
(function () {
  'use strict';
  const P = window.POSADA;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const box = document.getElementById('sleigh');
  if (!box) return;

  // Santa y sus renos, pintados como los monitos de la villa, en piezas que se mueven:
  // los renos galopan y se mecen, el trineo se balancea y Santa saluda.
  const A = P.paint;
  const piece = (cls, frames) => { const d = document.createElement('div'); d.className = 'sp ' + cls; frames.forEach((c, k) => { c.className = 'fr f' + k; d.appendChild(c); }); box.appendChild(d); return d; };
  const NS = 'http://www.w3.org/2000/svg', reins = document.createElementNS(NS, 'svg');
  reins.setAttribute('viewBox', '0 0 440 150'); reins.setAttribute('class', 'reins'); reins.setAttribute('preserveAspectRatio', 'none');
  reins.innerHTML = '<path d="M30,62 Q90,52 106,58 T182,56 T258,58 T334,72" fill="none" stroke="#3b2a20" stroke-width="1.2" stroke-linecap="round" opacity=".75"/>';
  box.appendChild(reins);
  piece('trail', [A.sparkTrail()]);
  [0, 1, 2, 3].forEach(k => piece('deer d' + k, [A.reindeer(0), A.reindeer(1)]));
  const sled = piece('sled', [A.sleighBody()]);
  const santa = piece('santa', [A.santa(0), A.santa(1)]);
  sled.appendChild(santa);

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
    // el final del vuelo se agenda primero: pase lo que pase con el sonido, el trineo se va
    setTimeout(() => { box.hidden = true; busy = false; if (anim) anim.cancel(); }, 5300);
    const anim = box.animate([
      { transform: `translate(${W + 20}px,${y0}px) rotate(-6deg)` },
      { transform: `translate(${W * .5 - w * .5}px,${y0 - rise}px) rotate(-2deg)`, offset: .5 },
      { transform: `translate(${-w - 40}px,${y0 - rise * .3}px) rotate(4deg)` }
    ], { duration: 5200, easing: 'cubic-bezier(.35,.1,.6,.9)', fill: 'both' });
    try { if (P.audio && P.audio.playing) { if (P.audio.wind) P.audio.wind(5.2); P.audio.jingle(.7); setTimeout(() => P.audio.jingle(.5), 900); setTimeout(() => P.audio.jingle(.4), 1800); } } catch (e) { /* sin sonido, el vuelo sigue */ }
  }
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting && document.body.classList.contains('unlocked')) { fly(); io.unobserve(e.target); }
  }), { threshold: .35 });
  document.querySelectorAll('[data-sleigh]').forEach(n => io.observe(n));
})();
