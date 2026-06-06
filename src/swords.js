import * as THREE from 'three';

// A wall-mounted daishō (大小) — a katana paired with a shorter wakizashi —
// resting on a katanakake rack, hung on the door (front) wall. The swords are
// built with proper anatomy: a curved (sori) steel blade with a wavy hamon
// temper line and shinogi ridge, a brass habaki collar, an iron tsuba guard
// with a gold rim, and a handle (tsuka) wrapped in diamond tsuka-ito cord over
// white ray-skin (same) with fuchi/kashira fittings.

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ExtrudeGeometry sets each cap UV equal to the vertex's (x,y); remap them to
// 0..1 over the geometry's XY bounding box so a texture fits the whole face.
function remapUVsXY(geo) {
  geo.computeBoundingBox();
  const { min, max } = geo.boundingBox;
  const w = max.x - min.x || 1;
  const h = max.y - min.y || 1;
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, (pos.getX(i) - min.x) / w, (pos.getY(i) - min.y) / h);
  }
  uv.needsUpdate = true;
}

/* ---------- textures ---------- */

// Polished steel blade, broad face. Canvas top = edge (ha), bottom = spine
// (mune), with the hamon temper line a bit above the edge.
function bladeTexture() {
  const W = 1600;
  const H = 220;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const g = cv.getContext('2d');
  const rng = mulberry32(0xb1ade5);

  // base steel gradient across the width
  const grd = g.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0.0, '#eef3f7'); // very edge — bright polish
  grd.addColorStop(0.26, '#d3dbe2'); // hardened edge (ha)
  grd.addColorStop(0.42, '#aab4be'); // ji begins
  grd.addColorStop(0.78, '#99a5b0'); // ji body
  grd.addColorStop(0.82, '#e8eef3'); // shinogi highlight
  grd.addColorStop(0.9, '#838f9c');
  grd.addColorStop(1.0, '#6e7986'); // spine (mune)
  g.fillStyle = grd;
  g.fillRect(0, 0, W, H);

  // gunome hamon wave line
  const bumps = 15;
  const baseY = H * 0.34;
  const amp = H * 0.075;
  const ham = (x) =>
    baseY - amp * Math.pow(Math.sin((x / W) * bumps * Math.PI), 2) * 0.9 - amp * 0.12 * Math.sin((x / W) * 5);

  // frosted hardened zone above the hamon
  g.beginPath();
  g.moveTo(0, 0);
  for (let x = 0; x <= W; x += 6) g.lineTo(x, ham(x));
  g.lineTo(W, 0);
  g.closePath();
  g.fillStyle = 'rgba(236,243,248,0.5)';
  g.fill();

  // misty hamon boundary line
  g.lineWidth = 3;
  g.strokeStyle = 'rgba(255,255,255,0.55)';
  g.beginPath();
  for (let x = 0; x <= W; x += 4) (x ? g.lineTo(x, ham(x)) : g.moveTo(x, ham(x)));
  g.stroke();

  // nie / nioi sparkle just inside the hamon
  for (let i = 0; i < 500; i++) {
    const x = rng() * W;
    const y = ham(x) + rng() * H * 0.06;
    g.globalAlpha = 0.15 + rng() * 0.4;
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.arc(x, y, rng() * 1.3 + 0.3, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;

  // faint lengthwise hada (forging grain) in the ji
  g.strokeStyle = 'rgba(120,135,150,0.18)';
  g.lineWidth = 1;
  for (let i = 0; i < 22; i++) {
    const y0 = H * 0.45 + rng() * H * 0.3;
    g.beginPath();
    g.moveTo(0, y0);
    for (let x = 0; x <= W; x += 40) g.lineTo(x, y0 + Math.sin(x * 0.01 + i) * 2);
    g.stroke();
  }

  // crisp shinogi ridge highlight
  g.strokeStyle = 'rgba(255,255,255,0.55)';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(0, H * 0.82);
  g.lineTo(W, H * 0.82);
  g.stroke();

  // brighten the kissaki (tip) end
  const tip = g.createLinearGradient(W * 0.93, 0, W, 0);
  tip.addColorStop(0, 'rgba(255,255,255,0)');
  tip.addColorStop(1, 'rgba(255,255,255,0.25)');
  g.fillStyle = tip;
  g.fillRect(W * 0.93, 0, W * 0.07, H);

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// Diamond tsuka-ito wrap over white ray-skin, with a gold menuki ornament.
function itoTexture() {
  const W = 640;
  const H = 200;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const g = cv.getContext('2d');
  const rng = mulberry32(0x17a17a);

  // ray-skin (same) base — pale with nodules
  g.fillStyle = '#ece6da';
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 600; i++) {
    g.fillStyle = rng() > 0.5 ? 'rgba(255,255,255,0.7)' : 'rgba(150,145,135,0.5)';
    g.beginPath();
    g.arc(rng() * W, rng() * H, rng() * 2 + 0.6, 0, Math.PI * 2);
    g.fill();
  }

  // crossed cord straps -> diamonds
  const step = 60;
  const drawStraps = (dir) => {
    for (let i = -H; i < W + H; i += step) {
      const x0 = dir > 0 ? i : i + H;
      const x1 = dir > 0 ? i + H : i;
      g.lineWidth = 22;
      g.strokeStyle = '#15110d';
      g.beginPath();
      g.moveTo(x0, 0);
      g.lineTo(x1, H);
      g.stroke();
      // cord centre highlight
      g.lineWidth = 6;
      g.strokeStyle = 'rgba(90,72,52,0.7)';
      g.beginPath();
      g.moveTo(x0, 0);
      g.lineTo(x1, H);
      g.stroke();
    }
  };
  drawStraps(1);
  drawStraps(-1);

  // gold menuki ornaments tucked in two diamonds
  const menuki = (cx, cy) => {
    g.save();
    g.translate(cx, cy);
    g.fillStyle = '#caa24a';
    for (let i = 0; i < 5; i++) {
      g.rotate((Math.PI * 2) / 5);
      g.beginPath();
      g.ellipse(0, -9, 5, 11, 0, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = '#e8c873';
    g.beginPath();
    g.arc(0, 0, 5, 0, Math.PI * 2);
    g.fill();
    g.restore();
  };
  menuki(W * 0.36, H * 0.5);
  menuki(W * 0.64, H * 0.5);

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/* ---------- materials ---------- */

const ironMat = new THREE.MeshStandardMaterial({ color: 0x2b2b30, roughness: 0.45, metalness: 0.65 });
const goldMat = new THREE.MeshStandardMaterial({
  color: 0xc8a24a,
  roughness: 0.35,
  metalness: 0.6,
  emissive: 0x3a2c10,
  emissiveIntensity: 0.4,
});
const woodMat = new THREE.MeshStandardMaterial({ color: 0x3a2616, roughness: 0.5, metalness: 0.05 });
const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x20242a, roughness: 0.5, metalness: 0.55 });

/* ---------- a single sword ---------- */

function buildBlade(L, w, sori, bladeTex) {
  const seg = 48;
  const arc = (t) => sori * Math.pow(t, 1.7);
  const wid = (t) => {
    let base = w * (1 - 0.12 * t);
    if (t > 0.9) base *= 1 - 0.9 * ((t - 0.9) / 0.1); // kissaki taper
    return base;
  };
  const shape = new THREE.Shape();
  shape.moveTo(0, arc(0));
  for (let i = 0; i <= seg; i++) {
    const t = i / seg;
    shape.lineTo(t * L, arc(t) + wid(t)); // edge (top)
  }
  for (let i = seg; i >= 0; i--) {
    const t = i / seg;
    shape.lineTo(t * L, arc(t)); // spine (bottom)
  }
  shape.closePath();

  const td = 0.008;
  const geo = new THREE.ExtrudeGeometry(shape, { depth: td, bevelEnabled: false, curveSegments: 4 });
  geo.translate(0, 0, -td / 2);
  remapUVsXY(geo);
  const mat = new THREE.MeshStandardMaterial({
    map: bladeTex,
    emissive: 0xffffff,
    emissiveMap: bladeTex,
    emissiveIntensity: 0.16,
    metalness: 0.5,
    roughness: 0.3,
  });
  return new THREE.Mesh(geo, mat);
}

function buildSword({ bladeLen, bladeW, sori, handleLen, hh, dh }, bladeTex, itoTex) {
  const g = new THREE.Group();
  const td = 0.008;

  g.add(buildBlade(bladeLen, bladeW, sori, bladeTex));

  // habaki (brass blade collar)
  const habaki = new THREE.Mesh(new THREE.BoxGeometry(0.022, bladeW * 1.3, td * 2.4), goldMat);
  habaki.position.set(0.011, bladeW * 0.5, 0);
  g.add(habaki);

  // tsuba (iron guard) + gold rim
  const tsuba = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.046, 0.006, 30), ironMat);
  tsuba.rotation.z = Math.PI / 2;
  tsuba.scale.set(1, 1, 1.08);
  tsuba.position.set(-0.002, bladeW * 0.5, 0);
  g.add(tsuba);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.004, 8, 30), goldMat);
  rim.rotation.y = Math.PI / 2;
  rim.position.set(-0.002, bladeW * 0.5, 0);
  g.add(rim);

  // tsuka (handle): diamond-wrapped broad faces, plain dark edges
  const wrap = new THREE.MeshStandardMaterial({ map: itoTex, roughness: 0.55, metalness: 0.05 });
  const wood = new THREE.MeshStandardMaterial({ color: 0x141008, roughness: 0.6, metalness: 0.05 });
  const handle = new THREE.Mesh(new THREE.BoxGeometry(handleLen, hh, dh), [
    wood,
    wood,
    wood,
    wood,
    wrap,
    wrap,
  ]);
  handle.position.set(-handleLen / 2 - 0.012, bladeW * 0.5, 0);
  g.add(handle);

  // fuchi (collar at the guard end) and kashira (pommel cap)
  const fuchi = new THREE.Mesh(new THREE.BoxGeometry(0.018, hh * 1.12, dh * 1.12), darkMetalMat);
  fuchi.position.set(-0.02, bladeW * 0.5, 0);
  g.add(fuchi);
  const kashira = new THREE.Mesh(new THREE.BoxGeometry(0.02, hh * 1.08, dh * 1.08), darkMetalMat);
  kashira.position.set(-handleLen - 0.012, bladeW * 0.5, 0);
  g.add(kashira);

  // centre the whole sword about x = 0 on the rack
  const xMin = -handleLen - 0.022;
  const xMax = bladeLen;
  g.position.x = -(xMin + xMax) / 2;
  return g;
}

