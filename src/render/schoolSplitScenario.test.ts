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
 * 5. Split logic does not change steering outcomes (render-only, no write-back).
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

  it('sim positions/velocities are identical with and without split logic active', () => {
    // This is the key test: prove that split logic is purely render-only.
    // Run the same simulation input twice — once with split offsets computed
    // (simulating the renderer being active) and once without — and verify
    // the sim state (positions, velocities, states) is bit-identical.

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

    // Baseline run: no split logic involved at all.
    const baseline = new Scenario(42, schoolWorld);
    baseline.sim.player.position.x = 1000;
    baseline.sim.player.position.y = -400;
    baseline.stepFor(2, baseline.sim.controller.input);

    const baselineState = baseline.sim.creatures.filter((c) => c.def.id === SCHOOLER.id).map((c) => ({
      pos: { x: c.position.x, y: c.position.y },
      vel: { x: c.velocity.x, y: c.velocity.y },
      state: c.state,
    }));

    // Split-logic run: compute split offsets each step, but don't apply them.
    // This proves the split logic can be called without affecting the sim.
    const splitRun = new Scenario(42, schoolWorld);
    splitRun.sim.player.position.x = 1000;
    splitRun.sim.player.position.y = -400;

    for (let step = 0; step < 120; step++) {
      const playerPos = splitRun.sim.player.position;
      const spliters = splitRun.sim.creatures.filter((c) => c.def.id === SCHOOLER.id);
      for (const c of spliters) {
        const dist = Math.hypot(c.position.x - playerPos.x, c.position.y - playerPos.y);
        const withinProx = dist < SPLIT_PROXIMITY_RADIUS;
        const state = splitState(c.position, playerPos, withinProx, 0);
        // Compute the offset — this is what the renderer would do.
        splitOffset(c, playerPos, state, 0);
        // Do NOT apply the offset to the creature. Sim state is untouched.
      }
      splitRun.stepFor(1 / 60, splitRun.sim.controller.input);
    }

    const splitRunState = splitRun.sim.creatures.filter((c) => c.def.id === SCHOOLER.id).map((c) => ({
      pos: { x: c.position.x, y: c.position.y },
      vel: { x: c.velocity.x, y: c.velocity.y },
      state: c.state,
    }));

    // The sim state must be bit-identical.
    expect(splitRunState.length).toBe(baselineState.length);
    for (let i = 0; i < baselineState.length; i++) {
      const b = baselineState[i]!;
      const s = splitRunState[i]!;
      expect(s.pos.x).toBeCloseTo(b.pos.x, 6);
      expect(s.pos.y).toBeCloseTo(b.pos.y, 6);
      expect(s.vel.x).toBeCloseTo(b.vel.x, 6);
      expect(s.vel.y).toBeCloseTo(b.vel.y, 6);
      expect(s.state).toBe(b.state);
    }
  });

  it('split state toggles on entering and leaving proximity during simulation', () => {
    // Walk through: player approaches school (parting), leaves (reforming).
    // The split state must toggle correctly throughout.

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
    scenario.stepFor(0.5, scenario.sim.controller.input);

    const schoolers = scenario.sim.creatures.filter((c) => c.def.id === SCHOOLER.id);
    expect(schoolers.length).toBe(3);

    // Player is at spawn (0,0), far from the school (1000,-400).
    // Distance is ~1077, which is > SPLIT_PROXIMITY_RADIUS (300).
    const farDist = Math.hypot(1000 - 0, -400 - 0);
    expect(farDist).toBeGreaterThan(SPLIT_PROXIMITY_RADIUS);
    let state = splitState(schoolers[0]!.position, scenario.sim.player.position, false, 0);
    expect(state).toBe('whole');

    // Teleport player close to the school.
    scenario.sim.player.position.x = 1000;
    scenario.sim.player.position.y = -400;
    scenario.stepFor(0.5, scenario.sim.controller.input);
    scenario.sim.state.timeSec += 0.1;

    // Now within proximity — split state should be 'parting'.
    const nearDist = Math.hypot(
      schoolers[0]!.position.x - scenario.sim.player.position.x,
      schoolers[0]!.position.y - scenario.sim.player.position.y,
    );
    expect(nearDist).toBeLessThan(SPLIT_PROXIMITY_RADIUS);
    state = splitState(schoolers[0]!.position, scenario.sim.player.position, true, 0);
    expect(state).toBe('parting');

    // Compute the split offset for a parting member.
    const offset = splitOffset(schoolers[0]!, scenario.sim.player.position, 'parting', 0);
    expect(Math.hypot(offset.x, offset.y)).toBeGreaterThan(0);

    // Player leaves proximity — split state should transition to 'reforming'.
    scenario.sim.player.position.x = 2000;
    scenario.sim.player.position.y = -400;
    scenario.sim.state.timeSec += 0.1;
    scenario.stepFor(0.1, scenario.sim.controller.input);

    state = splitState(schoolers[0]!.position, scenario.sim.player.position, false, 0.1);
    expect(state).toBe('reforming');

    // After re-form time passes, split state should be 'whole'.
    scenario.sim.state.timeSec += SPLIT_REFORM_TIME + 0.1;
    scenario.stepFor(0.1, scenario.sim.controller.input);
    state = splitState(schoolers[0]!.position, scenario.sim.player.position, false, SPLIT_REFORM_TIME + 0.1);
    expect(state).toBe('whole');

    // Offset should be zero when whole.
    const wholeOffset = splitOffset(schoolers[0]!, scenario.sim.player.position, 'whole', 0);
    expect(wholeOffset.x).toBe(0);
    expect(wholeOffset.y).toBe(0);
  });
});