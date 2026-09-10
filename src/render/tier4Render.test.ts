/**
 * WI-03d2 render verification for the tier-4 large-creature presentation:
 * the section 52 scale techniques on the existing WI-02b spine pipeline
 * (request §13.2, §52 — no new renderer architecture), each reading
 * simulation state only (request §13/§30). Internal ids only (request
 * §0/§33/§68). Covered here: very-long spine bodies with moderate segment
 * counts and pooled, allocation-free hot paths (request §34); partial
 * anatomy (technique A — the body is only ever partially realized on
 * screen); the background parallax crossing (technique B — the presence
 * crosses behind the playable layer, slower than expected, never
 * centered); the foreground occluder pass (technique C); the sonar-scale
 * readout (technique E — an echo at impossible scale); and the
 * no-center-framing floor (technique G — the crossing encounter never
 * presents a clean full-body view). One browser spot-check of one large
 * and one colossal organism confirms the live page (see the tier's
 * implementation note); the behavior evidence stays headless (request §70
 * layers).
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { Creature } from '../creatures/Creature';
import { WorldSignalBus } from '../creatures/senses';
import { bodyExtent } from '../creatures/CreatureDef';
import { createRng } from '../util/rng';
import { vec2, type Vec2 } from '../util/math';
import { bandProfileAtDepth } from './band';
import {
  CreatureRenderer,
  isCrossingPresence,
  CROSSING_PRESENCE_PARALLAX,
  CROSSING_PRESENCE_Z,
  type RenderView,
} from './creatureRender';
import {
  ForegroundPass,
  FOREGROUND_OCCLUDER_DEPTH,
  FOREGROUND_OCCLUDER_Z,
} from './foreground';
import { SonarSystem } from '../systems/SonarSystem';
import { SonarVisuals } from './sonar';
import { Scenario } from '../sim/scenario';
import { emptyInput, type SimWorld } from '../sim/Simulation';
import { CAMERA_VIEW_WIDTH, FULL_BODY_VIEW_RANGE, PLAYER_PLANE_Z, SONAR_MASSIVE_REF } from '../game/constants';
import { TIER4_CREATURES, TIER4_IDS } from '../content/secret/hiddenCreatures';
import { BASE, GREYBOX_WORLD } from '../world/worldData';
import type { WorldChunkDef } from '../world/chunks';
import { buildSpineDef } from './spineRenderer';

const profile = bandProfileAtDepth(9000);
// The 1920x1080 16:9 view at the fixed 2000-unit design width (request §16):
// half extents 1000 x 562.5 world units.
const VIEW: RenderView = { center: vec2(0, 0), half: { x: CAMERA_VIEW_WIDTH / 2, y: (CAMERA_VIEW_WIDTH * 9) / 16 / 2 } };

function makeCreature(id: string, pos: Vec2, seed = 11): Creature {
  return new Creature(TIER4_CREATURES[id]!, pos, new WorldSignalBus(), createRng(seed));
}

/**
 * Read one creature's rendered body from the pre-allocated ribbon buffer:
 * the full node range (every spine node, realized or not), the realized
 * (non-degenerate) silhouette range, and how many nodes the render
 * actually realized for the current view (technique A).
 */
