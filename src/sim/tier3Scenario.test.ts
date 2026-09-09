/**
 * Tests — the tier-3 predator/territorial roster (WI-03c1a data + damage
 *   model; WI-03c1b per-predator controllers): the five organisms the private
 *   roster selects for the predator tier (T-14, T-15, T-16, T-17, T-18 —
 *   internal ids only, request §0/§33/§68) exercised headlessly through the
 *   production simulation. WI-03c1b lands the per-predator signature
 *   scenarios (trigger approach plus a must-not-trigger control each), the
 *   non-chase signature state paths, and the FINAL PROOF for AC-roster-
 *   behavior across tiers 1-3; no production spawns (WI-03c2). No rule is
 *   mocked: every scenario drives the real `Simulation` (request §70).
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { vec2, type Vec2 } from '../util/math';
import { emptyInput, makeSimWorld, Simulation, type SimWorld } from './Simulation';
import { Scenario } from './scenario';
import type { PlayerInput } from '../player/PlayerController';
import type { Creature } from '../creatures/Creature';
import { FIXED_DT } from '../game/constants';
import { CREATURE_BY_ID } from '../creatures/fixtures';
import { DETER_HOLD_SECONDS, HARPOON_RANGE } from '../creatures/combat';
import { SIZE_CLASSES, type CreatureState, type SignatureRule } from '../creatures/CreatureDef';
import {
  HIDDEN_CREATURES,
  TIER3_BANDS,
  TIER3_CREATURES,
  TIER3_IDS,
} from '../content/secret/hiddenCreatures';
import { BASE, GREYBOX_WORLD } from '../world/worldData';
import type { CreatureSpawnDef } from '../world/chunks';

const dist = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.y - b.y);

/** GREYBOX_WORLD with authored spawns on its first chunk (clear of terrain). */
function greyboxWorld(spawns: readonly CreatureSpawnDef[], currentFields: SimWorld['currentFields'] = []): SimWorld {
  const chunks = GREYBOX_WORLD.map((c, i) => (i === 0 ? { ...c, creatureSpawns: spawns } : c));
  return { chunks, base: BASE, currentFields };
}

/** The single creature of `id` in the scenario. */
const one = (sc: Scenario, id: string): Creature => sc.sim.creatures.find((c) => c.def.id === id)!;

/**
 * Advance `seconds` with a fixed input, recording `c`'s state after every
 * step — the state-path evidence for the signature rules (a non-chase
 * predator's path must avoid the pursuit states).
 */
function runT(sc: Scenario, c: Creature, seen: Set<CreatureState>, seconds: number, input: PlayerInput = emptyInput()): void {
  const steps = Math.round(seconds / FIXED_DT);
  for (let i = 0; i < steps; i += 1) {
    sc.step(input);
    seen.add(c.state);
  }
}

describe('tier-3 roster data (WI-03c1a)', () => {
  it('registers the five selected ids with live defs, size classes, and rule categories', () => {
    expect(TIER3_IDS).toHaveLength(5);
    expect(new Set(TIER3_IDS).size).toBe(5); // distinct ids
    let largePredators = 0;
    const sizeClassesSeen = new Set<string>();
    for (const id of TIER3_IDS) {
      const def = TIER3_CREATURES[id];
      expect(def, `tier-3 registry is missing id ${id}`).toBeDefined();
      expect(CREATURE_BY_ID[id], `production registry is missing id ${id}`).toBe(def);
      expect(SIZE_CLASSES, `${id} has no valid size class`).toContain(def!.sizeClass);
      sizeClassesSeen.add(def!.sizeClass);
      expect(def!.rules, `${id} has no signature rule categories`).toBeDefined();
      expect(def!.rules!.length, `${id} needs at least one readable rule (request §10)`).toBeGreaterThan(0);
      if (def!.sizeClass === 'large' && def!.combat !== undefined) largePredators += 1;
    }
    // The section 10 table is covered by real roster organisms, and the
    // large-predator half of the tier is deterable-not-killable (request §10):
    // at least two large predators.
    expect([...sizeClassesSeen].sort()).toEqual(['large', 'medium', 'small']);
    expect(largePredators).toBeGreaterThanOrEqual(2);
    // The one organism that never attacks the player (private roster) is the
    // only neutral of the tier — the rest carry a combat capability.
    expect(TIER3_CREATURES['T-18']!.combat).toBeUndefined();
    for (const id of ['T-14', 'T-15', 'T-16', 'T-17']) {
      expect(TIER3_CREATURES[id]!.combat, `${id} must carry combat (private roster)`).toBeDefined();
    }
  });

  it('encodes the data-level section 11.1 minimums assigned to this tier', () => {
    // The organism whose dangerous phase is not its scary phase (P08): the
    // buried one that reads as inert geology until it is not.
    expect(TIER3_CREATURES['T-16']!.minimums).toContain('dangerous-phase-not-scary-phase');
    // The ecosystem relationship the player can exploit: the one that drives
    // prey into a harvestable field and never attacks the player.
    expect(TIER3_CREATURES['T-18']!.minimums).toContain('exploitable-relationship');
    // Both non-chase predators of the roster (private roster Part 2).
    expect(TIER3_CREATURES['T-14']!.minimums).toContain('non-chase-predator');
    expect(TIER3_CREATURES['T-18']!.minimums).toContain('non-chase-predator');
  });

  it('carries designed depth bands for every id (WI-03c2 will spawn within them)', () => {
    for (const id of TIER3_IDS) {
      const bands = TIER3_BANDS[id];
      expect(bands, `${id} has no designed bands`).toBeDefined();
      expect(bands!.size, `${id} needs at least one band`).toBeGreaterThan(0);
      for (const band of bands!) {
        expect(band).toBeGreaterThanOrEqual(1);
        expect(band).toBeLessThanOrEqual(5);
      }
    }
  });

  it('keeps body and movement signatures unique across the whole roster (§46 shark test, data half)', () => {
    const seen = new Set<string>();
    for (const def of HIDDEN_CREATURES) {
      const chains = (def.body.chainCircles ?? [])
        .map((c) => `${c.offset.x},${c.offset.y},${c.radius}`)
        .sort()
        .join('|');
      const key = `${def.body.radius}|${chains}|${def.movement.maxSpeed}|${def.movement.dragRate}`;
      expect(seen.has(key), `duplicate body/movement signature ${key} at ${def.id}`).toBe(false);
      seen.add(key);
    }
  });
});

