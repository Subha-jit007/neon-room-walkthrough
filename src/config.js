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
  // P1_/P2_/P3_ are stray 2x2x2 boxes stacked at the room center (origin).
  // 'Rug' is the large pink/crimson floor mat (Rug_Main + its parts).
  // 'Plant_Neon' is the stray magenta neon ring at the plant base.
  // None of these are the wall posters (Poster1/2/3_*), which stay intact.
  HIDE_OBJECTS: ['P1_', 'P2_', 'P3_', 'Rug', 'Plant_Neon'],

  // The floor is rendered as a lit chessboard. `size` is the square edge in
  // metres (8x8 m floor with size 1 => an 8x8 board); light/dark are the
  // square colours.
  FLOOR_CHESS: { size: 1.0, light: 0xd5d8de, dark: 0x14161d },

  // Video played (with audio) on the monitor's Anime_Screen. Lives in /public.
  // Set to null to leave the screen as-is.
  SCREEN_VIDEO: `${import.meta.env.BASE_URL}screen.mp4`,

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
