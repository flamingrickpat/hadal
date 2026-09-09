/**
 * Tests — the headless creature scenario (request §30, §70, WI-02a
 *   verification): a production `Simulation` advanced through the `Scenario`
 *   harness, where a placeholder organism reacts to a real bus signal the
 *   player emits (tool noise) — sensing, state change, motion, and the audio
 *   event data the sim emits for the browser adapter.
 */
import { describe, expect, it } from 'vitest';
import { vec2 } from '../util/math';
import { emptyInput, type SimWorld } from './Simulation';
import { Scenario } from './scenario';
import { GREYBOX_WORLD, BASE } from '../world/worldData';
import { CREATURE_BY_ID } from '../creatures/fixtures';
import type { CreatureSpawnDef } from '../world/chunks';

const SCHOOLER_SPAWN = vec2(1050, -700); // ~650 world units from the player start

/** GREYBOX_WORLD with the fixture spawns authored on its first chunk. */
function worldWithSpawns(spawns: readonly CreatureSpawnDef[]): SimWorld {
  const chunks = GREYBOX_WORLD.map((c, i) => (i === 0 ? { ...c, creatureSpawns: spawns } : c));
  return { chunks, base: BASE };
}

function schoolerWorld(): SimWorld {
  return worldWithSpawns([{ id: 'schooler-1', creature: 'fixture-schooler', position: SCHOOLER_SPAWN, count: 3 }]);
}

describe('fixture organisms (framework test fixtures, not roster content)', () => {
  it('two neutral placeholder organisms exist: a schooling type and a forager', () => {
    const schooler = CREATURE_BY_ID['fixture-schooler']!;
    const forager = CREATURE_BY_ID['fixture-forager']!;
    expect(schooler.id).toBe('fixture-schooler');
    expect(schooler.ecology?.school).toBe(true); // schooling type
    expect(schooler.combat).toBeUndefined(); // neutral
    expect(forager.id).toBe('fixture-forager');
    expect(forager.combat).toBeUndefined(); // neutral
  });

  // WI-02c revision: the ecology illusion added three more neutral fixtures
  // (scavenger, predator, filter feeder). The WI-02a count of 2 above
  // remains valid for those two; the registry now holds the five fixtures.
  // WI-03a revision: the tier-1 roster content (T-01…T-13, internal ids
  // only) is merged into the same registry — eleven entries then.
  // WI-03b1 revision: the tier-2 roster (T-08…T-31, internal ids only) is
  // merged too — seventeen entries now.
  // WI-03c1a revision: the tier-3 predator roster (T-14…T-18, internal ids
  // only) merges in — twenty-two entries now.
  it('the registry holds the five framework fixtures plus the tier-1, tier-2, and tier-3 rosters', () => {
    expect(Object.keys(CREATURE_BY_ID)).toHaveLength(22);
    expect(Object.keys(CREATURE_BY_ID).filter((id) => id.startsWith('fixture-'))).toHaveLength(5);
  });
});

describe('node scenario: an organism reacts to a bus signal', () => {
  it('schoolers near the player investigate a tool-noise signal and move toward it', () => {
    const sc = new Scenario(42, schoolerWorld());
    expect(sc.sim.creatures).toHaveLength(3);
    const schoolers = sc.sim.creatures;
    expect(schoolers.every((c) => c.state === 'wander')).toBe(true);

    const startDistances = schoolers.map(
      (c) => Math.hypot(c.position.x - sc.sim.player.position.x, c.position.y - sc.sim.player.position.y),
    );

    // The player uses a tool once: a real noise signal on the WorldSignalBus.
    // The schoolers are within signal range, so the reaction lands this step.
    sc.step({ ...emptyInput(), useTool: true });
    expect(schoolers.every((c) => c.state === 'investigate')).toBe(true);
    // Audio is data the sim emits for the browser adapter (request §19): the
    // investigate transition produced a schooler audio event.
    expect(
      sc.sim.creatureAudioEvents.some((e) => e.creatureId === 'fixture-schooler' && e.call === 'schooler-attention'),
    ).toBe(true);

    // The reaction: over a few seconds the schoolers close on the signal source.
    sc.stepFor(6, emptyInput());
    for (const [i, c] of schoolers.entries()) {
      const d = Math.hypot(c.position.x - sc.sim.player.position.x, c.position.y - sc.sim.player.position.y);
      expect(d).toBeLessThan(startDistances[i]!);
    }
  });

  it('a forager spawned far from the player is AI-deactivated until the player approaches', () => {
    // 4500,-3000 vs the player start 1300,-100 is ~4325 world units: beyond
    // the CREATURE_AI_RANGE cap (request §34/§16 — a world distance, not a
    // screen edge).
    const world = worldWithSpawns([{ id: 'forager-1', creature: 'fixture-forager', position: vec2(4500, -3000), count: 1 }]);
    const sc = new Scenario(7, world);
    const forager = sc.sim.creatures[0]!;
    expect(forager.active).toBe(true); // constructor default, before any tick
    sc.step(emptyInput());
    expect(forager.active).toBe(false);
    const before = { x: forager.position.x, y: forager.position.y };
    sc.stepFor(3, emptyInput());
    expect(forager.position.x).toBe(before.x); // frozen while deactivated
    expect(forager.position.y).toBe(before.y);
    expect(forager.state).toBe('forage'); // no AI tick happened at all
  });
});