describe('tier-3 production world data (WI-03c2: spawns on the §39 bands)', () => {
  it('the production world constructs and every tier-3 id resolves through its registry', () => {
    // The production Simulation resolves every authored spawn id against
    // CREATURE_BY_ID and throws on an unknown one (request §32) — so a clean
    // construction is the resolution proof for the world that is shipped.
    const sim = new Simulation(makeSimWorld(), 1);
    expect(sim.creatures.length).toBeGreaterThan(0);
    for (const id of TIER3_IDS) {
      expect(CREATURE_BY_ID[id], `registry is missing tier-3 id ${id}`).toBeDefined();
    }
    // Each tier-3 def instantiates into a live creature through the same
    // resolution path the production constructor uses.
    const world = greyboxWorld(
      TIER3_IDS.map((id, i) => ({ id: `t3-${id}`, creature: id, position: vec2(2500 + i * 60, -800) })),
    );
    const sc = new Scenario(3, world);
    expect(sc.sim.creatures).toHaveLength(5);
    for (const c of sc.sim.creatures) {
      expect(TIER3_IDS, `${c.def.id} is not a tier-3 organism`).toContain(c.def.id);
    }
  });

  it('every tier-3 spawn resolves, sits in a designed band, and every tier-3 id appears in every band it was designed for (§49 dense traversal)', () => {
    const bandsById = new Map<string, Set<number>>();
    let tier3Spawns = 0;
    const active = new Set<string>();
    for (const chunk of makeSimWorld().chunks) {
      for (const spawn of chunk.creatureSpawns ?? []) {
        const def = CREATURE_BY_ID[spawn.creature];
        expect(def, `spawn ${spawn.id} references unknown creature ${spawn.creature}`).toBeDefined();
        const inBounds =
          spawn.position.x >= chunk.bounds.x &&
          spawn.position.x <= chunk.bounds.x + chunk.bounds.w &&
          spawn.position.y >= chunk.bounds.y &&
          spawn.position.y <= chunk.bounds.y + chunk.bounds.h;
        expect(inBounds, `spawn ${spawn.id} outside chunk ${chunk.id} bounds`).toBe(true);
        active.add(spawn.creature);
        if (!TIER3_IDS.includes(spawn.creature)) continue; // other tiers' content
        const allowed = TIER3_BANDS[spawn.creature];
        expect(allowed, `spawn ${spawn.id} for ${spawn.creature} has no designed bands`).toBeDefined();
        expect(
          allowed!.has(chunk.band),
          `${spawn.creature} in chunk ${chunk.id} band ${chunk.band} (designed ${[...allowed!].join(',')})`,
        ).toBe(true);
        if (!bandsById.has(spawn.creature)) bandsById.set(spawn.creature, new Set());
        bandsById.get(spawn.creature)!.add(chunk.band);
        tier3Spawns += spawn.count ?? 1;
      }
    }
    // Every tier-3 organism appears in every band the roster designed it for,
    // so no band is an empty corridor for this tier (§49).
    for (const id of TIER3_IDS) {
      const placed = bandsById.get(id) ?? new Set<number>();
      const bands = TIER3_BANDS[id]!;
      for (const band of bands) {
        expect(placed.has(band), `${id} is missing from band ${band} in the production world data`).toBe(true);
      }
    }
    expect(tier3Spawns, 'the tier-3 carries authored production spawns').toBeGreaterThanOrEqual(5);
    // Landing the tier-3 brings the active roster to 17 distinct types (>= 15)
    // in the production data: the tier-3 portion of the AC-roster-count floor
    // that WI-03d finalizes roster-wide.
    expect(active.size, 'the active roster spans the implemented tiers').toBeGreaterThanOrEqual(15);
  });

  it('no tier-3 spawn sits inside a closed terrain slab (§49 open-water placement)', () => {
    // A spawn whose center is strictly inside a solid slab is trapped there:
    // the terrain resolve only pushes a circle out near an edge, so a body
    // deep inside a closed slab is never pushed out, drifts to the nearest
    // interior wall, and box-walks it — never contributing to the band's
    // dense traversal. Every closed authored slab is an axis-aligned
    // rectangle, so strict bounding-box containment is exact.
    const slabs = makeSimWorld().chunks.flatMap((c) => c.terrain).filter((s) => s.closed);
    const trappedBy = (p: Vec2): string[] =>
      slabs
        .filter((s) => {
          let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
          for (const pt of s.points) {
            minX = Math.min(minX, pt.x); maxX = Math.max(maxX, pt.x);
            minY = Math.min(minY, pt.y); maxY = Math.max(maxY, pt.y);
          }
          return p.x > minX && p.x < maxX && p.y > minY && p.y < maxY;
        })
        .map((s) => s.id);
    let checked = 0;
    for (const chunk of makeSimWorld().chunks) {
      for (const spawn of chunk.creatureSpawns ?? []) {
        if (!TIER3_IDS.includes(spawn.creature)) continue; // tier-3 only
        checked += 1;
        const hits = trappedBy(spawn.position);
        expect(hits, `tier-3 spawn ${spawn.id} is trapped inside a solid slab: ${hits.join(', ')}`).toEqual([]);
      }
    }
    expect(checked, 'expected the loop to cover the tier-3 spawns').toBeGreaterThanOrEqual(5);
  });

  it('keeps per-chunk per-type tier-3 counts under the §34 cap', () => {
    const CAP = 16; // §34 ambient creature count cap per chunk (per type, matching the other tiers' checks)
    for (const chunk of makeSimWorld().chunks) {
      for (const id of TIER3_IDS) {
        let n = 0;
        for (const spawn of chunk.creatureSpawns ?? []) {
          if (spawn.creature === id) n += spawn.count ?? 1;
        }
        expect(n, `chunk ${chunk.id} exceeds the ambient cap for ${id} (${n} > ${CAP})`).toBeLessThanOrEqual(CAP);
      }
    }
  });
});

