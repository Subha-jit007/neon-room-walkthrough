// List every material: linear baseColor, approx displayed sRGB hex, and the
// mesh nodes using it (with world center/size). Helps pinpoint an object by color.
import { readFileSync } from 'node:fs';

const path = process.argv[2] || 'public/NeonRoom.glb';
const buf = readFileSync(path);
let off = 12, g = null;
while (off < buf.length) {
  const len = buf.readUInt32LE(off);
  if (buf.readUInt32LE(off + 4) === 0x4e4f534a) g = JSON.parse(new TextDecoder().decode(buf.subarray(off + 8, off + 8 + len)));
  off += 8 + len;
}

const lin2srgb = (l) => (l <= 0.0031308 ? 12.92 * l : 1.055 * Math.pow(l, 1 / 2.4) - 0.055);
const hex = (rgb) => '#' + rgb.map((c) => Math.round(Math.min(1, Math.max(0, lin2srgb(c))) * 255).toString(16).padStart(2, '0')).join('');

// map material index -> node names
const usedBy = new Map();
for (const n of g.nodes) {
  if (n.mesh == null) continue;
  for (const prim of g.meshes[n.mesh].primitives) {
    if (prim.material == null) continue;
    if (!usedBy.has(prim.material)) usedBy.set(prim.material, []);
    usedBy.get(prim.material).push(n.name ?? `node`);
  }
}

const rows = [];
g.materials.forEach((m, i) => {
  const bc = (m.pbrMetallicRoughness?.baseColorFactor) ?? [1, 1, 1, 1];
  const [r, gr, b] = bc;
  // crude "lavender/purple" score: blue & red high, green a bit lower
  const purple = (r + b) / 2 - gr;
  rows.push({ i, name: m.name ?? '', bc, hex: hex(bc), purple, nodes: usedBy.get(i) ?? [] });
});

rows.sort((a, b) => b.purple - a.purple);
for (const row of rows) {
  console.log(
    `mat[${String(row.i).padStart(2)}] ${row.hex}  lin(${row.bc.slice(0, 3).map((c) => c.toFixed(2)).join(',')})  purpleScore=${row.purple.toFixed(2)}  "${row.name}"`,
  );
  console.log('        nodes:', row.nodes.slice(0, 8).join(', ') + (row.nodes.length > 8 ? ` (+${row.nodes.length - 8})` : ''));
}
