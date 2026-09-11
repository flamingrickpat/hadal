import { describe, expect, it } from 'vitest';
import { Scenario } from './scenario';
import { emptyInput } from './Simulation';
import type { Vec2 } from '../util/math';

function nodePosition(id: string): Vec2 {
  for (const chunk of import('../world/worldData').GREYBOX_WORLD) {
    for (const node of chunk.resourceNodes ?? []) {
      if (node.id === id) return node.position;
    }
  }
  throw new Error(`no resource node ${id}`);
}

describe('depth record signal (request §7, §26, section 48)', () => {
  it('fires the new depth record signal exactly when maxDepth increases', () => {
    const s = new Scenario(1);
    const sim = s.sim;

    // Start at the spawn (depth ~0)
    expect(sim.player.newDepthRecord).toBe(false);
    expect(sim.player.maxDepth).toBe(0);

    // Dive deeper — this should set a new depth record and fire the signal
    const diveInput = emptyInput();
    diveInput.thrustY = -1; // dive down
    s.stepFor(15, diveInput);

    // After diving, the player should be deeper
    expect(sim.player.depth).toBeGreaterThan(100);
    expect(sim.player.maxDepth).toBeGreaterThan(100);
    expect(sim.player.newDepthRecord).toBe(true);

    // The signal is consumed once (by the HUD), so it should be false after
    // the HUD reads it. Simulate HUD reading it.
    sim.player.newDepthRecord = false;

    // Swim to a shallower depth — should NOT re-fire
    const upInput = emptyInput();
    upInput.thrustY = 1; // swim up
    s.stepFor(5, upInput);
    expect(sim.player.newDepthRecord).toBe(false);
  });

  it('does not fire when swimming at or shallower than the record', () => {
    const s = new Scenario(1);
    const sim = s.sim;

    // Dive deep to set a record
    const diveInput = emptyInput();
    diveInput.thrustY = -1;
    s.stepFor(20, diveInput);

    // Reset the signal (HUD consumed it)
    sim.player.newDepthRecord = false;
    const record = sim.player.maxDepth;

    // Swim at the same depth — should NOT re-fire
    const neutralInput = emptyInput();
    s.stepFor(5, neutralInput);
    expect(sim.player.newDepthRecord).toBe(false);

    // Swim shallower — should NOT re-fire
    const upInput = emptyInput();
    upInput.thrustY = 1;
    s.stepFor(10, upInput);
    expect(sim.player.newDepthRecord).toBe(false);
    expect(sim.player.maxDepth).toBe(record);
  });
});
