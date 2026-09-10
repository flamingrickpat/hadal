/**
 * Reviewer's independent logic probe for WI-03d2: re-derives the section 52
 * invariants from the production modules (WI-02b renderer + ForegroundPass)
 * with my own assertions, without reusing the implementer's test file.
 *
 * Question: do the presentation passes behave as the work item claims —
 * partial anatomy only where a view is given, true parallax factors, a
 * read-only renderer (sim state untouched), and the crossing classification
 * — and is the "never a clean full-body view" floor a consequence of the
 * body outspanning the view?
 *
 * Run from the repo root:
 *   npx vite-node agents/tasks/hadalv2.execute_leaf.WI-03d2.__item_WI-03d2.__attempt_0001/scratch/reviewer/tier4-logic/probe.ts
 */
import * as THREE from 'three';
import { Creature } from '../../../../../../src/creatures/Creature';
import { WorldSignalBus } from '../../../../../../src/creatures/senses';
import { bodyExtent } from '../../../../../../src/creatures/CreatureDef';
import { createRng } from '../../../../../../src/util/rng';
import { vec2 } from '../../../../../../src/util/math';
import { bandProfileAtDepth } from '../../../../../../src/render/band';
import {
  CreatureRenderer,
  isCrossingPresence,
  CROSSING_PRESENCE_Z,
} from '../../../../../../src/render/creatureRender';
import { ForegroundPass } from '../../../../../../src/render/foreground';
import {
  CAMERA_VIEW_WIDTH,
  PLAYER_PLANE_Z,
} from '../../../../../../src/game/constants';
import { TIER4_CREATURES } from '../../../../../../src/content/secret/hiddenCreatures';

const profile = bandProfileAtDepth(9000);
const HALF_X = CAMERA_VIEW_WIDTH / 2;
const HALF_Y = (CAMERA_VIEW_WIDTH * 9) / 16 / 2;

let failures = 0;
function expect(cond: boolean, name: string, detail = ''): void {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
  if (!cond) failures += 1;
}

function realizedCount(renderer: CreatureRenderer, c: Creature): { realized: number; nodes: number } {
  const v = renderer.visuals.get(c)!;
  const arr = (v as unknown as { bodyGeom: THREE.BufferGeometry }).bodyGeom.attributes.position!.array as Float32Array;
  const n = arr.length / 6;
  let realized = 0;
  for (let i = 0; i < n; i += 1) {
    const dx = arr[i * 6]! - arr[i * 6 + 3]!;
    const dy = arr[i * 6 + 1]! - arr[i * 6 + 4]!;
    if (Math.abs(dx) + Math.abs(dy) > 1) realized += 1;
  }
  return { realized, nodes: n };
}

// --- 1: default (no view) keeps the legacy full-realization behavior ------
{
  const scene = new THREE.Scene();
  const r = new CreatureRenderer(scene);
  const c = new Creature(TIER4_CREATURES['T-23']!, vec2(0, 0), new WorldSignalBus(), createRng(3));
  r.update([c], 0.4, profile); // no view
  const { realized, nodes } = realizedCount(r, c);
  expect(realized === nodes, 'no view -> every spine node realized (legacy behavior kept)', `${realized}/${nodes}`);
  const v = r.visuals.get(c)!;
  expect(v.group.position.x === 0 && v.group.position.y === 0, 'no view -> group at the true simulated position');
}

// --- 2: partial anatomy unrealizes nodes beyond view + margin -------------
{
  const scene = new THREE.Scene();
  const r = new CreatureRenderer(scene);
  const view = { center: vec2(0, 0), half: { x: HALF_X, y: HALF_Y } };
  // Far outside the view IN PROJECTED space: the crossing presence is drawn
  // at center + 0.35*(world-center), so world x=20000 projects to 7000 —
  // well past view+margin (1150) even for its nearest body node.
  const c = new Creature(TIER4_CREATURES['T-23']!, vec2(20000, 0), new WorldSignalBus(), createRng(3));
  c.velocity = vec2(0, 0);
  r.update([c], 0.4, profile, view);
  const { realized, nodes } = realizedCount(r, c);
  expect(realized === 0, 'body far outside the view -> nothing realized', `${realized}/${nodes}`);
  const v = r.visuals.get(c)!;
  expect(v.headMesh.visible === false, 'head hidden when its node is outside view+margin');

  // Same creature at the view center: at least the central nodes realize.
  c.position = vec2(0, 0);
  r.update([c], 0.5, profile, view);
  const mid = realizedCount(r, c);
  expect(mid.realized >= 1 && mid.realized < mid.nodes, 'body at view center -> central nodes realized, the rest of the flank not', `${mid.realized}/${mid.nodes}`);
}

