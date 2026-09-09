/**
 * Tests — the tier-3 predator/territorial roster foundation (WI-03c1a): the
 *   five organisms the private roster selects for the predator tier (T-14,
 *   T-15, T-16, T-17, T-18 — internal ids only, request §0/§33/§68) as
 *   CreatureDef data, plus the section 10 damage model per size class,
 *   exercised headlessly through the production simulation. No per-predator
 *   controllers or per-predator signature scenarios in this file (WI-03c1b);
 *   no production spawns (WI-03c2). No rule is mocked: every scenario drives
 *   the real `Simulation` (request §70).
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { vec2, type Vec2 } from '../util/math';
import { emptyInput, makeSimWorld, Simulation, type SimWorld } from './Simulation';
import { Scenario } from './scenario';
import { CREATURE_BY_ID } from '../creatures/fixtures';
import { DETER_HOLD_SECONDS, HARPOON_RANGE } from '../creatures/combat';
import { SIZE_CLASSES } from '../creatures/CreatureDef';
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

describe('tier-3 defs resolve in the production world data (no spawns yet)', () => {
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

  it('no tier-3 id is spawned in the production world data yet (WI-03c2 owns spawns)', () => {
    for (const chunk of makeSimWorld().chunks) {
      for (const spawn of chunk.creatureSpawns ?? []) {
        expect(
          TIER3_IDS,
          `chunk ${chunk.id} spawns tier-3 id ${spawn.creature} before WI-03c2`,
        ).not.toContain(spawn.creature);
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

    // 2. The generic machine escalates to a hunt (stalk) after the alert dwell.
    sc.stepFor(1.6, emptyInput());
    expect(c.state, 'the large predator must be hunting before the deter').toBe('stalk');

    // 3. The harpoon lands: the simulation resolves a deter, not a kill.
    sc.step({ ...emptyInput(), toolSelect: 2 });
    sc.step({ ...emptyInput(), useTool: true });
    expect(c.dead, 'a deter is not a kill').toBe(false);
    expect(sc.sim.creatures.some((cr) => cr === c), 'a detered predator stays in the pool').toBe(true);
    expect(c.state, 'a deterred hunting creature withdraws to its post').toBe('return');
    expect(c.deterredUntil, 'the deter holds for a bounded window').toBeGreaterThan(sc.sim.state.timeSec);
    expect(c.deterredUntil - sc.sim.state.timeSec).toBeLessThanOrEqual(DETER_HOLD_SECONDS + 1);
    sc.step({ ...emptyInput(), useTool: false });

    // 4. It works its way back to the post while the deter is still in force.
    for (let i = 0; i < 300 && c.state !== 'idle'; i += 1) sc.step(emptyInput());
    expect(c.state, 'a deterred large predator is back at its post').toBe('idle');
    expect(dist(c.position, home)).toBeLessThan(60);

    // 5. The same loud play inside the deter window does not re-engage it.
    sc.step({ ...emptyInput(), toolSelect: 0 });
    sc.step({ ...emptyInput(), useTool: true });
    expect(c.state, 'the deter suppresses re-hunt inside the window').toBe('idle');
    sc.step({ ...emptyInput(), useTool: false });

    // 6. Once the window expires, the same signal re-engages it: the readable
    //    rule holds again, and only then.
    sc.stepFor(20, emptyInput());
    expect(sc.sim.state.timeSec, 'the deter window must have lapsed').toBeGreaterThan(c.deterredUntil);
    sc.step({ ...emptyInput(), useTool: true });
    expect(c.state, 'after the window the same signal re-engages').toBe('alert');
    sc.trace('T-14 deter: withdraws on the hit, holds the post, re-engages after the window');
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
    const implDir = join(here, '..', '..', 'agents', 'tasks', 'hadalv2.execute_leaf.__attempt_0014', 'implementation');
    if (existsSync(implDir)) {
      for (const f of readdirSync(implDir)) {
        if (f.endsWith('.md')) scanFile(join(implDir, f));
      }
    }
    expect(offenders, `spoiler tokens found: ${offenders.join(', ')}`).toEqual([]);
  });
});
