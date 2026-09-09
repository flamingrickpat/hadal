/**
 * Tests — the tier-4 huge set-piece / colossal-presence roster (WI-03d1): the
 *   five organisms the private roster selects for the final tier (T-19, T-20,
 *   T-22, T-23, T-25 — internal ids only, request §0/§33/§68), exercised
 *   headlessly through the production simulation. Each organism carries one
 *   signature-rule scenario (plume standoff, sub-bass pulse + sonar-scale
 *   echo + rideable current, creaking steps, the fauna-announced crossing
 *   with its no-clean-view window and speed mismatch, eddy drift +
 *   reconfigure cycle); the AC-roster-large floors are proven here
 *   headlessly (final proof owner). No rule is mocked: every scenario drives
 *   the real `Simulation` (request §70). No production world-data placement
 *   (WI-03d3); no renderer work (WI-03d2).
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { vec2, type Vec2 } from '../util/math';
import { makeSimWorld, Simulation, type SimWorld } from './Simulation';
import { Scenario } from './scenario';
import type { PlayerInput } from '../player/PlayerController';
import type { Creature } from '../creatures/Creature';
import { FIXED_DT, FULL_BODY_VIEW_RANGE } from '../game/constants';
import { CREATURE_BY_ID } from '../creatures/fixtures';
import { bodyExtent } from '../creatures/CreatureDef';
import { emptyInput } from './Simulation';
import {
  HIDDEN_CREATURES,
  TIER4_BANDS,
  TIER4_CREATURES,
  TIER4_IDS,
} from '../content/secret/hiddenCreatures';
import { BASE, GREYBOX_WORLD } from '../world/worldData';
import type { CreatureSpawnDef, WorldChunkDef } from '../world/chunks';
import { driftField } from '../systems/CurrentSystem';

const dist = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.y - b.y);

/** GREYBOX_WORLD with authored spawns on its first chunk (clear of terrain). */
function greyboxWorld(
  spawns: readonly CreatureSpawnDef[],
  currentFields: SimWorld['currentFields'] = [],
): SimWorld {
  const chunks = GREYBOX_WORLD.map((c, i) => (i === 0 ? { ...c, creatureSpawns: spawns } : c));
  return { chunks, base: BASE, currentFields };
}

/** The single creature of `id` in the scenario. */
const one = (sc: Scenario, id: string): Creature => sc.sim.creatures.find((c) => c.def.id === id)!;

/** Advance `seconds`; append every drained creature audio event to `events`. */
function runA(
  sc: Scenario,
  seconds: number,
  events: { creatureId: string; state: string; call: string; time: number }[],
  input: PlayerInput = emptyInput(),
): void {
  const steps = Math.round(seconds / FIXED_DT);
  for (let i = 0; i < steps; i += 1) {
    sc.step(input);
    for (const e of sc.sim.creatureAudioEvents) events.push(e);
  }
}

/** The audio calls emitted for `id`, one step after each transition (sim order). */
const callsFor = (
  events: { creatureId: string; call: string; time: number }[],
  id: string,
): number[] => events.filter((e) => e.creatureId === id).map((e) => e.time);

