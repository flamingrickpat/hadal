/**
 * problem — the ecosystem illusion (request §20) needs a few cheap
 *   cross-species reactions (flee, scavenge, orient, hide, part around the
 *   player) that every species keys to the same nearby signals instead of
 *   reading global state (request §63); solution — a small set of pure
 *   reaction predicates over the `WorldSignalBus` (noise tags
 *   `predator` / `kill` / `quiet` — no new signal types) and a bounded-local
 *   flocking force for schools (request §20, §48).
 *
 * archetype: service-provider
 * owns: the ecology signal-tag conventions, the distance/strength reaction
 *   predicates (`fleeSignalStrength`, `scavengeSignalStrength`,
 *   `quietStrength`), the strongest-signal position lookup
 *   (`strongestTaggedPos`) reactions steer toward/away from, the
 *   bounded-local flock force (`flockForce`), and the shared perception
 *   budgets those predicates query with.
 * not own: the state machines (the generic engine in `Creature.ts` applies
 *   the outcomes), the signal bus itself (`senses.ts`), or any roster
 *   content (ST-03 opts species in via `CreatureDef.ecology`).
 * invariant: every predicate reads only nearby recent signals through
 *   `bus.queryNear` with a fixed radius — no global state, no allocations
 *   (a caller-reused scratch list is passed in, request §34, §61); critical
 *   behavior is deterministic in (bus, position, time).
 * fails when: none — pure; an empty bus perceives all-zero strengths.
 */
import { vec2, type Vec2 } from '../util/math';
import { WorldSignalBus, type WorldSignal } from './senses';
import type { Creature } from './Creature';

// Ecology signal tags (request §20): all reactions are `noise` signals on the
// existing §63 bus, distinguished by tag — no new signal type, no global read.
export const PREDATOR_TAG = 'predator'; // a predator is nearby (prey flees)
export const KILL_TAG = 'kill'; // a recent kill (scavengers approach)
export const QUIET_TAG = 'quiet'; // a zone is quieting before a major event

// Perception radii (world units) at which each reaction is queried. Kept
// within `SIGNAL_RANGE_REF` so a strength-1 signal is always perceivable.
export const FLEE_RADIUS = 900;
export const SCAVENGE_RADIUS = 800;
export const QUIET_RADIUS = 1200;

// The strength at which a reaction engages (request §20): a fixed per-reaction
// threshold — species opt in with the `ecology` flags, and `ecology.quiet` is
// the one per-species threshold (quiet tolerance varies by animal).
export const FLEE_THRESHOLD = 0.15; // predator noise this loud → flee
export const SCAVENGE_THRESHOLD = 0.1; // kill noise this loud → approach

// The predator→prey attack geometry (request §20 "predators occasionally
// attack ambient prey"): a stalking predator drives at the nearest ambient
// (non-combat) creature within attack range; within kill distance it makes
// the kill that feeds the scavenge reaction. Deterministic — no randomness
// in critical behavior (request §61).
export const PREDATOR_SIGNAL_STRENGTH = 0.8; // the tagged noise a hunting predator emits
export const PREDATOR_ATTACK_RANGE = 400; // a stalk only targets prey this close
export const PREDATOR_KILL_DIST = 60; // within this, the kill signal lands

/**
 * The strongest perceived signal of `tag` at `(x, y)`, 0 when none match.
 * Max, not sum: a persistent emitter leaves several of its own signals on
 * the bus (each decaying on its own), and a reaction keys to how loud the
 * single loudest one is, not how many there happen to be.
 */
function tagStrength(
  bus: WorldSignalBus,
  x: number,
  y: number,
  time: number,
  radius: number,
  tag: string,
  scratch: WorldSignal[],
): number {
  let best = 0;
  const n = bus.queryNear(x, y, radius, time, scratch);
  for (let i = 0; i < n; i += 1) {
    const s = scratch[i]!;
    if ((s.type === 'noise' || s.type === 'light') && s.tag === tag && s.strength > best) {
      best = s.strength;
    }
  }
  return best;
}

/**
 * The perceived strength of predator-tagged noise at `(x, y)`: prey flee when
 * this crosses their senses threshold (request §20: small fauna flee predator
 * proximity). Caller supplies a reused scratch list (no per-frame allocation).
 */
export function fleeSignalStrength(
  bus: WorldSignalBus,
  x: number,
  y: number,
  time: number,
  scratch: WorldSignal[],
): number {
  return tagStrength(bus, x, y, time, FLEE_RADIUS, PREDATOR_TAG, scratch);
}

/**
 * The perceived strength of kill-tagged noise at `(x, y)`: scavengers approach
 * when this is non-trivial (request §20: scavengers approach recent kills).
 */