// A 3D Captain America shield: stacked concentric disks (red/white/red/blue)
// stepping toward the viewer, topped with a raised white star. Built facing -Z.
function buildCapShield(R) {
  const g = new THREE.Group();
  const metal = (c, emi = 0.12) =>
    new THREE.MeshStandardMaterial({ color: c, metalness: 0.35, roughness: 0.4, emissive: c, emissiveIntensity: emi });
  const disk = (r, c, z) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.012, 48), metal(c));
    m.rotation.x = Math.PI / 2; // axis -> Z, faces toward the room
    m.position.z = z;
    g.add(m);
  };
  disk(R, 0xb5202b, 0); // outer red
  disk(R * 0.8, 0xe8e8e8, -0.012); // white
  disk(R * 0.62, 0xb5202b, -0.024); // red
  disk(R * 0.44, 0x1a3fa0, -0.036); // blue centre

  // raised white star
  const s = new THREE.Shape();
  const ro = R * 0.4;
  const ri = R * 0.16;
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? ri : ro;
    const a = -Math.PI / 2 + (i / 10) * Math.PI * 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    i ? s.lineTo(x, y) : s.moveTo(x, y);
  }
  s.closePath();
  const star = new THREE.Mesh(
    new THREE.ExtrudeGeometry(s, { depth: 0.01, bevelEnabled: false }),
    new THREE.MeshStandardMaterial({ color: 0xf2f2f2, metalness: 0.3, roughness: 0.4, emissive: 0x444444, emissiveIntensity: 0.25 }),
  );
  star.position.z = -0.05;
  g.add(star);
  return g;
}