// --- 3: true parallax on the crossing layer, read-only on the sim ---------
{
  const scene = new THREE.Scene();
  const r = new CreatureRenderer(scene);
  const center = vec2(500, 250);
  const view = { center, half: { x: HALF_X, y: HALF_Y } };
  const c = new Creature(TIER4_CREATURES['T-23']!, vec2(1200, -700), new WorldSignalBus(), createRng(3));
  r.update([c], 0.4, profile, view);
  const v = r.visuals.get(c)!;
  const wantX = center.x + (c.position.x - center.x) * 0.35; // independent constant
  const wantY = center.y + (c.position.y - center.y) * 0.35;
  expect(Math.abs(v.group.position.x - wantX) < 1e-9 && Math.abs(v.group.position.y - wantY) < 1e-9,
    'apparent position = center + 0.35 * (world - center)', `got (${v.group.position.x}, ${v.group.position.y}) want (${wantX}, ${wantY})`);
  expect(v.group.position.z === CROSSING_PRESENCE_Z && CROSSING_PRESENCE_Z < 0 && CROSSING_PRESENCE_Z < PLAYER_PLANE_Z,
    'crossing layer behind playable plane and terrain', `z=${v.group.position.z}`);
  const before = { x: c.position.x, y: c.position.y };
  r.update([c], 0.7, profile, view); // another frame must not move the sim state
  expect(c.position.x === before.x && c.position.y === before.y, 'renderer does not write back into the sim (request §30)');
}

// --- 4: classification is exactly the colossal non-targetable class -------
{
  const cls: [string, boolean][] = [
    ['T-19', false], ['T-20', false], ['T-22', false], ['T-23', true], ['T-25', false],
  ];
  for (const [id, want] of cls) {
    const def = TIER4_CREATURES[id]!;
    expect(isCrossingPresence(def) === want, `${id} crossing classification`, `want ${want}, span ${bodyExtent(def).toFixed(0)}`);
  }
  expect(bodyExtent(TIER4_CREATURES['T-23']!) > 2 * CAMERA_VIEW_WIDTH,
    'the crossing body outspans the view by design (the no-clean-view floor is geometric)',
    `span ${bodyExtent(TIER4_CREATURES['T-23']!).toFixed(0)} vs view ${CAMERA_VIEW_WIDTH}`);
}

// --- 5: foreground pass — 1.4x camera motion, temporary by construction ---
{
  const scene = new THREE.Scene();
  const fg = new ForegroundPass(scene);
  expect(fg.slabs.length >= 4 && fg.slabs.length <= 12, 'a small fixed pool of occluders', `slabs=${fg.slabs.length}`);
  for (const s of fg.slabs) expect(s.position.z === 14 && 14 > PLAYER_PLANE_Z, 'slab in front of the playable plane', `z=${s.position.z}`);
  const slab = fg.slabs[0]!;
  fg.update(vec2(1000, 0));
  const off1 = slab.position.x - 1000;
  fg.update(vec2(1100, 0));
  const off2 = slab.position.x - 1100;
  expect(Math.abs((off2 - off1) + 140) < 1e-6,
    'screen offset moves at 1.4x the camera (faster than the world plane)', `offset change=${(off2 - off1).toFixed(3)} for 100 camera (want -140)`);
  // Recover the reference (last camera was 1100) and check temporary occlusion.
  const qx = (slab.position.x + 0.4 * 1100) / 1.4;
  fg.update(vec2(qx, 0));
  const atRef = Math.abs(slab.position.x - qx);
  fg.update(vec2(qx + 4000, 0));
  const farOff = Math.abs(slab.position.x - (qx + 4000));
  expect(atRef < 1, 'at the camera = reference the slab sits at view center (inside the view)', `offset=${atRef.toFixed(1)}`);
  expect(farOff > HALF_X + 300, 'far from the reference the slab clears the view (occlusion is temporary)', `offset=${farOff.toFixed(0)}`);
  const n0 = scene.children.length;
  for (let i = 0; i < 120; i += 1) fg.update(vec2(i * 3, i));
  expect(scene.children.length === n0, 'no per-frame scene growth over 120 updates');
}

console.log(failures === 0 ? '\nALL REVIEWER LOGIC CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
