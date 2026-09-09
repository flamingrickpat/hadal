// Reviewer clearance probe — attempt 3 (WI-03b2 fix re-review).
// Question: after the implementer relocated t31-twilight to (18200,-5300) and
// added a spawn-clearance regression test, is the twilight drifter actually in
// open water (not box-walking a solid), and does the regression test's
// containment logic genuinely catch the original (17000,-5700) defect?
// Uses the REAL terrain builder + the REAL simulation — no mocks.
import { buildTerrain, type TerrainShapeDef } from '../../../../../../src/world/terrain';
import { MACRO_WORLD } from '../../../../../../src/world/worldData';
import { createSimulation, makeSimWorld, emptyInput } from '../../../../../../src/sim/Simulation';
import { TIER2_CREATURES } from '../../../../../../src/content/secret/hiddenCreatures';
import type { Vec2 } from '../../../../../../src/util/math';

const shapes: readonly TerrainShapeDef[] = MACRO_WORLD.flatMap((c) => c.terrain);
const closed = shapes.filter((s) => s.closed);

// Strict bounding-box containment in any closed slab (replicates the item's
// regression-test logic, but driven by me to both the new and the old point).
const trappedBy = (p: Vec2): string[] =>
  closed
    .filter((s) => {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const pt of s.points) {
        minX = Math.min(minX, pt.x); maxX = Math.max(maxX, pt.x);
        minY = Math.min(minY, pt.y); maxY = Math.max(maxY, pt.y);
      }
      return p.x > minX && p.x < maxX && p.y > minY && p.y < maxY;
    })
    .map((s) => s.id);

console.log('== static containment (all closed slabs, every chunk) ==');
console.log(`closed slabs: ${closed.length}`);
console.log(`NEW (18200,-5300) trapped in: [${trappedBy({ x: 18200, y: -5300 }).join(', ') || 'none'}]`);
console.log(`OLD (17000,-5700) trapped in: [${trappedBy({ x: 17000, y: -5700 }).join(', ') || 'none'}] (must be non-empty for the regression test to guard the original defect)`);

let badTier2 = 0;
for (const chunk of makeSimWorld().chunks) {
  for (const spawn of chunk.creatureSpawns ?? []) {
    if (TIER2_CREATURES[spawn.creature] === undefined) continue;
    const hits = trappedBy(spawn.position);
    if (hits.length > 0) { badTier2 += 1; console.log(`TIER-2 TRAPPED: ${spawn.id} (${spawn.position.x},${spawn.position.y}) in [${hits.join(', ')}]`); }
  }
}
console.log(`tier-2 spawns strictly inside a closed slab: ${badTier2}`);

// Real terrain resolve: does a r=12 circle at the NEW spawn get pushed out?
const terrain = buildTerrain(shapes);
const np = { x: 18200, y: -5300 };
terrain.resolveCircle(np, 12);
console.log(`resolveCircle(new spawn, r=12) -> (${np.x.toFixed(2)}, ${np.y.toFixed(2)}); moved=${Math.hypot(np.x - 18200, np.y + 5300) > 1e-6}`);

console.log('== live sim: does the twilight drifter traverse open water (no box-walk)? ==');
const sim = createSimulation(makeSimWorld(), 1);
const t31 = sim.creatures.find((c) => c.def.id === 'T-31' && Math.abs(c.position.x - 18200) < 50 && Math.abs(c.position.y + 5300) < 50);
if (t31 === undefined) { console.log('ERROR: could not find the twilight T-31 near (18200,-5300)'); process.exit(2); }
console.log(`found twilight T-31 at (${t31.position.x.toFixed(0)}, ${t31.position.y.toFixed(0)})`);
sim.teleportTo(t31.position.x, -t31.position.y); // depth = -y
const report = (label: string) =>
  console.log(`  ${label}: x=${t31.position.x.toFixed(1)} y=${t31.position.y.toFixed(1)} inSlab=[${trappedBy(t31.position).join(', ') || 'none'}] active=${t31.active}`);
report('t=0');
let xMin = t31.position.x, xMax = t31.position.x, everInSlab = false, xSamples: number[] = [];
for (let s = 0; s < 120; s += 1) {
  // Follow the creature so it stays active (the §34 offscreen cap otherwise deactivates it).
  sim.teleportTo(t31.position.x, -t31.position.y);
  for (let k = 0; k < 60; k += 1) sim.step(emptyInput(), 1 / 60);
  xMin = Math.min(xMin, t31.position.x); xMax = Math.max(xMax, t31.position.x);
  xSamples.push(t31.position.x);
  if (trappedBy(t31.position).length > 0) everInSlab = true;
  if (s === 19 || s === 59 || s === 119) report(`t=${s + 1}s`);
}
const monotonicDecreasing = xSamples.every((v, i) => i === 0 || v <= xSamples[i - 1]! + 1e-9);
const driftDist = xSamples[0]! - xSamples[xSamples.length - 1]!;
console.log(`120s: x went ${xSamples[0]!.toFixed(0)} -> ${xSamples[xSamples.length - 1]!.toFixed(0)} (drift ${driftDist.toFixed(1)}u); xMin=${xMin.toFixed(0)} xMax=${xMax.toFixed(0)}`);
console.log(`monotonically west (no wall bounce/box-walk): ${monotonicDecreasing}; ever inside a closed slab: ${everInSlab}`);
