import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  MACRO_WORLD,
  GREYBOX_WORLD,
  PLAYER_START,
  worldBounds,
  type WorldChunkDef,
} from '../../../../../../src/world/worldData';
import { deepestChunk, chunkContaining } from '../../../../../../src/world/chunks';
import { createSimulation, emptyInput, makeSimWorld } from '../../../../../../src/sim/Simulation';
import { bandProfileAtDepth } from '../../../../../../src/render/band';
import { ParticleField } from '../../../../../../src/render/particles';

/**
 * Independent reviewer probe for WI-07 (attempt 2). Re-derives the acceptance
 * facts from the production data and the live simulation (not the
 * implementer's tests). Sections 1–8 mirror the first review's probes (which
 * passed, except the per-band band-5 parity — review finding 1); sections 9–11
 * target the three findings the implementer revised (terminus pocket,
 * chunk-activation consumption, dense-traversal bound).
 */

function chunksByBand(): Map<number, WorldChunkDef[]> {
  const m = new Map<number, WorldChunkDef[]>();
  for (const c of MACRO_WORLD) {
    const arr = m.get(c.band) ?? [];
    arr.push(c);
    m.set(c.band, arr);
  }
  return m;
}

function bandExits(band: number): { from: string; to: string; toBand: number }[] {
  const out: { from: string; to: string; toBand: number }[] = [];
  const bandOf = new Map(MACRO_WORLD.map((c) => [c.id, c.band]));
  for (const c of MACRO_WORLD) {
    if (c.band !== band) continue;
    for (const e of c.exits) out.push({ from: c.id, to: e.to, toBand: bandOf.get(e.to)! });
  }
  return out;
}

describe('1: world scale and band count (request §4.1)', () => {
  it('spans exactly 5 depth bands at the required scale', () => {
    const bands = [...new Set(MACRO_WORLD.map((c) => c.band))].sort((a, b) => a - b);
    console.log('bands =', JSON.stringify(bands));
    expect(bands).toEqual([1, 2, 3, 4, 5]);
    const b = worldBounds(MACRO_WORLD);
    console.log(`bounds: x=${b.x}..${b.x + b.w} (w=${b.w}), y=${b.y}..${b.y + b.h} (h=${b.h})`);
    expect(b.w).toBeGreaterThanOrEqual(18000);
    expect(b.w).toBeLessThanOrEqual(28000);
    expect(b.y + b.h).toBe(0); // surface at y = 0
    expect(-b.y).toBeGreaterThanOrEqual(9000); // deepest ~-9,000..-12,000
    expect(-b.y).toBeLessThanOrEqual(12000);
  });
});

describe('2: connectivity over the exit graph (request §4.2/§32)', () => {
  it('start reaches the deepest chunk, and every exit references a real chunk', () => {
    const ids = new Set(MACRO_WORLD.map((c) => c.id));
    const dangling: string[] = [];
    for (const c of MACRO_WORLD) for (const e of c.exits) if (!ids.has(e.to)) dangling.push(`${c.id}->${e.to}`);
    console.log('dangling exits =', JSON.stringify(dangling));
    expect(dangling).toEqual([]);
    const start = chunkContaining(MACRO_WORLD, PLAYER_START);
    const adj = new Map<string, string[]>();
    for (const c of MACRO_WORLD) for (const e of c.exits) adj.set(c.id, [...(adj.get(c.id) ?? []), e.to]);
    const seen = new Set<string>([start!.id]);
    const q = [start!.id];
    while (q.length) {
      const cur = q.shift()!;
      for (const next of adj.get(cur) ?? []) if (!seen.has(next)) { seen.add(next); q.push(next); }
    }
    console.log(`start=${start!.id} reached=${JSON.stringify([...seen])}`);
    const deepest = deepestChunk(MACRO_WORLD);
    console.log('deepest chunk =', deepest!.id);
    expect(seen.has(deepest!.id)).toBe(true);
  });
});

