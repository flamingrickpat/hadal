/**
 * Tests — the tier-1 ambient/schooling roster (WI-03a): the six tiny
 *   organisms the private roster selects for the ambient tier (T-01, T-02,
 *   T-03, T-05, T-06, T-13 — internal ids only, request §0/§33/§68). Each
 *   has a headless signature-rule scenario through the production simulation,
 *   plus the world-data check that every tier-1 spawn id resolves and sits in
 *   the band the roster designed it for (a tier-1 portion of the roster-wide
 *   check WI-03d finalizes). No rule is mocked: every scenario drives the
 *   real `Simulation` on `GREYBOX_WORLD` or the production `MACRO_WORLD`.
 */
import { describe, expect, it } from 'vitest';
import { vec2, type Vec2 } from '../util/math';
import { emptyInput, makeSimWorld, type SimWorld } from './Simulation';
import { Scenario } from './scenario';
import { CREATURE_BY_ID } from '../creatures/fixtures';
import { TIER1_IDS, TIER1_BANDS, HIDDEN_CREATURES } from '../content/secret/hiddenCreatures';
import { driftField, ventField } from '../systems/CurrentSystem';
import { BASE, GREYBOX_WORLD } from '../world/worldData';
import type { CreatureSpawnDef } from '../world/chunks';

const dist = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.y - b.y);

/** GREYBOX_WORLD with authored spawns on its first chunk (clear of terrain). */
function greyboxWorld(spawns: readonly CreatureSpawnDef[], currentFields: SimWorld['currentFields'] = []): SimWorld {
  const chunks = GREYBOX_WORLD.map((c, i) => (i === 0 ? { ...c, creatureSpawns: spawns } : c));
  return { chunks, base: BASE, currentFields };
}

/** A production `MACRO_WORLD` scenario with the player moved straight to `pos`. */
function macroWorldAt(pos: Vec2): Scenario {
  const sc = new Scenario(11, makeSimWorld());
  sc.sim.player.position.x = pos.x;
  sc.sim.player.position.y = pos.y;
  sc.sim.player.velocity.x = 0;
  sc.sim.player.velocity.y = 0;
  return sc;
}

describe('tier-1 roster data (WI-03a)', () => {
  it('all six selected organisms are registered and are neutral', () => {
    expect(TIER1_IDS).toHaveLength(6);
    expect(new Set(TIER1_IDS).size).toBe(6); // distinct ids
    for (const id of TIER1_IDS) {
      const def = CREATURE_BY_ID[id]!;
      expect(def, `registry is missing tier-1 id ${id}`).toBeDefined();
      expect(def.combat).toBeUndefined(); // no predators in this tier
    }
  });

  it('every production spawn resolves and sits in its designed band (§49 dense traversal)', () => {
    const bandsById = new Map<string, Set<number>>();
    let spawns = 0;
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
        const allowed = TIER1_BANDS[spawn.creature];
        if (allowed === undefined) continue; // other tiers' content, WI-03d's concern
        expect(allowed.has(chunk.band), `${spawn.creature} in chunk ${chunk.id} band ${chunk.band} (designed ${[...allowed].join(',')})`).toBe(true);
        if (!bandsById.has(spawn.creature)) bandsById.set(spawn.creature, new Set());
        bandsById.get(spawn.creature)!.add(chunk.band);
        spawns += spawn.count ?? 1;
      }
    }
    // Every tier-1 organism appears in every band the roster designed it for.
    for (const id of TIER1_IDS) {
      const placed = bandsById.get(id) ?? new Set<number>();
      const bands = TIER1_BANDS[id]!;
      for (const band of bands) {
        expect(placed.has(band), `${id} is missing from band ${band} in the production world data`).toBe(true);
      }
    }
    expect(spawns).toBeGreaterThanOrEqual(30);
  });

  it('bodies are distinct: no two share a body and movement fingerprint (§46)', () => {
    expect(HIDDEN_CREATURES).toHaveLength(12); // tier-1 (6) + tier-2 (6)
    const seen = new Set<string>();
    for (const def of HIDDEN_CREATURES) {
      const chains = (def.body!.chainCircles ?? [])
        .map((c) => `${c.offset.x},${c.offset.y},${c.radius}`)
        .sort()
        .join('|');
      const fp = `${def.body!.radius}|${chains}|${def.movement.maxSpeed}|${def.movement.dragRate}`;
      expect(seen.has(fp), `duplicate body/movement fingerprint on ${def.id}`).toBe(false);
      seen.add(fp);
    }
  });
});

