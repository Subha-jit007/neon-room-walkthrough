// Dump material properties for meshes whose name matches the given filter.
import { readFileSync } from 'node:fs';

const path = process.argv[2] || 'public/NeonRoom.glb';
const filter = (process.argv[3] || 'Floor').toLowerCase();
const buf = readFileSync(path);

let off = 12;
let g = null;
while (off < buf.length) {
  const len = buf.readUInt32LE(off);
  const type = buf.readUInt32LE(off + 4);
  if (type === 0x4e4f534a) g = JSON.parse(new TextDecoder().decode(buf.subarray(off + 8, off + 8 + len)));
  off += 8 + len;
}

const seen = new Set();
for (const n of g.nodes) {
  if (n.mesh == null || !(n.name || '').toLowerCase().includes(filter)) continue;
  const mesh = g.meshes[n.mesh];
  for (const prim of mesh.primitives) {
    if (prim.material == null || seen.has(prim.material)) continue;
    seen.add(prim.material);
    const m = g.materials[prim.material];
    const pbr = m.pbrMetallicRoughness || {};
    console.log(`node="${n.name}"  material[${prim.material}]="${m.name ?? ''}"`);
    console.log('  baseColorFactor :', pbr.baseColorFactor ?? '(default 1,1,1,1)');
    console.log('  metallic/rough  :', pbr.metallicFactor ?? '(1)', '/', pbr.roughnessFactor ?? '(1)');
    console.log('  emissiveFactor  :', m.emissiveFactor ?? '(0,0,0)');
    if (m.extensions?.KHR_materials_emissive_strength)
      console.log('  emissiveStrength:', m.extensions.KHR_materials_emissive_strength.emissiveStrength);
    console.log('  baseColorTexture:', pbr.baseColorTexture ? 'yes' : 'no', ' emissiveTexture:', m.emissiveTexture ? 'yes' : 'no');
    console.log('');
  }
}
if (!seen.size) console.log(`No materials found for meshes matching "${filter}".`);
