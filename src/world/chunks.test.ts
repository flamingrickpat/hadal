import { describe, expect, it } from 'vitest';
import {
  chunkContaining,
  computeActiveChunkIds,
  deepestChunk,
  validateWorldChunks,
  CHUNK_ACTIVE_RADIUS,
} from './chunks';
import { MACRO_WORLD, GREYBOX_WORLD, PLAYER_START, worldBounds } from './worldData';
import { Simulation, makeSimWorld, emptyInput } from '../sim/Simulation';

/**
 * The macro world over the §17 `WorldChunkDef` data (request §4.1/§4.2/§17,
 * §32): one connected descending network of ~5 depth bands at the required
 * scale, with valid exits, the start reaching the deepest chunk, and a
 * nearby/far chunk-activation rule (the streaming pass, request §17).
 */
describe('macro world connectivity and scale (request §4.1/§4.2)', () => {
  it('spans ~5 depth bands at the required scale (surface y=0, deepest ~-9,000..-12,000)', () => {
    const bands = new Set(MACRO_WORLD.map((c) => c.band));
    expect(bands.size).toBe(5);
    const bounds = worldBounds(MACRO_WORLD);
    // ~18,000–28,000 world units wide (request §4.1).
    expect(bounds.w).toBeGreaterThanOrEqual(18000);
    expect(bounds.w).toBeLessThanOrEqual(28000);
    // Surface at y = 0 (request §4.1): the top of the world bounds.
    expect(bounds.y + bounds.h).toBe(0);
    // Deepest point ~-9,000 to -12,000 (request §4.1): the bottom of the world bounds.
    const deepestY = -bounds.y; // bounds.y is the min y (most negative = deepest)
    expect(deepestY).toBeGreaterThanOrEqual(9000);
    expect(deepestY).toBeLessThanOrEqual(12000);
  });

  it('is a wide descending network, not a straight shaft (band centres spread horizontally)', () => {
    const centers = new Map<number, number>();
    for (const c of MACRO_WORLD) {
      const cx = c.bounds.x + c.bounds.w / 2;
      centers.set(c.band, (centers.get(c.band) ?? 0) + cx);
    }
    // The bands shift horizontally as they descend (a network, not a vertical shaft).
    const c1 = centers.get(1)!;
    const c5 = centers.get(5)!;
    expect(Math.abs(c5 - c1)).toBeGreaterThan(5000);
  });

  it('every chunk has valid exits (each exit references an existing chunk)', () => {
    const validation = validateWorldChunks(MACRO_WORLD, PLAYER_START);
    const refIssues = validation.issues.filter((i) => i.includes('references unknown chunk'));
    expect(refIssues).toEqual([]);
  });

  it('the start position reaches the deepest chunk over the exit graph', () => {
    const validation = validateWorldChunks(MACRO_WORLD, PLAYER_START);
    expect(validation.valid).toBe(true);
    expect(validation.issues).toEqual([]);
    expect(chunkContaining(MACRO_WORLD, PLAYER_START)?.id).toBe('seabed');
    expect(deepestChunk(MACRO_WORLD)?.id).toBe('hadal');
  });

  it('is a valid world overall (request §32 validateWorld)', () => {
    expect(validateWorldChunks(MACRO_WORLD, PLAYER_START).valid).toBe(true);
  });

  it('a chunk with a dangling exit reports an issue', () => {
    const bad = MACRO_WORLD.map((c) => ({
      ...c,
      exits: c.exits.map((e) => (e.to === 'hadal' ? { ...e, to: 'nonexistent' } : e)),
    }));
    const validation = validateWorldChunks(bad, PLAYER_START);
    expect(validation.valid).toBe(false);
    expect(validation.issues.some((i) => i.includes('references unknown chunk'))).toBe(true);
  });
});

describe('chunk activation (request §17 — nearby active, far disabled)', () => {
  it('the chunk containing the position is always active', () => {
    for (const chunk of MACRO_WORLD) {
      const cx = chunk.bounds.x + chunk.bounds.w / 2;
      const cy = chunk.bounds.y + chunk.bounds.h / 2;
      const active = computeActiveChunkIds(MACRO_WORLD, { x: cx, y: cy });
      expect(active.has(chunk.id)).toBe(true);
    }
  });

  it('nearby chunks are active and far chunks are disabled', () => {
    const atShelf = { x: 9500, y: -3600 }; // inside the shelf band
    const active = computeActiveChunkIds(MACRO_WORLD, atShelf);
    expect(active.has('shelf')).toBe(true);
    // The hadal (deepest, far below) is beyond the activation radius.
    expect(active.has('hadal')).toBe(false);
    // The radius is the documented threshold.
    expect(CHUNK_ACTIVE_RADIUS).toBeGreaterThan(0);
  });

  it('a position far from every chunk activates only nearby chunks', () => {
    const active = computeActiveChunkIds(MACRO_WORLD, { x: -3000, y: -100 });
    expect(active.size).toBeGreaterThan(0);
    expect(active.has('seabed')).toBe(true);
    expect(active.has('hadal')).toBe(false);
  });

  it('the greybox coast is a subset of the macro world (preparatory refactor)', () => {
    const coastIds = new Set(GREYBOX_WORLD.map((c) => c.id));
    expect(coastIds.has('seabed')).toBe(true);
    expect(coastIds.has('seal')).toBe(true);
    expect(GREYBOX_WORLD.length).toBeLessThan(MACRO_WORLD.length);
  });
});

describe('per-chunk ambient work gate (request §17 — far chunks disabled, consumed)', () => {
  it('active chunks carry an ambient budget and far chunks carry none', () => {
    const sim = new Simulation(makeSimWorld(), 0);
    // Every active chunk carries a budget equal to its authored ambient intensity.
    for (const id of sim.activeChunks) {
      const chunk = sim.chunks.find((c) => c.id === id);
      expect(chunk).toBeDefined();
      expect(sim.ambientWork.has(id)).toBe(true);
      expect(sim.ambientWork.get(id)).toBe(chunk!.ambient?.particleDensity ?? 0);
    }
    // Every non-active (far) chunk carries NO budget — its expensive per-chunk
    // ambient work (particles now, creature AI in WI-10) is disabled, not merely
    // deferred: the activation set is genuinely consumed by this gate.
    for (const chunk of sim.chunks) {
      if (!sim.activeChunks.has(chunk.id)) {
        expect(sim.ambientWork.has(chunk.id)).toBe(false);
      }
    }
    // The local ambient work near the player is non-zero; the render
    // (Game.renderVisuals) scales the ambient particle field by it.
    expect(sim.ambientIntensityAt(sim.player.position)).toBeGreaterThan(0);
  });

  it('moving the player far away drops the chunks left behind from the budget', () => {
    const sim = new Simulation(makeSimWorld(), 0);
    // At the start (coast) the seabed carries a budget; the far hadal has none.
    expect(sim.ambientWork.has('seabed')).toBe(true);
    expect(sim.ambientWork.has('hadal')).toBe(false);
    // Teleport into the hadal and re-step: the active set is recomputed from the
    // new position, so the coast chunk left far behind loses its budget.
    sim.teleportTo(21400, 9650);
    sim.step(emptyInput(), 1 / 60);
    expect(sim.ambientWork.has('hadal')).toBe(true);
    expect(sim.ambientWork.has('seabed')).toBe(false);
    expect(sim.ambientIntensityAt(sim.player.position)).toBeGreaterThan(0);
  });
});
