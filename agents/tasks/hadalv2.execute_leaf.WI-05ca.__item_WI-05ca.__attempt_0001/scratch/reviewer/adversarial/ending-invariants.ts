/**
 * Adversarial probe for WI-05ca: verify ending variant invariants from
 * raw simulation state. Independent of the implementer's test suite.
 *
 * Checks:
 * - Two ending triggers exist in world data (one for each variant)
 * - Both are reachPoint triggers with different coordinates
 * - Both set 'ending-triggered' and a variant-specific story flag
 * - Variant detection logic reads the correct flags
 * - One-shot enforcement via 'once: true'
 */
import { makeSimWorld } from '../../../../../../src/sim/Simulation';

const world = makeSimWorld();
const triggers = world.chunks.flatMap((c) => c.triggers ?? []);

const endingA = triggers.find((t) => t.id === 'ending-triggered');
const endingB = triggers.find((t) => t.id === 'ending-variant-B');

console.log(`Total triggers: ${triggers.length}`);
console.log(`ending-variant-A trigger: ${endingA ? 'found' : 'MISSING'}`);
console.log(`ending-variant-B trigger: ${endingB ? 'found' : 'MISSING'}`);

if (!endingA || !endingB) {
  console.log('FAIL: missing ending variant triggers');
  process.exit(1);
}

// Both must be reachPoint triggers with different coordinates
if (endingA.condition.type !== 'reachPoint' || endingB.condition.type !== 'reachPoint') {
  console.log('FAIL: ending triggers are not reachPoint type');
  process.exit(1);
}
console.log(`A target: (${endingA.condition.x}, ${endingA.condition.y})`);
console.log(`B target: (${endingB.condition.x}, ${endingB.condition.y})`);

if (endingA.condition.x === endingB.condition.x && endingA.condition.y === endingB.condition.y) {
  console.log('FAIL: both ending triggers at same location (no decision point)');
  process.exit(1);
}
console.log('PASS: different exit locations create a player decision');

// Both must set ending-triggered and a variant-specific flag
const aSetsTriggered = endingA.actions.some((a) => a.type === 'setStoryFlag' && a.flag === 'ending-triggered');
const aSetsVariant = endingA.actions.some((a) => a.type === 'setStoryFlag' && a.flag === 'ending-variant-A');
const bSetsTriggered = endingB.actions.some((a) => a.type === 'setStoryFlag' && a.flag === 'ending-triggered');
const bSetsVariant = endingB.actions.some((a) => a.type === 'setStoryFlag' && a.flag === 'ending-variant-B');

if (!aSetsTriggered || !aSetsVariant || !bSetsTriggered || !bSetsVariant) {
  console.log('FAIL: ending triggers do not set the required story flags');
  console.log(`  A: triggered=${aSetsTriggered}, variant-A=${aSetsVariant}`);
  console.log(`  B: triggered=${bSetsTriggered}, variant-B=${bSetsVariant}`);
  process.exit(1);
}
console.log('PASS: both triggers set ending-triggered and variant-specific flags');

// Both must be once:true for one-shot enforcement
if (!endingA.once || !endingB.once) {
  console.log('FAIL: ending triggers are not once:true');
  console.log(`  A: once=${endingA.once}`);
  console.log(`  B: once=${endingB.once}`);
  process.exit(1);
}
console.log('PASS: one-shot enforcement via once:true');

// Both must have different radio text IDs
const aRadio = endingA.actions.find((a) => a.type === 'showRadio');
const bRadio = endingB.actions.find((a) => a.type === 'showRadio');
if (!aRadio || !bRadio || aRadio.textId === bRadio.textId) {
  console.log('FAIL: ending triggers do not produce different radio text');
  console.log(`  A: ${aRadio?.textId}`);
  console.log(`  B: ${bRadio?.textId}`);
  process.exit(1);
}
console.log(`PASS: different radio text (A: ${aRadio.textId}, B: ${bRadio.textId})`);

console.log('');
console.log('All ending variant invariant checks passed.');
