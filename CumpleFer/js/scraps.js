/* =========================================================
   scraps.js — papelitos de colores que salen en la explosión
   Canvas ligero, se apagan solos.
   ========================================================= */
(function (global) {
  'use strict';

  /* papelitos en los cinco sabores de la iMac */
  var COLORS = ['#E5384F', '#7A4B9E', '#67B84B', '#F08A24', '#3B7DC4', '#0095B6'];

  function Scraps(canvas) {
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.parts = [];
    this.dpr = Math.min(global.devicePixelRatio || 1, 2);
    this.resize();
  }

  Scraps.prototype.resize = function () {
    var w = global.innerWidth, h = global.innerHeight;
    this.w = w; this.h = h;
    this.c.width = Math.round(w * this.dpr);
    this.c.height = Math.round(h * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  };

  Scraps.prototype.burst = function (x, y, n) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2;
      var sp = 260 + Math.random() * 1150;
      this.parts.push({
        x: x, y: y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 260,
        w: 5 + Math.random() * 13,
        h: 3 + Math.random() * 8,
        rot: Math.random() * Math.PI,
        rv: (Math.random() - 0.5) * 16,
        life: 1,
        decay: 0.26 + Math.random() * 0.42,
        color: COLORS[(Math.random() * COLORS.length) | 0]
      });
    }
  };

  Scraps.prototype.update = function (dt) {
    var ctx = this.ctx, p, i;
    ctx.clearRect(0, 0, this.w, this.h);
    if (!this.parts.length) return;

    for (i = this.parts.length - 1; i >= 0; i--) {
      p = this.parts[i];
      p.vy += 1750 * dt;
      p.vx *= 0.985;
      p.vy *= 0.985;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.rv * dt;
      p.life -= p.decay * dt;

      if (p.life <= 0 || p.y > this.h + 60) {
        this.parts.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.rot * 1.7)));
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  };

  global.Scraps = Scraps;
})(window);
