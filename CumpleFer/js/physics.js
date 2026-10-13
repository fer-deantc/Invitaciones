/* =========================================================
   physics.js — alberca de pelotas

   Cada sticker es un disco. No se le mete giro al azar nunca:
   toda la rotación sale del roce en los contactos, o sea que
   ruedan porque se están frotando contra el piso, contra otro
   sticker o contra el dedo. Si no hay roce, no giran.
   ========================================================= */
(function (global) {
  'use strict';

  var CFG = {
    gravity: 2000,          // px/s²
    drag: 0.9992,           // aire: casi nada, la caída se siente pesada
    floorRestitution: 0.32,
    wallRestitution: 0.30,
    floorFriction: 0.62,    // de aquí sale la rodadura contra el piso
    pairRestitution: 0.20,
    pairFriction: 0.50,     // y de aquí la de unos contra otros
    angularDamp: 0.994,
    maxAngVel: 10,          // ~1.6 vueltas por segundo: más ya se ve absurdo

    sleepSpeed: 20,
    sleepSpin: 0.55,
    calmSpeed: 85,
    calmSpin: 2.6,
    calmSteps: 45,

    subStep: 1 / 120,
    maxSub: 4,
    iterations: 5,
    correction: 0.62,
    slop: 0.5,

    // El disco es más chico que el dibujo: los stickers son papel y
    // se enciman. Con el disco del tamaño completo el montón se
    // vuelve una torre de bolas separadas.
    radius: 0.40,

    // El cursor es un obstáculo redondo que de verdad los empuja,
    // no un campo de fuerzas. Se siente mucho más directo.
    pointerRadius: 88,
    pointerRestitution: 0.45,
    pointerFriction: 0.55,
    pointerMaxSpeed: 4200,

    maxSpeed: 3200
  };

  /* ---------------------------------------------------------
     Roce en un contacto contra algo que no se mueve por el golpe
     (el piso, una pared, el dedo). De aquí sale el giro.
     (ox,oy) = del centro al punto de contacto
     (tx,ty) = tangente unitaria
     (sx,sy) = velocidad de la superficie
     --------------------------------------------------------- */
  function roce(b, ox, oy, tx, ty, mu, sx, sy) {
    // velocidad del punto del disco que está tocando
    var px = b.vx - oy * b.angVel - (sx || 0);
    var py = b.vy + ox * b.angVel - (sy || 0);
    var slip = px * tx + py * ty;
    if (slip === 0) return;

    // Para un disco (I = ½mr²) la masa efectiva tangencial es m/3,
    // así que este impulso deja el deslizamiento en cero.
    var j = mu * slip / 3;
    b.vx -= j * tx;
    b.vy -= j * ty;
    b.angVel += (ox * (-j * ty) - oy * (-j * tx)) / (0.5 * b.r * b.r);
  }

  function Body(opts) {
    this.x = opts.x; this.y = opts.y;
    this.vx = 0; this.vy = 0;
    this.angle = opts.angle || 0;
    this.angVel = 0;
    this.el = opts.el || null;
    this.held = false;
    this.onGround = false;
    this.calm = 0;
    this.setSize(opts.w, opts.h);
  }

  Body.prototype.setSize = function (w, h) {
    this.w = w; this.h = h;
    this.r = CFG.radius * (w + h) / 2;
    this.mass = Math.PI * this.r * this.r / 7000;
    this.invMass = 1 / this.mass;
    this.invI = 2 * this.invMass / (this.r * this.r);   // disco
  };

  function World() {
    this.bodies = [];
    this.w = global.innerWidth;
    this.h = global.innerHeight;
    this.acc = 0;
    this.pairs = true;
    this.pairsAt = 0;
    this.now = 0;
    this.pointer = { x: -9999, y: -9999, vx: 0, vy: 0, r: CFG.pointerRadius, inside: false };
  }

  World.prototype.add = function (b) { this.bodies.push(b); return b; };

  /* Al estallar salen todos del mismo punto, encimados. Si se
     resuelven los choques desde el frame 0 se empujan entre ellos y
     el estallido se vuelve un empujón horizontal. */
  World.prototype.holdPairs = function (ms) {
    this.pairs = false;
    this.pairsAt = this.now + ms / 1000;
  };

  World.prototype.resize = function (w, h) {
    this.w = w; this.h = h;
    for (var i = 0; i < this.bodies.length; i++) {
      var b = this.bodies[i];
      b.x = Math.min(Math.max(b.x, b.r), Math.max(b.r, w - b.r));
      if (b.y > h - b.r) b.y = h - b.r;
    }
  };

  World.prototype.raise = function (body) {
    var i = this.bodies.indexOf(body);
    if (i >= 0 && i !== this.bodies.length - 1) {
      this.bodies.splice(i, 1);
      this.bodies.push(body);
    }
  };

  World.prototype.step = function (dt) {
    this.acc += Math.min(dt, 0.05);
    var n = 0;
    while (this.acc >= CFG.subStep && n < CFG.maxSub) {
      this.integrate(CFG.subStep);
      this.acc -= CFG.subStep;
      n++;
    }
    if (n === CFG.maxSub) this.acc = 0;
  };

  World.prototype.integrate = function (h) {
    var bodies = this.bodies, i, b;

    for (i = 0; i < bodies.length; i++) {
      b = bodies[i];
      if (b.held) { b.angVel *= 0.85; continue; }

      b.vy += CFG.gravity * h;
      b.vx *= CFG.drag;
      b.vy *= CFG.drag;
      b.angVel *= CFG.angularDamp;

      var sp = Math.abs(b.vx) + Math.abs(b.vy);
      if (sp > CFG.maxSpeed) {
        var k = CFG.maxSpeed / sp;
        b.vx *= k; b.vy *= k;
      }
      if (b.angVel > CFG.maxAngVel) b.angVel = CFG.maxAngVel;
      else if (b.angVel < -CFG.maxAngVel) b.angVel = -CFG.maxAngVel;

      b.x += b.vx * h;
      b.y += b.vy * h;
      b.angle += b.angVel * h;
      b.onGround = false;
    }

    this.now += h;
    if (!this.pairs && this.now >= this.pairsAt) this.pairs = true;

    for (i = 0; i < CFG.iterations; i++) {
      if (this.pairs) this.solvePairs();
      this.solvePointer();
      this.solveBounds();
    }

    // El tope va aquí, después del solver: los impulsos de roce son los
    // que pueden disparar el giro, y si se limita antes no sirve de nada.
    for (i = 0; i < bodies.length; i++) {
      b = bodies[i];
      if (b.angVel > CFG.maxAngVel) b.angVel = CFG.maxAngVel;
      else if (b.angVel < -CFG.maxAngVel) b.angVel = -CFG.maxAngVel;
    }

    // el dedo pierde velocidad solo si dejó de moverse
    this.pointer.vx *= 0.86;
    this.pointer.vy *= 0.86;

    this.sleep();
  };

  World.prototype.sleep = function () {
    var bodies = this.bodies;
    for (var i = 0; i < bodies.length; i++) {
      var b = bodies[i];
      if (b.held || !b.onGround) { b.calm = 0; continue; }
      var ax = Math.abs(b.vx), ay = Math.abs(b.vy), aw = Math.abs(b.angVel);
      if (ax < CFG.sleepSpeed && ay < CFG.sleepSpeed && aw < CFG.sleepSpin) {
        b.vx = 0; b.vy = 0; b.angVel = 0; b.calm = 0;
      } else if (ax < CFG.calmSpeed && ay < CFG.calmSpeed && aw < CFG.calmSpin) {
        b.calm++;
        if (b.calm > CFG.calmSteps) { b.vx = 0; b.vy = 0; b.angVel = 0; b.calm = 0; }
      } else {
        b.calm = 0;
      }
    }
  };

  World.prototype.solveBounds = function () {
    var bodies = this.bodies;
    for (var i = 0; i < bodies.length; i++) {
      var b = bodies[i];
      if (b.held) continue;

      if (b.x - b.r < 0) {
        b.x = b.r;
        if (b.vx < 0) b.vx = -b.vx * CFG.wallRestitution;
        roce(b, -b.r, 0, 0, 1, CFG.floorFriction * 0.6, 0, 0);
      } else if (b.x + b.r > this.w) {
        b.x = this.w - b.r;
        if (b.vx > 0) b.vx = -b.vx * CFG.wallRestitution;
        roce(b, b.r, 0, 0, 1, CFG.floorFriction * 0.6, 0, 0);
      }

      if (b.y - b.r < -this.h) { b.y = b.r - this.h; if (b.vy < 0) b.vy = 0; }

      if (b.y + b.r > this.h) {
        b.y = this.h - b.r;
        b.onGround = true;
        if (b.vy > 0) {
          b.vy = -b.vy * CFG.floorRestitution;
          if (Math.abs(b.vy) < 65) b.vy = 0;
        }
        // contacto abajo del disco: aquí es donde empieza a rodar
        roce(b, 0, b.r, 1, 0, CFG.floorFriction, 0, 0);
      }
    }
  };

  World.prototype.solvePointer = function () {
    var p = this.pointer;
    if (!p.inside) return;
    var bodies = this.bodies;

    for (var i = 0; i < bodies.length; i++) {
      var b = bodies[i];
      if (b.held) continue;

      var dx = b.x - p.x, dy = b.y - p.y;
      var minD = p.r + b.r;
      var d2 = dx * dx + dy * dy;
      if (d2 >= minD * minD) continue;

      var d = Math.sqrt(d2), nx, ny;
      if (d < 0.0001) { nx = 0; ny = -1; d = 0.0001; }
      else { nx = dx / d; ny = dy / d; }

      b.x = p.x + nx * minD;
      b.y = p.y + ny * minD;

      var vn = (b.vx - p.vx) * nx + (b.vy - p.vy) * ny;
      if (vn < 0) {
        var jn = -(1 + CFG.pointerRestitution) * vn;
        b.vx += jn * nx;
        b.vy += jn * ny;
      }
      // el roce contra el dedo también los hace girar
      roce(b, -nx * b.r, -ny * b.r, -ny, nx, CFG.pointerFriction, p.vx, p.vy);
    }
  };

  World.prototype.solvePairs = function () {
    var bodies = this.bodies, n = bodies.length;

    for (var i = 0; i < n; i++) {
      var a = bodies[i];
      for (var j = i + 1; j < n; j++) {
        var b = bodies[j];

        var dx = b.x - a.x, dy = b.y - a.y;
        var minD = a.r + b.r;
        var d2 = dx * dx + dy * dy;
        if (d2 >= minD * minD || d2 === 0) continue;

        var aFixed = a.held, bFixed = b.held;
        if (aFixed && bFixed) continue;

        var d = Math.sqrt(d2);
        var nx = dx / d, ny = dy / d;
        var invSum = (aFixed ? 0 : a.invMass) + (bFixed ? 0 : b.invMass);
        if (invSum <= 0) continue;

        // separar
        var corr = Math.max(minD - d - CFG.slop, 0) * CFG.correction;
        var aShare = aFixed ? 0 : (bFixed ? 1 : 0.5);
        var bShare = bFixed ? 0 : (aFixed ? 1 : 0.5);
        a.x -= nx * corr * aShare; a.y -= ny * corr * aShare;
        b.x += nx * corr * bShare; b.y += ny * corr * bShare;

        // velocidad en el punto donde se tocan (con el giro incluido)
        var oax = nx * a.r, oay = ny * a.r;
        var obx = -nx * b.r, oby = -ny * b.r;
        var vax = a.vx - oay * a.angVel, vay = a.vy + oax * a.angVel;
        var vbx = b.vx - oby * b.angVel, vby = b.vy + obx * b.angVel;
        var rvx = vbx - vax, rvy = vby - vay;

        var vn = rvx * nx + rvy * ny;
        if (vn >= 0) {
          if (!aFixed && ny < -0.35) a.onGround = true;
          if (!bFixed && ny > 0.35) b.onGround = true;
          continue;
        }

        var jn = -(1 + CFG.pairRestitution) * vn / invSum;
        if (!aFixed) { a.vx -= jn * nx * a.invMass; a.vy -= jn * ny * a.invMass; }
        if (!bFixed) { b.vx += jn * nx * b.invMass; b.vy += jn * ny * b.invMass; }

        // roce tangencial: uno rueda sobre el otro
        var tx = -ny, ty = nx;
        var slip = rvx * tx + rvy * ty;
        var jt = -CFG.pairFriction * slip / (3 * invSum);
        if (!aFixed) {
          a.vx -= jt * tx * a.invMass; a.vy -= jt * ty * a.invMass;
          a.angVel -= (oax * (jt * ty) - oay * (jt * tx)) * a.invI;
        }
        if (!bFixed) {
          b.vx += jt * tx * b.invMass; b.vy += jt * ty * b.invMass;
          b.angVel += (obx * (jt * ty) - oby * (jt * tx)) * b.invI;
        }

        if (!aFixed && ny < -0.35) a.onGround = true;
        if (!bFixed && ny > 0.35) b.onGround = true;
      }
    }
  };

  World.prototype.render = function () {
    var bodies = this.bodies;
    for (var i = 0; i < bodies.length; i++) {
      var b = bodies[i];
      if (!b.el) continue;
      b.el.style.transform =
        'translate3d(' + (b.x - b.w / 2).toFixed(2) + 'px,' +
        (b.y - b.h / 2).toFixed(2) + 'px,0) rotate(' + b.angle.toFixed(4) + 'rad)';
      b.el.style.zIndex = i + 1;
    }
  };

  global.Fisica = { World: World, Body: Body, CFG: CFG };
})(window);
