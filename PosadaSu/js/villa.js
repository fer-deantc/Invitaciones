/* =========================================================
   villa.js — la Villa de Santa vista desde arriba.

   La técnica es la de la versión 3D: una escena con cámara
   aérea que avanza con el scroll, neblina por distancia, capas
   a distinta profundidad, luces que iluminan la nieve,
   partículas y parallax al mover el cursor o inclinar el
   teléfono. Lo que cambia es cómo se ve: cada pieza es una
   pintura en acuarela y tinta (acuarela.js) colocada en el
   espacio, como un diorama ilustrado.

   Capas (cada una marcada abajo con su título):
     1. FONDO ......... cielo, nubes, luna, estrellas, montañas
     2. BOSQUE ........ bandas de pinos con neblina azul y pinos sueltos
     3. VILLA ......... suelo pintado, plaza, pista, árbol, casas, tienda
     4. PERSONAJES .... patinadores, amigos, Teddy, osos, venados
     5. LUZ ........... halos de ventanas, faroles, fogatas, árbol, reflejos
     6. PARTÍCULAS .... nieve en tres capas, humo, chispas
     7. CÁMARA ........ recorrido con el scroll y parallax
   ========================================================= */
import * as THREE from 'three';

const P = window.POSADA, A = P.paint, K = A.K;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const cvs = document.getElementById('villaCanvas');
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const idle = () => new Promise(r => (window.requestIdleCallback ? requestIdleCallback(() => r(), { timeout: 60 }) : setTimeout(r, 16)));

let renderer = null;
try { renderer = new THREE.WebGLRenderer({ canvas: cvs, antialias: true, powerPreference: 'high-performance' }); } catch (e) { renderer = null; }

if (!renderer) {
  document.documentElement.classList.add('novilla');
  P.villa = { layout() {}, start() {} };
} else {
  let ready = false, wantStart = false;
  P.villa = { layout() { if (ready) measure(); }, start() { wantStart = true; if (ready) begin(); } };
  var measure = () => {}, begin = () => {};
  build().then(() => { ready = true; if (wantStart || P.opened) begin(); });
}

