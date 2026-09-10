// Repro for the reviewer finding on WI-04a: after the live game's load path
// (Simulation constructed, then loadFromSave — exactly what src/game/Game.ts
// does at boot), the trigger `setStoryFlag` action writes to the constructor's
// array reference, while sim.storyFlags (what toSave() persists and what the
// trigger context reads) is the re-assigned save array. The beat completion
// flags therefore never reach sim.storyFlags in the live game.
//
// Run: npx vitest run --config agents/tasks/hadalv2.execute_leaf.WI-04a.__item_WI-04a.__attempt_0001/scratch/work-item-reviewer/wi04a-flag-repro/vitest.config.ts
import { describe, expect, it } from 'vitest';
import {
  createSimulation,
  createSimulationFromSave,
  emptyInput,
  makeSimWorld,
} from '../../../../../../src/sim/Simulation';

const FIXED_DT = 1 / 60;

describe('trigger-set story flags across the live load path (reviewer repro)', () => {
  it('fresh construction (the scenario path): the flag reaches sim.storyFlags', () => {
    const sim = createSimulation(makeSimWorld());
    // Cross the s2 depth line (15800 is the clear abyss descent column).
    sim.teleportTo(15800, 9300);
    sim.step(emptyInput(), FIXED_DT);
    expect(sim.triggers.firedIds.has('enc-beat-s2')).toBe(true);
    expect(sim.storyFlags).toContain('beat-s2');
    expect(sim.triggerState.storyFlags).toBe(sim.storyFlags); // same reference
  });

  it('live load path (Game.ts: construct + loadFromSave): the flag is orphaned', () => {
    const save = createSimulation(makeSimWorld()).toSave();
    const sim = createSimulationFromSave(save);
    expect(sim.triggerState.storyFlags).not.toBe(sim.storyFlags); // already split at boot
    sim.teleportTo(15800, 9300);
    sim.step(emptyInput(), FIXED_DT);
    expect(sim.triggers.firedIds.has('enc-beat-s2')).toBe(true);
    expect(sim.triggerState.storyFlags).toContain('beat-s2'); // orphaned array
    expect(sim.storyFlags).not.toContain('beat-s2'); // not in the persisted/context array
    expect(sim.toSave().world.storyFlags).not.toContain('beat-s2'); // not persisted
  });
});
