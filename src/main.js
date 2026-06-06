import './style.css';
import * as THREE from 'three';
import { CONFIG } from './config.js';
import { attachRenderer, onResize, render } from './scene.js';
import { initControls, updateMovement } from './controls.js';
import { initUI } from './ui.js';
import { loadModel } from './loader.js';
import { updateGalaxy } from './skyMaterial.js';

// Wire everything together.
attachRenderer(document.getElementById('app'));
initControls();
initUI();

// Render loop.
const clock = new THREE.Clock();
let elapsed = 0;
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05); // cap dt to avoid jumps after tab-switch
  elapsed += dt;
  updateMovement(dt);
  updateGalaxy(elapsed); // animate the ceiling nebula (drift + twinkle)
  render();
}
animate();

window.addEventListener('resize', onResize);

// Load the room.
loadModel(CONFIG.MODEL_URL, false);
