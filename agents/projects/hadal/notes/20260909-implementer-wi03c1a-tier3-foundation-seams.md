---
tags: [creatures, combat, damage-model, harpoon, deter, tier-3]
symbols: [DAMAGE_MODEL, resolveHarpoonHit, HARPOON_RANGE, DETER_HOLD_SECONDS, fireHarpoon, sizeClass, SignatureRule, RosterMinimum, deterredUntil, harpoonHits, TIER3_CREATURES, TIER3_IDS, TIER3_BANDS]
---

# Tier-3 foundation seams (WI-03c1a)

Where the section 10 damage model and the tier-3 roster data live, for the
WI-03c1b controller work.

- `src/creatures/combat.ts` — `DAMAGE_MODEL` (small 1 / medium 5 / large
  Infinity `killShots`), `resolveHarpoonHit(sizeClass, priorHits)` (pure),
  `HARPOON_RANGE` (600 u), `DETER_HOLD_SECONDS` (20).
- `src/sim/Simulation.ts` — `fireHarpoon()` resolves the player's lance:
  nearest active creature within range, kill → §20 ambient-pool removal,
  deter → `deterredUntil = t + 20` + `return` state if mid-hunt. Tool rising
  edge is captured before `emitPlayerSignals` (shares the edge with the tool
  noise); `setToolIndex` now runs before `stepCreatures`.
- `src/creatures/CreatureDef.ts` — new def fields: `sizeClass` (required),
  `rules?: SignatureRule[]`, `minimums?: RosterMinimum[]`. The vocabulary has
  11 rules (9 from request §10 + roster's `cornered-charge`, `herds-prey`).
- `src/creatures/Creature.ts` — `harpoonHits` (hidden counter, no HP),
  `deterredUntil`; `genericReact()` early-returns while the deter is in
  force. **A bespoke `behavior.controller` bypasses `genericReact` — read
  `deterredUntil` yourself if your controller hunts.**
- `src/content/secret/hiddenCreatures.ts` — T-14…T-18 defs + `TIER3_*`
  exports; no production spawns yet (WI-03c2). Band data in `TIER3_BANDS`.
- `src/sim/tier3Scenario.test.ts` — `greyboxWorld()` helper: author spawns on
  the greybox first chunk without touching world data. Use it for
  per-predator signature scenarios.
- Spoiler sweep lives in the same test file (reads
  `design_private/_spoiler_tokens.txt`, scans `src/` + task artifacts, T-ids
  excluded). Keep comments in `hiddenCreatures.ts` free of roster name
  tokens — the sweep caught one real leak during implementation.
- Headless damage-model scenarios: select the harpoon with
  `input.toolSelect = 2`, fire with `input.useTool` on the next step;
  creatures at known offsets in chunk 0, player starts at (1300, 1400).
