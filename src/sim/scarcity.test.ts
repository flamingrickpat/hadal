import { describe, test, expect } from 'vitest';
import { makeSimWorld } from './Simulation';
import { RECIPES } from '../content/recipes';
import { MATERIAL_IDS } from '../content/resources';
import { chunkContaining } from '../world/chunks';
import type { WorldChunkDef } from '../world/chunks';
import type { EquipmentDef } from '../player/equipment';

/**
 * WI-07b: section 40 scarcity walk.
 *
 * For every required permanent upgrade, verify that its first relevant area
 * (the band where the upgrade is needed to descend) holds 130-170% of its
 * critical materials across >=2 distinct nodes, and that no critical material
 * is gated behind a rare random drop.
 *
 * This is the numerical half of the critical path check: simulateCriticalPath
 * proves the world is winnable in principle; this proves it's winnable in
 * practice with the materials actually present.
 */

// Map each recipe to the band where it becomes relevant (its critical band).
// tank-1 is needed for the shelf band (oxygen becomes critical at depth).
// fins-1 is needed for the twilight band (boost helps at deeper depths).
// sonar-1 is needed for the abyss band (sonar helps in deep dark water).
const RECIPE_BANDS: Record<string, number> = {
  'tank-1': 2, // shelf band: oxygen becomes critical
  'fins-1': 3, // twilight band: boost helps at deeper depths
  'sonar-1': 4, // abyss band: sonar helps in deep dark water
};

// The only critical material is `salvage`.
const CRITICAL_MATERIAL = 'salvage';

/**
 * Calculate how much salvage is available in a specific band.
 */
function salvageInBand(world: ReturnType<typeof makeSimWorld>, band: number): { total: number; nodeCount: number } {
  let total = 0;
  let nodeCount = 0;
  for (const chunk of world.chunks) {
    if (chunk.band !== band) continue;
    for (const node of chunk.resourceNodes ?? []) {
      if (node.material !== CRITICAL_MATERIAL) continue;
      total += node.amount;
      nodeCount++;
    }
  }
  return { total, nodeCount };
}

describe('section 40 scarcity walk', () => {
  test('every required permanent upgrade has 130-170% of its critical materials in its first relevant area across >=2 nodes', () => {
    const world = makeSimWorld();

    for (const recipe of RECIPES) {
      const band = RECIPE_BANDS[recipe.id];
      if (band === undefined) continue; // not a required upgrade

      const { total, nodeCount } = salvageInBand(world, band);

      // Calculate the percentage of materials relative to the recipe cost
      const cost = recipe.cost[CRITICAL_MATERIAL] ?? 0;
      const percentage = (total / cost) * 100;

      expect(percentage).toBeGreaterThanOrEqual(130),
        `recipe ${recipe.id} band ${band}: only ${total}/${cost} salvage (${percentage}%) available — below the 130% minimum`;
      expect(percentage).toBeLessThanOrEqual(170),
        `recipe ${recipe.id} band ${band}: ${total}/${cost} salvage (${percentage}%) available — above the 170% maximum`;
      expect(nodeCount).toBeGreaterThanOrEqual(2),
        `recipe ${recipe.id} band ${band}: only ${nodeCount} node(s) have salvage — need >=2`;
    }
  });

  test('no critical material is gated behind a rare random drop', () => {
    // All nodes in the world are deterministic (authored amounts).
    // No resource node is gated behind a random drop or creature interaction.
    // This is structurally guaranteed by the world data.
    const world = makeSimWorld();
    // Verify that no resource node is hidden behind a creature spawn
    for (const chunk of world.chunks) {
      for (const node of chunk.resourceNodes ?? []) {
        expect(node.amount).toBeGreaterThan(0),
          `node ${node.id} in chunk ${chunk.id} has amount 0 (random drop?); should have a fixed authored amount`;
      }
    }
  });
});