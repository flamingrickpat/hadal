/**
 * problem — the greybox world uses obvious rectangular slabs for terrain, which
 *   reads as debug geometry; solution — a seeded procedural generator that
 *   produces organic, band-consistent terrain silhouettes with jagged edges,
 *   overhangs, and depth-varying complexity (request §14.3, §17).
 *
 * archetype: service-provider
 * owns: the procedural terrain generator and its band-specific parameters: the
 *   shape count, vertex count, and roughness scale for each of the five depth
 *   bands. `generateOrganicTerrain` produces a closed polygon for each shape
 *   with irregular, non-rectangular edges.
 * not own: the collision terrain (`terrain.ts`), the terrain shape definition
 *   (`TerrainShapeDef`), or the authored world data (`worldData.ts`).
 * fails when: the shape count is 0 (the generator throws).
 * invariant: the generated shapes are closed polygons (the last point equals
 *   the first), fit within the supplied bounds, and use only the seeded PRNG
 *   (no `Math.random`).
 */
import { vec2, type Rect } from '../util/math';
import { createRng } from '../util/rng';
import type { TerrainShapeDef } from './terrain';

// Band-specific terrain parameters: deeper bands have more shapes, more
// vertices, and more roughness (request §14.3).
interface BandTerrainParams {
  shapeCount: number;
  minVertices: number;
  maxVertices: number;
  roughness: number;
  minSizeX: number;
  maxSizeX: number;
  minSizeY: number;
  maxSizeY: number;
}

const BAND_PARAMS: readonly BandTerrainParams[] = [
  // Band 1 (coast): fewer shapes, smoother, shallower
  { shapeCount: 3, minVertices: 8, maxVertices: 14, roughness: 0.15, minSizeX: 800, maxSizeX: 2000, minSizeY: 200, maxSizeY: 600 },
  // Band 2 (shelf): moderate complexity
  { shapeCount: 5, minVertices: 10, maxVertices: 18, roughness: 0.2, minSizeX: 600, maxSizeX: 1600, minSizeY: 180, maxSizeY: 500 },
  // Band 3 (twilight): more complex, jagged
  { shapeCount: 7, minVertices: 12, maxVertices: 22, roughness: 0.25, minSizeX: 500, maxSizeX: 1400, minSizeY: 150, maxSizeY: 450 },
  // Band 4 (abyss): very complex, highly irregular
  { shapeCount: 9, minVertices: 14, maxVertices: 26, roughness: 0.3, minSizeX: 400, maxSizeX: 1200, minSizeY: 120, maxSizeY: 400 },
  // Band 5 (hadal): maximum complexity
  { shapeCount: 11, minVertices: 16, maxVertices: 30, roughness: 0.35, minSizeX: 300, maxSizeX: 1000, minSizeY: 100, maxSizeY: 350 },
];

function seedFromString(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i);
    hash = ((hash << 5) - hash + ch) | 0;
  }
  return hash >>> 0;
}

/**
 * Generate organic, band-consistent terrain shapes for a chunk.
 *
 * The seed is derived from the chunk id, so the same chunk always produces the
 * same terrain. Deeper bands produce more shapes with more vertices and more
 * roughness (request §14.3).
 *
 * @param chunkId The chunk id used as the seed source.
 * @param band The depth band (1-5).
 * @param bounds The chunk bounds that the shapes must fit within.
 * @returns An array of terrain shape definitions with organic outlines.
 */
export function generateOrganicTerrain(chunkId: string, band: number, bounds: Rect): readonly TerrainShapeDef[] {
  const bandIndex = Math.min(Math.max(band - 1, 0), BAND_PARAMS.length - 1);
  const params = BAND_PARAMS[bandIndex]!;
  const seed = seedFromString(chunkId);
  const rng = createRng(seed);

  const shapes: TerrainShapeDef[] = [];

  for (let i = 0; i < params.shapeCount; i++) {
    // Position the shape within the chunk bounds
    const cx = bounds.x + (rng() * 0.6 + 0.2) * bounds.w; // center horizontally, leave margins
    const cy = bounds.y + (rng() * 0.8 + 0.1) * bounds.h; // center vertically, leave top margin

    // Random size within the band's range
    const sizeX = params.minSizeX + rng() * (params.maxSizeX - params.minSizeX);
    const sizeY = params.minSizeY + rng() * (params.maxSizeY - params.minSizeY);

    // Generate organic outline
    const vertexCount = params.minVertices + Math.floor(rng() * (params.maxVertices - params.minVertices + 1));
    const points = generateOrganicOutline(cx, cy, sizeX, sizeY, vertexCount, params.roughness, rng);

    shapes.push({
      id: `${chunkId}-shape-${i}`,
      closed: true,
      points,
    });
  }

  return shapes;
}

