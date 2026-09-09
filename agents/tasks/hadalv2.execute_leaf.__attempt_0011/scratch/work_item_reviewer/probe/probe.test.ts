/**
 * INDEPENDENT reviewer probe for WI-03b1 (work-item-reviewer role).
 *
 * Purpose: verify the work item's acceptance evidence WITHOUT trusting the
 * implementer's own test structure. Each probe drives the production
 * `Simulation` through the `Scenario` harness (no rule mocks, request §70)
 * but uses DIFFERENT spawn positions / nodes / timings than
 * `tier2Scenario.test.ts`, so it could distinguish the literal request from
 * the implementation's interpretation:
 *   A) friendly floor is real — T-08 trade net-gain + T-11 passive lift.
 *   B) T-10 "not before" — the yield boost fires only after a full sweep.
 *   C) dangerous-looking-safe — every tier-2 def has no combat capability.
 *   D) T-27 ride — a nearby player is carried, a far one is not.
 */
import { describe, expect, it } from 'vitest';
import { vec2 } from '../../../../../../src/util/math';
import { Scenario } from '../../../../../../src/sim/scenario';
import { emptyInput, type SimWorld } from '../../../../../../src/sim/Simulation';
import { BASE, GREYBOX_WORLD } from '../../../../../../src/world/worldData';
import { TIER2_CREATURES, TIER2_IDS } from '../../../../../../src/content/secret/hiddenCreatures';
import type { CreatureSpawnDef } from '../../../../../../src/world/chunks';

function greyboxWorld(spawns: readonly CreatureSpawnDef[]): SimWorld {
  const chunks = GREYBOX_WORLD.map((c, i) => (i === 0 ? { ...c, creatureSpawns: spawns } : c));
  return { chunks, base: BASE, currentFields: [] };
}

function find(sc: Scenario, id: string) {
  const c = sc.sim.creatures.find((cr) => cr.def.id === id);
  expect(c, `creature ${id} not spawned`).toBeTruthy();
  return c!;
}

describe('INDEPENDENT A: the friendly floor is a real mechanical benefit', () => {
  it('A1 — the T-08 trade gives a NET salvage gain for one carried unit', () => {
    // Spawn at (1500,-850) — different from the implementer's (1850,-800).
    const sc = new Scenario(101, greyboxWorld([{ id: 'rv-t08', creature: 'T-08', position: vec2(1500, -850) }]));
    const c = find(sc, 'T-08');
    sc.sim.player.inventory.salvage = 2; // the player carries material to feed
    sc.stepFor(10, emptyInput());
    sc.swimTo(c.position, 55, 900);
    const before = (sc.sim.player.inventory.salvage ?? 0) + (sc.sim.player.banked.salvage ?? 0);
    sc.step({ ...emptyInput(), interact: true });
    const inv = sc.sim.player.inventory.salvage ?? 0;
    const bank = sc.sim.player.banked.salvage ?? 0;
    const after = inv + bank;
    // Net gain at least +1 (gave one, received two), and two arrived banked.
    expect(after - before).toBeGreaterThanOrEqual(1);
    expect(bank).toBeGreaterThanOrEqual(2);
  });

  it('A2 — the T-11 pocket lifts a nearby player with no input', () => {
    const sc = new Scenario(102, greyboxWorld([{ id: 'rv-t11', creature: 'T-11', position: vec2(2200, -1100) }]));
    find(sc, 'T-11');
    sc.stepFor(15, emptyInput()); // let the pocket settle at its hold
    const pocketY = sc.sim.creatures.find((c) => c.def.id === 'T-11')!.position.y;
    // Teleport the player 180 units BELOW the pocket (deeper), inside the lift
    // reach. teleportTo(x, depth) sets y = -depth, so depth = -(pocketY - 180).
    sc.sim.teleportTo(2200, -(pocketY - 180));
    const y0 = sc.sim.player.position.y;
    sc.stepFor(15, emptyInput());
    expect(sc.sim.player.position.y - y0).toBeGreaterThan(50); // rose for free
  });
});

describe('INDEPENDENT B: the T-10 second behavior is conditional ("not before")', () => {
  it('B1 — the node is untouched before a full sweep and boosted after', () => {
    // One sweeper 120 from salvage-3 (1900,-1300), inside the 250 acquisition
    // radius — but the node must still be untouched until the 20s sweep ends.
    const sc = new Scenario(103, greyboxWorld([{ id: 'rv-t10', creature: 'T-10', position: vec2(2020, -1300) }]));
    const n = sc.sim.nodes.find((nd) => nd.id === 'salvage-3')!;
    expect(n.amount).toBe(4);
    sc.stepFor(12, emptyInput());
    expect(n.amount).toBe(4); // NOT boosted before the full sweep is done
    sc.stepFor(30, emptyInput());
    expect(n.amount).toBeGreaterThan(4); // boosted once after the sweep
  });
});

describe('INDEPENDENT C: the whole tier-2 is safe in simulation', () => {
  it('C1 — every tier-2 def has no combat capability', () => {
    expect(TIER2_IDS).toHaveLength(6);
    for (const id of TIER2_IDS) {
      const def = TIER2_CREATURES[id];
      expect(def, `${id} is missing from the tier-2 registry`).toBeDefined();
      expect(def!.combat, `${id} should not be able to harm/threaten`).toBeUndefined();
    }
  });
});

describe('INDEPENDENT D: the T-27 ride is a real, bounded interaction', () => {
  it('D1 — it carries a nearby player but not a far one', () => {
    // Spawn BELOW the coast wall (y < -1000, wall spans x 2370-2434) so the
    // ride can actually carry the player west without hitting terrain.
    const sc = new Scenario(105, greyboxWorld([{ id: 'rv-t27', creature: 'T-27', position: vec2(2500, -1200) }]));
    find(sc, 'T-27');
    sc.stepFor(3, emptyInput());
    // NEAR: 40 west of the chain (inside the 150 ride reach).
    sc.sim.teleportTo(2460, 1200);
    const xNear0 = sc.sim.player.position.x;
    sc.stepFor(10, emptyInput());
    const nearMoved = xNear0 - sc.sim.player.position.x;
    expect(nearMoved).toBeGreaterThan(100); // carried west with no input
    // FAR: 250 west of the chain's leftmost overshoot (outside the 150 ride
    // reach even when the chain sweeps), still open water.
    sc.sim.teleportTo(2200, 1200);
    const xFar0 = sc.sim.player.position.x;
    sc.stepFor(10, emptyInput());
    const farMoved = xFar0 - sc.sim.player.position.x;
    expect(farMoved).toBeLessThan(20); // not carried
  });
});
