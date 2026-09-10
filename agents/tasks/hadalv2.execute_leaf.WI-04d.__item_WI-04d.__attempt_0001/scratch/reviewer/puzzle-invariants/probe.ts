/**
 * Adversarial probe for WI-04d: verify puzzle moment invariants from
 * raw world data. Checks:
 * - puzzle count is in range 3-5
 * - each puzzle has a setStoryFlag action
 * - each puzzle has a world-change action (lockPath, moveBackgroundCreature, spawnEntity)
 * - only existing TriggerCondition/TriggerAction variants are used
 */
import { makeSimWorld } from '../../../../../../src/sim/Simulation';

const world = makeSimWorld();
const triggers = world.chunks.flatMap((c) => c.triggers ?? []);
const puzzles = triggers.filter((t) => t.id.startsWith('puzzle-'));

console.log(`Found ${triggers.length} total triggers, ${puzzles.length} puzzle triggers`);

if (puzzles.length < 3 || puzzles.length > 5) {
  console.log('FAIL: puzzle count out of range [3,5]');
  process.exit(1);
}
console.log('PASS: puzzle count in range [3,5]');

// Known condition types
const validConditions = new Set(['enterRegion', 'reachDepth', 'possessUpgrade', 'scanObject',
  'collectItem', 'creatureState', 'timeInRegion', 'returnThrough', 'approachCreature']);

// Known action types
const validActions = new Set(['spawnEntity', 'despawnEntity', 'playAudio', 'alterAmbient',
  'moveBackgroundCreature', 'lockPath', 'showRadio', 'camera', 'timedEvent', 'setStoryFlag']);

for (const p of puzzles) {
  console.log(`Checking puzzle: ${p.id}`);

  // Condition type must be known
  if (!validConditions.has(p.condition.type)) {
    console.log(`FAIL: ${p.id} uses unknown condition type: ${p.condition.type}`);
    process.exit(1);
  }
  console.log(`  PASS: condition type is known (${p.condition.type})`);

  // Must have a setStoryFlag action
  const flagAction = p.actions.find((a) => a.type === 'setStoryFlag');
  if (!flagAction) {
    console.log(`FAIL: ${p.id} has no setStoryFlag action`);
    process.exit(1);
  }
  console.log(`  PASS: sets story flag ${flagAction.flag}`);

  // Must have a world-change action
  const worldChange = p.actions.find((a) =>
    a.type === 'lockPath' || a.type === 'moveBackgroundCreature' ||
    a.type === 'spawnEntity' || a.type === 'despawnEntity'
  );
  if (!worldChange) {
    console.log(`FAIL: ${p.id} has no world-change action`);
    process.exit(1);
  }
  console.log(`  PASS: has world-change action (${worldChange.type})`);

  // All actions must be known types
  for (const a of p.actions) {
    if (!validActions.has(a.type)) {
      console.log(`FAIL: ${p.id} uses unknown action type: ${a.type}`);
      process.exit(1);
    }
  }
  console.log(`  PASS: all action types are known`);

  // Must be once=true
  if (!p.once) {
    console.log(`FAIL: ${p.id} is not once:true`);
    process.exit(1);
  }
  console.log(`  PASS: once:true`);
}

console.log('');
console.log('All invariant checks passed.');