function bodyReading(
  renderer: CreatureRenderer,
  creature: Creature,
  center: Vec2,
  half: { x: number; y: number },
): {
  nodes: number;
  realized: number;
  fullX: [number, number];
  fullY: [number, number];
  realX: [number, number];
  realY: [number, number];
} {
  const visual = renderer.visuals.get(creature)!;
  const geom = (visual as unknown as { bodyGeom: THREE.BufferGeometry }).bodyGeom;
  const pos = geom.attributes.position!.array as Float32Array;
  const gx = visual.group.position.x;
  const gy = visual.group.position.y;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let rMinX = Infinity, rMinY = Infinity, rMaxX = -Infinity, rMaxY = -Infinity;
  let realized = 0;
  const n = pos.length / 6;
  for (let i = 0; i < n; i += 1) {
    const lx = gx + pos[i * 6]!;
    const ly = gy + pos[i * 6 + 1]!;
    const rx = gx + pos[i * 6 + 3]!;
    const ry = gy + pos[i * 6 + 4]!;
    const cx = (lx + rx) / 2;
    const cy = (ly + ry) / 2;
    if (cx < minX) minX = cx;
    if (cy < minY) minY = cy;
    if (cx > maxX) maxX = cx;
    if (cy > maxY) maxY = cy;
    // A realized node has a body cross-section; an unrealized one collapses
    // to its center (zero area, the partial-anatomy technique).
    if (Math.abs(lx - rx) + Math.abs(ly - ry) > 1) {
      realized += 1;
      for (const [x, y] of [[lx, ly], [rx, ry]] as const) {
        if (x < rMinX) rMinX = x;
        if (y < rMinY) rMinY = y;
        if (x > rMaxX) rMaxX = x;
        if (y > rMaxY) rMaxY = y;
      }
    }
  }
  void center;
  void half;
  return {
    nodes: n,
    realized,
    fullX: [minX - center.x, maxX - center.x],
    fullY: [minY - center.y, maxY - center.y],
    realX: [rMinX - center.x, rMaxX - center.x],
    realY: [rMinY - center.y, rMaxY - center.y],
  };
}

/** The no-clean-view floor: the body is fully presented on screen only when every node is realized AND the realized silhouette fits inside the strict view. */
function fullyPresented(
  r: { nodes: number; realized: number; realX: [number, number]; realY: [number, number] },
  half: { x: number; y: number },
): boolean {
  if (r.realized < r.nodes) return false;
  const insideX = r.realX[0]! >= -half.x - 1 && r.realX[1]! <= half.x + 1;
  const insideY = r.realY[0]! >= -half.y - 1 && r.realY[1]! <= half.y + 1;
  return insideX && insideY;
}

describe('tier-4 very-long bodies stay moderate (request §34)', () => {
  it('every tier-4 body builds a spine with a moderate segment count (no thousands of vertices)', () => {
    for (const id of TIER4_IDS) {
      const spine = buildSpineDef(TIER4_CREATURES[id]!);
      expect(spine.rest.length, `${id} must use a moderate spine (3-12 nodes)`).toBeGreaterThanOrEqual(3);
      expect(spine.rest.length, `${id} must use a moderate spine (3-12 nodes)`).toBeLessThanOrEqual(12);
    }
  });

  it('exactly the colossal crossing presence is classified for the background crossing', () => {
    for (const id of TIER4_IDS) {
      const def = TIER4_CREATURES[id]!;
      const isCrossing = isCrossingPresence(def);
      const colossal = bodyExtent(def) >= 2 * CAMERA_VIEW_WIDTH;
      expect(isCrossing, `${id} classification must match the body-extent rule`).toBe(colossal);
    }
    expect(isCrossingPresence(TIER4_CREATURES['T-23']!)).toBe(true);
  });
});

describe('technique A: partial anatomy (the body is only ever partially realized)', () => {
  it('the crossing flank never presents its full body on screen at any crossing position', () => {
    const scene = new THREE.Scene();
    const renderer = new CreatureRenderer(scene);
    const c = makeCreature('T-23', vec2(0, 0));
    c.velocity = vec2(-60, 0); // crossing west, body axis along the lane
    // Sweep the presence across the fixed view: from four view-widths east
    // to four view-widths west of the camera center.
    let sawUnrealized = false;
    for (let px = -4000; px <= 4000; px += 250) {
      c.position.x = px;
      c.position.y = 0;
      renderer.update([c], 1.5, profile, VIEW);
      const r = bodyReading(renderer, c, VIEW.center, VIEW.half);
      expect(
        fullyPresented(r, VIEW.half),
        `the full body must never be presented on screen at offset ${px} (realized ${r.realized}/${r.nodes})`,
      ).toBe(false);
      // The realized silhouette is a flank cut off by the screen edge: it
      // reaches at least one view boundary, or part of the body is not
      // realized at all.
      const crosses =
        r.realX[0]! < -VIEW.half.x || r.realX[1]! > VIEW.half.x || r.realY[0]! < -VIEW.half.y || r.realY[1]! > VIEW.half.y;
      expect(r.realized < r.nodes || crosses, `the on-screen flank must be cut off at the view edge at ${px}`).toBe(true);
      if (r.realized < r.nodes) sawUnrealized = true;
    }
    expect(sawUnrealized, 'the mechanism must actually unrealize off-view nodes somewhere in the sweep').toBe(true);
  });

  it('a large organism that fits the view is fully realized (big, not beyond the view)', () => {
    const scene = new THREE.Scene();
    const renderer = new CreatureRenderer(scene);
    const c = makeCreature('T-19', vec2(0, 0));
    renderer.update([c], 0.7, profile, VIEW);
    const r = bodyReading(renderer, c, VIEW.center, VIEW.half);
    expect(r.realized, 'every node of the fitting body is realized').toBe(r.nodes);
    expect(fullyPresented(r, VIEW.half), 'the large organism presents its whole body when it fits').toBe(true);
  });
});