describe('section 10 damage model in the production simulation', () => {
  // The player starts at (1300, -100). Every scenario spawns its single
  // organism in clear greybox water inside HARPOON_RANGE, selects the starter
  // harpoon, and fires on real `useTool` input — no mocks, no direct state
  // edits. The generic state machine is the stand-in until WI-03c1b lands
  // the per-predator controllers, so none of these defs carries one.

  it('small fauna are killable quickly: one harpoon hit kills (T-17, 360u)', () => {
    const sc = new Scenario(101, greyboxWorld([{ id: 't17-s', creature: 'T-17', position: vec2(1600, -300) }]));
    const c = sc.sim.creatures[0]!;
    sc.step({ ...emptyInput(), toolSelect: 2 }); // select the harpoon
    sc.step({ ...emptyInput(), useTool: true }); // one lance
    expect(c.dead, 'a small organism must die on the first harpoon hit').toBe(true);
    expect(sc.sim.creatures).toHaveLength(0); // removed from the ambient pool
  });

  it('medium predators are killable but costly: four hits do not, the fifth does (T-15, 492u)', () => {
    const sc = new Scenario(103, greyboxWorld([{ id: 't15-m', creature: 'T-15', position: vec2(1750, -300) }]));
    const c = sc.sim.creatures[0]!;
    sc.step({ ...emptyInput(), toolSelect: 2 });
    for (let shot = 1; shot <= 4; shot += 1) {
      sc.step({ ...emptyInput(), useTool: true });
      sc.step({ ...emptyInput(), useTool: false }); // release for the next rising edge
      expect(c.dead, `a medium predator must survive hit ${shot} of 5`).toBe(false);
      expect(sc.sim.creatures.some((cr) => cr === c), `hit ${shot} must not remove it`).toBe(true);
    }
    sc.step({ ...emptyInput(), useTool: true }); // the fifth hit
    expect(c.dead, 'the fifth harpoon hit must kill a medium predator').toBe(true);
    expect(sc.sim.creatures).toHaveLength(0);
  });

  it('large predators are deterable, not worth killing: hits never kill (T-14, 447u)', () => {
    const sc = new Scenario(107, greyboxWorld([{ id: 't14-l', creature: 'T-14', position: vec2(1700, -300) }]));
    const c = sc.sim.creatures[0]!;
    sc.step({ ...emptyInput(), toolSelect: 2 });
    for (let shot = 1; shot <= 3; shot += 1) {
      sc.step({ ...emptyInput(), useTool: true });
      sc.step({ ...emptyInput(), useTool: false });
      expect(c.dead, `a large predator must never die (hit ${shot})`).toBe(false);
      expect(sc.sim.creatures.some((cr) => cr === c), `hit ${shot} must not remove it`).toBe(true);
    }
  });

  it('a harpoon out of range or with another tool selected lances nothing', () => {
    // Out of range: the organism sits just beyond HARPOON_RANGE (east is open).
    const sc = new Scenario(109, greyboxWorld([{ id: 't17-f', creature: 'T-17', position: vec2(1300 + HARPOON_RANGE + 80, -100) }]));
    sc.step({ ...emptyInput(), toolSelect: 2 });
    sc.step({ ...emptyInput(), useTool: true });
    expect(sc.sim.creatures[0]!.dead).toBe(false);
    // Wrong tool: the knife is the starter slot; the same close organism survives.
    const sc2 = new Scenario(111, greyboxWorld([{ id: 't17-k', creature: 'T-17', position: vec2(1600, -300) }]));
    sc2.step({ ...emptyInput(), useTool: true });
    expect(sc2.sim.creatures[0]!.dead).toBe(false);
  });

  it('no HP bar: no tier-3 organism exposes hp/health data (request §10)', () => {
    const sc = new Scenario(113, greyboxWorld(TIER3_IDS.map((id, i) => ({ id: `t3-hp-${id}`, creature: id, position: vec2(2500 + i * 60, -800) }))));
    for (const c of sc.sim.creatures) {
      for (const prop of ['hp', 'maxHp', 'health', 'hpMax']) {
        expect(c, `${c.def.id} must not expose a ${prop} HP bar`).not.toHaveProperty(prop);
      }
    }
  });
});

