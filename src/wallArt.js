import * as THREE from 'three';

// Procedural Japanese ukiyo-e wall print for the bare right wall (X = +4).
//
// The art is drawn once onto a 2D canvas, then mapped onto a framed plane and
// hung on the wall. It's themed to this room: a starry indigo night sky that
// echoes the galaxy ceiling, Mount Fuji under a red sun, seigaiha (青海波) sea
// waves, a red torii gate, cherry blossoms, and a small black cat that nods to
// the room's cat plushie.

/* ---------- tiny helpers ---------- */

// deterministic RNG so the print looks identical on every load
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hexA = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

function roundRectPath(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

/* ---------- the painting ---------- */

function makeArtTexture() {
  const W = 2000;
  const H = 1200;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const g = cv.getContext('2d');
  const rng = mulberry32(0x5eed42);
  const HORIZON = H * 0.62;
  const TAU = Math.PI * 2;

  // ---- night sky ----
  const sky = g.createLinearGradient(0, 0, 0, HORIZON);
  sky.addColorStop(0.0, '#070b1c');
  sky.addColorStop(0.35, '#15224a');
  sky.addColorStop(0.72, '#3a335f');
  sky.addColorStop(1.0, '#6e4a63');
  g.fillStyle = sky;
  g.fillRect(0, 0, W, HORIZON);

  // soft nebula wisps (echo the room's galaxy ceiling)
  const neb = [
    ['#2a4d8f', 0.18],
    ['#6a3f8c', 0.15],
    ['#1f6f86', 0.12],
  ];
  for (let i = 0; i < neb.length; i++) {
    const cx = rng() * W;
    const cy = rng() * HORIZON * 0.8;
    const r = 260 + rng() * 240;
    const rg = g.createRadialGradient(cx, cy, 0, cx, cy, r);
    rg.addColorStop(0, hexA(neb[i][0], neb[i][1]));
    rg.addColorStop(1, hexA(neb[i][0], 0));
    g.fillStyle = rg;
    g.fillRect(0, 0, W, HORIZON);
  }

  // scattered stars
  for (let i = 0; i < 340; i++) {
    g.globalAlpha = 0.25 + rng() * 0.75;
    g.fillStyle = '#eaf2ff';
    g.beginPath();
    g.arc(rng() * W, rng() * HORIZON * 0.95, rng() * 1.7 + 0.4, 0, TAU);
    g.fill();
  }
  g.globalAlpha = 1;
  // a few brighter stars with a glow
  for (let i = 0; i < 10; i++) {
    const sx = rng() * W;
    const sy = rng() * HORIZON * 0.7;
    const r = 2 + rng() * 2;
    const rg = g.createRadialGradient(sx, sy, 0, sx, sy, r * 6);
    rg.addColorStop(0, 'rgba(255,255,255,0.9)');
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rg;
    g.beginPath();
    g.arc(sx, sy, r * 6, 0, TAU);
    g.fill();
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.arc(sx, sy, r, 0, TAU);
    g.fill();
  }

  // ---- red sun, low behind Fuji ----
  const sunX = W * 0.4;
  const sunY = H * 0.3;
  const sunR = W * 0.115;
  const glow = g.createRadialGradient(sunX, sunY, sunR * 0.5, sunX, sunY, sunR * 2.4);
  glow.addColorStop(0, 'rgba(240,110,70,0.55)');
  glow.addColorStop(1, 'rgba(240,110,70,0)');
  g.fillStyle = glow;
  g.beginPath();
  g.arc(sunX, sunY, sunR * 2.4, 0, TAU);
  g.fill();
  const sun = g.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR);
  sun.addColorStop(0, '#ffd9a0');
  sun.addColorStop(0.25, '#ff8b54');
  sun.addColorStop(1, '#e23b2e');
  g.fillStyle = sun;
  g.beginPath();
  g.arc(sunX, sunY, sunR, 0, TAU);
  g.fill();

  // ---- Mount Fuji ----
  const peakX = W * 0.5;
  const peakY = H * 0.2;
  const baseL = W * 0.16;
  const baseR = W * 0.84;
  const fuji = new Path2D();
  fuji.moveTo(peakX, peakY);
  fuji.quadraticCurveTo(peakX - W * 0.12, peakY + H * 0.2, baseL, HORIZON);
  fuji.lineTo(baseR, HORIZON);
  fuji.quadraticCurveTo(peakX + W * 0.12, peakY + H * 0.2, peakX, peakY);
  fuji.closePath();
  const fg = g.createLinearGradient(0, peakY, 0, HORIZON);
  fg.addColorStop(0, '#46587f');
  fg.addColorStop(0.6, '#33415f');
  fg.addColorStop(1, '#222d46');
  g.fillStyle = fg;
  g.fill(fuji);

  // snow cap with dripping edge (clipped to the mountain)
  g.save();
  g.clip(fuji);
  g.fillStyle = '#eef4fb';
  const snowY = peakY + H * 0.085;
  g.beginPath();
  g.moveTo(peakX - W * 0.25, peakY);
  g.lineTo(peakX - W * 0.25, snowY);
  const steps = 10;
  const span = W * 0.5;
  for (let i = 0; i <= steps; i++) {
    const px = peakX - W * 0.25 + span * (i / steps);
    const py = snowY + (i % 2 ? H * 0.035 : -H * 0.008) + rng() * H * 0.012;
    g.lineTo(px, py);
  }
  g.lineTo(peakX + W * 0.25, peakY);
  g.closePath();
  g.fill();
  g.restore();

  // ---- floating ukiyo-e cloud bands (over Fuji's lower slopes) ----
  function cloudBand(cy, h, color, alpha) {
    g.save();
    g.globalAlpha = alpha;
    g.fillStyle = color;
    let x = -h;
    while (x < W + h) {
      const r = h * (0.7 + rng() * 0.8);
      g.beginPath();
      g.ellipse(x, cy, r, h * 0.5, 0, 0, TAU);
      g.fill();
      x += r * 0.85;
    }
    g.restore();
  }
  cloudBand(H * 0.5, 24, '#f3e3b6', 0.5);
  cloudBand(H * 0.57, 30, '#efd9a6', 0.45);

  // horizon mist haze
  const mist = g.createLinearGradient(0, HORIZON - 95, 0, HORIZON + 18);
  mist.addColorStop(0, 'rgba(225,232,240,0)');
  mist.addColorStop(0.5, 'rgba(225,232,240,0.75)');
  mist.addColorStop(1, 'rgba(225,232,240,0)');
  g.fillStyle = mist;
  g.fillRect(0, HORIZON - 95, W, 115);

  // ---- the sea ----
  const sea = g.createLinearGradient(0, HORIZON, 0, H);
  sea.addColorStop(0, '#16385f');
  sea.addColorStop(1, '#0a1b34');
  g.fillStyle = sea;
  g.fillRect(0, HORIZON, W, H - HORIZON);

  // seigaiha (青海波) wave-scale pattern, growing toward the foreground
  g.lineCap = 'round';
  let row = 0;
  for (let y = HORIZON + 10; y < H + 40; ) {
    const t = (y - HORIZON) / (H - HORIZON);
    const R = 22 + t * 70;
    const off = row % 2 ? R : 0;
    for (let cx = -R + off; cx < W + R; cx += 2 * R) {
      for (let k = 0; k < 4; k++) {
        const rr = R * (1 - k * 0.23);
        g.lineWidth = 2 + t * 2.2;
        g.strokeStyle =
          k % 2 ? `rgba(150,200,228,${0.22 + t * 0.3})` : `rgba(255,255,255,${0.16 + t * 0.26})`;
        g.beginPath();
        g.arc(cx, y, rr, Math.PI, TAU);
        g.stroke();
      }
    }
    y += R * 0.62;
    row++;
  }

  // bright foam along the waterline
  g.fillStyle = 'rgba(255,255,255,0.85)';
  for (let i = 0; i < 80; i++) {
    g.globalAlpha = 0.3 + rng() * 0.5;
    g.beginPath();
    g.arc(rng() * W, HORIZON + rng() * 14, rng() * 4 + 1.5, 0, TAU);
    g.fill();
  }
  g.globalAlpha = 1;

  // ---- red torii gate, standing in the sea ----
  function torii(cx, baseY, hgt, col) {
    const cw = hgt * 0.07; // pillar width
    const sp = hgt * 0.6; // half span between pillars
    const top = baseY - hgt;
    g.fillStyle = col;
    // pillars
    g.fillRect(cx - sp - cw / 2, top + hgt * 0.16, cw, hgt * 0.84);
    g.fillRect(cx + sp - cw / 2, top + hgt * 0.16, cw, hgt * 0.84);
    // nuki (lower tie beam)
    g.fillRect(cx - sp - cw * 1.2, top + hgt * 0.34, sp * 2 + cw * 2.4, cw * 1.1);
    // gakuzuka (centre post)
    g.fillRect(cx - cw * 0.4, top + hgt * 0.2, cw * 0.8, hgt * 0.16);
    // kasagi (curved top beam with upturned ends)
    const ty = top + hgt * 0.08;
    const th = cw * 1.4;
    const ov = sp + cw * 2.0;
    g.beginPath();
    g.moveTo(cx - ov, ty + th);
    g.quadraticCurveTo(cx, ty - th * 0.45, cx + ov, ty + th);
    g.lineTo(cx + ov, ty + th * 1.9);
    g.quadraticCurveTo(cx, ty + th * 0.6, cx - ov, ty + th * 1.9);
    g.closePath();
    g.fill();
    // shimaki (slim beam just below kasagi)
    g.fillRect(cx - sp - cw * 0.7, top + hgt * 0.2, sp * 2 + cw * 1.4, cw * 0.7);
  }
  const trX = W * 0.8;
  const trBase = H * 0.93;
  const trH = H * 0.46;
  // faint reflection first
  g.save();
  g.globalAlpha = 0.18;
  g.translate(0, 2 * trBase);
  g.scale(1, -1);
  torii(trX, trBase, trH, '#7a2118');
  g.restore();
  torii(trX, trBase, trH, '#c2342a');

  // ---- foreground rock + sitting black cat (nods to the room's plushie) ----
  g.fillStyle = '#0c1730';
  g.beginPath();
  g.moveTo(-20, H);
  g.bezierCurveTo(W * 0.04, H * 0.86, W * 0.16, H * 0.88, W * 0.24, H * 0.94);
  g.lineTo(W * 0.3, H);
  g.closePath();
  g.fill();

  (function cat() {
    const cx = W * 0.115;
    const by = H * 0.9;
    const s = H * 0.1;
    g.fillStyle = '#05060a';
    // body
    g.beginPath();
    g.moveTo(cx - s * 0.5, by);
    g.quadraticCurveTo(cx - s * 0.55, by - s * 0.9, cx - s * 0.1, by - s * 0.95);
    g.quadraticCurveTo(cx + s * 0.4, by - s * 1.0, cx + s * 0.45, by);
    g.closePath();
    g.fill();
    // head
    g.beginPath();
    g.arc(cx + s * 0.18, by - s * 1.05, s * 0.34, 0, TAU);
    g.fill();
    // ears
    g.beginPath();
    g.moveTo(cx - s * 0.02, by - s * 1.22);
    g.lineTo(cx + s * 0.05, by - s * 1.6);
    g.lineTo(cx + s * 0.22, by - s * 1.28);
    g.closePath();
    g.fill();
    g.beginPath();
    g.moveTo(cx + s * 0.25, by - s * 1.3);
    g.lineTo(cx + s * 0.42, by - s * 1.56);
    g.lineTo(cx + s * 0.46, by - s * 1.2);
    g.closePath();
    g.fill();
    // curling tail
    g.lineWidth = s * 0.18;
    g.strokeStyle = '#05060a';
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(cx - s * 0.45, by - s * 0.1);
    g.quadraticCurveTo(cx - s * 0.95, by - s * 0.2, cx - s * 0.7, by - s * 0.72);
    g.stroke();
    // glowing eyes (a nod to the room's neon)
    g.fillStyle = '#ffd86b';
    g.beginPath();
    g.arc(cx + s * 0.28, by - s * 1.07, s * 0.045, 0, TAU);
    g.fill();
    g.beginPath();
    g.arc(cx + s * 0.4, by - s * 1.07, s * 0.045, 0, TAU);
    g.fill();
  })();

  // ---- cherry blossom branch, top-left corner ----
  g.strokeStyle = '#3a2417';
  g.lineCap = 'round';
  g.lineWidth = 14;
  g.beginPath();
  g.moveTo(-10, H * 0.02);
  g.bezierCurveTo(W * 0.1, H * 0.06, W * 0.16, H * 0.02, W * 0.24, H * 0.12);
  g.stroke();
  g.lineWidth = 7;
  [
    [W * 0.08, H * 0.05, W * 0.11, H * 0.17],
    [W * 0.16, H * 0.04, W * 0.22, H * 0.0],
    [W * 0.2, H * 0.09, W * 0.29, H * 0.06],
  ].forEach((t) => {
    g.beginPath();
    g.moveTo(t[0], t[1]);
    g.quadraticCurveTo((t[0] + t[2]) / 2, t[1] - H * 0.04, t[2], t[3]);
    g.stroke();
  });

  function blossom(cx, cy, r) {
    g.save();
    g.translate(cx, cy);
    g.rotate(rng() * TAU);
    for (let i = 0; i < 5; i++) {
      g.rotate(TAU / 5);
      g.fillStyle = '#f8cdda';
      g.beginPath();
      g.ellipse(0, -r, r * 0.5, r * 0.82, 0, 0, TAU);
      g.fill();
      g.fillStyle = '#f3aac1';
      g.beginPath();
      g.ellipse(0, -r * 1.32, r * 0.16, r * 0.24, 0, 0, TAU);
      g.fill();
    }
    g.fillStyle = '#ffe39a';
    g.beginPath();
    g.arc(0, 0, r * 0.22, 0, TAU);
    g.fill();
    g.restore();
  }
  for (let i = 0; i < 28; i++) blossom(rng() * W * 0.31, rng() * H * 0.19, 10 + rng() * 10);

  // ---- vertical calligraphy + hanko seal ----
  // 星空の部屋 — "room of the starry sky"
  g.save();
  g.fillStyle = 'rgba(244,238,225,0.94)';
  g.shadowColor = 'rgba(0,0,0,0.55)';
  g.shadowBlur = 10;
  g.font = `600 ${Math.round(H * 0.074)}px "Yu Mincho","Hiragino Mincho ProN","MS Mincho",serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const colX = W * 0.93;
  let cy = H * 0.14;
  ['星', '空', 'の', '部', '屋'].forEach((ch) => {
    g.fillText(ch, colX, cy);
    cy += H * 0.084;
  });
  g.shadowBlur = 0;
  // hanko (red seal) below the column
  const ss = H * 0.078;
  const sy = cy + H * 0.005;
  g.fillStyle = '#b5362b';
  roundRectPath(g, colX - ss / 2, sy - ss / 2, ss, ss, 8);
  g.fill();
  g.fillStyle = '#f4eee1';
  g.font = `700 ${Math.round(ss * 0.52)}px "Yu Mincho","MS Mincho",serif`;
  g.fillText('室', colX, sy);
  g.restore();

  // ---- finishing: warm vignette + gold keyline ----
  const vg = g.createRadialGradient(W * 0.5, H * 0.5, H * 0.3, W * 0.5, H * 0.5, H * 0.92);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.35)');
  g.fillStyle = vg;
  g.fillRect(0, 0, W, H);

  g.strokeStyle = 'rgba(190,150,80,0.9)';
  g.lineWidth = 6;
  g.strokeRect(W * 0.018, H * 0.022, W * 0.964, H * 0.956);
  g.strokeStyle = 'rgba(190,150,80,0.45)';
  g.lineWidth = 2;
  g.strokeRect(W * 0.028, H * 0.034, W * 0.944, H * 0.932);

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/* ---------- Japanese flower paintings (kachō-ga, gold-leaf ground) ---------- */

// gold-leaf (kinpaku) background in the Rinpa screen style
function goldGround(g, W, H, rng) {
  const bg = g.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#d9b25e');
  bg.addColorStop(0.5, '#c79a44');
  bg.addColorStop(1, '#b8862f');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  // faint leaf squares
  const s = W / 6;
  g.globalAlpha = 0.1;
  for (let y = 0; y < H; y += s)
    for (let x = 0; x < W; x += s) {
      g.fillStyle = rng() > 0.5 ? '#ecd089' : '#b3852f';
      g.fillRect(x + 1, y + 1, s - 2, s - 2);
    }
  g.globalAlpha = 1;
  g.strokeStyle = 'rgba(120,85,20,0.22)';
  g.lineWidth = 2;
  for (let y = 0; y <= H; y += s) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(W, y);
    g.stroke();
  }
  for (let x = 0; x <= W; x += s) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x, H);
    g.stroke();
  }
  // soft sheen
  const sh = g.createRadialGradient(W * 0.35, H * 0.3, 0, W * 0.35, H * 0.3, H * 0.8);
  sh.addColorStop(0, 'rgba(255,246,212,0.35)');
  sh.addColorStop(1, 'rgba(255,246,212,0)');
  g.fillStyle = sh;
  g.fillRect(0, 0, W, H);
}

// one brush petal pointing "up" from (cx,cy), rotated by ang
function petal(g, cx, cy, ang, len, wid, fill, edge) {
  g.save();
  g.translate(cx, cy);
  g.rotate(ang);
  g.beginPath();
  g.moveTo(0, 0);
  g.bezierCurveTo(wid, -len * 0.35, wid * 0.55, -len, 0, -len);
  g.bezierCurveTo(-wid * 0.55, -len, -wid, -len * 0.35, 0, 0);
  g.closePath();
  g.fillStyle = fill;
  g.fill();
  if (edge) {
    g.lineWidth = 2.2;
    g.strokeStyle = edge;
    g.stroke();
  }
  g.restore();
}

// a pointed leaf with a centre vein
function leaf(g, cx, cy, ang, len, wid, fill, edge) {
  g.save();
  g.translate(cx, cy);
  g.rotate(ang);
  g.beginPath();
  g.moveTo(0, 0);
  g.quadraticCurveTo(wid, -len * 0.5, 0, -len);
  g.quadraticCurveTo(-wid, -len * 0.5, 0, 0);
  g.closePath();
  g.fillStyle = fill;
  g.fill();
  if (edge) {
    g.lineWidth = 2;
    g.strokeStyle = edge;
    g.stroke();
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(0, -len * 0.92);
    g.lineWidth = 1.4;
    g.stroke();
  }
  g.restore();
}

// a full peony bloom: three rings of radiating petals + a stamen cluster
function peony(g, cx, cy, R, pal, rng) {
  const TAU = Math.PI * 2;
  const rings = [
    [10, R, R * 0.5, pal.light],
    [8, R * 0.72, R * 0.42, pal.mid],
    [6, R * 0.5, R * 0.34, pal.dark],
  ];
  rings.forEach((ring, ri) => {
    const [n, len, wid, col] = ring;
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * TAU + ri * 0.5 + rng() * 0.12;
      petal(g, cx, cy, ang, len * (0.9 + rng() * 0.2), wid, col, pal.edge);
    }
  });
  g.fillStyle = pal.center;
  for (let i = 0; i < 20; i++) {
    const a = rng() * TAU;
    const rr = rng() * R * 0.22;
    g.beginPath();
    g.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, R * 0.03 + rng() * R * 0.02, 0, TAU);
    g.fill();
  }
}

// a stylised iris (kakitsubata): drooping falls + upright standards
function iris(g, cx, cy, S, pal) {
  const TAU = Math.PI * 2;
  const dir = (a) => [Math.sin(a), -Math.cos(a)];
  // falls (droop downward/outward)
  for (const da of [-0.55, 0, 0.55]) petal(g, cx, cy, Math.PI + da, S * 1.05, S * 0.55, pal.fall, pal.edge);
  // yellow signals near the base of each fall
  for (const da of [-0.55, 0, 0.55]) {
    const a = Math.PI + da;
    const [dx, dy] = dir(a);
    g.fillStyle = pal.signal;
    g.beginPath();
    g.ellipse(cx + dx * S * 0.42, cy + dy * S * 0.42, S * 0.1, S * 0.2, a, 0, TAU);
    g.fill();
  }
  // standards (stand upright)
  for (const da of [-0.4, 0, 0.4]) petal(g, cx, cy, da, S * 0.68, S * 0.4, pal.std, pal.edge);
}

function paintPeonies(g, W, H, rng) {
  const greenF = '#4e7a3e';
  const greenD = '#3a6030';
  const greenE = 'rgba(28,52,18,0.5)';
  // stems
  g.strokeStyle = greenD;
  g.lineWidth = W * 0.022;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(W * 0.5, H * 1.02);
  g.quadraticCurveTo(W * 0.4, H * 0.72, W * 0.46, H * 0.52);
  g.stroke();
  g.beginPath();
  g.moveTo(W * 0.54, H * 1.02);
  g.quadraticCurveTo(W * 0.64, H * 0.74, W * 0.6, H * 0.44);
  g.stroke();
  // leaves
  leaf(g, W * 0.4, H * 0.68, -0.6, H * 0.16, W * 0.11, greenF, greenE);
  leaf(g, W * 0.64, H * 0.72, 0.7, H * 0.15, W * 0.1, greenF, greenE);
  leaf(g, W * 0.3, H * 0.52, -1.2, H * 0.14, W * 0.09, greenD, greenE);
  leaf(g, W * 0.72, H * 0.58, 1.15, H * 0.13, W * 0.09, greenD, greenE);
  // blooms (pink + coral) and a small bud
  const pink = { light: '#f3b9c8', mid: '#e87a96', dark: '#cf4d6e', center: '#f5d77a', edge: 'rgba(120,30,55,0.5)' };
  const coral = { light: '#f6cdb0', mid: '#ea9a78', dark: '#d56a4f', center: '#f3d27a', edge: 'rgba(120,50,30,0.5)' };
  peony(g, W * 0.45, H * 0.5, W * 0.22, pink, rng);
  peony(g, W * 0.62, H * 0.42, W * 0.16, coral, rng);
  peony(g, W * 0.37, H * 0.74, W * 0.09, pink, rng);
}

function paintIrises(g, W, H, rng) {
  const greenF = '#3f6f47';
  const greenD = '#2f5436';
  const greenE = 'rgba(18,42,24,0.5)';
  // tall sword leaves
  g.lineCap = 'round';
  const blades = [
    [0.32, 0.06, 0.64],
    [0.42, -0.03, 0.8],
    [0.55, 0.05, 0.72],
    [0.66, 0.13, 0.6],
    [0.5, 0.0, 0.84],
  ];
  blades.forEach((b, i) =>
    leaf(g, W * b[0], H * 1.0, b[1], H * b[2], W * 0.05, i % 2 ? greenF : greenD, greenE),
  );
  // flowers (two violets, staggered)
  const violet = { fall: '#6a4fb0', std: '#9079d0', signal: '#f0c84e', edge: 'rgba(40,25,80,0.55)' };
  const blue = { fall: '#4f6abf', std: '#7d97da', signal: '#f0d24e', edge: 'rgba(25,40,90,0.55)' };
  iris(g, W * 0.4, H * 0.32, W * 0.16, violet);
  iris(g, W * 0.62, H * 0.44, W * 0.14, blue);
  iris(g, W * 0.5, H * 0.21, W * 0.12, violet);
}

function makeFlowerTexture(kind) {
  const W = 900;
  const H = 1335;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const g = cv.getContext('2d');
  const rng = mulberry32(kind === 'peony' ? 0x10ce5 : 0x20ce5);
  goldGround(g, W, H, rng);
  if (kind === 'peony') paintPeonies(g, W, H, rng);
  else paintIrises(g, W, H, rng);
  // vignette + gold keyline
  const vg = g.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.78);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(60,30,0,0.3)');
  g.fillStyle = vg;
  g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(80,55,15,0.85)';
  g.lineWidth = W * 0.012;
  g.strokeRect(W * 0.02, H * 0.014, W * 0.96, H * 0.972);
  g.strokeStyle = 'rgba(150,110,40,0.6)';
  g.lineWidth = 2;
  g.strokeRect(W * 0.035, H * 0.024, W * 0.93, H * 0.952);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/* ---------- framed pieces, mounted on the right wall ---------- */

// Build a framed picture centred at the origin, facing +Z (local space): the
// print itself (a standard material so it sits under the room lighting, with a
// gentle emissive lift to keep colours vivid) plus a dark-walnut frame made of a
// thin backing and four raised bars.
export function framedPiece(tex, artW, artH, fw = 0.07, fd = 0.05) {
  const group = new THREE.Group();
  const artMat = new THREE.MeshStandardMaterial({
    map: tex,
    emissive: 0xffffff,
    emissiveMap: tex,
    emissiveIntensity: 0.22,
    roughness: 0.92,
    metalness: 0.0,
  });
  const art = new THREE.Mesh(new THREE.PlaneGeometry(artW, artH), artMat);
  art.position.z = 0.006;
  group.add(art);

  const frameMat = new THREE.MeshStandardMaterial({ color: 0x2a1d12, roughness: 0.55, metalness: 0.12 });
  const back = new THREE.Mesh(new THREE.BoxGeometry(artW + 2 * fw, artH + 2 * fw, 0.02), frameMat);
  back.position.z = -0.01;
  group.add(back);
  const bar = (w, h, x, y) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, fd), frameMat);
    m.position.set(x, y, fd / 2);
    group.add(m);
  };
  bar(artW + 2 * fw, fw, 0, artH / 2 + fw / 2); // top
  bar(artW + 2 * fw, fw, 0, -(artH / 2 + fw / 2)); // bottom
  bar(fw, artH, -(artW / 2 + fw / 2), 0); // left
  bar(fw, artH, artW / 2 + fw / 2, 0); // right
  return group;
}

// The main ukiyo-e print, hung on the right wall (inner face ~X=3.9), facing -X.
export function createWallArt() {
  const g = framedPiece(makeArtTexture(), 2.4, 1.44, 0.08, 0.06);
  g.rotation.y = -Math.PI / 2; // local +Z -> world -X
  g.position.set(3.88, 1.6, 0.4);
  return g;
}

// Two Japanese flower paintings (peony + iris) flanking the main print, hung at
// the same height and matching frames for a gallery cluster on the right wall.
export function createFlowerPaintings() {
  const grp = new THREE.Group();
  const w = 0.62;
  const h = 0.92;
  const left = framedPiece(makeFlowerTexture('peony'), w, h);
  left.rotation.y = -Math.PI / 2;
  left.position.set(3.88, 1.6, -1.5); // toward the desk corner
  grp.add(left);
  const right = framedPiece(makeFlowerTexture('iris'), w, h);
  right.rotation.y = -Math.PI / 2;
  right.position.set(3.88, 1.6, 2.3); // toward the door
  grp.add(right);
  return grp;
}
