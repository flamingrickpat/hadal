/**
 * problem — the section 10 combat philosophy needs a per-size-class damage
 *   model the player's harpoon resolves against (small fauna killable
 *   quickly, medium predators killable but costly, large predators deterable
 *   and not worth killing, never an HP bar over a leviathan); solution — one
 *   data table plus one pure per-hit resolution, no creature state.
 *
 * archetype: service-provider
 * owns: the `DAMAGE_MODEL` table (harpoon cost per `CreatureSizeClass`), the
 *   per-hit resolution `resolveHarpoonHit`, and the model's two tuning
 *   constants (`HARPOON_RANGE`, `DETER_HOLD_SECONDS`).
 * not own: who gets hit (the `Simulation` picks the nearest creature in
 *   range on a harpoon shot), what a kill or deter does to the world
 *   (creature removal, the deter window, the withdraw state — the sim), and
 *   per-predator behavior (WI-03c1b controllers).
 * fails when: none — pure; the table brackets every `CreatureSizeClass`.
 * invariant: `DAMAGE_MODEL` is a cost table, not an HP model — it carries
 *   `killShots` and nothing else, so no caller can read or render an HP bar
 *   for any size class (request §10); a `large` hit always resolves `deter`,
 *   never `kill`.
 */
import type { CreatureSizeClass } from './CreatureDef';

/** How far a harpoon shot reaches (world units): the nearest creature within this is the target. */
export const HARPOON_RANGE = 600;

/**
 * How long a deter holds (sim seconds): while the window is in force the
 * deterred creature's generic engine does not re-engage (request §10: a
 * detered large predator stands down, it is not simply ignored).
 */
export const DETER_HOLD_SECONDS = 20;

/**
 * The section 10 damage model, as the harpoon cost per size class:
 * small fauna kill on one hit, medium predators cost several, large
 * predators cannot be killed at all (request §10 "Damage model").
 */
export const DAMAGE_MODEL: Record<CreatureSizeClass, { killShots: number }> = {
  small: { killShots: 1 },
  medium: { killShots: 5 },
  large: { killShots: Infinity },
};

/** The outcome of one harpoon hit (request §10). */
export type HarpoonOutcome = 'kill' | 'hit' | 'deter';

export interface HarpoonHitResult {
  outcome: HarpoonOutcome;
  /** Total harpoon hits taken, including this one. */
  hits: number;
}

/**
 * Resolve one harpoon hit against a creature of `sizeClass` that has already
 * taken `priorHits` (request §10): a small creature dies on the first hit, a
 * medium one on the last of the table, and a large one never — its hit
 * resolves as a deter instead. Pure and deterministic.
 */
export function resolveHarpoonHit(sizeClass: CreatureSizeClass, priorHits: number): HarpoonHitResult {
  if (sizeClass === 'large') return { outcome: 'deter', hits: priorHits + 1 };
  const hits = priorHits + 1;
  return hits >= DAMAGE_MODEL[sizeClass].killShots ? { outcome: 'kill', hits } : { outcome: 'hit', hits };
}