export function scavengeSignalStrength(
  bus: WorldSignalBus,
  x: number,
  y: number,
  time: number,
  scratch: WorldSignal[],
): number {
  return tagStrength(bus, x, y, time, SCAVENGE_RADIUS, KILL_TAG, scratch);
}

/**
 * The perceived strength of quiet-tagged noise at `(x, y)`: animals hold while
 * this stays at or above their `ecology.quiet` threshold (request §20: zones
 * quiet before major events).
 */
export function quietStrength(
  bus: WorldSignalBus,
  x: number,
  y: number,
  time: number,
  scratch: WorldSignal[],
): number {
  return tagStrength(bus, x, y, time, QUIET_RADIUS, QUIET_TAG, scratch);
}

/**
 * The perceived position of the strongest signal tagged `tag` within
 * `radius` of `(x, y)`: reactions steer toward (scavenge) or away from
 * (flee) the signal source, not just its strength. Writes into the caller's
 * reused `out` slot and returns true when a signal of that tag is perceived
 * (no allocation, request §34). Deterministic in (bus, x, y, time).
 */
export function strongestTaggedPos(
  bus: WorldSignalBus,
  tag: string,
  x: number,
  y: number,
  time: number,
  radius: number,
  scratch: WorldSignal[],
  out: Vec2,
): boolean {
  let best = 0;
  let found = false;
  const n = bus.queryNear(x, y, radius, time, scratch);
  for (let i = 0; i < n; i += 1) {
    const s = scratch[i]!;
    if ((s.type === 'noise' || s.type === 'light') && s.tag === tag && s.strength > best) {
      best = s.strength;
      found = true;
      out.x = s.pos.x;
      out.y = s.pos.y;
    }
  }
  return found;
}

// Flocking tuning (request §20 schooling, §48 parting): all perception is
// bounded-local — a member only sees neighbors within FLOCK_RADIUS, and the
// player (the throttling focus) within PART_RADIUS is repelled.
const FLOCK_RADIUS = 220; // bounded local perception (request §20)
const FLOCK_SEPARATION_RADIUS = 60; // personal space
const PART_RADIUS = 300; // the player parts the school (request §48)
const FLOCK_SPEED_REF = 140; // terminal speed the steering model expects

/**
 * The bounded-local flocking force for `self` among `members` (request §20,
 * §48): separation + cohesion + alignment over neighbors within
 * `FLOCK_RADIUS`, plus a repulsion from the player (`focus`) within
 * `PART_RADIUS`. Returns a steering force in world units/sec²; a far member
 * has no effect (bounded perception). `out` is a reused result slot.
 * Deterministic in (members, self, focus, time) — idle variation is layered
 * on by the caller's seeded rng, never here (request §61).
 */
export function flockForce(
  members: readonly Creature[],
  self: Creature,
  focus: Vec2,
  out: Vec2,
): Vec2 {
  let sx = 0, sy = 0; // separation (away from close neighbors)
  let cx = 0, cy = 0; // cohesion (toward the local center)
  let ax = 0, ay = 0; // alignment (toward the local average heading)
  let count = 0, sepCount = 0;
  const p = self.position;
  for (const other of members) {
    if (other === self || !other.active) continue;
    const dx = other.position.x - p.x;
    const dy = other.position.y - p.y;
    const d = Math.hypot(dx, dy);
    if (d > FLOCK_RADIUS) continue; // bounded local perception
    count += 1;
    cx += dx;
    cy += dy;
    ax += other.velocity.x;
    ay += other.velocity.y;
    if (d < FLOCK_SEPARATION_RADIUS && d > 1e-3) {
      // Push away, weighted so the closer the stronger.
      const w = 1 - d / FLOCK_SEPARATION_RADIUS;
      sx -= (dx / d) * w;
      sy -= (dy / d) * w;
      sepCount += 1;
    }
  }
  out.x = 0;
  out.y = 0;
  if (count > 0) {
    // Cohesion: toward the neighbor center (a fraction of the offset).
    out.x += (cx / count) * 0.5;
    out.y += (cy / count) * 0.5;
    // Alignment: toward the average heading (as a velocity delta).
    out.x += (ax / count - self.velocity.x) * 0.8;
    out.y += (ay / count - self.velocity.y) * 0.8;
  }
  if (sepCount > 0) {
    // Separation dominates: personal space is non-negotiable.
    out.x += sx * FLOCK_SPEED_REF * 1.5;
    out.y += sy * FLOCK_SPEED_REF * 1.5;
  }
  // Part around the player (request §48): repel while the focus is close.
  const px = p.x - focus.x;
  const py = p.y - focus.y;
  const pd = Math.hypot(px, py);
  if (pd < PART_RADIUS && pd > 1e-3) {
    const w = 1 - pd / PART_RADIUS;
    out.x += (px / pd) * w * FLOCK_SPEED_REF * 2;
    out.y += (py / pd) * w * FLOCK_SPEED_REF * 2;
  }
  return out;
}
