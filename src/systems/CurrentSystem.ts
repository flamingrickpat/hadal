/**
 * problem — currents must add real, spatial movement to the water and move both
 *   the player and the particles (request §64); solution — a set of authored
 *   `CurrentField`s (horizontal drift, vertical vents, pulsing currents, eddies)
 *   that compute the local velocity at (position, time), summed by `CurrentSystem`.
 *
 * archetype: service-provider
 * owns: the authored current fields and the pure `velocityAt(pos, time)` that
 *   sums the fields whose bounds contain `pos` (request §64). The four field
 *   constructors are pure data + a `velocityAt` closure.
 * not own: the player (the simulation applies the field to the player) or the
 *   particles (the render layer feeds this `velocityAt` into `stepParticleType`);
 *   it only computes the local water velocity.
 * invariant: `velocityAt` is deterministic in (pos, time, fields); a position
 *   outside every field's bounds returns (0, 0); fields sum additively.
 * fails when: none — pure; an empty field set yields (0, 0).
 */
import { vec2, type Rect, type Vec2 } from '../util/math';

/** A current field attached to a region (request §64). */
export interface CurrentField {
  bounds: Rect;
  /** Writes the field's velocity at (pos, time) into out (no allocation). */
  velocityAt(pos: Vec2, time: number, out: Vec2): void;
}

/** A constant horizontal/vertical drift (request §64). */
export function driftField(bounds: Rect, dir: Vec2, speed: number): CurrentField {
  const len = Math.hypot(dir.x, dir.y) || 1;
  const vx = (dir.x / len) * speed;
  const vy = (dir.y / len) * speed;
  return {
    bounds,
    velocityAt(_pos, _time, out) { out.x = vx; out.y = vy; },
  };
}

/** A vertical vent: upward flow, strongest at the center, parabolic falloff. */
export function ventField(bounds: Rect, riseSpeed: number): CurrentField {
  const cx = bounds.x + bounds.w / 2;
  const halfW = bounds.w / 2;
  return {
    bounds,
    velocityAt(pos, _time, out) {
      const dx = halfW > 0 ? (pos.x - cx) / halfW : 0;
      const falloff = Math.max(0, 1 - dx * dx);
      out.x = 0;
      out.y = riseSpeed * falloff;
    },
  };
}

/** A pulsing current: a drift whose strength oscillates over `period`. */
export function pulsingCurrentField(bounds: Rect, dir: Vec2, maxSpeed: number, period: number): CurrentField {
  const len = Math.hypot(dir.x, dir.y) || 1;
  const vx = (dir.x / len) * maxSpeed;
  const vy = (dir.y / len) * maxSpeed;
  return {
    bounds,
    velocityAt(_pos, time, out) {
      const pulse = (Math.sin((time / period) * 2 * Math.PI) + 1) / 2;
      out.x = vx * pulse;
      out.y = vy * pulse;
    },
  };
}

/** A slow circular eddy: a swirl around the field center, radial falloff. */
export function eddyField(bounds: Rect, radius: number, swirlSpeed: number): CurrentField {
  const cx = bounds.x + bounds.w / 2;
  const cy = bounds.y + bounds.h / 2;
  return {
    bounds,
    velocityAt(pos, _time, out) {
      const dx = pos.x - cx;
      const dy = pos.y - cy;
      const d = Math.hypot(dx, dy) || 1;
      const falloff = Math.max(0, 1 - d / radius);
      out.x = (-dy / d) * swirlSpeed * falloff;
      out.y = (dx / d) * swirlSpeed * falloff;
    },
  };
}

// Shared temp for field summation (request §34: no per-frame allocation).
const tempSum = { x: 0, y: 0 };

/** Sums the current velocity over all fields whose bounds contain the position. */
export class CurrentSystem {
  constructor(private readonly fields: readonly CurrentField[]) {}

  /** The local water velocity at (pos, time): the sum of the containing fields (request §64). Writes into out. */
  velocityAt(pos: Vec2, time: number, out: Vec2): void {
    let vx = 0;
    let vy = 0;
    for (const f of this.fields) {
      const b = f.bounds;
      if (pos.x < b.x || pos.x > b.x + b.w || pos.y < b.y || pos.y > b.y + b.h) continue;
      tempSum.x = 0;
      tempSum.y = 0;
      f.velocityAt(pos, time, tempSum);
      vx += tempSum.x;
      vy += tempSum.y;
    }
    out.x = vx;
    out.y = vy;
  }
}
