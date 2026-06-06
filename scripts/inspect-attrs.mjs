// Show primitive attributes (POSITION, COLOR_0, NORMAL, UV) for matching meshes.
import { readFileSync } from 'node:fs';
const path = process.argv[2] || 'public/NeonRoom.glb';
const filter = (process.argv[3] || 'Floor').toLowerCase();
const buf = readFileSync(path);
let off = 12, g = null;
while (off < buf.length) {
  const len = buf.readUInt32LE(off);
  if (buf.readUInt32LE(off + 4) === 0x4e4f534a) g = JSON.parse(new TextDecoder().decode(buf.subarray(off + 8, off + 8 + len)));
  off += 8 + len;
}
for (const n of g.nodes) {
  if (n.mesh == null || !(n.name || '').toLowerCase().includes(filter)) continue;
  const mesh = g.meshes[n.mesh];
  for (const prim of mesh.primitives) {
    console.log(`node="${n.name}" attributes:`, Object.keys(prim.attributes).join(', '));
  }
}
