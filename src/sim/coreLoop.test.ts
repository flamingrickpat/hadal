import { describe, expect, it } from 'vitest';
import { Scenario } from './scenario';
import { createSimulationFromSave, emptyInput } from './Simulation';
import { BASE, GREYBOX_WORLD, PLAYER_START } from '../world/worldData';
import { O2_MAX } from '../game/constants';
import type { Vec2 } from '../util/math';

function nodePosition(id: string): Vec2 {
  for (const chunk of GREYBOX_WORLD) {
    for (const node of chunk.resourceNodes ?? []) {
      if (node.id === id) return node.position;
    }
  }
  throw new Error(`no resource node ${id}`);
}

/**
 * The §70 continuous core-loop scenario: steps 1–9 as one headless scenario
 * over the production world and the actual spawn. No teleportation, noclip,
 * free materials, or direct state edits — only normal player actions.
 */
describe('§70 continuous core-loop scenario (spawn -> resource -> craft -> save -> load -> verify)', () => {
  it('runs steps 1–9 end to end', () => {
    const s = new Scenario(1);
    const sim = s.sim;

    // Step 1: start at the actual spawn with a fresh game and starter equipment.
    s.assertNear(sim.player.position, PLAYER_START, 1, 'starts at the actual spawn');
    expect(sim.player.o2Max).toBe(O2_MAX);
    expect(sim.player.equipmentIds).toEqual([]);

    // Step 2: swim to an actual first resource through normal movement + collision.
    const first = nodePosition('salvage-1');
    s.swimTo(first, 40);
    s.assert(s.distanceTo(first) <= 45, 'reached the first resource by normal movement');

    // Step 3: interact to collect the materials for the first upgrade.
    const harvestInput = emptyInput();
    harvestInput.interact = true;
    s.stepFor(0.5, harvestInput);
    const second = nodePosition('salvage-2');
    s.swimTo(second, 40);
    s.stepFor(0.5, harvestInput);
    s.assert(
      sim.player.inventory.salvage === 8,
      `collected materials for the first upgrade (salvage=${sim.player.inventory.salvage ?? 0})`,
    );

    // Step 4: return to the actual base and reach the required station.
    s.swimTo(BASE.position, 60);
    s.assert(sim.isAtBase(sim.player.position), 'returned to the actual base');
    s.assert(
      sim.player.banked.salvage === 8,
      `banked resources at the base (banked=${sim.player.banked.salvage ?? 0})`,
    );

    // Step 5: craft through the same gameplay action the browser menu submits.
    const craftInput = emptyInput();
    craftInput.craftRequest = 'tank-1';
    const result = sim.handleCraft(craftInput);
    s.assert(result.crafted, `crafted the first upgrade through the gameplay action (reason=${result.reason})`);

    // Step 6: verify the resource costs and the resulting capability change.
    s.assert(
      sim.player.banked.salvage === 2,
      `resource cost applied (banked=${sim.player.banked.salvage ?? 0}, expected 8-6=2)`,
    );
    s.assert(sim.player.o2Max === O2_MAX + 65, `capability changed (o2Max=${sim.player.o2Max}, expected ${O2_MAX + 65})`);
    s.assert(sim.player.equipmentIds.includes('tank-1'), 'tank-1 is now permanent equipment');

    // Step 7: leave the base and demonstrate the improved capability through simulation.
    s.swimTo({ x: 1300, y: -600 }, 60);
    s.assert(!sim.isAtBase(sim.player.position), 'left the base');
    s.assert(sim.player.o2Max === O2_MAX + 65, 'improved capability (o2Max) persists after leaving the base');

    // Step 8: serialize the save and load it into a fresh simulation.
    const save = sim.toSave();
    const fresh = createSimulationFromSave(save);

    // Step 9: verify the upgrade and required progression state persist.
    s.assert(fresh.player.equipmentIds.includes('tank-1'), 'upgrade persists in the fresh simulation');
    s.assert(fresh.player.o2Max === O2_MAX + 65, 'o2Max persists in the fresh simulation');
    s.assert(fresh.player.banked.salvage === 2, 'banked resources persist in the fresh simulation');
    s.assert(fresh.player.maxDepth >= 500, `max depth persists (maxDepth=${fresh.player.maxDepth})`);
  });
});
