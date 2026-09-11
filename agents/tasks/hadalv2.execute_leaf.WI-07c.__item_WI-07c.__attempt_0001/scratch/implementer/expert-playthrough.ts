import { Scenario } from '../../../../../src/sim/scenario';
import { makeSimWorld } from '../../../../../src/sim/Simulation';
import { PLAYER_START } from '../../../../../src/world/worldData';

/**
 * Expert playthrough scenario: knows the optimal route, collects necessary
 * resources efficiently. Should take 55-75 min.
 */
const world = makeSimWorld();
const scenario = new Scenario(1, world);

// Helper: swim to surface to refill oxygen
function surface(): void {
  console.log('surfacing...');
  scenario.swimTo({ x: PLAYER_START.x, y: -50 }, 50);
  scenario.stepFor(2);
}

// Helper: craft an upgrade at the base
function craftUpgrade(recipeId: string): void {
  console.log(`crafting ${recipeId}...`);
  const result = scenario.sim.handleCraft({ ...scenario.lastInput, craftRequest: recipeId });
  console.log(`craft result: ${JSON.stringify(result)}`);
}

// Start at surface
console.log('starting at surface');
scenario.swimTo(PLAYER_START, 50);

// Expert knows the optimal route: go directly to each exit, collecting
// necessary resources.

// Phase 1: Seabed -> collect enough for tank-1 (6 salvage)
console.log('phase 1: seabed');
const seabedChunk = world.chunks.find(c => c.id === 'seabed')!;
const seabedNodes = (seabedChunk.resourceNodes ?? []).filter(n => n.material === 'salvage');
for (let i = 0; i < 4 && i < seabedNodes.length; i++) {
  scenario.swimTo(seabedNodes[i].position, 50);
  scenario.step({ ...scenario.lastInput, interact: true }, 1);
}
surface();
craftUpgrade('tank-1');

// Phase 2: Shelf -> collect enough for fins-1 (8 more salvage, total 14)
console.log('phase 2: shelf');
const shelfExit = seabedChunk.exits.find(e => e.to === 'shelf')!;
scenario.swimTo(shelfExit.position, 50);
const shelfChunk = world.chunks.find(c => c.id === 'shelf')!;
const shelfNodes = (shelfChunk.resourceNodes ?? []).filter(n => n.material === 'salvage');
for (let i = 0; i < 4 && i < shelfNodes.length; i++) {
  scenario.swimTo(shelfNodes[i].position, 50);
  scenario.step({ ...scenario.lastInput, interact: true }, 1);
}
surface();
craftUpgrade('fins-1');

// Phase 3: Twilight -> collect enough for sonar-1 (5 more salvage, total 19)
console.log('phase 3: twilight');
const twilightExit = shelfChunk.exits.find(e => e.to === 'twilight')!;
scenario.swimTo(twilightExit.position, 50);
const twilightChunk = world.chunks.find(c => c.id === 'twilight')!;
const twilightNodes = (twilightChunk.resourceNodes ?? []).filter(n => n.material === 'salvage');
for (let i = 0; i < 4 && i < twilightNodes.length; i++) {
  scenario.swimTo(twilightNodes[i].position, 50);
  scenario.step({ ...scenario.lastInput, interact: true }, 1);
}
surface();
craftUpgrade('sonar-1');

// Phase 4: Abyss -> go directly to hadal exit (skip resource collection)
console.log('phase 4: abyss');
const abyssExit = twilightChunk.exits.find(e => e.to === 'abyss')!;
scenario.swimTo(abyssExit.position, 50);
const abyssChunk = world.chunks.find(c => c.id === 'abyss')!;

// Phase 5: Hadal -> the final objective
console.log('phase 5: hadal');
const hadalExit = abyssChunk.exits.find(e => e.to === 'hadal')!;
scenario.swimTo(hadalExit.position, 50);
console.log('reached hadal chunk!');

// Export telemetry
const telemetry = scenario.telemetry();
console.log('telemetry:');
console.log(JSON.stringify(telemetry, null, 2));
console.log(`playTimeSec: ${telemetry.playTimeSec}`);
console.log(`playTimeMin: ${(telemetry.playTimeSec / 60).toFixed(1)}`);
console.log(`deaths: ${telemetry.deaths}`);
console.log(`maxDepth: ${telemetry.maxDepth}`);
console.log(`upgradesCrafted: ${telemetry.upgradesCrafted.join(', ')}`);
console.log(`equipmentIds: ${scenario.sim.player.equipmentIds.join(', ')}`);