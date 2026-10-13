# Fer · Veinte — invitación web

## 🔗 Está publicada aquí

### https://fer-deantc.github.io/Invitaciones/CumpleFer/

Ese es el link que se manda por WhatsApp. **Compártelo desde ahí, no el archivo**: la
playlist sólo suena cuando la página se sirve por internet, no abriéndola como archivo.

**Para actualizarla:** doble clic en **`publicar.command`**. Sube lo que hayas cambiado y
en un minuto se ve en línea. Si no hay cambios, te lo dice y no hace nada.

Lleva etiqueta `noindex` y un `robots.txt`, así que Google no la levanta. Aun así, quien
tenga el link ve tu dirección y tu teléfono, igual que en cualquier invitación: mándalo
sólo a quien invitas.

Para probar cambios antes de subirlos puedes abrir `index.html` con doble clic, pero ojo:
así **no** suena la playlist.

---

---

## Mapa de la carpeta

```
260824 Cumpleaños Fer/
│
├── LÉEME.md              Este archivo
├── publicar.command      Doble clic para subir los cambios a internet
├── robots.txt            Le dice a Google que no indexe la página
├── index.html            LA PÁGINA. Aquí van todos los textos
│
├── css/
│   └── style.css         Colores, tipografías, tamaños, acomodo
│
├── js/
│   ├── main.js           El que manda: junta todo y aquí van los datos editables
│   ├── physics.js        Cómo caen, chocan y ruedan los stickers
│   ├── veinte.js         El "20" y los haces de color
│   ├── scraps.js         Los papelitos de colores de la explosión
│   └── playlist.js       El reproductor de Spotify
│
├── assets/
│   ├── stickers/         Los 18 stickers que usa la página (s1.png … s18.png)
│   └── playlist.jpg      Portada de la playlist, para la vista previa
│
└── Material original/    NO lo usa la página. Es el archivo muerto
    ├── Stickers Terminados/   Los 18 stickers en tamaño original
    └── Fotos originales/      Las fotos de donde salieron los stickers
```

**Los cinco de arriba son la página.** `Material original/` es solo respaldo: pesa 64 MB
contra los 3 MB de todo lo demás. Si algún día subes la invitación a internet o se la
pasas a alguien, manda nada más `index.html`, `css/`, `js/` y `assets/`.

> **Antes de publicarla:** la página trae tu dirección y tu WhatsApp. Está bien para
> mandarla por chat a quien invitas, pero si la subes a un link público cualquiera puede
> encontrarla, y Google la puede indexar. Si la vas a hospedar, que sea con una URL que
> no se adivine y, de preferencia, con `noindex`.

---

## El botón de confirmar

Lleva a tu WhatsApp con el mensaje ya escrito. Los dos datos están en `js/main.js`,
hasta arriba:

```js
var WHATSAPP     = '525521730164';   // lada de país + 10 dígitos, sin + ni espacios
var MENSAJE_RSVP = 'Hola Fer, confirmo que voy a tu cumpleaños el sábado 29. ¡Nos vemos!';
```

Si algún día el link deja de abrir tu chat, prueba metiendo un `1` después del `52`
(`5215521730164`): es un formato viejo que algunos números mexicanos todavía usan.

---

## Los datos de la fiesta

Fecha, hora, dirección y título del evento viven en **un solo lugar**, hasta arriba de
`js/main.js`:

```js
var FIESTA     = new Date(2026, 7, 29, 16, 30, 0);   // sábado 29 de agosto, 16:30
var FIESTA_FIN = new Date(2026, 7, 29, 22, 0, 0);    // sólo para el calendario
var DIRECCION  = 'Cerrada de La Romería 47, Colina del Sur, Álvaro Obregón, Ciudad de México';
```

De ahí salen la cuenta regresiva y el archivo del calendario. **Los meses van de 0 a 11**,
así que 7 = agosto.

Si cambias la fecha, cambia también el texto que se lee en `index.html`, que aparece en
cuatro lugares: `hero__date`, la tarjeta de **Hora**, `topbar__date` y `lock__eyebrow`.

Para editar cualquier otro texto, busca la sección **El Plan** en `index.html`. Cada dato
es una tarjeta así:

```html
<div class="card">
  <dt class="card__label">Lugar</dt>
  <dd class="card__val">Mi casa</dd>              <!-- ← el dato -->
  <dd class="card__note">La dirección…</dd>       <!-- ← la letra chica -->
</div>
```

Ya no queda ninguna tarjeta pendiente.

### Los enlaces de mapas
Están en la tarjeta de **Lugar**, uno para Apple Maps y otro para Google Maps. Los dos
buscan por dirección, no por coordenadas. Si cambias de domicilio hay que volver a armar
las dos URLs con la dirección codificada; lo más fácil es abrir el lugar en cada mapa y
copiar el link que te dan para compartir.

### El botón de "Agregar al Calendario"
Arma un archivo `.ics` al vuelo con los datos de arriba, así que **no hay forma de que la
página y el calendario digan cosas distintas**. Ese archivo lo entienden tanto el
Calendario de Apple como Google Calendar.

