import { Scenario } from '../../../../../src/sim/scenario';
import { makeSimWorld } from '../../../../../src/sim/Simulation';
import { PLAYER_START } from '../../../../../src/world/worldData';

const world = makeSimWorld();
const scenario = new Scenario(1, world);

// Start at surface
console.log('starting at surface');
scenario.swimTo(PLAYER_START, 50);

// Find salvage nodes in seabed
const seabedChunk = world.chunks.find(c => c.id === 'seabed')!;
const nodes = seabedChunk.resourceNodes?.filter(n => n.material === 'salvage') ?? [];
console.log(`found ${nodes.length} salvage nodes in seabed`);

// Collect from first 2 nodes (should give 8 salvage)
for (let i = 0; i < 2 && i < nodes.length; i++) {
  const node = nodes[i];
  console.log(`swimming to ${node.id} at ${JSON.stringify(node.position)}`);
  scenario.swimTo(node.position, 50);
  console.log('harvesting...');
  scenario.step({ ...scenario.lastInput, interact: true }, 1);
  console.log('inventory:', scenario.sim.player.inventory);
}

// Swim to base
console.log('swimming to base...');
scenario.swimTo({ x: PLAYER_START.x, y: -50 }, 50);

// Wait at base
console.log('waiting at base...');
scenario.stepFor(2);

// Check if at base
console.log('at base?', scenario.sim.isAtBase(scenario.sim.player.position));
console.log('player position:', scenario.sim.player.position);
console.log('inventory after banking:', scenario.sim.player.inventory);
console.log('banked after banking:', scenario.sim.player.banked);

// Try to craft
console.log('crafting tank-1...');
const result = scenario.sim.handleCraft({ ...scenario.lastInput, craftRequest: 'tank-1' });
console.log('craft result:', result);
console.log('equipment after craft:', scenario.sim.player.equipmentIds);

// Export telemetry
const telemetry = scenario.telemetry();
console.log('upgradesCrafted:', telemetry.upgradesCrafted);
console.log('playTimeSec:', telemetry.playTimeSec);