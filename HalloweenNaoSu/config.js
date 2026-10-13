/* =========================================================
   Datos de la fiesta. Todo lo que cambie va aquí.

   La página lee este archivo al abrirse: fecha, hora,
   dirección, mapas, calendario y WhatsApp salen de aquí.
   Lo único que NO lee son las etiquetas "og" de index.html
   (lo que muestra WhatsApp al compartir el enlace): si
   cambia la fecha o la hora, cámbialas también ahí.
   ========================================================= */
window.FIESTA = {
  titulo: 'Fiesta de Halloween',
  anfitrionas: 'Nao y Su',
  // En casa de quién es la fiesta.
  casa: 'Su',

  // Fecha y hora de inicio, en horario de la Ciudad de México.
  fecha: '2026-10-24',
  hora: '19:30',
  // No sabemos a qué hora termina: el calendario reserva estas horas.
  duracionHoras: 5,
  zonaHoraria: 'America/Mexico_City',
  // La CDMX ya no cambia de horario: siempre es UTC−6.
  desfaseUTC: '-06:00',

  direccion: {
    calle: 'Cerrada 2a. de Ejido',
    lote: 'Mz 111 Lt 12A',
    colonia: 'Santa María Aztahuacan',
    ciudad: '09500 Iztapalapa, CDMX',
    pais: 'México'
  },
  // Google y Apple no reconocen "Mz 111 Lt 12A"; los mapas usan la
  // calle y estas coordenadas (verificadas en ambos el 5 de octubre, ya con la 2a. cerrada).
  mapa: {
    busqueda: '2a. Cerrada de Ejido, Santa María Aztahuacan, 09500 Iztapalapa, CDMX',
    lat: 19.3503113,
    lng: -99.0260229
  },

  // WhatsApp: código de país + número, sin espacios ni "+".
  whatsapp: '525549184567',
  // Mensaje que ya viene escrito al abrir WhatsApp.
  mensaje: 'Nao, Su: confirmo que voy a la Fiesta de Halloween del sábado 24 de octubre. Ahí nos vemos.',

  musica: 'audio/thriller.mp3',
  // De 0 a 1.
  volumen: 0.45
};
