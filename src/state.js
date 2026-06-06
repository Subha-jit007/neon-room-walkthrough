import { CONFIG } from './config.js';

// Shared mutable runtime state, read/written across modules.
export const state = {
  started: false, // true once the model is loaded and ready to explore
  yaw: CONFIG.SPAWN.yaw, // look rotation around Y (left/right)
  pitch: 0, // look rotation around X (up/down)
  // Interior movement bounds, recomputed from the model's bounding box on load.
  bounds: { minX: -3, maxX: 3, minZ: -3, maxZ: 3 },
};
