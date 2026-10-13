/* =========================================================
   veinte.js — el "20"

   La estela de seis franjas que sube hacia la derecha, como la
   del logo viejo de Apple. El número va montado al final de la
   estela y lleva las mismas franjas, en la misma diagonal.

   Las franjas rotan de color por pasos: eso es "palette
   cycling", la forma de animar de los ochenta. Cuando no
   alcanzaba la memoria para guardar varios cuadros, no se
   redibujaba nada: se cambiaba la paleta y listo.
   ========================================================= */
(function (global) {
  'use strict';

  function Veinte(contenedor, texto) {
    contenedor.innerHTML = '';

    this.estela = document.createElement('div');
    this.estela.className = 'estela';
    this.estela.setAttribute('aria-hidden', 'true');
    contenedor.appendChild(this.estela);

    this.cifra = document.createElement('span');
    this.cifra.className = 'cifra';
    this.cifra.textContent = texto;
    contenedor.appendChild(this.cifra);

    this.el = contenedor;
  }

  /* La animación de las franjas es pura CSS, así que aquí no hay
     nada que prender ni apagar. Se dejan por si main.js las llama. */
  Veinte.prototype.start = function () {};
  Veinte.prototype.stop = function () {};

  /* Al desbloquear o al sacudir: la estela entra de nuevo de golpe */
  Veinte.prototype.burst = function () {
    var el = this.el;
    el.classList.remove('barrido');
    void el.offsetWidth;
    el.classList.add('barrido');
  };

  global.Veinte = Veinte;
})(window);
