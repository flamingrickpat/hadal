/**
 * problem — a creature needs the same desired-velocity-vs-drag motion model as
 *   the player (request §6), plus arrive/flee steering for its state machine;
 *   solution — a few allocation-free pure mutators over the creature's
 *   position/velocity that the `Creature` runtime and the simulation's
 *   collision pass both call (terrain avoidance happens through the real
 *   `Terrain.resolveCircle`, request §31 — not here).
 *
 * archetype: service-provider
 * owns: the motion integrator — accelerate toward a desired velocity,
 *   exponential drag (identical model to `PlayerController.update`, request
 *   §6), the max-speed cap, arrive damping near a target, and flee-away
 *   steering.
 * not own: collision — the caller runs `terrain.resolveCircle` after
 *   integrating; nothing here knows about terrain.
 * invariant: `pos` and `vel` are mutated in place; at most one tiny `Vec2` is
 *   allocated per steer call (request §34 — the hot path stays light).
 * fails when: a caller passes a zeroed `MovementDef` — the creature simply
 *   never moves (no error).
 */
import { vec2, type Vec2 } from '../util/math';
import type { MovementDef } from './CreatureDef';

/** Integrate one step: accelerate toward `desired`, apply drag, advance. */
export function steerVelocity(pos: Vec2, vel: Vec2, desired: Vec2, m: MovementDef, dt: number): void {
  // Drive the velocity toward the desired one, limited by the thrust this step.
  const stepAccel = m.accel * dt;
  const dx = desired.x - vel.x;
  const dy = desired.y - vel.y;
  vel.x += Math.abs(dx) <= stepAccel ? dx : Math.sign(dx) * stepAccel;
  vel.y += Math.abs(dy) <= stepAccel ? dy : Math.sign(dy) * stepAccel;
  // The player's drag model (request §6): exponential, so the feel is
  // identical at any step size.
  const drag = Math.exp(-m.dragRate * dt);
  vel.x *= drag;
  vel.y *= drag;
  const speed = Math.hypot(vel.x, vel.y);
  if (speed > m.maxSpeed) {
    const scale = m.maxSpeed / speed;
    vel.x *= scale;
    vel.y *= scale;
  }
  pos.x += vel.x * dt;
  pos.y += vel.y * dt;
}

/** Drag the velocity toward a stop (idle/hover). */
export function settle(pos: Vec2, vel: Vec2, m: MovementDef, dt: number): void {
  steerVelocity(pos, vel, vec2(0, 0), m, dt);
}

/** Steer toward a point with arrive damping so the creature does not overshoot. */
export function steerToward(pos: Vec2, vel: Vec2, target: Vec2, m: MovementDef, dt: number): void {
  const dx = target.x - pos.x;
  const dy = target.y - pos.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1e-6) {
    settle(pos, vel, m, dt);
    return;
  }
  // Arrive: scale the desired speed down as the target gets close so the
  // creature slows instead of orbiting it.
  const desiredSpeed = Math.min(m.maxSpeed, dist * 2);
  steerVelocity(pos, vel, vec2((dx / dist) * desiredSpeed, (dy / dist) * desiredSpeed), m, dt);
}

/** Steer away from a point (flee). */
export function steerAway(pos: Vec2, vel: Vec2, from: Vec2, m: MovementDef, dt: number): void {
  const dx = pos.x - from.x;
  const dy = pos.y - from.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1e-6) {
    // directly on top of the threat: pick no direction (stay put) — the
    // state machine's flee-fade or fleeRange check moves it on.
    settle(pos, vel, m, dt);
    return;
  }
  steerVelocity(pos, vel, vec2((dx / dist) * m.maxSpeed, (dy / dist) * m.maxSpeed), m, dt);
}


