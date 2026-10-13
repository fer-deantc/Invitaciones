/* =========================================================
   main.js — carga, explosión, arrastre, cuenta regresiva
   ========================================================= */
(function () {
  'use strict';

  /* =========================================================
     LOS DATOS DE LA FIESTA
     De aquí salen la cuenta regresiva y el archivo del calendario.
     Si cambias la fecha aquí, cambia también el texto en index.html
     (hero__date, la tarjeta de Hora, topbar__date y lock__eyebrow).
     Los meses van de 0 a 11: 7 = agosto.
     ========================================================= */
  var FIESTA = new Date(2026, 7, 29, 16, 30, 0);   // sábado 29 de agosto de 2026, 16:30
  var FIESTA_FIN = new Date(2026, 7, 29, 22, 0, 0); // sólo para el calendario
  var TITULO_EVENTO = 'Cumpleaños 20 de Fer';
  var DIRECCION = 'Cerrada de La Romería 47, Colina del Sur, Álvaro Obregón, Ciudad de México';

  /* Número de WhatsApp: lada de país + los 10 dígitos, sin +, sin
     espacios y sin guiones. +52 55 2173 0164 queda así: */
  var WHATSAPP = '525521730164';
  var MENSAJE_RSVP = 'Hola Fer, confirmo que voy a tu cumpleaños el sábado 29. ¡Nos vemos!';

  var TOTAL_STICKERS = 18;                         // assets/stickers/s1..s18.png

  var $ = function (id) { return document.getElementById(id); };
  var lock = $('lock'),
      btnUnlock = $('btnUnlock'),
      layer = $('stickerLayer'),
      hud = $('hud'),
      btnShake = $('btnShake'),
      btnSound = $('btnSound'),
      canvas = $('scraps');

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =========================================================
     1. Precarga
     ========================================================= */
  var loaded = [];
  var pending = TOTAL_STICKERS;

  function done() {
    pending--;
    if (pending <= 0 && loaded.length) {
      btnUnlock.disabled = false;
      btnUnlock.focus({ preventScroll: true });
    }
  }

  for (var i = 1; i <= TOTAL_STICKERS; i++) {
    (function (n) {
      var img = new Image();
      img.onload = function () {
        loaded.push({ src: img.src, w: img.naturalWidth, h: img.naturalHeight });
        done();
      };
      img.onerror = done;
      img.src = 'assets/stickers/s' + n + '.png';
    })(i);
  }
  setTimeout(function () { if (btnUnlock.disabled && loaded.length) btnUnlock.disabled = false; }, 6000);

  /* =========================================================
     2. El "20"
     ========================================================= */
  var mag = new Veinte($('bignum'), '20');
  if (!reduce) mag.start();

  /* =========================================================
     3. Mundo físico
     ========================================================= */
  var world = new Fisica.World();
  var scraps = new Scraps(canvas);
  var abierto = false;

  function stickerSize() {
    var vw = window.innerWidth;
    if (vw < 420) return 56;
    if (vw < 760) return 68;
    if (vw < 1100) return 82;
    return 92;
  }

  function crearStickers() {
    layer.innerHTML = '';
    world.bodies.length = 0;

    var base = stickerSize();
    var cx = window.innerWidth / 2;
    var cy = window.innerHeight * 0.46;

    for (var k = 0; k < loaded.length; k++) {
      var d = loaded[k];
      var alto = base * (0.86 + Math.random() * 0.34);
      var ancho = Math.round(alto * (d.w / d.h));
      alto = Math.round(alto);

      var el = document.createElement('div');
      el.className = 'sticker';
      el.style.width = ancho + 'px';
      el.style.height = alto + 'px';

      var img = document.createElement('img');
      img.src = d.src;
      img.alt = '';
      img.draggable = false;
      el.appendChild(img);
      layer.appendChild(el);

      var body = new Fisica.Body({
        x: cx, y: cy,
        w: ancho, h: alto,
        angle: (Math.random() - 0.5) * 0.7,
        el: el
      });
      world.add(body);
      conectarArrastre(el, body);
    }
  }

  /* Explosión radial. Ahora que ruedan, el montón se aplana solo,
     así que ya no hace falta apuntarles: salen en todas direcciones
     con un sesgo hacia arriba y la gravedad hace el resto. */
  function explotar(fuerza) {
    fuerza = fuerza || 1;
    var W = window.innerWidth, H = window.innerHeight;
    var cx = W / 2, cy = H * 0.46;
    var n = world.bodies.length;
    if (!n) return;

    // se abren menos de lado que de alto: si no, rebotan en las paredes
    var lateral = 0.46 + 0.22 * Math.min(1, W / 1200);

    for (var k = 0; k < n; k++) {
      var b = world.bodies[k];
      var ang = (k / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
      var sp = (420 + Math.random() * 620) * fuerza;

      b.x = cx + (Math.random() - 0.5) * 34;
      b.y = cy + (Math.random() - 0.5) * 34;
      b.vx = Math.cos(ang) * sp * lateral;
      b.vy = Math.sin(ang) * sp - 340 * fuerza;
      b.angVel = 0;   // el giro lo van agarrando del roce, no de aquí
      b.held = false;
      b.el.classList.remove('is-held');
    }

    // que no se estorben mientras salen del mismo punto
    world.holdPairs(220);

    scraps.burst(cx, cy, 90);
    mag.burst();
  }

  /* =========================================================
     4. Arrastre y empujón
     ========================================================= */
  function conectarArrastre(el, body) {
    el.addEventListener('pointerdown', function (ev) {
      ev.preventDefault();
      body.held = true;
      body.grabX = ev.clientX - body.x;
      body.grabY = ev.clientY - body.y;
      body.lastX = ev.clientX;
      body.lastY = ev.clientY;
      body.vx = 0; body.vy = 0;
      el.classList.add('is-held');
      world.raise(body);
      try { el.setPointerCapture(ev.pointerId); } catch (e) {}
      beep(620, 0.045, 0.035);
    });

    el.addEventListener('pointermove', function (ev) {
      if (!body.held) return;
      ev.preventDefault();
      body.vx = (ev.clientX - body.lastX) * 38;
      body.vy = (ev.clientY - body.lastY) * 38;
      body.lastX = ev.clientX;
      body.lastY = ev.clientY;
      body.x = ev.clientX - body.grabX;
      body.y = ev.clientY - body.grabY;
    });

    function soltar(ev) {
      if (!body.held) return;
      body.held = false;
      el.classList.remove('is-held');
      var max = 2200;
      var sp = Math.hypot(body.vx, body.vy);
      if (sp > max) { body.vx *= max / sp; body.vy *= max / sp; }
      try { el.releasePointerCapture(ev.pointerId); } catch (e) {}
    }
    el.addEventListener('pointerup', soltar);
    el.addEventListener('pointercancel', soltar);
  }

  /* El cursor entra al mundo como un obstáculo redondo con velocidad
     propia: no los jala con un campo de fuerzas, los empuja. Por eso
     hay que medir qué tan rápido se está moviendo. */
  var ultimoMov = 0;
  window.addEventListener('pointermove', function (ev) {
    var p = world.pointer;
    var ahora = performance.now();
    var dt = (ahora - ultimoMov) / 1000;
    ultimoMov = ahora;

    if (p.inside && dt > 0.0005 && dt < 0.12) {
      var nvx = (ev.clientX - p.x) / dt;
      var nvy = (ev.clientY - p.y) / dt;
      var tope = Fisica.CFG.pointerMaxSpeed;
      if (nvx > tope) nvx = tope; else if (nvx < -tope) nvx = -tope;
      if (nvy > tope) nvy = tope; else if (nvy < -tope) nvy = -tope;
      p.vx = p.vx * 0.35 + nvx * 0.65;
      p.vy = p.vy * 0.35 + nvy * 0.65;
    } else {
      p.vx = 0; p.vy = 0;
    }

    p.x = ev.clientX;
    p.y = ev.clientY;
    p.inside = true;
  }, { passive: true });

  function soltarPuntero(ev) {
    // con el dedo no hay "pasar por encima": al levantarlo, se va
    if (!ev || ev.pointerType !== 'mouse') {
      world.pointer.inside = false;
      world.pointer.vx = 0;
      world.pointer.vy = 0;
    }
  }
  window.addEventListener('pointerup', soltarPuntero);
  window.addEventListener('pointercancel', soltarPuntero);
  window.addEventListener('pointerleave', function () { world.pointer.inside = false; });
  window.addEventListener('blur', function () { world.pointer.inside = false; });

  /* =========================================================
     5. Sonido sintetizado
     ========================================================= */
  var actx = null, sonido = true;

  function audio() {
    if (!actx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) actx = new AC();
    }
    if (actx && actx.state === 'suspended') actx.resume();
    return actx;
  }

  function beep(freq, dur, vol) {
    if (!sonido) return;
    var a = audio(); if (!a) return;
    var o = a.createOscillator(), g = a.createGain();
    o.type = 'triangle';
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol || 0.04, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
    o.connect(g); g.connect(a.destination);
    o.start(); o.stop(a.currentTime + dur);
  }

  function boom() {
    if (!sonido) return;
    var a = audio(); if (!a) return;
    var t = a.currentTime;

    var o = a.createOscillator(), g = a.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(165, t);
    o.frequency.exponentialRampToValueAtTime(26, t + 0.55);
    g.gain.setValueAtTime(0.36, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
    o.connect(g); g.connect(a.destination);
    o.start(t); o.stop(t + 0.72);

    var len = Math.floor(a.sampleRate * 0.4);
    var buf = a.createBuffer(1, len, a.sampleRate);
    var ch = buf.getChannelData(0);
    for (var i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    var src = a.createBufferSource(); src.buffer = buf;
    var f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1350; f.Q.value = 0.8;
    var ng = a.createGain(); ng.gain.value = 0.22;
    src.connect(f); f.connect(ng); ng.connect(a.destination);
    src.start(t);
  }

  /* El botón manda sobre las dos cosas: los golpes sintetizados y la
     playlist. Si alguien silencia, espera que se calle todo. */
  btnSound.addEventListener('click', function () {
    sonido = !sonido;
    btnSound.textContent = sonido ? 'Sonido' : 'Silencio';
    btnSound.setAttribute('aria-pressed', String(sonido));

    if (window.Playlist) {
      if (sonido) window.Playlist.play();
      else window.Playlist.pause();
    }
    if (sonido) beep(760, 0.05, 0.04);
  });

  /* =========================================================
     6. Desbloqueo
     ========================================================= */
  btnUnlock.addEventListener('click', function () {
    if (abierto) return;
    abierto = true;

    audio();
    crearStickers();

    document.body.classList.add('is-open');
    document.body.classList.remove('is-locked');
    hud.hidden = false;

    boom();
    explotar(1);

    // La playlist arranca aquí, dentro del clic: es el único momento
    // en que los navegadores dejan que empiece a sonar algo solo.
    if (sonido && window.Playlist) window.Playlist.play();

    if (!reduce) {
      document.body.classList.add('shake');
      setTimeout(function () { document.body.classList.remove('shake'); }, 620);
    }
    setTimeout(function () { lock.style.display = 'none'; }, 700);
  });

  btnShake.addEventListener('click', function () {
    if (!abierto) return;
    boom();
    explotar(0.9);
    if (!reduce) {
      document.body.classList.add('shake');
      setTimeout(function () { document.body.classList.remove('shake'); }, 620);
    }
  });

  /* =========================================================
     7. RSVP por WhatsApp
     El href se pone aquí y no en el HTML para que el número viva
     en un solo lugar. Es un enlace de verdad, no un window.open:
     los navegadores de celular bloquean las ventanas emergentes.
     ========================================================= */
  var btnRsvp = $('btnRsvp');
  if (WHATSAPP) {
    btnRsvp.href = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(MENSAJE_RSVP);
    btnRsvp.target = '_blank';
    btnRsvp.rel = 'noopener';
    btnRsvp.addEventListener('click', function () { beep(520, 0.07, 0.05); });
  } else {
    btnRsvp.addEventListener('click', function (ev) {
      ev.preventDefault();
      $('rsvpHint').textContent = 'Falta el número: ponlo en WHATSAPP, en js/main.js';
    });
  }

  /* =========================================================
     7b. Agregar al calendario
     Se arma un archivo .ics con los mismos datos de arriba, así no
     hay forma de que la página y el calendario digan cosas distintas.
     Va sin zona horaria a propósito: "16:30" queda como hora local,
     que es justo lo que quieres para una fiesta.
     ========================================================= */
  function dosDig(n) { return n < 10 ? '0' + n : '' + n; }

  function fechaLocal(d) {
    return d.getFullYear() + dosDig(d.getMonth() + 1) + dosDig(d.getDate()) +
           'T' + dosDig(d.getHours()) + dosDig(d.getMinutes()) + '00';
  }
  function fechaUTC(d) {
    return d.getUTCFullYear() + dosDig(d.getUTCMonth() + 1) + dosDig(d.getUTCDate()) +
           'T' + dosDig(d.getUTCHours()) + dosDig(d.getUTCMinutes()) +
           dosDig(d.getUTCSeconds()) + 'Z';
  }
  // el formato .ics pide escapar comas, puntos y comas y diagonales
  function esc(s) {
    return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;')
                    .replace(/,/g, '\\,').replace(/\n/g, '\\n');
  }

  /* El estándar pide que ninguna línea pase de 75 octetos; las que se
     pasan se parten y la continuación arranca con un espacio. La
     dirección se pasa, y hay que contar en bytes, no en letras, porque
     los acentos ocupan dos. */
  function doblar(linea) {
    if (typeof TextEncoder === 'undefined') return linea;
    var enc = new TextEncoder();
    if (enc.encode(linea).length <= 75) return linea;

    var partes = [], actual = '', usados = 0, tope = 75;
    for (var i = 0; i < linea.length; i++) {
      var ch = linea[i];
      // los pares suplentes (emoji) no se pueden separar
      if (ch >= '\uD800' && ch <= '\uDBFF' && i + 1 < linea.length) ch += linea[++i];
      var n = enc.encode(ch).length;
      if (usados + n > tope) {
        partes.push(actual);
        actual = ' '; usados = 1;
      }
      actual += ch; usados += n;
    }
    partes.push(actual);
    return partes.join('\r\n');
  }

  function archivoCalendario() {
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Cumple de Fer//ES',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:cumple-20-fer-20260829@cumpledefer',
      'DTSTAMP:' + fechaUTC(new Date()),
      'DTSTART:' + fechaLocal(FIESTA),
      'DTEND:' + fechaLocal(FIESTA_FIN),
      'SUMMARY:' + esc(TITULO_EVENTO),
      'LOCATION:' + esc(DIRECCION),
      'DESCRIPTION:' + esc('Una reunión tranquila para platicar, escuchar música y pasar la tarde.'),
      'END:VEVENT',
      'END:VCALENDAR'
    ].map(doblar).join('\r\n') + '\r\n';
  }

  var btnCal = $('btnCal');
  if (btnCal) {
    btnCal.addEventListener('click', function () {
      beep(660, 0.06, 0.045);
      var blob = new Blob([archivoCalendario()], { type: 'text/calendar;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'cumple-de-fer.ics';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1500);
    });
  }

  /* =========================================================
     8. Cuenta regresiva
     ========================================================= */
  function tick() {
    var ms = FIESTA - new Date();
    if (ms < 0) ms = 0;
    var s = Math.floor(ms / 1000);
    var pad = function (v) { return v < 10 ? '0' + v : '' + v; };
    $('cd-d').textContent = pad(Math.floor(s / 86400));
    $('cd-h').textContent = pad(Math.floor((s % 86400) / 3600));
    $('cd-m').textContent = pad(Math.floor((s % 3600) / 60));
    $('cd-s').textContent = pad(s % 60);
  }
  tick();
  setInterval(tick, 1000);

  /* =========================================================
     9. Bucle
     ========================================================= */
  var prev = performance.now();
  function loop(now) {
    var dt = (now - prev) / 1000;
    prev = now;
    if (dt > 0.1) dt = 0.1;

    if (abierto) {
      world.step(dt);
      world.render();
    }
    scraps.update(dt);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  /* =========================================================
     10. Resize
     ========================================================= */
  var rt = null;
  window.addEventListener('resize', function () {
    scraps.resize();
    world.resize(window.innerWidth, window.innerHeight);
    clearTimeout(rt);
    rt = setTimeout(function () {
      if (!abierto) return;
      var base = stickerSize();
      for (var i = 0; i < world.bodies.length; i++) {
        var b = world.bodies[i];
        var ratio = b.w / b.h;
        var alto = Math.round(base * (0.86 + (i % 5) * 0.07));
        var ancho = Math.round(alto * ratio);
        b.setSize(ancho, alto);
        b.el.style.width = ancho + 'px';
        b.el.style.height = alto + 'px';
      }
    }, 220);
  });

})();