describe('large-predator deterable-not-killable, exercised headlessly (T-14)', () => {
  it('a harpoon hit deters a hunting large predator: it withdraws, holds, and re-engages only after the deter expires', () => {
    const home = vec2(1700, -300); // ~447u from the player start, clear water
    const sc = new Scenario(115, greyboxWorld([{ id: 't14-d', creature: 'T-14', position: home }]));
    const c = sc.sim.creatures[0]!;

    // 1. Loud play with a non-lance tool (the starter knife): the post-holder
    //    hears the noise and goes alert (its readable rule, pre-deter).
    sc.step({ ...emptyInput(), useTool: true });
    expect(c.state, 'a loud tool signal alerts the territorial organism').toBe('alert');
    sc.step({ ...emptyInput(), useTool: false });

    // 2. WI-03c1b: the bespoke post controller holds the armed net through
    //    the arm window — no stalk, no attack (the non-chase signature).
    const seen = new Set<CreatureState>();
    runT(sc, c, seen, 3);
    expect(c.state, 'the armed net holds (no stalk, no attack)').toBe('alert');

    // 3. The harpoon lands: the simulation resolves a deter, not a kill.
    sc.step({ ...emptyInput(), toolSelect: 2 });
    sc.step({ ...emptyInput(), useTool: true });
    expect(c.dead, 'a deter is not a kill').toBe(false);
    expect(sc.sim.creatures.some((cr) => cr === c), 'a detered predator stays in the pool').toBe(true);
    expect(c.state, 'a deterred armed creature drops the net and stands down').toBe('idle');
    expect(c.deterredUntil, 'the deter holds for a bounded window').toBeGreaterThan(sc.sim.state.timeSec);
    expect(c.deterredUntil - sc.sim.state.timeSec).toBeLessThanOrEqual(DETER_HOLD_SECONDS + 1);
    sc.step({ ...emptyInput(), useTool: false });

    // 4. It holds the post while the deter is still in force.
    runT(sc, c, seen, 3);
    expect(c.state, 'a deterred large predator is at its post').toBe('idle');
    expect(dist(c.position, home)).toBeLessThan(60);

    // 5. The same loud play inside the deter window does not re-engage it.
    sc.step({ ...emptyInput(), toolSelect: 0 });
    sc.step({ ...emptyInput(), useTool: true });
    expect(c.state, 'the deter suppresses re-hunt inside the window').toBe('idle');
    sc.step({ ...emptyInput(), useTool: false });

    // 6. Once the window expires, the same signal re-arms it: the readable
    //    rule holds again, and only then.
    sc.stepFor(20, emptyInput());
    expect(sc.sim.state.timeSec, 'the deter window must have lapsed').toBeGreaterThan(c.deterredUntil);
    sc.step({ ...emptyInput(), useTool: true });
    expect(c.state, 'after the window the same signal re-arms').toBe('alert');
    for (const s of seen) expect(s, `the detered path stays out of pursuit (${s})`).not.toMatch(/attack|stalk/);
    sc.trace('T-14 deter: drops the net on the hit, holds the post, re-arms after the window');
  });
});

