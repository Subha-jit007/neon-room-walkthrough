import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { CONFIG } from './config.js';

/* ---- renderer ---- */
export const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

export const canvas = renderer.domElement;

/* ---- scene / camera ---- */
export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05070c);
scene.fog = new THREE.FogExp2(0x05070c, 0.018);

export const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.04, 300);
camera.rotation.order = 'YXZ';
camera.position.set(CONFIG.SPAWN.x, CONFIG.FLOOR_Y + CONFIG.EYE_HEIGHT, CONFIG.SPAWN.z);

/* ---- lights (the model's emissive materials carry the neon; these light surfaces) ---- */
scene.add(new THREE.AmbientLight(0x3a4663, 0.55));
scene.add(new THREE.HemisphereLight(0x5d6f9c, 0x0a0b12, 0.65));

const key = new THREE.DirectionalLight(0xfff0d8, 0.55);
key.position.set(2, 6, 3);
scene.add(key);

const warm = new THREE.PointLight(0xffd9a8, 14, 9, 2.0);
warm.position.set(0, 2.6, 0);
scene.add(warm);

const acc1 = new THREE.PointLight(0x3fa0ff, 10, 8, 2.0);
acc1.position.set(-3, 1.8, -2.5);
scene.add(acc1);

const acc2 = new THREE.PointLight(0xff3ea5, 7, 7, 2.0);
acc2.position.set(3, 1.6, 3.0);
scene.add(acc2);

/* ---- post-processing: bloom for the neon ---- */
export const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

// UnrealBloomPass(resolution, strength, radius, threshold)
export const bloom = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.6,
  0.55,
  0.85,
);
composer.addPass(bloom);
composer.addPass(new OutputPass());

/* ---- helpers ---- */
export function attachRenderer(parent) {
  parent.appendChild(canvas);
}

export function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
}
