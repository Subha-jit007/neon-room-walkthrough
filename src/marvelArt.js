import * as THREE from 'three';
import { framedPiece } from './wallArt.js';

// Marvel / Avengers comic-art posters for the left wall (X = -4), hung as a
// gallery alongside the original Spider-Man poster. Each piece is drawn in a
// bold pop-art / Ben-Day style — halftone dots, speed lines, starbursts and
// chunky outlined lettering — around an iconic emblem (Cap's shield, Iron Man,
// Thor's Mjölnir, the Avengers "A").

const TAU = Math.PI * 2;

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- shared comic helpers ---------- */

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function star(g, cx, cy, ro, ri, points, rot) {
  g.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 ? ro : ri;
    const a = rot + (i / (points * 2)) * TAU;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    i ? g.lineTo(x, y) : g.moveTo(x, y);
  }
  g.closePath();
}

function starburst(g, cx, cy, ro, ri, points, fill, stroke) {
  star(g, cx, cy, ro, ri, points, -Math.PI / 2);
  if (fill) {
    g.fillStyle = fill;
    g.fill();
  }
  if (stroke) {
    g.lineWidth = 5;
    g.strokeStyle = stroke;
    g.lineJoin = 'round';
    g.stroke();
  }
}

// radial gradient + Ben-Day halftone, denser toward the edges
function comicBg(g, W, H, light, dark, dot, rng) {
  const grd = g.createRadialGradient(W / 2, H * 0.42, 0, W / 2, H * 0.42, H * 0.78);
  grd.addColorStop(0, light);
  grd.addColorStop(1, dark);
  g.fillStyle = grd;
  g.fillRect(0, 0, W, H);
  g.fillStyle = dot;
  const sp = 26;
  let row = 0;
  for (let y = -sp; y < H + sp; y += sp) {
    const off = row % 2 ? sp / 2 : 0;
    for (let x = -sp; x < W + sp; x += sp) {
      const dx = (x - W / 2) / (W / 2);
      const dy = (y - H * 0.42) / (H / 2);
      const d = Math.min(1, Math.hypot(dx, dy));
      g.globalAlpha = 0.22;
      g.beginPath();
      g.arc(x + off, y, 1 + d * 3.2, 0, TAU);
      g.fill();
    }
    row++;
  }
  g.globalAlpha = 1;
}

function speedLines(g, cx, cy, R, n, color, rng) {
  g.strokeStyle = color;
  g.globalAlpha = 0.4;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + rng() * 0.05;
    g.lineWidth = 2 + rng() * 5;
    g.beginPath();
    g.moveTo(cx + Math.cos(a) * R * 0.32, cy + Math.sin(a) * R * 0.32);
    g.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
    g.stroke();
  }
  g.globalAlpha = 1;
}

function bolt(g, x0, y0, x1, y1, color, rng) {
  g.strokeStyle = color;
  g.shadowColor = color;
  g.shadowBlur = 18;
  g.lineWidth = 6;
  g.lineJoin = 'round';
  g.beginPath();
  g.moveTo(x0, y0);
  for (let s = 1; s <= 6; s++) {
    const f = s / 6;
    g.lineTo(x0 + (x1 - x0) * f + (rng() - 0.5) * 70, y0 + (y1 - y0) * f + (rng() - 0.5) * 36);
  }
  g.stroke();
  g.shadowBlur = 0;
}

