import { Scenario } from '../../../../../src/sim/scenario';
import { makeSimWorld } from '../../../../../src/sim/Simulation';
import { BASE, PLAYER_START } from '../../../../../src/world/worldData';

/**
 * Blind playthrough scenario: explores everything, collects all resources,
 * crafts all upgrades, surfaces for oxygen. Should take 90-120 min.
 */
const world = makeSimWorld();
const scenario = new Scenario(1, world);

// Helper: swim to a target and collect if there's a resource node there
function swimAndCollect(target: any, tolerance: number = 50): void {
  scenario.swimTo(target.position, tolerance);
  // Try to harvest if there's a resource node here
  const node = world.chunks
    .flatMap(c => c.resourceNodes ?? [])
    .find(n => n.id === target.id);
  if (node) {
    // Interact to harvest
    scenario.step({ ...scenario.lastInput, interact: true }, 1);
    console.log(`collected ${node.material} at ${target.id}`);
  }
}

// Helper: swim to surface to refill oxygen
function surface(): void {
  console.log('surfacing...');
  scenario.swimTo({ x: PLAYER_START.x, y: -50 }, 50);
  // Wait at base for a moment (bank resources)
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

// Phase 1: Seabed chunk (band 1) — collect ALL resources
console.log('phase 1: seabed chunk');
const seabedChunk = world.chunks.find(c => c.id === 'seabed')!;
const seabedNodes = seabedChunk.resourceNodes ?? [];
for (const node of seabedNodes) {
  swimAndCollect(node);
}
surface();
craftUpgrade('tank-1');

// Phase 2: Shelf chunk (band 2) — collect ALL resources
console.log('phase 2: shelf chunk');
const shelfExit = seabedChunk.exits.find(e => e.to === 'shelf')!;
scenario.swimTo(shelfExit.position, 50);
const shelfChunk = world.chunks.find(c => c.id === 'shelf')!;
const shelfNodes = shelfChunk.resourceNodes ?? [];
for (const node of shelfNodes) {
  swimAndCollect(node);
}
surface();
craftUpgrade('fins-1');

// Phase 3: Twilight chunk (band 3) — collect ALL resources
console.log('phase 3: twilight chunk');
const twilightExit = shelfChunk.exits.find(e => e.to === 'twilight')!;
scenario.swimTo(twilightExit.position, 50);
const twilightChunk = world.chunks.find(c => c.id === 'twilight')!;
const twilightNodes = twilightChunk.resourceNodes ?? [];
for (const node of twilightNodes) {
  swimAndCollect(node);
}
surface();
craftUpgrade('sonar-1');

// Phase 4: Abyss chunk (band 4) — collect ALL resources
console.log('phase 4: abyss chunk');
const abyssExit = twilightChunk.exits.find(e => e.to === 'abyss')!;
scenario.swimTo(abyssExit.position, 50);
const abyssChunk = world.chunks.find(c => c.id === 'abyss')!;
const abyssNodes = abyssChunk.resourceNodes ?? [];
for (const node of abyssNodes) {
  swimAndCollect(node);
}
surface();

// Phase 5: Hadal chunk (band 5) — the final objective
console.log('phase 5: hadal chunk');
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
console.log(`upgradesCrafted: ${telemetry.upgradesCrafted.length}`);
console.log(`upgradesCrafted: ${telemetry.upgradesCrafted.join(', ')}`);
console.log(`equipmentIds: ${scenario.sim.player.equipmentIds.join(', ')}`);