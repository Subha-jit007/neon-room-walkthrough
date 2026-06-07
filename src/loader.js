import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CONFIG, clamp } from './config.js';
import { state } from './state.js';
import { scene, camera } from './scene.js';
import { applyLook } from './controls.js';
import { createGalaxyMaterial } from './skyMaterial.js';
import { createChessFloorMaterial } from './floorMaterial.js';
import { createScreenMaterial } from './screenVideo.js';
import { createWallArt, createFlowerPaintings } from './wallArt.js';
import { createWallPosters } from './wallPosters.js';
import { createSwordDisplay } from './swords.js';
import { createDeskGear } from './gear.js';
import { initPhysics } from './physics.js';

const loader = new GLTFLoader();

const statusEl = document.getElementById('status');
const loadingEl = document.getElementById('loading');
const dropEl = document.getElementById('drop');

function setStatus(text) {
  statusEl.textContent = text;
}

function hideLoading() {
  loadingEl.style.opacity = '0';
  setTimeout(() => {
    loadingEl.style.display = 'none';
  }, 650);
}

function showDrop() {
  hideLoading();
  dropEl.classList.add('show');
}

/**
 * Load a GLB/GLTF model into the scene.
 * @param {string} url      model URL (or object URL for a dropped file)
 * @param {boolean} isBlob  true when loading a user-supplied file
 */
export function loadModel(url, isBlob = false) {
  setStatus('Loading room…');
  loader.load(
    url,
    (gltf) => onLoaded(gltf.scene),
    (e) => {
      if (e.total) setStatus(`Loading room… ${Math.round((e.loaded / e.total) * 100)}%`);
    },
    (err) => {
      console.warn('GLB load failed:', err);
      if (!isBlob) showDrop();
      else setStatus('Could not read that file.');
    },
  );
}

const hidePrefixes = CONFIG.HIDE_OBJECTS.map((p) => p.toLowerCase());
const hideExact = (CONFIG.HIDE_EXACT || []).map((p) => p.toLowerCase());
const shouldHide = (name) => {
  const n = (name || '').toLowerCase();
  return hidePrefixes.some((p) => n.startsWith(p)) || hideExact.includes(n);
};

function onLoaded(root) {
  // Make the shell solid from the inside, strip emissive glow, and collect
  // any unwanted objects (e.g. the floor rug) to remove afterwards.
  const removeList = [];
  root.traverse((o) => {
    if (!o.isMesh) return;
    if (shouldHide(o.name)) {
      removeList.push(o);
      return;
    }
    o.castShadow = false;
    o.receiveShadow = false;

    // Ceiling: replace with a procedural galaxy "sky" so it glows like a real sky.
    if ((o.name || '').toLowerCase().startsWith('ceiling')) {
      (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m?.dispose?.());
      o.material = createGalaxyMaterial();
      return;
    }

    // Floor: replace with a lit chessboard pattern.
    if ((o.name || '').toLowerCase().startsWith('floor')) {
      (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m?.dispose?.());
      o.material = createChessFloorMaterial();
      return;
    }

    // Monitor: play the video (with audio) on the screen.
    if (CONFIG.SCREEN_VIDEO && (o.name || '').toLowerCase() === 'anime_screen') {
      (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m?.dispose?.());
      o.material = createScreenMaterial();
      return;
    }

    const mats = Array.isArray(o.material) ? o.material : [o.material];
    mats.forEach((m) => {
      if (!m) return;
      m.side = THREE.DoubleSide; // no see-through walls
      // Neon removed: switch off any emissive glow baked into the model.
      if (m.emissive) {
        m.emissive.setRGB(0, 0, 0);
        m.emissiveIntensity = 0;
        if (m.emissiveMap) m.emissiveMap = null;
        m.needsUpdate = true;
      }
    });
  });

  // Remove collected objects after traversal (don't mutate the tree mid-walk).
  removeList.forEach((o) => {
    o.removeFromParent();
    o.geometry?.dispose?.();
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    mats.forEach((m) => m?.dispose?.());
  });

  scene.add(root);

  // Hang a Japanese ukiyo-e print on the otherwise-bare right wall (X = +4),
  // flanked by two smaller Japanese flower paintings (peony + iris).
  scene.add(createWallArt());
  scene.add(createFlowerPaintings());

  // Framed image-poster gallery on the left wall, beside the original
  // Spider-Man poster (which is left untouched).
  scene.add(createWallPosters());

  // Mount a detailed daishō (katana + wakizashi) on the door/front wall.
  scene.add(createSwordDisplay());

  // Detailed desk gear: RGB keyboard, mouse, ring light, bottle, and a headset
  // hung on the wall to the right of the monitor.
  scene.add(createDeskGear());

  // Derive interior movement bounds from the model's bounding box.
  const box = new THREE.Box3().setFromObject(root);
  state.bounds.minX = box.min.x + CONFIG.WALL_MARGIN;
  state.bounds.maxX = box.max.x - CONFIG.WALL_MARGIN;
  state.bounds.minZ = box.min.z + CONFIG.WALL_MARGIN;
  state.bounds.maxZ = box.max.z - CONFIG.WALL_MARGIN;

  // Spawn safely inside the room.
  camera.position.x = clamp(CONFIG.SPAWN.x, state.bounds.minX, state.bounds.maxX);
  camera.position.z = clamp(CONFIG.SPAWN.z, state.bounds.minZ, state.bounds.maxZ);
  camera.position.y = CONFIG.FLOOR_Y + CONFIG.EYE_HEIGHT;
  state.yaw = CONFIG.SPAWN.yaw;
  state.pitch = 0;
  applyLook();

  dropEl.classList.remove('show');
  hideLoading();
  state.started = true;

  // Bring the room to life with Rapier physics (async WASM init). Built last so
  // the movement bounds above are derived from the full, un-reparented model.
  initPhysics(root);
}
