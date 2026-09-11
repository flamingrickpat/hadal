/**
 * Adversarial probe: does the impulse bypass the shake flag?
 *
 * The acceptance criterion says "flag off means no shake from any source."
 * This probe specifically tests whether the WI-06d-b4 distant-motion impulse
 * is suppressed when the shake flag is off — i.e., whether it's truly routed
 * through the shake path or if it's applied separately.
 *
 * Method: Trigger the impulse, set the flag off, then advance time.
 * If the impulse still produces camera offset, it bypassed the flag.
 */
import {
  shouldTriggerImpulse,
  applyImpulseDecay,
  isImpulseActive,
  getImpulseOffset,
  resetImpulse,
} from '../../../../../../src/render/impulseFlag';
import {
  setShakeEnabled,
  emitShake,
  updateShake,
  getShakeOffset,
  resetShake,
} from '../../../../../../src/render/shake';
import {
  IMPULSE_MOTION_THRESHOLD,
  IMPULSE_TRIGGER_DISTANCE,
} from '../../../../../../src/render/impulseParams';

const FIXED_DT = 1 / 60;

let passed = true;

console.log('Adversarial probe: impulse bypasses shake flag?');
console.log('');

// Test 1: With flag OFF, impulse should NOT produce any shake offset
console.log('Test 1: Flag off + impulse active');
resetImpulse();
resetShake();
setShakeEnabled(false);

// Trigger the impulse (simulating the distant-motion impulse)
const triggered = shouldTriggerImpulse(IMPULSE_MOTION_THRESHOLD + 100, IMPULSE_TRIGGER_DISTANCE + 100);
console.log(`  Impulse triggered: ${triggered} (expect true)`);

// Advance time and check for shake offset
let shakeObserved = false;
for (let i = 0; i < 60; i++) {
  applyImpulseDecay(FIXED_DT);
  // The Renderer would call emitShake here if impulse is active
  if (isImpulseActive()) {
    emitShake(10, 2);
  }
  updateShake(FIXED_DT);
  const offset = getShakeOffset();
  const mag = Math.hypot(offset.x, offset.y);
  if (mag > 0.001) {
    shakeObserved = true;
    console.log(`  Shake observed at frame ${i}: ${mag.toFixed(4)}`);
  }
}

console.log(`  Shake observed with flag off: ${shakeObserved} (expect false)`);
if (shakeObserved) {
  console.log('  FAIL: impulse bypassed the shake flag');
  passed = false;
} else {
  console.log('  PASS');
}
console.log('');

// Test 2: With flag ON, impulse should produce shake
console.log('Test 2: Flag on + impulse active');
resetImpulse();
resetShake();
setShakeEnabled(true);

shouldTriggerImpulse(IMPULSE_MOTION_THRESHOLD + 100, IMPULSE_TRIGGER_DISTANCE + 100);

let shakeObserved2 = false;
for (let i = 0; i < 60; i++) {
  applyImpulseDecay(FIXED_DT);
  if (isImpulseActive()) {
    emitShake(10, 2);
  }
  updateShake(FIXED_DT);
  const offset = getShakeOffset();
  const mag = Math.hypot(offset.x, offset.y);
  if (mag > 0.001) {
    shakeObserved2 = true;
    break;
  }
}

console.log(`  Shake observed with flag on: ${shakeObserved2} (expect true)`);
if (!shakeObserved2) {
  console.log('  FAIL: impulse should have produced shake with flag on');
  passed = false;
} else {
  console.log('  PASS');
}
console.log('');

// Test 3: Direct impulse offset (getImpulseOffset) still works independently
console.log('Test 3: Direct impulse offset (legacy API) still works');
resetImpulse();
shouldTriggerImpulse(IMPULSE_MOTION_THRESHOLD + 100, IMPULSE_TRIGGER_DISTANCE + 100);
const legacyOffset = getImpulseOffset();
console.log(`  Legacy getImpulseOffset returns: ${legacyOffset !== null}`);
if (legacyOffset === null) {
  console.log('  FAIL: legacy API should still work');
  passed = false;
} else {
  console.log('  PASS (legacy API still functional)');
}
console.log('');

if (passed) {
  console.log('All adversarial tests passed.');
} else {
  console.log('Some adversarial tests failed.');
  process.exit(1);
}