describe('3: wide descending network, not a straight shaft (request §4.2)', () => {
  it('bands shift horizontally as they descend, and skip-band shortcuts exist', () => {
    const centers = new Map<number, { sx: number; n: number }>();
    for (const c of MACRO_WORLD) {
      const cur = centers.get(c.band) ?? { sx: 0, n: 0 };
      centers.set(c.band, { sx: cur.sx + (c.bounds.x + c.bounds.w / 2), n: cur.n + 1 });
    }
    const avg = (band: number) => (centers.get(band)!.sx / centers.get(band)!.n).toFixed(0);
    console.log(`band centres x: 1=${avg(1)} 2=${avg(2)} 3=${avg(3)} 4=${avg(4)} 5=${avg(5)}`);
    const spread = Math.abs(Number(avg(5)) - Number(avg(1)));
    expect(spread).toBeGreaterThan(5000); // a network, not a vertical shaft
    const skipShortcuts = MACRO_WORLD.flatMap((c) =>
      c.exits
        .filter((e) => (new Map(MACRO_WORLD.map((x) => [x.id, x.band])).get(e.to)! - c.band) >= 2)
        .map((e) => `${c.id}->${e.to}`),
    );
    console.log('skip-band shortcuts =', JSON.stringify(skipShortcuts));
    expect(skipShortcuts.length).toBeGreaterThanOrEqual(2);
  });

  it('every deeper band has a return route, a pocket, a landmark, and an interior; bands 2–4 also a deeper main route', () => {
    const byBand = chunksByBand();
    const props = (band: number) => (byBand.get(band) ?? []).flatMap((c) => c.props ?? []);
    for (const band of [2, 3, 4, 5]) {
      const exits = bandExits(band);
      const hasDeeper = exits.some((e) => e.toBand === band + 1);
      const hasShallower = exits.some((e) => e.toBand === band - 1);
      const hasPocket = props(band).some((p) => p.kind === 'pocket');
      const hasLandmark = props(band).some((p) => p.kind === 'landmark' || p.kind === 'facility');
      const hasInterior = props(band).some((p) => p.interior === true);
      console.log(`band ${band}: mainRoute=${hasDeeper} return=${hasShallower} pocket=${hasPocket} landmark=${hasLandmark} interior=${hasInterior}`);
      expect(hasShallower).toBe(true);
      expect(hasPocket).toBe(true); // post-fix: the hadal terminus carries its own pocket
      expect(hasLandmark).toBe(true);
      expect(hasInterior).toBe(true);
      if (band < 5) expect(hasDeeper).toBe(true); // the terminus (5) is entered from band 4
    }
  });
});

describe('4: the greybox coast is preserved as a subset (preparatory refactor)', () => {
  it('the coast chunks are a strict subset of the macro world and keep their ids', () => {
    const macroIds = new Set(MACRO_WORLD.map((c) => c.id));
    for (const c of GREYBOX_WORLD) expect(macroIds.has(c.id)).toBe(true);
    expect(GREYBOX_WORLD.length).toBeLessThan(MACRO_WORLD.length);
  });
});

describe('5: currents move the player and the boost upgrade changes handling (request §64)', () => {
  it('a stationary player is carried, and the boost upgrade reduces the drift', () => {
    const sim = createSimulation(makeSimWorld(), 0);
    sim.teleportTo(12000, 3000); // y = -3000, in the global drift field
    const bx0 = sim.player.position.x;
    sim.step(emptyInput(), 1);
    const noBoost = sim.player.position.x - bx0;
    const local = sim.currents.velocityAt(sim.player.position, sim.state.timeSec);
    console.log(`current velocity=${local.x.toFixed(1)},${local.y.toFixed(1)} noBoost drift=${noBoost.toFixed(2)}`);
    expect(local.x).toBeGreaterThan(10); // a real current is present here
    expect(noBoost).toBeGreaterThan(3); // the stationary player is carried +x
    sim.teleportTo(12000, 3000);
    sim.player.capabilities.add('boost');
    const bx1 = sim.player.position.x;
    sim.step(emptyInput(), 1);
    const withBoost = sim.player.position.x - bx1;
    console.log(`withBoost drift=${withBoost.toFixed(2)}`);
    expect(withBoost).toBeLessThan(noBoost);
    expect(withBoost).toBeGreaterThanOrEqual(0);
  });
});