describe('T-14: the post-holder — loud play sets the net, a quiet approach does not (§10, §19)', () => {
  it('a quiet approach inside the net reach is safe; a sonar ping sets the net', () => {
    const home = vec2(1700, -300);
    const sc = new Scenario(201, greyboxWorld([{ id: 't14-a', creature: 'T-14', position: home }]));
    const c = sc.sim.creatures[0]!;
    const seen = new Set<CreatureState>();
    // Control: a quiet swim up to the post, inside the net reach — the
    // intruder makes no signal, so the net must not set.
    sc.swimTo(vec2(1650, -280), 40, 6000);
    seen.add(c.state);
    expect(dist(sc.sim.player.position, c.position), 'inside the net reach').toBeLessThan(260);
    expect(sc.sim.player.health, 'a quiet approach must not snap the net').toBe(100);
    expect(c.state, 'without a loud cue the post-holder holds').toBe('idle');
    // A fixed in-reach position with zero velocity, so the snap read is the
    // drag and nothing else (a drifting player would sail past it).
    sc.sim.teleportTo(1600, 300); // 100u west of the post
    const dBefore = dist(sc.sim.player.position, c.position);
    // Trigger: a sonar ping at the post arms it (its readable rule). The
    // audio data event drains on the following step (the tier-3 pass runs
    // after this step's audio collection).
    sc.sim.player.capabilities.add('sonar');
    sc.step({ ...emptyInput(), sonar: true });
    seen.add(c.state);
    expect(c.state, 'a sonar ping arms the post').toBe('alert');
    sc.step({ ...emptyInput(), sonar: false });
    seen.add(c.state);
    expect(
      sc.sim.creatureAudioEvents.some((e) => e.creatureId === 'T-14' && e.state === 'alert'),
      'arming is observable (the audio data event)',
    ).toBe(true);
    // The set net snaps on the intruder in reach: damage plus a drag out.
    runT(sc, c, seen, 2);
    expect(sc.sim.player.health, 'the set net must snap').toBe(90);
    expect(
      dist(sc.sim.player.position, c.position) - dBefore,
      'the drag pushes the intruder out',
    ).toBeGreaterThanOrEqual(180);
    expect(c.state, 'the net drops after it snaps').toBe('idle');
    // The snap puts the net on reset: fresh loud play inside the reset does
    // not re-set it (the same stand-down as the other traps).
    sc.step({ ...emptyInput(), sonar: true });
    seen.add(c.state);
    sc.step({ ...emptyInput(), sonar: false });
    expect(c.state, 'the net reset holds after a snap').toBe('idle');
    runT(sc, c, seen, 10);
    expect(sc.sim.player.health, 'no second snap inside the reset').toBe(90);
    // After the reset, fresh loud play re-arms the post (the rule holds again).
    sc.step({ ...emptyInput(), sonar: true });
    seen.add(c.state);
    sc.step({ ...emptyInput(), sonar: false });
    expect(c.state, 'after the reset, loud play re-arms the post').toBe('alert');
    // The non-chase signature: the whole path stays out of the pursuit states.
    for (const s of seen) expect(s, `T-14 never pursues (${s})`).not.toMatch(/attack|stalk/);
  });
});

describe('T-15: the burst interceptor — a cornered charge, not a chase (§10)', () => {
  it('moves in visible bursts with rests (the readable motion)', () => {
    const sc = new Scenario(203, greyboxWorld([{ id: 't15-b', creature: 'T-15', position: vec2(1700, -300) }]));
    const c = sc.sim.creatures[0]!;
    const seen = new Set<CreatureState>();
    const home = vec2(c.position.x, c.position.y);
    let maxFromHome = 0;
    // The bursts point in rotating directions, so the metric is the furthest
    // dash from home, not the net displacement.
    const steps = Math.round(12 / FIXED_DT);
    for (let i = 0; i < steps; i += 1) {
      sc.step(emptyInput());
      seen.add(c.state);
      maxFromHome = Math.max(maxFromHome, dist(c.position, home));
    }
    expect(seen.has('wander'), 'burst phases swim').toBe(true);
    expect(seen.has('idle'), 'rest phases hold').toBe(true);
    expect(maxFromHome, 'a burst leaves a visible dash').toBeGreaterThanOrEqual(150);
  });

  it('loud play at range and a silent corner do not trigger it; a loud corner does, once, then a stand-down', () => {
    const sc = new Scenario(205, greyboxWorld([{ id: 't15-c', creature: 'T-15', position: vec2(1700, -300) }]));
    const c = sc.sim.creatures[0]!;
    const seen = new Set<CreatureState>();
    // Control A: loud play at range — the organism is not cornered.
    sc.sim.teleportTo(2400, 250);
    sc.step({ ...emptyInput(), useTool: true });
    seen.add(c.state);
    sc.step({ ...emptyInput(), useTool: false });
    runT(sc, c, seen, 3);
    expect(seen.has('attack'), 'loud play at range must not trigger the charge').toBe(false);
    expect(sc.sim.player.health).toBe(100);
    // Control B: a silent corner — being close without noise does not trigger.
    sc.sim.teleportTo(c.position.x + 120, -c.position.y);
    runT(sc, c, seen, 2);
    expect(seen.has('attack'), 'silence in the corner must not trigger the charge').toBe(false);
    expect(sc.sim.player.health).toBe(100);
    // Trigger: a loud tool in the corner — one bounded charge, one hit.
    sc.step({ ...emptyInput(), useTool: true });
    seen.add(c.state);
    sc.step({ ...emptyInput(), useTool: false });
    expect(c.state, 'the loud corner triggers the charge').toBe('attack');
    runT(sc, c, seen, 3);
    expect(sc.sim.player.health, 'the charge hits once').toBe(85);
    expect(c.state, 'the charge is bounded, not a chase').not.toBe('attack');
    // Stand-down: a fresh loud corner inside the window does not re-trigger.
    sc.step({ ...emptyInput(), useTool: true });
    seen.add(c.state);
    sc.step({ ...emptyInput(), useTool: false });
    runT(sc, c, seen, 3);
    expect(c.state, 'no re-charge inside the stand-down window').not.toBe('attack');
  });
});