describe('technique B: the background parallax crossing', () => {
  it('the crossing presence is drawn on a background layer, behind the playable plane', () => {
    const scene = new THREE.Scene();
    const renderer = new CreatureRenderer(scene);
    const c = makeCreature('T-23', vec2(1000, 500));
    renderer.update([c], 0.5, profile, VIEW);
    const group = renderer.visuals.get(c)!.group;
    expect(group.position.z, 'the presence sits on its background layer').toBe(CROSSING_PRESENCE_Z);
    expect(group.position.z, 'the presence is behind the playable plane').toBeLessThan(PLAYER_PLANE_Z);
    expect(group.position.z, 'the presence is behind the main terrain').toBeLessThan(0);
  });

  it('the presence moves slower than its world motion relative to the camera (apparent parallax)', () => {
    const scene = new THREE.Scene();
    const renderer = new CreatureRenderer(scene);
    const c = makeCreature('T-23', vec2(1000, 500));
    const center = vec2(500, 250);
    renderer.update([c], 0.5, profile, { center, half: VIEW.half });
    const g0x = renderer.visuals.get(c)!.group.position.x;
    const g0y = renderer.visuals.get(c)!.group.position.y;
    // The apparent position is the world position shrunk toward the camera
    // center by the parallax factor.
    expect(Math.abs(g0x - (center.x + (c.position.x - center.x) * CROSSING_PRESENCE_PARALLAX))).toBeLessThan(1e-6);
    expect(Math.abs(g0y - (center.y + (c.position.y - center.y) * CROSSING_PRESENCE_PARALLAX))).toBeLessThan(1e-6);
    // A 200-unit world motion reads as 200 * factor apparent motion.
    c.position.x += 200;
    renderer.update([c], 0.6, profile, { center, half: VIEW.half });
    const dx = renderer.visuals.get(c)!.group.position.x - g0x;
    expect(Math.abs(dx), 'the apparent motion must equal factor * world motion').toBeCloseTo(200 * CROSSING_PRESENCE_PARALLAX, 6);
    expect(CROSSING_PRESENCE_PARALLAX, 'the factor must be a true parallax (slower than world motion)').toBeGreaterThan(0);
    expect(CROSSING_PRESENCE_PARALLAX).toBeLessThan(1);
  });

  it('large organisms that are not the crossing presence stay on the playable plane at their true position', () => {
    const scene = new THREE.Scene();
    const renderer = new CreatureRenderer(scene);
    const c = makeCreature('T-19', vec2(800, -300));
    renderer.update([c], 0.5, profile, { center: vec2(0, 0), half: VIEW.half });
    const group = renderer.visuals.get(c)!.group;
    expect(group.position.z, 'the large organism is on the player plane').toBe(PLAYER_PLANE_Z);
    expect(group.position.x).toBe(800);
    expect(group.position.y).toBe(-300);
  });
});

