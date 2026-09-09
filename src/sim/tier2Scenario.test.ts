/**
 * Tests — the tier-2 mid-depth useful/neutral fauna roster (WI-03b1): the
 *   six small/medium organisms the private roster selects for the useful
 *   tier (T-08, T-09, T-10, T-11, T-27, T-31 — internal ids only, request
 *   §0/§33/§68). Each species has one headless signature-rule scenario
 *   through the production simulation, plus the friendly-interaction floor
 *   check (2+ species deliver a mechanically beneficial interaction
 *   headlessly, request §21) and a spoiler containment sweep over this work
 *   item's own artifacts. No rule is mocked: every scenario drives the real
 *   `Simulation` on `GREYBOX_WORLD` (request §70).
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { vec2, type Vec2 } from '../util/math';
import { emptyInput, makeSimWorld, type SimWorld } from './Simulation';
import { Scenario } from './scenario';
import { CREATURE_BY_ID } from '../creatures/fixtures';
import { TIER1_IDS, TIER2_BANDS, TIER2_CREATURES, TIER2_IDS, HIDDEN_CREATURES } from '../content/secret/hiddenCreatures';
import { driftField } from '../systems/CurrentSystem';
import { BASE, GREYBOX_WORLD } from '../world/worldData';
import type { CreatureSpawnDef } from '../world/chunks';

const dist = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.y - b.y);

/** GREYBOX_WORLD with authored spawns on its first chunk (clear of terrain). */
function greyboxWorld(spawns: readonly CreatureSpawnDef[], currentFields: SimWorld['currentFields'] = []): SimWorld {
  const chunks = GREYBOX_WORLD.map((c, i) => (i === 0 ? { ...c, creatureSpawns: spawns } : c));
  return { chunks, base: BASE, currentFields };
}

function one(sc: Scenario, id: string) {
  const c = sc.sim.creatures.find((cr) => cr.def.id === id);
  expect(c, `creature ${id} not spawned`).toBeTruthy();
  return c!;
}

describe('mid-depth fauna registry (WI-03b1)', () => {
  it('registers the six selected ids with bands and live defs', () => {
    expect(TIER2_IDS).toHaveLength(6);
    expect(new Set(TIER2_IDS).size).toBe(6);
    for (const id of TIER2_IDS) {
      const def = TIER2_CREATURES[id];
      expect(def, `registry is missing tier-2 id ${id}`).toBeDefined();
      expect(TIER2_BANDS[id], `${id} has no designed bands`).toBeDefined();
      // Bespoke controllers own the signature rules; the generic machine
      // (wander/investigate/flee) expresses none of them.
      expect(def!.behavior.controller).toBeDefined();
      // No hostile capability in this tier — the friendly/neutral floor.
      expect(def!.combat).toBeUndefined();
    }
  });

  it('keeps body and movement signatures unique per species', () => {
    const seen = new Set<string>();
    for (const id of TIER2_IDS) {
      const def = TIER2_CREATURES[id]!;
      const chains = (def.body.chainCircles ?? [])
        .map((c) => `${c.offset.x},${c.offset.y},${c.radius}`)
        .sort()
        .join('|');
      const key = `${def.body.radius}|${chains}|${def.movement.maxSpeed}|${def.movement.dragRate}`;
      expect(seen.has(key), `duplicate body/movement signature ${key} at ${id}`).toBe(false);
      seen.add(key);
    }
  });
});

