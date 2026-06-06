import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { scene, camera } from './scene.js';
import { CONFIG } from './config.js';

// Rapier physics for the room. The building shell (floor, ceiling, walls) is a
// set of fixed colliders so the room stays standing, and a handful of reachable
// floor-standing props become dynamic rigid bodies that the player can knock
// around by walking into them. The player is a kinematic capsule driven to the
// camera each frame, which shoves the dynamic bodies on contact.
//
// Nothing is persisted: every page load rebuilds the world from the model, so a
// refresh returns all objects to their original positions.

let world = null;
let ready = false;
let playerBody = null;
const dynamics = []; // { body, pivot }

const _c = new THREE.Vector3();
const _s = new THREE.Vector3();
const _box = new THREE.Box3();

// Map a mesh name to a dynamic-group key. Every mesh sharing a key is welded
// into ONE rigid body (e.g. all GChair_* parts become a single chair), so
// multi-part props don't shatter into pieces.
function dynamicKey(name) {
  const n = (name || '').toLowerCase();
  if (n.startsWith('gchair') || n.startsWith('armrest')) return 'chair';
  if (n.startsWith('lamp')) return 'lamp';
  if (n.startsWith('plant') || n.startsWith('leaf')) return 'plant';
  if (n.startsWith('pc_') || n === 'pc') return 'pc';
  if (n.startsWith('ups')) return 'ups';
  return null;
}

export async function initPhysics(root) {
  await RAPIER.init();
  world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
  const f = CONFIG.FLOOR_Y;

  // ---- fixed room shell ----
  const fixedBox = (cx, cy, cz, hx, hy, hz) => {
    const rb = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(cx, cy, cz));
    world.createCollider(RAPIER.ColliderDesc.cuboid(hx, hy, hz).setFriction(0.9), rb);
  };
  fixedBox(0, f - 0.1, 0, 5, 0.1, 5); // floor
  fixedBox(0, f + 3.1, 0, 5, 0.1, 5); // ceiling
  fixedBox(0, f + 1.5, -4, 4.2, 1.6, 0.15); // back wall
  fixedBox(0, f + 1.5, 4, 4.2, 1.6, 0.15); // front wall
  fixedBox(-4, f + 1.5, 0, 0.15, 1.6, 4.2); // left wall
  fixedBox(4, f + 1.5, 0, 0.15, 1.6, 4.2); // right wall

  // ---- dynamic props (grouped by name) ----
  const groups = new Map();
  root.traverse((o) => {
    if (!o.isMesh) return;
    const key = dynamicKey(o.name);
    if (!key) return;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(o);
  });

  for (const meshes of groups.values()) {
    _box.makeEmpty();
    for (const m of meshes) _box.expandByObject(m);
    if (_box.isEmpty()) continue;
    _box.getCenter(_c);
    _box.getSize(_s);

    // Pivot at the group's centre; reparent the meshes preserving their world
    // transform, so driving the pivot from the body moves them rigidly.
    const pivot = new THREE.Group();
    pivot.position.copy(_c);
    scene.add(pivot);
    pivot.updateMatrixWorld(true);
    for (const m of meshes) pivot.attach(m);

    const rb = world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(_c.x, _c.y, _c.z)
        .setLinearDamping(0.4)
        .setAngularDamping(0.6),
    );
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(
        Math.max(_s.x / 2, 0.02),
        Math.max(_s.y / 2, 0.02),
        Math.max(_s.z / 2, 0.02),
      )
        .setFriction(0.9)
        .setRestitution(0.08),
      rb,
    );
    dynamics.push({ body: rb, pivot });
  }

  // ---- player: a kinematic capsule that shoves dynamic bodies on contact ----
  playerBody = world.createRigidBody(
    RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(
      camera.position.x,
      f + 0.9,
      camera.position.z,
    ),
  );
  world.createCollider(RAPIER.ColliderDesc.capsule(0.6, 0.32), playerBody); // halfHeight, radius

  ready = true;
}

export function updatePhysics(dt) {
  if (!ready) return;
  // Follow the camera in XZ; keep the capsule's feet near the floor.
  playerBody.setNextKinematicTranslation({
    x: camera.position.x,
    y: CONFIG.FLOOR_Y + 0.9,
    z: camera.position.z,
  });
  world.timestep = Math.min(dt, 1 / 30);
  world.step();
  for (const d of dynamics) {
    const t = d.body.translation();
    const r = d.body.rotation();
    d.pivot.position.set(t.x, t.y, t.z);
    d.pivot.quaternion.set(r.x, r.y, r.z, r.w);
  }
}
