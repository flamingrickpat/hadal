import { describe, test, expect } from 'vitest';
import { makeSimWorld } from './Simulation';
import { Scenario } from './scenario';

/**
 * WI-07b: physical route scenarios (request §32/§70).
 *
 * For each required gate, a headless scenario reaches it via swimTo/steering
 * against production collision; record the scenario trace. These are the
 * "physical route" proof — adjacency alone is not reachability (§32).
 *
 * The route: seabed -> shelf -> twilight -> abyss -> hadal (the final
 * objective). Each leg proves the player can physically swim through the
 * terrain to the next chunk's entrance.
 */

describe('physical route scenarios', () => {
  test('the player can swim from the start to the shelf exit', () => {
    const world = makeSimWorld();
    const scenario = new Scenario(1, world);

    // Swim to the shelf exit (from seabed)
    const shelfExit = world.chunks
      .find((c) => c.id === 'seabed')!
      .exits.find((e) => e.to === 'shelf')!;
    const steps = scenario.swimTo(shelfExit.position, 50, 40000);
    scenario.assert(
      scenario.distanceTo(shelfExit.position) <= 50,
      'reached shelf exit',
    );
    expect(steps).toBeGreaterThan(0);
  });

  test('the player can swim from the shelf to the twilight exit', () => {
    const world = makeSimWorld();
    const scenario = new Scenario(2, world);

    // First swim to the shelf
    const shelfExit = world.chunks
      .find((c) => c.id === 'seabed')!
      .exits.find((e) => e.to === 'shelf')!;
    scenario.swimTo(shelfExit.position, 50, 40000);

    // Then swim to the twilight exit
    const twilightExit = world.chunks
      .find((c) => c.id === 'shelf')!
      .exits.find((e) => e.to === 'twilight')!;
    const steps = scenario.swimTo(twilightExit.position, 50, 40000);
    scenario.assert(
      scenario.distanceTo(twilightExit.position) <= 50,
      'reached twilight exit',
    );
    expect(steps).toBeGreaterThan(0);
  });

  test('the player can swim from the twilight to the abyss exit', () => {
    const world = makeSimWorld();
    const scenario = new Scenario(3, world);

    // Swim to the shelf
    const shelfExit = world.chunks
      .find((c) => c.id === 'seabed')!
      .exits.find((e) => e.to === 'shelf')!;
    scenario.swimTo(shelfExit.position, 50, 40000);

    // Swim to the twilight
    const twilightExit = world.chunks
      .find((c) => c.id === 'shelf')!
      .exits.find((e) => e.to === 'twilight')!;
    scenario.swimTo(twilightExit.position, 50, 40000);

    // Then swim to the abyss exit
    const abyssExit = world.chunks
      .find((c) => c.id === 'twilight')!
      .exits.find((e) => e.to === 'abyss')!;
    const steps = scenario.swimTo(abyssExit.position, 50, 40000);
    scenario.assert(
      scenario.distanceTo(abyssExit.position) <= 50,
      'reached abyss exit',
    );
    expect(steps).toBeGreaterThan(0);
  });

  test('the player can swim from the abyss to the hadal (final objective)', () => {
    const world = makeSimWorld();
    const scenario = new Scenario(4, world);

    // Swim to the shelf
    const shelfExit = world.chunks
      .find((c) => c.id === 'seabed')!
      .exits.find((e) => e.to === 'shelf')!;
    scenario.swimTo(shelfExit.position, 50, 40000);

    // Swim to the twilight
    const twilightExit = world.chunks
      .find((c) => c.id === 'shelf')!
      .exits.find((e) => e.to === 'twilight')!;
    scenario.swimTo(twilightExit.position, 50, 40000);

    // Swim to the abyss
    const abyssExit = world.chunks
      .find((c) => c.id === 'twilight')!
      .exits.find((e) => e.to === 'abyss')!;
    scenario.swimTo(abyssExit.position, 50, 40000);

    // Swim to the hadal exit (the final objective)
    const hadalExit = world.chunks
      .find((c) => c.id === 'abyss')!
      .exits.find((e) => e.to === 'hadal')!;
    // Swim to a position just east of the hadal west wall, at a depth above the floor
    // The hadal west wall is at x 18100..18500; swim to x 19000, y -9500 (above the floor)
    const hadalEntry = { x: 19000, y: -9500 };
    const steps = scenario.swimTo(hadalEntry, 100, 40000);
    // Check that the player reached the hadal chunk (past the west wall)
    scenario.assert(
      scenario.sim.player.position.x > 18500,
      'reached the hadal chunk (past the west wall)',
    );
    expect(steps).toBeGreaterThan(0);
  });
});