describe('tier-2 production world data (WI-03b2)', () => {
  it('every production spawn resolves, sits in a designed band, and every tier-2 id appears in every band it was designed for (§49 dense traversal)', () => {
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
        const allowed = TIER2_BANDS[spawn.creature];
        if (allowed === undefined) continue; // other tiers' content
        expect(allowed.has(chunk.band), `${spawn.creature} in chunk ${chunk.id} band ${chunk.band} (designed ${[...allowed].join(',')})`).toBe(true);
        if (!bandsById.has(spawn.creature)) bandsById.set(spawn.creature, new Set());
        bandsById.get(spawn.creature)!.add(chunk.band);
        spawns += spawn.count ?? 1;
      }
    }
    // Every tier-2 organism appears in every band the roster designed it for,
    // so no band is an empty corridor for this tier (§49).
    for (const id of TIER2_IDS) {
      const placed = bandsById.get(id) ?? new Set<number>();
      const bands = TIER2_BANDS[id]!;
      for (const band of bands) {
        expect(placed.has(band), `${id} is missing from band ${band} in the production world data`).toBe(true);
      }
    }
    expect(spawns).toBeGreaterThanOrEqual(12);
  });

  it('keeps per-chunk per-type ambient counts under the §34 cap for every roster tier', () => {
    const CAP = 16; // §34 ambient creature count cap per chunk (per type, matching the tier-1 check)
    for (const chunk of makeSimWorld().chunks) {
      for (const id of [...TIER1_IDS, ...TIER2_IDS]) {
        let n = 0;
        for (const spawn of chunk.creatureSpawns ?? []) {
          if (spawn.creature === id) n += spawn.count ?? 1;
        }
        expect(n, `chunk ${chunk.id} exceeds the ambient cap for ${id} (${n} > ${CAP})`).toBeLessThanOrEqual(CAP);
      }
    }
  });

  it('every hidden roster type is active in the production data (§11.1 roster floor)', () => {
    // The tier-2 portion of the roster-wide AC-roster-count check that WI-03d
    // finalizes: only the 12 implemented hidden types are asserted active in
    // the production data here. The 5 framework fixtures are not spawned in
    // MACRO_WORLD, so they do not count toward the 15+ roster floor — that
    // floor is WI-03d's to prove, not this item's.
    const active = new Set<string>();
    for (const chunk of makeSimWorld().chunks) {
      for (const spawn of chunk.creatureSpawns ?? []) active.add(spawn.creature);
    }
    for (const def of HIDDEN_CREATURES) {
      expect(active.has(def.id), `${def.id} has no spawn in the production world data`).toBe(true);
    }
    expect(active.size).toBeGreaterThanOrEqual(12);
  });

  it('no tier-2 spawn sits inside a closed terrain slab (§49 open-water placement)', () => {
    // A spawn whose center is strictly inside a solid slab is trapped there:
    // the terrain resolve only pushes a circle out near an edge, so a body
    // deep inside a closed slab is never pushed out, drifts to the nearest
    // interior wall, and box-walks it — never contributing to the band's
    // dense traversal. Every closed authored slab is an axis-aligned
    // rectangle, so strict bounding-box containment is exact (a point on an
    // edge resolves back to open water and is not "trapped").
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
        if (TIER2_CREATURES[spawn.creature] === undefined) continue; // tier-2 only
        checked += 1;
        const hits = trappedBy(spawn.position);
        expect(hits, `tier-2 spawn ${spawn.id} is trapped inside a solid slab: ${hits.join(', ')}`).toEqual([]);
      }
    }
    expect(checked, 'expected the loop to cover the tier-2 spawns').toBeGreaterThanOrEqual(12);
  });
});

