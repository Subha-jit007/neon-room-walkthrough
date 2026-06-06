import { CONFIG, settings, clamp } from './config.js';
import { state } from './state.js';
import { renderer, bloom, camera } from './scene.js';
import { applyLook } from './controls.js';
import { loadModel } from './loader.js';

export function initUI() {
  initSettingsPanel();
  initFullscreen();
  initSliders();
  initResetButton();
  initFileFallback();
}

/* ---- settings panel toggle ---- */
function initSettingsPanel() {
  const gear = document.getElementById('gear');
  const panel = document.getElementById('settings');
  gear.addEventListener('click', () => panel.classList.toggle('show'));
}

/* ---- fullscreen ---- */
function initFullscreen() {
  document.getElementById('fs').addEventListener('click', () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  });
}

/* ---- display + speed sliders ---- */
function initSliders() {
  const exp = document.getElementById('exp');
  const bl = document.getElementById('bloom');
  const spd = document.getElementById('speed');

  exp.addEventListener('input', () => {
    renderer.toneMappingExposure = +exp.value;
    document.getElementById('vExp').textContent = (+exp.value).toFixed(2);
  });
  bl.addEventListener('input', () => {
    bloom.strength = +bl.value;
    document.getElementById('vBloom').textContent = (+bl.value).toFixed(2);
  });
  spd.addEventListener('input', () => {
    settings.moveSpeed = +spd.value;
    document.getElementById('vSpeed').textContent = (+spd.value).toFixed(1);
  });
}

/* ---- reset view to spawn ---- */
function initResetButton() {
  document.getElementById('reset').addEventListener('click', () => {
    camera.position.set(
      clamp(CONFIG.SPAWN.x, state.bounds.minX, state.bounds.maxX),
      CONFIG.FLOOR_Y + CONFIG.EYE_HEIGHT,
      clamp(CONFIG.SPAWN.z, state.bounds.minZ, state.bounds.maxZ),
    );
    state.yaw = CONFIG.SPAWN.yaw;
    state.pitch = 0;
    applyLook();
  });
}

/* ---- file picker + drag/drop (fallback if the bundled GLB fails to load) ---- */
function initFileFallback() {
  const fileInput = document.getElementById('file');
  const dzcard = document.getElementById('dzcard');

  fileInput.addEventListener('change', (e) => {
    const f = e.target.files[0];
    if (f) loadModel(URL.createObjectURL(f), true);
  });

  ['dragenter', 'dragover'].forEach((ev) =>
    document.addEventListener(ev, (e) => {
      e.preventDefault();
      dzcard.classList.add('hot');
    }),
  );
  ['dragleave', 'drop'].forEach((ev) =>
    document.addEventListener(ev, (e) => {
      e.preventDefault();
      if (ev !== 'drop') dzcard.classList.remove('hot');
    }),
  );
  document.addEventListener('drop', (e) => {
    dzcard.classList.remove('hot');
    const f = [...(e.dataTransfer?.files || [])].find((x) => /\.(glb|gltf)$/i.test(x.name));
    if (f) loadModel(URL.createObjectURL(f), true);
  });
}
