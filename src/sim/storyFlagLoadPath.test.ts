/**
 * Tests — the beat completion story flags survive the live save/load path
 * (WI-04a review fix, request §36, §70): the live Game (src/game/Game.ts)
 * constructs the Simulation and then calls loadFromSave at boot, exactly what
 * `createSimulationFromSave` does. `loadFromSave` must preserve the identity
 * of the `storyFlags` array the constructor shared with the trigger system,
 * so a `setStoryFlag` fired after load is visible in `sim.storyFlags` (what
 * the TriggerContext reads) and in `toSave()` (what persists). The headless
 * beat scenarios construct the Simulation directly and therefore cannot catch
 * a load-path split; this test does.
 */
import { describe, expect, it } from 'vitest';
import {
  createSimulation,
  createSimulationFromSave,
  emptyInput,
  makeSimWorld,
} from './Simulation';

const FIXED_DT = 1 / 60;

describe('trigger-set story flags across the live load path', () => {
  it('a fired beat flag reaches sim.storyFlags and the save after loadFromSave', () => {
    const save = createSimulation(makeSimWorld()).toSave();
    const sim = createSimulationFromSave(save);
    // The constructor shares the storyFlags array with the trigger state;
    // the load must not re-assign it into a different array.
    expect(sim.triggerState.storyFlags).toBe(sim.storyFlags);
    // Cross the s2 depth line (15800 is the clear abyss descent column).
    sim.teleportTo(15800, 9300);
    sim.step(emptyInput(), FIXED_DT);
    expect(sim.triggers.firedIds.has('enc-beat-s2')).toBe(true);
    expect(sim.storyFlags).toContain('beat-s2');
    expect(sim.toSave().world.storyFlags).toContain('beat-s2');
  });

  it('flags already in the save survive the round trip into the trigger context', () => {
    const fresh = createSimulation(makeSimWorld());
    fresh.storyFlags.push('beat-s1');
    const sim = createSimulationFromSave(fresh.toSave());
    expect(sim.storyFlags).toContain('beat-s1');
    expect(sim.triggerState.storyFlags).toContain('beat-s1');
    sim.teleportTo(15800, 9300);
    sim.step(emptyInput(), FIXED_DT);
    expect(sim.triggers.firedIds.has('enc-beat-s2')).toBe(true);
    const both = sim.toSave().world.storyFlags;
    expect(both).toContain('beat-s1');
    expect(both).toContain('beat-s2');
  });
});
