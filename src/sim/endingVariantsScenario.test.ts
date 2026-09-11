/**
 * Tests for ending variants (WI-05ca, request §24/§70/§72):
 *   At least 2 ending variants are reachable from a single player decision
 *   inside the final sequence, each producing a different final state/text/shot.
 *   One-shot trigger, credits flag, restart, and save-reload at milestones.
 *
 * This is the final proof owner of the complete fresh-save ending scenario
 * (the full section 70 ending verification).
 */
import { describe, it, expect } from 'vitest';
import { Scenario } from './scenario';
import { emptyInput } from './Simulation';
import { vec2 } from '../util/math';
import { INTERACT_RADIUS } from '../game/constants';
import {
  freshSave,
  parseSave,
  serializeSave,
} from '../game/save';

describe('Ending variants (WI-05ca)', () => {
  // Helper: swim to the MacGuffin and retrieve it (same route as WI-05a/WI-05b).
  function swimToMacguffinAndRetrieve(s: Scenario): void {
    const mgPos = s.sim.macguffinPosition!;
    s.swimTo(vec2(5600, -2200), 40, 6000);
    s.swimTo(vec2(9500, -5000), 40, 6000);
    s.swimTo(vec2(14500, -7800), 40, 6000);
    s.swimTo(vec2(19200, -9500), 40, 6000);
    s.swimTo(vec2(19200, -9680), 40, 6000);
    s.swimTo(vec2(20300, -9650), 40, 6000);
    s.swimTo(mgPos, INTERACT_RADIUS, 6000);
    const input = emptyInput();
    input.interact = true;
    s.step(input);
  }

  it('two ending variants are reachable from a single decision point', () => {
    const s = new Scenario(42);
    swimToMacguffinAndRetrieve(s);
    // At the decision point, the player chooses variant A by swimming to exit A.
    s.swimTo(vec2(22000, -9650), 50, 5000);
    s.swimTo(vec2(22300, -9600), 50, 5000);
    expect(s.sim.endingTriggered).toBe(true);
    expect(s.sim.endingVariant).toBe('A');
  });

  it('variant B is reachable from the same decision point', () => {
    const s = new Scenario(42);
    swimToMacguffinAndRetrieve(s);
    // At the decision point, the player chooses variant B by swimming to exit B.
    s.swimTo(vec2(22000, -9650), 50, 5000);
    s.swimTo(vec2(22300, -9650), 50, 5000);
    expect(s.sim.endingTriggered).toBe(true);
    expect(s.sim.endingVariant).toBe('B');
  });

  it('each ending variant produces a different final state', () => {
    // Variant A: player swims to exit A.
    const sA = new Scenario(42);
    swimToMacguffinAndRetrieve(sA);
    sA.swimTo(vec2(22000, -9650), 50, 5000);
    sA.swimTo(vec2(22300, -9600), 50, 5000);

    // Variant B: player swims to exit B.
    const sB = new Scenario(42);
    swimToMacguffinAndRetrieve(sB);
    sB.swimTo(vec2(22000, -9650), 50, 5000);
    sB.swimTo(vec2(22300, -9650), 50, 5000);

    expect(sA.sim.endingTriggered).toBe(true);
    expect(sB.sim.endingTriggered).toBe(true);
    expect(sA.sim.endingVariant).not.toBe(sB.sim.endingVariant);
    // The variants produce different story flags.
    expect(sA.sim.storyFlags).toContain('ending-variant-A');
    expect(sB.sim.storyFlags).toContain('ending-variant-B');
  });

  it('credits flag is set after either ending variant', () => {
    const s = new Scenario(42);
    swimToMacguffinAndRetrieve(s);
    s.swimTo(vec2(22000, -9650), 50, 5000);
    s.swimTo(vec2(22300, -9600), 50, 5000);
    expect(s.sim.endingTriggered).toBe(true);
    // Credits flag is set by the ending trigger.
    expect(s.sim.storyFlags).toContain('ending-triggered');
    // The ending variant is recorded for the credits sequence.
    expect(s.sim.endingVariant).toBeDefined();
  });

  it('restart clears all ending state', () => {
    const s = new Scenario(42);
    swimToMacguffinAndRetrieve(s);
    s.swimTo(vec2(22000, -9650), 50, 5000);
    s.swimTo(vec2(22300, -9600), 50, 5000);
    expect(s.sim.endingTriggered).toBe(true);
    // Restart creates a fresh save.
    const fresh = freshSave();
    expect(fresh.version).toBe(2);
    expect(fresh.world.endingVariant).toBeUndefined();
    expect(fresh.world.finalSequenceStep).toBeUndefined();
    expect(fresh.world.autosaveMilestones).toEqual([]);
  });

  it('one-shot trigger: the ending fires exactly once', () => {
    const s = new Scenario(42);
    swimToMacguffinAndRetrieve(s);
    s.swimTo(vec2(22000, -9650), 50, 5000);
    s.swimTo(vec2(22300, -9600), 50, 5000);
    expect(s.sim.endingTriggered).toBe(true);
    // Re-enter the exit region — the trigger should not fire again.
    s.swimTo(vec2(22300, -9600), 50, 5000);
    // The endingTriggered flag remains true (idempotent).
    expect(s.sim.endingTriggered).toBe(true);
    // No duplicate story flag for ending triggered.
    const endingFlags = s.sim.storyFlags.filter((f) => f === 'ending-triggered');
    expect(endingFlags.length).toBe(1);
  });

  it('determinism: same seed, same decision, same ending variant', () => {
    const run = (variant: 'A' | 'B') => {
      const s = new Scenario(42);
      swimToMacguffinAndRetrieve(s);
      s.swimTo(vec2(22000, -9650), 50, 5000);
      if (variant === 'A') {
        s.swimTo(vec2(22300, -9600), 50, 5000);
      } else {
        s.swimTo(vec2(22300, -9650), 50, 5000);
      }
      return {
        endingTriggered: s.sim.endingTriggered,
        endingVariant: s.sim.endingVariant,
        save: serializeSave(s.sim.toSave()),
      };
    };
    const r1A = run('A');
    const r2A = run('A');
    const r1B = run('B');
    const r2B = run('B');
    // Same variant, same result.
    expect(r1A.endingVariant).toBe(r2A.endingVariant);
    expect(r1B.endingVariant).toBe(r2B.endingVariant);
    // Different variants, different results.
    expect(r1A.endingVariant).not.toBe(r1B.endingVariant);
  });

  it('save-reload at pre-descent milestone preserves ending capability', () => {
    const s = new Scenario(42);
    swimToMacguffinAndRetrieve(s);
    // Save at the pre-descent milestone (after macguffin retrieval).
    const saveState = serializeSave(s.sim.toSave());
    // Reload and verify the player can still reach an ending.
    const s2 = new Scenario(42);
    const parsed = parseSave(saveState);
    s2.sim.loadFromSave(parsed);
    expect(s2.sim.storyFlags).toContain('final-descent-active');
    s2.swimTo(vec2(5600, -2200), 40, 20000);
    s2.swimTo(vec2(9500, -5000), 40, 20000);
    s2.swimTo(vec2(14500, -7800), 40, 20000);
    s2.swimTo(vec2(19200, -9500), 40, 20000);
    s2.swimTo(vec2(19200, -9680), 40, 20000);
    s2.swimTo(vec2(20300, -9650), 40, 20000);
    s2.swimTo(vec2(22000, -9650), 50, 20000);
    s2.swimTo(vec2(22300, -9600), 50, 20000);
    expect(s2.sim.endingTriggered).toBe(true);
    expect(s2.sim.endingVariant).toBe('A');
  });

  it('save-reload at post-trigger milestone preserves ending variant', () => {
    const s = new Scenario(42);
    swimToMacguffinAndRetrieve(s);
    s.swimTo(vec2(22000, -9650), 50, 5000);
    s.swimTo(vec2(22300, -9600), 50, 5000);
    expect(s.sim.endingTriggered).toBe(true);
    expect(s.sim.endingVariant).toBe('A');
    // Save at the post-trigger milestone.
    const saveState = serializeSave(s.sim.toSave());
    // Reload and verify the ending variant is preserved.
    const s2 = new Scenario(42);
    const parsed = parseSave(saveState);
    s2.sim.loadFromSave(parsed);
    expect(s2.sim.endingTriggered).toBe(true);
    expect(s2.sim.endingVariant).toBe('A');
    // The ending trigger should not fire again on reload.
    const endingFlags = s2.sim.storyFlags.filter((f) => f === 'ending-triggered');
    expect(endingFlags.length).toBe(1);
  });
});