function heroName(g, W, H, text, fill, stroke) {
  g.save();
  let size = W * 0.15;
  const maxW = W * 0.82;
  g.font = `900 ${size}px "Arial Black", Impact, sans-serif`;
  const measured = g.measureText(text).width;
  if (measured > maxW) size *= maxW / measured; // shrink long names to fit
  g.font = `900 ${size}px "Arial Black", Impact, sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineJoin = 'round';
  g.lineWidth = size * 0.2;
  g.strokeStyle = stroke;
  g.strokeText(text, W / 2, H * 0.9);
  g.fillStyle = fill;
  g.fillText(text, W / 2, H * 0.9);
  g.restore();
}

function cornerBurst(g, cx, cy, text, col) {
  g.save();
  g.translate(cx, cy);
  g.rotate(-0.18);
  starburst(g, 0, 0, 96, 60, 12, '#ffe14d', '#0a0a0a');
  g.font = '900 34px "Arial Black", Impact, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineWidth = 6;
  g.lineJoin = 'round';
  g.strokeStyle = '#0a0a0a';
  g.strokeText(text, 0, 0);
  g.fillStyle = col;
  g.fillText(text, 0, 0);
  g.restore();
}

function comicBorder(g, W, H, col) {
  g.lineWidth = W * 0.045;
  g.strokeStyle = '#0a0a0a';
  g.strokeRect(g.lineWidth / 2, g.lineWidth / 2, W - g.lineWidth, H - g.lineWidth);
  const o = W * 0.06;
  g.lineWidth = W * 0.012;
  g.strokeStyle = col;
  g.strokeRect(o, o, W - 2 * o, H - 2 * o);
}

/* ---------- emblems ---------- */

function capShield(g, cx, cy, R) {
  const circle = (r, col) => {
    g.fillStyle = col;
    g.beginPath();
    g.arc(cx, cy, r, 0, TAU);
    g.fill();
  };
  circle(R, '#c0202b'); // outer red
  circle(R * 0.8, '#f2f2f2'); // white
  circle(R * 0.62, '#c0202b'); // red
  circle(R * 0.44, '#1a3fa0'); // blue centre
  g.fillStyle = '#f2f2f2';
  star(g, cx, cy, R * 0.4, R * 0.16, 5, -Math.PI / 2);
  g.fill();
  g.lineWidth = 6;
  g.strokeStyle = '#0a0a0a';
  g.beginPath();
  g.arc(cx, cy, R, 0, TAU);
  g.stroke();
}

function ironMask(g, cx, cy, R) {
  g.save();
  g.translate(cx, cy);
  g.lineWidth = 6;
  g.strokeStyle = '#0a0a0a';
  g.lineJoin = 'round';
  // red helmet silhouette
  g.fillStyle = '#c0202b';
  g.beginPath();
  g.moveTo(-R, -R * 1.05);
  g.quadraticCurveTo(-R * 1.05, -R * 0.2, -R * 0.7, R * 0.4);
  g.quadraticCurveTo(-R * 0.4, R * 1.25, 0, R * 1.5);
  g.quadraticCurveTo(R * 0.4, R * 1.25, R * 0.7, R * 0.4);
  g.quadraticCurveTo(R * 1.05, -R * 0.2, R, -R * 1.05);
  g.quadraticCurveTo(0, -R * 1.45, -R, -R * 1.05);
  g.closePath();
  g.fill();
  g.stroke();
  // gold faceplate
  g.fillStyle = '#e8b423';
  g.beginPath();
  g.moveTo(-R * 0.55, -R * 0.5);
  g.lineTo(R * 0.55, -R * 0.5);
  g.lineTo(R * 0.42, R * 0.55);
  g.quadraticCurveTo(R * 0.3, R * 1.15, 0, R * 1.35);
  g.quadraticCurveTo(-R * 0.3, R * 1.15, -R * 0.42, R * 0.55);
  g.closePath();
  g.fill();
  g.stroke();
  // brow
  g.fillStyle = '#c0202b';
  g.beginPath();
  g.moveTo(-R * 0.6, -R * 0.5);
  g.lineTo(R * 0.6, -R * 0.5);
  g.lineTo(R * 0.5, -R * 0.74);
  g.lineTo(-R * 0.5, -R * 0.74);
  g.closePath();
  g.fill();
  // glowing eyes
  g.shadowColor = '#bfefff';
  g.shadowBlur = 26;
  g.fillStyle = '#eaffff';
  g.beginPath();
  g.moveTo(-R * 0.42, -R * 0.12);
  g.lineTo(-R * 0.1, -R * 0.02);
  g.lineTo(-R * 0.1, R * 0.09);
  g.lineTo(-R * 0.42, R * 0.05);
  g.closePath();
  g.fill();
  g.beginPath();
  g.moveTo(R * 0.42, -R * 0.12);
  g.lineTo(R * 0.1, -R * 0.02);
  g.lineTo(R * 0.1, R * 0.09);
  g.lineTo(R * 0.42, R * 0.05);
  g.closePath();
  g.fill();
  g.shadowBlur = 0;
  // mouth slits
  g.strokeStyle = '#0a0a0a';
  g.lineWidth = 4;
  for (let i = -2; i <= 2; i++) {
    g.beginPath();
    g.moveTo(i * R * 0.12, R * 0.72);
    g.lineTo(i * R * 0.12, R * 0.98);
    g.stroke();
  }
  g.restore();
}

function arcReactor(g, cx, cy, r) {
  g.save();
  g.translate(cx, cy);
  const gl = g.createRadialGradient(0, 0, 0, 0, 0, r * 1.9);
  gl.addColorStop(0, 'rgba(180,240,255,0.9)');
  gl.addColorStop(1, 'rgba(180,240,255,0)');
  g.fillStyle = gl;
  g.beginPath();
  g.arc(0, 0, r * 1.9, 0, TAU);
  g.fill();
  g.fillStyle = '#dfeff5';
  g.beginPath();
  g.arc(0, 0, r, 0, TAU);
  g.fill();
  g.fillStyle = '#bfefff';
  g.beginPath();
  g.arc(0, 0, r * 0.72, 0, TAU);
  g.fill();
  g.fillStyle = '#7fdfff';
  for (let i = 0; i < 6; i++) {
    g.save();
    g.rotate((i / 6) * TAU);
    g.beginPath();
    g.moveTo(0, -r * 0.62);
    g.lineTo(r * 0.16, -r * 0.3);
    g.lineTo(-r * 0.16, -r * 0.3);
    g.closePath();
    g.fill();
    g.restore();
  }
  g.fillStyle = '#eaffff';
  g.beginPath();
  g.arc(0, 0, r * 0.22, 0, TAU);
  g.fill();
  g.lineWidth = 4;
  g.strokeStyle = '#2a6a80';
  g.beginPath();
  g.arc(0, 0, r, 0, TAU);
  g.stroke();
  g.restore();
}

function mjolnir(g, cx, cy, size) {
  g.save();
  g.translate(cx, cy);
  g.rotate(-0.1);
  const hw = size * 0.62;
  const hh = size * 0.34;
  g.lineWidth = 6;
  g.strokeStyle = '#0a0a0a';
  g.lineJoin = 'round';
  // handle
  g.fillStyle = '#6b4a2a';
  g.fillRect(-size * 0.06, hh * 0.5, size * 0.12, size * 0.72);
  g.strokeRect(-size * 0.06, hh * 0.5, size * 0.12, size * 0.72);
  // wrist strap loop
  g.strokeStyle = '#3a2410';
  g.lineWidth = 9;
  g.beginPath();
  g.arc(0, hh * 0.5 + size * 0.8, size * 0.1, 0, Math.PI);
  g.stroke();
  // head
  g.strokeStyle = '#0a0a0a';
  g.lineWidth = 6;
  g.fillStyle = '#9aa6b2';
  roundRect(g, -hw / 2, -hh / 2, hw, hh, size * 0.05);
  g.fill();
  g.stroke();
  // end bands
  g.fillStyle = '#6f7c8a';
  g.fillRect(-hw / 2, -hh / 2, hw * 0.16, hh);
  g.fillRect(hw / 2 - hw * 0.16, -hh / 2, hw * 0.16, hh);
  g.strokeRect(-hw / 2, -hh / 2, hw * 0.16, hh);
  g.strokeRect(hw / 2 - hw * 0.16, -hh / 2, hw * 0.16, hh);
  // rivets
  g.fillStyle = '#4a5560';
  for (const sx of [-hw * 0.31, hw * 0.31])
    for (const sy of [-hh * 0.28, hh * 0.28]) {
      g.beginPath();
      g.arc(sx, sy, size * 0.025, 0, TAU);
      g.fill();
    }
  // shine
  g.fillStyle = 'rgba(255,255,255,0.4)';
  g.fillRect(-hw * 0.1, -hh * 0.4, hw * 0.06, hh * 0.8);
  g.restore();
}

function avengersLogo(g, cx, cy, R, col) {
  g.save();
  g.translate(cx, cy);
  g.strokeStyle = col;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  // circle with a gap near the top-right for the arrow
  g.lineWidth = R * 0.14;
  g.beginPath();
  g.arc(0, 0, R, -Math.PI * 0.38, Math.PI * 1.3);
  g.stroke();
  // the "A"
  g.lineWidth = R * 0.16;
  g.beginPath();
  g.moveTo(-R * 0.5, R * 0.58);
  g.lineTo(0, -R * 0.62);
  g.lineTo(R * 0.5, R * 0.58);
  g.stroke();
  g.beginPath();
  g.moveTo(-R * 0.28, R * 0.08);
  g.lineTo(R * 0.28, R * 0.08);
  g.stroke();
  // arrow extension out of the top
  g.beginPath();
  g.moveTo(0, -R * 0.62);
  g.lineTo(R * 0.42, -R * 1.12);
  g.stroke();
  const tx = R * 0.42;
  const ty = -R * 1.12;
  g.beginPath();
  g.moveTo(tx, ty);
  g.lineTo(tx - R * 0.3, ty + R * 0.06);
  g.moveTo(tx, ty);
  g.lineTo(tx - R * 0.04, ty + R * 0.32);
  g.stroke();
  g.restore();
}

// Black Widow emblem: the red widow "hourglass" marking with radiating spider
// legs, inside a ring.
function blackWidow(g, cx, cy, R, col) {
  g.save();
  g.translate(cx, cy);
  // ring
  g.lineWidth = R * 0.08;
  g.strokeStyle = col;
  g.beginPath();
  g.arc(0, 0, R, 0, TAU);
  g.stroke();
  // spider legs (4 per side)
  g.lineCap = 'round';
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const y0 = -R * 0.32 + (i / 3) * R * 0.64;
      g.lineWidth = R * 0.05;
      g.beginPath();
      g.moveTo(0, y0 * 0.5);
      g.quadraticCurveTo(side * R * 0.75, y0 - R * 0.12, side * R * 1.02, y0 + (i < 2 ? -R * 0.22 : R * 0.28));
      g.stroke();
    }
  }
  // hourglass body (the widow marking)
  g.fillStyle = col;
  g.beginPath();
  g.moveTo(-R * 0.32, -R * 0.6);
  g.lineTo(R * 0.32, -R * 0.6);
  g.lineTo(0, 0);
  g.closePath();
  g.fill();
  g.beginPath();
  g.moveTo(-R * 0.32, R * 0.6);
  g.lineTo(R * 0.32, R * 0.6);
  g.lineTo(0, 0);
  g.closePath();
  g.fill();
  g.restore();
}

/* ---------- per-poster compositions ---------- */

function makeMarvelTexture(kind) {
  const W = 950;
  const H = 1150;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const g = cv.getContext('2d');
  const seeds = { cap: 0xca9, ironman: 0x1404, thor: 0x7405, avengers: 0xa7e5, natasha: 0x2a7a };
  const rng = mulberry32(seeds[kind] || 1);
  const cx = W / 2;
  const cy = H * 0.43;

  if (kind === 'cap') {
    comicBg(g, W, H, '#3a6fd8', '#10204a', '#0a1430', rng);
    speedLines(g, cx, cy, H * 0.7, 64, '#ffffff', rng);
    starburst(g, cx, cy, W * 0.46, W * 0.34, 16, '#ffd21f', '#b8860b');
    capShield(g, cx, cy, W * 0.34);
    cornerBurst(g, W * 0.81, H * 0.16, 'SHIELD!', '#c0202b');
    heroName(g, W, H, 'CAPTAIN AMERICA', '#f2f2f2', '#0a0a0a');
    comicBorder(g, W, H, '#c0202b');
  } else if (kind === 'ironman') {
    comicBg(g, W, H, '#8a2420', '#1a0606', '#3a0a0a', rng);
    speedLines(g, cx, cy, H * 0.7, 64, '#ffd21f', rng);
    starburst(g, cx, cy, W * 0.44, W * 0.32, 14, '#ffd21f', '#0a0a0a');
    ironMask(g, cx, cy - H * 0.02, W * 0.3);
    arcReactor(g, cx, H * 0.74, W * 0.09);
    cornerBurst(g, W * 0.81, H * 0.16, 'ZAP!', '#ffd21f');
    heroName(g, W, H, 'IRON MAN', '#ffd21f', '#0a0a0a');
    comicBorder(g, W, H, '#ffd21f');
  } else if (kind === 'thor') {
    comicBg(g, W, H, '#5a7fb0', '#0e1830', '#0a1428', rng);
    speedLines(g, cx, cy, H * 0.7, 60, '#ffffff', rng);
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (rng() - 0.5) * 2.4;
      bolt(g, cx, cy, cx + Math.cos(a) * H * 0.5, cy + Math.sin(a) * H * 0.5, '#ffe14d', rng);
    }
    mjolnir(g, cx, cy, W * 0.52);
    cornerBurst(g, W * 0.81, H * 0.16, 'BOOM!', '#ffe14d');
    heroName(g, W, H, 'THOR', '#ffe14d', '#0a0a0a');
    comicBorder(g, W, H, '#9fb6e0');
  } else if (kind === 'natasha') {
    comicBg(g, W, H, '#9a1525', '#120203', '#2a0408', rng);
    speedLines(g, cx, cy, H * 0.7, 64, '#ffffff', rng);
    starburst(g, cx, cy, W * 0.45, W * 0.33, 16, '#1a1a1a', '#e23b3b');
    blackWidow(g, cx, cy, W * 0.3, '#e8203a');
    cornerBurst(g, W * 0.81, H * 0.16, 'STING!', '#e8203a');
    heroName(g, W, H, 'NATASHA', '#e8203a', '#0a0a0a');
    comicBorder(g, W, H, '#e8203a');
  } else {
    comicBg(g, W, H, '#c01515', '#1a0303', '#3a0808', rng);
    speedLines(g, cx, cy, H * 0.7, 64, '#ffd21f', rng);
    starburst(g, cx, cy, W * 0.46, W * 0.33, 18, '#1a1a1a', '#ffd21f');
    avengersLogo(g, cx, cy, W * 0.32, '#f2c41f');
    cornerBurst(g, W * 0.81, H * 0.15, 'ASSEMBLE!', '#ffffff');
    heroName(g, W, H, 'AVENGERS', '#ffd21f', '#0a0a0a');
    comicBorder(g, W, H, '#ffd21f');
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/* ---------- mounted gallery on the left wall ---------- */

const texLoader = new THREE.TextureLoader();
function imageTexture(file) {
  const t = texLoader.load(`${import.meta.env.BASE_URL}posters/${file}`);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// Hung on the left wall (inner face ~X=-3.9, facing +X into the room) around the
// untouched Spider-Man poster (Z=-0.8, big/high). Pieces alternate low / high so
// the whole wall reads as a zig-zag rhythm:
//   Tony Stark (low) — [Spider-Man] — Born to Die (low) — Cap shield (high)
// The two low pieces are real image posters; Cap is drawn procedurally.
export function createMarvelPaintings() {
  const grp = new THREE.Group();
  const IMG_AR = 736 / 1308; // supplied posters are tall ~9:16 portraits
  const ih = 1.08; // image-poster height
  // [texture, w, h, y, z]
  const pieces = [
    [imageTexture('tony-stark.jpg'), ih * IMG_AR, ih, 1.5, -2.4], // low (was Iron Man)
    [imageTexture('born-to-die.jpg'), ih * IMG_AR, ih, 1.5, 0.7], // low (was Natasha)
    [makeMarvelTexture('cap'), 1.02, 1.22, 2.0, 2.2], // big / high
  ];
  for (const [tex, w, h, y, z] of pieces) {
    const p = framedPiece(tex, w, h);
    p.rotation.y = Math.PI / 2; // local +Z -> world +X (faces the room)
    p.position.set(-3.88, y, z);
    grp.add(p);
  }
  return grp;
}
