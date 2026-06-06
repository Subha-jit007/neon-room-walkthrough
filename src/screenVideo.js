import * as THREE from 'three';
import { CONFIG } from './config.js';

// Plays a looping video on the monitor screen, with audio. Browsers block
// autoplay-with-sound until a user gesture, so we start muted (allowed) and
// unmute on the first interaction (pointer / key / touch).
export function createScreenMaterial() {
  const video = document.createElement('video');
  video.src = CONFIG.SCREEN_VIDEO;
  video.loop = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.setAttribute('webkit-playsinline', 'true');
  video.crossOrigin = 'anonymous';
  video.style.display = 'none';
  document.body.appendChild(video);

  const play = () => video.play();

  // Try with sound first; if blocked, play muted and unmute on first gesture.
  video.muted = false;
  play().catch(() => {
    video.muted = true;
    play().catch(() => {});
    const resume = () => {
      video.muted = false;
      play().catch(() => {});
      window.removeEventListener('pointerdown', resume);
      window.removeEventListener('keydown', resume);
      window.removeEventListener('touchstart', resume);
    };
    window.addEventListener('pointerdown', resume);
    window.addEventListener('keydown', resume);
    window.addEventListener('touchstart', resume);
  });

  const texture = new THREE.VideoTexture(video);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false; // match glTF UV origin (top-left)

  return new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
    toneMapped: false, // keep the screen bright/vivid like a real display
  });
}
