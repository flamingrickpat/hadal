/**
 * collides — 2D terrain polylines; resolves a circle against them (request §31).
 *
 * archetype: service-provider
 * owns: the precomputed segment set for the world's terrain shapes and
 *   circle-vs-segment resolution: a circle is pushed out to one radius
 *   along the nearest segment normal, and its inward velocity component
 *   is removed so the player cannot re-penetrate the same wall next
 *   step. `visual` points (when present) are ignored here — collision
 *   and rendering may differ (request §31).
 * not own: rendering the silhouettes (`World`), the player state
 *   (`Player`).
 * invariant: after `resolveCircle`, the circle is at least `radius`
 *   away from every segment (to floating-point precision); resolution
 *   is deterministic in (pos, radius, segments); shapes are checked in
 *   authored order.
 * fails when: a shape has fewer than two points — invalid authored
 *   data, the builder throws.
 */
import { clamp, type Vec2 } from '../util/math';

export interface TerrainShapeDef {
  id: string;
  points: readonly Vec2[];
  closed?: boolean;
  visual?: readonly Vec2[];
}

export interface Terrain {
  resolveCircle(pos: Vec2, radius: number, velocity?: Vec2): Vec2;
}

interface Segment {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  // shape centroid: the interior proxy used when the circle center sits
  // exactly on a segment
  cx: number;
  cy: number;
}

export function buildTerrain(defs: readonly TerrainShapeDef[]): Terrain {
  const segments: Segment[] = [];
  for (const shape of defs) {
    const pts = shape.points;
    if (pts.length < 2) throw new Error(`terrain shape ${shape.id} needs at least 2 points`);
    let cx = 0;
    let cy = 0;
    for (const p of pts) {
      cx += p.x;
      cy += p.y;
    }
    cx /= pts.length;
    cy /= pts.length;
    const count = shape.closed ? pts.length : pts.length - 1;
    for (let i = 0; i < count; i++) {
      const a = pts[i]!;
      const b = pts[(i + 1) % pts.length]!;
      segments.push({ ax: a.x, ay: a.y, bx: b.x, by: b.y, cx, cy });
    }
  }

  function resolveCircle(pos: Vec2, radius: number, velocity?: Vec2): Vec2 {
    for (const s of segments) {
      const abx = s.bx - s.ax;
      const aby = s.by - s.ay;
      const abLenSq = abx * abx + aby * aby;
      const t =
        abLenSq > 1e-12
          ? clamp(((pos.x - s.ax) * abx + (pos.y - s.ay) * aby) / abLenSq, 0, 1)
          : 0;
      const cpx = s.ax + abx * t;
      const cpy = s.ay + aby * t;
      let dx = pos.x - cpx;
      let dy = pos.y - cpy;
      const d = Math.hypot(dx, dy);
      if (d >= radius) continue;
      let nx: number;
      let ny: number;
      if (d > 1e-9) {
        nx = dx / d;
        ny = dy / d;
      } else {
        // Center sits exactly on the segment: push along its normal,
        // away from the shape interior.
        nx = -(s.by - s.ay);
        ny = s.bx - s.ax;
        const nl = Math.hypot(nx, ny);
        if (nl < 1e-9) continue;
        nx /= nl;
        ny /= nl;
        if (nx * (pos.x - s.cx) + ny * (pos.y - s.cy) < 0) {
          nx = -nx;
          ny = -ny;
        }
      }
      const push = radius - d;
      pos.x += nx * push;
      pos.y += ny * push;
      if (velocity !== undefined) {
        const vn = velocity.x * nx + velocity.y * ny;
        if (vn < 0) {
          velocity.x -= nx * vn;
          velocity.y -= ny * vn;
        }
      }
    }
    return pos;
  }

  return { resolveCircle };
}
