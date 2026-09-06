/**
 * holds — the concise radio/contract and world lines shown on base return
 *   (request §5, §22, §38).
 *
 * archetype: information-holder
 * owns: `BASE_RETURN_LINES` — short, practical, increasingly uneasy lines
 *   revealed in order as the player returns to the surface base.
 * not own: the deep lore (kept out of player-facing docs and progress
 *   reports, request §0, §68) — only early, generic contract/log lines.
 * invariant: each line is short (max ~100 words) and spoiler-safe.
 * fails when: none — authored data.
 */
export const BASE_RETURN_LINES: readonly string[] = [
  'Contract: the array has been dark for nine months. Descend when ready. — Coastline Salvage',
  'Dive log: hull breaches on the lower tiers. The crew went quiet at 4,200 m.',
  'Contract: salvage priority is the compact object. Leave the rest. — Coastline Salvage',
];
