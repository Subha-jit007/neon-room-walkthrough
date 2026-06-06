import * as THREE from 'three';
import { CONFIG, settings, clamp } from './config.js';
import { state } from './state.js';
import { camera, canvas } from './scene.js';

// Held input state.
const keys = {};
const btn = { f: false, b: false, l: false, r: false, run: false };

// Apply the current yaw/pitch to the camera (YXZ euler order).
export function applyLook() {
  camera.rotation.set(state.pitch, state.yaw, 0);
}

export function initControls() {
  applyLook();
  initKeyboard();
  initMovementPad();
  initDragLook();
}

/* ---- keyboard ---- */
function initKeyboard() {
  window.addEventListener(
    'keydown',
    (e) => {
      keys[e.code] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    },
    { passive: false },
  );
  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });
}

/* ---- on-screen movement pad (mobile) ---- */
function initMovementPad() {
  document.querySelectorAll('.pbtn').forEach((el) => {
    const dir = el.dataset.dir;
    const on = (e) => {
      e.preventDefault();
      btn[dir] = true;
      el.classList.add('on');
    };
    const off = (e) => {
      e.preventDefault();
      btn[dir] = false;
      el.classList.remove('on');
    };
    el.addEventListener('pointerdown', on);
    el.addEventListener('pointerup', off);
    el.addEventListener('pointerleave', off);
    el.addEventListener('pointercancel', off);
  });
}

/* ---- drag to look (mouse + touch; no pointer-lock so it works in iframes) ---- */
function initDragLook() {
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let pid = null;

  canvas.addEventListener('pointerdown', (e) => {
    dragging = true;
    pid = e.pointerId;
    lastX = e.clientX;
    lastY = e.clientY;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (_) {
      /* setPointerCapture can throw on some browsers; safe to ignore */
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!dragging || e.pointerId !== pid) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    const s = e.pointerType === 'touch' ? CONFIG.LOOK_TOUCH : CONFIG.LOOK_DRAG;
    state.yaw -= dx * s;
    state.pitch = clamp(state.pitch - dy * s, -CONFIG.PITCH_LIMIT, CONFIG.PITCH_LIMIT);
    applyLook();
  });

  const endDrag = (e) => {
    if (e.pointerId === pid) {
      dragging = false;
      pid = null;
    }
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}

/* ---- per-frame movement ---- */
const fwd = new THREE.Vector3();
const right = new THREE.Vector3();
const up = new THREE.Vector3(0, 1, 0);
const move = new THREE.Vector3();

export function updateMovement(dt) {
  if (!state.started) return;

  let f = 0;
  let s = 0;
  if (keys['KeyW'] || keys['ArrowUp'] || btn.f) f += 1;
  if (keys['KeyS'] || keys['ArrowDown'] || btn.b) f -= 1;
  if (keys['KeyA'] || keys['ArrowLeft'] || btn.l) s -= 1;
  if (keys['KeyD'] || keys['ArrowRight'] || btn.r) s += 1;
  if (!f && !s) return;

  // Move on the horizontal plane relative to where the camera is facing.
  camera.getWorldDirection(fwd);
  fwd.y = 0;
  fwd.normalize();
  right.crossVectors(fwd, up).normalize();

  move.set(0, 0, 0).addScaledVector(fwd, f).addScaledVector(right, s).normalize();

  const running = keys['ShiftLeft'] || keys['ShiftRight'] || btn.run;
  const sp = settings.moveSpeed * (running ? CONFIG.RUN_MULT : 1) * dt;
  camera.position.addScaledVector(move, sp);

  // Keep the camera inside the room and at eye height.
  camera.position.x = clamp(camera.position.x, state.bounds.minX, state.bounds.maxX);
  camera.position.z = clamp(camera.position.z, state.bounds.minZ, state.bounds.maxZ);
  camera.position.y = CONFIG.FLOOR_Y + CONFIG.EYE_HEIGHT;
}
