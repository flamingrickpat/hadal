import { describe, expect, it } from 'vitest';
import {
  IMPULSE_TRIGGER_DISTANCE,
  IMPULSE_MOTION_THRESHOLD,
  IMPULSE_NUDGE_AMPLITUDE,
  IMPULSE_DECAY_TIME,
} from './impulseParams';
import {
  shouldTriggerImpulse,
  applyImpulseDecay,
  resetImpulse,
  getImpulseOffset,
} from './impulseFlag';

describe('impulse trigger params (request §48 distant-motion impulse)', () => {
  it('distant large motion triggers an impulse', () => {
    // Large creature moving fast at a distance beyond the trigger band
    const motion = IMPULSE_MOTION_THRESHOLD * 2; // well above threshold
    const distance = IMPULSE_TRIGGER_DISTANCE * 1.5; // well beyond trigger band
    expect(shouldTriggerImpulse(motion, distance)).toBe(true);
  });

  it('nearby large motion does not trigger (too close)', () => {
    // Large creature but too close to the camera
    const motion = IMPULSE_MOTION_THRESHOLD * 2;
    const distance = IMPULSE_TRIGGER_DISTANCE * 0.5; // inside the trigger band
    expect(shouldTriggerImpulse(motion, distance)).toBe(false);
  });

  it('distant small motion does not trigger (too small)', () => {
    // Small motion at a distance — not enough to feel
    const motion = IMPULSE_MOTION_THRESHOLD * 0.5; // below threshold
    const distance = IMPULSE_TRIGGER_DISTANCE * 1.5;
    expect(shouldTriggerImpulse(motion, distance)).toBe(false);
  });

  it('motion at exact threshold and distance triggers', () => {
    // Edge case: exactly at both boundaries
    expect(shouldTriggerImpulse(IMPULSE_MOTION_THRESHOLD, IMPULSE_TRIGGER_DISTANCE)).toBe(true);
  });

  it('motion just below threshold does not trigger', () => {
    expect(shouldTriggerImpulse(IMPULSE_MOTION_THRESHOLD - 0.001, IMPULSE_TRIGGER_DISTANCE)).toBe(false);
  });

  it('distance just inside the band does not trigger', () => {
    expect(shouldTriggerImpulse(IMPULSE_MOTION_THRESHOLD, IMPULSE_TRIGGER_DISTANCE - 0.001)).toBe(false);
  });
});

describe('impulse flag transitions', () => {
  it('sets the flag on distant large motion', () => {
    resetImpulse();
    shouldTriggerImpulse(IMPULSE_MOTION_THRESHOLD * 2, IMPULSE_TRIGGER_DISTANCE * 1.5);
    expect(getImpulseOffset()).not.toBeNull();
  });

  it('does not set the flag on nearby motion', () => {
    resetImpulse();
    shouldTriggerImpulse(IMPULSE_MOTION_THRESHOLD * 2, IMPULSE_TRIGGER_DISTANCE * 0.5);
    expect(getImpulseOffset()).toBeNull();
  });

  it('decays to zero over time', () => {
    resetImpulse();
    shouldTriggerImpulse(IMPULSE_MOTION_THRESHOLD * 2, IMPULSE_TRIGGER_DISTANCE * 1.5);
    expect(getImpulseOffset()).not.toBeNull();

    // Advance past the decay time
    applyImpulseDecay(IMPULSE_DECAY_TIME + 0.1);
    expect(getImpulseOffset()).toBeNull();
  });

  it('decays partially before full time', () => {
    resetImpulse();
    shouldTriggerImpulse(IMPULSE_MOTION_THRESHOLD * 2, IMPULSE_TRIGGER_DISTANCE * 1.5);
    const initial = getImpulseOffset()!;

    // Advance half the decay time
    applyImpulseDecay(IMPULSE_DECAY_TIME * 0.5);
    const partial = getImpulseOffset()!;

    expect(Math.hypot(partial.x, partial.y)).toBeLessThan(Math.hypot(initial.x, initial.y));
    expect(Math.hypot(partial.x, partial.y)).toBeGreaterThan(0);
  });

  it('has low amplitude nudge', () => {
    resetImpulse();
    shouldTriggerImpulse(IMPULSE_MOTION_THRESHOLD * 2, IMPULSE_TRIGGER_DISTANCE * 1.5);
    const offset = getImpulseOffset()!;
    expect(Math.hypot(offset.x, offset.y)).toBeLessThanOrEqual(IMPULSE_NUDGE_AMPLITUDE);
  });
});

describe('impulse params are reasonable', () => {
  it('trigger distance is a reasonable world-scale value', () => {
    // Distant motion should be far enough to feel "distant" but not impossibly far
    expect(IMPULSE_TRIGGER_DISTANCE).toBeGreaterThan(500);
    expect(IMPULSE_TRIGGER_DISTANCE).toBeLessThan(10000);
  });

  it('nudge amplitude is low (presentation only, not steering)', () => {
    // The nudge should be small — a subtle nudge, not a camera shake
    expect(IMPULSE_NUDGE_AMPLITUDE).toBeGreaterThan(0);
    expect(IMPULSE_NUDGE_AMPLITUDE).toBeLessThan(100);
  });

  it('decay time is short', () => {
    expect(IMPULSE_DECAY_TIME).toBeGreaterThan(0);
    expect(IMPULSE_DECAY_TIME).toBeLessThan(5);
  });
});