describe('T-16: the buried boulder — a silent proximity strike from cover (§10)', () => {
  it('a silent pass inside the strike reach is safe; a loud pass strikes once, then a long reset', () => {
    const home = vec2(1700, -300);
    const sc = new Scenario(207, greyboxWorld([{ id: 't16-a', creature: 'T-16', position: home }]));
    const c = sc.sim.creatures[0]!;
    const seen = new Set<CreatureState>();
    // Control: a silent pass right past the boulder — the silence is the tell.
    sc.sim.teleportTo(1700, 200); // 100u north, inside the strike reach
    runT(sc, c, seen, 3);
    expect(seen.has('custom'), 'silence must not wake it').toBe(false);
    expect(sc.sim.player.health).toBe(100);
    // Trigger: a loud pass inside the strike radius wakes it.
    sc.step({ ...emptyInput(), useTool: true });
    seen.add(c.state);
    sc.step({ ...emptyInput(), useTool: false });
    expect(c.state, 'a loud pass inside the strike radius wakes it').toBe('custom');
    runT(sc, c, seen, 3);
    expect(sc.sim.player.health, 'the expanding net hits').toBe(88);
    expect(c.state, 'the strike ends and it is buried again').toBe('idle');
    // Reset: another loud pass inside the reset window does not strike.
    sc.step({ ...emptyInput(), useTool: true });
    seen.add(c.state);
    sc.step({ ...emptyInput(), useTool: false });
    runT(sc, c, seen, 3);
    expect(sc.sim.player.health, 'no second strike inside the reset').toBe(88);
    for (const s of seen) expect(s, `the boulder never pursues (${s})`).not.toMatch(/attack|stalk/);
  });
});

describe('T-17: the silk colony — a noise trip in its frame, then it re-sets (§10)', () => {
  it('a silent approach through the frame is safe; a loud one trips the silk', () => {
    const home = vec2(1700, -300);
    const sc = new Scenario(209, greyboxWorld([{ id: 't17-a', creature: 'T-17', position: home }]));
    const c = sc.sim.creatures[0]!;
    const seen = new Set<CreatureState>();
    // Control: a silent approach well inside the silk reach.
    sc.sim.teleportTo(1750, 260); // ~70u from the frame
    runT(sc, c, seen, 2);
    expect(seen.has('custom'), 'silence must not trip the silk').toBe(false);
    expect(sc.sim.player.health).toBe(100);
    // Trigger: a loud pass inside the frame trips it.
    sc.step({ ...emptyInput(), useTool: true });
    seen.add(c.state);
    sc.step({ ...emptyInput(), useTool: false });
    expect(c.state, 'loud play inside the frame trips the silk').toBe('custom');
    runT(sc, c, seen, 1);
    expect(sc.sim.player.health, 'the silk snags once').toBe(92);
    runT(sc, c, seen, 3);
    expect(c.state, 'the silk drops once the pass is over').toBe('idle');
    // Re-set: after the cooldown the same rule holds again.
    sc.stepFor(10, emptyInput());
    sc.step({ ...emptyInput(), useTool: true });
    seen.add(c.state);
    sc.step({ ...emptyInput(), useTool: false });
    expect(c.state, 'the re-set silk trips on the same rule').toBe('custom');
    runT(sc, c, seen, 1);
    expect(sc.sim.player.health, 'the re-set silk snags again').toBe(84);
    for (const s of seen) expect(s, `the colony never pursues (${s})`).not.toMatch(/attack|stalk/);
  });
});

describe('T-18: the field herder — drives small prey into a harvestable field (§11.1)', () => {
  it('drives nearby schooling prey into its field, and a player collects them', () => {
    const sc = new Scenario(211, greyboxWorld([
      { id: 't18-a', creature: 'T-18', position: vec2(1700, -300) },
      { id: 't03-a', creature: 'T-03', position: vec2(2000, -250) },
      { id: 't03-b', creature: 'T-03', position: vec2(2050, -350) },
      { id: 't03-c', creature: 'T-03', position: vec2(2100, -300) },
    ]));
    const c = one(sc, 'T-18');
    const seen = new Set<CreatureState>();
    runT(sc, c, seen, 40);
    const field = sc.sim.creatures.filter((o) => o.def.id === 'T-03' && dist(o.position, c.position) <= 150);
    expect(field.length, 'prey are driven into the field').toBeGreaterThanOrEqual(2);
    // The exploitable relationship: a player at the field collects one.
    const prey = field[0]!;
    sc.sim.teleportTo(prey.position.x, -prey.position.y);
    const bank0 = sc.sim.player.banked.salvage ?? 0;
    sc.step({ ...emptyInput(), interact: true });
    expect((sc.sim.player.banked.salvage ?? 0) - bank0, 'a collected field member yields salvage').toBe(1);
    expect(sc.sim.creatures.some((o) => o === prey), 'the collected prey leaves the pool').toBe(false);
    expect(sc.sim.player.health, 'the herder never attacks the player').toBe(100);
    for (const s of seen) expect(s, 'the herder has no pursuit states').toBe('wander');
  });

  it('only drives prey inside its reach (the control: a distant school is untouched)', () => {
    const sc = new Scenario(213, greyboxWorld([
      { id: 't18-b', creature: 'T-18', position: vec2(1700, -300) },
      { id: 't03-f', creature: 'T-03', position: vec2(2600, -300) },
    ]));
    const c = one(sc, 'T-18');
    const far = one(sc, 'T-03');
    runT(sc, c, new Set<CreatureState>(), 20);
    expect(dist(far.position, c.position), 'a school outside the reach is not driven').toBeGreaterThan(550);
  });
});