/* ---------- the rack + assembled display ---------- */

export function createSwordDisplay() {
  const bladeTex = bladeTexture();
  const itoTex = itoTexture();

  const display = new THREE.Group();

  // mounting plaque against the wall
  const plaque = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.4, 0.03), woodMat);
  plaque.position.set(0, 0, 0.02);
  display.add(plaque);

  // two end-posts standing off the wall
  const postX = 0.25;
  for (const sx of [-postX, postX]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.4, 0.14), woodMat);
    post.position.set(sx, 0, -0.06);
    display.add(post);
    // cradle pegs (upper for katana, lower for wakizashi) with an upturned lip
    for (const py of [0.1, -0.08]) {
      const peg = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.12, 12), woodMat);
      peg.rotation.x = Math.PI / 2;
      peg.position.set(sx, py, -0.11);
      display.add(peg);
      const lip = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.035, 0.018), woodMat);
      lip.position.set(sx, py + 0.02, -0.165);
      display.add(lip);
    }
  }

  // katana (top) and wakizashi (bottom), resting on the pegs
  const katana = buildSword(
    { bladeLen: 0.68, bladeW: 0.032, sori: 0.03, handleLen: 0.24, hh: 0.032, dh: 0.022 },
    bladeTex,
    itoTex,
  );
  katana.position.add(new THREE.Vector3(0, 0.11, -0.105));
  display.add(katana);

  const wakizashi = buildSword(
    { bladeLen: 0.42, bladeW: 0.028, sori: 0.022, handleLen: 0.17, hh: 0.029, dh: 0.02 },
    bladeTex,
    itoTex,
  );
  wakizashi.position.add(new THREE.Vector3(0, -0.07, -0.105));
  display.add(wakizashi);

  // Captain America shield mounted above the swords
  const shield = buildCapShield(0.3);
  shield.position.set(0, 0.6, -0.05);
  display.add(shield);

  // hang on the door/front wall (inner face ~Z=3.88), right of the doorway.
  // No rotation needed: swords run along world X, broad faces toward the room.
  display.position.set(1.5, 1.5, 3.86);
  return display;
}
