/* =========================================================
   villa.js — la villa del fondo, en 3D.

   Un camino nevado baja por la villa al anochecer. La cámara
   la mira desde arriba y avanza con el scroll: cada hueco
   (.slot) entre tarjetas queda encima de un lugar —la casa
   de Santa, el taller, el correo, la plaza del árbol, el
   lago y el establo— y en cada uno hay duendes trabajando.
   ========================================================= */
import { THREE, mat, tex, house, pine, forest, xmasTree, lamp, northPole, sleigh, santa, reindeer, elf, giftPile, sack, mailbox, bench, fence, hayBale, workbench, ladder, cabin, envelope, warmEnvironment, mesh, rbox, glowSprite, rngFrom, snowDrift } from './mundo.js?v=6';

const P = window.POSADA;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const cvs = document.getElementById('villaCanvas');

let renderer = null;
try { renderer = new THREE.WebGLRenderer({ canvas: cvs, antialias: true, powerPreference: 'high-performance' }); } catch (e) { renderer = null; }

if (renderer) {
  const small = Math.min(innerWidth, innerHeight) < 700;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, small ? 1.6 : 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const SKY = new THREE.Color(0x1d2840);
  scene.background = SKY;
  scene.fog = new THREE.FogExp2(0x253350, .016);
  scene.environment = warmEnvironment(renderer, 'dusk');
  const camera = new THREE.PerspectiveCamera(35, 1, .5, 200);

  scene.add(new THREE.HemisphereLight(0xaebedc, 0x464a56, 1.1));
  const moon = new THREE.DirectionalLight(0xc8d6f2, 1.5);
  moon.castShadow = true;
  moon.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
  Object.assign(moon.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 120 });
  moon.shadow.bias = -.0006; moon.shadow.normalBias = .04;
  scene.add(moon, moon.target);
  const pool = [0, 1, 2, 3].map(() => { const l = new THREE.PointLight(0xffb060, 0, 11, 2); scene.add(l); return l; });

  /* ----- Los lugares ----- */
  const GAP = 27;
  const L = [V(0, 0, 0), V(-2.5, 0, GAP), V(2.5, 0, GAP * 2), V(-1.5, 0, GAP * 3), V(2, 0, GAP * 4), V(-1, 0, GAP * 5)];
  const actors = [], smokes = [], spots = [], twinkles = [];
  const world = new THREE.Group(); scene.add(world);
  const put = (parent, obj, x, z, ry = 0, s = 1, y = 0) => { obj.position.set(x, y, z); obj.rotation.y = ry; obj.scale.setScalar(s); parent.add(obj); return obj; };
  const site = i => { const g = new THREE.Group(); g.position.copy(L[i]); world.add(g); return g; };
  const smokeAt = (g, h) => { if (h.userData.smoke) { h.updateMatrixWorld(true); g.updateMatrixWorld(true); smokes.push(h.localToWorld(h.userData.smoke.clone())); } };
  const spot = (g, x, y, z) => spots.push(V(x, y, z).add(g.position));

  // Actores: duendes que caminan de un punto a otro (y regresan)
  function walker(g, e, path, speed, pause, carry, phase = 0) {
    const pts = path.map(([x, z]) => V(x, 0, z));
    const segs = []; let len = 0;
    for (let i = 1; i < pts.length; i++) { const l = pts[i].distanceTo(pts[i - 1]); segs.push([pts[i - 1], pts[i], len, l]); len += l; }
    put(g, e, pts[0].x, pts[0].z, 0, e.userData.s || 1.25);
    const a = { s: phase * len, dir: 1, wait: 0, t: Math.random() * 6 };
    actors.push(dt => {
      a.t += dt;
      let moving = true;
      if (a.wait > 0) { a.wait -= dt; moving = false; }
      else {
        a.s += a.dir * speed * dt;
        if (a.s >= len) { a.s = len; a.dir = -1; a.wait = pause[1]; }
        else if (a.s <= 0) { a.s = 0; a.dir = 1; a.wait = pause[0]; }
      }
      let sg = segs[segs.length - 1]; for (const q of segs) if (a.s <= q[2] + q[3]) { sg = q; break; }
      const k = (a.s - sg[2]) / sg[3], dx = sg[1].x - sg[0].x, dz = sg[1].z - sg[0].z;
      e.position.set(sg[0].x + dx * k, 0, sg[0].z + dz * k);
      const yaw = Math.atan2(dx * a.dir, dz * a.dir);
      e.rotation.y += (((yaw - e.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * Math.min(1, dt * 8);
      const sw = moving ? Math.sin(a.t * 11) * .55 : 0;
      if (e.userData.legs) { e.userData.legs[0].rotation.x = sw; e.userData.legs[1].rotation.x = -sw; }
      e.position.y = moving ? Math.abs(Math.sin(a.t * 11)) * .03 : 0;
      if (e.userData.load && carry) e.userData.load.visible = carry === 'out' ? a.dir > 0 : a.dir < 0;
      if (e.userData.prop) e.userData.prop.visible = true;
    });
    return e;
  }
  function skater(g, e, cx, cz, rx, rz, w, ph) {
    put(g, e, cx, cz, 0, 1.25);
    let th = ph;
    actors.push(dt => {
      th += w * dt;
      const x = cx + Math.cos(th) * rx, z = cz + Math.sin(th) * rz;
      const dx = -Math.sin(th) * rx * Math.sign(w), dz = Math.cos(th) * rz * Math.sign(w);
      e.position.set(x, .04, z);
      e.rotation.set(0, Math.atan2(dx, dz), -Math.sign(w) * .14);
      const sw = Math.sin(th * 3) * .45;
      e.userData.legs[0].rotation.x = sw; e.userData.legs[1].rotation.x = -sw;
    });
  }
  function grazer(g, d, x, z, ry, s = 1.1) {
    put(g, d, x, z, ry, s);
    const ph = Math.random() * 10;
    actors.push((dt, t) => { const k = Math.max(0, Math.sin((t + ph) * .45)); d.userData.head.rotation.z = -.75 * Math.min(1, k * 1.6); });
  }

  /* 0 · Casa de Santa */
  {
    const g = site(0);
    const h = house({ w: 5.2, d: 4, h: 3, timber: true, roof: 'roofRed', shutters: 'green',
      windows: [['f', -1.65, 1.7, .75, .95], ['f', 1.65, 1.7, .75, .95], ['g', 0, .85, .6, .6], ['r', -.6, 1.7, .7, .85], ['r', .9, 1.7, .7, .85], ['l', 0, 1.7, .7, .85]],
      door: { x: 0, dw: 1.15, dh: 1.9, wreath: true, lanterns: true }, chimney: { x: 1.3, z: -.6, h: 1.4 } });
    put(g, h, 0, -2.6); smokeAt(g, h);
    const SA = Math.PI * 1.22, sl = put(g, sleigh(), 3.6, .4, SA, 1.35);
    const fx = Math.cos(SA), fz = -Math.sin(SA);
    [[2.6, -.5], [2.6, .5], [3.9, -.5], [3.9, .5]].forEach(([d, s]) => {
      const r = put(g, reindeer(), 3.6 + fx * d - fz * s, .4 + fz * d + fx * s, SA, 1.15);
      const ph = Math.random() * 9;
      actors.push((dt, t) => { r.userData.head.rotation.z = Math.sin((t + ph) * .8) * .08; });
    });
    const sn = put(g, santa(), 5.2, 1.7, -.5, 1.35);
    actors.push((dt, t) => { sn.rotation.y = -.5 + Math.sin(t * .6) * .12; });
    put(g, giftPile(10, 7), -3.4, 1.2, 0, 1.5);
    put(g, northPole(3), -4.9, -.4, 0, 1);
    put(g, lamp(2.6), -2.2, .7); put(g, lamp(2.6), 2.1, .7);
    walker(g, elf({ coat: 'g', hat: 'r', carry: 'gift', k: 1 }), [[-2.8, 1.9], [0, 2.5], [2.2, 1.6]], 1.25, [1.4, .9], 'out', 0);
    walker(g, elf({ coat: 'r', hat: 'g', carry: 'gift', k: 3 }), [[-2.6, 2.4], [0, 3.0], [2.4, 2.2]], 1.05, [1, 1.3], 'out', .55);
    put(g, elf({ coat: 'g', hat: 'g' }), 4.3, 2.4, -.8, 1.25);
    spot(g, 0, 1.9, .2); spot(g, 3.2, 1.6, 1.2);
  }

  /* 1 · Taller de juguetes */
  {
    const g = site(1);
    const h = house({ w: 6.6, d: 3.8, h: 2.6, wall: 'woodRed', roof: 'roofGreen', pitch: .62,
      windows: [['f', -2.5, 1.5, .7, .75], ['f', 2.5, 1.5, .7, .75], ['r', 0, 1.5, .7, .75], ['l', 0, 1.5, .7, .75]],
      door: { x: 0, dw: 1.7, dh: 1.7, open: true }, chimney: { x: -1.8, z: -.4, h: 1.2 } });
    put(g, h, 0, -2.6); smokeAt(g, h);
    // rieles del carrito
    const a = V(.2, 0, -.5), b = V(3.9, 0, 2.6), d = b.clone().sub(a), len = d.length(), ang = Math.atan2(d.x, d.z);
    [-.28, .28].forEach(o => { const r = mesh(new THREE.BoxGeometry(.05, .05, len), mat('iron')); r.position.copy(a).add(b).multiplyScalar(.5); r.position.x += Math.cos(ang) * o; r.position.z -= Math.sin(ang) * o; r.position.y = .03; r.rotation.y = ang; g.add(r); });
    for (let i = 0; i < len / .5; i++) { const s = mesh(new THREE.BoxGeometry(.8, .04, .12), mat('wood')); s.position.copy(a).addScaledVector(d, i * .5 / len); s.position.y = .02; s.rotation.y = ang; g.add(s); }
    put(g, giftPile(12, 11), 4.3, 3.0, 0, 1.6);
    put(g, workbench(), -3.4, 1.0, 0, 1.2);
    const hm = put(g, elf({ coat: 'g', hat: 'g' }), -3.4, 1.9, Math.PI, 1.25);
    actors.push((dt, t) => { const k = Math.max(0, Math.sin(t * 7)); hm.userData.arms.children[1].rotation.x = -1.6 * k; });
    const cartE = elf({ coat: 'r', hat: 'r', carry: 'gift', k: 4 });
    const cart = new THREE.Group();
    const box = mesh(rbox(.5, .3, .7, .04), mat('wood')); box.position.y = .3; cart.add(box);
    [[-.27, -.22], [.27, -.22], [-.27, .22], [.27, .22]].forEach(([x, z]) => { const w = mesh(new THREE.CylinderGeometry(.09, .09, .05, 12), mat('iron')); w.rotation.z = Math.PI / 2; w.position.set(x, .1, z); cart.add(w); });
    cart.position.set(0, 0, .55); cart.scale.setScalar(.8); cartE.add(cart);
    walker(g, cartE, [[.2, -.3], [3.6, 2.3]], .8, [1.8, 1.4], 'out', .3);
    walker(g, elf({ coat: 'g', hat: 'r', carry: 'gift', k: 0 }), [[-.6, .2], [1.5, 2.4], [3.4, 3.4]], 1.2, [1, .8], 'out', .1);
    walker(g, elf({ coat: 'r', hat: 'g', carry: 'gift', k: 5 }), [[.6, .2], [2.6, 1.0], [4.9, 2.2]], 1.1, [1.3, 1], 'out', .7);
    spot(g, 0, 1.4, .6);
  }

  /* 2 · Oficina de cartas */
  {
    const g = site(2);
    const h = house({ w: 4.8, d: 3.6, h: 2.8, wall: 'stone', roof: 'roofSlate', windows: [['f', -1.5, 1.6, .7, .9], ['f', 1.5, 1.6, .7, .9], ['g', 0, .8, .5, .5], ['l', 0, 1.6, .7, .85]],
      door: { x: 0, dw: 1.0, dh: 1.8, mat: 'doorRed', lanterns: true }, chimney: { x: -1.2, z: -.5, h: 1.1 } });
    put(g, h, 1.2, -2.6); smokeAt(g, h);
    put(g, mailbox(), -1.8, 1.0, 0, 1.2);
    [[3.9, .5], [4.6, 1.0], [4.2, 1.4]].forEach(([x, z], i) => put(g, sack(.42), x, z, i, 1));
    put(g, bench(), 4.5, 2.6, -.3, 1.1);
    put(g, elf({ coat: 'g', hat: 'r', carry: 'letters' }), 4.2, 3.2, Math.PI + .3, 1.25);
    walker(g, elf({ coat: 'r', hat: 'g', carry: 'sack' }), [[-3.8, 3.2], [-1.0, 2.6], [1.2, .4]], 1.05, [1.4, 1], 'out', .1);
    walker(g, elf({ coat: 'g', hat: 'g', carry: 'letters' }), [[-4.2, 2.2], [-1.4, 1.8], [1.0, .3]], 1.2, [1.1, 1.3], 'out', .6);
    for (let i = 0; i < 4; i++) {
      const ev = put(g, envelope(), 0, 0, 0, 1.6); const ph = i * 1.57;
      actors.push((dt, t) => { const k = t * .5 + ph; ev.position.set(1.2 + Math.sin(k) * 3.4, 3.6 + Math.sin(k * 2 + .6) * .8 + Math.sin(t * 2.3 + ph) * .15, -1.4 + Math.cos(k) * 1.6); ev.rotation.set(Math.sin(t * 3 + ph) * .5, k, Math.sin(t * 2 + ph) * .4); });
    }
    spot(g, 1.2, 1.8, .4);
  }

  /* 3 · Plaza del árbol */
  {
    const g = site(3);
    const plaza = mesh(new THREE.CircleGeometry(6.2, 64), mat('cobble'));
    plaza.material = mat('cobble').clone(); plaza.material.map = tex('cobble').clone(); plaza.material.map.repeat.set(5, 5); plaza.material.map.needsUpdate = true;
    plaza.rotation.x = -Math.PI / 2; plaza.position.y = .02; g.add(plaza);
    const tree = put(g, xmasTree(7.5), 0, -.6);
    twinkles.push(tree.userData.lights);
    const lad = put(g, ladder(3.6), 2.25, .2, 0); lad.rotation.z = .42;
    const cl = put(g, elf({ coat: 'g', hat: 'r', carry: 'gift', k: 2 }), 0, 0, -Math.PI / 2, 1.25);
    const ca = { t: .1, dir: 1, wait: 0 };
    actors.push(dt => {
      if (ca.wait > 0) ca.wait -= dt; else { ca.t += ca.dir * dt * .18; if (ca.t > .78) { ca.t = .78; ca.dir = -1; ca.wait = 2.2; } if (ca.t < .08) { ca.t = .08; ca.dir = 1; ca.wait = 2; } }
      const h = ca.t * 3.4; cl.position.set(2.25 - Math.sin(.42) * h + .12, Math.cos(.42) * h, .32);
      if (cl.userData.load) cl.userData.load.visible = ca.dir > 0 || ca.wait <= 0 && ca.dir > 0;
    });
    [[0, 'r', 'g', 1], [Math.PI, 'g', 'r', 3]].forEach(([ph, c, hh, k]) => {
      const e = put(g, elf({ coat: c, hat: hh, carry: 'gift', k }), 0, 0, 0, 1.25);
      let th = ph;
      actors.push((dt, t) => {
        th += .28 * dt; const x = Math.cos(th) * 3.6, z = -.6 + Math.sin(th) * 3.0;
        e.position.set(x, Math.abs(Math.sin(t * 11)) * .03, z); e.rotation.y = Math.atan2(-Math.sin(th) * 3.6, Math.cos(th) * 3.0);
        const sw = Math.sin(t * 11) * .55; e.userData.legs[0].rotation.x = sw; e.userData.legs[1].rotation.x = -sw;
      });
    });
    put(g, bench(), -4.3, 2.6, .5, 1.1); put(g, bench(), 4.4, 2.9, -.5, 1.1);
    put(g, lamp(2.6), -4.8, -1.2); put(g, lamp(2.6), 4.8, -1.2);
    spot(g, 0, 3, 1.6);
  }

  /* 4 · Lago helado */
  {
    const g = site(4);
    const ice = mesh(new THREE.CircleGeometry(1, 64), mat('ice'), false);
    ice.receiveShadow = true; ice.rotation.x = -Math.PI / 2; ice.scale.set(5.6, 3.9, 1); ice.position.set(-.6, .04, -.8); g.add(ice);
    const bank = mesh(new THREE.TorusGeometry(1, .09, 8, 64), mat('snow')); bank.rotation.x = Math.PI / 2; bank.scale.set(5.75, 4.05, 1.6); bank.position.set(-.6, .02, -.8); g.add(bank);
    skater(g, elf({ coat: 'r', hat: 'g' }), -.6, -.8, 3.8, 2.4, .5, 0);
    skater(g, elf({ coat: 'g', hat: 'r' }), -1.4, -1.2, 2.0, 1.2, -.7, 1.4);
    skater(g, elf({ coat: 'g', hat: 'g' }), -.2, -.5, 4.6, 3.1, .38, 3.2);
    const cb = put(g, cabin(), 5.6, -3.0, -.5, 1.2); smokeAt(g, cb);
    put(g, bench(), 4.4, 2.0, -.6, 1.1);
    put(g, elf({ coat: 'r', hat: 'r' }), 4.4, 2.8, Math.PI - .5, 1.25);
    spot(g, 5.0, 1.4, -1.6);
  }

  /* 5 · Establo de los renos */
  {
    const g = site(5);
    const h = house({ w: 5.2, d: 4, h: 2.9, wall: 'woodRed', roof: 'roofBrown', pitch: .8, windows: [['f', -1.8, 1.9, .6, .6], ['f', 1.8, 1.9, .6, .6], ['g', 0, .9, .55, .55]],
      door: { x: 0, dw: 1.7, dh: 2.0, mat: 'doorRed' } });
    put(g, h, -1.2, -3.2);
    [[1, -1], [-1, 1]].forEach(([a]) => { const x = mesh(new THREE.BoxGeometry(.1, 2.6, .06), mat('beam')); x.position.set(-1.2, 1.3, -1.15); x.rotation.z = a * .7; g.add(x); });
    const F = (x, z, len, n, ry) => put(g, fence(len, n), x, z, ry);
    F(1.5, -.4, 5.6, 6, 0); F(1.5, 4.2, 5.6, 6, 0); F(4.3, 1.9, 4.6, 5, Math.PI / 2); F(-1.3, 2.6, 3.2, 3, Math.PI / 2);
    grazer(g, reindeer(), .6, 2.0, .4); grazer(g, reindeer(), 3.0, 3.2, Math.PI + .3);
    const wd = put(g, reindeer(), 2, 1, 0, 1.1);
    const wa = { x: 0, dir: 1, wait: 0, t: 0 };
    actors.push(dt => {
      wa.t += dt;
      if (wa.wait > 0) { wa.wait -= dt; } else { wa.x += wa.dir * dt * .45; if (wa.x > 1.6) { wa.x = 1.6; wa.dir = -1; wa.wait = 3; } if (wa.x < -1.2) { wa.x = -1.2; wa.dir = 1; wa.wait = 2.5; } }
      wd.position.set(2 + wa.x, 0, .8); wd.rotation.y = wa.dir > 0 ? 0 : Math.PI;
      const sw = wa.wait > 0 ? 0 : Math.sin(wa.t * 6) * .35;
      wd.userData.legs.forEach((l, i) => { l.rotation.z = (i === 0 || i === 3 ? sw : -sw); });
    });
    put(g, hayBale(), -3.6, 2.4, .3, 1.1); put(g, hayBale(), -4.2, 3.5, -.4, 1);
    const be = elf({ coat: 'r', hat: 'g', carry: 'gift', k: 2 });
    be.userData.load.visible = false;
    const hay = mesh(new THREE.SphereGeometry(.25, 10, 8), mat('hay')); hay.scale.set(1, .6, 1); hay.position.set(0, .55, .26); be.add(hay); be.userData.load = hay;
    walker(g, be, [[-3.1, 3.2], [-2.2, 1.4], [-1.2, -.6]], .9, [1.8, 1.4], 'out', .2);
    spot(g, -1.2, 1.8, -.8);
  }

  /* ----- Terreno, camino y bosque ----- */
  const zMin = -30, zMax = GAP * 5 + 34;
  const roadPts = [V(0, 0, zMin)];
  L.forEach((l, i) => { roadPts.push(V(l.x * .4, 0, l.z + 5)); if (i < L.length - 1) roadPts.push(V((l.x + L[i + 1].x) / 2 + (i % 2 ? 2.4 : -2.4), 0, l.z + GAP * .55)); });
  roadPts.push(V(0, 0, zMax));
  const curve = new THREE.CatmullRomCurve3(roadPts);
  const samples = curve.getSpacedPoints(600);
  {
    const W = 2.8, posA = [], uvA = [], idx = [];
    let along = 0;
    samples.forEach((p, i) => {
      const n = samples[Math.min(i + 1, samples.length - 1)], q = samples[Math.max(i - 1, 0)];
      const tx = n.x - q.x, tz = n.z - q.z, l = Math.hypot(tx, tz) || 1, nx = -tz / l, nz = tx / l;
      if (i) along += p.distanceTo(samples[i - 1]);
      posA.push(p.x + nx * W / 2, .03, p.z + nz * W / 2, p.x - nx * W / 2, .03, p.z - nz * W / 2);
      uvA.push(0, along / 5, 1, along / 5);
      if (i) { const a = i * 2; idx.push(a - 2, a - 1, a, a - 1, a + 1, a); }
    });
    const rg = new THREE.BufferGeometry();
    rg.setAttribute('position', new THREE.Float32BufferAttribute(posA, 3)); rg.setAttribute('uv', new THREE.Float32BufferAttribute(uvA, 2)); rg.setIndex(idx); rg.computeVertexNormals();
    const road = new THREE.Mesh(rg, mat('road')); road.receiveShadow = true; world.add(road);
  }
  const nearRoad = (x, z, m) => { for (let i = 0; i < samples.length; i += 3) { const p = samples[i]; if (Math.abs(p.z - z) < m && Math.abs(p.x - x) < m) return true; } return false; };
  const inSite = (x, z, mx = 7.4, mz = 6.2) => L.some(l => Math.abs(x - l.x) < mx && Math.abs(z - l.z + .5) < mz);
  {
    const tg = new THREE.PlaneGeometry(70, zMax - zMin, 70, Math.round((zMax - zMin) / 1.2)); tg.rotateX(-Math.PI / 2);
    const tp = tg.attributes.position, r = rngFrom(5);
    for (let i = 0; i < tp.count; i++) {
      const x = tp.getX(i), z = tp.getZ(i) + (zMax + zMin) / 2;
      const flat = inSite(x, z, 7, 6) || nearRoad(x, z, 2.4) ? .1 : 1;
      tp.setY(i, (Math.sin(x * .35 + z * .12) * .25 + Math.sin(x * .9 - z * .5) * .12 + r() * .06) * flat - .02);
    }
    tg.computeVertexNormals();
    const snowTex = tex('snow').clone(); snowTex.repeat.set(18, 40); snowTex.needsUpdate = true;
    const ground = new THREE.Mesh(tg, new THREE.MeshStandardMaterial({ map: snowTex, roughness: .8, bumpMap: tex('noise'), bumpScale: 1 }));
    ground.position.z = (zMax + zMin) / 2; ground.receiveShadow = true; world.add(ground);
  }
  {
    const r = rngFrom(77), list = [];
    for (let z = zMin; z < zMax; z += 2.1) for (let x = -20; x < 20; x += 2.1) {
      const px = x + (r() - .5) * 1.8, pz = z + (r() - .5) * 1.8;
      if (inSite(px, pz) || nearRoad(px, pz, 2.6) || r() < .35) continue;
      list.push({ x: px, z: pz, h: 2.6 + r() * 3.2, ry: r() * 6, v: Math.floor(r() * 3) });
    }
    // pinos sueltos dentro de los lugares, al fondo
    L.forEach((l, i) => [[-6.5, -5], [6.6, -4.8], [-6.8, 1.5], [6.9, 2.2], [-3.5, -6.2], [3.8, -6.4]].forEach(([x, z], k) => { if ((i + k) % 3) list.push({ x: l.x + x, z: l.z + z, h: 3 + r() * 2.5, ry: r() * 6, v: k % 3 }); }));
    world.add(forest(list));
    // faroles a lo largo del camino
    for (let i = 20; i < samples.length - 20; i += 26) {
      const p = samples[i]; if (inSite(p.x, p.z, 8, 7)) continue;
      const side = (i / 26) % 2 ? 1 : -1;
      put(world, lamp(2.4), p.x + side * 2.1, p.z);
    }
  }

  /* ----- Humo de chimeneas ----- */
  const smokeSprites = [];
  smokes.forEach((p, i) => {
    for (let k = 0; k < 6; k++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex('smoke'), transparent: true, depthWrite: false, opacity: 0, color: 0xdfe4ec }));
      s.userData = { base: p, ph: k / 6 + i * .13 };
      world.add(s); smokeSprites.push(s);
    }
  });

  world.traverse(o => { if (o.isMesh && !o.isInstancedMesh) { if (o.geometry.type !== 'PlaneGeometry') o.castShadow = true; o.receiveShadow = true; } });

  /* ----- Cámara guiada por el scroll ----- */
  const anchors = [];
  const tgt = V(), camPos = V(), DIR = V(0, Math.sin(THREE.MathUtils.degToRad(56)), Math.cos(THREE.MathUtils.degToRad(56)));
  let dist = 30;
  function measure() {
    const W = innerWidth, H = innerHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    dist = Math.min(40, Math.max(16, 13.5 / (2 * tan * camera.aspect)));
    anchors.length = 0;
    document.querySelectorAll('.slot[data-site]').forEach(el => {
      const r = el.getBoundingClientRect();
      anchors.push({ y: r.top + scrollY + r.height / 2, i: +el.dataset.site });
    });
    anchors.sort((a, b) => a.y - b.y);
  }
  function targetFor(scroll) {
    const yc = scroll + innerHeight / 2;
    if (!anchors.length) return tgt.copy(L[0]);
    const A = anchors, pxPerUnit = (A.length > 1 ? (A[A.length - 1].y - A[0].y) / (L[A[A.length - 1].i].z - L[A[0].i].z) : 40);
    if (yc <= A[0].y) return tgt.copy(L[A[0].i]).setZ(L[A[0].i].z - (A[0].y - yc) / pxPerUnit);
    if (yc >= A[A.length - 1].y) { const l = L[A[A.length - 1].i]; return tgt.copy(l).setZ(l.z + (yc - A[A.length - 1].y) / pxPerUnit); }
    for (let k = 0; k < A.length - 1; k++) if (yc <= A[k + 1].y) {
      const t = (yc - A[k].y) / (A[k + 1].y - A[k].y), s = t * .55 + t * t * (3 - 2 * t) * .45;
      return tgt.lerpVectors(L[A[k].i], L[A[k + 1].i], s);
    }
    return tgt;
  }

  const look = V(), smooth = V(); let first = true, running = false, last = 0;
  function render(now) {
    const dt = Math.min(.05, (now - last) / 1000 || .016); last = now;
    const t = now / 1000;
    targetFor(scrollY);
    if (first) { smooth.copy(tgt); first = false; } else smooth.lerp(tgt, 1 - Math.exp(-dt / .12));
    look.copy(smooth); look.y = .6;
    camPos.copy(look).addScaledVector(DIR, dist);
    camera.position.copy(camPos); camera.lookAt(look);
    moon.position.copy(look).add(V(-14, 30, -8)); moon.target.position.copy(look);
    // las luces cálidas van a los puntos más cercanos
    spots.sort((a, b) => a.distanceToSquared(look) - b.distanceToSquared(look));
    pool.forEach((l, i) => { const s = spots[i]; if (s) { l.position.copy(s); l.intensity = 9 * (.94 + Math.sin(t * 3 + i) * .04); } });
    actors.forEach(fn => fn(dt, t));
    smokeSprites.forEach(s => { const k = (t * .16 + s.userData.ph) % 1; s.position.copy(s.userData.base).add(V(k * .9, k * 2.6, -k * .3)); s.scale.setScalar(.6 + k * 2.2); s.material.opacity = Math.sin(k * Math.PI) * .45; });
    twinkles.forEach(ls => ls.forEach((l, i) => l.material.color.setHSL(.1 - (i % 4) * .02, .9, .5 + .25 * Math.sin(t * 1.7 + i * 1.3))));
    renderer.render(scene, camera);
    if (running) requestAnimationFrame(render);
  }

  P.villa = {
    layout() { measure(); },
    start() {
      measure();
      cvs.classList.add('on');
      if (running) return;
      running = true; last = performance.now();
      if (reduce) { running = false; render(last); addEventListener('scroll', () => render(performance.now()), { passive: true }); return; }
      requestAnimationFrame(render);
    }
  };
  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(measure, 200); });
  if (P.opened) P.villa.start();
} else {
  document.documentElement.classList.add('novilla');
  P.villa = { layout() {}, start() {} };
}
