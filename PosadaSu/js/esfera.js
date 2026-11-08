/* =========================================================
   esfera.js — la bola de nieve de la entrada (3D).

   Una esfera de vidrio sobre una base de caoba, en una mesa
   de nogal. Adentro, la villa de Santa en miniatura: su casa,
   el taller, el árbol, el poste de rayas y el trineo.

   · La nieve es la que obedece al sensor: cae hacia donde
     está el suelo de verdad (si acuestas el teléfono, se va
     al fondo del vidrio) y se arremolina al agitar.
   · La bola no flota: descansa en la mesa. Al agitar el
     teléfono se levanta y se sacude como si la tuvieras en
     la mano; al dejar de agitar, se asienta.
   · Cada sacudida acerca la cámara. Cuando el vidrio llena
     la pantalla: el cristal suena, cae la ventisca y se abre
     la invitación.
   ========================================================= */
import { THREE, mat, tex, house, pine, xmasTree, lamp, northPole, sleigh, santa, reindeer, elf, giftPile, gift, warmEnvironment, mesh, glowSprite, rngFrom } from './mundo.js?v=6';

const P = window.POSADA;
const $ = s => document.querySelector(s);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const og = new URLSearchParams(location.search).has('og');
const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const V = (x, y, z) => new THREE.Vector3(x, y, z);

const gate = $('#gate'), cvs = $('#globeCanvas'), open = $('#open'), shakeText = $('#shakeText'), skip = $('#skip');
P.globeLoaded = true;

/* ---------- Sensores ---------- */
const S = { g: V(0, -1, 0), a: V(), raw: 0, mag: 0, rot: 0, lastRot: 0, motion: false, sign: null, lp: null };
P.sensor = S;
const scrAngle = () => ((screen.orientation && screen.orientation.angle) || window.orientation || 0) * Math.PI / 180;
const rot2 = (x, y) => { const a = scrAngle(), c = Math.cos(a), s = Math.sin(a); return [x * c + y * s, -x * s + y * c]; };
function onMotion(e) {
  const ig = e.accelerationIncludingGravity, la = e.acceleration, rr = e.rotationRate;
  if (!ig || ig.x == null) return;
  S.motion = true;
  if (!S.lp) S.lp = { x: ig.x, y: ig.y, z: ig.z || 0 };
  const k = .12;
  S.lp.x += (ig.x - S.lp.x) * k; S.lp.y += (ig.y - S.lp.y) * k; S.lp.z += ((ig.z || 0) - S.lp.z) * k;
  const s = S.sign != null ? S.sign : (isIOS ? -1 : 1);
  // gravedad en ejes del teléfono (x derecha, y arriba, z hacia ti) = ejes de la escena
  const [gx, gy] = rot2(-s * S.lp.x / 9.81, -s * S.lp.y / 9.81);
  S.g.set(gx, gy, -s * S.lp.z / 9.81);
  if (S.g.lengthSq() < .01) S.g.set(0, -1, 0); else S.g.normalize();
  let lx, ly, lz;
  if (la && la.x != null) { lx = la.x; ly = la.y; lz = la.z || 0; } else { lx = ig.x - S.lp.x; ly = ig.y - S.lp.y; lz = (ig.z || 0) - S.lp.z; }
  const [ax, ay] = rot2(s * lx, s * ly);
  S.a.set(clamp(ax, -40, 40), clamp(ay, -40, 40), clamp(s * lz, -40, 40));
  S.raw = Math.min(45, Math.hypot(lx, ly, lz));
  if (rr && rr.alpha != null) S.rot = rr.alpha * Math.PI / 180;
}
function onOrient(e) {
  if (S.sign != null || !S.lp || e.beta == null) return;
  if (scrAngle() === 0 && e.beta > 35 && e.beta < 145 && Math.abs(S.lp.y) > 5) S.sign = Math.sign(S.lp.y);
}
function askMotion() {
  const DME = window.DeviceMotionEvent, DOE = window.DeviceOrientationEvent;
  // Se escucha desde ya: si el sistema manda datos, se usan.
  addEventListener('devicemotion', onMotion); addEventListener('deviceorientation', onOrient);
  if (DME && typeof DME.requestPermission === 'function') {
    const asks = [DME.requestPermission()];
    if (DOE && typeof DOE.requestPermission === 'function') asks.push(DOE.requestPermission().catch(() => 'denied'));
    return Promise.all(asks).then(r => r[0] === 'granted').catch(() => false);
  }
  return Promise.resolve(!!DME);
}

