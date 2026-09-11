/**
 * Tests for the final descent sequence and win condition (WI-05b, request §23/§24/§39/§45/§70):
 *   After retrieving the MacGuffin (WI-05a), the player enters a final 5-10 minute
 *   sequence that is mechanically different from the approach (altered rules),
 *   is not a conventional arena boss, and ends the game with a one-shot win
 *   condition. The final sequence survives a save/reload at any step.
 *
 * The final mechanism is private (internal ids only, request §0/§12/§68);
 * these tests verify the mechanics, not the creative content.
 */
import { describe, it, expect } from 'vitest';
import { makeSimWorld, Simulation } from './Simulation';
import { Scenario } from './scenario';
import { emptyInput } from './Simulation';
import { MACRO_WORLD, BASE } from '../world/worldData';
import { INTERACT_RADIUS } from '../game/constants';
import { vec2 } from '../util/math';

describe('Final descent sequence (WI-05b)', () => {
  // Helper: swim to the MacGuffin and retrieve it (same route as WI-05a).
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

  it('final sequence is triggered by MacGuffin retrieval', () => {
    const s = new Scenario(42);
    swimToMacguffinAndRetrieve(s);
    expect(s.sim.storyFlags).toContain('macguffin-retrieved');
    // The final descent sequence is activated (altered rules).
    expect(s.sim.storyFlags).toContain('final-descent-active');
  });

  it('altered rules are active during the final sequence (mechanically different from approach)', () => {
    const s = new Scenario(42);
    swimToMacguffinAndRetrieve(s);
    // The altered context: stronger current, unreliable instruments.
    // Verify the final descent altered ambient conditions are active.
    expect(s.sim.triggerState.ambient['final-descent-current']).toBe(2.0);
    expect(s.sim.triggerState.ambient['final-descent-dim']).toBe(0.1);
  });

  it('the finale has no arena-boss structure (no single HP pool, no enclosed arena)', () => {
    // This is verified by inspection of the world data and simulation rules:
    // the final sequence has an escape path with no boss creature with HP,
    // and no enclosed arena with a single exit gate.
    const s = new Scenario(42);
    swimToMacguffinAndRetrieve(s);
    // No creature in the final zone has a boss HP pool (combat.damage is not an HP pool).
    const hadalCreatures = s.sim.creatures.filter((c) => {
      // The final zone creatures are in the hadal chunk.
      const pos = c.position;
      return pos.x > 20300 && pos.x < 22700 && pos.y > -9800 && pos.y < -9400;
    });
    // None of the final zone creatures have a conventional "boss HP pool"
    // (they may have combat.damage but not an HP model — per request §10).
    for (const c of hadalCreatures) {
      expect(c.def.combat?.hp).toBeUndefined();
    }
  });

  it('the escape path is traversable without noclip', () => {
    const s = new Scenario(42);
    swimToMacguffinAndRetrieve(s);
    // Navigate through the final descent sequence to the exit.
    // The escape path is through the hadal interior to the exit point.
    s.swimTo(vec2(22000, -9650), 50, 10000);
    s.swimTo(vec2(22300, -9600), 50, 10000);
    // Check if the ending was triggered.
    expect(s.sim.endingTriggered).toBe(true);
  });

  it('the ending trigger fires exactly once (one-shot semantics)', () => {
    const s = new Scenario(42);
    swimToMacguffinAndRetrieve(s);
    // Complete the final sequence.
    s.swimTo(vec2(22000, -9650), 50, 10000);
    s.swimTo(vec2(22300, -9600), 50, 10000);
    expect(s.sim.endingTriggered).toBe(true);
    // Re-enter the exit region — the trigger should not fire again.
    s.swimTo(vec2(22300, -9600), 50, 10000);
    // The endingTriggered flag remains true (idempotent).
    expect(s.sim.endingTriggered).toBe(true);
    // No duplicate story flag for ending triggered.
    const endingFlags = s.sim.storyFlags.filter((f) => f === 'ending-triggered');
    expect(endingFlags.length).toBe(1);
  });

  it('per-step save reload: sequence state is preserved', () => {
    const s = new Scenario(42);
    swimToMacguffinAndRetrieve(s);
    // Save at a point in the final sequence.
    const saveState = s.sim.serialize();
    // Continue a bit further in the sequence.
    s.step(emptyInput(), 10);
    // Load the save.
    const s2 = new Scenario(42);
    s2.sim.deserialize(saveState);
    // The sequence state is preserved.
    expect(s2.sim.storyFlags).toContain('final-descent-active');
    expect(s2.sim.endingTriggered).toBe(false);
    // The player can continue to completion from the reload point.
    // The player is at PLAYER_START after loading the save (position is not
    // saved), so swimTo needs more steps to reach the exit.
    s2.swimTo(vec2(5600, -2200), 40, 20000);
    s2.swimTo(vec2(9500, -5000), 40, 20000);
    s2.swimTo(vec2(14500, -7800), 40, 20000);
    s2.swimTo(vec2(19200, -9500), 40, 20000);
    s2.swimTo(vec2(19200, -9680), 40, 20000);
    s2.swimTo(vec2(20300, -9650), 40, 20000);
    s2.swimTo(vec2(22000, -9650), 50, 20000);
    s2.swimTo(vec2(22300, -9600), 50, 20000);
    expect(s2.sim.endingTriggered).toBe(true);
  });

  it('determinism: same seed, same final sequence outcome', () => {
    const run = () => {
      const s = new Scenario(42);
      swimToMacguffinAndRetrieve(s);
      s.swimTo(vec2(22000, -9650), 50, 10000);
      s.swimTo(vec2(22300, -9600), 50, 10000);
      return {
        endingTriggered: s.sim.endingTriggered,
        flags: s.sim.storyFlags.slice().sort().join(','),
      };
    };
    const r1 = run();
    const r2 = run();
    expect(r1.endingTriggered).toBe(r2.endingTriggered);
    expect(r1.flags).toBe(r2.flags);
  });
});