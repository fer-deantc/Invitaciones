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

  // dibujo en acuarela y tinta, como la villa: dos cuadros de galope que se alternan
  const frames = [0, 1].map(f => { const c = P.paint.sleighTeam(f); c.className = 'sleigh-frame f' + f; return c; });
  frames.forEach(c => box.appendChild(c));

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
    if (P.audio && P.audio.playing) { if (P.audio.wind) P.audio.wind(5.2); P.audio.jingle(.7); setTimeout(() => P.audio.jingle(.5), 900); setTimeout(() => P.audio.jingle(.4), 1800); }
    setTimeout(() => { box.hidden = true; busy = false; anim.cancel(); }, 5300);
  }
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting && document.body.classList.contains('unlocked')) { fly(); io.unobserve(e.target); }
  }), { threshold: .35 });
  document.querySelectorAll('[data-sleigh]').forEach(n => io.observe(n));
})();
