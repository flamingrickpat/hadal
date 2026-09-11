/**
 * problem — the parting-schools juice effect (request §48) needs data-driven
 *   proximity and split parameters that are Node-testable independently of the
 *   renderer; solution — a pure data module with the parting thresholds and a
 *   split-state function that classifies a school's proximity to the player.
 *
 * archetype: information-holder; also: service-provider
 * owns: the split parameters (proximity radius, spread, re-form time) and the
 *   split-state classification function used by the creature renderer.
 * not own: the render offsets (those are computed per-frame in the renderer)
 *   or the steering outcomes (those are owned by the sim).
 * invariant: the split state is deterministic in (creature, player, params);
 *   a school's proximity never changes steering outcomes (request §48).
 * fails when: none — pure data and classification.
 */

import type { Vec2 } from '../util/math';
import type { Creature } from '../creatures/Creature';

/** The proximity radius at which a school begins to part around the player. */
export const SPLIT_PROXIMITY_RADIUS = 300;

/** The maximum spread (world units) a school member is pushed away from the player. */
export const SPLIT_SPREAD = 80;

/** How long (seconds) the split state lingers after the player leaves proximity. */
export const SPLIT_REFORM_TIME = 0.5;

/** The split state of a school relative to the player's proximity. */
export type SplitState = 'whole' | 'parting' | 'reforming';

/**
 * Classify a school's split state from its proximity to the player.
 * `whole` — player is far; `parting` — player is within proximity;
 * `reforming` — player left proximity but within re-form time (caller tracks).
 *
 * @param schoolCenter The school's center position (any active member).
 * @param playerPos The player's world position.
 * @param withinProx Whether the player is currently within SPLIT_PROXIMITY_RADIUS.
 * @param reformElapsed Seconds since the player left proximity (0 if still near).
 */
export function splitState(
  schoolCenter: Vec2,
  playerPos: Vec2,
  withinProx: boolean,
  reformElapsed: number,
): SplitState {
  if (withinProx) return 'parting';
  if (reformElapsed > 0 && reformElapsed <= SPLIT_REFORM_TIME) return 'reforming';
  return 'whole';
}

/**
 * Compute the render offset for one school member based on proximity to the player.
 * The offset pushes members away from the player, scaled by proximity (stronger
 * when closer). Returns { x, y } in world units to add to the render position.
 *
 * @param member The school member creature.
 * @param playerPos The player's world position.
 * @param state The current split state.
 * @param reformProgress [0..1] — fraction of re-form time elapsed (0 = just left, 1 = fully re-formed).
 */
export function splitOffset(
  member: Creature,
  playerPos: Vec2,
  state: SplitState,
  reformProgress: number,
): { x: number; y: number } {
  if (state === 'whole') return { x: 0, y: 0 };

  // During reforming, fade the offset out.
  const fade = state === 'reforming' ? (1 - reformProgress) : 1;
  if (fade <= 0) return { x: 0, y: 0 };

  // Proximity-scaled split: push the member away from the player.
  const dx = member.position.x - playerPos.x;
  const dy = member.position.y - playerPos.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1e-3) return { x: 0, y: 0 };

  // Scale by proximity: 1 at edge, 0 at player center.
  const proximity = Math.min(1, dist / SPLIT_PROXIMITY_RADIUS);
  const strength = SPLIT_SPREAD * (1 - proximity) * fade;
  return {
    x: (dx / dist) * strength,
    y: (dy / dist) * strength,
  };
}