Va **sin zona horaria a propósito**: "16:30" queda como hora local. Para una fiesta es lo
correcto, y evita que a alguien con el celular en otro huso le aparezca a otra hora.

El evento se guarda de 16:30 a 22:00. Si quieres otra hora de término, cambia
`FIESTA_FIN`.

---

## La playlist

En la tarjeta se ve una **vista previa hecha a mano**: la portada (`assets/playlist.jpg`),
el nombre y un link. El reproductor de Spotify de verdad está ahí, pero **escondido**:
sólo sirve para que la música suene de fondo.

Esconderlo tiene dos trampas, y hay que esquivar las dos a la vez:

1. **No se puede usar `display:none` ni `visibility:hidden`**, porque entonces el
   navegador lo deja de reproducir.
2. **Tampoco se puede mandar fuera de la pantalla** (a un `left:-10000px`, por ejemplo).
   El iframe de Spotify viene con `loading="lazy"`, y un iframe diferido que nunca entra
   al viewport no carga nunca: el reproductor se queda mudo sin dar ningún error.

La solución: se queda en una esquina de la pantalla, del tamaño que Spotify pide, pero
con `opacity: 0` y detrás de todo. Y además `js/playlist.js` le quita lo diferido a mano
(`ifr.loading = 'eager'`) en cuanto Spotify monta el iframe.

Como no se ve el reproductor, **el botón "Sonido" del HUD es el único control**. Manda
sobre las dos cosas: los golpes de la explosión y la playlist.

**Si cambias la portada en Spotify, hay que volver a bajarla**: la página no la jala en
vivo, usa la copia de `assets/playlist.jpg`. Y si cambias de playlist, además hay que
tocar el `ID` en `js/playlist.js` y el `href` del link en `index.html`.

La portada actual es vertical, no cuadrada, así que en el CSS se recorta un poco hacia
arriba (`object-position` en `.disco__arte`) para no cortar la cara. Si pones una
cuadrada, puedes quitar esa línea.

### Sobre que la música arranque sola
La página le pide a Spotify que empiece a sonar en el mismo instante del clic del botón
de desbloquear, porque es el único momento en que los navegadores permiten que algo
empiece a sonar solo. Dicho eso, **no está garantizado que suene**, y no es algo que se
pueda arreglar desde el código:

- Spotify solo suelta la canción completa si quien abre la página tiene sesión de
  **Spotify Premium** en ese mismo navegador. Al resto le suenan los adelantos de 30
  segundos.
- Aunque el clic cuenta como permiso, hay navegadores que de todos modos bloquean el
  audio cuando viene de un iframe de otro sitio.
- **Abriendo el archivo con doble clic (`file://`) es probable que ni siquiera cargue.**
  Necesita que la página se sirva por http o https.

Si algo de eso falla, no se rompe nada: la vista previa y el link se ven igual, nada más
que sin música.

---

## Los stickers

Los que usa la página van en `assets/stickers/` como `s1.png`, `s2.png`, … sin saltarse
números. Salen de `Material original/Stickers Terminados/`, recortados y reducidos a
~430 px de alto: los originales pesaban 38 MB juntos y estos 2.9 MB, que es la
diferencia entre que la página abra al instante en un celular o que no abra.

Si agregas o quitas alguno, cambia `TOTAL_STICKERS` en `js/main.js`. Deben tener fondo
transparente y sin márgenes vacíos alrededor, si no la física los ve más grandes de lo
que se ven.

### Cómo se comportan
Son una **alberca de pelotas**: cada sticker es un disco que rueda.

El giro nunca se inventa. No hay una sola línea que le meta rotación al azar a un
sticker: toda la rotación sale del roce en los contactos, contra el piso, contra otro
sticker o contra el dedo. Si un sticker gira es porque se está frotando contra algo.

La explosión es radial: salen en todas direcciones con un sesgo hacia arriba y la
gravedad hace el resto. Como ruedan, el montón se aplana solo.

El cursor no es un imán, es un obstáculo: entra al mundo como un círculo con velocidad
propia que de verdad los empuja y los hace rodar por fricción. Por eso responde directo.

### Para picarle
Todo está en el objeto `CFG`, hasta arriba de `js/physics.js`:

| Valor | Qué hace |
|---|---|
| `gravity` | qué tan rápido caen |
| `drag` | resistencia del aire. Casi 1 a propósito: así la caída se siente pesada |
| `floorRestitution` | qué tanto rebotan contra el piso |
| `wallRestitution` | rebote contra los lados |
| `floorFriction`, `pairFriction`, `pointerFriction` | **de aquí sale la rodadura.** En 0 dejan de girar por completo |
| `maxAngVel` | tope de giro. Se aplica después del solver, que es donde importa |
| `radius` | qué tan chico es el disco respecto al dibujo. Los stickers son papel y se enciman; si lo subes a 0.5 dejan de traslaparse y el montón se vuelve una torre |
| `iterations` | pasadas del solver. Al menos tantas como capas tenga el montón |
| `sleepSpeed`, `calmSpeed`, `calmSteps` | cuándo se apagan. Sin esto vibran para siempre |
| `pointerRadius` | qué tan grande es la "mano" que los empuja |