describe('FINAL PROOF: AC-roster-behavior across tiers 1-3 (§10, §11.1, §47)', () => {
  it('4+ species have non-pursuit signature behaviors and 2+ are beneficial', () => {
    // The roster under test: what the production world data spawns (tiers 1-2,
    // WI-03a/WI-03b) plus the tier-3 registry (its spawns land in WI-03c2).
    const rosterIds = new Set<string>();
    for (const chunk of makeSimWorld().chunks) for (const s of chunk.creatureSpawns ?? []) rosterIds.add(s.creature);
    for (const id of TIER3_IDS) rosterIds.add(id);
    expect(rosterIds.size, 'the roster spans the implemented tiers').toBeGreaterThanOrEqual(10);
    // Data half: every tier-3 signature rule is a non-pursuit category.
    const NON_PURSUIT: SignatureRule[] = [
      'reacts-sonar', 'reacts-light', 'attacks-from-cover', 'territory',
      'attacks-noise', 'mistakes-tool-signals', 'dangerous-only-in-company',
      'cornered-charge', 'herds-prey',
    ];
    for (const id of TIER3_IDS) {
      for (const r of TIER3_CREATURES[id]!.rules ?? []) {
        expect(NON_PURSUIT, `tier-3 rule ${r} at ${id} must be non-pursuit`).toContain(r);
      }
    }
    // Behavior half: compact headless probes, counted. Each probe passes when
    // the signature behavior happens and no pursuit state does.
    let nonPursuit = 0;
    {
      // T-14: the post arms on sonar; the path never pursues.
      const sc = new Scenario(301, greyboxWorld([{ id: 't14-f', creature: 'T-14', position: vec2(1700, -300) }]));
      const c = sc.sim.creatures[0]!;
      const seen = new Set<CreatureState>();
      sc.sim.player.capabilities.add('sonar');
      sc.sim.teleportTo(1650, 280);
      sc.step({ ...emptyInput(), sonar: true });
      seen.add(c.state);
      sc.step({ ...emptyInput(), sonar: false });
      runT(sc, c, seen, 4);
      if (seen.has('alert') && !seen.has('attack') && !seen.has('stalk')) nonPursuit += 1;
    }
    {
      // T-16: the proximity strike from cover; the path never pursues.
      const sc = new Scenario(303, greyboxWorld([{ id: 't16-f', creature: 'T-16', position: vec2(1700, -300) }]));
      const c = sc.sim.creatures[0]!;
      const seen = new Set<CreatureState>();
      sc.sim.teleportTo(1700, 200);
      sc.step({ ...emptyInput(), useTool: true });
      seen.add(c.state);
      sc.step({ ...emptyInput(), useTool: false });
      runT(sc, c, seen, 4);
      if (seen.has('custom') && !seen.has('attack') && !seen.has('stalk')) nonPursuit += 1;
    }
    {
      // T-17: the noise trip; the path never pursues.
      const sc = new Scenario(305, greyboxWorld([{ id: 't17-f', creature: 'T-17', position: vec2(1700, -300) }]));
      const c = sc.sim.creatures[0]!;
      const seen = new Set<CreatureState>();
      sc.sim.teleportTo(1750, 260);
      sc.step({ ...emptyInput(), useTool: true });
      seen.add(c.state);
      sc.step({ ...emptyInput(), useTool: false });
      runT(sc, c, seen, 4);
      if (seen.has('custom') && !seen.has('attack') && !seen.has('stalk')) nonPursuit += 1;
    }
    {
      // T-18: the field herder carries no combat capability at all.
      if (TIER3_CREATURES['T-18']!.combat === undefined) nonPursuit += 1;
    }
    {
      // T-13 (production world data): it runs from noise — the opposite of
      // pursuit, observable in the shipped world.
      const prod = new Scenario(307);
      const t13 = prod.sim.creatures.find((cr) => cr.def.id === 'T-13');
      if (t13 !== undefined) {
        prod.sim.teleportTo(t13.position.x + 80, -t13.position.y);
        const seen = new Set<CreatureState>();
        prod.step({ ...emptyInput(), useTool: true });
        seen.add(t13.state);
        prod.step({ ...emptyInput(), useTool: false });
        runT(prod, t13, seen, 2);
        if (seen.has('flee')) nonPursuit += 1;
      }
    }
    expect(nonPursuit, 'at least four species are materially non-pursuit').toBeGreaterThanOrEqual(4);

    // The beneficial half: the friendly species WI-03b1 lands, plus the
    // tier-3 field harvest. Each probe is the same minimal production scenario
    // as the per-species tests; count the passes.
    let beneficial = 0;
    {
      // T-08: the feeding trade nets a salvage gain.
      const sc = new Scenario(309, greyboxWorld([{ id: 't08-f', creature: 'T-08', position: vec2(1900, -800) }]));
      sc.sim.player.inventory.salvage = 1;
      sc.swimTo(one(sc, 'T-08').position, 60, 900);
      const bank0 = sc.sim.player.banked.salvage ?? 0;
      sc.step({ ...emptyInput(), interact: true });
      if ((sc.sim.player.banked.salvage ?? 0) - bank0 >= 2) beneficial += 1;
    }
    {
      // T-11: the settled pocket gives a passive lift.
      const sc = new Scenario(311, greyboxWorld([{ id: 't11-f', creature: 'T-11', position: vec2(2000, -1050) }]));
      sc.stepFor(8, emptyInput());
      sc.sim.teleportTo(2000, 900);
      const y0 = sc.sim.player.position.y;
      sc.stepFor(12, emptyInput());
      if (sc.sim.player.position.y - y0 > 60) beneficial += 1;
    }
    {
      // T-18: the driven field pays out a collected salvage unit.
      const sc = new Scenario(313, greyboxWorld([
        { id: 't18-f', creature: 'T-18', position: vec2(1700, -300) },
        { id: 't03-f1', creature: 'T-03', position: vec2(2000, -250) },
        { id: 't03-f2', creature: 'T-03', position: vec2(2050, -350) },
      ]));
      const c = one(sc, 'T-18');
      runT(sc, c, new Set<CreatureState>(), 30);
      const field = sc.sim.creatures.find((o) => o.def.id === 'T-03' && dist(o.position, c.position) <= 150);
      if (field !== undefined) {
        sc.sim.teleportTo(field.position.x, -field.position.y);
        const bank0 = sc.sim.player.banked.salvage ?? 0;
        sc.step({ ...emptyInput(), interact: true });
        if ((sc.sim.player.banked.salvage ?? 0) - bank0 >= 1) beneficial += 1;
      }
    }
    expect(beneficial, 'at least two species are beneficial or mutually useful').toBeGreaterThanOrEqual(2);
  });
});

