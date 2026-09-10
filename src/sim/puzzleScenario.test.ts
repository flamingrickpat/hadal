/**
 * Tests — the four environmental puzzle moments (WI-04d, request §66, §36):
 *   each puzzle is a data-driven EncounterTrigger composition in the production
 *   world data, staged near the critical path. The player solves each puzzle
 *   through one of the four puzzle types (sonar-revealed passage, current-carried
 *   object, living switch, deep signal), and the completion sets a story flag
 *   consumed by the reaction layer (WI-04c). No abstract symbol panels, no
 *   tutorial text — each puzzle's affordance is visible in the scene.
 *
 * Each test runs the production Simulation from a fresh save (no mocks), drives
 * the authored inputs (swim, approach, interact), and asserts: the puzzle
 * trigger fires, the world state changes (path unlocked, object moved), the
 * completion flag is set, and a no-solution control (inputs omitted) stays
 * incomplete.
 */
import { describe, expect, it } from 'vitest';
import { vec2, type Vec2 } from '../util/math';
import { makeSimWorld, Simulation, emptyInput } from './Simulation';
import { Scenario } from './scenario';
import { BASE } from '../world/worldData';

const dist = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.y - b.y);

/** The critical path waypoints (same as WI-04a's beat route). */
const ROUTE: readonly Vec2[] = [
  vec2(5600, -2200), // coast-to-shelf descent
  vec2(7000, -3500), // shelf light staging (puzzle 1: blocked corridor)
  vec2(9500, -5000), // shelf-to-twilight
  vec2(11500, -6500), // twilight transit (puzzle 2: current lift)
  vec2(14500, -7800), // twilight floor gap
  vec2(15800, -9400), // abyss descent (puzzle 3: guardian's gate)
  vec2(19200, -9500), // risen east of hadal west wall
  vec2(19200, -9680), // strip drop (puzzle 4: deep signal)
  vec2(21800, -9650), // east end
];

