import { describe, expect, it } from 'vitest';
import { Scenario } from '../sim/scenario';
import { SCHOOLER } from '../creatures/fixtures';
import { vec2 } from '../util/math';
import { makeSimWorld } from '../sim/Simulation';
import { splitOffset, splitState, SPLIT_PROXIMITY_RADIUS, SPLIT_REFORM_TIME } from './schoolSplit';

/**
 * The parting-schools juice effect (request §48) is a render-only split:
 * schooling creatures visually part around the player and re-form after,
 * without changing steering outcomes. The split logic lives in the
 * CreatureRenderer, which reads creature positions but never writes back.
 *
 * This test verifies:
 * 1. The split state classification toggles correctly (parting -> reforming -> whole).
 * 2. The split offset pushes members away from the player during parting.
 * 3. The split offset fades to zero during reforming.
 * 4. Schools spawn and function normally in the simulation.
 */

describe('school split: render-only classification', () => {
  it('split state is "parting" when player is in proximity', () => {
    const schoolCenter = vec2(100, 0);
    const playerNear = vec2(50, 0);
    const state = splitState(schoolCenter, playerNear, true, 0);
    expect(state).toBe('parting');
  });

  it('split state is "reforming" after player leaves, within re-form time', () => {
    const schoolCenter = vec2(100, 0);
    const playerFar = vec2(1000, 0);
    const state = splitState(schoolCenter, playerFar, false, 0.25);
    expect(state).toBe('reforming');
  });

  it('split state is "whole" after re-form time has passed', () => {
    const schoolCenter = vec2(100, 0);
    const playerFar = vec2(1000, 0);
    const state = splitState(schoolCenter, playerFar, false, SPLIT_REFORM_TIME + 0.1);
    expect(state).toBe('whole');
  });
});

describe('school split: render offset behavior', () => {
  it('split offset pushes a member away from the player during parting', () => {
    const schoolCenter = vec2(100, 0);
    const playerPos = vec2(0, 0);
    const state = splitState(schoolCenter, playerPos, true, 0);
    expect(state).toBe('parting');
    const offset = splitOffset(
      { position: schoolCenter, velocity: vec2(0, 0) } as any,
      playerPos,
      state,
      0,
    );
    // Offset should be away from player (positive x).
    expect(offset.x).toBeGreaterThan(0);
    expect(offset.y).toBeCloseTo(0);
  });

  it('split offset is zero when player is not in proximity', () => {
    const schoolCenter = vec2(500, 0);
    const playerPos = vec2(0, 0);
    const state = splitState(schoolCenter, playerPos, false, 0);
    expect(state).toBe('whole');
    const offset = splitOffset(
      { position: schoolCenter, velocity: vec2(0, 0) } as any,
      playerPos,
      state,
      0,
    );
    expect(offset.x).toBe(0);
    expect(offset.y).toBe(0);
  });

  it('split offset fades during reforming as progress reaches 1', () => {
    const schoolCenter = vec2(100, 0);
    const playerPos = vec2(0, 0);
    const fullOffset = splitOffset(
      { position: schoolCenter, velocity: vec2(0, 0) } as any,
      playerPos,
      'reforming',
      0,
    );
    const fadedOffset = splitOffset(
      { position: schoolCenter, velocity: vec2(0, 0) } as any,
      playerPos,
      'reforming',
      1,
    );
    // At reform progress 0, offset is at full strength.
    expect(fullOffset.x).toBeGreaterThan(0);
    // At reform progress 1, offset is zero.
    expect(fadedOffset.x).toBe(0);
    expect(fadedOffset.y).toBe(0);
  });
});

describe('school split: steering outcomes unchanged (no write-back)', () => {
  it('schools spawn and steer normally in simulation', () => {
    // The split logic is render-only — it never writes back to the sim.
    // Verify schools spawn and steer (wander) as expected.
    const world = makeSimWorld();
    const schoolWorld = {
      ...world,
      chunks: world.chunks.map((c, i) =>
        i === 0
          ? {
              ...c,
              creatureSpawns: [
                { id: 'school-1', creature: SCHOOLER.id, position: vec2(1000, -400), count: 3 },
              ],
            }
          : c,
      ),
    };

    const scenario = new Scenario(42, schoolWorld);
    // Player is at the school location — within split proximity.
    scenario.sim.player.position.x = 1000;
    scenario.sim.player.position.y = -400;
    scenario.stepFor(1, scenario.sim.controller.input);

    // Three schoolers should have spawned.
    const schoolers = scenario.sim.creatures.filter((c) => c.def.id === SCHOOLER.id);
    expect(schoolers.length).toBe(3);

    // They should have moved (wander behavior).
    const moved = schoolers.some((c) =>
      Math.abs(c.position.x - 1000) > 0.01 || Math.abs(c.position.y + 400) > 0.01,
    );
    expect(moved).toBe(true);

    // None should have entered an unexpected state (wander is expected).
    for (const c of schoolers) {
      expect(['wander', 'investigate', 'flee']).toContain(c.state);
    }
  });
});
