import * as THREE from 'three';

// Procedural blue-themed galaxy/nebula for the ceiling. Resolution-independent
// (it's a shader, not an image) and gently animated: drifting clouds + twinkling
// stars. Mapped by world XZ so it covers the whole ceiling regardless of UVs.

const vertexShader = /* glsl */ `
  varying vec2 vP;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vP = wp.xz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec2 vP;
  uniform float uTime;

  float hash(vec2 p){
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }
  float fbm(vec2 p){
    float v = 0.0, amp = 0.5;
    mat2 rot = mat2(0.80, -0.60, 0.60, 0.80);
    for (int i = 0; i < 6; i++) {
      v += amp * noise(p);
      p = rot * p * 2.0 + 7.0;
      amp *= 0.5;
    }
    return v;
  }
  // one layer of point stars on a grid, with per-star twinkle
  float starLayer(vec2 uv, float density, float sharp){
    vec2 g = uv * density;
    vec2 id = floor(g);
    vec2 f = fract(g) - 0.5;
    float h = hash(id);
    float present = step(0.93, h);
    float core = smoothstep(0.45, 0.0, length(f));
    float tw = 0.5 + 0.5 * sin(uTime * 2.5 + h * 6.2831);
    return present * pow(core, sharp) * tw;
  }

  void main(){
    // map world XZ (room spans ~ -4..4) into 0..1
    vec2 uv = vP * 0.125 + 0.5;
    float t = uTime * 0.015;

    // domain-warped fbm for soft nebula clouds
    vec2 p = uv * 3.0;
    vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t));
    float n = fbm(p + 2.2 * q);

    vec3 deep   = vec3(0.01, 0.015, 0.05);
    vec3 blue   = vec3(0.04, 0.16, 0.45);
    vec3 azure  = vec3(0.05, 0.35, 0.70);
    vec3 indigo = vec3(0.15, 0.08, 0.45);

    vec3 col = deep;
    col = mix(col, indigo, smoothstep(0.25, 0.75, q.x) * 0.5);
    col = mix(col, blue,   smoothstep(0.30, 0.75, n));
    col = mix(col, azure,  smoothstep(0.55, 0.95, n) * 0.8);
    col += blue  * pow(n, 3.0) * 0.7;                 // glow in dense clouds
    col += azure * pow(max(q.y, 0.0), 4.0) * 0.3;

    // layered stars (different densities/sizes for depth)
    float s = 0.0;
    s += starLayer(uv + 0.00,  90.0, 1.2);
    s += starLayer(uv + 4.37, 150.0, 1.8) * 0.8;
    s += starLayer(uv + 9.11, 240.0, 2.4) * 0.6;
    col += vec3(0.75, 0.85, 1.0) * s;

    // gentle vignette toward the room edges for depth
    float vig = smoothstep(1.1, 0.2, length(uv - 0.5));
    col *= mix(0.65, 1.0, vig);

    gl_FragColor = vec4(col, 1.0);
  }
`;

let material = null;

export function createGalaxyMaterial() {
  material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader,
    fragmentShader,
    side: THREE.DoubleSide,
  });
  return material;
}

export function updateGalaxy(elapsed) {
  if (material) material.uniforms.uTime.value = elapsed;
}
