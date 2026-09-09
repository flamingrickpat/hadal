// Implementer clearance probe (WI-03b2 re-land): for every creature spawn in
// the production world, is its center strictly inside a closed terrain slab?
// Uses the REAL world data. All closed slabs are axis-aligned rectangles, so
// strict bounding-box containment is exact (a point on an edge is "clear").
import { MACRO_WORLD } from '../../../../../../src/world/worldData';
import { CREATURE_BY_ID } from '../../../../../../src/creatures/fixtures';
import type { TerrainShapeDef } from '../../../../../../src/world/terrain';

function insideClosedSlab(p: { x: number; y: number }, s: TerrainShapeDef): boolean {
  if (!s.closed) return false;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const pt of s.points) {
    minX = Math.min(minX, pt.x); maxX = Math.max(maxX, pt.x);
    minY = Math.min(minY, pt.y); maxY = Math.max(maxY, pt.y);
  }
  return p.x > minX && p.x < maxX && p.y > minY && p.y < maxY;
}

const insideSlabs = (p: { x: number; y: number }): string[] => {
  const hit: string[] = [];
  for (const chunk of MACRO_WORLD) {
    for (const s of chunk.terrain) if (insideClosedSlab(p, s)) hit.push(s.id);
  }
  return hit;
};

let total = 0;
let inside = 0;
for (const chunk of MACRO_WORLD) {
  for (const spawn of chunk.creatureSpawns ?? []) {
    total += 1;
    const r = CREATURE_BY_ID[spawn.creature]?.body.radius ?? 0;
    const hits = insideSlabs(spawn.position);
    if (hits.length > 0) {
      inside += 1;
      console.log(`INSIDE  ${spawn.id} (${spawn.creature}, r=${r}) at (${spawn.position.x}, ${spawn.position.y}) -> ${hits.join(',')}`);
    } else {
      console.log(`clear   ${spawn.id} (${spawn.creature}) at (${spawn.position.x}, ${spawn.position.y})`);
    }
  }
}
console.log(`\n${total} spawns total; ${inside} strictly inside a closed slab.`);

// Validate the proposed relocation for t31-twilight.
const candidate = { x: 18200, y: -5300 };
console.log(`candidate t31-twilight (${candidate.x}, ${candidate.y}): inside -> ${insideSlabs(candidate).join(',') || 'none'}`);
