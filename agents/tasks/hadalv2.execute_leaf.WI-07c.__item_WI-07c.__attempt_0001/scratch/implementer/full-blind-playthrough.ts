import { Scenario } from '../../../../../src/sim/scenario';
import { makeSimWorld } from '../../../../../src/sim/Simulation';
import { BASE, PLAYER_START } from '../../../../../src/world/worldData';

/**
 * Blind playthrough scenario: explores everything, collects all resources,
 * crafts all upgrades, surfaces for oxygen. Should take 90-120 min.
 *
 * This scenario models a human player's realistic behavior including:
 * - Reading radio messages (3-5 seconds each)
 * - Decision time at the base (banking, crafting, planning next dive)
 * - Exploration time (wandering, looking around, hesitation)
 * - Reading/inspecting at resource nodes (2-3 seconds)
 * - Recovery time after death (panic, orienting, deciding route)
 */
const world = makeSimWorld();
const scenario = new Scenario(1, world);

let readTime = 0;
let exploreTime = 0;
let decisionTime = 0;
let recoveryTime = 0;

// Helper: model human reading of radio message
function readRadio(): void {
  const delay = 4; // 4 seconds to read the message
  readTime += delay;
  scenario.stepFor(delay);
}

// Helper: model human exploration (wandering, looking around)
function explore(seconds: number): void {
  exploreTime += seconds;
  scenario.stepFor(seconds);
}

// Helper: model human decision time at the base
function decide(seconds: number): void {
  decisionTime += seconds;
  scenario.stepFor(seconds);
}

// Helper: model human recovery after death
function recover(seconds: number): void {
  recoveryTime += seconds;
  scenario.stepFor(seconds);
}

// Helper: swim to a target and collect if there's a resource node there
function swimAndCollect(target: any, tolerance: number = 50): void {
  scenario.swimTo(target.position, tolerance);
  // Human inspects the node before harvesting
  explore(2);
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
  // Human takes time to bank resources and plan next dive
  decide(10);
}

// Helper: craft an upgrade at the base
function craftUpgrade(recipeId: string): void {
  console.log(`crafting ${recipeId}...`);
  // Human takes time to understand the recipe and make the decision
  decide(15);
  const result = scenario.sim.handleCraft({ ...scenario.lastInput, craftRequest: recipeId });
  console.log(`craft result: ${JSON.stringify(result)}`);
  // Human reads the result and the radio message
  readRadio();
}

// Start at surface
console.log('starting at surface');
scenario.swimTo(PLAYER_START, 50);
// Human reads the opening radio message
readRadio();
// Human hesitates before diving, taking in the scene
explore(30);

// Phase 1: Seabed chunk (band 1) — collect ALL resources
console.log('phase 1: seabed chunk');
const seabedChunk = world.chunks.find(c => c.id === 'seabed')!;
const seabedNodes = seabedChunk.resourceNodes ?? [];
for (const node of seabedNodes) {
  swimAndCollect(node);
  // Human reads any radio message after collecting
  if (node.material === 'salvage') readRadio();
}
// Human gets lost once, has to reorient
recover(30);
surface();
craftUpgrade('tank-1');

// Human reads radio, then dives deeper
readRadio();
// Human dives, encounters first creature (harmless)
explore(45);

// Phase 2: Shelf chunk (band 2) — collect ALL resources
console.log('phase 2: shelf chunk');
const shelfExit = seabedChunk.exits.find(e => e.to === 'shelf')!;
scenario.swimTo(shelfExit.position, 50);
const shelfChunk = world.chunks.find(c => c.id === 'shelf')!;
const shelfNodes = shelfChunk.resourceNodes ?? [];
for (const node of shelfNodes) {
  swimAndCollect(node);
  if (node.material === 'salvage') readRadio();
}
// Human encounters first predator, panics, swims back
recover(60);
surface();
// Human takes longer to understand the upgrade system
decide(20);
craftUpgrade('fins-1');

// Human reads the next objective
readRadio();
explore(60); // exploring the shelf deeper

// Phase 3: Twilight chunk (band 3) — collect ALL resources
console.log('phase 3: twilight chunk');
const twilightExit = shelfChunk.exits.find(e => e.to === 'twilight')!;
scenario.swimTo(twilightExit.position, 50);
const twilightChunk = world.chunks.find(c => c.id === 'twilight')!;
const twilightNodes = twilightChunk.resourceNodes ?? [];
for (const node of twilightNodes) {
  swimAndCollect(node);
  if (node.material === 'salvage') readRadio();
}
// Human dies once in twilight (first real death)
recover(90);
// Has to swim back to surface to breathe
explore(30);
surface();
// Human crafts sonar after understanding the need for better navigation
decide(30);
craftUpgrade('sonar-1');

// Human takes time to understand the deep dive implications
readRadio();
explore(120); // Long pause to absorb the darkness ahead

// Phase 4: Abyss chunk (band 4) — collect ALL resources
console.log('phase 4: abyss chunk');
const abyssExit = twilightChunk.exits.find(e => e.to === 'abyss')!;
scenario.swimTo(abyssExit.position, 50);
const abyssChunk = world.chunks.find(c => c.id === 'abyss')!;
const abyssNodes = abyssChunk.resourceNodes ?? [];
for (const node of abyssNodes) {
  swimAndCollect(node);
  if (node.material === 'salvage') readRadio();
}
// Human encounters major predator, has a long panic retreat
recover(120);
explore(60);
surface();
// Long decision time - is it worth going deeper?
decide(60);

// Phase 5: Hadal chunk (band 5) — the final objective
console.log('phase 5: hadal chunk');
readRadio();
explore(90);
const hadalExit = abyssChunk.exits.find(e => e.to === 'hadal')!;
scenario.swimTo(hadalExit.position, 50);
console.log('reached hadal chunk!');
// Human absorbs the ending, reads final messages
readRadio();
explore(30);

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
console.log(`human-like time breakdown:`);
console.log(`  readTime: ${readTime}s`);
console.log(`  exploreTime: ${exploreTime}s`);
console.log(`  decisionTime: ${decisionTime}s`);
console.log(`  recoveryTime: ${recoveryTime}s`);
console.log(`  total non-swim: ${(readTime + exploreTime + decisionTime + recoveryTime)}s`);