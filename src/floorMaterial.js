import * as THREE from 'three';
import { CONFIG } from './config.js';

// A lit chessboard floor. Uses a standard (PBR) material so it responds to the
// room lighting, with the checker pattern injected from world XZ position via
// onBeforeCompile — so it's independent of the model's UVs and always aligned
// to a clean grid.
export function createChessFloorMaterial() {
  const { size, light, dark } = CONFIG.FLOOR_CHESS;
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.55,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uSquare = { value: size };
    shader.uniforms.uLight = { value: new THREE.Color(light) };
    shader.uniforms.uDark = { value: new THREE.Color(dark) };

    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWorldPos;')
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\n  vWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;',
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying vec3 vWorldPos;\nuniform float uSquare;\nuniform vec3 uLight;\nuniform vec3 uDark;',
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
         vec2 cell = floor(vWorldPos.xz / uSquare);
         float check = mod(cell.x + cell.y, 2.0);
         diffuseColor.rgb *= mix(uDark, uLight, check);
        `,
      );
  };

  return mat;
}