describe('tier-4 roster data (WI-03d1)', () => {
  it('registers the five selected ids with live defs: large, non-targetable, no combat', () => {
    expect(TIER4_IDS).toHaveLength(5);
    expect(new Set(TIER4_IDS).size).toBe(5); // distinct ids
    for (const id of TIER4_IDS) {
      const def = TIER4_CREATURES[id];
      expect(def, `tier-4 registry is missing id ${id}`).toBeDefined();
      expect(CREATURE_BY_ID[id], `production registry is missing id ${id}`).toBe(def);
      expect(def!.sizeClass, `${id} must be a large-scale organism`).toBe('large');
      expect(def!.nonTargetable, `${id} must be a non-combat-target (request §10)`).toBe(true);
      expect(def!.combat, `${id} must carry no combat capability`).toBeUndefined();
      expect(bodyExtent(def!), `${id} must be large-scale (body extent ≥ 800)`).toBeGreaterThanOrEqual(800);
    }
  });

  it('encodes the data-level section 11.1 minimums the roster assigns this tier', () => {
    // The dangerous-looking-but-safe organism (the plume that is a filter, not a weapon).
    expect(TIER4_CREATURES['T-19']!.minimums).toContain('dangerous-looking-but-safe');
    // The scale misread AND the living landmark are the same organism (the
    // wreck-tower that is alive).
    expect(TIER4_CREATURES['T-22']!.minimums).toContain('scale-misread');
    expect(TIER4_CREATURES['T-22']!.minimums).toContain('living-landmark');
    // The colossal presence communicated first through other fauna, and the
    // encounter where the player never gets a clean full-body view.
    expect(TIER4_CREATURES['T-23']!.minimums).toContain('felt-through-fauna');
    expect(TIER4_CREATURES['T-23']!.minimums).toContain('never-full-body-view');
    // The organism that cannot be mapped to any Earth body plan (no head).
    expect(TIER4_CREATURES['T-25']!.minimums).toContain('uncategorizable');
    // The fixed-point set piece carries no section 11.1 minimum — the roster
    // assigns it none, so the field must stay absent (not invented).
    expect(TIER4_CREATURES['T-20']!.minimums).toBeUndefined();
  });

  it('carries designed depth bands for every id (WI-03d3 will spawn within them)', () => {
    for (const id of TIER4_IDS) {
      const bands = TIER4_BANDS[id];
      expect(bands, `${id} has no designed bands`).toBeDefined();
      expect(bands!.size, `${id} needs at least one band`).toBeGreaterThan(0);
      for (const band of bands!) {
        expect(band).toBeGreaterThanOrEqual(1);
        expect(band).toBeLessThanOrEqual(5);
      }
    }
  });

  it('§46 colossal test (data half): the crossing presence is slow in body space but fast in world space, and every tier-4 body dwarfs tiers 1-3', () => {
    const crossing = TIER4_CREATURES['T-23']!;
    const extent = bodyExtent(crossing);
    expect(extent, 'the crossing presence must be colossal (extent ≥ 4000)').toBeGreaterThanOrEqual(4000);
    expect(
      crossing.movement.maxSpeed / extent,
      'technique F: the body moves slowly in body space (< 5% of a body length per second)',
    ).toBeLessThan(0.05);
    expect(
      crossing.movement.maxSpeed,
      'technique F: ...while covering large world distance (≥ 60 units/s)',
    ).toBeGreaterThanOrEqual(60);
    const maxOther = Math.max(
      ...HIDDEN_CREATURES.filter((d) => !TIER4_IDS.includes(d.id)).map((d) => bodyExtent(d)),
    );
    for (const id of TIER4_IDS) {
      expect(
        bodyExtent(TIER4_CREATURES[id]!),
        `${id} must dwarf every smaller-tier body`,
      ).toBeGreaterThan(2 * maxOther);
    }
  });

  it('keeps body and movement signatures unique across the whole roster (22 defs, §46 shark test)', () => {
    expect(HIDDEN_CREATURES).toHaveLength(22);
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

describe('non-combat-target: no HP bar, no kill path (request §10)', () => {
  // The player starts at (1300, -100). Every scenario spawns the presence in
  // clear greybox water inside HARPOON_RANGE and fires on real `useTool`
  // input — no mocks, no direct state edits.

  it('the harpoon never selects a colossal presence; a small fauna in the same shot is still killed (T-22 + T-01)', () => {
    const sc = new Scenario(401, greyboxWorld([
      { id: 't22-s', creature: 'T-22', position: vec2(1600, -200) },
      { id: 't01-s', creature: 'T-01', position: vec2(1500, -300) },
    ]));
    const t22 = one(sc, 'T-22');
    const t01 = one(sc, 'T-01');
    sc.assert(dist(sc.sim.player.position, t22.position) < 600, 'the presence is inside the lance range');
    sc.step({ ...emptyInput(), toolSelect: 2 }); // select the harpoon
    sc.step({ ...emptyInput(), useTool: true }); // one lance
    sc.step({ ...emptyInput(), useTool: false });
    expect(t01.dead, 'the small fauna is the nearest targetable creature and must be hit').toBe(true);
    sc.assert(t22.harpoonHits === 0, 'the colossal presence must take no harpoon hit');
    sc.assert(!t22.dead && t22.deterredUntil === 0, 'the colossal presence is never a combat target (no kill, no deter)');
    sc.assert(sc.sim.creatures.some((c) => c === t22), 'the colossal presence remains in the world');
  });

  it('a harpoon aimed at a lone colossal presence lances nothing (T-19)', () => {
    const sc = new Scenario(403, greyboxWorld([
      { id: 't19-s', creature: 'T-19', position: vec2(1700, -300) },
    ]));
    const t19 = one(sc, 'T-19');
    sc.assert(dist(sc.sim.player.position, t19.position) < 600, 'the presence is inside the lance range');
    sc.step({ ...emptyInput(), toolSelect: 2 });
    sc.step({ ...emptyInput(), useTool: true });
    sc.step({ ...emptyInput(), useTool: false });
    sc.assert(t19.harpoonHits === 0, 'the presence must never register a hit');
    sc.assert(!t19.dead && t19.deterredUntil === 0, 'no kill path and no deter for the presence');
  });

  it('a hunting predator cannot kill a colossal presence (T-14 vs T-22), while the same hunt kills ordinary fauna (T-14 vs T-06)', () => {
    const runHunt = (creature: 'T-22' | 'T-06', seed: number): boolean => {
      const sc = new Scenario(seed, greyboxWorld([
        { id: 't14-post', creature: 'T-14', position: vec2(1600, -300) },
        { id: 'prey', creature, position: vec2(1560, -320) },
      ]));
      const t14 = one(sc, 'T-14');
      const prey = one(sc, creature);
      sc.assert(dist(t14.position, prey.position) < 60, 'the prey sits inside the kill distance of the post');
      runA(sc, 2, []); // settle
      sc.sim.player.capabilities.add('sonar');
      sc.step({ ...emptyInput(), sonar: true }); // arm the post
      sc.step({ ...emptyInput(), sonar: false });
      runA(sc, 30, []);
      return prey.dead;
    };
    expect(runHunt('T-06', 407), 'ordinary fauna must be killable by the armed hunt (the kill path is live)').toBe(true);
    const sc = new Scenario(409, greyboxWorld([
      { id: 't14-post', creature: 'T-14', position: vec2(1600, -300) },
      { id: 't22-prey', creature: 'T-22', position: vec2(1560, -320) },
    ]));
    const t22 = one(sc, 'T-22');
    sc.assert(dist(one(sc, 'T-14').position, t22.position) < 60, 'the presence sits inside the kill distance of the post');
    runA(sc, 2, []);
    sc.sim.player.capabilities.add('sonar');
    sc.step({ ...emptyInput(), sonar: true });
    sc.step({ ...emptyInput(), sonar: false });
    const hunting = new Set<string>();
    const steps = Math.round(30 / FIXED_DT);
    for (let i = 0; i < steps; i += 1) {
      sc.step(emptyInput());
      hunting.add(one(sc, 'T-14').state);
    }
    sc.assert(
      hunting.has('alert') || hunting.has('stalk'),
      'the predator must have entered a hunting state (the kill path was armed and live)',
    );
    sc.assert(!t22.dead, 'the colossal presence must survive an armed hunt (no kill path)');
    sc.assert(t22.harpoonHits === 0, 'the presence never registers combat damage');
  });
});

describe('signature rule: the plume that is not a weapon (T-19)', () => {
  it('a close player closes the plume and the organism drifts off, unharmful; standing away lets it unfurl at home', () => {
    const sc = new Scenario(411, greyboxWorld([
      { id: 't19-a', creature: 'T-19', position: vec2(1700, -700) },
    ]));
    const t19 = one(sc, 'T-19');
    const events: { creatureId: string; state: string; call: string; time: number }[] = [];
    sc.swimTo(vec2(1950, -740), 40); // close enough to disturb the plume
    const home = { x: t19.home.x, y: t19.home.y };
    let fleeSeen = false;
    const states = new Set<string>();
    // The standoff: the player holds close; the plume must close and drift off.
    // The organism's own collision body fixes the closest approach (~390);
    // the disturbance radius sits just outside it, so "close" is measured
    // against the avoid radius, not against a point the body blocks.
    const standoffSteps = Math.round(20 / FIXED_DT);
    let minApproach = Infinity;
    for (let i = 0; i < standoffSteps; i += 1) {
      sc.step(emptyInput());
      for (const e of sc.sim.creatureAudioEvents) events.push(e);
      states.add(t19.state);
      if (t19.state === 'flee') fleeSeen = true;
      minApproach = Math.min(minApproach, dist(t19.position, sc.sim.player.position));
    }
    sc.assert(fleeSeen, 'the plume must close (flee state) once the player is close');
    sc.assert(minApproach < 440, `the player actually disturbed the plume (closest ${minApproach.toFixed(0)})`);
    sc.assert(
      dist(t19.position, sc.sim.player.position) > minApproach + 150,
      'with the plume closed the organism must drift off, not stay put',
    );
    for (const bad of ['attack', 'stalk']) {
      sc.assert(!states.has(bad), `the plume organism must never enter a pursuit state (saw ${bad})`);
    }
    sc.assert(sc.sim.player.health === 100, 'the organism must be harmless (no damage to the player)');
    // The withdrawal: the player leaves; the organism returns home and unfurls.
    sc.swimTo(vec2(1400, -200), 50, 20000);
    let backHome = false;
    for (let s = 0; s < Math.round(50 / FIXED_DT) && !backHome; s += 1) {
      sc.step(emptyInput());
      for (const e of sc.sim.creatureAudioEvents) events.push(e);
      if (t19.state === 'forage' && dist(t19.position, home) < 80) backHome = true;
    }
    sc.assert(backHome, 'after the player stands away, the organism must return home and hold (plume unfurled)');
    sc.assert(callsFor(events, 'T-19').length > 0, 'the close/unfurl transitions must emit audio event data');
  });
});

describe('signature rule: the fixed-point pulse organ (T-20)', () => {
  // T-20 sits at (500, -600) in clear greybox water (west of the coast wall,
  // its whole body above the seabed floor). The listener sits at (1900, -600)
  // — 1400 units out, beyond the sim's clean-view range but inside the bus
  // query radius; the scan point (1800, -600) and the ride point (1200, -600)
  // sit on the same clear east-west line.

  it('the player hears the pulse from beyond sight range before it can see the organ', () => {
    const sc = new Scenario(421, greyboxWorld([
      { id: 't20-a', creature: 'T-20', position: vec2(500, -600) },
    ]));
    const t20 = one(sc, 'T-20');
    sc.swimTo(vec2(1850, -600), 40);
    sc.stepFor(3, emptyInput()); // let the arrival inertia settle
    sc.assert(
      dist(sc.sim.player.position, t20.position) > FULL_BODY_VIEW_RANGE,
      'the listener must be beyond sight range of the organ',
    );
    const scratch: import('../creatures/senses').WorldSignal[] = [];
    let heardAt = -1;
    let heardDist = 0;
    const steps = Math.round(13 / FIXED_DT);
    for (let i = 0; i < steps && heardAt < 0; i += 1) {
      sc.step(emptyInput());
      const n = sc.sim.signals.queryNear(
        sc.sim.player.position.x, sc.sim.player.position.y, 1600, sc.sim.state.timeSec, scratch,
      );
      for (let k = 0; k < n; k += 1) {
        const s = scratch[k]!;
        if ((s.type === 'noise' || s.type === 'light') && s.tag === 'pulse' && s.strength >= 0.05) {
          heardAt = sc.time;
          heardDist = dist(s.pos, sc.sim.player.position);
        }
      }
    }
    sc.assert(heardAt > 0, 'the pulse must be audible on the bus (sub-bass advance warning)');
    sc.assert(heardDist > FULL_BODY_VIEW_RANGE, 'the pulse must be heard from far beyond the sight range');
  });

  it('sonar returns an echo at impossible scale: a massive target stamped well outside the view window (technique E)', () => {
    const sc = new Scenario(423, greyboxWorld([
      { id: 't20-b', creature: 'T-20', position: vec2(500, -600) },
    ]));
    const t20 = one(sc, 'T-20');
    sc.swimTo(vec2(1800, -600), 40);
    const scanDist = dist(sc.sim.player.position, t20.position);
    sc.assert(scanDist > FULL_BODY_VIEW_RANGE, 'the scan point must be beyond a clean view of the organ');
    sc.sim.player.capabilities.add('sonar');
    sc.step({ ...emptyInput(), sonar: true });
    sc.step({ ...emptyInput(), sonar: false });
    runA(sc, 3.5, []);
    const target = sc.sim.sonar.targets.find(
      (t) => t.lastHit > 0 && dist({ x: t.x, y: t.y }, t20.position) < 10,
    );
    sc.assert(target !== undefined, 'the sonar ring must stamp the organ');
    sc.assert(target!.size > 4, `the sonar target must carry an impossible scale (size ${target?.size})`);
    const echo = sc.sim.sonar.echoes.find((e) => e.active && dist({ x: e.x, y: e.y }, t20.position) < 10);
    sc.assert(echo !== undefined, 'an echo particle must exist at the organ');
    sc.assert(echo!.life > 3, `a massive echo must outlive a normal echo (life ${echo?.life})`);
    sc.assert(
      dist(echo!, sc.sim.player.position) > FULL_BODY_VIEW_RANGE,
      'the echo must return at a distance beyond a clean view of the organ',
    );
    sc.assert(!sc.sim.hasCleanFullBody(t20), 'no clean full-body view of the organ at this range');
  });

  it('the player can ride the pulsing current it drives: a carried drift away from the organ', () => {
    const sc = new Scenario(425, greyboxWorld([
      { id: 't20-c', creature: 'T-20', position: vec2(500, -600) },
    ]));
    const t20 = one(sc, 'T-20');
    sc.swimTo(vec2(1200, -600), 40);
    sc.stepFor(3, emptyInput()); // let the arrival inertia settle
    sc.assert(dist(sc.sim.player.position, t20.position) < 1200, 'the player must be inside the ride radius');
    const start = { x: sc.sim.player.position.x, y: sc.sim.player.position.y };
    runA(sc, 15, []);
    const dx = sc.sim.player.position.x - start.x;
    const dy = sc.sim.player.position.y - start.y;
    sc.assert(
      dx > 250 && Math.abs(dy) < 120,
      `with no input the player must be carried east (away from the organ): (dx=${dx.toFixed(0)}, dy=${dy.toFixed(0)})`,
    );
  });
});

describe('signature rule: the living landmark that reads as geology (T-22)', () => {
  // T-22 stands at (1500, -200) in clear greybox water: its lowest chain
  // circle clears the seabed floor and its widest circle clears the coast wall,
  // so the only motion the sim can give it is the creaking rule's own steps.
  it('it moves only in creaking steps: a measurable drift that stays a small fraction of its own body (scale misread)', () => {
    const sc = new Scenario(431, greyboxWorld([
      { id: 't22-a', creature: 'T-22', position: vec2(1500, -200) },
    ]));
    const t22 = one(sc, 'T-22');
    const x0 = t22.position.x;
    const events: { creatureId: string; state: string; call: string; time: number }[] = [];
    runA(sc, 60, events);
    const dx = t22.position.x - x0;
    const extent = bodyExtent(t22.def);
    sc.assert(extent >= 2000, `the landmark must read as large architecture (extent ${extent})`);
    sc.assert(
      dx >= 60 && dx <= 110,
      `over 60 s the drift must be measurable but terrain-slow (dx=${dx.toFixed(0)})`,
    );
    sc.assert(
      dx < 0.05 * extent,
      `the drift must stay a small fraction of the body (dx=${dx.toFixed(0)} vs extent ${extent}) — the scale misread holds`,
    );
    const creaks = events.filter((e) => e.creatureId === 'T-22');
    sc.assert(creaks.length >= 6, `each creaking step must emit audio event data (saw ${creaks.length} of 8)`);
    // The creaks are stepwise: most steps the position is frozen.
    let stillSteps = 0;
    let px = t22.position.x;
    const sc2 = new Scenario(433, greyboxWorld([
      { id: 't22-b', creature: 'T-22', position: vec2(1500, -200) },
    ]));
    const t22b = one(sc2, 'T-22');
    px = t22b.position.x;
    for (let i = 0; i < Math.round(40 / FIXED_DT); i += 1) {
      sc2.step(emptyInput());
      if (Math.abs(t22b.position.x - px) < 0.5) stillSteps += 1;
      px = t22b.position.x;
    }
    sc.assert(
      stillSteps / (40 / FIXED_DT) > 0.9,
      `the motion must be stepwise creaks, not a swim (still on ${((stillSteps / (40 / FIXED_DT)) * 100).toFixed(0)}% of steps)`,
    );
  });
});

/**
 * The crossing-encounter world (WI-03d1): the production coast band plus a
 * band-5 open basin where the presence holds at the start of its crossing
 * lane (home ± 2400) until a diver is near, then runs it west first. Local
 * fauna (a T-03 congregation, T-06 drifters) sit on the lane for the
 * announcement to act on.
 */
function t23World(): SimWorld {
  const basin: WorldChunkDef = {
    id: 't23-basin',
    band: 5,
    bounds: { x: 6400, y: -2400, w: 13600, h: 2000 },
    terrain: [
      {
        id: 't23-floor',
        closed: true,
        points: [vec2(6400, -4400), vec2(20000, -4400), vec2(20000, -4100), vec2(6400, -4100)],
      },
      {
        id: 't23-east-wall',
        closed: true,
        points: [vec2(20000, -2400), vec2(20300, -2400), vec2(20300, -4400), vec2(20000, -4400)],
      },
    ],
    exits: [{ id: 't23-to-seabed', to: 'seabed', position: vec2(6600, -2200) }],
    creatureSpawns: [
      { id: 't23-crossing', creature: 'T-23', position: vec2(12800, -3400), count: 1 },
      // The local fauna sit between the waiting player (10800, -3400) and the
      // crossing lane start (12800): the drifters at 11700 are inside the
      // flee-reaction radius of the announcement window's edge (12600), so
      // they react while the presence is still beyond the player's clean view.
      { id: 't23-congregation', creature: 'T-03', position: vec2(12300, -3500), count: 4 },
      { id: 't23-drifters', creature: 'T-06', position: vec2(11700, -3600), count: 3 },
    ],
  };
  return { chunks: [...GREYBOX_WORLD, basin], base: BASE, currentFields: [] };
}

describe('signature rule: the crossing presence announced by the fauna (T-23)', () => {
  it('fauna react first, the player never gets a clean full-body view, and the body covers large world distance moving slowly in body space (techniques D, no-clean-view, F)', () => {
    const sc = new Scenario(441, t23World());
    const t23 = one(sc, 'T-23');
    const drifters = sc.sim.creatures.filter((c) => c.def.id === 'T-06');
    sc.assert(drifters.length === 3, 'the announcement needs local fauna present');
    // The player dives into the basin and waits at (10000, -3400) — inside
    // the AI-active range but outside the crossing's release radius — so the
    // presence is alive yet still holding at the lane start.
    sc.swimTo(vec2(5700, -1600), 60, 20000);
    sc.swimTo(vec2(7000, -3300), 60, 20000);
    sc.swimTo(vec2(10000, -3400), 40, 20000);
    sc.assert(
      Math.abs(t23.position.x - 12800) < 400,
      'the crossing must still be holding at the lane start when the player arrives',
    );
    // The diver closes inside the release radius; the crossing starts.
    sc.swimTo(vec2(10800, -3400), 40, 20000);

    const extent = bodyExtent(t23.def);
    let tAnnounce = -1; // the announcement window opens (designed reaction radius)
    let tReact = -1; // first local-fauna state change (flee)
    let tVisual = -1; // first direct sight evidence (presence inside the clean-view range)
    let tHeartbeat = -1; // first direct sound evidence (the presence's own audio)
    let drifterX0 = 0;
    let cruiseStart = -1;
    let cruiseEnd = -1;
    let cruiseX0 = 0;
    let cruiseXEnd = 0;
    let cleanViewAt = -1;
    let pathLength = 0;
    let prevX = t23.position.x;
    let ended = false;
    const total = Math.round(150 / FIXED_DT);
    for (let i = 0; i < total && !ended; i += 1) {
      sc.step(emptyInput());
      const d = dist(t23.position, sc.sim.player.position);
      if (tAnnounce < 0 && d < 2400) {
        tAnnounce = sc.time;
        drifterX0 = Math.min(...drifters.map((c) => c.position.x));
      }
      if (tVisual < 0 && d <= FULL_BODY_VIEW_RANGE) tVisual = sc.time;
      for (const e of sc.sim.creatureAudioEvents) {
        if (e.creatureId === 'T-23' && tHeartbeat < 0) tHeartbeat = sc.time;
      }
      if (cleanViewAt < 0 && sc.sim.hasCleanFullBody(t23)) cleanViewAt = sc.time;
      if (tAnnounce > 0 && tReact < 0 && tVisual < 0) {
        const fled = drifters.some((c) => c.position.x < drifterX0 - 50);
        if (fled) tReact = sc.time;
      }
      // The steady-approach window (westbound only, before first sight).
      if (tAnnounce >= 0 && tVisual < 0 && t23.position.x < prevX && d >= 1300 && d <= 2500) {
        if (cruiseStart < 0) {
          cruiseStart = sc.time;
          cruiseX0 = t23.position.x;
        }
        cruiseEnd = sc.time;
        cruiseXEnd = t23.position.x;
      }
      pathLength += Math.abs(t23.position.x - prevX);
      prevX = t23.position.x;
      if (tVisual > 0 && d > 2400) ended = true; // the crossing has passed
    }
    sc.assert(ended, 'the crossing must complete: it approaches, passes the player, and leaves the window');
    sc.assert(tAnnounce > 0, 'the announcement window must open');
    sc.assert(tVisual > 0, 'the player must eventually have direct sight evidence');
    // AC floor 1 — the environment reaction PRECEDES any direct evidence.
    sc.assert(tReact > 0, 'local fauna must react (flee) while the window is open');
    sc.assert(
      tReact < tVisual,
      `fauna reaction (t=${tReact.toFixed(1)}) must precede direct sight evidence (t=${tVisual.toFixed(1)})`,
    );
    sc.assert(tHeartbeat > 0, 'the presence must have its own sound evidence (heartbeat) inside the view');
    sc.assert(
      tReact < tHeartbeat,
      `fauna reaction (t=${tReact.toFixed(1)}) must precede the presence's own sound (t=${tHeartbeat.toFixed(1)})`,
    );
    sc.assert(
      tVisual - tAnnounce >= 3,
      `the designed window must give the fauna seconds of head start (sight at +${(tVisual - tAnnounce).toFixed(1)}s)`,
    );
    // AC floor 2 — no clean full-body window ever, from the sim's visibility state.
    sc.assert(cleanViewAt < 0, 'the sim visibility state must never report a clean full-body view of the crossing');
    // Technique F — speed mismatch.
    sc.assert(
      cruiseEnd > cruiseStart + 3,
      'the cruise window must be measurable (steady approach, not the turn)',
    );
    const worldSpeed = (cruiseX0 - cruiseXEnd) / (cruiseEnd - cruiseStart);
    sc.assert(worldSpeed >= 60, `the body must cover large world distance (measured ${worldSpeed.toFixed(0)} units/s)`);
    sc.assert(
      worldSpeed / extent < 0.05,
      `...while moving slowly in body space (${(worldSpeed / extent).toFixed(3)} body lengths/s over extent ${extent})`,
    );
    sc.assert(pathLength >= 3000, `the encounter must span a large world distance (path ${pathLength.toFixed(0)} units)`);
  });
});

describe('signature rule: the headless reconfiguring cluster (T-25)', () => {
  it('it drifts with the local eddy current and reconfigures on a clinking cycle', () => {
    const field = driftField({ x: 2400, y: -1400, w: 2200, h: 1000 }, vec2(1, 0), 60);
    const sc = new Scenario(451, greyboxWorld(
      [{ id: 't25-a', creature: 'T-25', position: vec2(3300, -900) }],
      [field],
    ));
    const t25 = one(sc, 'T-25');
    const start = { x: t25.position.x, y: t25.position.y };
    const events: { creatureId: string; state: string; call: string; time: number }[] = [];
    runA(sc, 25, events);
    const dx = t25.position.x - start.x;
    const dy = t25.position.y - start.y;
    sc.assert(
      dx >= 300 && Math.abs(dy) < 120,
      `the cluster must drift along the local current (dx=${dx.toFixed(0)}, dy=${dy.toFixed(0)})`,
    );
    const clinks = events.filter((e) => e.creatureId === 'T-25');
    sc.assert(clinks.length >= 3, `reconfigurations must emit audio event data on a cycle (saw ${clinks.length})`);
    sc.assert(
      clinks.length >= 3 && (clinks[clinks.length - 1]!.time - clinks[0]!.time) / (clinks.length - 1) > 4,
      'the reconfigure cycle must be periodic, not a burst',
    );
    sc.assert(!t25.dead && t25.harpoonHits === 0, 'the cluster is not a combat target');
  });
});

describe('AC-roster-large floors (headless final proof)', () => {
  it('at least 3 large-scale creatures exist: the tier carries five, and both colossal presences are not simply hostile', () => {
    const large = TIER4_IDS.filter((id) => bodyExtent(TIER4_CREATURES[id]!) >= 800);
    expect(large.length, 'the at-least-3 large-scale floor').toBeGreaterThanOrEqual(3);
    expect(large.length, 'the tier lands 2-4 set pieces plus 2-3 colossal presences').toBeGreaterThanOrEqual(5);
    const nonHostile = TIER4_IDS.filter((id) => TIER4_CREATURES[id]!.combat === undefined);
    expect(nonHostile, 'at least one colossal presence not simply hostile (all five are)').toContain('T-23');
    expect(nonHostile).toContain('T-25');
    expect(nonHostile.length).toBeGreaterThanOrEqual(2);
  });
});

describe('spoiler containment for this work item (§0/§12/§68)', () => {
  it('no creature name or secret description appears outside the private content', () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const tokensPath = join(here, '..', '..', 'design_private', '_spoiler_tokens.txt');
    // T-IDs are internal identifiers — legal here per §68, so only the name
    // tokens are checked.
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
        const re = new RegExp(`\\b${t.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
        if (re.test(text)) offenders.push(`${p} :: ${t}`);
      }
    };
    // This item's product surface: the creature framework, the simulation,
    // the player tooling, the tuning constants, and the secret content file.
    for (const dir of ['src/sim', 'src/creatures', 'src/player', 'src/game']) {
      const abs = join(here, '..', '..', dir);
      for (const f of readdirSync(abs)) {
        if (f.endsWith('.ts')) scanFile(join(abs, f));
      }
    }
    scanFile(join(here, '..', '..', 'src', 'content', 'secret', 'hiddenCreatures.ts'));
    scanFile(join(here, '..', '..', 'src', 'world', 'worldData.ts'));
    // The implementation artifacts of this execution attempt.
    const implDir = join(here, '..', '..', 'agents', 'tasks', 'hadalv2.execute_leaf.WI-03d1.__item_WI-03d1.__attempt_0001', 'implementation');
    if (existsSync(implDir)) {
      for (const f of readdirSync(implDir)) {
        if (f.endsWith('.md')) scanFile(join(implDir, f));
      }
    }
    expect(offenders, `spoiler tokens found: ${offenders.join(', ')}`).toEqual([]);
  });
});




