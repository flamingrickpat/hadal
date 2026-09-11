import { Scenario } from '../../../../../src/sim/scenario';
import { makeSimWorld } from '../../../../../src/sim/Simulation';
import { PLAYER_START } from '../../../../../src/world/worldData';

const world = makeSimWorld();
const scenario = new Scenario(1, world);

// Start at surface
console.log('starting at surface');
scenario.swimTo(PLAYER_START, 50);

// Find first salvage node
const seabedChunk = world.chunks.find(c => c.id === 'seabed')!;
const node = seabedChunk.resourceNodes?.find(n => n.material === 'salvage');
if (!node) {
  console.log('no salvage node found');
  process.exit(1);
}

console.log(`swimming to ${node.id} at ${JSON.stringify(node.position)}`);
scenario.swimTo(node.position, 50);

// Harvest
console.log('harvesting...');
scenario.step({ ...scenario.lastInput, interact: true }, 1);

// Check inventory
console.log('inventory:', scenario.sim.player.inventory);
console.log('banked:', scenario.sim.player.banked);

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