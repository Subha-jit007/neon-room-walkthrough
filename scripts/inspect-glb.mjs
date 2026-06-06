// One-off inspector: lists every mesh node in the GLB with its world-space
// center, size, and distance from the room center, so we can identify objects.
import { readFileSync } from 'node:fs';

const path = process.argv[2] || 'public/NeonRoom.glb';
const buf = readFileSync(path);

// --- parse GLB container -> glTF JSON ---
const magic = buf.readUInt32LE(0);
if (magic !== 0x46546c67) throw new Error('Not a GLB file');
let off = 12;
let json = null;
while (off < buf.length) {
  const len = buf.readUInt32LE(off);
  const type = buf.readUInt32LE(off + 4);
  const data = buf.subarray(off + 8, off + 8 + len);
  if (type === 0x4e4f534a) json = JSON.parse(new TextDecoder().decode(data));
  off += 8 + len;
}
const g = json;

// --- minimal column-major mat4 math (glTF convention) ---
const ident = () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
function mul(a, b) {
  const o = new Array(16).fill(0);
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++)
      for (let k = 0; k < 4; k++) o[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
  return o;
}
function fromTRS(t = [0, 0, 0], q = [0, 0, 0, 1], s = [1, 1, 1]) {
  const [x, y, z, w] = q;
  const x2 = x + x, y2 = y + y, z2 = z + z;
  const xx = x * x2, xy = x * y2, xz = x * z2;
  const yy = y * y2, yz = y * z2, zz = z * z2;
  const wx = w * x2, wy = w * y2, wz = w * z2;
  const [sx, sy, sz] = s;
  return [
    (1 - (yy + zz)) * sx, (xy + wz) * sx, (xz - wy) * sx, 0,
    (xy - wz) * sy, (1 - (xx + zz)) * sy, (yz + wx) * sy, 0,
    (xz + wy) * sz, (yz - wx) * sz, (1 - (xx + yy)) * sz, 0,
    t[0], t[1], t[2], 1,
  ];
}
const nodeMatrix = (n) => (n.matrix ? n.matrix.slice() : fromTRS(n.translation, n.rotation, n.scale));
function tp(m, p) {
  return [
    m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12],
    m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13],
    m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14],
  ];
}

// local AABB of a mesh from its POSITION accessor min/max (no binary read needed)
function meshLocalAABB(meshIndex) {
  const mesh = g.meshes[meshIndex];
  let mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
  for (const prim of mesh.primitives) {
    const a = g.accessors[prim.attributes.POSITION];
    if (!a || !a.min || !a.max) continue;
    for (let i = 0; i < 3; i++) {
      mn[i] = Math.min(mn[i], a.min[i]);
      mx[i] = Math.max(mx[i], a.max[i]);
    }
  }
  return { mn, mx };
}

const results = [];
const scene = g.scenes[g.scene ?? 0];
function walk(nodeIndex, parent) {
  const n = g.nodes[nodeIndex];
  const world = mul(parent, nodeMatrix(n));
  if (n.mesh != null) {
    const { mn, mx } = meshLocalAABB(n.mesh);
    if (isFinite(mn[0])) {
      let wmn = [Infinity, Infinity, Infinity], wmx = [-Infinity, -Infinity, -Infinity];
      for (let xi = 0; xi < 2; xi++)
        for (let yi = 0; yi < 2; yi++)
          for (let zi = 0; zi < 2; zi++) {
            const p = tp(world, [xi ? mx[0] : mn[0], yi ? mx[1] : mn[1], zi ? mx[2] : mn[2]]);
            for (let i = 0; i < 3; i++) {
              wmn[i] = Math.min(wmn[i], p[i]);
              wmx[i] = Math.max(wmx[i], p[i]);
            }
          }
      results.push({
        name: n.name ?? `node${nodeIndex}`,
        mesh: g.meshes[n.mesh].name ?? `mesh${n.mesh}`,
        center: [(wmn[0] + wmx[0]) / 2, (wmn[1] + wmx[1]) / 2, (wmn[2] + wmx[2]) / 2],
        size: [wmx[0] - wmn[0], wmx[1] - wmn[1], wmx[2] - wmn[2]],
        ymin: wmn[1],
        wmn, wmx,
      });
    }
  }
  for (const c of n.children ?? []) walk(c, world);
}
for (const r of scene.nodes) walk(r, ident());

// overall scene bbox + room center
let smn = [Infinity, Infinity, Infinity], smx = [-Infinity, -Infinity, -Infinity];
for (const r of results)
  for (let i = 0; i < 3; i++) {
    smn[i] = Math.min(smn[i], r.wmn[i]);
    smx[i] = Math.max(smx[i], r.wmx[i]);
  }
const cx = (smn[0] + smx[0]) / 2, cz = (smn[2] + smx[2]) / 2, floor = smn[1];
const f = (n) => n.toFixed(2).padStart(7);

console.log(`Scene bbox: X[${f(smn[0])},${f(smx[0])}] Y[${f(smn[1])},${f(smx[1])}] Z[${f(smn[2])},${f(smx[2])}]`);
console.log(`Room center (x,z): ${cx.toFixed(2)}, ${cz.toFixed(2)}   floor y: ${floor.toFixed(2)}`);
console.log(`Total mesh nodes: ${results.length}\n`);

for (const r of results) r.dist = Math.hypot(r.center[0] - cx, r.center[2] - cz);
results.sort((a, b) => a.dist - b.dist);

console.log('node name'.padEnd(26), 'centerX  centerY  centerZ', '  sizeX   sizeY   sizeZ', '  ymin', '  distFromCenter');
for (const r of results) {
  console.log(
    r.name.slice(0, 25).padEnd(26),
    f(r.center[0]), f(r.center[1]), f(r.center[2]),
    ' ', f(r.size[0]), f(r.size[1]), f(r.size[2]),
    ' ', f(r.ymin),
    ' ', r.dist.toFixed(2),
  );
}
