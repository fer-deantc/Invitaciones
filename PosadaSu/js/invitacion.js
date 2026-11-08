/* =========================================================
   invitacion.js — los datos, los botones y la apertura.

   Llena la página con lo que dice config.js (fechas, calle,
   enlaces de mapas, calendario y WhatsApp), arma la villa
   y define P.reveal(), que la esfera llama cuando termina
   de caer la nieve.
   ========================================================= */
(function () {
  'use strict';
  const P = window.POSADA = window.POSADA || {}, C = window.FIESTA;
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const og = new URLSearchParams(location.search).has('og');
  const enc = encodeURIComponent;
  const pad = n => String(n).padStart(2, '0');

  /* ---------- Datos ---------- */
  const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const ROMANOS = n => [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']].reduce((s, [v, r]) => { while (n >= v) { s += r; n -= v; } return s; }, '');
  const cap1 = s => s.charAt(0).toUpperCase() + s.slice(1);
  const [Y, M, D] = C.fecha.split('-').map(Number);
  const [hh, mm] = C.hora.split(':').map(Number);
  const dow = new Date(Date.UTC(Y, M - 1, D)).getUTCDay();
  const hora12 = `${hh % 12 || 12}:${pad(mm)} ${hh < 12 ? 'a.m.' : 'p.m.'}`;
  const dir = C.direccion;
  const dirCompleta = [dir.calle, dir.lote, dir.colonia, dir.ciudad, dir.pais].filter(Boolean).join(', ');
  const F = {
    anfitriones: C.anfitriones,
    fechaLarga: `${cap1(DIAS[dow])} ${D} de ${MESES[M - 1]} de ${Y}`,
    fechaPoster: `${cap1(DIAS[dow])} ${D} de ${MESES[M - 1]}`,
    fechaNum: `${pad(D)} / ${pad(M)} / ${Y}`,
    diaHora: `${cap1(DIAS[dow])} · ${hora12}`,
    hora: hora12,
    fechaPie: `${D} de ${MESES[M - 1]} de ${ROMANOS(Y)}`,
    anio: ROMANOS(Y),
    casa: C.casa,
    calle: dir.calle, lote: dir.lote, colonia: dir.colonia, ciudad: dir.ciudad
  };
  $$('[data-f]').forEach(n => { const v = F[n.dataset.f]; if (v != null) n.textContent = v; });

  /* ---------- Calendario ---------- */
  const off = (() => { const m = /([+-])(\d\d):(\d\d)/.exec(C.desfaseUTC); return (m[1] === '-' ? -1 : 1) * (+m[2] * 60 + +m[3]); })();
  const start = new Date(`${C.fecha}T${C.hora}:00${C.desfaseUTC}`);
  const end = new Date(start.getTime() + C.duracionHoras * 3600e3);
  const stamp = (d, local) => { const x = local ? new Date(d.getTime() + off * 60e3) : d; return `${x.getUTCFullYear()}${pad(x.getUTCMonth() + 1)}${pad(x.getUTCDate())}T${pad(x.getUTCHours())}${pad(x.getUTCMinutes())}00${local ? '' : 'Z'}`; };
  const iso = d => { const x = new Date(d.getTime() + off * 60e3); return `${x.getUTCFullYear()}-${pad(x.getUTCMonth() + 1)}-${pad(x.getUTCDate())}T${pad(x.getUTCHours())}:${pad(x.getUTCMinutes())}:00${C.desfaseUTC}`; };
  const evTitle = `${C.titulo} · ${C.anfitriones}`;
  const evDetails = 'Posada en casa de ' + C.casa + '. Trae lo que vayas a tomar.';
  $('#calGoogle').href = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${enc(evTitle)}&dates=${stamp(start, true)}/${stamp(end, true)}&ctz=${enc(C.zonaHoraria)}&location=${enc(dirCompleta)}&details=${enc(evDetails)}`;
  $('#calOutlook').href = `https://outlook.live.com/calendar/0/action/compose?subject=${enc(evTitle)}&startdt=${enc(iso(start))}&enddt=${enc(iso(end))}&location=${enc(dirCompleta)}&body=${enc(evDetails)}`;
  const icsText = s => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  const fold = line => { const out = []; let s = line; while (s.length > 60) { out.push(s.slice(0, 60)); s = ' ' + s.slice(60); } out.push(s); return out.join('\r\n'); };
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Su y sus hermanos//Posada//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:posada-${C.fecha}-${C.whatsapp}@invitacion`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${icsText(evTitle)}`,
    `LOCATION:${icsText(dirCompleta)}`,
    `GEO:${C.mapa.lat};${C.mapa.lng}`,
    `DESCRIPTION:${icsText(evDetails)}`,
    'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', `DESCRIPTION:${icsText('Mañana es la ' + evTitle)}`, 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR'
  ].map(fold).join('\r\n');
  $('#calApple').href = 'data:text/calendar;charset=utf-8,' + enc(ics);
  const cal = $('.cal');
  document.addEventListener('click', e => { if (cal.open && !cal.contains(e.target)) cal.open = false; });

  /* ---------- Mapas y WhatsApp ---------- */
  $('#mapGoogle').href = `https://www.google.com/maps/search/?api=1&query=${enc(C.mapa.busqueda)}`;
  $('#mapApple').href = `https://maps.apple.com/?ll=${C.mapa.lat},${C.mapa.lng}&q=${enc(evTitle)}&address=${enc(dirCompleta)}`;
  const msg = C.mensaje || `${C.casa}: confirmo que voy a la posada del ${DIAS[dow]} ${D} de ${MESES[M - 1]}. Ahí nos vemos.`;
  $('#wa').href = `https://wa.me/${C.whatsapp}?text=${enc(msg)}`;

  /* ---------- Sala de la entrada ---------- */
  P.plaqueDate = `${D} · ${ROMANOS(M)} · ${ROMANOS(Y)}`;
  P.paintRoom();
  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (!opened) P.paintRoom(); }, 250); });

  /* ---------- Música ---------- */
  const soundBtn = $('#sound');
  P.audio.onChange(on => {
    soundBtn.setAttribute('aria-pressed', String(on));
    soundBtn.setAttribute('aria-label', on ? 'Pausar música' : 'Reanudar música');
  });
  soundBtn.addEventListener('click', () => P.audio.toggle());
  document.addEventListener('visibilitychange', () => P.audio.pauseHidden(document.hidden));

  /* ---------- Apertura ---------- */
  const invite = $('#invite'), gate = $('#gate');
  let opened = false;
  P.reveal = () => {
    if (opened) return;
    opened = true; P.opened = true;
    gate.hidden = true;
    invite.inert = false;
    document.documentElement.classList.remove('locked');
    document.body.classList.add('unlocked');
    window.scrollTo(0, 0);
    if (P.villa) P.villa.start();
    P.audio.start();
    soundBtn.hidden = !P.audio.available;
    P.flurry();
  };
  // Sin 3D (teléfono muy viejo o WebGL apagado): el botón abre directo.
  P.noGlobe = () => {
    if (P.globeReady) return;
    gate.classList.add('nogl', 'ready');
    $('#open').addEventListener('click', () => { P.audio.unlock(); P.reveal(); });
  };
  setTimeout(() => { if (!P.globeReady && !opened) P.noGlobe(); }, 9000);

  const cue = $('#cue');
  cue.addEventListener('click', e => { e.preventDefault(); $('#la-noche').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); });
  addEventListener('scroll', () => cue.classList.toggle('gone', scrollY > 60), { passive: true });

  if (og) document.documentElement.classList.add('og');
})();