describe('T-08: feeding trade — shed material in, a salvaged yield out (§21)', () => {
  it('hands the player a salvaged yield in exchange for one carried unit', () => {
    // The feed creature hovers near 1850,-800 with the salvage node at
    // 1600,-900: the player harvests the node first (the only way to get
    // loose material on the person), then approaches and feeds one carried
    // unit. The node is 250+ from the creature, so `interact` at the
    // creature can only be the trade.
    const sc = new Scenario(11, greyboxWorld([{ id: 't08-1', creature: 'T-08', position: vec2(1850, -800) }]));
    const c = one(sc, 'T-08');
    expect(c.active).toBe(true);
    const nodePos = sc.findNodePosition('salvage-1')!;
    const n = sc.sim.nodes.find((nd) => nd.position.x === nodePos.x && nd.position.y === nodePos.y)!;
    expect(n.amount).toBe(4);
    sc.sim.teleportTo(nodePos.x, -nodePos.y);
    sc.stepFor(2, emptyInput());
    sc.step({ ...emptyInput(), interact: true }); // harvest (takes the node's whole amount)
    const invBefore = sc.sim.player.inventory.salvage ?? 0;
    const bankBefore = sc.sim.player.banked.salvage ?? 0;
    expect(invBefore).toBeGreaterThan(0); // the player now carries loose material
    // Let the hover settle, then close the distance and feed it.
    sc.stepFor(10, emptyInput());
    sc.swimTo(c.position, 60, 900);
    sc.step({ ...emptyInput(), interact: true }); // trade
    const invAfter = sc.sim.player.inventory.salvage ?? 0;
    const bankAfter = sc.sim.player.banked.salvage ?? 0;
    // One carried unit leaves the player; two salvaged units arrive banked.
    expect(invAfter).toBe(invBefore - 1);
    expect(bankAfter - bankBefore).toBe(2);
    expect(n.amount).toBe(0); // the trade did not touch the node
  });

  it('does not trade while the player carries nothing to give', () => {
    // The creature spawns far from every node, so `interact` at it can only
    // be the trade — and the player has neither carried nor banked material.
    const sc = new Scenario(12, greyboxWorld([{ id: 't08-2', creature: 'T-08', position: vec2(3200, -700) }]));
    const c = one(sc, 'T-08');
    sc.stepFor(10, emptyInput());
    sc.swimTo(c.position, 60, 1200);
    const bankBefore = sc.sim.player.banked.salvage ?? 0;
    sc.step({ ...emptyInput(), interact: true });
    expect(sc.sim.player.banked.salvage ?? 0).toBe(bankBefore);
    expect(sc.sim.player.inventory.salvage ?? 0).toBe(0);
  });
});

describe('T-09: herds the swarm along the current lane, never chases (§21)', () => {
  it('drives toward the nearest swarm group and moves with the lane current', () => {
    // A westward current lane over the clearing; the swarm starts east of
    // the herder, ahead in the lane.
    const fields = [driftField({ x: 1500, y: -1200, w: 1200, h: 600 }, vec2(-1, 0), 50)];
    const sc = new Scenario(13, greyboxWorld(
      [
        { id: 't09-1', creature: 'T-09', position: vec2(1700, -900) },
        { id: 't03-a', creature: 'T-03', position: vec2(2050, -900) },
        { id: 't03-b', creature: 'T-03', position: vec2(2100, -920) },
        { id: 't03-c', creature: 'T-03', position: vec2(2150, -880) },
        { id: 't03-d', creature: 'T-03', position: vec2(2200, -900) },
      ],
      fields,
    ));
    const herder = one(sc, 'T-09');
    const start = vec2(herder.position.x, herder.position.y);
    sc.stepFor(20, emptyInput());
    const swarm = sc.sim.creatures.filter((cr) => cr.def.id === 'T-03');
    let nearest = Infinity;
    for (const s of swarm) nearest = Math.min(nearest, dist(herder.position, s.position));
    expect(nearest).toBeLessThan(350); // it closed on the group (started ~350-500 away)
    expect(dist(start, herder.position)).toBeGreaterThan(150); // it worked the lane
    expect(herder.position.x).toBeLessThan(start.x); // with the westward lane
  });
});