describe('T-01: the school parts around the moving player and reforms (§48)', () => {
  it('yields as a coherent school while the player closes in, and stays a tight cluster after', () => {
    // 2000 sits west of the greybox wall pillar (x 2370-2434) that hangs
    // from the surface — the player's swim path from (1300,-100) is clear.
    const sc = new Scenario(7, greyboxWorld([{ id: 't01-1', creature: 'T-01', position: vec2(2000, -800), count: 8 }]));
    const school = sc.sim.creatures;
    expect(school).toHaveLength(8);
    const meanPos = (): Vec2 => {
      const s = vec2(0, 0);
      for (const c of school) {
        s.x += c.position.x;
        s.y += c.position.y;
      }
      return vec2(s.x / school.length, s.y / school.length);
    };
    const spread = (): number => Math.max(...school.map((c) => dist(c.position, meanPos())));
    const minD = (): number => Math.min(...school.map((c) => dist(c.position, sc.sim.player.position)));
    // Let the school settle into one cluster before the player arrives.
    sc.stepFor(8, emptyInput());
    expect(spread()).toBeLessThan(400);

    // The player swims straight into the school (real movement inputs) until
    // inside its parting radius.
    sc.swimTo(vec2(2000, -800), 120, 600);
    expect(minD()).toBeLessThan(300); // the player reached the school's parting radius
    const atArrival = minD();

    // The parting (request §48): while the player holds position inside the
    // parting radius, the repulsion keeps every member clear of the player —
    // the closest member keeps moving away.
    sc.stepFor(20, emptyInput());
    const parted = minD();
    expect(parted).toBeGreaterThan(atArrival + 50);
    expect(parted).toBeGreaterThan(150);
    // ...and the school does not disperse: it stays one tight cluster
    // (it re-formed the parting into a moved-together group).
    expect(spread()).toBeLessThan(400);
    sc.trace('T-01 school parted around the player and stayed cohesive');
  });

  it('swimming inside an active school drags the player slightly (dense medium)', () => {
    const sc = new Scenario(9, greyboxWorld([{ id: 't01-2', creature: 'T-01', position: vec2(2000, -800), count: 8 }]));
    sc.stepFor(8, emptyInput());
    sc.swimTo(vec2(2000, -800), 60, 600);
    // The player is now inside the school's parting radius; cohesion pulls
    // the members back around the stopped player.
    sc.stepFor(6, emptyInput());
    const t01 = sc.sim.creatures;
    const inSchool = t01.some((c) => dist(c.position, sc.sim.player.position) < 300);
    expect(inSchool, 'player never reached an active T-01 school').toBe(true);
    // Dense medium: the player's speed is damped below the control baseline
    // while inside the school's parting radius.
    expect(sc.sim.denseMediumFactor).toBeLessThan(1);
    sc.trace('T-01 dense medium damped the player inside the school');
  });
});

describe('T-02: the drifter descends with the current (§20, §64 filter-feeder orientation)', () => {
  it('orients and drifts with the local current field while staying forage', () => {
    // A real current field over the greybox open water, same direction the
    // production drift field runs: down-slope to the east.
    const cur = driftField({ x: 0, y: -1200, w: 6000, h: 800 }, vec2(1, -0.2), 26);
    const sc = new Scenario(21, greyboxWorld([{ id: 't02-1', creature: 'T-02', position: vec2(2700, -800) }], [cur]));
    const c = sc.sim.creatures[0]!;
    const start = vec2(c.position.x, c.position.y);
    sc.stepFor(20, emptyInput());
    expect(c.state).toBe('forage'); // the current is the driver, no signal needed
    const moved = vec2(c.position.x - start.x, c.position.y - start.y);
    const len = Math.hypot(moved.x, moved.y);
    expect(len).toBeGreaterThan(100); // it drifted, not just jittered
    // Orientation: displacement is along (not against) the current.
    const dot = moved.x * 1 + moved.y * -0.2;
    expect(dot / len).toBeGreaterThan(0.9);
    sc.trace('T-02 drifted with the current');
  });
});

describe('T-03: the loose swarm tightens and parts when something enormous approaches (§48)', () => {
  it('congregates loosely, parts around the moving player, reforms', () => {
    const sc = new Scenario(33, greyboxWorld([{ id: 't03-1', creature: 'T-03', position: vec2(2700, -800), count: 6 }]));
    const swarm = sc.sim.creatures;
    const meanPos = (): Vec2 => {
      const s = vec2(0, 0);
      for (const c of swarm) {
        s.x += c.position.x;
        s.y += c.position.y;
      }
      return vec2(s.x / swarm.length, s.y / swarm.length);
    };
    sc.stepFor(8, emptyInput());
    const loose = Math.max(...swarm.map((c) => dist(c.position, meanPos())));
    expect(loose).toBeLessThan(500); // one congregation, but looser than T-01
    sc.swimTo(vec2(2700, -800), 100, 600);
    const through = Math.min(...swarm.map((c) => dist(c.position, sc.sim.player.position)));
    expect(through).toBeGreaterThan(60);
    sc.stepFor(12, emptyInput());
    const reformed = Math.max(...swarm.map((c) => dist(c.position, meanPos())));
    expect(reformed).toBeLessThan(400);
    sc.trace('T-03 congregation parted around the player and reformed');
  });
});

