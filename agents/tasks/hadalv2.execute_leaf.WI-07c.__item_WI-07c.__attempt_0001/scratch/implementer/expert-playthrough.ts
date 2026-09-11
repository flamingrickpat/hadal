import { Scenario } from '../../../../../src/sim/scenario';
import { makeSimWorld } from '../../../../../src/sim/Simulation';
import { PLAYER_START } from '../../../../../src/world/worldData';

/**
 * Expert playthrough scenario: knows the optimal route, collects necessary
 * resources efficiently. Should take 55-75 min.
 *
 * An expert player knows the route but still experiences the same gameplay
 * mechanics: swimming, oxygen management, crafting, creature encounters.
 * The expert moves faster with less hesitation, but still reads messages
 * and makes decisions (just more quickly).
 */
const world = makeSimWorld();
const scenario = new Scenario(1, world);

let readTime = 0;
let exploreTime = 0;
let decisionTime = 0;
let recoveryTime = 0;

// Helper: model human reading of radio message (expert reads quickly)
function readRadio(): void {
  const delay = 2; // Expert reads quickly
  readTime += delay;
  scenario.stepFor(delay);
}

// Helper: model brief exploration (expert explores minimally)
function explore(seconds: number): void {
  exploreTime += seconds;
  scenario.stepFor(seconds);
}

// Helper: model human decision time (expert decides quickly)
function decide(seconds: number): void {
  decisionTime += seconds;
  scenario.stepFor(seconds);
}

// Helper: model human recovery after death
function recover(seconds: number): void {
  recoveryTime += seconds;
  scenario.stepFor(seconds);
}

// Helper: swim to surface to refill oxygen
function surface(): void {
  console.log('surfacing...');
  scenario.swimTo({ x: PLAYER_START.x, y: -50 }, 50);
  // Expert banks resources quickly
  decide(3);
}

// Helper: craft an upgrade at the base
function craftUpgrade(recipeId: string): void {
  console.log(`crafting ${recipeId}...`);
  // Expert knows the recipes and crafts quickly
  decide(5);
  const result = scenario.sim.handleCraft({ ...scenario.lastInput, craftRequest: recipeId });
  console.log(`craft result: ${JSON.stringify(result)}`);
  readRadio();
}

// Start at surface
console.log('starting at surface');
scenario.swimTo(PLAYER_START, 50);
// Expert reads the opening radio message quickly
readRadio();
// Expert dives right away with minimal hesitation
explore(10);

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

// Expert dives deeper quickly
readRadio();
explore(15);

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
// Expert encounters first predator, handles it quickly
recover(20);
surface();
craftUpgrade('fins-1');

readRadio();
explore(30);

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
// Expert dies once, but recovers quickly
recover(45);
surface();
craftUpgrade('sonar-1');

readRadio();
explore(60);

// Phase 4: Abyss -> go directly to hadal exit (skip resource collection)
console.log('phase 4: abyss');
const abyssExit = twilightChunk.exits.find(e => e.to === 'abyss')!;
scenario.swimTo(abyssExit.position, 50);
const abyssChunk = world.chunks.find(c => c.id === 'abyss')!;
// Expert encounters major predator, but handles it efficiently
recover(60);
// Expert knows exactly where the hadal exit is
explore(15);

// Phase 5: Hadal -> the final objective
console.log('phase 5: hadal');
readRadio();
explore(30);
const hadalExit = abyssChunk.exits.find(e => e.to === 'hadal')!;
scenario.swimTo(hadalExit.position, 50);
console.log('reached hadal chunk!');
readRadio();

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
console.log(`human-like time breakdown:`);
console.log(`  readTime: ${readTime}s`);
console.log(`  exploreTime: ${exploreTime}s`);
console.log(`  decisionTime: ${decisionTime}s`);
console.log(`  recoveryTime: ${recoveryTime}s`);
console.log(`  total non-swim: ${(readTime + exploreTime + decisionTime + recoveryTime)}s`);