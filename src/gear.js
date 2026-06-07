import * as THREE from 'three';

// Detailed desk gear modelled after the user's real kit: an RGB Ant-Esports
// keyboard, a black wireless mouse, a ring light on a desk tripod, a mint sipper
// bottle, and an over-ear headset (hung on the wall to the right of the monitor).
// All are static decor placed on/around the desk (top surface at Y = 0.84).

const _up = new THREE.Vector3(0, 1, 0);

const matte = (color, rough = 0.6, metal = 0.2) =>
  new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });

// a cylinder strut between two points (for tripod legs, headset yokes)
function strut(p0, p1, r, mat) {
  const dir = new THREE.Vector3().subVectors(p1, p0);
  const len = dir.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8), mat);
  m.position.copy(p0).add(p1).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(_up, dir.normalize());
  return m;
}

/* ---------- RGB keyboard ---------- */

function buildKeyboard() {
  const g = new THREE.Group();
  const W = 0.345;
  const D = 0.145;
  const H = 0.02;
  const pitch = 0.0215;
  const ks = 0.017;
  const kh = 0.008;

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(W, H, D),
    matte(0x0e0e10, 0.5, 0.35),
  );
  base.position.y = H / 2;
  g.add(base);

  const capGeo = new THREE.BoxGeometry(ks, kh, ks);
  const topY = H + kh / 2;
  const startZ = -D / 2 + 0.018;
  const cap = (w, x, z, hue) =>
    new THREE.Mesh(
      w === ks ? capGeo : new THREE.BoxGeometry(w, kh, ks),
      new THREE.MeshStandardMaterial({
        color: 0x0b0b0b,
        emissive: new THREE.Color().setHSL(hue, 1.0, 0.55),
        emissiveIntensity: 0.7,
        roughness: 0.6,
      }),
    ).translateX(x).translateY(topY).translateZ(z);

  // five keycap rows (rainbow left→right, like the photo)
  const rows = [14, 14, 14, 13, 13];
  for (let r = 0; r < rows.length; r++) {
    const n = rows[r];
    const x0 = -(n * pitch) / 2 + pitch / 2;
    const z = startZ + r * pitch;
    for (let c = 0; c < n; c++) {
      const hue = (0.85 - (c / (n - 1)) * 0.62 + r * 0.02 + 1) % 1;
      g.add(cap(ks, x0 + c * pitch, z, hue));
    }
  }

  // bottom mod row with a wide spacebar
  const widths = [1, 1, 1, 6, 1, 1, 1, 1];
  const total = widths.reduce((a, b) => a + b, 0) * pitch;
  let x = -total / 2;
  const zb = startZ + rows.length * pitch;
  widths.forEach((w, i) => {
    const wm = w * pitch - 0.004;
    g.add(cap(wm, x + (w * pitch) / 2, zb, (0.85 - (i / widths.length) * 0.62 + 1) % 1));
    x += w * pitch;
  });

  // raised front bezel lip with a small brand bar
  const lip = new THREE.Mesh(new THREE.BoxGeometry(W, 0.006, 0.01), matte(0x080809, 0.45, 0.4));
  lip.position.set(0, H + 0.002, D / 2 - 0.008);
  g.add(lip);
  const brand = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.004, 0.004), matte(0x9a9aa0, 0.4, 0.6));
  brand.position.set(0, H + 0.006, D / 2 - 0.008);
  g.add(brand);
  return g;
}

/* ---------- wireless mouse ---------- */

function buildMouse() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 18), matte(0x161616, 0.6, 0.25));
  body.scale.set(0.032, 0.02, 0.056);
  body.position.y = 0.019;
  g.add(body);
  // glossy lower band
  const band = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12), matte(0x080808, 0.2, 0.5));
  band.scale.set(0.0325, 0.009, 0.057);
  band.position.y = 0.009;
  g.add(band);
  // scroll wheel
  const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.009, 14), matte(0x2a2a2a, 0.5));
  wheel.rotation.z = Math.PI / 2;
  wheel.position.set(0, 0.034, -0.028);
  g.add(wheel);
  // button-split groove down the top
  const split = new THREE.Mesh(new THREE.BoxGeometry(0.0015, 0.006, 0.05), matte(0x050505, 0.5));
  split.position.set(0, 0.035, 0.005);
  g.add(split);
  // logo ring on top
  const logo = new THREE.Mesh(new THREE.TorusGeometry(0.008, 0.0015, 8, 20), matte(0x3a3a3a, 0.5, 0.4));
  logo.position.set(0, 0.038, 0.014);
  g.add(logo);
  return g;
}

/* ---------- mousepad ---------- */