describe('technique C: the foreground occluder pass', () => {
  /** The slab's screen offset from the camera center after a pass update. */
  const screenOffsetX = (fg: ForegroundPass, slab: THREE.Group, cx: number): number => {
    fg.update(vec2(cx, 0));
    return slab.position.x - cx;
  };

  it('the pass holds a small pool of large structures in front of the playable plane, in the deep water', () => {
    const scene = new THREE.Scene();
    const fg = new ForegroundPass(scene);
    expect(fg.slabs.length, 'a handful of occluders, not a field of them').toBeGreaterThanOrEqual(4);
    expect(fg.slabs.length).toBeLessThanOrEqual(12);
    for (const slab of fg.slabs) {
      expect(slab.position.z, 'occluders cross between the camera and the player').toBe(FOREGROUND_OCCLUDER_Z);
      expect(slab.position.z).toBeGreaterThan(PLAYER_PLANE_Z);
      const geo = (slab.children[0] as THREE.Mesh).geometry;
      const pos = geo.attributes.position!.array as Float32Array;
      let w = 0, h = 0;
      for (let i = 0; i + 1 < pos.length; i += 3) {
        w = Math.max(w, Math.abs(pos[i]!));
        h = Math.max(h, Math.abs(pos[i + 1]!));
      }
      expect(w * 2, 'an occluder is a large structure, not a mote').toBeGreaterThanOrEqual(250);
      expect(h * 2).toBeGreaterThanOrEqual(150);
    }
    expect(FOREGROUND_OCCLUDER_DEPTH, 'the foreground pass sits closer to the camera than the world').toBeGreaterThan(1);
  });

  it('an occluder sits on the hadal crossing lane, so the background flank is glimpsed through it', () => {
    const fg = new ForegroundPass(new THREE.Scene());
    fg.update(vec2(0, 0));
    const near = fg.slabs.some((s) => {
      // Recover the reference position: with the camera at the origin the
      // placement is reference * depth, so reference = placed / depth.
      const qx = s.position.x / FOREGROUND_OCCLUDER_DEPTH;
      const qy = s.position.y / FOREGROUND_OCCLUDER_DEPTH;
      return Math.hypot(qx - 17000, qy + 9400) < 1600;
    });
    expect(near, 'an occluder must stage the crossing lane (temporary occlusion of the flank)').toBe(true);
  });

  it('an occluder moves at >1 parallax: it crosses the view, then clears it (temporary occlusion)', () => {
    const fg = new ForegroundPass(new THREE.Scene());
    fg.update(vec2(0, 0));
    const slab = fg.slabs[0]!;
    // Reference position recovered from the placement at the origin.
    const qx = slab.position.x / FOREGROUND_OCCLUDER_DEPTH;
    const geo = (slab.children[0] as THREE.Mesh).geometry;
    const pos = geo.attributes.position!.array as Float32Array;
    let halfW = 0;
    for (let i = 0; i + 1 < pos.length; i += 3) halfW = Math.max(halfW, Math.abs(pos[i]!));
    // Pan the camera across the occluder: its screen offset must move at
    // the depth factor (faster than the world plane) and the slab must be
    // inside and outside the view over the pan.
    let sawInside = false;
    let sawOutside = false;
    let prevOffset: number | null = null;
    for (let cx = qx - 2500; cx <= qx + 2500; cx += 100) {
      const o = screenOffsetX(fg, slab, cx);
      if (prevOffset !== null) {
        expect(o - prevOffset, 'the screen offset moves at the depth factor of the camera').toBeCloseTo(-100 * FOREGROUND_OCCLUDER_DEPTH, 6);
      }
      prevOffset = o;
      if (Math.abs(o) < VIEW.half.x + halfW) sawInside = true;
      if (Math.abs(o) > VIEW.half.x + halfW) sawOutside = true;
    }
    expect(sawInside, 'the occluder must cross the view while the camera pans past it').toBe(true);
    expect(sawOutside, 'the occlusion must be temporary (the occluder clears the view)').toBe(true);
    const childrenBefore = new THREE.Scene();
    const fg2 = new ForegroundPass(childrenBefore);
    const n = childrenBefore.children.length;
    for (let t = 0; t < 60; t += 1) fg2.update(vec2(t, 0));
    expect(childrenBefore.children.length, 'no per-frame allocation: the pool is fixed').toBe(n);
  });
});