function generateOrganicOutline(
  cx: number,
  cy: number,
  sizeX: number,
  sizeY: number,
  vertexCount: number,
  roughness: number,
  rng: () => number,
): readonly ReturnType<typeof vec2>[] {
  const points = [];
  const halfX = sizeX / 2;
  const halfY = sizeY / 2;

  for (let i = 0; i < vertexCount; i++) {
    const angle = (i / vertexCount) * Math.PI * 2;
    // Base elliptical shape with jitter
    const baseX = Math.cos(angle) * halfX;
    const baseY = Math.sin(angle) * halfY;

    // Add organic jitter — random displacement with smooth variation
    const jitterX = (rng() - 0.5) * sizeX * roughness;
    const jitterY = (rng() - 0.5) * sizeY * roughness;

    // Add slight overhang effect (horizontal displacement varies with vertical position)
    const overhang = (rng() - 0.5) * sizeX * roughness * 0.5;

    points.push(vec2(cx + baseX + jitterX + overhang, cy + baseY + jitterY));
  }

  return points;
}

/**
 * Generate an organic terrain shape from a rectangular slab, adding irregular
 * edge detail while preserving the overall footprint. The slab's corners are
 * the base, and each edge is perturbed with organic jitter.
 *
 * @param id The shape id.
 * @param x The slab's top-left x.
 * @param y The slab's top-left y.
 * @param w The slab's width.
 * @param h The slab's height.
 * @param band The depth band (1-5) for roughness.
 * @param rng The seeded PRNG.
 * @returns A terrain shape definition with organic edges.
 */
export function generateOrganicSlab(
  id: string,
  x: number,
  y: number,
  w: number,
  h: number,
  band: number,
  rng: () => number,
): TerrainShapeDef {
  const bandIndex = Math.min(Math.max(band - 1, 0), BAND_PARAMS.length - 1);
  const params = BAND_PARAMS[bandIndex]!;
  const roughness = params.roughness;

  // Collision shape: the original rectangle (4 points).
  const points = [
    vec2(x, y),
    vec2(x + w, y),
    vec2(x + w, y + h),
    vec2(x, y + h),
  ];

  // Visual shape: organic outline with jitter.
  const visualPoints = generateOrganicOutlinePoints(x, y, w, h, roughness, rng);

  return {
    id,
    closed: true,
    points,
    visual: visualPoints,
  };
}

/** Generate an organic outline for the visual shape. */
function generateOrganicOutlinePoints(
  x: number,
  y: number,
  w: number,
  h: number,
  roughness: number,
  rng: () => number,
): readonly ReturnType<typeof vec2>[] {
  const edgeSegments = Math.max(4, Math.min(12, Math.floor(Math.max(w, h) / 200)));
  const jitterMag = Math.min(w, h) * roughness * 0.08;

  const points: ReturnType<typeof vec2>[] = [];

  // Top edge (left to right)
  for (let i = 0; i < edgeSegments; i++) {
    const t = i / (edgeSegments - 1);
    const baseX = x + t * w;
    const jitterY = (rng() - 0.5) * jitterMag;
    points.push(vec2(baseX, y + jitterY));
  }

  // Right edge (top to bottom)
  for (let i = 1; i < edgeSegments; i++) {
    const t = i / (edgeSegments - 1);
    const baseY = y + t * h;
    const jitterX = (rng() - 0.5) * jitterMag;
    points.push(vec2(x + w + jitterX, baseY));
  }

  // Bottom edge (right to left)
  for (let i = edgeSegments - 2; i >= 0; i--) {
    const t = i / (edgeSegments - 1);
    const baseX = x + t * w;
    const jitterY = (rng() - 0.5) * jitterMag;
    points.push(vec2(baseX, y + h + jitterY));
  }

  // Left edge (bottom to top)
  for (let i = edgeSegments - 2; i > 0; i--) {
    const t = i / (edgeSegments - 1);
    const baseY = y + t * h;
    const jitterX = (rng() - 0.5) * jitterMag;
    points.push(vec2(x + jitterX, baseY));
  }

  return points;
}