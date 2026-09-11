import { IMPULSE_TRIGGER_DISTANCE, IMPULSE_MOTION_THRESHOLD, IMPULSE_NUDGE_AMPLITUDE, IMPULSE_DECAY_TIME } from '../../../../../src/render/impulseParams';
import { shouldTriggerImpulse, applyImpulseDecay, getImpulseOffset, isImpulseActive, resetImpulse } from '../../../../../src/render/impulseFlag';

console.log('=== Reviewer independent verification probe ===');
console.log('');

// Verify params are reasonable
console.log('Params:');
console.log('  IMPULSE_TRIGGER_DISTANCE =', IMPULSE_TRIGGER_DISTANCE);
console.log('  IMPULSE_MOTION_THRESHOLD =', IMPULSE_MOTION_THRESHOLD);
console.log('  IMPULSE_NUDGE_AMPLITUDE =', IMPULSE_NUDGE_AMPLITUDE);
console.log('  IMPULSE_DECAY_TIME =', IMPULSE_DECAY_TIME);
console.log('');

// Edge cases: motion just below threshold
resetImpulse();
const result1 = shouldTriggerImpulse(IMPULSE_MOTION_THRESHOLD - 1, IMPULSE_TRIGGER_DISTANCE + 100);
console.log('Motion just below threshold (9999 vs 10000), far distance: triggered?', result1, '(expect false)');

// Edge cases: motion just above threshold
resetImpulse();
const result2 = shouldTriggerImpulse(IMPULSE_MOTION_THRESHOLD + 1, IMPULSE_TRIGGER_DISTANCE + 100);
console.log('Motion just above threshold (10001 vs 10000), far distance: triggered?', result2, '(expect true)');

// Edge cases: distance just inside band
resetImpulse();
const result3 = shouldTriggerImpulse(IMPULSE_MOTION_THRESHOLD + 100, IMPULSE_TRIGGER_DISTANCE - 1);
console.log('Large motion, distance just inside band (1999 vs 2000): triggered?', result3, '(expect false)');

// Edge cases: distance just outside band
resetImpulse();
const result4 = shouldTriggerImpulse(IMPULSE_MOTION_THRESHOLD + 100, IMPULSE_TRIGGER_DISTANCE + 1);
console.log('Large motion, distance just outside band (2001 vs 2000): triggered?', result4, '(expect true)');

// Both at exact threshold
resetImpulse();
const result5 = shouldTriggerImpulse(IMPULSE_MOTION_THRESHOLD, IMPULSE_TRIGGER_DISTANCE);
console.log('Both at exact thresholds: triggered?', result5, '(expect true)');

// Decay test: trigger, then advance past decay time
resetImpulse();
shouldTriggerImpulse(IMPULSE_MOTION_THRESHOLD * 2, IMPULSE_TRIGGER_DISTANCE * 2);
console.log('');
console.log('Decay test:');
console.log('  After trigger, impulse active?', isImpulseActive(), '(expect true)');
applyImpulseDecay(IMPULSE_DECAY_TIME + 0.01);
console.log('  After decay time + epsilon, impulse active?', isImpulseActive(), '(expect false)');

// Amplitude test
resetImpulse();
shouldTriggerImpulse(IMPULSE_MOTION_THRESHOLD * 2, IMPULSE_TRIGGER_DISTANCE * 2);
const offset = getImpulseOffset();
const amp = Math.hypot(offset.x, offset.y);
console.log('');
console.log('Amplitude test:');
console.log('  Nudge amplitude =', amp, '(expect <=', IMPULSE_NUDGE_AMPLITUDE, ')');

// Near motion doesn't trigger
resetImpulse();
shouldTriggerImpulse(IMPULSE_MOTION_THRESHOLD * 10, IMPULSE_TRIGGER_DISTANCE * 0.5);
console.log('');
console.log('Near motion test:');
console.log('  Near motion (1/4 distance) with large motion: impulse active?', isImpulseActive(), '(expect false)');

// Small distant motion doesn't trigger
resetImpulse();
shouldTriggerImpulse(IMPULSE_MOTION_THRESHOLD * 0.1, IMPULSE_TRIGGER_DISTANCE * 2);
console.log('  Distant small motion (1/10 threshold): impulse active?', isImpulseActive(), '(expect false)');

console.log('');
console.log('=== Probe complete ===');