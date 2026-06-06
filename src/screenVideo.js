import * as THREE from 'three';
import { CONFIG } from './config.js';

// Plays a looping video on the monitor screen, with audio.
//
// Mobile notes:
// - Autoplay is only allowed when the video is muted + playsinline, so we start
//   muted and unmute on the first user gesture (tap / click / key).
// - iOS Safari will NOT decode a `display:none` (or 0x0) video into a WebGL
//   texture, so the element is kept in the layout as a 1px, transparent,
//   off-screen node instead of being hidden.
export function createScreenMaterial() {
  const video = document.createElement('video');
  video.src = CONFIG.SCREEN_VIDEO;
  video.loop = true;
  video.muted = true; // required for autoplay everywhere; unmuted on first gesture
  video.defaultMuted = true;
  video.autoplay = true;
  video.playsInline = true;
  video.preload = 'auto';
  // Some mobile browsers only honour the attribute form of these.
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  video.setAttribute('autoplay', '');

  // Visible to the decoder but not to the user.
  Object.assign(video.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '1px',
    height: '1px',
    opacity: '0.01',
    pointerEvents: 'none',
    zIndex: '-1',
  });
  document.body.appendChild(video);
  video.load();

  // Kick off muted playback immediately (allowed without a gesture).
  video.play().catch(() => {});

  // Turn the sound on at the first user gesture. The `muted` content attribute
  // (needed for mobile autoplay) keeps some browsers muted even after setting
  // .muted = false, so we remove it here and retry on each gesture until it
  // sticks.
  let soundOn = false;
  const detach = () => {
    window.removeEventListener('pointerdown', enableSound);
    window.removeEventListener('touchstart', enableSound);
    window.removeEventListener('click', enableSound);
    window.removeEventListener('keydown', enableSound);
  };
  function enableSound() {
    if (soundOn) return;
    video.removeAttribute('muted');
    video.muted = false;
    video.volume = 1.0;
    Promise.resolve(video.play())
      .then(() => {
        if (!video.muted) {
          soundOn = true;
          detach();
        }
      })
      .catch(() => {
        /* keep listening; the next gesture will retry */
      });
  }
  window.addEventListener('pointerdown', enableSound, { passive: true });
  window.addEventListener('touchstart', enableSound, { passive: true });
  window.addEventListener('click', enableSound, { passive: true });
  window.addEventListener('keydown', enableSound);

  const texture = new THREE.VideoTexture(video);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false; // match glTF UV origin (top-left)

  return new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
    toneMapped: false, // keep the screen bright/vivid like a real display
  });
}
