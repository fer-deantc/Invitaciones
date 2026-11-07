/* =========================================================
   sonido.js — todo lo que suena.

   Efectos (cascabeles al agitar, el vidrio, la ráfaga de
   nieve) y la música. Si config.js trae una canción, suena
   esa; si no, una cajita musical toca "Noche de paz"
   (Gruber, 1818: dominio público), sintetizada aquí mismo.

   iOS solo deja sonar audio que arrancó con un toque, así
   que unlock() se llama en el toque de "Tomar la esfera" y
   deja todo listo para cuando caiga la nieve.
   ========================================================= */
(function () {
  'use strict';
  const P = window.POSADA, C = window.FIESTA;
  let ac = null, master, sfx, music, verb, el = null, elSrc = null;
  let mode = null, on = false, timer = null, loopStart = 0, idx = 0;

  function init() {
    if (ac) return ac;
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
    master = ac.createGain(); master.connect(ac.destination);
    sfx = ac.createGain(); sfx.gain.value = .9; sfx.connect(master);
    music = ac.createGain(); music.gain.value = 0; music.connect(master);
    const len = ac.sampleRate * 2.6, buf = ac.createBuffer(2, len, ac.sampleRate);
    for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.4); }
    verb = ac.createConvolver(); verb.buffer = buf;
    const wet = ac.createGain(); wet.gain.value = .34; verb.connect(wet).connect(master);
    return ac;
  }

  const env = (g, t, peak, a, d) => { g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + a + d); };
  function partial(freq, t, peak, a, d, dest, send) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    env(g, t, peak, a, d);
    o.connect(g); g.connect(dest); if (send) g.connect(verb);
    o.start(t); o.stop(t + a + d + .05);
  }
  function noise(sec) {
    const b = ac.createBuffer(1, ac.sampleRate * sec, ac.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const s = ac.createBufferSource(); s.buffer = b; return s;
  }

  /* ---------- Cajita musical: "Noche de paz" ---------- */
  const NOTE = n => { const m = /([A-G])(\d)/.exec(n); const st = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]]; return 440 * Math.pow(2, (12 * (+m[2] + 1) + st - 69) / 12); };
  const MELODY = 'G4 3 A4 1 G4 2 E4 6 G4 3 A4 1 G4 2 E4 6 D5 4 D5 2 B4 6 C5 4 C5 2 G4 6 A4 4 A4 2 C5 3 B4 1 A4 2 G4 3 A4 1 G4 2 E4 6 A4 4 A4 2 C5 3 B4 1 A4 2 G4 3 A4 1 G4 2 E4 6 D5 4 D5 2 F5 3 D5 1 B4 2 C5 6 E5 6 C5 3 G4 1 E4 2 G4 3 F4 1 D4 2 C4 12'.split(' ');
  const CHORDS = 'C C C C G G C C F F C C F F C C G G C C C G C C'.split(' ');
  const ROOT = { C: ['C3', 'G3', 'E4'], G: ['G2', 'D3', 'B3'], F: ['F2', 'C3', 'A3'] };
  const EIGHTH = .29;
  const SONG = (() => {
    const ev = [];
    let t = 0;
    for (let i = 0; i < MELODY.length; i += 2) { ev.push({ t, f: NOTE(MELODY[i]) * 2, v: .2 }); t += +MELODY[i + 1]; }
    CHORDS.forEach((c, bar) => { const r = ROOT[c]; ev.push({ t: bar * 6, f: NOTE(r[0]) * 2, v: .11 }); ev.push({ t: bar * 6 + 3, f: NOTE(r[1]) * 2, v: .07 }); ev.push({ t: bar * 6 + 3, f: NOTE(r[2]) * 2, v: .06 }); });
    ev.sort((a, b) => a.t - b.t);
    return { ev, len: t };
  })();
  function tine(fq, t, v) {
    partial(fq, t, v, .003, 2.2, music, true);
    partial(fq * 2, t, v * .22, .002, .9, music, true);
    partial(fq * 5.4, t, v * .07, .001, .22, music, false);
  }
  function schedule() {
    const ahead = ac.currentTime + .6;
    for (;;) {
      const e = SONG.ev[idx], t = loopStart + e.t * EIGHTH;
      if (t > ahead) break;
      if (t > ac.currentTime - .05) tine(e.f, t, e.v);
      if (++idx >= SONG.ev.length) { idx = 0; loopStart += SONG.len * EIGHTH + 2.6; }
    }
  }

  function fadeIn() {
    const t = ac.currentTime, v = Math.max(0, Math.min(1, C.volumen == null ? .5 : C.volumen));
    music.gain.cancelScheduledValues(t);
    music.gain.setValueAtTime(.0001, t);
    music.gain.linearRampToValueAtTime(v * (mode === 'box' ? 1.4 : 1), t + 2.5);
  }

  const changeListeners = [];
  const emit = () => changeListeners.forEach(fn => fn(on));

  P.audio = {
    onChange(fn) { changeListeners.push(fn); },
    get playing() { return on; },
    get available() { return !!ac; },

    // Llamar dentro de un toque del usuario.
    unlock() {
      if (!init()) return;
      if (ac.state === 'suspended') ac.resume();
      const b = ac.createBuffer(1, 1, 22050), s = ac.createBufferSource();
      s.buffer = b; s.connect(ac.destination); s.start(0);
      if (C.musica && !el) {
        el = document.getElementById('music');
        el.src = C.musica;
        el.addEventListener('error', () => { if (mode === 'file') { mode = 'box'; if (on) { on = false; P.audio.start(); } } else el.dataset.bad = '1'; });
        try { elSrc = ac.createMediaElementSource(el); elSrc.connect(music); } catch (e) { /* sin ruteo: suena directo */ }
        el.muted = true;
        const p = el.play();
        if (p && p.then) p.then(() => { el.pause(); el.currentTime = 0; el.muted = false; }).catch(() => { el.muted = false; });
      }
    },

    jingle(k = 1) {
      if (!ac) return;
      const t = ac.currentTime, n = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) {
        const t0 = t + Math.random() * .07, fq = 2300 + Math.random() * 2600, v = .028 * k * (.6 + Math.random() * .6);
        partial(fq, t0, v, .002, .22 + Math.random() * .2, sfx, true);
        partial(fq * 1.51, t0, v * .5, .002, .14, sfx, false);
        partial(fq * 2.74, t0, v * .3, .001, .08, sfx, false);
      }
    },

    clink() {
      if (!ac) return;
      const t = ac.currentTime + .01;
      [[1760, .16, 2.4], [1760 * 2.32, .09, 1.5], [1760 * 4.25, .05, .8], [1760 * 6.8, .025, .45], [880, .05, 1.8]].forEach(([fq, v, d]) => partial(fq, t, v, .002, d, sfx, true));
    },

    whoosh() {
      if (!ac) return;
      const t = ac.currentTime, s = noise(3.2), bp = ac.createBiquadFilter(), lp = ac.createBiquadFilter(), g = ac.createGain();
      bp.type = 'bandpass'; bp.Q.value = .7;
      bp.frequency.setValueAtTime(380, t); bp.frequency.exponentialRampToValueAtTime(2600, t + .9); bp.frequency.exponentialRampToValueAtTime(520, t + 3);
      lp.type = 'lowpass'; lp.frequency.value = 5200;
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.32, t + .7); g.gain.exponentialRampToValueAtTime(.0001, t + 3.1);
      s.connect(bp).connect(lp).connect(g); g.connect(sfx); g.connect(verb);
      s.start(t); s.stop(t + 3.2);
    },

    start() {
      if (!ac || on) return;
      if (ac.state === 'suspended') ac.resume();
      if (!mode) mode = C.musica && el && !el.dataset.bad ? 'file' : 'box';
      on = true;
      if (mode === 'file') {
        el.loop = true;
        if (!elSrc) el.volume = Math.max(0, Math.min(1, C.volumen));
        const p = el.play();
        if (p && p.catch) p.catch(() => { mode = 'box'; on = false; P.audio.start(); });
      } else {
        loopStart = ac.currentTime + .2; idx = 0;
        clearInterval(timer); timer = setInterval(schedule, 90); schedule();
      }
      fadeIn();
      emit();
    },

    toggle() {
      if (!ac) return;
      if (on) {
        on = false;
        if (mode === 'file') el.pause(); else ac.suspend();
      } else {
        on = true;
        if (mode === 'file') { ac.resume(); el.play(); } else ac.resume();
      }
      emit();
    },

    pauseHidden(hidden) {
      if (!ac || !on) return;
      if (hidden) { if (mode === 'file') el.pause(); ac.suspend(); }
      else { ac.resume(); if (mode === 'file') el.play(); }
    }
  };
})();
