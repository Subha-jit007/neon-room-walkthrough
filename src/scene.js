import * as THREE from 'three';
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
scene.background = new THREE.Color(0x0a0e16);
scene.fog = new THREE.FogExp2(0x0a0e16, 0.012);

export const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.04, 300);
camera.rotation.order = 'YXZ';
camera.position.set(CONFIG.SPAWN.x, CONFIG.FLOOR_Y + CONFIG.EYE_HEIGHT, CONFIG.SPAWN.z);

/* ---- neutral, even lighting (neon removed) ---- */
scene.add(new THREE.AmbientLight(0xdfe7f0, 0.75));
scene.add(new THREE.HemisphereLight(0xc4d6ea, 0x2a2f3a, 0.85));

const key = new THREE.DirectionalLight(0xffffff, 0.9);
key.position.set(3, 8, 4);
scene.add(key);

const fill = new THREE.DirectionalLight(0xcdd9e6, 0.4);
fill.position.set(-4, 3, -3);
scene.add(fill);

/* ---- helpers ---- */
export function attachRenderer(parent) {
  parent.appendChild(canvas);
}

export function render() {
  renderer.render(scene, camera);
}

export function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
