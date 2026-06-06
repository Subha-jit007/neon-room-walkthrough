# Neon Room — Walkthrough

A first-person, browser-based walkthrough of a neon-lit room modeled in Blender,
rendered with [Three.js](https://threejs.org/). Move through the interior with the
keyboard on desktop or the on-screen pad on mobile, with bloom post-processing
giving the neon its glow.

## Controls

| Action | Desktop | Mobile |
| ------ | ------- | ------ |
| Move   | `W` `A` `S` `D` / arrow keys | on-screen D-pad |
| Run    | hold `Shift` | hold the `RUN` button |
| Look   | click + drag | drag anywhere on the view |
| Settings / Fullscreen | top-right buttons | top-right buttons |

The **Settings** panel (gear icon) tunes exposure, neon-glow (bloom) strength,
and walk speed, and can reset the view to the spawn point.

## Project structure

```
neon-room-walkthrough/
├─ index.html          # markup: loading screen, dropzone fallback, HUD
├─ vite.config.js      # build config (relative base, dist output)
├─ vercel.json         # Vercel build + caching config
├─ public/
│  └─ NeonRoom.glb     # the Blender room (served at /NeonRoom.glb)
└─ src/
   ├─ main.js          # entry point — wires modules + render loop
   ├─ config.js        # tunable constants + runtime settings
   ├─ state.js         # shared mutable runtime state (look, bounds, ready)
   ├─ scene.js         # renderer, scene, camera, lights, bloom composer
   ├─ controls.js      # keyboard / pad / drag-look input + movement
   ├─ loader.js        # GLB loading, material fixup, collision bounds
   ├─ ui.js            # settings panel, fullscreen, file/drag-drop fallback
   └─ style.css        # all UI styling
```

## Develop

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # production build into dist/
npm run preview  # preview the production build
```

## Deploy

The project is configured for [Vercel](https://vercel.com/) (Vite framework
preset). Pushing to the connected GitHub repository triggers a production
deploy, or run `vercel --prod` locally.

## Replacing the model

Drop a new `NeonRoom.glb` into `public/` (keep the filename), or use the
in-app dropzone / file picker that appears if the bundled model fails to load.
Tune the spawn point, eye height, wall margin, and speeds in
[`src/config.js`](src/config.js).
