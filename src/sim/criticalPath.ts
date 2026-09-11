/**
 * problem — the world's authored progression must be winnable before any
 *   timing numbers are trusted; solution — a state-space reachability check
 *   (`simulateCriticalPath`) that starts from player capabilities, collects
 *   guaranteed materials in reachable zones, crafts available upgrades,
 *   recomputes reachable gates, and repeats until the final objective is
 *   reachable, and a full world validation (`validateWorld`) that catches
 *   recipe/gate/creature id deadlocks and missing content.
 *
 * archetype: service-provider
 * owns: the `simulateCriticalPath` progression validator and the full
 *   `validateWorld` check (chunk exits, connectivity, resource nodes,
 *   trigger ids, recipe/creature id resolution).
 * not own: the player's actual simulation state or the world data (it reads
 *   them).
 * invariant: `simulateCriticalPath` never simulates player movement — it is
 *   a pure data check over the world's authored progression structure.
 * fails when: the world's authored data makes the final objective
 *   unreachable (a recipe/gate deadlock) or missing (broken id reference).
 */
import { validateWorldChunks, deepestChunk, chunkContaining } from '../world/chunks';
import { RECIPES, RECIPE_BY_ID } from '../content/recipes';
import { CREATURE_BY_ID } from '../creatures/fixtures';
import { TRIGGER_RADIO_LINES } from '../content/dialogue';
import { MATERIAL_IDS } from '../content/resources';
import type { Capability, EquipmentDef } from '../player/equipment';
import type { SimWorld } from './Simulation';
import type { WorldChunkDef } from '../world/chunks';
import type { WorldValidation } from '../world/chunks';

/**
 * The full section 32 world validation: chunk exits and connectivity
 * (from validateWorldChunks) plus recipe/gate/creature/trigger id checks.
 */
export function validateWorld(
  world: SimWorld,
  recipes: readonly EquipmentDef[] = RECIPES,
  materials: ReadonlySet<string> = MATERIAL_IDS,
  radioLines: Record<string, string> = TRIGGER_RADIO_LINES,
  creatures: Record<string, unknown> = CREATURE_BY_ID,
): WorldValidation {
  const issues: string[] = [];

  // Chunk exits and connectivity (existing check)
  const chunkValidation = validateWorldChunks(world.chunks, world.base.position);
  issues.push(...chunkValidation.issues);

  // Check that every recipe references only known materials
  for (const recipe of recipes) {
    for (const [material] of Object.entries(recipe.cost)) {
      if (!materials.has(material)) {
        issues.push(`recipe ${recipe.id} requires material ${material} which is not defined`);
      }
    }
  }

  // Check that every creature spawn references a known creature
  for (const chunk of world.chunks) {
    for (const spawn of chunk.creatureSpawns ?? []) {
      if (!creatures[spawn.creature]) {
        issues.push(`chunk ${chunk.id} creature spawn ${spawn.id} references unknown creature ${spawn.creature}`);
      }
    }
  }

  // Check that every trigger's showRadio action references a known radio line
  for (const chunk of world.chunks) {
    for (const trigger of chunk.triggers ?? []) {
      for (const action of trigger.actions) {
        if (action.type === 'showRadio') {
          if (!radioLines[action.textId]) {
            issues.push(`story trigger ${trigger.id} references unknown radio text id ${action.textId}`);
          }
        }
      }
    }
  }

  return { valid: issues.length === 0, issues };
}

/**
 * The section 32 critical path simulation: a state-space check that proves
 * the final objective is reachable from start capabilities without simulating
 * player movement. Iterates: collect guaranteed materials in reachable zones,
 * craft available upgrades, recompute reachable gates, repeat.
 */
export function simulateCriticalPath(world: SimWorld): { reachable: boolean; issues: string[] } {
  const issues: string[] = [];

  // Collect the chunks by id
  const chunksById = new Map<string, WorldChunkDef>();
  for (const c of world.chunks) {
    chunksById.set(c.id, c);
  }

  // Find the start chunk
  const startChunk = chunkContaining(world.chunks, world.base.position);
  if (!startChunk) {
    issues.push('no chunk contains the start position');
    return { reachable: false, issues };
  }

  // Find the deepest chunk (the goal)
  const goalChunk = deepestChunk(world.chunks);
  if (!goalChunk) {
    issues.push('no chunks in the world');
    return { reachable: false, issues };
  }

  // The player's initial capabilities: the starter gear gives no sonar or boost
  // (request §9 tier 0). The only way to get them is through crafting upgrades.
  let playerCapabilities = new Set<Capability>();

  // The materials the player has collected (guaranteed, not random drops)
  let collectedMaterials: Record<string, number> = {};

  // Which chunks are reachable from the start with current capabilities
  let reachableChunks = new Set<string>([startChunk.id]);

  // Track which nodes have been collected to avoid double-counting
  const collectedNodes = new Set<string>();

  // Iterate until no more progress
  let iteration = 0;
  while (iteration < 100) {
    iteration++;
    let progressMade = false;

    // 1. Collect guaranteed materials from all reachable chunks
    for (const chunkId of reachableChunks) {
      const chunk = chunksById.get(chunkId)!;
      for (const node of chunk.resourceNodes ?? []) {
        if (collectedNodes.has(node.id)) continue;
        collectedNodes.add(node.id);
        const amount = collectedMaterials[node.material] ?? 0;
        collectedMaterials[node.material] = amount + node.amount;
        progressMade = true;
      }
    }

    // 2. Check which recipes can be crafted with collected materials
    for (const recipe of RECIPES) {
      // Skip already-owned upgrades
      if (playerCapabilities.has('sonar') && recipe.id === 'sonar-1') continue;
      if (playerCapabilities.has('boost') && recipe.id === 'fins-1') continue;

      // Check if we can afford the recipe
      let canAfford = true;
      for (const [material, needed] of Object.entries(recipe.cost)) {
        if ((collectedMaterials[material] ?? 0) < needed) {
          canAfford = false;
          break;
        }
      }
      if (canAfford) {
        // Craft the upgrade: deduct materials, add capabilities
        for (const [material, needed] of Object.entries(recipe.cost)) {
          collectedMaterials[material] = (collectedMaterials[material] ?? 0) - needed;
        }
        for (const cap of recipe.capabilities ?? []) {
          playerCapabilities.add(cap);
        }
        progressMade = true;
      }
    }

    // 3. Recompute reachable chunks with new capabilities
    for (const chunkId of [...reachableChunks]) {
      const chunk = chunksById.get(chunkId)!;
      for (const exit of chunk.exits) {
        const targetChunk = chunksById.get(exit.to);
        if (!targetChunk) continue; // already flagged by validateWorld
        if (reachableChunks.has(exit.to)) continue;

        // Check if the exit has a capability requirement
        if (exit.requiredCapability && !playerCapabilities.has(exit.requiredCapability as Capability)) {
          continue; // not yet reachable
        }

        reachableChunks.add(exit.to);
        progressMade = true;
      }
    }

    if (!progressMade) break;
  }

  // Check if the goal chunk is reachable
  if (!reachableChunks.has(goalChunk.id)) {
    issues.push(`the deepest chunk ${goalChunk.id} is not reachable from the start with available upgrades`);
  }

  return { reachable: issues.length === 0, issues };
}