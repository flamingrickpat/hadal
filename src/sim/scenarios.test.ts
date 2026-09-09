import { describe, expect, it } from 'vitest';
import { Scenario } from './scenario';
import { createSimulation, createSimulationFromSave, emptyInput, makeSimWorld } from './Simulation';
import { BASE, PLAYER_START } from '../world/worldData';
import { DEATH_RESOURCE_LOSS_FRACTION, FIXED_DT, HP_MAX, INTERACT_RADIUS, O2_MAX } from '../game/constants';
import type { Vec2 } from '../util/math';
import type { Percept, WorldSignal } from '../creatures/senses';

function freshPercept(): Percept {
  return { noise: 0, light: 0, sonar: 0, injury: 0 };
}

function harvestTwoNodes(s: Scenario, idA: string, idB: string): void {
  const harvestInput = emptyInput();
  harvestInput.interact = true;
  s.swimTo(s.findNodePosition(idA)!, 40);
  s.stepFor(0.5, harvestInput);
  s.swimTo(s.findNodePosition(idB)!, 40);
  s.stepFor(0.5, harvestInput);
}

describe('§30 simulation boundary', () => {
  it('the simulation + world data import and run in Node without browser globals', () => {
    expect(typeof createSimulation).toBe('function');
    expect(typeof makeSimWorld).toBe('function');
    const sim = createSimulation(makeSimWorld(), 0);
    expect(sim.player.position.x).toBe(PLAYER_START.x);
    sim.step(emptyInput(), FIXED_DT);
    expect(sim.toSave().version).toBe(1);
  });
});

