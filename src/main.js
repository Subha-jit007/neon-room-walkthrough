import './style.css';
import * as THREE from 'three';
import { CONFIG } from './config.js';
import { attachRenderer, onResize, composer } from './scene.js';
import { initControls, updateMovement } from './controls.js';
import { initUI } from './ui.js';
import { loadModel } from './loader.js';

// Wire everything together.
attachRenderer(document.getElementById('app'));
initControls();
initUI();

// Render loop.
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  updateMovement(Math.min(clock.getDelta(), 0.05)); // cap dt to avoid jumps after tab-switch
  composer.render();
}
animate();

window.addEventListener('resize', onResize);

// Load the room.
loadModel(CONFIG.MODEL_URL, false);