describe('6: the REAL world triggers are wired into the live simulation (request §36)', () => {
  it('reaching the hadal depth fires the authored hadal-floor trigger (not a hand-built one)', () => {
    const sim = createSimulation(makeSimWorld(), 0);
    expect(sim.storyFlags).toEqual([]);
    sim.teleportTo(21400, 9700); // depth 9700 >= the 9600 trigger line
    sim.step(emptyInput(), 1);
    console.log(`after hadal step: storyFlags=${JSON.stringify(sim.storyFlags)} radio=${sim.lastRadioText}`);
    expect(sim.storyFlags).toContain('hadal-reached');
    expect(sim.lastRadioText).toBe('You are below the last logged depth. No one has come back from here.');
    sim.step(emptyInput(), 1);
    expect(sim.storyFlags.filter((f) => f === 'hadal-reached').length).toBe(1);
  });

  it('entering the abyss region fires the authored depth trigger at its threshold', () => {
    const sim = createSimulation(makeSimWorld(), 0);
    sim.teleportTo(20700, 8300); // depth 8300 < 8500 line
    sim.step(emptyInput(), 1);
    expect(sim.storyFlags).not.toContain('deep-reached');
    sim.teleportTo(20700, 8600); // depth 8600 >= 8500
    sim.step(emptyInput(), 1);
    expect(sim.storyFlags).toContain('deep-reached');
  });
});

describe('7: an interior cutaway is reachable by the player (request §65)', () => {
  it('the player can swim into the shelf interior room (identical swim controls)', () => {
    const sim = createSimulation(makeSimWorld(), 0);
    const target = { x: 11600, y: -3900 };
    let best = Infinity;
    let steps = 0;
    while (steps < 40000) {
      const dx = target.x - sim.player.position.x;
      const dy = target.y - sim.player.position.y;
      const d = Math.hypot(dx, dy);
      const input = emptyInput();
      if (d > 40) {
        const full = d > 80;
        input.thrustX = Math.sign(dx) * (full ? 1 : 0.5);
        input.thrustY = Math.sign(dy) * (full ? 1 : 0.5);
      }
      sim.step(input, 1 / 60);
      best = Math.min(best, d);
      steps++;
      if (d <= 40) break;
    }
    console.log(`interior reach: steps=${steps} bestDist=${best.toFixed(1)}`);
    expect(best).toBeLessThanOrEqual(200);
  });
});

// ---------------------------------------------------------------------------
// Review-finding re-checks (attempt 2)
// ---------------------------------------------------------------------------