describe('spoiler containment for this work item (§0/§12/§68)', () => {
  it('no creature name or secret description appears outside the private content', () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const tokensPath = join(here, '..', '..', 'design_private', '_spoiler_tokens.txt');
    // T-IDs are internal identifiers — legal here per §68 (the tokens file
    // itself excludes them from the whole-tree scan), so only the name tokens
    // are checked.
    const tokens = readFileSync(tokensPath, 'utf8')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('#'))
      .filter((l) => !/^T-\d\d$/.test(l))
      .map((l) => l.replace(/^The\s+/, '')) // "The X" and "X" are the same name
      .filter((l) => l.length >= 3);
    expect(tokens.length).toBeGreaterThanOrEqual(10);
    const offenders: string[] = [];
    const scanFile = (p: string): void => {
      const text = readFileSync(p, 'utf8').toLowerCase();
      for (const t of tokens) {
        // Word-boundary match: a token must stand alone, so e.g. a short
        // name is not flagged inside an unrelated longer word.
        const re = new RegExp(`\\b${t.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
        if (re.test(text)) offenders.push(`${p} :: ${t}`);
      }
    };
    // This item's product surface: the creature framework, the simulation,
    // the player tooling, and the secret content file (which the previous
    // tier's sweep did not reach — its subdir is not scanned recursively).
    for (const dir of ['src/sim', 'src/creatures', 'src/player']) {
      const abs = join(here, '..', '..', dir);
      for (const f of readdirSync(abs)) {
        if (f.endsWith('.ts')) scanFile(join(abs, f));
      }
    }
    scanFile(join(here, '..', '..', 'src', 'content', 'secret', 'hiddenCreatures.ts'));
    // WI-03c2 artifacts: the production world data (the tier-3 spawn
    // comments) and this tier's render verification test.
    scanFile(join(here, '..', '..', 'src', 'world', 'worldData.ts'));
    scanFile(join(here, '..', '..', 'src', 'render', 'tier3Render.test.ts'));
    // The implementation artifacts of the tier-3 execution attempts
    // (WI-03c1a landed in attempt 14; WI-03c1b in 15; WI-03c2 in 16).
    for (const task of [
      'hadalv2.execute_leaf.__attempt_0014',
      'hadalv2.execute_leaf.__attempt_0015',
      'hadalv2.execute_leaf.__attempt_0016',
    ]) {
      const implDir = join(here, '..', '..', 'agents', 'tasks', task, 'implementation');
      if (existsSync(implDir)) {
        for (const f of readdirSync(implDir)) {
          if (f.endsWith('.md')) scanFile(join(implDir, f));
        }
      }
    }
    expect(offenders, `spoiler tokens found: ${offenders.join(', ')}`).toEqual([]);
  });
});