describe('T-10: finishes a sweep over a node before harvest yields more (§21)', () => {
  it('boosts the node it has worked, and only after it has worked it', () => {
    // The node at 1600,-900 starts with amount 4. The near sweeper spawns
    // 160 away (inside its 250 acquisition radius); the far one spawns 500
    // away (outside), so only the first can reach the node in time.
    const sc = new Scenario(14, greyboxWorld([
      { id: 't10-a', creature: 'T-10', position: vec2(1760, -900) },
      { id: 't10-b', creature: 'T-10', position: vec2(2100, -900) },
    ]));
    const nodePos = sc.findNodePosition('salvage-1');
    expect(nodePos).not.toBeNull();
    const n = sc.sim.nodes.find((nd) => nd.position.x === nodePos!.x && nd.position.y === nodePos!.y)!;
    expect(n.amount).toBe(4);
    // Not yet swept: the far sweeper is still outside range — the node must
    // be untouched at this point (the "not before" half).
    sc.stepFor(10, emptyInput());
    expect(n.amount).toBe(4);
    // Let the near sweeper reach the node and finish its working pass.
    sc.stepFor(45, emptyInput());
    expect(n.amount).toBe(6); // one boost, exposed yield +2
  });
});

describe('T-11: rises to a hold and hangs — a slow, safe lift (§21)', () => {
  it('rises from below its hold depth and stays near it', () => {
    const sc = new Scenario(15, greyboxWorld([{ id: 't11-1', creature: 'T-11', position: vec2(2000, -1000) }]));
    const c = one(sc, 'T-11');
    const startY = c.position.y;
    sc.stepFor(15, emptyInput());
    expect(c.position.y - startY).toBeGreaterThan(180); // it rose toward the surface
    expect(c.position.y).toBeGreaterThanOrEqual(-800); // and reached its hold band
  });

  it('gives a nearby player a steady passive lift', () => {
    // Let the pocket settle at its hold, then the player drifts beneath it
    // without thrusting and rises for free (no input).
    const sc = new Scenario(16, greyboxWorld([{ id: 't11-2', creature: 'T-11', position: vec2(2000, -1000) }]));
    one(sc, 'T-11');
    sc.stepFor(8, emptyInput());
    sc.sim.teleportTo(2000, 900); // 200 below the hold, inside the pocket
    const y0 = sc.sim.player.position.y;
    sc.stepFor(15, emptyInput());
    expect(sc.sim.player.position.y - y0).toBeGreaterThan(80); // lifted up, no input
  });
});

describe('T-27: the living cable — a ride along the chain axis (§21)', () => {
  it('sweeps between its anchors and carries a nearby player along the axis', () => {
    const sc = new Scenario(17, greyboxWorld([{ id: 't27-1', creature: 'T-27', position: vec2(2000, -800) }]));
    const c = one(sc, 'T-27');
    const start = vec2(c.position.x, c.position.y);
    // The player rides the chain from just off its spawn (inside the ride
    // radius); with no thrust, only the ride moves it.
    sc.sim.teleportTo(1960, 800);
    sc.stepFor(10, emptyInput());
    expect(Math.abs(c.position.x - start.x)).toBeGreaterThan(80); // the chain swept
    expect(sc.sim.player.position.x - 1960).toBeLessThan(-120); // and the player was carried
  });
});

describe('T-31: depth-dependent body plan changes its behavior (§11.1)', () => {
  it('moves fastest shallow, slower mid-water, and slowly deep', () => {
    const sc = new Scenario(18, greyboxWorld([
      { id: 't31-s', creature: 'T-31', position: vec2(2000, -400) },
      { id: 't31-m', creature: 'T-31', position: vec2(2000, -900) },
      { id: 't31-d', creature: 'T-31', position: vec2(2000, -1600) },
    ]));
    expect(sc.sim.creatures.filter((cr) => cr.def.id === 'T-31')).toHaveLength(3);
    // Let all three settle so the measured window is steady-state.
    sc.stepFor(5, emptyInput());
    // Highest y (least negative) is the shallowest; sort descending so index
    // 0 is the shallow specimen and index 2 the deep one.
    const list = sc.sim.creatures
      .filter((cr) => cr.def.id === 'T-31')
      .sort((a, b) => b.position.y - a.position.y);
    const [sh, mid, deep] = [list[0]!, list[1]!, list[2]!];
    const s0 = vec2(sh.position.x, sh.position.y);
    const m0 = vec2(mid.position.x, mid.position.y);
    const d0 = vec2(deep.position.x, deep.position.y);
    sc.stepFor(20, emptyInput());
    const ds = dist(s0, sh.position);
    const dm = dist(m0, mid.position);
    const dd = dist(d0, deep.position);
    expect(dd).toBeLessThan(200); // the deep body plan drifts
    expect(dm).toBeGreaterThan(dd); // mid moves more than deep
    expect(ds).toBeGreaterThan(dm); // shallow moves more than mid
  });
});

