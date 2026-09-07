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

/**
 * Concise radio lines the encounter-trigger `showRadio` action reveals as the
 * player descends (request §22, §36) — practical, sparse, spoiler-safe.
 */
export const TRIGGER_RADIO_LINES: Readonly<Record<string, string>> = {
  'radio-descent-1': 'Signal: descent confirmed. The lower array stopped replying past 3,000 m.',
  'radio-abyssal-1': 'Static. Then a pattern. Something down there is transmitting on our band.',
  'radio-deep-1': 'Contract addendum: do not surface the compact object intact. — Coastline Salvage',
  'radio-hadal-1': 'You are below the last logged depth. No one has come back from here.',
};