describe('T-05: the overhang feeder sways in the vent current and holds its place', () => {
  it('hangs near its overhang, sways with the vent, and stays within reach', () => {
    // A vent field where the overhang hangs: upward flow, strongest mid-vent.
    const cur = ventField({ x: 2000, y: -1100, w: 800, h: 600 }, 40);
    const sc = new Scenario(41, greyboxWorld([{ id: 't05-1', creature: 'T-05', position: vec2(2600, -800) }], [cur]));
    const c = sc.sim.creatures[0]!;
    const start = vec2(c.position.x, c.position.y);
    sc.stepFor(25, emptyInput());
    // Sway: it moves (the vent drives it) but stays close to home — a hanging
    // feeder, not a swimmer.
    const moved = dist(c.position, start);
    expect(moved).toBeGreaterThan(20);
    expect(moved).toBeLessThan(400);
    expect(c.state).toBe('forage');
    sc.trace('T-05 swayed in the vent and held its overhang');
  });
});

describe('T-06: the drifter rides the current (flicker compass is render-only)', () => {
  it('rides the drift field east, the way the world current carries them', () => {
    const cur = driftField({ x: 0, y: -1200, w: 6000, h: 800 }, vec2(1, 0), 20);
    const sc = new Scenario(53, greyboxWorld([{ id: 't06-1', creature: 'T-06', position: vec2(2700, -800) }], [cur]));
    const c = sc.sim.creatures[0]!;
    const startX = c.position.x;
    sc.stepFor(20, emptyInput());
    expect(c.position.x - startX).toBeGreaterThan(100); // carried east by the drift
    expect(Math.hypot(c.position.x - 2700, c.position.y + 800)).toBeLessThan(1200); // stays in the ribbon's water
    sc.trace('T-06 drifted with the current');
  });
});

describe('T-13: the marker flees a close approach (noise-sensed, no combat)', () => {
  it('flee-transitions on a tool noise signal and swims away', () => {
    // 721u from the player start: inside the default sense range and close
    // enough that the tool noise (strength 0.5, temporal decay over the 3 s
    // signal lifetime) stays above the marker's 0.1 trigger for the whole
    // 4 s observation — the marker keeps running the whole time. Its flee
    // path (east, away from the player start) is clear water.
    const sc = new Scenario(67, greyboxWorld([{ id: 't13-1', creature: 'T-13', position: vec2(1900, -500) }]));
    const c = sc.sim.creatures[0]!;
    const startDist = dist(c.position, sc.sim.player.position);
    sc.step({ ...emptyInput(), useTool: true });
    expect(c.state).toBe('flee'); // the marker's signature: it runs from an approach
    sc.stepFor(4, emptyInput());
    const endDist = dist(c.position, sc.sim.player.position);
    expect(endDist).toBeGreaterThan(startDist + 100);
    sc.trace('T-13 fled the player approach');
  });
});

describe('ambient caps and offscreen throttling (§34, §16)', () => {
  it('a tier-1 organism beyond the AI range is deactivated, then reactivates on approach', () => {
    // ~3100u from the player start: beyond CREATURE_AI_RANGE, and below the
    // wall pillar's depth so the player's swim path to it is clear water.
    const far = vec2(4200, -1150);
    const sc = new Scenario(71, greyboxWorld([{ id: 't02-2', creature: 'T-02', position: far }]));
    const c = sc.sim.creatures[0]!;
    sc.stepFor(2, emptyInput());
    expect(c.active).toBe(false); // throttled offscreen
    const frozen = vec2(c.position.x, c.position.y);
    sc.stepFor(2, emptyInput());
    expect(c.position.x).toBe(frozen.x); // no motion while deactivated
    // The player swims toward it (under the pillar) — inside the range it
    // reactivates and starts moving again.
    sc.swimTo(vec2(frozen.x - 1500, frozen.y), 200, 20000);
    expect(c.active).toBe(true);
    sc.trace('T-02 offscreen throttling: deactivated and reactivated');
  });

  it('the production data keeps per-chunk tier-1 ambient counts under the cap', () => {
    const CAP = 16; // §34 ambient creature count cap per chunk
    for (const chunk of makeSimWorld().chunks) {
      let n = 0;
      for (const spawn of chunk.creatureSpawns ?? []) {
        if (TIER1_IDS.includes(spawn.creature)) n += spawn.count ?? 1;
      }
      expect(n, `chunk ${chunk.id} exceeds the tier-1 ambient cap (${n} > ${CAP})`).toBeLessThanOrEqual(CAP);
    }
  });
});
