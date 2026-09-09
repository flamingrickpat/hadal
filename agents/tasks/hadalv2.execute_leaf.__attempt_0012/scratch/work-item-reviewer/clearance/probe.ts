// Reviewer clearance probe (WI-03b2): does the t31-twilight spawn sit in open
// water, or is it inside a solid that the terrain resolve will not push it
// out of? Uses the REAL terrain builder and the REAL simulation — no mocks.
import { buildTerrain } from '../../../../../../src/world/terrain';
import { MACRO_WORLD } from '../../../../../../src/world/worldData';
import { createSimulation, makeSimWorld, emptyInput } from '../../../../../../src/sim/Simulation';

// The twilight landmark slab (worldData.ts: slab('twilight-landmark', 15500, -6800, 2200, 1200)).
const LANDMARK = { x0: 15500, x1: 17700, y0: -6800, y1: -5600 };
const inLandmark = (p: { x: number; y: number }) =>
  p.x >= LANDMARK.x0 && p.x <= LANDMARK.x1 && p.y >= LANDMARK.y0 && p.y <= LANDMARK.y1;

// 1) Pure collision check: does the resolve push a r=12 circle at the spawn out?
const terrain = buildTerrain(MACRO_WORLD.flatMap((c) => c.terrain));
const spawn = { x: 17000, y: -5700 };
console.log('spawn point (17000,-5700) inside landmark slab?', inLandmark(spawn));
const resolved = { x: spawn.x, y: spawn.y };
terrain.resolveCircle(resolved, 12);
console.log(`resolveCircle(spawn, r=12) -> (${resolved.x.toFixed(1)}, ${resolved.y.toFixed(1)}); moved=${Math.hypot(resolved.x - spawn.x, resolved.y - spawn.y) > 1e-6}`);

// 2) Live sim: place the player at the creature, step, and track where it goes.
const sim = createSimulation(makeSimWorld(), 1);
const t31s = sim.creatures.filter((c) => c.def.id === 'T-31');
console.log(`T-31 instances: ${t31s.length} at ${t31s.map((c) => `(${c.position.x.toFixed(0)},${c.position.y.toFixed(0)})`).join(' ')}`);
const t31 = t31s.find((c) => inLandmark(c.position));
console.log('found a T-31 spawned inside the landmark?', t31 !== undefined);
if (t31) {
  sim.teleportTo(17000, 5700); // depth = -y
  const report = (label: string) =>
    console.log(`  ${label}: t31=(${t31.position.x.toFixed(0)}, ${t31.position.y.toFixed(0)}) insideLandmark=${inLandmark(t31.position)} active=${t31.active}`);
  report('t=0');
  for (let s = 0; s < 220; s += 1) {
    for (let k = 0; k < 60; k += 1) sim.step(emptyInput(), 1 / 60);
    if (s === 50 || s === 110 || s === 160 || s === 219) report(`t=${s + 1}s`);
  }
  console.log(`after 220s: still inside the landmark slab? ${inLandmark(t31.position)}`);
  console.log(`x-range over time shows it box-walking at the left wall (x~${LANDMARK.x0 + 12}) if trapped`);
}