async function build() {
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, Math.min(innerWidth, innerHeight) < 700 ? 1.6 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const FOG = new THREE.Color('#203a78');
  scene.fog = new THREE.FogExp2(FOG, .0085);
  scene.background = new THREE.Color('#0d1a3d');
  const camera = new THREE.PerspectiveCamera(50, 1, .5, 900);
  scene.add(camera);

  const texOf = (canvas, o = {}) => { const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; if (o.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(o.repeat, o.repeat); } return t; };
  const NIGHT = new THREE.Color('#c3cff0'), WARM = new THREE.Color('#fff0d4');
  // una pintura parada sobre la nieve, siempre de frente a la cámara
  function card(canvas, h, x, z, o = {}) {
    const tex = canvas.isTexture ? canvas : texOf(canvas);
    const img = tex.image, asp = img.width / img.height;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: o.fog !== false, color: o.color || NIGHT }));
    s.center.set(.5, o.base != null ? o.base : .02);
    s.scale.set(h * asp, h, 1);
    s.position.set(x, o.y || 0, z);
    s.renderOrder = 5;   // siempre después del suelo y de las sombras
    (o.parent || scene).add(s);
    return s;
  }
  // una pintura acostada sobre el suelo (sombras, charcos de luz, ángeles de nieve)
  function decal(texOrCanvas, w, d, x, z, o = {}) {
    const tex = texOrCanvas.isTexture ? texOrCanvas : texOf(texOrCanvas);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: o.opacity == null ? 1 : o.opacity, blending: o.add ? THREE.AdditiveBlending : THREE.NormalBlending, color: o.color || 0xffffff, fog: true }));
    m.rotation.x = -Math.PI / 2; if (o.rot) m.rotation.z = o.rot;
    m.position.set(x, o.y || .03, z); m.renderOrder = o.order || 2;
    scene.add(m); return m;
  }
  const T = {
    halo: texOf(A.halo()), blob: texOf(A.blob()), smoke: texOf(A.smoke()), spark: texOf(A.spark()),
    flake: texOf(A.flake(false)), flakeSoft: texOf(A.flake(true)), streak: texOf(A.streak()), snowball: texOf(A.snowball())
  };
  const glowS = (x, y, z, size, color = 0xffc46a, op = .8, parent) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.halo, color, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    s.scale.setScalar(size); s.position.set(x, y, z); s.renderOrder = 6; (parent || scene).add(s); return s;
  };

  /* =======================================================
     DISTRIBUCIÓN DE LA VILLA (metros; x al este, z hacia la cámara)
     ======================================================= */
  const L = {
    size: 150, plaza: [20, 16], rink: [4, 3.6, 12.5, 9.6],
    streets: [], houses: [], lamps: [], terraces: [[-16, 22, 11, 7], [17, 23, 10, 6]], shadows: [], pools: []
  };
  const STREET_ANG = [-90, -38, -142, 18, 162, 90];
  STREET_ANG.forEach(a => { const r = a * Math.PI / 180; L.streets.push([Math.cos(r) * 15, Math.sin(r) * 13, Math.cos(r) * 74, Math.sin(r) * 74]); });
  // casas: todas distintas
  const HOUSES = [
    [-7, -31, { type: 'stone', floors: 2, w: 96, roof: K.slate, wall: K.stone, balcony: true, wreaths: true, silh: true, garland: true, dormer: true }],
    [8, -30, { type: 'cabin', w: 92, gable: 'front', wall: K.wood, roof: K.burg, garland: true, teddy: true }],
    [-8, -45, { type: 'town', floors: 2, w: 100, wall: '#7d2a36', roof: K.slate, wreaths: true, silh: true }],
    [10, -46, { type: 'stone', floors: 2, w: 104, wall: '#e3d8c2', roof: '#3f4e6e', balcony: true, garland: true }],
    [-24, -19, { type: 'cabin', w: 96, wall: '#8a5e3c', roof: K.racing, garland: true, silh: true }],
    [-34, -29, { type: 'town', floors: 2, w: 92, wall: '#2f4a6e', roof: K.slate, wreaths: true }],
    [-38, -12, { type: 'cabin', w: 86, gable: 'front', wall: '#6e4a30', roof: K.slate }],
    [32, 3, { type: 'stone', floors: 1, w: 104, wall: '#d6ccb8', roof: K.burg, wreaths: true, garland: true, dormer: true }],
    [38, -9, { type: 'town', floors: 2, w: 96, wall: '#3d5a45', roof: '#3f4e6e', balcony: true, silh: true }],
    [-39, 3, { type: 'stone', floors: 2, w: 98, wall: '#cfc3ab', roof: K.racing, wreaths: true }],
    [21, -40, { type: 'cabin', w: 90, gable: 'front', wall: '#7a5638', roof: '#3f4e6e', garland: true }],
    [-20, -40, { type: 'town', floors: 2, w: 94, wall: '#c79a64', roof: K.burg, silh: true, wreaths: true }],
    [-26, 26, { type: 'cabin', w: 84, gable: 'front', wall: '#6e4a30', roof: K.burg, garland: true }],
    [28, 27, { type: 'cabin', w: 86, wall: '#7a5638', roof: K.racing, silh: true }],
    [-30, 13, { type: 'town', floors: 2, w: 90, wall: '#6e2a36', roof: K.slate, wreaths: true, balcony: true }],
    [31, 15, { type: 'stone', floors: 1, w: 92, wall: '#d9cdb5', roof: K.racing, garland: true }],
    [-9, 34, { type: 'cabin', w: 80, gable: 'front', wall: '#7f5a3a', roof: K.slate, garland: true }],
    [10, 35, { type: 'cabin', w: 82, wall: '#6e4a30', roof: K.burg, silh: true }],
    [43, 16, { type: 'cabin', w: 82, gable: 'front', wall: '#5e4430', roof: K.slate }]
  ];
  const STORE = [24, -24], TRUCK = [31, -18];
  HOUSES.forEach(([x, z]) => { L.shadows.push([x + 2, z + 2, 5, 9]); L.pools.push([x, z + 5, 8, .45]); });
  L.shadows.push([STORE[0], STORE[1] + 2, 8, 10]); L.pools.push([STORE[0], STORE[1] + 6, 12, .6]);
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2 + .2; L.lamps.push([Math.cos(a) * 18.5, Math.sin(a) * 14.6]); }
  STREET_ANG.forEach(a => { const r = a * Math.PI / 180; [26, 38, 50].forEach((d, k) => { const s = k % 2 ? 1 : -1; L.lamps.push([Math.cos(r) * d - Math.sin(r) * 3.6 * s, Math.sin(r) * d + Math.cos(r) * 3.6 * s]); }); });
  L.lamps.forEach(([x, z]) => L.pools.push([x, z, 5.5, .5]));
  L.pools.push([0, 0, 14, .45]);
  L.terraces.forEach(([x, z]) => L.pools.push([x, z, 9, .55]));
  L.shadows.push([0, 1, 4, 16]);

  /* =======================================================
     1. FONDO — cielo, nubes, luna, estrellas y montañas
     ======================================================= */
  const skyTex = texOf(A.sky()); skyTex.wrapS = THREE.RepeatWrapping;
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: skyTex, depthWrite: false, fog: false }));
  sky.position.z = -800; sky.renderOrder = -10; camera.add(sky);
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: texOf(A.moon()), transparent: true, depthWrite: false, fog: false }));
  moon.renderOrder = -9; camera.add(moon);
  const starGeo = new THREE.BufferGeometry(), starN = 260, sp = new Float32Array(starN * 3), sph = new Float32Array(starN);
  for (let i = 0; i < starN; i++) { sp[i * 3] = (Math.random() - .5) * 1.6; sp[i * 3 + 1] = Math.random() * .55 + .05; sp[i * 3 + 2] = 0; sph[i] = Math.random() * 6.28; }
  starGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3)); starGeo.setAttribute('ph', new THREE.BufferAttribute(sph, 1));
  const starMat = new THREE.ShaderMaterial({ uniforms: { t: { value: 0 }, sc: { value: 1 } }, transparent: true, depthWrite: false,
    vertexShader: 'attribute float ph; uniform float t; uniform float sc; varying float a; void main(){ a = .45 + .55 * sin(t * 1.7 + ph * 3.0); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_PointSize = (1.4 + mod(ph, 1.6)) * sc; }',
    fragmentShader: 'varying float a; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(1.0, .97, .88, a * smoothstep(.5, .1, d)); }' });
  const stars = new THREE.Points(starGeo, starMat); stars.renderOrder = -9; stars.frustumCulled = false;
  const starHolder = new THREE.Group(); starHolder.add(stars); camera.add(starHolder);
  const mtnTex = texOf(A.mountains());
  const mountains = new THREE.Mesh(new THREE.PlaneGeometry(900, 120), new THREE.MeshBasicMaterial({ map: mtnTex, transparent: true, depthWrite: false, fog: false, color: 0xd6e0f6 }));
  mountains.position.set(0, 40, -300); mountains.renderOrder = -8; scene.add(mountains);
  await idle();

  /* =======================================================
     2. BOSQUE — bandas de pinos, más claras y azules mientras más lejos
     ======================================================= */
  [[-82, .15, 220, 26], [-125, .4, 330, 34], [-180, .68, 470, 44]].reverse().forEach(([z, haze, w, h], i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w * 2, h), new THREE.MeshBasicMaterial({ map: texOf(A.forestBand(haze, 101 + i)), transparent: true, depthWrite: false, fog: false }));
    m.position.set(0, h / 2 - 3, z); m.renderOrder = -7 + i; scene.add(m);
    for (const sx of [-1, 1]) { const side = m.clone(); side.position.set(sx * (w * 1.4), h / 2 - 3, z * .55 + 60); side.rotation.y = -sx * 1.1; scene.add(side); }
  });
  const pineCanvases = [];
  for (let i = 0; i < 6; i++) pineCanvases.push(texOf(A.pine({ seed: 11 + i * 7, snow: .7 + (i % 3) * .15, color: i % 2 ? K.pine : K.racing })));
  await idle();
  const nearStreet = (x, z, m) => L.streets.some(([x1, z1, x2, z2]) => { const dx = x2 - x1, dz = z2 - z1, t = Math.max(0, Math.min(1, ((x - x1) * dx + (z - z1) * dz) / (dx * dx + dz * dz))); return Math.hypot(x - x1 - dx * t, z - z1 - dz * t) < m; });
  const nearHouse = (x, z, m) => HOUSES.some(([hx, hz]) => Math.hypot(x - hx, z - hz) < m) || Math.hypot(x - STORE[0], z - STORE[1]) < m + 4;
  let placed = 0;
  for (let tries = 0; tries < 900 && placed < 70; tries++) {
    const a = Math.random() * Math.PI * 2, r = 26 + Math.random() * 46, x = Math.cos(a) * r, z = Math.sin(a) * r * .95;
    if (z > 50 || nearStreet(x, z, 4.5) || nearHouse(x, z, 7) || Math.hypot(x, z) < 23) continue;
    if (L.terraces.some(([tx, tz]) => Math.hypot(x - tx, z - tz) < 9)) continue;
    const h = 6 + Math.random() * 6;
    card(pineCanvases[placed % 6], h, x, z);
    L.shadows.push([x, z, 1.6, h * .6]);
    placed++;
  }
  await idle();

  /* =======================================================
     3. VILLA — suelo pintado, plaza, pista, árbol, casas y tienda
     ======================================================= */
  const outer = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), new THREE.MeshBasicMaterial({ color: '#9fb4df', fog: true }));
  outer.rotation.x = -Math.PI / 2; outer.position.y = -.05; outer.renderOrder = 0; scene.add(outer);
  const groundTex = texOf(A.ground(L));
  const fadeC = document.createElement('canvas'); fadeC.width = fadeC.height = 256; const fg = fadeC.getContext('2d'); const gr = fg.createRadialGradient(128, 128, 70, 128, 128, 128); gr.addColorStop(0, '#fff'); gr.addColorStop(1, '#000'); fg.fillStyle = gr; fg.fillRect(0, 0, 256, 256);
  const fadeTex = new THREE.CanvasTexture(fadeC);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(L.size, L.size), new THREE.MeshBasicMaterial({ map: groundTex, alphaMap: fadeTex, transparent: true, depthWrite: false, fog: true }));
  ground.rotation.x = -Math.PI / 2; ground.renderOrder = 1; scene.add(ground);
  await idle();

  // el árbol enorme al centro, en su isla
  const treeC = A.bigTree();
  const TREE_H = 19, tree = card(treeC, TREE_H, 0, 0, { base: .015 });
  const treeW = TREE_H * treeC.width / treeC.height;
  await idle();

  // casas, cada una con su humo
  const smokes = [], lightPts = [], houseGlows = [];
  for (let i = 0; i < HOUSES.length; i++) {
    const [x, z, o] = HOUSES[i];
    const c = A.house(Object.assign({ seed: 200 + i * 13 }, o));
    const h = 16.5, s = card(c, h, x, z, { base: .033 });
    const w = h * c.width / c.height;
    if (c.smoke) smokes.push(V(x + (c.smoke[0] - .5) * w, (1 - c.smoke[1]) * h - .6, z));
    lightPts.push({ x, z: z + 3, r: 9 });
    houseGlows.push(glowS(x, h * .2, z + .5, w * .7, 0xffb85a, .22));
    if (i % 3 === 0) await idle();
    void s;
  }
  // la tienda, con su camioneta verde
  const storeC = A.store(); card(storeC, 19, STORE[0], STORE[1], { base: .032 });
  smokes.push(V(STORE[0] + 3, 15, STORE[1]));
  lightPts.push({ x: STORE[0], z: STORE[1] + 5, r: 12 });
  houseGlows.push(glowS(STORE[0], 3, STORE[1] + 1, 16, 0xffb85a, .3));
  card(A.truck(), 5.4, TRUCK[0], TRUCK[1]);
  L.shadows.push([TRUCK[0], TRUCK[1], 3, 3]);
  await idle();

  /* =======================================================
     5. LUZ — halos dorados (mezcla aditiva), charcos de luz y reflejos
     ======================================================= */
  const lampCanvas = texOf(A.lamp());
  const lampGlows = [];
  L.lamps.forEach(([x, z], i) => { card(lampCanvas, 4.3, x, z); lampGlows.push(glowS(x, 3.6, z, 3.8, 0xffcf7a, .85)); lightPts.push({ x, z, r: 6 }); void i; });
  // luces del árbol (salen de las mismas pinceladas que se pintaron)
  const treeLights = treeC.lights.map(([u, v, col], i) => glowS((u - .5) * treeW, (1 - v) * TREE_H, .3, i % 5 ? 1.1 : 1.6, col, .9));
  const treeHalo = glowS(0, TREE_H * .45, 0, 26, 0xffb860, .32);
  lightPts.push({ x: 0, z: 0, r: 16 });
  // reflejos en el hielo: pinceladas verticales onduladas
  const reflections = [];
  for (let i = 0; i < 10; i++) { const a = Math.PI * (.05 + i * .1), x = Math.cos(a) * 8, z = Math.sin(a) * 6.4 + .6; reflections.push(decal(T.streak, 1.4, 5.5, x, z + 2.4, { add: true, opacity: .55, order: 3 })); }
  L.lamps.slice(0, 14).forEach(([x, z]) => { if (z > 4) reflections.push(decal(T.streak, 1, 4.2, x * .78, z * .78 + 1.8, { add: true, opacity: .4, order: 3 })); });
  await idle();

  /* =======================================================
     4. PERSONAJES — más de 50, todos distintos, y Teddy
     ======================================================= */
  const actors = [];
  const pick = (arr, i) => arr[i % arr.length];
  let pid = 0;
  const look = (i, extra = {}) => Object.assign({ seed: 400 + i * 7, coat: pick(A.COATS, i * 5 + 1), hat: pick(A.HATS, i * 3 + 2), scarf: pick([K.burg, K.goldD, K.racingL, K.cream, '#c0282f', K.navy2], i * 7 + 3), skin: pick(K.skin, i), hair: pick(K.hair, i * 2), pants: pick(['#2a2f45', '#3b3326', '#1f2a3a', '#4a3f35'], i), pom: pick([K.cream, '#f4f0e6', K.goldW], i) }, extra);
  const texPose = (i, pose, extra) => texOf(A.person(look(i, Object.assign({ pose }, extra))));
  const HP = 2.15;
  function shadowFor(sprite, size = 1.1) { const m = decal(T.blob, size, size * .6, sprite.position.x + .3, sprite.position.z + .3, { opacity: .55, order: 2 }); return m; }
  function tint(sprite) { let k = 0; for (const l of lightPts) { const d = Math.hypot(sprite.position.x - l.x, sprite.position.z - l.z); if (d < l.r) k = Math.max(k, 1 - d / l.r); } sprite.material.color.copy(NIGHT).lerp(WARM, k); }
  function flip(sp, frames, dir) { if (sp.userData.dir === dir) return; sp.userData.dir = dir; frames.forEach(t => { t.wrapS = THREE.RepeatWrapping; t.repeat.x = dir; t.offset.x = dir < 0 ? 1 : 0; }); }

  // quien camina de un punto a otro (y regresa)
  function walker(i, pts, o = {}) {
    const fr = o.frames || [texPose(i, o.arms || 'walkA', { legs: 'A', kid: o.kid }), texPose(i, o.arms || 'walkB', { legs: 'B', kid: o.kid })];
    const s = card(fr[0], HP, pts[0][0], pts[0][1]), sh = shadowFor(s);
    const segs = []; let len = 0;
    for (let k = 1; k < pts.length; k++) { const l = Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]); segs.push([pts[k - 1], pts[k], len, l]); len += l; }
    const st = { s: Math.random() * len, dir: 1, wait: 0, t: Math.random() * 3 };
    const follower = o.sled ? card(o.sled, 1.5, pts[0][0], pts[0][1]) : null;
    actors.push((dt, t) => {
      st.t += dt;
      if (st.wait > 0) st.wait -= dt;
      else { st.s += st.dir * (o.speed || 1.2) * dt; if (st.s >= len) { st.s = len; st.dir = -1; st.wait = 1 + Math.random() * 2; } else if (st.s <= 0) { st.s = 0; st.dir = 1; st.wait = 1 + Math.random() * 2; } }
      let sg = segs[segs.length - 1]; for (const q of segs) if (st.s <= q[2] + q[3]) { sg = q; break; }
      const k = (st.s - sg[2]) / sg[3], x = sg[0][0] + (sg[1][0] - sg[0][0]) * k, z = sg[0][1] + (sg[1][1] - sg[0][1]) * k;
      const moving = st.wait <= 0;
      s.position.set(x, moving ? Math.abs(Math.sin(st.t * 9)) * .05 : 0, z);
      s.material.map = fr[moving ? Math.floor(st.t * 5.5) % 2 : 0];
      flip(s, fr, (sg[1][0] - sg[0][0]) * st.dir >= 0 ? 1 : -1);
      sh.position.set(x + .3, .03, z + .3);
      if (follower) { const back = st.dir * -1.6; follower.position.set(x + (sg[1][0] - sg[0][0]) / sg[3] * back, 0, z + (sg[1][1] - sg[0][1]) / sg[3] * back); }
      tint(s);
    });
    return s;
  }
  // patinador en la pista: se desliza en óvalos
  function skater(i, rx, rz, w, ph, o = {}) {
    const fr = o.frames || [texPose(i, o.pose || 'skateA', { kid: o.kid }), texPose(i, o.pose2 || 'skateB', { kid: o.kid })];
    const fall = o.falls ? texPose(i, 'fall') : null;
    const s = card(fr[0], o.h || HP, 0, 0), sh = shadowFor(s);
    let th = ph, fallT = 0, next = 5 + Math.random() * 6;
    actors.push((dt, t) => {
      if (fall && fallT <= 0 && (next -= dt) < 0) { fallT = 1.8; next = 7 + Math.random() * 6; }
      if (fallT > 0) { fallT -= dt; s.material.map = fall; s.material.rotation = 0; return; }
      th += w * dt;
      const x = Math.cos(th) * rx, z = Math.sin(th) * rz;
      s.position.set(x, 0, z); sh.position.set(x + .3, .03, z + .3);
      s.material.map = fr[Math.floor(t * 1.4 + ph) % 2];
      flip(s, fr, -Math.sin(th) * Math.sign(w) >= 0 ? 1 : -1);
      s.material.rotation = Math.sin(t * 1.4 + ph) * .06;
      tint(s);
    });
  }
  // quien platica en su lugar: se balancea apenas y a veces brinda
  function idler(i, x, z, poses = ['cup', 'toast'], o = {}) {
    const fr = poses.map(p => texPose(i, p, { kid: o.kid }));
    const s = card(fr[0], HP, x, z); shadowFor(s); tint(s);
    if (o.face < 0) flip(s, fr, -1);
    const ph = Math.random() * 10;
    actors.push((dt, t) => { s.material.rotation = Math.sin(t * .9 + ph) * .025; if (fr.length > 1) s.material.map = fr[(Math.sin(t * .35 + ph) > .75) ? 1 : 0]; });
    return s;
  }

  // ---- en la pista: de 10 a 14 patinadores ----
  skater(pid++, 8.6, 6.6, .32, 0, { falls: true });
  skater(pid++, 9.6, 7.6, .27, 1.2);
  skater(pid++, 7.4, 5.8, -.34, 2.1);
  skater(pid++, 10.5, 8.2, .22, 3.3);
  skater(pid++, 6.8, 5.2, .38, 4.4);
  skater(pid++, 9.2, 7.2, -.25, 5.2);
  skater(pid++, 8, 6.2, .29, .6, { frames: [texOf(A.person(look(90, { pose: 'couple', b: look(91), frame: 0 }))), texOf(A.person(look(90, { pose: 'couple', b: look(91), frame: 1 })))] });
  skater(pid++, 10, 7.9, .2, 2.8, { frames: [texOf(A.person(look(92, { pose: 'couple', b: look(93), frame: 0 }))), texOf(A.person(look(92, { pose: 'couple', b: look(93), frame: 1 })))] });
  skater(pid++, 6.4, 5, .16, 1.7, { pose: 'kid', pose2: 'kid', kid: true });
  skater(pid++, 11, 8.6, -.21, 4.9);
  skater(pid++, 7.8, 6, .31, 3.9, { falls: true });
  await idle();

  // ---- en la plaza: amigos con vasos, brindis, fotos, una ronda, ángeles y bolas de nieve ----
  [[-16, 4], [-14.5, 5.4], [-15.6, 6.6]].forEach(([x, z], k) => idler(pid++, x, z, ['cup', 'toast'], { face: k ? -1 : 1 }));
  [[15, 3], [16.4, 4.6], [14.2, 5.6]].forEach(([x, z], k) => idler(pid++, x, z, ['cup', 'toast'], { face: k % 2 ? -1 : 1 }));
  [[-10, -13], [-8.4, -13.6], [-9.2, -12]].forEach(([x, z], k) => idler(pid++, x, z, ['toast', 'cup'], { face: k ? 1 : -1 }));
  // foto frente al árbol, con flash
  idler(pid++, -3.2, 12.6, ['phone', 'phone'], { face: 1 });
  const posing = [[-1, 10.4], [.4, 10.8], [1.8, 10.4]].map(([x, z]) => idler(pid++, x, z, ['stand', 'toast']));
  const flash = glowS(-3, 2, 12.4, 2.2, 0xffffff, 0);
  void posing;
  // una ronda de amigos
  const ronda = [];
  for (let k = 0; k < 6; k++) ronda.push([texPose(pid + k, 'walkA', { legs: 'A' }), texPose(pid + k, 'walkB', { legs: 'B' })]);
  const rondaS = ronda.map(fr => { const s = card(fr[0], HP, 0, 0); return { s, fr, sh: shadowFor(s) }; });
  pid += 6;
  actors.push((dt, t) => rondaS.forEach((o, k) => { const a = t * .35 + k / 6 * Math.PI * 2, x = -13 + Math.cos(a) * 1.9, z = 11.5 + Math.sin(a) * 1.4; o.s.position.set(x, 0, z); o.sh.position.set(x + .3, .03, z + .3); o.s.material.map = o.fr[Math.floor(t * 4 + k) % 2]; tint(o.s); }));
  // ángeles de nieve
  [[11, -12.5], [13, -12]].forEach(([x, z], k) => { const o = look(pid++); const fr = [texOf(A.angel(o, 0)), texOf(A.angel(o, 1))]; const d = decal(fr[0], 2.4, 2.4, x, z, { order: 3, color: 0xe6ecff }); actors.push((dt, t) => { d.material.map = fr[Math.floor(t * 1.6 + k) % 2]; }); });
  // niños lanzándose bolas de nieve
  const thrower = (x, z, face, k) => { const fr = [texPose(pid, 'throwA', { kid: true }), texPose(pid, 'throwB', { kid: true })]; pid++; const s = card(fr[0], HP, x, z); shadowFor(s); if (face < 0) flip(s, fr, -1); return { s, fr, k }; };
  const kids = [thrower(7, 14, 1, 0), thrower(12.5, 13.2, -1, 1)];
  const ball = card(T.snowball, .35, 0, 0, { base: .5 });
  actors.push((dt, t) => {
    const cyc = (t % 2.4) / 2.4, from = Math.floor(t / 2.4) % 2, a = kids[from].s.position, b = kids[1 - from].s.position;
    kids.forEach((kd, i) => { kd.s.material.map = kd.fr[i === from && cyc < .25 ? 1 : 0]; });
    const u = Math.min(1, cyc / .6);
    ball.visible = cyc < .6;
    ball.position.set(a.x + (b.x - a.x) * u, 1.6 + Math.sin(u * Math.PI) * 2.2, a.z + (b.z - a.z) * u);
  });
  await idle();

  // ---- en las calles: parejas, regalos, botellas, un trineo ----
  const st = L.streets;
  const along = (sIdx, d1, d2, off = 0) => { const [x1, z1, x2, z2] = st[sIdx], l = Math.hypot(x2 - x1, z2 - z1), ux = (x2 - x1) / l, uz = (z2 - z1) / l; return [[x1 + ux * d1 - uz * off, z1 + uz * d1 + ux * off], [x1 + ux * d2 - uz * off, z1 + uz * d2 + ux * off]]; };
  walker(pid++, along(0, 2, 30, -1.2));
  walker(pid++, along(0, 4, 32, 1));
  walker(pid++, along(1, 1, 24, .8), { arms: 'carry' });
  walker(pid++, along(1, 3, 22, -1), { arms: 'bottle' });
  walker(pid++, along(2, 2, 26, 1.1), { arms: 'bottle' });
  walker(pid++, along(2, 5, 24, -.9));
  walker(pid++, along(3, 1, 22, .9), { arms: 'carry' });
  walker(pid++, along(4, 2, 20, -1), { arms: 'rope', sled: A.sled(true), speed: .9 });
  walker(pid++, along(4, 4, 22, 1.2));
  walker(pid++, along(5, 2, 18, -1.1), { arms: 'bottle' });
  walker(pid++, along(5, 3, 20, 1), { kid: true });
  await idle();

  // ---- terrazas: mesas largas con velitas y braseros con fuego ----
  const fires = [];
  const tableTex = texOf(A.table()), brTex = texOf(A.brazier()), flames = [0, 1, 2].map(f => texOf(A.flame(f)));
  L.terraces.forEach(([x, z], k) => {
    card(tableTex, 2.1, x, z - 1);
    [[-3, -2.6], [0, -2.8], [3, -2.6]].forEach(([dx, dz], j) => idler(pid++, x + dx, z + dz, ['cup', 'toast'], { face: j % 2 ? -1 : 1 }));
    [[-2.6, 1.6], [2.4, 1.8]].forEach(([dx, dz], j) => idler(pid++, x + dx, z + dz, ['cup', 'stand'], { face: j ? -1 : 1 }));
    const bx = x + (k ? -5 : 5), bz = z + 2.6;
    card(brTex, 1, bx, bz);
    const fl = card(flames[0], 1.7, bx, bz, { y: .5, fog: false, color: 0xffffff });
    const fh = glowS(bx, 1.2, bz, 6, 0xff9a40, .7);
    const pool = decal(T.halo, 9, 9, bx, bz, { add: true, opacity: .5, order: 3, color: 0xff9a40 });
    [[-1.6, .4], [1.5, .2]].forEach(([dx, dz], j) => idler(pid++, bx + dx, bz + dz, ['warm', 'warm'], { face: j ? -1 : 1 }));
    lightPts.push({ x: bx, z: bz, r: 6 });
    fires.push({ fl, fh, pool, x: bx, z: bz });
  });
  await idle();

  // ---- junto a la tienda: fila de compradores y café junto a la camioneta ----
  [[19, -18], [20.4, -17], [21.8, -16.4], [23.2, -16]].forEach(([x, z], k) => idler(pid++, x, z, k % 2 ? ['carry', 'stand'] : ['stand', 'cup'], { face: -1 }));
  [[29, -14.5], [31.5, -14], [33.2, -15.2]].forEach(([x, z], k) => idler(pid++, x, z, ['cup', 'cup'], { face: k ? -1 : 1 }));

  // ---- osos de peluche, regalos verde salvia y Teddy ----
  card(A.bears(), 2.8, -3.6, 2.6);
  card(A.gifts(), 2.1, 2.6, 2.8);
  card(A.sled(true), 1.3, -4.8, -1.8);
  const tSit = [texOf(A.teddy(0, true)), texOf(A.teddy(1, true))];
  const teddySit = card(tSit[0], 1.05, 2.2, 3.1, { y: 1.05 });
  actors.push((dt, t) => { teddySit.material.map = tSit[Math.floor(t * 3) % 2]; });
  const tRun = [texOf(A.teddy(0, false)), texOf(A.teddy(1, false))];
  const teddy = card(tRun[0], 1, 0, 0), teddySh = shadowFor(teddy, .95);
  const tPath = [[-14, 6], [-6, 11.8], [4, 12.2], [13, 7]];
  const tl = [0]; for (let i = 1; i < tPath.length; i++) tl.push(tl[i - 1] + Math.hypot(tPath[i][0] - tPath[i - 1][0], tPath[i][1] - tPath[i - 1][1]));
  const tst = { s: 0, dir: 1, wait: 0 };
  actors.push((dt, t) => {
    if (tst.wait > 0) { tst.wait -= dt; teddy.material.map = tRun[Math.floor(t * 6) % 2]; return; }
    tst.s += tst.dir * 3.2 * dt;
    if (tst.s > tl[tl.length - 1]) { tst.s = tl[tl.length - 1]; tst.dir = -1; tst.wait = 1.2; } else if (tst.s < 0) { tst.s = 0; tst.dir = 1; tst.wait = 1.2; }
    let i = 1; while (i < tl.length - 1 && tst.s > tl[i]) i++;
    const k = (tst.s - tl[i - 1]) / (tl[i] - tl[i - 1]), x = tPath[i - 1][0] + (tPath[i][0] - tPath[i - 1][0]) * k, z = tPath[i - 1][1] + (tPath[i][1] - tPath[i - 1][1]) * k;
    teddy.position.set(x, Math.abs(Math.sin(t * 16)) * .06, z); teddySh.position.set(x + .15, .03, z + .1);
    teddy.material.map = tRun[Math.floor(t * 12) % 2];
    flip(teddy, tRun, (tPath[i][0] - tPath[i - 1][0]) * tst.dir >= 0 ? 1 : -1);
  });

  // ---- primer plano: venados al borde del bosque (grabado) ----
  const deerT = [texOf(A.deer(false)), texOf(A.deer(true))];
  [[-17, 40, 0, 1], [-13.5, 42, 1, -1], [19, 44, 0, -1]].forEach(([x, z, g, f]) => { const d = card(deerT[g], 3, x, z); if (f < 0) flip(d, [deerT[g]], -1); });
  [[-24, 44], [-9, 47], [14, 49], [27, 45], [-30, 40], [33, 41]].forEach(([x, z], i) => card(pineCanvases[i % 6], 7 + (i % 3) * 2, x, z));
  await idle();

  /* =======================================================
     6. PARTÍCULAS — nieve en tres capas, humo y chispas
     ======================================================= */
  const snowLayers = [[700, .22, 2.6, T.flake, 1.1], [380, .38, 4.6, T.flake, 1.6], [90, .7, 9, T.flakeSoft, 2.6]].map(([n, size, speed, map, drift]) => {
    const g = new THREE.BufferGeometry(), p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { p[i * 3] = (Math.random() - .5) * 90; p[i * 3 + 1] = Math.random() * 40; p[i * 3 + 2] = (Math.random() - .5) * 90; }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ map, size, transparent: true, depthWrite: false, opacity: .9, color: 0xf5f2ea, sizeAttenuation: true, fog: false }));
    pts.frustumCulled = false; pts.renderOrder = 20; scene.add(pts);
    return { pts, p, n, speed, drift };
  });
  const smokeS = [];
  smokes.forEach((b, i) => { for (let k = 0; k < 4; k++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.smoke, transparent: true, depthWrite: false, opacity: 0 })); s.userData = { b, ph: k / 4 + i * .17 }; s.renderOrder = 6; scene.add(s); smokeS.push(s); } });
  const sparkGeo = new THREE.BufferGeometry(), SPK = fires.length * 14, spP = new Float32Array(SPK * 3), spL = new Float32Array(SPK);
  for (let i = 0; i < SPK; i++) spL[i] = Math.random();
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(spP, 3));
  const sparks = new THREE.Points(sparkGeo, new THREE.PointsMaterial({ map: T.spark, size: .35, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffb060 }));
  sparks.frustumCulled = false; sparks.renderOrder = 7; scene.add(sparks);

  /* ---------- ramas nevadas en las esquinas (primer plano, con parallax) ---------- */
  const branches = [];
  [['branchTL', false], ['branchBR', true]].forEach(([id, f]) => { const el = document.getElementById(id); if (!el) return; const c = A.branch(f); el.width = c.width; el.height = c.height; el.getContext('2d').drawImage(c, 0, 0); branches.push(el); });

  /* =======================================================
     7. CÁMARA — recorrido aéreo guiado por el scroll + parallax
     ======================================================= */
  // un punto de vista por cada hueco entre tarjetas
  const SHOTS = [
    { t: V(0, 2, 6), d: 74, pitch: 36, yaw: 0 },       // 0 · la villa completa
    { t: V(25, 2, -20), d: 44, pitch: 27, yaw: -10 },  // 1 · la tienda y la camioneta
    { t: V(-6, 2, -32), d: 46, pitch: 25, yaw: 8 },    // 2 · calles y casas encendidas
    { t: V(0, 5, 2), d: 36, pitch: 28, yaw: 0 },       // 3 · el árbol, los osos y Teddy
    { t: V(0, 1, 8), d: 30, pitch: 33, yaw: -14 },     // 4 · la pista de hielo
    { t: V(-15, 2, 21), d: 34, pitch: 31, yaw: 14 },   // 5 · terrazas y fogatas
    { t: V(0, 8, -22), d: 118, pitch: 9, yaw: 4 }      // al final · el valle, el cielo y la luna
  ];
  const anchors = [];
  measure = () => {
    const W = innerWidth, H = innerHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.fov = W < H ? 54 : 42; camera.updateProjectionMatrix();
    const vh = 2 * 800 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    sky.scale.set(vh * camera.aspect * 1.4, vh * 1.25, 1); sky.position.y = vh * .06;
    const md = 760, mh = 2 * md * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    moon.position.set(mh * camera.aspect * .26, mh * .3, -md); moon.scale.setScalar(mh * .16);
    starHolder.position.set(0, -mh * .05, -md); starHolder.scale.set(mh * camera.aspect, mh, 1);
    starMat.uniforms.sc.value = renderer.getPixelRatio();
    anchors.length = 0;
    document.querySelectorAll('.slot[data-site]').forEach(el => { const r = el.getBoundingClientRect(); anchors.push({ y: r.top + scrollY + r.height / 2, i: +el.dataset.site }); });
    const foot = document.querySelector('footer');
    if (foot) { const r = foot.getBoundingClientRect(); anchors.push({ y: r.top + scrollY + r.height / 2, i: 6 }); }
    anchors.sort((a, b) => a.y - b.y);
  };
  const cur = { t: V(), d: 0, pitch: 0, yaw: 0 }, want = { t: V(), d: 0, pitch: 0, yaw: 0 };
  function shotFor(scroll) {
    const yc = scroll + innerHeight / 2, Aa = anchors;
    let a = SHOTS[0], b = SHOTS[0], k = 0;
    if (Aa.length) {
      if (yc <= Aa[0].y) { a = b = SHOTS[Aa[0].i]; }
      else if (yc >= Aa[Aa.length - 1].y) { a = b = SHOTS[Aa[Aa.length - 1].i]; }
      else for (let j = 0; j < Aa.length - 1; j++) if (yc <= Aa[j + 1].y) { a = SHOTS[Aa[j].i]; b = SHOTS[Aa[j + 1].i]; const u = (yc - Aa[j].y) / (Aa[j + 1].y - Aa[j].y); k = u * u * (3 - 2 * u); break; }
    }
    want.t.lerpVectors(a.t, b.t, k); want.d = a.d + (b.d - a.d) * k; want.pitch = a.pitch + (b.pitch - a.pitch) * k; want.yaw = a.yaw + (b.yaw - a.yaw) * k;
  }
  // parallax: cursor en computadora, inclinación en el teléfono
  const par = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', e => { if (e.pointerType === 'mouse') { par.tx = (e.clientX / innerWidth - .5) * 2; par.ty = (e.clientY / innerHeight - .5) * 2; } }, { passive: true });

  let running = false, last = 0, first = true;
  const camOff = V();
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000 || .016); last = now;
    const t = now / 1000;
    shotFor(scrollY);
    const S = P.sensor;
    if (S && S.motion) { par.tx = Math.max(-1, Math.min(1, S.g.x * 2.2)); par.ty = Math.max(-1, Math.min(1, (S.g.z + .35) * 2)); }
    par.x += (par.tx - par.x) * (1 - Math.exp(-dt / .4)); par.y += (par.ty - par.y) * (1 - Math.exp(-dt / .4));
    const kk = first ? 1 : 1 - Math.exp(-dt / .18); first = false;
    cur.t.lerp(want.t, kk); cur.d += (want.d - cur.d) * kk; cur.pitch += (want.pitch - cur.pitch) * kk; cur.yaw += (want.yaw - cur.yaw) * kk;
    const pr = THREE.MathUtils.degToRad(cur.pitch - par.y * 2.2), yr = THREE.MathUtils.degToRad(cur.yaw + par.x * 4);
    camOff.set(Math.sin(yr) * Math.cos(pr) * cur.d, Math.sin(pr) * cur.d, Math.cos(yr) * Math.cos(pr) * cur.d);
    camera.position.copy(cur.t).add(camOff);
    camera.lookAt(cur.t);
    skyTex.offset.x = (t * .0025 + par.x * .01) % 1;
    starMat.uniforms.t.value = t;

    const j0 = performance.now();
    // personajes
    for (const fn of actors) fn(dt, t);
    // luz que parpadea: faroles muy sutil, árbol en secuencia
    lampGlows.forEach((g, i) => { g.material.opacity = .78 + Math.sin(t * 2.3 + i * 1.7) * .05 + Math.sin(t * 7.1 + i) * .03; });
    treeLights.forEach((g, i) => { g.material.opacity = .45 + .5 * Math.max(0, Math.sin(t * 2.2 - i * .35)); });
    treeHalo.material.opacity = .28 + Math.sin(t * .8) * .04;
    houseGlows.forEach((g, i) => { g.material.opacity = .2 + Math.sin(t * .7 + i) * .03; });
    reflections.forEach((r, i) => { r.material.opacity = .32 + .22 * Math.sin(t * 1.8 + i); r.scale.y = 1 + Math.sin(t * 1.3 + i * .7) * .12; });
    flash.material.opacity = (t % 6) < .12 ? .9 : Math.max(0, flash.material.opacity - dt * 6);
    // fogatas: llamas que ondulan
    fires.forEach((f, i) => { f.fl.material.map = flames[Math.floor(t * 9 + i) % 3]; f.fl.scale.y = 1.7 * (1 + Math.sin(t * 11 + i) * .08); const fk = .65 + Math.sin(t * 13 + i) * .08 + Math.sin(t * 5.3) * .05; f.fh.material.opacity = fk; f.pool.material.opacity = fk * .7; });
    // chispas
    for (let i = 0; i < SPK; i++) { const f = fires[Math.floor(i / 14)]; spL[i] += dt * (.5 + (i % 5) * .1); if (spL[i] > 1) spL[i] = 0; const l = spL[i]; spP[i * 3] = f.x + Math.sin(i * 12.9 + l * 6) * .5 * l; spP[i * 3 + 1] = .8 + l * 3.2; spP[i * 3 + 2] = f.z + Math.cos(i * 7.3 + l * 5) * .4 * l; }
    sparkGeo.attributes.position.needsUpdate = true;
    // humo en espiral que se desvanece
    smokeS.forEach(s => { const k = (t * .13 + s.userData.ph) % 1; s.position.set(s.userData.b.x + Math.sin(k * 6 + s.userData.ph * 9) * .7 + k * 1.2, s.userData.b.y + k * 6, s.userData.b.z); s.scale.setScalar(1 + k * 3.4); s.material.opacity = Math.sin(k * Math.PI) * .5; });
    // nieve en tres capas, con viento
    const wind = Math.sin(t * .3) * .8 + .6;
    snowLayers.forEach(L2 => { const p = L2.p; for (let i = 0; i < L2.n; i++) { p[i * 3 + 1] -= L2.speed * dt; p[i * 3] += (wind * L2.drift + Math.sin(t + i) * .3) * dt; if (p[i * 3 + 1] < 0) { p[i * 3 + 1] = 40; p[i * 3] = (Math.random() - .5) * 90; } if (p[i * 3] > 45) p[i * 3] -= 90; } L2.pts.position.set(cur.t.x, 0, cur.t.z + cur.d * .25); L2.pts.geometry.attributes.position.needsUpdate = true; });
    // ramas del primer plano, más rápidas que todo lo demás
    branches.forEach((b, i) => { b.style.transform = `translate(${(-par.x * (i ? 22 : 16)).toFixed(1)}px,${(-par.y * 14).toFixed(1)}px)`; });

    const j1 = performance.now();
    renderer.render(scene, camera);
    const j2 = performance.now();
    perf.js = perf.js * .9 + (j1 - j0) * .1; perf.gl = perf.gl * .9 + (j2 - j1) * .1;
    if (running) requestAnimationFrame(frame);
  }
  const perf = { js: 0, gl: 0 };
  P.villa.snap = () => { first = true; };
  P.villa.debug = () => ({ perf, calls: renderer.info.render.calls, tex: renderer.info.memory.textures, geo: renderer.info.memory.geometries, anchors: anchors.map(a => [Math.round(a.y), a.i]), want: [want.t.x, want.t.z, want.d], cur: [cur.t.x, cur.t.z, cur.d], sy: scrollY });
  begin = () => {
    measure();
    cvs.classList.add('on');
    document.documentElement.classList.add('villa-on');
    if (running) return;
    running = true; last = performance.now();
    if (reduce) { running = false; frame(last); addEventListener('scroll', () => frame(performance.now()), { passive: true }); return; }
    requestAnimationFrame(frame);
    // la página termina de acomodarse (tipografías, marcos): se vuelve a medir
    setTimeout(measure, 800); setTimeout(measure, 2500);
    if (window.ResizeObserver) new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(measure, 150); }).observe(document.getElementById('invite'));
  };
  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(measure, 200); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && running) { last = performance.now(); } });
}