/* ---------- Arranque ---------- */
let renderer = null;
try {
  renderer = new THREE.WebGLRenderer({ canvas: cvs, antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: og });
} catch (e) { renderer = null; }
if (!renderer) {
  P.noGlobe();
} else {
  if (!og && document.fonts && document.fonts.ready) await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1500))]);
  build();
}

function build() {
  if (gate.classList.contains('nogl')) return;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, og ? 1 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.environment = warmEnvironment(renderer, 'room');
  const camera = new THREE.PerspectiveCamera(30, 1, .05, 80);
  scene.add(camera);
  // La sala de atrás, muy desenfocada, también dentro de la escena: así el vidrio la refracta.
  const roomSmall = document.createElement('canvas');
  const roomTex = new THREE.CanvasTexture(roomSmall); roomTex.colorSpace = THREE.SRGBColorSpace;
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: roomTex, toneMapped: false, depthWrite: false }));
  backdrop.renderOrder = -1; camera.add(backdrop);
  function paintBackdrop() {
    const src = document.getElementById('room'); if (!src || !src.width) return;
    roomSmall.width = 140; roomSmall.height = Math.max(60, Math.round(140 * src.height / src.width));
    roomSmall.getContext('2d').drawImage(src, 0, 0, roomSmall.width, roomSmall.height);
    roomTex.needsUpdate = true;
  }

  // luces: lámpara cálida, relleno frío, contraluz y una vela
  const key = new THREE.SpotLight(0xffd6a0, 210, 0, .5, .9, 2);
  key.position.set(-3.4, 5.2, 4.2); key.target.position.set(0, -.5, 0);
  key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.bias = -.0004; key.shadow.normalBias = .02;
  key.shadow.camera.near = 2; key.shadow.camera.far = 14;
  scene.add(key, key.target);
  scene.add(new THREE.HemisphereLight(0xb7c4dc, 0x2a1a10, .45));
  const rim = new THREE.DirectionalLight(0xffb27a, 1.6); rim.position.set(3.5, 2.5, -4); scene.add(rim);

  // mesa de nogal que se desvanece en la penumbra
  const wood = tex('walnut').clone(); wood.repeat.set(3, 3); wood.needsUpdate = true;
  const table = new THREE.Mesh(new THREE.PlaneGeometry(22, 22), new THREE.MeshPhysicalMaterial({ map: wood, roughness: .42, clearcoat: .8, clearcoatRoughness: .14, alphaMap: tex('fade'), transparent: true }));
  table.rotation.x = -Math.PI / 2; table.position.set(0, -1.5, 2.5); table.receiveShadow = true;
  scene.add(table);
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 2.8), new THREE.MeshBasicMaterial({ map: tex('blob'), transparent: true, depthWrite: false, opacity: .85 }));
  blob.rotation.x = -Math.PI / 2; blob.position.y = -1.497; scene.add(blob);

  // detalles sobre la mesa: regalos y una vela
  const g1 = gift(.5, 0); g1.position.set(-1.75, -1.5, -.75); g1.rotation.y = .5; scene.add(g1);
  const g2 = gift(.32, 3); g2.position.set(-1.35, -1.5, -.15); g2.rotation.y = -.3; scene.add(g2);
  const candle = new THREE.Group();
  const wax = mesh(new THREE.CylinderGeometry(.11, .11, .55, 20), new THREE.MeshStandardMaterial({ color: 0xf2ead8, roughness: .5 })); wax.position.y = .275; candle.add(wax);
  const holder = mesh(new THREE.CylinderGeometry(.2, .22, .06, 24), mat('brass')); holder.position.y = .03; candle.add(holder);
  const flame = glowSprite(.55, 0xffc070, 1); flame.position.y = .66; candle.add(flame);
  const flameCore = new THREE.Mesh(new THREE.SphereGeometry(.03, 8, 6), new THREE.MeshBasicMaterial({ color: 0xfff1c8 })); flameCore.scale.y = 1.8; flameCore.position.y = .62; candle.add(flameCore);
  candle.position.set(1.65, -1.5, -.9); if (!og) scene.add(candle);
  const candleLight = new THREE.PointLight(0xffa850, 1.4, 6, 2); candleLight.position.set(1.65, -.8, -.9); scene.add(candleLight);

  /* ----- La esfera ----- */
  const rig = new THREE.Group(); rig.position.y = -1.5; scene.add(rig);   // pivote en la base
  const globe = new THREE.Group(); globe.position.y = 1.5; rig.add(globe);

  // base torneada de caoba, con latón y listón escocés
  const prof = [[0, -1.5], [1.02, -1.5], [1.045, -1.47], [1.035, -1.42], [.985, -1.395], [.975, -1.36], [.935, -1.33], [.86, -1.2], [.8, -1.06], [.765, -.985], [.765, -.95], [.72, -.925], [.665, -.88], [.62, -.835], [.56, -.82], [0, -.82]].map(([x, y]) => new THREE.Vector2(x, y));
  globe.add(mesh(new THREE.LatheGeometry(prof, 96), mat('mahogany')));
  const ring = mesh(new THREE.TorusGeometry(.768, .022, 12, 120), mat('brass')); ring.rotation.x = Math.PI / 2; ring.position.y = -.965; globe.add(ring);
  const bead = mesh(new THREE.TorusGeometry(.985, .014, 10, 120), mat('brass')); bead.rotation.x = Math.PI / 2; bead.position.y = -1.385; globe.add(bead);
  const rAt = y => .8 + (-1.06 - y) / .14 * .06;
  const band = new THREE.CylinderGeometry(rAt(-1.1) + .007, rAt(-1.2) + .007, .1, 120, 1, true);
  const buv = band.attributes.uv; for (let i = 0; i < buv.count; i++) buv.setX(i, buv.getX(i) * 9);
  const bandM = mesh(band, mat('tartan')); bandM.position.y = -1.15; globe.add(bandM);
  const bow = new THREE.Group();
  [-1, 1].forEach(s => {
    const loop = mesh(new THREE.TorusGeometry(.07, .022, 8, 20), mat('tartan')); loop.scale.set(1.3, .8, .5); loop.position.set(s * .075, .01, 0); loop.rotation.z = s * .25; bow.add(loop);
    const tail = mesh(new THREE.BoxGeometry(.04, .13, .012), mat('tartan')); tail.position.set(s * .035, -.07, 0); tail.rotation.z = s * .35; bow.add(tail);
  });
  bow.add(mesh(new THREE.SphereGeometry(.028, 10, 8), mat('tartan')));
  bow.position.set(0, -1.15, rAt(-1.15) + .03); bow.rotation.x = -.2; globe.add(bow);
  const pr = rAt(-1.02) + .006, pw = .36;
  const plaque = mesh(new THREE.CylinderGeometry(pr, pr + .004, .075, 24, 1, true, -pw / pr / 2, pw / pr), mat('plaque').clone());
  plaque.material.side = THREE.DoubleSide;
  plaque.position.y = -1.025; globe.add(plaque);

  // la villa en miniatura
  const GROUND = -.42, SC = .112, RAD = .86;
  const moundH = r => .085 * Math.pow(Math.max(0, 1 - (r / RAD) ** 2), 1.4);
  const fillM = mat('snow').clone(); fillM.side = THREE.DoubleSide;
  globe.add(mesh(new THREE.SphereGeometry(.975, 64, 24, 0, Math.PI * 2, Math.acos(GROUND / .975), Math.PI - Math.acos(GROUND / .975)), fillM, false));
  const mg = new THREE.PlaneGeometry(1.95, 1.95, 90, 90); mg.rotateX(-Math.PI / 2);
  const mp = mg.attributes.position, nr = rngFrom(3), lim0 = Math.sqrt(.975 ** 2 - GROUND ** 2) - .01;
  for (let i = 0; i < mp.count; i++) {
    let x = mp.getX(i), z = mp.getZ(i); const r = Math.hypot(x, z);
    if (r > lim0) { x *= lim0 / r; z *= lim0 / r; }
    mp.setXYZ(i, x, GROUND + moundH(Math.hypot(x, z)) + (nr() - .5) * .004, z);
  }
  mg.computeVertexNormals();
  globe.add(mesh(mg, mat('snow')));

  const mini = new THREE.Group(); globe.add(mini);
  const tops = [];
  const place = (obj, x, z, ry = 0, s = 1, top = 0, rad = 0) => {
    const gx = x * SC, gz = z * SC;
    obj.position.set(gx, GROUND + moundH(Math.hypot(gx, gz)) - .004, gz);
    obj.rotation.y = ry; obj.scale.setScalar(SC * s);
    mini.add(obj);
    if (top) tops.push({ x: gx, z: gz, r: rad * SC * s, top: obj.position.y + top * SC * s });
    return obj;
  };
  const sh = house({ w: 3.2, d: 2.6, h: 1.9, timber: true, roof: 'roofRed', shutters: 'green',
    windows: [['f', -1.05, 1.15, .5, .62], ['f', 1.05, 1.15, .5, .62], ['g', 0, .55, .42, .42], ['r', .3, 1.1, .5, .55], ['l', .3, 1.1, .5, .55]],
    door: { x: 0, dw: .8, dh: 1.25, wreath: true, lanterns: true }, chimney: { x: .8, z: -.3, h: .9 } });
  place(sh, 0, -2.2, 0, 1, sh.userData.top, 1.9);
  const shop = house({ w: 2.6, d: 2.2, h: 1.55, wall: 'woodRed', roof: 'roofGreen', windows: [['f', -.9, 1.0, .38, .45], ['f', .9, 1.0, .38, .45]], door: { x: 0, dw: .9, dh: 1.05, open: true }, chimney: { x: -.6, h: .6 } });
  place(shop, -4.1, -.9, .55, 1, shop.userData.top, 1.6);
  const tree = xmasTree(3.9); place(tree, 3.95, -1.3, 0, 1, 3.9, 1.1);
  place(northPole(2.5), -2.4, 2.7, 0, 1, 2.7, .3);
  const SLA = Math.PI * .88;
  const sl = sleigh(); place(sl, 2.1, 2.5, SLA, 1, 1.2, 1.2);
  const st = santa(); st.position.set(-.85, .5, 0); st.rotation.y = Math.PI / 2 - .55; st.scale.setScalar(1.05); sl.add(st);
  const fx = Math.cos(SLA), fz = -Math.sin(SLA);
  [-1, 1].forEach(s => place(reindeer(), 2.1 + fx * 2.3 - fz * s * .45, 2.5 + fz * 2.3 + fx * s * .45, SLA, 1, 1.4, .5));
  place(lamp(2.2), -1.35, .25, 0, .75); place(lamp(2.2), 1.35, .15, 0, .75);
  place(giftPile(8, 4), 2.6, .3, 0, 1.2);
  place(elf({ coat: 'g', hat: 'r', carry: 'gift', k: 1 }), -3.0, .9, .4, 1.6);
  place(elf({ coat: 'r', hat: 'g', carry: 'gift', k: 2 }), 1.0, 1.1, -.6, 1.6);
  [[-5.7, -3.1, 3.2, 0], [5.8, -3.5, 3.4, 2], [-6.4, .7, 2.4, 1], [6.3, 1.3, 2.6, 0], [-4.9, 3.9, 2, 2], [5.0, 4.3, 1.8, 1], [-1.8, -5.3, 2.8, 2], [2.1, -5.5, 2.5, 0], [-6.0, -1.4, 2, 1]].forEach(([x, z, h, v]) => place(pine(1, v), x, z, x, h, .95, .7));
  const inLight = new THREE.PointLight(0xffb560, .5, 1.6, 2); inLight.position.set(0, -.15, -.05); globe.add(inLight);

  // vidrio
  const glass = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: .02, transmission: 1, thickness: .22, ior: 1.48,
    clearcoat: 1, clearcoatRoughness: .02, envMapIntensity: 1.0, attenuationColor: new THREE.Color(0xf2f6ff), attenuationDistance: 6
  }));
  glass.material.depthWrite = false;
  glass.renderOrder = 2;
  globe.add(glass);

  scene.traverse(o => { if (o.isMesh && o !== table && o !== blob && o !== glass) { o.castShadow = true; o.receiveShadow = true; } });
  glass.castShadow = false;
  mini.traverse(o => { if (o.isMesh) o.castShadow = false; });

  /* ----- Nieve ----- */
  const N = og ? 900 : 1300;
  const pos = new Float32Array(N * 3), vel = new Float32Array(N * 3), size = new Float32Array(N), phase = new Float32Array(N), glit = new Float32Array(N), vt = new Float32Array(N), set = new Uint8Array(N);
  const LIM = .955;
  const floorY = (x, z) => {
    let y = GROUND + moundH(Math.hypot(x, z));
    for (const t of tops) { const dx = x - t.x, dz = z - t.z; if (dx * dx + dz * dz < t.r * t.r && t.top > y) y = t.top; }
    return y;
  };
  const rs = rngFrom(19);
  for (let i = 0; i < N; i++) {
    const gl = i < N * .08;
    size[i] = gl ? .011 + rs() * .006 : .008 + Math.pow(rs(), 2.4) * .02;
    phase[i] = rs() * 6.283; glit[i] = gl ? 1 : 0;
    vt[i] = .045 + size[i] * 3.2;
    let x, y, z;
    do { x = (rs() * 2 - 1) * .9; z = (rs() * 2 - 1) * .9; } while (x * x + z * z > .78);
    if (rs() < .28) { y = -.3 + rs() * 1.15; set[i] = 0; } else { y = floorY(x, z) + .004; set[i] = 1; }
    const d = Math.hypot(x, y, z); if (d > LIM) { x *= LIM / d; y *= LIM / d; z *= LIM / d; }
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  sg.setAttribute('size', new THREE.BufferAttribute(size, 1));
  sg.setAttribute('phase', new THREE.BufferAttribute(phase, 1));
  sg.setAttribute('glit', new THREE.BufferAttribute(glit, 1));
  const snowMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uScale: { value: 1000 } },
    vertexShader: `attribute float size; attribute float phase; attribute float glit; uniform float uTime; uniform float uScale; varying float vA; varying float vG;
      void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mv; gl_PointSize = max(1.5, size * uScale / -mv.z);
        vA = .72 + .28 * sin(uTime * 2.3 + phase); vG = glit * pow(max(0., sin(uTime * 4.0 + phase * 3.0)), 6.0); }`,
    fragmentShader: `varying float vA; varying float vG; void main(){ vec2 c = gl_PointCoord - .5; float d = length(c); float a = smoothstep(.5, .12, d);
      vec3 col = mix(vec3(.97,.98,1.0), vec3(1.0,.88,.6), step(.001, vG)); gl_FragColor = vec4(col * (1.0 + vG * 2.5), a * mix(vA, 1.0, vG)); }`,
    transparent: true, depthWrite: false
  });
  const snow = new THREE.Points(sg, snowMat); snow.renderOrder = 3; snow.frustumCulled = false; globe.add(snow);

  const fluid = { u: V(), om: 0, e: 0, t: 0 };
  const tmpA = V(), gLocal = V(), invQ = new THREE.Quaternion(), ZERO = V();
  function stepSnow(dt, aWorld) {
    const F = fluid;
    // gravedad y aceleración llegan en el mundo; la nieve vive dentro de la esfera, que se inclina
    invQ.copy(rig.quaternion).invert();
    gLocal.copy(S.g).applyQuaternion(invQ);
    tmpA.copy(aWorld).applyQuaternion(invQ);
    const am = tmpA.length();
    F.u.addScaledVector(tmpA, -dt * .9).multiplyScalar(Math.exp(-dt / .35));
    F.e = Math.min(1.8, F.e + am * dt * .1) * Math.exp(-dt / 2.6);
    const dw = S.rot - S.lastRot; S.lastRot = S.rot;
    F.om = clamp(F.om - dw * .9, -3, 3) * Math.exp(-dt / 1.6);
    F.t += dt * (.35 + F.e * 1.2);
    const t = F.t, kR = 1 - Math.exp(-dt / .2), gm = gLocal.length(), ul = F.u.length();
    for (let i = 0; i < N; i++) {
      const j = i * 3;
      let x = pos[j], y = pos[j + 1], z = pos[j + 2];
      const r2 = x * x + y * y + z * z, wall = Math.max(0, 1 - r2);
      if (set[i]) {
        if (ul * wall + Math.abs(F.om) * Math.sqrt(r2) * .6 + F.e * .55 * wall < .16) continue;
        set[i] = 0;
      }
      const a1 = 2.1 * y + 1.3 * t, b1 = 1.7 * z - .9 * t, a2 = 1.9 * z + 1.1 * t, b2 = 2.3 * x - .7 * t, a3 = 2.2 * x - 1.2 * t, b3 = 1.8 * y + .8 * t;
      const d1y = 2.1 * Math.cos(a1) * Math.sin(b1), d1z = 1.7 * Math.sin(a1) * Math.cos(b1);
      const d2z = 1.9 * Math.cos(a2) * Math.sin(b2), d2x = 2.3 * Math.sin(a2) * Math.cos(b2);
      const d3x = 2.2 * Math.cos(a3) * Math.sin(b3), d3y = 1.8 * Math.sin(a3) * Math.cos(b3);
      const ew = F.e * wall * .45;
      const fx = F.u.x * wall - F.om * y + (d3y - d2z) * ew;
      const fy = F.u.y * wall + F.om * x + (d1z - d3x) * ew;
      const fz = F.u.z * wall + (d2x - d1y) * ew;
      vel[j] += (fx + gLocal.x * vt[i] - vel[j]) * kR - tmpA.x * dt * .02;
      vel[j + 1] += (fy + gLocal.y * vt[i] - vel[j + 1]) * kR - tmpA.y * dt * .02;
      vel[j + 2] += (fz + gLocal.z * vt[i] - vel[j + 2]) * kR - tmpA.z * dt * .02;
      x += vel[j] * dt; y += vel[j + 1] * dt; z += vel[j + 2] * dt;
      const fl = floorY(x, z);
      if (y < fl) {
        y = fl; if (vel[j + 1] < 0) vel[j + 1] *= -.1;
        if (gLocal.y < -.35 && F.e < .3 && Math.abs(vel[j]) + Math.abs(vel[j + 1]) + Math.abs(vel[j + 2]) < .16) set[i] = 1;
      }
      const d2 = x * x + y * y + z * z, lim = LIM - size[i] * .5;
      if (d2 > lim * lim) {
        const d = Math.sqrt(d2), nx = x / d, ny = y / d, nz = z / d;
        x = nx * lim; y = ny * lim; z = nz * lim;
        const vr = vel[j] * nx + vel[j + 1] * ny + vel[j + 2] * nz;
        if (vr > 0) { vel[j] -= vr * nx * 1.15; vel[j + 1] -= vr * ny * 1.15; vel[j + 2] -= vr * nz * 1.15; }
        if (gm > .35 && F.e < .3 && (gLocal.x * nx + gLocal.y * ny + gLocal.z * nz) / gm > .7 && Math.abs(vel[j]) + Math.abs(vel[j + 1]) + Math.abs(vel[j + 2]) < .12) set[i] = 1;
      }
      pos[j] = x; pos[j + 1] = y; pos[j + 2] = z;
    }
    sg.attributes.position.needsUpdate = true;
  }

  /* ----- Cámara y encuadre ----- */
  const view = { d0: 9, base: V(0, -.3, 0), dir: V(0, .2, 1).normalize(), tan: Math.tan(THREE.MathUtils.degToRad(15)) };
  function frame() {
    const W = innerWidth, H = innerHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    const wide = W >= H;
    const halfW = og ? 1.25 : 1.32, halfH = og ? 1.9 : wide ? 2.35 : 1.75;
    view.d0 = Math.max(halfW / (view.tan * camera.aspect), halfH / view.tan);
    const visH = 2 * view.d0 * view.tan;
    // en vertical la esfera va arriba y el texto abajo
    view.base.set(og ? 1.9 : 0, og ? -.35 : -.3 - visH * (wide ? .17 : .15), 0);
    camera.updateProjectionMatrix();
    const BD = 40, bh = 2 * BD * view.tan * 1.12;
    backdrop.position.set(0, 0, -BD); backdrop.scale.set(bh * camera.aspect, bh, 1);
    paintBackdrop();
    snowMat.uniforms.uScale.value = renderer.domElement.height / (2 * view.tan);
  }
  frame();
  addEventListener('resize', frame);

  /* ----- La sacudida ----- */
  const B = { p: V(), v: V(), rx: 0, rz: 0, vrx: 0, vrz: 0, lift: 0, vl: 0, p0: 0, ps: 0, armed: false, done: false, finished: false };
  let drag = null, tArm = 0, shakes = 0, jingleAt = 0, high = false, landed = true;

  cvs.addEventListener('pointerdown', e => {
    if (!B.armed || B.done) return;
    drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, px: 0, py: 0, pvx: 0, pvy: 0 };
    try { cvs.setPointerCapture(e.pointerId); } catch (err) { /* nada */ }
  });
  cvs.addEventListener('pointermove', e => { if (drag && e.pointerId === drag.id) { drag.x = e.clientX; drag.y = e.clientY; } });
  const endDrag = e => { if (drag && e.pointerId === drag.id) drag = null; };
  cvs.addEventListener('pointerup', endDrag); cvs.addEventListener('pointercancel', endDrag);

  const aW = V(), target = V(), held = V();
  let last = performance.now();
  function tick(now) {
    const dt = Math.min(.05, (now - last) / 1000 || .016); last = now;
    const t = now / 1000;
    aW.set(0, 0, 0);
    let mag = 0;
    if (B.armed && !B.done) {
      if (drag) {
        const ppu = innerHeight / (2 * camera.position.distanceTo(target) * view.tan);
        const ox = clamp((drag.x - drag.x0) / ppu, -.35, .35), oy = clamp(-(drag.y - drag.y0) / ppu, -.2, .35);
        const vx = (ox - drag.px) / dt, vy = (oy - drag.py) / dt;
        aW.set(clamp((vx - drag.pvx) / dt / 4, -40, 40), clamp((vy - drag.pvy) / dt / 4, -40, 40), 0);
        drag.px = ox; drag.py = oy; drag.pvx = vx; drag.pvy = vy;
        mag = aW.length();
        const kk = 1 - Math.exp(-dt / .05);
        B.p.x += (ox - B.p.x) * kk; B.p.y += (Math.max(0, oy) - B.p.y) * kk; B.v.set(0, 0, 0);
        B.rz += (-vx * .04 - B.rz) * (1 - Math.exp(-dt / .1)); B.vrz = 0;
      } else if (S.motion) {
        aW.copy(S.a); mag = S.raw || 0;
      }
      S.mag += (mag - S.mag) * (1 - Math.exp(-dt / .12));
      const rate = clamp((S.mag - 6) / 12, 0, 1.6) / 2.4;
      if (rate > 0) {
        B.p0 = Math.min(1, B.p0 + rate * dt);
        if (B.p0 > .05 && !shakes) { shakes = 1; shakeText.textContent = 'Sigue. La nieve ya despertó.'; }
        if (B.p0 > .5 && shakes === 1) { shakes = 2; shakeText.textContent = 'Un poco más.'; }
      }
      const hi = mag > 13;
      if (hi && !high && now - jingleAt > 110) { P.audio.jingle(clamp(mag / 22, .4, 1.4)); jingleAt = now; }
      high = hi;
      if (!skip.dataset.shown && now - tArm > 12000) { skip.hidden = false; skip.dataset.shown = '1'; }
    }
    // cuerpo rígido: se levanta y se sacude como en la mano; al soltarla, se asienta
    if (!drag) {
      const k = 160, c = 11, F = 2.4;
      B.v.x += (aW.x * F - k * B.p.x - c * B.v.x) * dt;
      B.v.y += (aW.y * F * .6 - k * B.p.y - c * B.v.y) * dt;
      B.v.z += (aW.z * F * .5 - k * B.p.z - c * B.v.z) * dt;
      B.p.addScaledVector(B.v, dt).clampScalar(-.3, .3);
      const kr = 150, cr = 10;
      B.vrz += (-aW.x * 2.6 - kr * B.rz - cr * B.vrz) * dt;
      B.vrx += (aW.z * 1.8 - aW.y * .6 - kr * B.rx - cr * B.vrx) * dt;
      B.rz = clamp(B.rz + B.vrz * dt, -.35, .35); B.rx = clamp(B.rx + B.vrx * dt, -.3, .3);
    }
    const holding = B.armed && !B.done && (S.mag > 5 || drag);
    const liftT = holding ? Math.min(.22, .06 + Math.max(0, S.mag - 5) * .012) : 0;
    B.vl += ((liftT - B.lift) * 90 - B.vl * 12) * dt;
    B.lift += B.vl * dt;
    if (B.lift < 0) { if (B.vl < -.2 && !landed) P.audio.thud(Math.min(1, -B.vl * 1.5)); B.lift = 0; B.vl *= -.25; landed = true; }
    if (B.lift > .03) landed = false;
    const off = Math.max(0, B.lift + B.p.y), tilt = Math.min(1, off * 8 + .15);
    rig.position.set(B.p.x, -1.5 + off, B.p.z);
    rig.rotation.set(B.rx * tilt, 0, B.rz * tilt);
    blob.material.opacity = .85 * clamp(1 - off * 3.2, .25, 1);
    blob.scale.setScalar(1 + off * 1.2);
    blob.position.x = B.p.x;

    stepSnow(dt, B.armed ? aW : ZERO);
    snowMat.uniforms.uTime.value = t;

    // la cámara se acerca con cada sacudida
    B.ps += (B.p0 - B.ps) * (1 - Math.exp(-dt / (B.p0 >= 1 ? .18 : .5)));
    const e = B.ps, ease = e * e * (3 - 2 * e);
    const dist = view.d0 + (2.05 - view.d0) * Math.pow(e, 1.7);
    held.set(B.p.x * .6, off * .6, 0);
    target.lerpVectors(view.base, held, ease);
    camera.position.copy(target).addScaledVector(view.dir, dist);
    camera.lookAt(target);
    gate.style.setProperty('--p', e.toFixed(3));

    // vela y lámpara: parpadeo leve; focos del árbol
    const fl = .9 + Math.sin(t * 9.3) * .05 + Math.sin(t * 13.7) * .04 + Math.sin(t * 3.1) * .03;
    candleLight.intensity = 1.4 * fl; flame.scale.set(.5 * fl, .62 * fl, 1);
    key.intensity = 210 * (.97 + Math.sin(t * 1.3) * .015);
    tree.userData.lights.forEach((l, i) => l.material.color.setHSL(.1 - (i % 4) * .02, .9, .5 + .25 * Math.sin(t * 1.7 + i * 1.3)));

    renderer.render(scene, camera);
    if (B.armed && !B.done && B.ps > .985) tope();
    if (!B.finished) requestAnimationFrame(tick);
  }

  function arm() {
    if (B.armed) return;
    B.armed = true; tArm = performance.now();
    P.audio.unlock();
    gate.classList.add('armed');
    if (reduce) { B.done = true; setTimeout(() => P.reveal(), 400); return; }
    const touch = isIOS || 'ontouchstart' in window;
    shakeText.textContent = touch ? 'Agita tu teléfono.' : 'Arrastra la esfera de un lado a otro.';
    gate.classList.toggle('desk', !touch);
    askMotion().then(() => setTimeout(() => { if (!S.motion && !B.done && !shakes) { shakeText.textContent = 'Arrastra la esfera de un lado a otro.'; gate.classList.add('desk'); } }, 1400));
  }

  function tope() {
    B.done = true;
    P.audio.clink();
    setTimeout(() => P.audio.whoosh(), 120);
    if (navigator.vibrate) try { navigator.vibrate([25, 40, 70]); } catch (err) { /* nada */ }
    P.snowfall.burst(() => {
      B.finished = true;
      P.reveal();
      setTimeout(() => { renderer.dispose(); sg.dispose(); }, 800);
    });
  }

  open.addEventListener('click', arm);
  skip.addEventListener('click', () => { if (B.armed && !B.done) B.p0 = 1; });

  if (og) {
    for (let i = 0; i < 4; i++) stepSnow(.03, ZERO);
    // se redibuja unos segundos: si la ventana cambia de tamaño, el lienzo se borra
    const t0 = performance.now();
    const still = () => {
      camera.position.copy(view.base).addScaledVector(view.dir, view.d0); camera.lookAt(view.base);
      renderer.render(scene, camera);
      if (performance.now() - t0 < 8000) requestAnimationFrame(still);
    };
    still();
    document.documentElement.classList.add('og-ready');
  } else {
    gate.classList.add('ready');
    P.globeReady = true;
    requestAnimationFrame(tick);
  }
}