describe('9: the hadal terminus pocket exists and is reachable (review finding 1)', () => {
  it('band 5 carries a pocket prop inside a physical alcove off the return line', () => {
    const hadalProps = (chunksByBand().get(5) ?? []).flatMap((c) => c.props ?? []);
    const pocket = hadalProps.find((p) => p.kind === 'pocket');
    console.log(`hadal pocket = ${pocket ? JSON.stringify(pocket) : 'MISSING'}`);
    expect(pocket).toBeDefined();
    // The alcove is bounded by the pocket ledge slab; the prop sits under it.
    const ledge = (chunksByBand().get(5) ?? []).flatMap((c) => c.terrain ?? []).find((t) => t.id === 'hadal-pocket-ledge');
    expect(ledge).toBeDefined();
    const xs = ledge!.points.map((p) => p.x);
    const ys = ledge!.points.map((p) => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    console.log(`ledge slab x ${minX}..${maxX}, y ${minY}..${maxY}; pocket at ${pocket!.position.x},${pocket!.position.y}`);
    expect(pocket!.position.x).toBeGreaterThanOrEqual(minX);
    expect(pocket!.position.x).toBeLessThanOrEqual(maxX);
    expect(pocket!.position.y).toBeLessThan(minY); // the prop hangs BELOW the ledge
  });

  it('the player can swim to the hadal pocket by normal steering + collision', () => {
    const sim = createSimulation(makeSimWorld(), 0);
    const pocket = (chunksByBand().get(5) ?? []).flatMap((c) => c.props ?? []).find((p) => p.kind === 'pocket')!;
    // A human-swimmable route (waypoints steer; collision is real, no
    // teleport): descend the abyss gap, rise above the hadal west wall (top
    // y -9600), cross east, drop down the ledge's east side, then slide west
    // UNDER the ledge into the alcove (the ledge is y -9590..-9560, x
    // 18550..19000; the alcove under it is y -9700..-9590).
    const route = [
      { x: 17900, y: -9550 }, // above the wall top, west of it
      { x: 18300, y: -9530 }, // cross over the wall
      { x: 19150, y: -9520 }, // east of the ledge
      { x: 19150, y: -9660 }, // drop below the ledge line
      pocket.position,
    ];
    let totalSteps = 0;
    for (const target of route) {
      let steps = 0;
      while (steps < 90000) {
        const dx = target.x - sim.player.position.x;
        const dy = target.y - sim.player.position.y;
        const d = Math.hypot(dx, dy);
        const input = emptyInput();
        if (d > 40) {
          const full = d > 80;
          input.thrustX = Math.sign(dx) * (full ? 1 : 0.5);
          input.thrustY = Math.sign(dy) * (full ? 1 : 0.5);
        }
        sim.step(input, 1 / 60);
        steps++;
        if (d <= 40) break;
      }
      totalSteps += steps;
      const d = Math.hypot(target.x - sim.player.position.x, target.y - sim.player.position.y);
      console.log(`route waypoint (${target.x},${target.y}): dist=${d.toFixed(1)} steps=${steps}`);
      expect(d).toBeLessThanOrEqual(60); // every waypoint is genuinely reachable
    }
    console.log(`hadal pocket reach: totalSteps=${totalSteps} pos=${sim.player.position.x.toFixed(0)},${sim.player.position.y.toFixed(0)}`);
  });
});

describe('10: the chunk-activation set is genuinely consumed (review finding 2)', () => {
  it('active chunks carry an ambient budget; far chunks carry none', () => {
    const sim = createSimulation(makeSimWorld(), 0);
    for (const id of sim.activeChunks) {
      expect(sim.ambientWork.has(id)).toBe(true);
    }
    for (const c of sim.chunks) {
      if (!sim.activeChunks.has(c.id)) expect(sim.ambientWork.has(c.id)).toBe(false);
    }
    // A far point (no active chunk within a screen of it) carries no ambient
    // work — the far-disabled half of §17, observable headlessly.
    const far = sim.ambientIntensityAt({ x: 21400, y: -9650 }); // hadal, from the coast start
    const near = sim.ambientIntensityAt(sim.player.position);
    console.log(`ambient: near player=${near.toFixed(2)}, far point=${far.toFixed(2)}`);
    expect(near).toBeGreaterThan(0);
    expect(far).toBe(0);
  });

  it('ParticleField honours the ambientScale gate (0 disables the ambient work)', () => {
    const field = new ParticleField(new THREE.Scene());
    const profile = bandProfileAtDepth(500);
    const center = { x: 0, y: -500 };
    const half = { x: 1000, y: 563 };
    field.update(1 / 60, center, half, profile, undefined, 1);
    const on = field.layers.map((l) => l.type.count).reduce((a, b) => a + b, 0);
    field.update(1 / 60, center, half, profile, undefined, 0);
    const off = field.layers.map((l) => l.type.count).reduce((a, b) => a + b, 0);
    console.log(`particle field: scale=1 count=${on}, scale=0 count=${off}`);
    expect(on).toBeGreaterThan(0);
    expect(off).toBe(0); // the render-side consumption: far-disabled is real, not cosmetic
  });
});

describe('11: the full descent is dense (review finding 3 — §49 upper bound)', () => {
  it('each band leg of a fresh-start full descent is <= 60 s of simulated swim', () => {
    const sim = createSimulation(makeSimWorld(), 10); // same seed as the §70 scenario
    // The same open-water waypoints the scenario uses, but driven by THIS
    // probe's own steering loop (independent of the implementer's harness).
    const waypoints = [
      { x: 5600, y: -2200 },
      { x: 9500, y: -5000 },
      { x: 14500, y: -7800 },
      { x: 17900, y: -9670 },
    ];
    let legStart = 0;
    const legTimes: number[] = [];
    for (const wp of waypoints) {
      let steps = 0;
      while (steps < 30000) {
        const dx = wp.x - sim.player.position.x;
        const dy = wp.y - sim.player.position.y;
        const d = Math.hypot(dx, dy);
        const input = emptyInput();
        if (d > 60) {
          const full = d > 120;
          input.thrustX = Math.sign(dx) * (full ? 1 : 0.5);
          input.thrustY = Math.sign(dy) * (full ? 1 : 0.5);
        }
        sim.step(input, 1 / 60);
        steps++;
        if (d <= 60) break;
      }
      const d = Math.hypot(wp.x - sim.player.position.x, wp.y - sim.player.position.y);
      expect(d).toBeLessThanOrEqual(900);
      legTimes.push(sim.state.timeSec - legStart);
      legStart = sim.state.timeSec;
    }
    console.log(`leg times (s): ${legTimes.map((t) => t.toFixed(0)).join(', ')}`);
    for (let i = 0; i < legTimes.length; i++) {
      expect(legTimes[i]).toBeLessThanOrEqual(60); // no leg is a long empty corridor
    }
    expect(sim.player.depth).toBeGreaterThanOrEqual(9000); // the deepest band was actually reached
  });
});
