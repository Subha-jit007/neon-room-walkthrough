// Central configuration for the walkthrough.
// Tweak spawn point, eye height, speeds, and look sensitivity here.

export const CONFIG = {
  // The model lives in /public and is served at the site root. A relative URL
  // keeps it working under any base path or inside an <iframe>.
  MODEL_URL: `${import.meta.env.BASE_URL}NeonRoom.glb`,

  EYE_HEIGHT: 1.6, // camera height above the floor (m)
  FLOOR_Y: 0.0, // floor level in the model (Blender Z=0 -> three Y=0)
  WALL_MARGIN: 0.55, // keep the camera this far inside the outer walls (m)

  SPAWN: { x: 0, z: 3.0, yaw: 0 }, // start near the door, looking into the room

  // Object-name prefixes (case-insensitive) to strip from the model on load.
  // 'Rug' = the pink mat in the middle of the floor (Rug_Main + parts).
  // 'Bed'/'Mattress'/'Headboard'/'Neon_Bed' = the big bed beyond the rug.
  HIDE_OBJECTS: ['Rug', 'Bed', 'Mattress', 'Headboard', 'Neon_Bed'],

  // The floor's 'Floor_Wood' material ships as flat white. Tint it a warm
  // wood brown so it reads as a wooden floor. Set to null to leave untinted.
  FLOOR_COLOR: 0x6b4f3a,

  RUN_MULT: 1.9, // walk-speed multiplier while running
  LOOK_DRAG: 0.0042, // mouse drag look sensitivity
  LOOK_TOUCH: 0.005, // touch drag look sensitivity
  PITCH_LIMIT: 1.45, // max up/down look angle (rad)
};

// Runtime-mutable settings, adjusted live by the UI sliders.
export const settings = {
  moveSpeed: 2.8, // m/s
};

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
