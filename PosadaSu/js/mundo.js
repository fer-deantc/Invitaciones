/* =========================================================
   mundo.js — las piezas 3D de la villa.

   Todo se modela y se texturiza aquí mismo, sin archivos
   externos: las texturas (madera, tejas, ladrillo, nieve,
   tela escocesa…) se pintan en un canvas al cargar, y las
   piezas (casas, pinos, Santa, renos, duendes, trineo…)
   se arman con geometría de Three.js. Las usan la esfera
   de la entrada y la villa del fondo.

   Unidades: 1 = 1 metro de la villa "real". La esfera usa
   las mismas piezas en miniatura.
   ========================================================= */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
export { THREE };

export const rngFrom = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const V = (x, y, z) => new THREE.Vector3(x, y, z);

/* =========================================================
   Texturas
   ========================================================= */
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function toTex(c, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
function valueNoise(size, octaves, seed, base = 4) {
  const rnd = rngFrom(seed), out = new Float32Array(size * size);
  let amp = 1, total = 0;
  for (let o = 0; o < octaves; o++) {
    const n = base << o, grid = new Float32Array(n * n);
    for (let i = 0; i < n * n; i++) grid[i] = rnd();
    for (let y = 0; y < size; y++) {
      const fy = y / size * n, y0 = Math.floor(fy), ty = fy - y0, sy = ty * ty * (3 - 2 * ty), y1 = (y0 + 1) % n;
      for (let x = 0; x < size; x++) {
        const fx = x / size * n, x0 = Math.floor(fx), tx = fx - x0, sx = tx * tx * (3 - 2 * tx), x1 = (x0 + 1) % n;
        const a = grid[y0 * n + x0] * (1 - sx) + grid[y0 * n + x1] * sx, b = grid[y1 * n + x0] * (1 - sx) + grid[y1 * n + x1] * sx;
        out[y * size + x] += (a * (1 - sy) + b * sy) * amp;
      }
    }
    total += amp; amp *= .5;
  }
  for (let i = 0; i < out.length; i++) out[i] /= total;
  return out;
}
const NOISE = {};
function noiseArr(size, oct, seed, base) { const k = size + ':' + oct + ':' + seed + ':' + base; return NOISE[k] || (NOISE[k] = valueNoise(size, oct, seed, base)); }
function fillNoise(g, size, fn, oct = 5, seed = 3, base = 4) {
  const n = noiseArr(size, oct, seed, base), id = g.createImageData(size, size);
  for (let i = 0; i < n.length; i++) { const [r, gg, b] = fn(n[i], i % size, Math.floor(i / size)); id.data[i * 4] = r; id.data[i * 4 + 1] = gg; id.data[i * 4 + 2] = b; id.data[i * 4 + 3] = 255; }
  g.putImageData(id, 0, 0);
}
const shade = (rgb, k) => `rgb(${Math.round(Math.min(255, rgb[0] * k))},${Math.round(Math.min(255, rgb[1] * k))},${Math.round(Math.min(255, rgb[2] * k))})`;

const TEX = {
  noise() { const [c, g] = canvas(256, 256); fillNoise(g, 256, v => { const k = v * 255; return [k, k, k]; }, 6, 11); return toTex(c, false); },
  snow() {
    const [c, g] = canvas(256, 256);
    fillNoise(g, 256, v => [236 + v * 16, 240 + v * 13, 246 + v * 9], 6, 21);
    const r = rngFrom(5);
    for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(255,255,255,${.4 + r() * .6})`; g.fillRect(r() * 256, r() * 256, 1, 1); }
    return toTex(c);
  },
  plaster() {
    const [c, g] = canvas(256, 256);
    fillNoise(g, 256, v => [214 + v * 26, 198 + v * 24, 166 + v * 22], 6, 31);
    return toTex(c);
  },
  wood() { return planks([122, 74, 44], 41); },
  woodRed() { return planks([128, 42, 30], 43); },
  woodGrey() { return planks([110, 98, 86], 47); },
  woodGreen() { return planks([44, 70, 52], 49); },
  shingleRed() { return shingles([150, 42, 32], 51); },
  shingleGreen() { return shingles([52, 84, 60], 53); },
  shingleSlate() { return shingles([74, 84, 98], 55); },
  shingleBrown() { return shingles([96, 64, 44], 57); },
  stone() {
    const [c, g] = canvas(256, 256), r = rngFrom(61);
    g.fillStyle = '#6e6a63'; g.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 32) {
      let x = -r() * 40;
      while (x < 256) {
        const w = 34 + r() * 40, k = .8 + r() * .35;
        g.fillStyle = shade([150, 144, 134], k); g.beginPath(); g.roundRect(x + 2, y + 2, w - 4, 28, 6); g.fill();
        g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(x + 4, y + 4, w - 8, 4);
        x += w;
      }
    }
    return toTex(c);
  },
  brick() {
    const [c, g] = canvas(256, 256), r = rngFrom(67);
    g.fillStyle = '#b8ab98'; g.fillRect(0, 0, 256, 256);
    for (let row = 0; row < 16; row++) for (let i = -1; i < 5; i++) {
      const x = i * 64 + (row % 2) * 32, k = .78 + r() * .35;
      g.fillStyle = shade([150, 66, 46], k); g.fillRect(x + 2, row * 16 + 2, 60, 12);
    }
    return toTex(c);
  },
  mahogany() {
    const [c, g] = canvas(512, 256), r = rngFrom(71);
    const grd = g.createLinearGradient(0, 0, 0, 256); grd.addColorStop(0, '#4a1d10'); grd.addColorStop(.5, '#5e2615'); grd.addColorStop(1, '#43190e');
    g.fillStyle = grd; g.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 160; i++) {
      const y = r() * 256, a = .05 + r() * .12;
      g.strokeStyle = r() < .5 ? `rgba(20,6,2,${a})` : `rgba(150,70,40,${a * .8})`; g.lineWidth = .6 + r() * 2;
      g.beginPath(); g.moveTo(0, y);
      for (let x = 0; x <= 512; x += 32) g.lineTo(x, y + Math.sin(x * .02 + i) * 3 + (r() - .5) * 2);
      g.stroke();
    }
    return toTex(c);
  },
  walnut() {
    const [c, g] = canvas(1024, 512), r = rngFrom(73);
    for (let p = 0; p < 6; p++) {
      const k = .85 + r() * .25;
      g.fillStyle = shade([86, 54, 34], k); g.fillRect(0, p * 86, 1024, 86);
      for (let i = 0; i < 60; i++) {
        const y = p * 86 + r() * 86, a = .05 + r() * .12;
        g.strokeStyle = r() < .6 ? `rgba(30,16,8,${a})` : `rgba(160,110,70,${a * .7})`; g.lineWidth = .6 + r() * 2.2;
        g.beginPath(); g.moveTo(0, y);
        for (let x = 0; x <= 1024; x += 40) g.lineTo(x, y + Math.sin(x * .01 + i * 1.7) * 4);
        g.stroke();
      }
      g.fillStyle = 'rgba(10,5,2,.6)'; g.fillRect(0, p * 86 + 85, 1024, 1.5);
    }
    return toTex(c);
  },
  tartan() {
    const [c, g] = canvas(256, 256);
    g.fillStyle = '#9c1a20'; g.fillRect(0, 0, 256, 256);
    const bands = [[0, 36, '#14233f', .85], [36, 8, '#e8d9a8', .7], [60, 28, '#1f4630', .85], [110, 4, '#e6c54a', .8], [140, 30, '#14233f', .85], [190, 4, '#f2eee4', .7], [214, 18, '#1f4630', .8]];
    bands.forEach(([p, w, col, a]) => { g.globalAlpha = a * .55; g.fillStyle = col; g.fillRect(0, p, 256, w); g.fillRect(p, 0, w, 256); });
    g.globalAlpha = .18;
    for (let i = 0; i < 256; i += 2) { g.fillStyle = i % 4 ? '#000' : '#fff'; g.fillRect(0, i, 256, 1); }
    g.globalAlpha = 1;
    return toTex(c);
  },
  candy() {
    const [c, g] = canvas(128, 128);
    g.fillStyle = '#f4efe6'; g.fillRect(0, 0, 128, 128);
    g.fillStyle = '#b01e22';
    for (let i = -2; i < 4; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64 + 32, 0); g.lineTo(i * 64 + 32 + 128, 128); g.lineTo(i * 64 + 128, 128); g.fill(); }
    return toTex(c);
  },
  stocking() {
    const [c, g] = canvas(64, 64);
    for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#f2ede2' : '#a8221f'; g.fillRect(0, i * 8, 64, 8); }
    return toTex(c);
  },
  window() {
    const [c, g] = canvas(128, 160);
    const grd = g.createRadialGradient(64, 90, 6, 64, 80, 110); grd.addColorStop(0, '#fff2c4'); grd.addColorStop(.45, '#ffc463'); grd.addColorStop(1, '#b8601c');
    g.fillStyle = grd; g.fillRect(0, 0, 128, 160);
    g.fillStyle = 'rgba(80,40,10,.35)'; g.fillRect(14, 96, 40, 50); g.fillRect(78, 20, 36, 46);
    g.fillStyle = '#2a1a10'; g.fillRect(58, 0, 12, 160); g.fillRect(0, 74, 128, 12);
    g.strokeStyle = '#2a1a10'; g.lineWidth = 14; g.strokeRect(0, 0, 128, 160);
    return toTex(c);
  },
  ice() {
    const [c, g] = canvas(512, 512), r = rngFrom(81);
    fillNoise(g, 512, v => [178 + v * 50, 202 + v * 36, 222 + v * 26], 5, 83);
    g.strokeStyle = 'rgba(255,255,255,.35)';
    for (let i = 0; i < 40; i++) { g.lineWidth = .5 + r() * 2; g.beginPath(); const x = r() * 512, y = r() * 512; g.moveTo(x, y); g.bezierCurveTo(x + r() * 120 - 60, y + r() * 60, x + r() * 200 - 100, y + r() * 80, x + r() * 260 - 130, y + r() * 40 - 20); g.stroke(); }
    g.strokeStyle = 'rgba(60,90,120,.35)';
    for (let i = 0; i < 14; i++) { g.lineWidth = .7; g.beginPath(); let x = r() * 512, y = r() * 512; g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += r() * 40 - 20; y += r() * 40 - 20; g.lineTo(x, y); } g.stroke(); }
    return toTex(c);
  },
  road() {
    const [c, g] = canvas(256, 512), r = rngFrom(91);
    fillNoise(g, 256, v => [214 + v * 26, 208 + v * 24, 196 + v * 22], 5, 93);
    g.drawImage(c, 0, 0, 256, 256, 0, 256, 256, 256);
    g.strokeStyle = 'rgba(120,104,84,.35)'; g.lineWidth = 6;
    [92, 164].forEach(x => { g.beginPath(); g.moveTo(x, 0); for (let y = 0; y <= 512; y += 32) g.lineTo(x + Math.sin(y * .03) * 3, y); g.stroke(); });
    g.fillStyle = 'rgba(110,96,80,.25)';
    for (let y = 0; y < 512; y += 22) { g.beginPath(); g.ellipse(124 + (y % 44 ? 8 : -8), y, 4, 7, 0, 0, 7); g.fill(); }
    for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(255,255,255,${r() * .5})`; g.fillRect(r() * 256, r() * 512, 2, 2); }
    return toTex(c);
  },
  cobble() {
    const [c, g] = canvas(256, 256), r = rngFrom(97);
    g.fillStyle = '#5c5a56'; g.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 16) for (let x = (y / 16 % 2) * 10; x < 256; x += 20) { g.fillStyle = shade([150, 146, 138], .75 + r() * .4); g.beginPath(); g.ellipse(x + 10, y + 8, 9, 6.5, 0, 0, 7); g.fill(); }
    for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(240,243,248,${.25 + r() * .4})`; g.beginPath(); g.ellipse(r() * 256, r() * 256, 2 + r() * 7, 1.5 + r() * 4, r() * 3, 0, 7); g.fill(); }
    return toTex(c);
  },
  burlap() {
    const [c, g] = canvas(128, 128);
    fillNoise(g, 128, (v, x, y) => { const w = ((x % 4 < 2) ^ (y % 4 < 2)) ? 1 : .88; return [170 * w + v * 30, 130 * w + v * 24, 84 * w + v * 18]; }, 4, 101);
    return toTex(c);
  },
  velvetRed() { const [c, g] = canvas(128, 128); fillNoise(g, 128, v => [150 + v * 40, 22 + v * 14, 26 + v * 12], 5, 103); return toTex(c); },
  velvetGreen() { const [c, g] = canvas(128, 128); fillNoise(g, 128, v => [34 + v * 22, 82 + v * 30, 50 + v * 20], 5, 105); return toTex(c); },
  fur() { const [c, g] = canvas(128, 128); fillNoise(g, 128, v => [228 + v * 27, 226 + v * 27, 220 + v * 27], 6, 107, 8); return toTex(c); },
  deer() { const [c, g] = canvas(128, 128); fillNoise(g, 128, v => [104 + v * 40, 70 + v * 30, 46 + v * 20], 6, 109, 8); return toTex(c); },
  plaque() {
    const [c, g] = canvas(512, 160);
    const grd = g.createLinearGradient(0, 0, 512, 160); grd.addColorStop(0, '#8a6526'); grd.addColorStop(.45, '#f0d590'); grd.addColorStop(.6, '#c79d4c'); grd.addColorStop(1, '#7a5620');
    g.fillStyle = grd; g.fillRect(0, 0, 512, 160);
    g.strokeStyle = 'rgba(60,40,10,.6)'; g.lineWidth = 3; g.strokeRect(12, 12, 488, 136);
    g.fillStyle = '#3a2608'; g.textAlign = 'center';
    g.font = '600 64px "IM Fell English SC", Georgia, serif'; g.fillText('Posada', 256, 88);
    g.font = 'italic 34px "IM Fell English", Georgia, serif'; g.fillText(window.POSADA && window.POSADA.plaqueDate || 'MMXXVI', 256, 128);
    return toTex(c);
  },
  glow() {
    const [c, g] = canvas(128, 128);
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, 'rgba(255,236,190,1)'); grd.addColorStop(.18, 'rgba(255,200,120,.55)'); grd.addColorStop(.5, 'rgba(255,170,80,.14)'); grd.addColorStop(1, 'rgba(255,160,70,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
    return toTex(c);
  },
  smoke() {
    const [c, g] = canvas(128, 128), r = rngFrom(111);
    for (let i = 0; i < 14; i++) {
      const x = 40 + r() * 48, y = 40 + r() * 48, rad = 18 + r() * 26;
      const grd = g.createRadialGradient(x, y, 0, x, y, rad); grd.addColorStop(0, 'rgba(235,238,242,.22)'); grd.addColorStop(1, 'rgba(235,238,242,0)');
      g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
    }
    return toTex(c);
  },
  fade() {
    const [c, g] = canvas(256, 256);
    const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grd.addColorStop(0, '#fff'); grd.addColorStop(.55, '#fff'); grd.addColorStop(1, '#000');
    g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
    return toTex(c, false);
  },
  blob() {
    const [c, g] = canvas(128, 128);
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, 'rgba(0,0,0,.75)'); grd.addColorStop(.5, 'rgba(0,0,0,.35)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
    return toTex(c);
  }
};
function planks(rgb, seed) {
  const [c, g] = canvas(256, 256), r = rngFrom(seed);
  for (let i = 0; i < 8; i++) {
    const k = .82 + r() * .3;
    g.fillStyle = shade(rgb, k); g.fillRect(i * 32, 0, 32, 256);
    for (let j = 0; j < 9; j++) {
      const x = i * 32 + 3 + r() * 26, a = .06 + r() * .12;
      g.strokeStyle = r() < .6 ? `rgba(20,10,4,${a})` : `rgba(255,220,180,${a * .5})`; g.lineWidth = .5 + r() * 1.4;
      g.beginPath(); g.moveTo(x, 0); for (let y = 0; y <= 256; y += 32) g.lineTo(x + Math.sin(y * .03 + j) * 2, y); g.stroke();
    }
    g.fillStyle = 'rgba(10,5,2,.55)'; g.fillRect(i * 32 + 31, 0, 1.6, 256);
    if (r() < .5) { g.fillStyle = 'rgba(10,5,2,.4)'; g.fillRect(i * 32, r() * 256, 32, 1.2); }
  }
  return toTex(c);
}
function shingles(rgb, seed) {
  const [c, g] = canvas(256, 256), r = rngFrom(seed);
  g.fillStyle = shade(rgb, .45); g.fillRect(0, 0, 256, 256);
  for (let row = 0; row < 11; row++) {
    const y = row * 24, off = (row % 2) * 16;
    for (let x = -32 + off; x < 256; x += 32) {
      const k = .78 + r() * .38;
      g.fillStyle = shade(rgb, k);
      g.beginPath(); g.moveTo(x + 1, y); g.lineTo(x + 31, y); g.lineTo(x + 31, y + 22); g.quadraticCurveTo(x + 16, y + 28, x + 1, y + 22); g.closePath(); g.fill();
      g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(x + 1, y + 18, 30, 5);
      g.fillStyle = 'rgba(255,255,255,.07)'; g.fillRect(x + 2, y + 1, 28, 3);
    }
  }
  return toTex(c);
}
const texCache = {};
export function tex(name) { return texCache[name] || (texCache[name] = TEX[name]()); }

/* =========================================================
   Materiales
   ========================================================= */
const matCache = {};
const std = (o) => new THREE.MeshStandardMaterial(o);
const MATS = {
  snow: () => std({ color: 0xffffff, map: tex('snow'), roughness: .78, bumpMap: tex('noise'), bumpScale: 1.4 }),
  snowShade: () => std({ color: 0xe9eef5, map: tex('snow'), roughness: .85, bumpMap: tex('noise'), bumpScale: 1.2 }),
  plaster: () => std({ map: tex('plaster'), roughness: .92, bumpMap: tex('noise'), bumpScale: .8 }),
  wood: () => std({ map: tex('wood'), roughness: .8, bumpMap: tex('wood'), bumpScale: .6 }),
  woodRed: () => std({ map: tex('woodRed'), roughness: .78, bumpMap: tex('woodRed'), bumpScale: .6 }),
  woodGrey: () => std({ map: tex('woodGrey'), roughness: .85, bumpMap: tex('woodGrey'), bumpScale: .6 }),
  woodGreen: () => std({ map: tex('woodGreen'), roughness: .7 }),
  stone: () => std({ map: tex('stone'), roughness: .9, bumpMap: tex('stone'), bumpScale: 2 }),
  brick: () => std({ map: tex('brick'), roughness: .88, bumpMap: tex('brick'), bumpScale: 1.6 }),
  roofRed: () => std({ map: tex('shingleRed'), roughness: .75, bumpMap: tex('shingleRed'), bumpScale: 2 }),
  roofGreen: () => std({ map: tex('shingleGreen'), roughness: .75, bumpMap: tex('shingleGreen'), bumpScale: 2 }),
  roofSlate: () => std({ map: tex('shingleSlate'), roughness: .6, bumpMap: tex('shingleSlate'), bumpScale: 2 }),
  roofBrown: () => std({ map: tex('shingleBrown'), roughness: .8, bumpMap: tex('shingleBrown'), bumpScale: 2 }),
  beam: () => std({ color: 0x3b2618, roughness: .8, map: tex('wood') }),
  frame: () => std({ color: 0x2a1c12, roughness: .6 }),
  window: () => new THREE.MeshStandardMaterial({ map: tex('window'), emissive: 0xffb04a, emissiveMap: tex('window'), emissiveIntensity: 1.9, roughness: .3 }),
  doorGreen: () => std({ map: tex('woodGreen'), color: 0xcfe0d2, roughness: .55 }),
  doorRed: () => std({ map: tex('woodRed'), roughness: .55 }),
  brass: () => new THREE.MeshPhysicalMaterial({ color: 0xd2a85a, metalness: 1, roughness: .28, clearcoat: .3 }),
  gold: () => new THREE.MeshPhysicalMaterial({ color: 0xe0b45a, metalness: 1, roughness: .22 }),
  iron: () => std({ color: 0x1d1d1f, metalness: .7, roughness: .45 }),
  pine: () => std({ color: 0x2a4a33, roughness: .9, bumpMap: tex('noise'), bumpScale: 2 }),
  pineDark: () => std({ color: 0x1f3a2a, roughness: .9, bumpMap: tex('noise'), bumpScale: 2 }),
  bark: () => std({ color: 0x4a3324, roughness: .95 }),
  lacquerRed: () => new THREE.MeshPhysicalMaterial({ color: 0x8e1414, roughness: .35, clearcoat: 1, clearcoatRoughness: .12 }),
  velvetRed: () => std({ map: tex('velvetRed'), roughness: .85 }),
  velvetGreen: () => std({ map: tex('velvetGreen'), roughness: .85 }),
  fur: () => std({ map: tex('fur'), roughness: 1, bumpMap: tex('noise'), bumpScale: 3 }),
  skin: () => std({ color: 0xe9b998, roughness: .7 }),
  black: () => std({ color: 0x141210, roughness: .45 }),
  leather: () => std({ color: 0x1b1410, roughness: .4 }),
  deer: () => std({ map: tex('deer'), roughness: .9 }),
  deerLight: () => std({ color: 0xcdb293, roughness: .9 }),
  antler: () => std({ color: 0xd6c4a0, roughness: .7 }),
  burlap: () => std({ map: tex('burlap'), roughness: .95, bumpMap: tex('burlap'), bumpScale: 2 }),
  hay: () => std({ color: 0xcfa858, roughness: .95, bumpMap: tex('noise'), bumpScale: 3 }),
  candy: () => new THREE.MeshPhysicalMaterial({ map: tex('candy'), roughness: .25, clearcoat: .8 }),
  stocking: () => std({ map: tex('stocking'), roughness: .8 }),
  ice: () => new THREE.MeshPhysicalMaterial({ map: tex('ice'), roughness: .08, metalness: 0, clearcoat: 1, clearcoatRoughness: .05, envMapIntensity: 1.4 }),
  road: () => std({ map: tex('road'), roughness: .9, bumpMap: tex('road'), bumpScale: 1 }),
  cobble: () => std({ map: tex('cobble'), roughness: .85, bumpMap: tex('cobble'), bumpScale: 2 }),
  paper: () => std({ color: 0xf4eedf, roughness: .8 }),
  mahogany: () => new THREE.MeshPhysicalMaterial({ map: tex('mahogany'), roughness: .38, clearcoat: 1, clearcoatRoughness: .08 }),
  tartan: () => std({ map: tex('tartan'), roughness: .95, bumpMap: tex('noise'), bumpScale: .6 }),
  plaque: () => new THREE.MeshPhysicalMaterial({ map: tex('plaque'), metalness: .85, roughness: .32, clearcoat: .4 })
};
export function mat(name) { return matCache[name] || (matCache[name] = MATS[name]()); }
const giftColors = [0x8e1b1b, 0x1f4a33, 0xc9a24a, 0x203a5c, 0xf0e8d6, 0x6d1f3c];
const giftMats = giftColors.map(c => new THREE.MeshPhysicalMaterial({ color: c, roughness: .45, clearcoat: .5 }));

/* =========================================================
   Utilidades de geometría
   ========================================================= */
export function boxUV(w, h, d, density = .5) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let i = 0; i < uv.count; i++) { const f = Math.floor(i / 4), [a, b] = dims[f]; uv.setXY(i, uv.getX(i) * a * density, uv.getY(i) * b * density); }
  return g;
}
export function rbox(w, h, d, r = .06) { return new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2.1, h / 2.1, d / 2.1)); }
export function mesh(geo, material, shadows = true) { const m = new THREE.Mesh(geo, material); if (shadows) { m.castShadow = true; m.receiveShadow = true; } return m; }
function at(obj, x, y, z, rx = 0, ry = 0, rz = 0) { obj.position.set(x, y, z); obj.rotation.set(rx, ry, rz); return obj; }
export function glowSprite(scale = 1, color = 0xffc070, opacity = 1) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex('glow'), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
  s.scale.setScalar(scale);
  s.userData.glow = true;
  return s;
}
function jitter(geo, amt, seed) {
  const r = rngFrom(seed), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { if (p.getY(i) > geo.parameters.height / 2 - 1e-3) continue; p.setXYZ(i, p.getX(i) * (1 + (r() - .5) * amt), p.getY(i) + (r() - .5) * amt * .3, p.getZ(i) * (1 + (r() - .5) * amt)); }
  geo.computeVertexNormals();
  return geo;
}

/* =========================================================
   Piezas
   ========================================================= */
export function snowDrift(w, h, d) {
  const m = mesh(new THREE.SphereGeometry(1, 16, 10), mat('snow'));
  m.scale.set(w, h, d);
  return m;
}

export function gift(s = .3, k = 0) {
  const g = new THREE.Group(), m = giftMats[k % giftMats.length], rib = k % 3 === 0 ? mat('gold') : giftMats[(k + 2) % giftMats.length];
  g.add(at(mesh(rbox(s, s * .8, s, s * .04), m), 0, s * .4, 0));
  g.add(at(mesh(new THREE.BoxGeometry(s * 1.02, s * .82, s * .16), rib), 0, s * .4, 0));
  g.add(at(mesh(new THREE.BoxGeometry(s * .16, s * .82, s * 1.02), rib), 0, s * .4, 0));
  const bow = new THREE.TorusGeometry(s * .12, s * .035, 6, 12);
  g.add(at(mesh(bow, rib), -s * .1, s * .86, 0, 0, 0, .6));
  g.add(at(mesh(bow, rib), s * .1, s * .86, 0, 0, 0, -.6));
  return g;
}
export function giftPile(n = 7, seed = 1) {
  const g = new THREE.Group(), r = rngFrom(seed);
  for (let i = 0; i < n; i++) {
    const s = .26 + r() * .26, a = r() * 6.28, rad = i < 4 ? r() * .4 : r() * .25;
    const b = gift(s, Math.floor(r() * 6));
    b.position.set(Math.cos(a) * rad, i < 4 ? 0 : .28 + r() * .1, Math.sin(a) * rad);
    b.rotation.y = r() * 3;
    g.add(b);
  }
  return g;
}

function windowUnit(ww, wh, shutters) {
  const g = new THREE.Group();
  g.add(at(mesh(new THREE.BoxGeometry(ww + .14, wh + .14, .08), mat('frame')), 0, 0, 0));
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(ww, wh), mat('window'));
  glass.position.z = .045; g.add(glass);
  g.add(at(mesh(new THREE.BoxGeometry(ww + .3, .06, .2), mat('frame')), 0, -wh / 2 - .08, .06));
  g.add(at(mesh(rbox(ww + .26, .08, .18, .04), mat('snow')), 0, -wh / 2 - .02, .08));
  if (shutters) {
    const sm = shutters === 'red' ? mat('doorRed') : mat('doorGreen');
    g.add(at(mesh(new THREE.BoxGeometry(ww * .5, wh + .1, .05), sm), -ww * .8, 0, .02));
    g.add(at(mesh(new THREE.BoxGeometry(ww * .5, wh + .1, .05), sm), ww * .8, 0, .02));
  }
  const glow = glowSprite(Math.max(ww, wh) * 2.6, 0xffb860, .55); glow.position.z = .3; g.add(glow);
  return g;
}

function wreath(r = .22) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.TorusGeometry(r, r * .3, 8, 20), mat('pineDark')));
  for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28; g.add(at(mesh(new THREE.SphereGeometry(r * .1, 8, 6), giftMats[0]), Math.cos(a) * r, Math.sin(a) * r, r * .2)); }
  g.add(at(mesh(new THREE.TorusGeometry(r * .25, r * .08, 6, 10), giftMats[0]), -r * .2, -r, .03, 0, 0, .5));
  g.add(at(mesh(new THREE.TorusGeometry(r * .25, r * .08, 6, 10), giftMats[0]), r * .2, -r, .03, 0, 0, -.5));
  return g;
}

// Casa con techo de dos aguas; la cumbrera corre de adelante hacia atrás (eje z),
// así el frontón mira a la cámara.
export function house(o) {
  const g = new THREE.Group();
  const { w, d, h } = o, pitch = o.pitch || .72, over = .32, t = .14;
  const rh = w / 2 * Math.tan(pitch);
  const wallMat = mat(o.wall || 'plaster');
  g.add(at(mesh(new THREE.BoxGeometry(w + .12, .35, d + .12), mat('stone')), 0, .175, 0));
  g.add(at(mesh(boxUV(w, h, d, .55), wallMat), 0, h / 2, 0));
  // frontones
  const tri = new THREE.Shape(); tri.moveTo(-w / 2, 0); tri.lineTo(w / 2, 0); tri.lineTo(0, rh); tri.closePath();
  const tg = new THREE.ShapeGeometry(tri), uv = tg.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * .55, uv.getY(i) * .55);
  g.add(at(mesh(tg, wallMat), 0, h, d / 2));
  g.add(at(mesh(tg, wallMat), 0, h, -d / 2, 0, Math.PI, 0));
  // techo
  const roofMat = mat(o.roof || 'roofRed');
  const L = Math.hypot(w / 2, rh) + over, D = d + over * 2;
  [-1, 1].forEach(s => {
    // del alero (E) a la cumbrera (R); la normal del faldón apunta hacia afuera y arriba
    const E = [s * (w / 2 + over * Math.cos(pitch)), h - over * Math.sin(pitch)], Rr = [0, h + rh];
    const cx = (E[0] + Rr[0]) / 2, cy = (E[1] + Rr[1]) / 2, nx = s * Math.sin(pitch), ny = Math.cos(pitch);
    g.add(at(mesh(boxUV(L, t, D, .5), roofMat), cx + nx * t / 2, cy + ny * t / 2, 0, 0, 0, -s * pitch));
    g.add(at(mesh(rbox(L * .97, .17, D - .06, .08), mat('snow')), cx + nx * (t + .07), cy + ny * (t + .07), 0, 0, 0, -s * pitch));
  });
  // vigas (entramado)
  if (o.timber) {
    const bm = mat('beam'), bw = .12;
    [[-w / 2, d / 2], [w / 2, d / 2], [-w / 2, -d / 2], [w / 2, -d / 2]].forEach(([x, z]) => g.add(at(mesh(new THREE.BoxGeometry(bw, h, bw), bm), x, h / 2, z)));
    g.add(at(mesh(new THREE.BoxGeometry(w + .04, bw, bw * .6), bm), 0, h * .52, d / 2 + .03));
    g.add(at(mesh(new THREE.BoxGeometry(w + .04, bw, bw * .6), bm), 0, h - .05, d / 2 + .03));
    g.add(at(mesh(new THREE.BoxGeometry(bw * .6, bw, d + .04), bm), w / 2 + .03, h * .52, 0));
    g.add(at(mesh(new THREE.BoxGeometry(bw * .6, bw, d + .04), bm), -w / 2 - .03, h * .52, 0));
    g.add(at(mesh(new THREE.BoxGeometry(bw * .7, rh * .9, bw * .6), bm), 0, h + rh * .45, d / 2 + .03));
    const diag = Math.hypot(w * .18, h * .48);
    [-1, 1].forEach(s => g.add(at(mesh(new THREE.BoxGeometry(bw * .7, diag, bw * .5), bm), s * (w / 2 - w * .09), h * .76, d / 2 + .03, 0, 0, s * Math.atan2(w * .18, h * .48))));
  }
  // ventanas
  (o.windows || []).forEach(wi => {
    const [face, u, v, ww, wh] = wi, wu = windowUnit(ww, wh, o.shutters);
    if (face === 'f') at(wu, u, v, d / 2 + .03);
    else if (face === 'g') at(wu, u, h + v, d / 2 + .03);
    else if (face === 'r') at(wu, w / 2 + .03, v, u, 0, Math.PI / 2, 0);
    else if (face === 'l') at(wu, -w / 2 - .03, v, u, 0, -Math.PI / 2, 0);
    g.add(wu);
  });
  // puerta
  if (o.door) {
    const { x = 0, dw = .9, dh = 1.7 } = o.door;
    if (o.door.open) {
      const inner = new THREE.Mesh(new THREE.PlaneGeometry(dw, dh), mat('window'));
      at(inner, x, dh / 2 + .3, d / 2 + .01); g.add(inner);
      const leaf = mat(o.door.mat || 'doorGreen');
      g.add(at(mesh(new THREE.BoxGeometry(dw / 2, dh, .07), leaf), x - dw / 2 - dw * .18, dh / 2 + .3, d / 2 + dw * .2, 0, -1.1, 0));
      g.add(at(mesh(new THREE.BoxGeometry(dw / 2, dh, .07), leaf), x + dw / 2 + dw * .18, dh / 2 + .3, d / 2 + dw * .2, 0, 1.1, 0));
      const gl = glowSprite(dw * 3.4, 0xffb050, .8); gl.position.set(x, dh / 2 + .3, d / 2 + .5); g.add(gl);
    } else {
      g.add(at(mesh(new THREE.BoxGeometry(dw + .16, dh + .1, .08), mat('frame')), x, dh / 2 + .3, d / 2 + .02));
      g.add(at(mesh(new THREE.BoxGeometry(dw, dh, .1), mat(o.door.mat || 'doorGreen')), x, dh / 2 + .3, d / 2 + .04));
      g.add(at(mesh(new THREE.SphereGeometry(.05, 8, 6), mat('brass')), x + dw * .35, dh * .5 + .3, d / 2 + .11));
      if (o.door.wreath) g.add(at(wreath(dw * .26), x, dh * .72 + .3, d / 2 + .14));
      if (o.door.lanterns) [-1, 1].forEach(s => {
        const ln = new THREE.Group();
        ln.add(mesh(new THREE.BoxGeometry(.18, .26, .18), mat('iron')));
        ln.add(at(new THREE.Mesh(new THREE.BoxGeometry(.13, .2, .19), mat('window')), 0, 0, 0));
        const gl = glowSprite(1.2, 0xffbb66, .8); ln.add(gl);
        at(ln, x + s * (dw / 2 + .32), dh * .78 + .3, d / 2 + .14); g.add(ln);
      });
    }
    g.add(at(mesh(rbox(dw + .5, .12, .6, .05), mat('snow')), x, .06, d / 2 + .3));
  }
  // chimenea
  if (o.chimney) {
    const cx = o.chimney.x != null ? o.chimney.x : w * .22, cz = o.chimney.z || -d * .15;
    const yRoof = h + rh * (1 - Math.abs(cx) / (w / 2));
    const ch = (o.chimney.h || 1.1);
    g.add(at(mesh(boxUV(.55, ch + .6, .55, 1.2), mat('brick')), cx, yRoof + ch / 2 - .2, cz));
    g.add(at(mesh(new THREE.BoxGeometry(.66, .1, .66), mat('stone')), cx, yRoof + ch + .12, cz));
    g.add(at(mesh(rbox(.62, .14, .62, .06), mat('snow')), cx, yRoof + ch + .22, cz));
    g.userData.smoke = V(cx, yRoof + ch + .35, cz);
  }
  // montoncitos de nieve al pie
  const r = rngFrom(Math.round(w * 100 + d * 7));
  for (let i = 0; i < 6; i++) {
    const side = i % 3, s = .35 + r() * .35;
    const dr = snowDrift(s * 1.6, s * .45, s);
    if (side === 0) dr.position.set(-w / 2 - .1, 0, (r() - .5) * d);
    else if (side === 1) dr.position.set(w / 2 + .1, 0, (r() - .5) * d);
    else dr.position.set((r() - .5) * w, 0, -d / 2 - .1);
    if (side < 2) dr.scale.set(s, s * .45, s * 1.6);
    g.add(dr);
  }
  g.userData.top = h + rh + .1;
  g.userData.box = [w + over * 2, d + over * 2];
  return g;
}

/* ---------- Pinos ---------- */
// Cada piso del pino es un torno con ramas caídas; la nieve se pinta con colores
// por vértice donde la rama mira hacia arriba, como cuando acaba de nevar.
const pineGeoCache = {};
function tierGeo(r, h, seed, snow = 1) {
  const pr = [[.001, h * .2], [r * .4, h * .1], [r * .88, -h * .07], [r, 0], [r * .8, h * .17], [r * .5, h * .46], [r * .22, h * .78], [.001, h]].map(([x, y]) => new THREE.Vector2(x, y));
  let g = new THREE.LatheGeometry(pr, 22);
  g.deleteAttribute('uv'); g.deleteAttribute('normal'); g = mergeVertices(g);
  const p = g.attributes.position, rnd = rngFrom(seed), a1 = rnd() * 6, a2 = rnd() * 6, a3 = rnd() * 6;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), y = p.getY(i), rad = Math.hypot(x, z), ang = Math.atan2(z, x), k = rad / r;
    const n = (Math.sin(ang * 7 + a1) * .09 + Math.sin(ang * 11 + a2) * .06 + Math.sin(ang * 17 + a3) * .04) * k;
    p.setXYZ(i, x * (1 + n), y - Math.max(0, n) * h * .35 * k, z * (1 + n));
  }
  g.computeVertexNormals();
  const nrm = g.attributes.normal, col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), ny = nrm.getY(i);
    const hsh = Math.abs(Math.sin(x * 127.1 + z * 311.7 + seed) * 43758.5) % 1;
    const f = snow * Math.min(.92, Math.max(0, (ny - .6) * 3.2 + (hsh - .5) * 1.1));
    const gk = .8 + hsh * .35;
    col[i * 3] = .028 * gk * (1 - f) + .86 * f; col[i * 3 + 1] = .082 * gk * (1 - f) + .89 * f; col[i * 3 + 2] = .042 * gk * (1 - f) + .94 * f;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}
const pineMat = () => matCache.pineVC || (matCache.pineVC = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .86, bumpMap: tex('noise'), bumpScale: 2.2 }));
function pineParts(variant = 0) {
  if (pineGeoCache[variant]) return pineGeoCache[variant];
  const parts = [], tiers = 6, slim = variant === 1 ? .78 : variant === 2 ? .9 : variant === 3 ? 1.08 : 1;
  parts.push({ geo: new THREE.CylinderGeometry(.03, .045, .18, 7), mat: mat('bark'), y: .09 });
  for (let i = 0; i < tiers; i++) {
    const r = (1 - i / (tiers + .5)) * .33 * slim, h = .27 - i * .012, y0 = .1 + i * .136;
    parts.push({ geo: tierGeo(r, h, 7 + i * 3 + variant * 17, variant === 3 ? .2 : 1), mat: pineMat(), y: y0 });
  }
  return pineGeoCache[variant] = parts;
}
export function pine(h = 4, variant = 0) {
  const g = new THREE.Group();
  pineParts(variant).forEach(p => g.add(at(mesh(p.geo, p.mat), 0, p.y, 0)));
  g.scale.setScalar(h);
  return g;
}
// Bosque instanciado: muchos pinos en pocas llamadas de dibujo.
export function forest(list, castShadow = true) {
  const g = new THREE.Group(), byVar = [[], [], []];
  list.forEach(t => byVar[t.v || 0].push(t));
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), off = new THREE.Matrix4();
  byVar.forEach((trees, v) => {
    if (!trees.length) return;
    pineParts(v).forEach(part => {
      const im = new THREE.InstancedMesh(part.geo, part.mat, trees.length);
      im.castShadow = castShadow; im.receiveShadow = true;
      off.makeTranslation(0, part.y, 0);
      trees.forEach((t, i) => { q.setFromAxisAngle(V(0, 1, 0), t.ry || 0); s.setScalar(t.h); p.set(t.x, t.y || 0, t.z); m4.compose(p, q, s).multiply(off); im.setMatrixAt(i, m4); });
      g.add(im);
    });
  });
  return g;
}

/* ---------- Árbol de Navidad ---------- */
export function xmasTree(h = 6) {
  const g = new THREE.Group();
  const tree = pine(h, 3); g.add(tree);
  const lights = [], cols = [0xffd27a, 0xffe7b0, 0xff8a4a, 0xffc04a];
  const ornGeo = new THREE.SphereGeometry(.09 * h / 6, 10, 8), lightGeo = new THREE.SphereGeometry(.045 * h / 6, 6, 5);
  const ornMats = [new THREE.MeshPhysicalMaterial({ color: 0x9a1818, metalness: .6, roughness: .2, clearcoat: 1 }), mat('gold'), new THREE.MeshPhysicalMaterial({ color: 0x1d3c6a, metalness: .6, roughness: .2, clearcoat: 1 })];
  const coneR = y => Math.max(.02, (1 - (y / h - .08) / .92)) * .33 * h * .93;
  const r = rngFrom(17);
  for (let i = 0; i < 110; i++) {
    const y = h * (.16 + .74 * (i / 110)), a = i * 2.4 + r() * .3, rad = coneR(y) * .96;
    const l = new THREE.Mesh(lightGeo, new THREE.MeshBasicMaterial({ color: cols[i % 4] }));
    if (i % 9 === 0) { const gs = glowSprite(.5 * h / 6, 0xffc070, .55); gs.position.set(Math.cos(a) * rad * 1.02, y, Math.sin(a) * rad * 1.02); g.add(gs); }
    l.position.set(Math.cos(a) * rad, y, Math.sin(a) * rad);
    g.add(l); lights.push(l);
  }
  for (let i = 0; i < 26; i++) {
    const y = h * (.2 + .62 * r()), a = r() * 6.28, rad = coneR(y) * .92;
    g.add(at(mesh(ornGeo, ornMats[i % 3], false), Math.cos(a) * rad, y - .05, Math.sin(a) * rad));
  }
  const pts = [];
  for (let i = 0; i <= 120; i++) { const t = i / 120, y = h * (.2 + .65 * t), a = t * 6.28 * 4; pts.push(V(Math.cos(a) * coneR(y) * 1.0, y, Math.sin(a) * coneR(y) * 1.0)); }
  g.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 240, .025 * h / 6, 5), mat('gold'), false));
  const star = new THREE.Shape();
  for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? .12 : .3; star[i ? 'lineTo' : 'moveTo'](Math.cos(a) * rr * h / 6, Math.sin(a) * rr * h / 6); }
  const sm = new THREE.MeshStandardMaterial({ color: 0xf0c860, metalness: .8, roughness: .25, emissive: 0xffb030, emissiveIntensity: .9 });
  const st = mesh(new THREE.ExtrudeGeometry(star, { depth: .06 * h / 6, bevelEnabled: true, bevelSize: .02, bevelThickness: .02, bevelSegments: 1 }), sm, false);
  st.position.set(0, h * 1.02, 0); g.add(st);
  const sg = glowSprite(1.8 * h / 6, 0xffd070, .9); sg.position.set(0, h * 1.03, .1); g.add(sg);
  g.userData.lights = lights;
  return g;
}

/* ---------- Faroles, postes y mobiliario ---------- */
export function lamp(h = 2.4) {
  const g = new THREE.Group();
  g.add(at(mesh(new THREE.CylinderGeometry(.12, .16, .25, 10), mat('iron')), 0, .12, 0));
  g.add(at(mesh(new THREE.CylinderGeometry(.04, .055, h, 8), mat('iron')), 0, h / 2, 0));
  g.add(at(mesh(new THREE.BoxGeometry(.3, .4, .3), mat('iron')), 0, h + .2, 0));
  g.add(at(new THREE.Mesh(new THREE.BoxGeometry(.23, .33, .31), mat('window')), 0, h + .2, 0));
  g.add(at(new THREE.Mesh(new THREE.BoxGeometry(.31, .33, .23), mat('window')), 0, h + .2, 0));
  g.add(at(mesh(new THREE.ConeGeometry(.28, .22, 4), mat('iron')), 0, h + .5, 0, 0, Math.PI / 4, 0));
  g.add(at(mesh(new THREE.ConeGeometry(.24, .1, 4), mat('snow')), 0, h + .58, 0, 0, Math.PI / 4, 0));
  const gl = glowSprite(2.2, 0xffbf6a, .95); gl.position.set(0, h + .2, 0); g.add(gl);
  g.userData.light = V(0, h + .2, 0);
  return g;
}
export function northPole(h = 2.6) {
  const g = new THREE.Group();
  const geo = new THREE.CylinderGeometry(.13, .13, h, 20, 1);
  const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * h * 1.6);
  g.add(at(mesh(geo, mat('candy')), 0, h / 2, 0));
  g.add(at(mesh(new THREE.SphereGeometry(.26, 24, 16), mat('gold')), 0, h + .2, 0));
  g.add(at(mesh(rbox(.42, .06, .42, .03), mat('snow')), 0, h + .02, 0));
  g.add(at(snowDrift(.6, .25, .6), 0, 0, 0));
  return g;
}
export function fence(len, n) {
  const g = new THREE.Group(), wm = mat('woodGrey');
  for (let i = 0; i <= n; i++) {
    const x = -len / 2 + len * i / n;
    g.add(at(mesh(new THREE.BoxGeometry(.12, .9, .12), wm), x, .45, 0));
    g.add(at(mesh(rbox(.16, .07, .16, .03), mat('snow')), x, .93, 0));
  }
  g.add(at(mesh(boxUV(len, .1, .05, 1), wm), 0, .7, 0));
  g.add(at(mesh(boxUV(len, .1, .05, 1), wm), 0, .38, 0));
  g.add(at(mesh(rbox(len, .05, .09, .02), mat('snow')), 0, .77, 0));
  return g;
}
export function bench() {
  const g = new THREE.Group(), wm = mat('wood');
  g.add(at(mesh(new THREE.BoxGeometry(1.4, .07, .45), wm), 0, .45, 0));
  g.add(at(mesh(new THREE.BoxGeometry(1.4, .3, .06), wm), 0, .7, -.22, -.15, 0, 0));
  [-.6, .6].forEach(x => g.add(at(mesh(new THREE.BoxGeometry(.06, .45, .45), mat('iron')), x, .22, 0)));
  g.add(at(mesh(rbox(1.36, .06, .4, .03), mat('snow')), 0, .51, 0));
  return g;
}
export function mailbox() {
  const g = new THREE.Group();
  g.add(at(mesh(new THREE.CylinderGeometry(.24, .26, 1.1, 18), mat('lacquerRed')), 0, .55, 0));
  g.add(at(mesh(new THREE.SphereGeometry(.25, 18, 10, 0, 6.29, 0, 1.6), mat('lacquerRed')), 0, 1.1, 0));
  g.add(at(mesh(new THREE.BoxGeometry(.24, .04, .04), mat('black')), 0, .85, .245));
  g.add(at(mesh(new THREE.SphereGeometry(.2, 12, 6, 0, 6.29, 0, 1.2), mat('snow')), 0, 1.2, 0));
  return g;
}
export function sack(s = .5) {
  const g = new THREE.Group();
  const b = mesh(new THREE.SphereGeometry(s, 14, 10), mat('burlap')); b.scale.set(1, 1.15, .9); b.position.y = s * .95; g.add(b);
  g.add(at(mesh(new THREE.CylinderGeometry(s * .18, s * .3, s * .4, 10), mat('burlap')), 0, s * 2.1, 0));
  g.add(at(mesh(new THREE.TorusGeometry(s * .2, s * .05, 6, 12), mat('gold')), 0, s * 1.95, 0, Math.PI / 2, 0, 0));
  return g;
}
export function hayBale() {
  const g = new THREE.Group();
  g.add(at(mesh(new THREE.CylinderGeometry(.55, .55, .8, 18), mat('hay')), 0, .55, 0, 0, 0, Math.PI / 2));
  g.add(at(mesh(new THREE.SphereGeometry(.5, 14, 8, 0, 6.29, 0, 1.2), mat('snow')), 0, .82, 0, 0, 0, 0));
  g.children[1].scale.set(.9, .3, 1.1);
  return g;
}
export function workbench() {
  const g = new THREE.Group(), wm = mat('wood');
  g.add(at(mesh(boxUV(1.8, .1, .7, 1), wm), 0, .85, 0));
  [[-.8, -.28], [.8, -.28], [-.8, .28], [.8, .28]].forEach(([x, z]) => g.add(at(mesh(new THREE.BoxGeometry(.08, .85, .08), wm), x, .42, z)));
  g.add(at(gift(.28, 2), -.5, .9, 0));
  const drum = new THREE.Group();
  drum.add(mesh(new THREE.CylinderGeometry(.16, .16, .22, 16), mat('lacquerRed')));
  drum.add(at(mesh(new THREE.CylinderGeometry(.165, .165, .02, 16), mat('gold')), 0, .11, 0));
  drum.add(at(mesh(new THREE.CylinderGeometry(.165, .165, .02, 16), mat('gold')), 0, -.11, 0));
  g.add(at(drum, .35, 1.02, .05));
  return g;
}
export function ladder(h = 3.2) {
  const g = new THREE.Group(), wm = mat('wood');
  [-.22, .22].forEach(x => g.add(at(mesh(new THREE.BoxGeometry(.06, h, .06), wm), x, h / 2, 0)));
  for (let y = .3; y < h; y += .35) g.add(at(mesh(new THREE.BoxGeometry(.44, .04, .05), wm), 0, y, 0));
  return g;
}
export function cabin() {
  return house({ w: 2, d: 1.8, h: 1.3, wall: 'wood', roof: 'roofBrown', windows: [['f', .55, .9, .4, .45]], door: { x: -.35, dw: .55, dh: .95, mat: 'doorRed' }, chimney: { x: .4, h: .6 } });
}

/* ---------- Trineo ---------- */
export function sleigh() {
  const g = new THREE.Group();
  const s = new THREE.Shape();
  s.moveTo(-1.1, .3); s.lineTo(.9, .3); s.quadraticCurveTo(1.25, .3, 1.25, .7); s.quadraticCurveTo(1.25, 1.1, .95, 1.15);
  s.lineTo(.86, 1.0); s.quadraticCurveTo(1.02, .94, 1.02, .74); s.lineTo(.62, .66); s.lineTo(-.5, .66);
  s.lineTo(-.68, 1.05); s.quadraticCurveTo(-.95, 1.3, -1.22, 1.08); s.quadraticCurveTo(-1.32, .7, -1.1, .3);
  const body = mesh(new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: true, bevelSize: .04, bevelThickness: .04, bevelSegments: 2, curveSegments: 16 }), mat('lacquerRed'));
  body.position.z = -.5; g.add(body);
  const seat = mesh(rbox(.9, .2, .86, .06), mat('velvetGreen')); seat.position.set(-.85, .78, 0); g.add(seat);
  const back = mesh(rbox(.18, .4, .86, .06), mat('velvetGreen')); back.position.set(-1.05, .98, 0); g.add(back);
  [-.56, .56].forEach(z => {
    const c = new THREE.CatmullRomCurve3([V(-1.35, .05, z), V(.9, .03, z), V(1.45, .2, z), V(1.5, .5, z), V(1.3, .62, z), V(1.22, .5, z)]);
    g.add(mesh(new THREE.TubeGeometry(c, 40, .04, 6), mat('gold')));
    [-.8, 0, .7].forEach(x => g.add(at(mesh(new THREE.CylinderGeometry(.025, .025, .3, 6), mat('gold')), x, .18, z)));
    const trim = new THREE.CatmullRomCurve3([V(-1.18, 1.05, z * .95), V(-.68, 1.02, z * .95), V(-.5, .7, z * .95), V(.62, .7, z * .95), V(1.0, .78, z * .95), V(1.0, 1.0, z * .95)]);
    g.add(mesh(new THREE.TubeGeometry(trim, 40, .022, 5), mat('gold'), false));
  });
  const sk = sack(.36); sk.position.set(.2, .62, 0); g.add(sk);
  [[-.25, .66, .2, 0], [.55, .66, -.25, 3], [.45, .66, .28, 1]].forEach(([x, y, z, k]) => { const b = gift(.3, k); b.position.set(x, y, z); b.rotation.y = k; g.add(b); });
  return g;
}

/* ---------- Personajes ---------- */
export function santa() {
  const g = new THREE.Group();
  [-.11, .11].forEach(x => {
    g.add(at(mesh(new THREE.CylinderGeometry(.08, .09, .32, 10), mat('velvetRed')), x, .3, 0));
    const boot = mesh(rbox(.17, .14, .26, .05), mat('leather')); boot.position.set(x, .07, .04); g.add(boot);
  });
  const body = mesh(new THREE.SphereGeometry(.34, 20, 16), mat('velvetRed')); body.scale.set(1, 1.18, .9); body.position.y = .78; g.add(body);
  g.add(at(mesh(new THREE.TorusGeometry(.3, .06, 8, 22), mat('fur')), 0, .5, 0, Math.PI / 2, 0, 0));
  g.add(at(mesh(new THREE.BoxGeometry(.07, .5, .05), mat('fur')), 0, .78, .3));
  g.add(at(mesh(new THREE.CylinderGeometry(.33, .34, .09, 20), mat('leather')), 0, .7, 0));
  g.add(at(mesh(new THREE.BoxGeometry(.13, .11, .04), mat('gold')), 0, .7, .33));
  [-1, 1].forEach(s => {
    const arm = mesh(new THREE.CapsuleGeometry(.075, .3, 4, 8), mat('velvetRed'));
    arm.position.set(s * .36, .84, .04); arm.rotation.z = s * .5; g.add(arm);
    g.add(at(mesh(new THREE.SphereGeometry(.07, 10, 8), mat('fur')), s * .45, .67, .07));
    g.add(at(mesh(new THREE.SphereGeometry(.07, 10, 8), mat('leather')), s * .48, .62, .08));
  });
  g.add(at(mesh(new THREE.SphereGeometry(.17, 18, 14), mat('skin')), 0, 1.25, 0));
  const beard = mesh(new THREE.SphereGeometry(.19, 16, 12), mat('fur')); beard.scale.set(1, 1.2, .75); beard.position.set(0, 1.12, .07); g.add(beard);
  g.add(at(mesh(new THREE.SphereGeometry(.035, 8, 6), new THREE.MeshStandardMaterial({ color: 0xd98a7a, roughness: .6 })), 0, 1.24, .17));
  [-.06, .06].forEach(x => g.add(at(mesh(new THREE.SphereGeometry(.018, 6, 5), mat('black')), x, 1.3, .15)));
  [-1, 1].forEach(s => { const m = mesh(new THREE.SphereGeometry(.05, 8, 6), mat('fur')); m.scale.set(1.4, .6, .7); m.position.set(s * .05, 1.2, .16); g.add(m); });
  g.add(at(mesh(new THREE.TorusGeometry(.16, .045, 8, 18), mat('fur')), 0, 1.37, 0, Math.PI / 2, 0, 0));
  const hat = mesh(new THREE.ConeGeometry(.16, .4, 16), mat('velvetRed')); hat.position.set(.04, 1.56, -.02); hat.rotation.z = -.35; g.add(hat);
  g.add(at(mesh(new THREE.SphereGeometry(.06, 10, 8), mat('fur')), .15, 1.72, -.03));
  return g;
}

export function reindeer() {
  const g = new THREE.Group();
  const body = mesh(new THREE.CapsuleGeometry(.24, .62, 6, 12), mat('deer')); body.rotation.z = Math.PI / 2; body.position.y = .95; g.add(body);
  const belly = mesh(new THREE.CapsuleGeometry(.17, .5, 4, 10), mat('deerLight')); belly.rotation.z = Math.PI / 2; belly.position.set(0, .86, 0); belly.scale.set(1, 1, .9); g.add(belly);
  const legs = [];
  [[.36, .14], [.36, -.14], [-.36, .14], [-.36, -.14]].forEach(([x, z]) => {
    const pivot = new THREE.Group(); pivot.position.set(x, .86, z);
    pivot.add(at(mesh(new THREE.CylinderGeometry(.055, .035, .78, 7), mat('deer')), 0, -.39, 0));
    pivot.add(at(mesh(new THREE.CylinderGeometry(.04, .045, .07, 7), mat('black')), 0, -.8, 0));
    g.add(pivot); legs.push(pivot);
  });
  const head = new THREE.Group(); head.position.set(.42, 1.1, 0); g.add(head);
  head.add(at(mesh(new THREE.CylinderGeometry(.1, .15, .5, 10), mat('deer')), .12, .2, 0, 0, 0, -.55));
  const skull = mesh(new THREE.SphereGeometry(.15, 14, 10), mat('deer')); skull.scale.set(1.45, .85, .8); skull.position.set(.32, .46, 0); head.add(skull);
  head.add(at(mesh(new THREE.SphereGeometry(.05, 8, 6), mat('black')), .52, .44, 0));
  [-.07, .07].forEach(z => {
    head.add(at(mesh(new THREE.SphereGeometry(.022, 6, 5), mat('black')), .38, .52, z));
    const ear = mesh(new THREE.ConeGeometry(.04, .14, 6), mat('deer')); ear.position.set(.2, .58, z * 1.6); ear.rotation.set(z > 0 ? .9 : -.9, 0, -.3); head.add(ear);
    const pts = [V(.24, .56, z), V(.2, .78, z * 2.2), V(.1, .98, z * 3.2), V(-.02, 1.08, z * 3.4)];
    head.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, .022, 5), mat('antler')));
    head.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(.18, .82, z * 2.4), V(.3, .94, z * 2.8), V(.34, 1.04, z * 3)]), 8, .018, 5), mat('antler')));
    head.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(.11, .96, z * 3.1), V(.16, 1.1, z * 3.5)]), 6, .016, 5), mat('antler')));
  });
  g.add(at(mesh(new THREE.TorusGeometry(.25, .04, 6, 16), mat('lacquerRed')), .36, 1.0, 0, 0, Math.PI / 2, .5));
  g.add(at(mesh(new THREE.SphereGeometry(.05, 10, 8), mat('gold')), .5, .82, 0));
  g.add(at(mesh(new THREE.SphereGeometry(.07, 8, 6), mat('fur')), -.56, 1.05, 0));
  g.userData.legs = legs; g.userData.head = head;
  return g;
}

export function elf(o = {}) {
  const g = new THREE.Group(), coat = o.coat === 'r' ? mat('velvetRed') : mat('velvetGreen'), hatM = o.hat === 'g' ? mat('velvetGreen') : mat('velvetRed');
  const legs = [];
  [-.07, .07].forEach(x => {
    const p = new THREE.Group(); p.position.set(x, .3, 0);
    p.add(at(mesh(new THREE.CylinderGeometry(.045, .04, .28, 8), mat('stocking')), 0, -.14, 0));
    const shoe = mesh(new THREE.CapsuleGeometry(.04, .1, 3, 6), coat === mat('velvetRed') ? mat('velvetGreen') : mat('velvetRed'));
    shoe.rotation.x = Math.PI / 2; shoe.position.set(0, -.28, .04); p.add(shoe);
    g.add(p); legs.push(p);
  });
  const body = mesh(new THREE.CylinderGeometry(.12, .2, .36, 14), coat); body.position.y = .47; g.add(body);
  g.add(at(mesh(new THREE.TorusGeometry(.19, .035, 6, 16), mat('fur')), 0, .3, 0, Math.PI / 2, 0, 0));
  g.add(at(mesh(new THREE.CylinderGeometry(.15, .16, .05, 14), mat('leather')), 0, .45, 0));
  g.add(at(mesh(new THREE.BoxGeometry(.06, .05, .02), mat('gold')), 0, .45, .16));
  const arms = new THREE.Group(); arms.position.y = .6; g.add(arms);
  [-1, 1].forEach(s => {
    const a = mesh(new THREE.CapsuleGeometry(.035, .16, 3, 6), coat);
    if (o.carry) { a.position.set(s * .12, -.04, .1); a.rotation.x = -1.2; } else { a.position.set(s * .15, -.08, 0); a.rotation.z = s * .35; }
    arms.add(a);
  });
  g.add(at(mesh(new THREE.TorusGeometry(.1, .03, 6, 14), mat('fur')), 0, .64, 0, Math.PI / 2, 0, 0));
  g.add(at(mesh(new THREE.SphereGeometry(.11, 14, 10), mat('skin')), 0, .76, 0));
  [-1, 1].forEach(s => { const e = mesh(new THREE.ConeGeometry(.025, .09, 5), mat('skin')); e.position.set(s * .11, .78, 0); e.rotation.z = -s * 1.2; g.add(e); });
  g.add(at(mesh(new THREE.SphereGeometry(.022, 6, 5), new THREE.MeshStandardMaterial({ color: 0xd98a7a })), 0, .75, .11));
  g.add(at(mesh(new THREE.TorusGeometry(.1, .025, 6, 14), mat('fur')), 0, .83, 0, Math.PI / 2, 0, 0));
  const hat = mesh(new THREE.ConeGeometry(.1, .32, 12), hatM); hat.position.set(0, .98, -.05); hat.rotation.x = -.45; g.add(hat);
  g.add(at(mesh(new THREE.SphereGeometry(.035, 8, 6), mat('fur')), 0, 1.11, -.14));
  let load = null;
  if (o.carry) {
    load = o.carry === 'sack' ? sack(.13) : o.carry === 'letters' ? letters() : gift(.24, o.k || 0);
    load.position.set(0, .5, .22);
    g.add(load);
  }
  g.userData.legs = legs; g.userData.load = load; g.userData.arms = arms;
  return g;
}
function letters() {
  const g = new THREE.Group();
  for (let i = 0; i < 4; i++) g.add(at(mesh(new THREE.BoxGeometry(.2, .012, .14), mat('paper')), 0, i * .02, 0, 0, i * .3, 0));
  return g;
}
export function envelope() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(.22, .14, .01), mat('paper'), false));
  g.add(at(mesh(new THREE.CircleGeometry(.02, 10), giftMats[0], false), 0, 0, .006));
  return g;
}

/* ---------- Iluminación de ambiente (reflejos) ---------- */
// Un "cuarto" pequeño con un fuego cálido, una lámpara y una ventana fría:
// de aquí salen los reflejos del vidrio, el latón y la laca.
export function warmEnvironment(renderer, mood = 'room') {
  const env = new THREE.Scene();
  const room = new THREE.Mesh(new THREE.SphereGeometry(20, 32, 16), new THREE.MeshBasicMaterial({ color: mood === 'room' ? 0x1c140e : 0x1a2233, side: THREE.BackSide }));
  env.add(room);
  const panel = (w, h, color, k, pos) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), side: THREE.DoubleSide })); m.position.copy(pos); m.lookAt(0, 0, 0); env.add(m); };
  if (mood === 'room') {
    panel(5, 3, 0xff8a3a, 4, V(-12, -2, 6));
    panel(3, 3, 0xffe2b0, 5, V(8, 12, 6));
    panel(4, 7, 0x6f8fc8, 3, V(10, 2, -12));
    panel(30, 4, 0x3a2414, 1.2, V(0, -14, 0));
  } else {
    panel(40, 20, 0x5a72a8, 1.6, V(0, 16, -8));
    panel(10, 6, 0xffb060, 3, V(-14, 2, 8));
    panel(30, 6, 0xdde6f2, .9, V(0, -12, 0));
  }
  const pm = new THREE.PMREMGenerator(renderer);
  const t = pm.fromScene(env, .04).texture;
  pm.dispose();
  return t;
}