describe('separate headless scenarios (request §70)', () => {
  it('death: respawns at the base, keeps upgrades, loses a modest fraction of unbanked', () => {
    const s = new Scenario(2);
    const sim = s.sim;
    // Harvest + bank + craft, then carry 8 unbanked salvage out and die.
    harvestTwoNodes(s, 'salvage-1', 'salvage-2');
    s.swimTo(BASE.position, 60);
    const craftInput = emptyInput();
    craftInput.craftRequest = 'tank-1';
    s.assert(sim.handleCraft(craftInput).crafted, 'crafted tank-1 at the base');
    harvestTwoNodes(s, 'salvage-3', 'salvage-4');
    const beforeDeath = sim.player.inventory.salvage ?? 0;
    expect(beforeDeath).toBeGreaterThanOrEqual(8);
    // Dive deep (below the surface refill) with low O2 so the sim's own
    // zero-O2 drain kills the player; not reachability evidence. No thrust:
    // the player stays deep (no current), O2 drains, then health drains to 0
    // and the sim respawns the player at the base.
    sim.teleportTo(1300, 900);
    sim.player.o2 = 5;
    let steps = 0;
    while (!sim.isAtBase(sim.player.position) && steps < 5000) {
      s.step(emptyInput());
      steps++;
    }
    // The only way the player (at y=-900, no thrust) reaches the base is by
    // dying and respawning there.
    s.assert(sim.isAtBase(sim.player.position), 'the player died and respawned at the surface base');
    s.assert(sim.player.o2 === sim.player.o2Max, 'oxygen refilled on respawn');
    s.assert(sim.player.health === HP_MAX, 'health refilled on respawn');
    s.assert(sim.player.equipmentIds.includes('tank-1'), 'permanent upgrade kept on death');
    const expected = Math.floor(beforeDeath * (1 - DEATH_RESOURCE_LOSS_FRACTION));
    s.assert(
      (sim.player.inventory.salvage ?? 0) === expected,
      `unbanked reduced to a modest fraction (got ${sim.player.inventory.salvage ?? 0}, expected ${expected})`,
    );
  });

  it('insufficient materials: crafting is rejected with no state change', () => {
    const s = new Scenario(3);
    const sim = s.sim;
    sim.giveResources('salvage', 3); // tank-1 costs 6
    const craftInput = emptyInput();
    craftInput.craftRequest = 'tank-1';
    const result = sim.handleCraft(craftInput);
    s.assert(!result.crafted, 'the craft is rejected');
    s.assert(result.reason === 'insufficient', 'rejected for insufficient materials');
    s.assert(sim.player.equipmentIds.length === 0, 'no upgrade applied');
    s.assert(sim.player.o2Max === O2_MAX, 'capability unchanged');
  });

  it(
    'blocked route: the sealed node is unreachable from the start',
    () => {
      const s = new Scenario(4);
      const sim = s.sim;
      const target: Vec2 = s.findNodePosition('salvage-sealed')!;
      s.swimTo(target, 50, 6000); // try to reach it; the seal blocks the route
      s.assert(s.distanceTo(target) > INTERACT_RADIUS, `blocked from the sealed node (d=${s.distanceTo(target).toFixed(1)})`);
      s.assert((sim.player.inventory.salvage ?? 0) === 0, 'did not harvest the sealed node');
    },
    // WI-03c1a revision: the 6000-step swim loop runs ~5.6 s under current
    // machine load and tripped the default 5 s test timeout (reproduced
    // identically on the base commit before this item's changes). Explicit
    // timeout per the documented vitest remedy; no logic change.
    15000,
  );

  it('depleted resources: harvesting all reachable nodes leaves none to collect', () => {
    const s = new Scenario(5);
    const sim = s.sim;
    const ids = ['salvage-1', 'salvage-2', 'salvage-3', 'salvage-4', 'salvage-5'];
    for (let i = 0; i < ids.length; i++) {
      s.swimTo(s.findNodePosition(ids[i]!)!, 40);
      const input = emptyInput();
      input.interact = true;
      s.stepFor(0.5, input);
      // Bank at the base every couple of nodes so cargo (capacity 10) frees up.
      if (i % 2 === 1) s.swimTo(BASE.position, 60);
    }
    s.swimTo(BASE.position, 60);
    const reachable = sim.nodes.filter((n) => n.id !== 'salvage-sealed');
    s.assert(reachable.every((n) => n.harvested), 'all reachable nodes are depleted');
    const pool = sim.combinedPool();
    s.assert((pool.salvage ?? 0) >= 20, `collected the reachable salvage (total=${pool.salvage ?? 0})`);
  });

  it('a failing assertion produces a trace with seed, time, position, input, assertion', () => {
    const s = new Scenario(7);
    const input = emptyInput();
    input.thrustX = 1;
    s.step(input);
    s.stepFor(1.0);
    let failed = false;
    try {
      s.assert(false, 'deliberate failure for the trace test');
    } catch (e) {
      failed = true;
      const msg = (e as Error).message;
      expect(msg).toContain('seed=7');
      expect(msg).toContain('t=');
      expect(msg).toContain('pos=');
      expect(msg).toContain('thrustX:');
      expect(msg).toContain('deliberate failure for the trace test');
    }
    expect(failed).toBe(true);
  });

  it('a save loaded into a fresh simulation drives the same progression (step 8–9)', () => {
    const s = new Scenario(8);
    const sim = s.sim;
    sim.giveResources('salvage', 6);
    const craftInput = emptyInput();
    craftInput.craftRequest = 'tank-1';
    sim.handleCraft(craftInput);
    const fresh = createSimulationFromSave(sim.toSave());
    s.assert(fresh.player.equipmentIds.includes('tank-1'), 'upgrade persists after save/load');
    s.assert(fresh.player.o2Max === O2_MAX + 65, 'capability persists after save/load');
  });

  it('sonar: the Q pulse is inert without the upgrade and emits a world signal after it (request §18, §63)', () => {
    const s = new Scenario(9);
    const sim = s.sim;
    const query: WorldSignal[] = new Array(8).fill(undefined) as WorldSignal[];
    // Without the sonar capability, pressing Q does not emit a sonar signal.
    s.assert(!sim.player.capabilities.has('sonar'), 'starter gear grants no sonar');
    const q1 = emptyInput();
    q1.sonar = true;
    s.step(q1);
    s.step(emptyInput()); // release Q so the next press is a fresh edge
    const before = sim.signals.queryNear(
      sim.player.position.x,
      sim.player.position.y,
      3000,
      sim.state.timeSec,
      query,
    );
    s.assert(
      !query.slice(0, before).some((q) => q !== undefined && q.type === 'sonar'),
      'no sonar signal before the sonar upgrade is crafted',
    );
    // Craft the sonar upgrade (the tier-1 `sonar` capability, request §9).
    sim.giveResources('salvage', 5);
    const craftInput = emptyInput();
    craftInput.craftRequest = 'sonar-1';
    s.assert(sim.handleCraft(craftInput).crafted, 'crafted the sonar upgrade');
    s.assert(sim.player.capabilities.has('sonar'), 'the sonar capability is granted');
    // Press Q (a fresh edge): the sonar fires and a sonar signal is queryable nearby.
    const q2 = emptyInput();
    q2.sonar = true;
    s.step(q2);
    const found = sim.signals.queryNear(
      sim.player.position.x,
      sim.player.position.y,
      3000,
      sim.state.timeSec,
      query,
    );
    s.assert(found > 0, 'a signal is queryable nearby after the Q pulse');
    s.assert(
      query.slice(0, found).some((q) => q !== undefined && q.type === 'sonar'),
      'the queryable signal includes the sonar type',
    );
    // A fixture creature near the player perceives the sonar signal (request §19).
    const percept = freshPercept();
    sim.signals.perceive(
      sim.player.position.x + 150,
      sim.player.position.y,
      sim.state.timeSec,
      percept,
    );
    s.assert(percept.sonar > 0.2, `a nearby creature perceives the sonar signal (sonar=${percept.sonar.toFixed(2)})`);
  });

  it('traverses the macro world end to end: the terrain is swimmable through every depth band (request §4.2/§49)', () => {
    const s = new Scenario(10);
    const sim = s.sim;
    // Open-water waypoints, one per deeper band, placed at the band's descent
    // gap (the wide descending network, request §4.2). The player swims to each
    // by normal steering + collision (no teleport, no noclip, no free resources).
    // The waypoints are close together so the whole descent is dense (request §49).
    const waypoints: Vec2[] = [
      { x: 5600, y: -2200 }, // band 2 (shelf) — the coast-to-shelf descent gap
      { x: 9500, y: -5000 }, // band 3 (twilight) — the shelf-to-twilight gap
      { x: 14500, y: -7800 }, // band 4 (abyss) — the twilight-to-abyss gap
      { x: 17900, y: -9670 }, // band 5 (hadal) — just west of the hadal west wall (deepest)
    ];
    // Track the time spent on each leg (between consecutive waypoints) so the
    // density check (request §49: 20–60 s between meaningful points, no
    // three-minute empty corridor) applies per leg, not to the whole ~24,000-wide
    // descent.
    let legStart = s.time;
    for (let i = 0; i < waypoints.length; i += 1) {
      const wp = waypoints[i]!;
      // A generous step budget per band: the world is ~24,000 units wide, so a
      // fixed small budget would time out mid-swim. The small tolerance makes
      // the steering use creeping thrust, which with the boost capability
      // (request §64) moves the player fast enough that each leg is a normal
      // 20–60 s traversal (request §49), not a three-minute empty swim.
      s.swimTo(wp, 30, 20000);
      s.assertNear(sim.player.position, wp, 900, `reached depth band ${i + 2} near (${wp.x}, ${wp.y})`);
      const legTime = s.time - legStart;
      // Each leg is a normal traversal between meaningful points (request §49:
      // ~20–60 s). The authored descent gaps are close together, so the legs
      // measure ~11–19 s (denser than the rule of thumb); the assertion confirms
      // no leg drifts into a long dramatic transit (>60 s) or a three-minute
      // empty corridor.
      s.assert(legTime <= 60, `leg ${i + 1} is dense, not an empty corridor (leg=${legTime.toFixed(0)}s)`);
      legStart = s.time;
    }
    // The deepest band is ~-9,000 to -12,000 (request §4.1).
    s.assert(sim.player.depth >= 9000, `reached the deepest band (depth=${sim.player.depth.toFixed(0)})`);
  });
});
