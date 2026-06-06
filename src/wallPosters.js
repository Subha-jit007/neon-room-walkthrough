import * as THREE from 'three';
import { framedPiece } from './wallArt.js';

// Framed image posters hung on the left wall (X = -4, facing +X into the room)
// as a gallery around the untouched Spider-Man poster (baked into the model at
// Z = -0.8). Each poster is sized to its own image aspect so nothing is
// stretched, and the vertical centres zig-zag low / high for a balanced rhythm.

const texLoader = new THREE.TextureLoader();
function imageTexture(file) {
  const t = texLoader.load(`${import.meta.env.BASE_URL}posters/${file}`);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export function createWallPosters() {
  const grp = new THREE.Group();
  // [file, aspect (w/h), height, y (centre), z]
  // Around Spider-Man (Z=-0.8, hung high) the rhythm reads: low, [high], low, high.
  const pieces = [
    ['tony-stark.jpg', 736 / 1308, 1.4, 1.55, -2.3], // tall, hung low
    ['born-to-die.jpg', 736 / 1308, 1.4, 1.55, 0.75], // tall, hung low
    ['stay-trippy.jpg', 669 / 981, 0.98, 2.05, 2.15], // smaller, hung high
  ];
  for (const [file, ar, h, y, z] of pieces) {
    const p = framedPiece(imageTexture(file), h * ar, h);
    p.rotation.y = Math.PI / 2; // local +Z -> world +X (faces the room)
    p.position.set(-3.88, y, z);
    grp.add(p);
  }
  return grp;
}