describe('technique E: the sonar-scale readout (an echo at impossible scale)', () => {
  it('a colossal presence returns a far larger rendered echo and tag than a normal object', () => {
    const size = bodyExtent(TIER4_CREATURES['T-23']!) / SONAR_MASSIVE_REF;
    expect(size, 'the presence registers at an impossible sonar scale').toBeGreaterThan(4);
    const bus = new WorldSignalBus();
    // The object sits well outside the visible screen of a 16:9 view.
    const sonar = new SonarSystem(bus, [], [{ x: 1500, y: 0, size, resource: false }]);
    const sv = new SonarVisuals(new THREE.Scene(), sonar);
    sonar.fire(vec2(0, 0), 0);
    let t = 0;
    for (let i = 0; i < 240; i += 1) {
      t += 1 / 60;
      sonar.update(1 / 60, t);
      sv.update(t);
    }
    const echo = sonar.echoes.find((e) => e.active && e.x === 1500);
    expect(echo, 'an echo must exist at the presence').toBeDefined();
    expect(echo!.size).toBeCloseTo(size, 6);
    let maxEcho = 0;
    let maxTag = 0;
    for (let i = 0; i < sv.echoSize.length; i += 1) maxEcho = Math.max(maxEcho, sv.echoSize[i]!);
    for (let i = 0; i < sv.tagSize.length; i += 1) maxTag = Math.max(maxTag, sv.tagSize[i]!);
    expect(maxEcho, 'the rendered echo point scales with the impossible size').toBeGreaterThan(6 * (1 + (size - 1) * 0.6) * 0.9);
    expect(maxTag, 'the rendered tag scales too').toBeGreaterThan(5 * (1 + (size - 1) * 0.6) * 0.9);
    expect(maxEcho, 'the echo reads at least 4x a normal echo').toBeGreaterThan(6 * 4);
  });
});
/**
 * The crossing-encounter world (WI-03d1's fixture, duplicated here so the
 * render test stays self-contained): the coast band plus a band-5 open
 * basin where the presence holds at the start of its crossing lane until a
 * diver is near, then runs it west first.
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
      { id: 't23-congregation', creature: 'T-03', position: vec2(12300, -3500), count: 4 },
      { id: 't23-drifters', creature: 'T-06', position: vec2(11700, -3600), count: 3 },
    ],
  };
  return { chunks: [...GREYBOX_WORLD, basin], base: BASE, currentFields: [] };
}

describe('technique G: the crossing encounter never frames the presence centered', () => {
  it('through a real crossing: no clean full-body view, the flank crosses the view, the camera stays player-anchored', () => {
    const sc = new Scenario(441, t23World());
    const t23 = sc.sim.creatures.find((c) => c.def.id === 'T-23')!;
    // The diver is dropped beside the lane (the debug-panel teleport, a real
    // sim API) just inside the crossing's release radius.
    sc.sim.teleportTo(10800, 3400);
    sc.stepFor(2, emptyInput()); // settle
    const scene = new THREE.Scene();
    const renderer = new CreatureRenderer(scene);
    const p = sc.sim.player.position;
    let cleanViewAt = -1;
    let presentedAt = -1;
    let sawCrossing = -1; // first frame the flank's apparent center is inside the view
    let offsetMin = Infinity;
    let offsetMax = -Infinity;
    let ended = false;
    let seenClose = false;
    const total = Math.round(170 * 60);
    for (let i = 0; i < total && !ended; i += 1) {
      sc.step(emptyInput());
      const d = Math.hypot(t23.position.x - p.x, t23.position.y - p.y);
      if (d <= FULL_BODY_VIEW_RANGE) seenClose = true;
      // Render this frame exactly as the browser does: the camera center is
      // the player (the 0.15 s follow lag keeps it within a few units of a
      // stationary player), the view is the fixed 16:9 design window.
      renderer.update([t23], sc.sim.state.timeSec, profile, { center: vec2(p.x, p.y), half: VIEW.half });
      if (cleanViewAt < 0 && sc.sim.hasCleanFullBody(t23)) cleanViewAt = sc.time;
      const r = bodyReading(renderer, t23, vec2(p.x, p.y), VIEW.half);
      if (presentedAt < 0 && fullyPresented(r, VIEW.half)) presentedAt = sc.time;
      const g = renderer.visuals.get(t23)!.group;
      const offset = g.position.x - p.x;
      if (offset < offsetMin) offsetMin = offset;
      if (offset > offsetMax) offsetMax = offset;
      if (sawCrossing < 0 && Math.abs(offset) < VIEW.half.x) sawCrossing = sc.time;
      if (seenClose && d > 2400) ended = true; // the crossing has passed
    }
    sc.assert(ended, 'the crossing must complete: it approaches, passes the player, and leaves the window');
    sc.assert(cleanViewAt < 0, 'the sim visibility state must never report a clean full-body view of the crossing');
    sc.assert(
      presentedAt < 0,
      `the rendered body must never be fully presented on screen (first at t=${presentedAt.toFixed(1)})`,
    );
    sc.assert(sawCrossing > 0, 'the flank must actually cross the player view (it is not parked off-screen)');
    sc.assert(
      offsetMax - offsetMin > 400,
      `the crossing must traverse the view, not hold centered (range ${(offsetMax - offsetMin).toFixed(0)})`,
    );
    // No center framing (request Â§16, Â§52 G): the renderer's camera target is
    // the player and nothing here aims it at the presence â€” the presence
    // stays on its background layer for the whole encounter.
    const group = renderer.visuals.get(t23)!.group;
    sc.assert(group.position.z === CROSSING_PRESENCE_Z, 'the presence stays on its background layer through the encounter');
  }, 30000);
});

describe('section 34 performance guard (node side of the focused inspection)', () => {
  it('the largest tier-4 scene renders 600 frames within the frame budget, with pre-allocated buffers', () => {
    const scene = new THREE.Scene();
    const renderer = new CreatureRenderer(scene);
    const fg = new ForegroundPass(scene);
    const spots: [string, Vec2][] = [
      ['T-19', vec2(300, 0)],
      ['T-20', vec2(-900, 400)],
      ['T-22', vec2(900, -500)],
      ['T-23', vec2(0, -100)],
      ['T-25', vec2(-400, 600)],
    ];
    const creatures = spots.map(([id, pos], i) => makeCreature(id, pos, 7 + i));
    for (const c of creatures) c.velocity = vec2(10, 0);
    const counts = creatures.map((c) => {
      renderer.update([c], 0.1, profile, VIEW);
      const v = renderer.visuals.get(c)!;
      return (v as unknown as { bodyGeom: THREE.BufferGeometry }).bodyGeom.attributes.position!.count;
    });
    const slabCount = scene.children.length;
    const t0 = performance.now();
    for (let f = 0; f < 600; f += 1) {
      const t = f / 60;
      renderer.update(creatures, t, profile, VIEW);
      fg.update(VIEW.center);
    }
    const elapsed = performance.now() - t0;
    expect(elapsed, `600 frames of the largest tier-4 scene must stay smooth (took ${elapsed.toFixed(0)}ms)`).toBeLessThan(1500);
    for (let i = 0; i < creatures.length; i += 1) {
      const v = renderer.visuals.get(creatures[i]!);
      expect(
        (v as unknown as { bodyGeom: THREE.BufferGeometry }).bodyGeom.attributes.position!.count,
        'the body buffer must stay pre-allocated',
      ).toBe(counts[i]);
    }
    expect(scene.children.length, 'no per-frame allocation in the render hot path').toBe(slabCount);
  });
});

describe('spoiler containment for this work item (Â§0/Â§12/Â§68)', () => {
  it('no creature name or secret description appears outside the private content', () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const tokensPath = join(here, '..', '..', 'design_private', '_spoiler_tokens.txt');
    const tokens = readFileSync(tokensPath, 'utf8')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('#'))
      .filter((l) => !/^T-\d\d$/.test(l))
      .map((l) => l.replace(/^The\s+/, ''))
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
    // This item's product surface: the render pipeline, the game adapter,
    // and the secret content file.
    const abs = join(here, '..', '..', 'src', 'render');
    for (const f of readdirSync(abs)) {
      if (f.endsWith('.ts')) scanFile(join(abs, f));
    }
    scanFile(join(here, '..', '..', 'src', 'game', 'Game.ts'));
    scanFile(join(here, '..', '..', 'src', 'content', 'secret', 'hiddenCreatures.ts'));
    // The implementation artifacts of this execution attempt.
    const implDir = join(here, '..', '..', 'agents', 'tasks', 'hadalv2.execute_leaf.WI-03d2.__item_WI-03d2.__attempt_0001', 'implementation');
    if (existsSync(implDir)) {
      for (const f of readdirSync(implDir)) {
        if (f.endsWith('.md')) scanFile(join(implDir, f));
      }
    }
    expect(offenders, `spoiler tokens found: ${offenders.join(', ')}`).toEqual([]);
  });
});