El tamaño de los stickers está en `stickerSize()`, en `js/main.js`.

Medido corriendo la física fuera del navegador (6 tamaños de pantalla × 6 arranques
distintos): se asientan en ~2.5 s, el montón ocupa entre 10 % y 19 % del alto de la
ventana, y al pasar el cursor por encima los 18 se mueven, con un desplazamiento
promedio de 480 a 580 px en escritorio.

---

## El "20"

Es la **estela de seis franjas** del logo viejo de Apple: sube hacia la derecha y termina
en el número, igual que terminaba en la manzana. El "20" lleva las mismas franjas, en la
misma diagonal.

Está armado en dos piezas, en `css/style.css`:

- **`.estela`** es una cinta girada -17°. Adentro las franjas son horizontales, y al
  girar la cinta quedan en la diagonal. Lleva una máscara que la desvanece por la cola y
  **la corta al llegar al número**: si la dejas seguir de largo, le pasa por encima al
  titular. Por eso `.bignum` también lleva `overflow: hidden`.
- **`.cifra`** es el número con el degradado a 160°, que da exactamente esa misma
  inclinación, recortado sobre el texto.

Los colores **rotan por pasos**, y eso tiene nombre: **palette cycling**. Era la forma de
animar en los ochenta, cuando no alcanzaba la memoria para guardar varios cuadros: en
lugar de redibujar, se cambiaba la paleta y el dibujo parecía moverse. Aquí el degradado
lleva dos arcoíris seguidos y mide el doble que la caja, así que al recorrerlo de 0 a
100 % pasa exactamente un arcoíris, y `steps(6)` salta una franja a la vez.

**El `steps(6)` es lo importante.** Si se lo quitas se vuelve un degradado que se desliza
suavecito y pierde toda la gracia: deja de parecer de época.

Un detalle que cuesta ver: `.cifra` lleva `line-height: .72`. Si la caja del texto es más
alta que las cifras, los números sólo alcanzan a tomar tres o cuatro de las seis franjas.

---

## El diseño

Todo está basado en los anuncios de Apple de los ochenta y noventa, sobre todo la
campaña de la **iMac G3** (1998-2001). Tres decisiones sostienen el resto, y si tocas una
se cae el efecto:

**El fondo es hueso, no blanco.** `--papel: #F0F1EB`. Los anuncios impresos de Apple
nunca eran blanco puro, y ese tono cálido es la mitad de la sensación de época.

**Una sola tipografía, con serifas.** Apple usó Apple Garamond en absolutamente todo
entre 1984 y 2002: titulares, cuerpo y hasta las fichas técnicas. Esa tipografía no es
libre, así que la página usa **EB Garamond**, que es lo más cercano que hay. Por eso no
hay ninguna sans: meter una rompería el periodo.

Todo va en peso normal, que es como se veían los anuncios. Como el trazo es fino, **los
grises tienen que ir oscuros** (`--tinta-2` y `--tinta-3`): si los aclaras, el texto deja
de leerse.

La única excepción es el **"hola."** de la pantalla de bloqueo, que va en una tipografía
de mano. Es el saludo con el que arrancó el Macintosh en 1984, y que la iMac repitió en
el 98 como "hello (again)".

**Aire.** Un anuncio de Apple era media página vacía, el producto y tres palabras. Los
márgenes grandes no son decoración, son el estilo.

Los colores están en `:root`, en `css/style.css`:
- Los **cinco sabores** de la iMac de 1999: `--fresa`, `--uva`, `--lima`, `--mandarina`
  y `--mora`, más el `--bondi` del modelo original de 1998. Cada tarjeta de "El Plan"
  toma uno para su etiqueta.
- El **arcoíris del logo viejo**, `--r1` a `--r6`, de verde a azul. Aparece en la franja
  de hasta arriba, en las franjitas del pie y de la portada, y en el "20".

El botón principal es un botón **Aqua**, el estilo "lickable" que estrenó Mac OS X justo
en esa época: el degradado del fondo y el brillo de arriba (`.btn::after`) son eso.

### Los guiños a Apple
Están repartidos a propósito, para que el arcoíris se lea como Apple y no como otra cosa:

- La **barra de menús** de hasta arriba, fija, como la del Mac de siempre: la manzana a
  la izquierda, el nombre en negritas y el reloj a la derecha.
- La **manzana de seis franjas** (la de 1977 a 1998), dibujada en SVG dentro de
  `index.html` como un `<symbol>` que se reutiliza tres veces: en la barra, en la
  pantalla de bloqueo y en el pie. Los colores son rectángulos recortados contra la
  silueta; la franja verde es más alta para que la hoja quede completa en verde, como
  el original.
- El **"hola."** del Macintosh de 1984.
- La **estela** del "20".
- El **botón Aqua** y los **cinco sabores** en las etiquetas de las tarjetas.

> Un apunte: la manzana es marca registrada de Apple. Para una invitación personal como
> esta, que es claramente un homenaje y no se vende ni se anuncia nada, no hay problema.
> Si algún día reusas este diseño para algo comercial, quítala.