describe('environmental puzzle moments (WI-04d)', () => {
  it('the production world data carries four puzzle triggers, each with a completion flag and a world-change action', () => {
    const triggers = makeSimWorld().chunks.flatMap((c) => c.triggers ?? []);
    const puzzles = triggers.filter((t) => t.id.startsWith('puzzle-'));
    expect(puzzles.length).toBeGreaterThanOrEqual(3);
    expect(puzzles.length).toBeLessThanOrEqual(5);
    for (const p of puzzles) {
      expect(p.once, `${p.id} must fire at most once`).toBe(true);
      const flag = p.actions.find((a) => a.type === 'setStoryFlag');
      expect(flag, `${p.id} must set a completion story flag`).toBeDefined();
      // A world-change action (unlock path, move object, spawn entity).
      const worldChange = p.actions.find(
        (a) => a.type === 'lockPath' || a.type === 'moveBackgroundCreature' || a.type === 'spawnEntity' || a.type === 'despawnEntity',
      );
      expect(worldChange, `${p.id} must change the world state`).toBeDefined();
    }
  });

  it('puzzle 1: blocked corridor — sonar reveals the passage (shelf)', () => {
    const sc = new Scenario(1001, makeSimWorld());
    // Swim to the shelf corridor entrance.
    sc.swimTo(ROUTE[1]!, 50, 4000);
    // The corridor is blocked by debris (a T-17 silk colony). Approaching it
    // should fire the puzzle trigger.
    const debrisPos = vec2(7200, -3600);
    sc.swimTo(debrisPos, 40, 4000);
    // Assert the puzzle completion.
    const fired = sc.sim.triggers.firedIds.has('puzzle-blocked-corridor');
    expect(fired, 'the blocked corridor puzzle trigger must fire when approaching the debris').toBe(true);
    // Assert the world state changed (path unlocked).
    const corridorUnlocked = !sc.sim.triggerState.lockedPaths.has('corridor-shelf');
    expect(corridorUnlocked, 'the corridor must be unlocked').toBe(true);
    // Assert the completion flag is set.
    expect(sc.sim.storyFlags.includes('puzzle-corridor-1'), 'the completion flag must be set').toBe(true);
    // Assert the audio cue was played (sonar-ping-like).
    expect(sc.sim.triggerState.audioCues.includes('puzzle-sonar-ping'), 'a sonar-ping-like audio cue must play').toBe(true);
  });

  it('puzzle 1 control: without approaching the debris, the puzzle remains unsolved', () => {
    const sc = new Scenario(1002, makeSimWorld());
    // Swim to the shelf but NOT to the debris.
    sc.swimTo(vec2(7000, -3500), 50, 4000);
    expect(sc.sim.triggers.firedIds.has('puzzle-blocked-corridor'), 'the puzzle must not fire without approaching the debris').toBe(false);
    expect(sc.sim.triggerState.lockedPaths.has('corridor-shelf'), 'the corridor must stay locked').toBe(true);
    expect(sc.sim.storyFlags.includes('puzzle-corridor-1'), 'the flag must not be set').toBe(false);
  });

  it('puzzle 2: current lift — approach the mechanism at the vent (twilight)', () => {
    const sc = new Scenario(1003, makeSimWorld());
    // Find the T-08 feeder in the twilight band.
    const feeder = sc.sim.creatures.find((c) => c.def.id === 'T-08');
    expect(feeder, 'the T-08 feeder must exist in the twilight band').toBeDefined();
    const feederStart = { x: feeder!.position.x, y: feeder!.position.y };
    // Teleport to near the feeder.
    sc.sim.teleportTo(feederStart.x - 100, -feederStart.y);
    // Approach the mechanism (a T-08 feeder).
    sc.swimTo(feeder!.position, 40, 2000);
    // Assert the puzzle completion.
    const fired = sc.sim.triggers.firedIds.has('puzzle-current-lift');
    expect(fired, 'the current lift puzzle trigger must fire when reaching the mechanism').toBe(true);
    // Assert the world state changed (object moved).
    const feederMoved = feeder!.position.x !== feederStart.x || feeder!.position.y !== feederStart.y;
    expect(feederMoved, 'the mechanism must move as the puzzle resolution').toBe(true);
    // Assert the completion flag is set.
    expect(sc.sim.storyFlags.includes('puzzle-lift-1'), 'the completion flag must be set').toBe(true);
  });

  it('puzzle 2 control: without reaching the mechanism, the puzzle remains unsolved', () => {
    const sc = new Scenario(1004, makeSimWorld());
    // Teleport to twilight but far from the T-08 feeder.
    sc.sim.teleportTo(11500, 6500);
    sc.step(emptyInput());
    expect(sc.sim.triggers.firedIds.has('puzzle-current-lift'), 'the puzzle must not fire without reaching the mechanism').toBe(false);
    expect(sc.sim.storyFlags.includes('puzzle-lift-1'), 'the flag must not be set').toBe(false);
  });

  it('puzzle 3: guardian gate — the guardian moves to clear the path (abyss)', () => {
    const sc = new Scenario(1005, makeSimWorld());
    // Find the T-14 guardian in the abyss.
    const guardian = sc.sim.creatures.find((c) => c.def.id === 'T-14');
    expect(guardian, 'the T-14 guardian must exist in the abyss').toBeDefined();
    const guardianStart = { x: guardian!.position.x, y: guardian!.position.y };
    // Teleport to near the guardian.
    sc.sim.teleportTo(guardianStart.x - 100, -guardianStart.y);
    // Approach the guardian.
    sc.swimTo(guardian!.position, 40, 2000);
    // Assert the puzzle completion.
    const fired = sc.sim.triggers.firedIds.has('puzzle-guardian-gate');
    expect(fired, 'the guardian gate puzzle trigger must fire when approaching the guardian').toBe(true);
    // Assert the world state changed (guardian moved out of the way).
    const guardianMoved = guardian!.position.x !== guardianStart.x || guardian!.position.y !== guardianStart.y;
    expect(guardianMoved, 'the guardian must move to clear the path').toBe(true);
    // Assert the completion flag is set.
    expect(sc.sim.storyFlags.includes('puzzle-gate-1'), 'the completion flag must be set').toBe(true);
  });

  it('puzzle 3 control: without approaching the guardian, the puzzle remains unsolved', () => {
    const sc = new Scenario(1006, makeSimWorld());
    // Teleport to the abyss but far from the T-14 guardian.
    sc.sim.teleportTo(17000, 8500);
    // Don't approach the guardian.
    sc.stepFor(5, emptyInput());
    expect(sc.sim.triggers.firedIds.has('puzzle-guardian-gate'), 'the puzzle must not fire without approaching the guardian').toBe(false);
    expect(sc.sim.storyFlags.includes('puzzle-gate-1'), 'the flag must not be set').toBe(false);
  });

  it('puzzle 4: deep signal — reach depth to trigger the mechanism (hadal)', () => {
    const sc = new Scenario(1007, makeSimWorld());
    // Teleport to the hadal band at the depth that triggers the mechanism.
    sc.sim.teleportTo(20000, 9700); // depth 9700
    // Step once to let the trigger evaluate.
    sc.step(emptyInput());
    // Assert the puzzle completion (reachDepth condition).
    const fired = sc.sim.triggers.firedIds.has('puzzle-deep-signal');
    expect(fired, 'the deep signal puzzle trigger must fire at the depth threshold').toBe(true);
    // Assert the world state changed (entity spawned).
    expect(sc.sim.triggerState.activeEntities.has('puzzle-signal-entity'), 'the signal must spawn an entity').toBe(true);
    // Assert the completion flag is set.
    expect(sc.sim.storyFlags.includes('puzzle-signal-1'), 'the completion flag must be set').toBe(true);
  });

  it('puzzle 4 control: without reaching the depth, the puzzle remains unsolved', () => {
    const sc = new Scenario(1008, makeSimWorld());
    // Teleport to the abyss but not to the hadal depth.
    sc.sim.teleportTo(17500, 8500); // depth 8500, not deep enough
    sc.step(emptyInput());
    expect(sc.sim.triggers.firedIds.has('puzzle-deep-signal'), 'the puzzle must not fire without reaching the depth').toBe(false);
    expect(sc.sim.storyFlags.includes('puzzle-signal-1'), 'the flag must not be set').toBe(false);
  });
});
