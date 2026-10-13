/* =========================================================
   playlist.js — la playlist de Spotify

   El reproductor va escondido fuera de la pantalla: la playlist
   sólo suena de fondo. Lo que se ve en la tarjeta es una vista
   previa hecha a mano (portada + nombre + link).

   No se puede esconder con display:none ni con visibility:hidden,
   porque entonces el navegador lo deja de reproducir. Por eso se
   manda lejos con position/left. Se prende y se apaga con el
   botón de Sonido.

   OJO con lo que sí y lo que no se puede:
   - Spotify solo suelta la canción completa si quien abre la
     página tiene sesión de Spotify Premium en ese navegador.
     Al resto le suenan los adelantos de 30 segundos.
   - Los navegadores bloquean el audio que arranca solo. Por eso
     el play se pide dentro del clic del botón, que es el único
     momento en que lo permiten, pero aun así hay navegadores
     que no lo dejan pasar por venir de un iframe de otro sitio.
   - Abriendo el archivo con doble clic (file://) puede que ni
     siquiera cargue: el reproductor necesita que la página se
     sirva por http/https.

   Si algo de eso falla, el reproductor no aparece y queda el
   link de "Abrir en Spotify", que siempre funciona.
   ========================================================= */
(function (global) {
  'use strict';

  var ID = '216IrVfZewZDIIvL3HvHvS';   // playlist "¡20!"

  var control = null;
  var listo = false;
  var pendiente = false;   // se pidió sonar antes de que estuviera listo

  function montar(IFrameAPI) {
    var caja = document.getElementById('spotifyBox');
    if (!caja) return;

    IFrameAPI.createController(caja, {
      uri: 'spotify:playlist:' + ID,
      width: '100%',
      height: 152
    }, function (ctrl) {
      control = ctrl;
      listo = true;

      // Spotify monta su iframe con loading="lazy". Como el
      // reproductor va escondido, hay que quitarle lo diferido a
      // mano o se queda esperando a entrar en pantalla y nunca
      // carga: el resultado es que no suena nada.
      var ifr = caja.querySelector ? caja.querySelector('iframe') : null;
      if (!ifr) {
        var envoltura = document.getElementById('spotifyWrap');
        ifr = envoltura ? envoltura.querySelector('iframe') : null;
      }
      if (ifr) ifr.loading = 'eager';

      if (pendiente) sonar();
    });
  }

  function sonar() {
    if (!control) return;
    try { control.play(); } catch (e) { /* el navegador no dejó */ }
  }

  global.onSpotifyIframeApiReady = montar;

  global.Playlist = {
    play: function () {
      pendiente = true;
      if (listo) sonar();
    },
    pause: function () {
      pendiente = false;
      if (control) { try { control.pause(); } catch (e) {} }
    },
    listo: function () { return listo; }
  };
})(window);