function buildMousepad() {
  const w = 0.3;
  const d = 0.24;
  const r = 0.03;
  const t = 0.005;
  const rounded = (ww, dd) => {
    const s = new THREE.Shape();
    const x0 = -ww / 2;
    const y0 = -dd / 2;
    s.moveTo(x0 + r, y0);
    s.lineTo(x0 + ww - r, y0);
    s.quadraticCurveTo(x0 + ww, y0, x0 + ww, y0 + r);
    s.lineTo(x0 + ww, y0 + dd - r);
    s.quadraticCurveTo(x0 + ww, y0 + dd, x0 + ww - r, y0 + dd);
    s.lineTo(x0 + r, y0 + dd);
    s.quadraticCurveTo(x0, y0 + dd, x0, y0 + dd - r);
    s.lineTo(x0, y0 + r);
    s.quadraticCurveTo(x0, y0, x0 + r, y0);
    return s;
  };
  const slab = (ww, dd, h, mat) => {
    const geo = new THREE.ExtrudeGeometry(rounded(ww, dd), { depth: h, bevelEnabled: false });
    geo.rotateX(-Math.PI / 2); // lay flat: thickness along +Y
    return new THREE.Mesh(geo, mat);
  };
  const g = new THREE.Group();
  // stitched edge band peeking out beneath the surface
  const edge = slab(w + 0.012, d + 0.012, t * 0.6, matte(0x2a2a30, 0.85, 0.0));
  g.add(edge);
  // cloth surface
  const surface = slab(w, d, t, matte(0x111114, 0.95, 0.0));
  surface.position.y = 0.001;
  g.add(surface);
  return g;
}

/* ---------- ring light on a desk tripod ---------- */

function buildRingLight() {
  const g = new THREE.Group();
  const blk = matte(0x121212, 0.5, 0.3);

  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xfff3df,
    emissiveIntensity: 0.95,
    roughness: 0.4,
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.016, 16, 48), ringMat);
  ring.position.y = 0.3;
  g.add(ring);

  const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.05, 0.018), matte(0xf2f2f2, 0.5));
  bracket.position.set(0, 0.17, 0);
  g.add(bracket);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.018, 16, 12), blk);
  ball.position.y = 0.14;
  g.add(ball);
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.022, 8), blk);
  knob.rotation.z = Math.PI / 2;
  knob.position.set(0.022, 0.14, 0);
  g.add(knob);
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.1, 12), blk);
  col.position.y = 0.085;
  g.add(col);

  // three splayed tripod legs
  const top = new THREE.Vector3(0, 0.06, 0);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    g.add(strut(top, new THREE.Vector3(Math.cos(a) * 0.09, 0, Math.sin(a) * 0.09), 0.005, blk));
  }
  return g;
}

/* ---------- mint sipper bottle ---------- */

function buildBottle() {
  const g = new THREE.Group();
  const mint = matte(0xc3e8df, 0.3, 0.05);
  const teal = matte(0x6fcfc8, 0.3, 0.05);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.022, 24), mint);
  base.position.y = 0.011;
  g.add(base);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.037, 0.12, 24), mint);
  body.position.y = 0.075;
  g.add(body);
  // ribbed grooves
  for (const ry of [0.05, 0.085, 0.115]) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.0035, 8, 24), mint);
    rib.rotation.x = Math.PI / 2;
    rib.position.y = ry;
    g.add(rib);
  }
  const shoulder = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.036, 0.045, 24), teal);
  shoulder.position.y = 0.157;
  g.add(shoulder);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.024, 0.02, 20), teal);
  neck.position.y = 0.19;
  g.add(neck);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.028, 20), teal);
  cap.position.y = 0.214;
  g.add(cap);
  // grey wrist strap loop hanging off the neck
  const strap = new THREE.Mesh(
    new THREE.TorusGeometry(0.03, 0.004, 8, 18, Math.PI),
    matte(0xbdbcb2, 0.85, 0.0),
  );
  strap.position.set(0.024, 0.16, 0);
  strap.rotation.z = -0.5;
  g.add(strap);
  return g;
}

/* ---------- over-ear headset ---------- */

function buildHeadset() {
  const g = new THREE.Group();
  const blk = matte(0x141414, 0.6, 0.2);
  const cushion = matte(0x090909, 0.45, 0.1);
  const R = 0.085;

  // headband arch (upper half torus)
  const band = new THREE.Mesh(new THREE.TorusGeometry(R, 0.014, 12, 32, Math.PI), blk);
  g.add(band);

  for (const sx of [-1, 1]) {
    const ex = sx * R;
    g.add(strut(new THREE.Vector3(ex, 0, 0), new THREE.Vector3(ex, -0.035, 0), 0.008, blk));
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.052, 0.036, 24), blk);
    cup.rotation.x = Math.PI / 2; // axis -> Z (faces the room)
    cup.position.set(ex, -0.055, 0);
    g.add(cup);
    const pad = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.016, 12, 24), cushion);
    pad.position.set(ex, -0.055, 0.02);
    g.add(pad);
  }
  return g;
}

/* ---------- assembled placement ---------- */

export function createDeskGear() {
  const g = new THREE.Group();
  const Y = 0.84; // desk top surface

  // Keyboard + mouse: larger, and pulled forward to the desk edge so they're
  // reachable from the chair (rather than jammed against the screen).
  const kb = buildKeyboard();
  kb.scale.setScalar(1.3);
  kb.position.set(1.9, Y, -2.55);
  g.add(kb);

  const pad = buildMousepad();
  pad.position.set(2.6, Y, -2.5);
  g.add(pad);

  const mouse = buildMouse();
  mouse.scale.setScalar(1.35);
  mouse.position.set(2.6, Y + 0.006, -2.5);
  g.add(mouse);

  const ring = buildRingLight();
  ring.position.set(1.32, Y, -2.45);
  g.add(ring);

  const bottle = buildBottle();
  bottle.position.set(2.82, Y, -2.4);
  g.add(bottle);

  // headset hung on the back wall, just right of the monitor, near the screen
  const headset = buildHeadset();
  headset.position.set(2.6, 1.55, -3.84);
  g.add(headset);

  return g;
}
