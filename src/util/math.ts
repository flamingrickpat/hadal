/**
 * holds — 2D vector, rect, and angle math shared by player, world, and UI.
 *
 * archetype: information-holder
 * owns: the canonical `Vec2` / `Rect` shapes and the pure helpers the
 *   movement, collision, camera, and debug code read (request §29
 *   `util/math.ts`): `vec2`, `clamp`, and shortest-arc `lerpAngle`.
 * not own: no state — every function is pure; hot paths pass scratch
 *   objects in instead of allocating.
 * invariant: `lerpAngle` always takes the shortest arc between the two
 *   angles.
 * fails when: a caller mutates a shared scratch object while another
 *   consumer still reads it — scratch ownership is the caller's.
 */
export interface Vec2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function vec2(x: number, y: number): Vec2 {
  return { x, y };
}

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

export function lerpAngle(a: number, b: number, t: number): number {
  let d = b - a;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return a + d * t;
}
