/**
 * holds — the greybox world chunk data: seabed, west wall, central wall, east ridge (request §17).
 *
 * archetype: information-holder
 * owns: the small swimmable greybox map — surface at y = 0, an
 *   undulating seabed, two walls, and a ridge — as `WorldChunkDef`
 *   entries of closed terrain polylines, plus the player start
 *   position and the derived world bounds. The seabed shape is the
 *   whole water column (closed at y = 0), so the surface line is a
 *   solid ceiling and "surfacing" means reaching it (oxygen/health
 *   refill there, request §5).
 * not own: chunk streaming, resources, creatures, or triggers — the
 *   full authored chunk model (request §17) grows this same file in
 *   WI-07.
 * invariant: the map is swimmable end to end — the water column is
 *   always deeper than the player diameter and every wall/ridge top
 *   is reachable from above; collision slabs are one player diameter
 *   wide with their bottom edge riding the floor line, and the wider
 *   `visual` polylines may differ (request §31).
 * fails when: an edit strands the player inside a solid — verified by
 *   the swim probe, not by data checks.
 */
import { vec2, type Rect, type Vec2 } from '../util/math';
import type { TerrainShapeDef } from './terrain';

export interface WorldChunkDef {
  id: string;
  bounds: Rect;
  terrain: readonly TerrainShapeDef[];
}

export const GREYBOX_WORLD: readonly WorldChunkDef[] = [
  {
    id: 'seabed',
    bounds: { x: -3000, y: -1620, w: 8600, h: 1620 },
    terrain: [
      {
        id: 'seabed-floor',
        closed: true,
        // Collision shape: the whole water column, closed at the surface.
        points: [
          vec2(-3000, 0),
          vec2(-3000, -1200),
          vec2(-2200, -1350),
          vec2(-1400, -1250),
          vec2(-600, -1400),
          vec2(200, -1300),
          vec2(1000, -1450),
          vec2(1800, -1380),
          vec2(2350, -1450),
          vec2(2650, -1450),
          vec2(3300, -1350),
          vec2(4000, -1250),
          vec2(4800, -1400),
          vec2(5600, -1300),
          vec2(5600, 0),
        ],
        // Rendered band: just the floor, not the water above it.
        visual: [
          vec2(-3000, -1200),
          vec2(-2200, -1350),
          vec2(-1400, -1250),
          vec2(-600, -1400),
          vec2(200, -1300),
          vec2(1000, -1450),
          vec2(1800, -1380),
          vec2(2350, -1450),
          vec2(2650, -1450),
          vec2(3300, -1350),
          vec2(4000, -1250),
          vec2(4800, -1400),
          vec2(5600, -1300),
          vec2(5600, -1620),
          vec2(-3000, -1620),
        ],
      },
    ],
  },
  {
    id: 'west-wall',
    bounds: { x: -2650, y: -1313, w: 250, h: 413 },
    terrain: [
      {
        id: 'west-wall-slab',
        closed: true,
        // One player diameter wide; bottom edge rides the floor line.
        points: [
          vec2(-2560, -1282),
          vec2(-2560, -900),
          vec2(-2496, -900),
          vec2(-2496, -1294),
        ],
        visual: [
          vec2(-2650, -1266),
          vec2(-2650, -900),
          vec2(-2400, -900),
          vec2(-2400, -1313),
        ],
      },
    ],
  },
  {
    id: 'wall',
    bounds: { x: 2350, y: -1450, w: 300, h: 930 },
    terrain: [
      {
        id: 'wall-slab',
        closed: true,
        points: [
          vec2(2370, -1450),
          vec2(2370, -520),
          vec2(2434, -520),
          vec2(2434, -1450),
        ],
        visual: [
          vec2(2350, -1450),
          vec2(2350, -520),
          vec2(2650, -520),
          vec2(2650, -1450),
        ],
      },
    ],
  },
  {
    id: 'ridge',
    bounds: { x: 4400, y: -1400, w: 700, h: 350 },
    terrain: [
      {
        id: 'ridge-slab',
        closed: true,
        points: [
          vec2(4700, -1381),
          vec2(4700, -1050),
          vec2(4764, -1050),
          vec2(4764, -1393),
        ],
        visual: [
          vec2(4400, -1325),
          vec2(4400, -1050),
          vec2(5100, -1050),
          vec2(5100, -1362),
          vec2(4800, -1400),
        ],
      },
    ],
  },
];

export const PLAYER_START: Vec2 = vec2(1300, -100);

export function worldBounds(chunks: readonly WorldChunkDef[]): Rect {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const c of chunks) {
    minX = Math.min(minX, c.bounds.x);
    minY = Math.min(minY, c.bounds.y);
    maxX = Math.max(maxX, c.bounds.x + c.bounds.w);
    maxY = Math.max(maxY, c.bounds.y + c.bounds.h);
  }
  if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
    throw new Error('worldBounds: no chunks supplied');
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}