describe('friendly floor: 2+ species deliver a mechanically beneficial interaction (§21)', () => {
  it('at least two species hand the player a real advantage, headlessly', () => {
    // Each probe is a minimal production scenario; count the ones whose
    // benefit assertion holds.
    let beneficial = 0;
    // (1) the feeding trade yields a net salvage gain for a carried unit.
    {
      const sc = new Scenario(21, greyboxWorld([{ id: 't08-f', creature: 'T-08', position: vec2(1900, -800) }]));
      const c = one(sc, 'T-08');
      sc.sim.player.inventory.salvage = 1; // the player carries a unit to feed
      sc.stepFor(10, emptyInput());
      sc.swimTo(c.position, 60, 900);
      const bank0 = sc.sim.player.banked.salvage ?? 0;
      sc.step({ ...emptyInput(), interact: true });
      if ((sc.sim.player.banked.salvage ?? 0) - bank0 >= 2) beneficial += 1;
    }
    // (2) the settled pocket gives a passive lift.
    {
      const sc = new Scenario(22, greyboxWorld([{ id: 't11-f', creature: 'T-11', position: vec2(2000, -1050) }]));
      sc.stepFor(8, emptyInput());
      sc.sim.teleportTo(2000, 800);
      const y0 = sc.sim.player.position.y;
      sc.stepFor(12, emptyInput());
      if (sc.sim.player.position.y - y0 > 60) beneficial += 1;
    }
    // (3) the worked node pays out more film.
    {
      const sc = new Scenario(23, greyboxWorld([{ id: 't10-f', creature: 'T-10', position: vec2(1760, -900) }]));
      sc.stepFor(45, emptyInput());
      const node = sc.sim.nodes.find((nd) => nd.id === 'salvage-1')!;
      if (node.amount >= 6) beneficial += 1;
    }
    // (4) the chain ride carries the player with no thrust.
    {
      const sc = new Scenario(24, greyboxWorld([{ id: 't27-f', creature: 'T-27', position: vec2(2000, -800) }]));
      sc.sim.teleportTo(1960, 800);
      sc.stepFor(8, emptyInput());
      if (sc.sim.player.position.x - 1960 < -80) beneficial += 1;
    }
    expect(beneficial).toBeGreaterThanOrEqual(2);
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
    // WI-03b2 extends the sweep to src/world (the production spawn data this
    // tier now lands in) and to this work item's own implementation artifact.
    for (const dir of ['src/sim', 'src/creatures', 'src/content', 'src/world']) {
      const abs = join(here, '..', '..', dir);
      for (const f of readdirSync(abs)) {
        if (f.endsWith('.ts')) scanFile(join(abs, f));
      }
    }
    for (const implDir of [
      join(here, '..', '..', 'agents', 'tasks', 'hadalv2.execute_leaf.__attempt_0011', 'implementation'),
      join(here, '..', '..', 'agents', 'tasks', 'hadalv2.execute_leaf.__attempt_0012', 'implementation'),
    ]) {
      if (existsSync(implDir)) {
        for (const f of readdirSync(implDir)) {
          if (f.endsWith('.md')) scanFile(join(implDir, f));
        }
      }
    }
    expect(offenders, `spoiler tokens found: ${offenders.join(', ')}`).toEqual([]);
  });
});
