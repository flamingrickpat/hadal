# Tier-1 fauna implementation facts (WI-03a)

## Summary

The six ambient/schooling tier-1 creatures live as data, not code: one
`CreatureDef` each in `src/content/secret/hiddenCreatures.ts` (exports
`HIDDEN_CREATURES`, `TIER1_IDS`, `TIER1_BANDS`), spawned from
`creatureSpawns` in `src/world/worldData.ts` (shelf/twilight/abyss/hadal
chunks; the per-chunk tier-1 cap is 16 per §34). Headless tests:
`src/sim/tier1Scenario.test.ts`.

## Key symbols and seams

- `CreatureDef.ecology.density` (new in WI-03a) tags dense-medium
  organisms (T-01). `Simulation.stepCreatures` applies the §48 drag only
  to density-tagged creatures.
- Bespoke controllers register on the def's `controller` slot. T-13 (noise
  flee) is the only one so far; it uses `Creature.fleeFrom(from)` (new) and
  `Creature.strongestPos('noise')` (made public — do not re-add the removed
  `strongestSignalPos` wrapper).
- `ecology.ts` exports `PART_RADIUS` (300) — the school parting distance.
  Tests assert against it; move the constant only with the tests.
- `steer()` early-returns for `filterFeeder` creatures — their motion is
  owned by `applyEcology` (T-02/T-05/T-06 ride currents that way).

## Gotchas

- Player tool-noise signals decay over the 3 s lifetime; a flee test needs
  the creature within the sense range (T-13 `senses.noise.range` is 2000,
  wider than `SIGNAL_RANGE_REF` 1500) and close enough that the perceived
  strength stays above the threshold for a visible displacement.
- The greybox 'wall' chunk has a pillar at x 2370..2434, y 0..-1000:
  scenario fixtures placed east of it at y ≈ -800 will not cross it.
- Browser probes: after `teleportTo`, the player is adrift (no input) and
  the band currents move it ~50u/s — assert position with a wide tolerance,
  and compare screenshots by PNG byte divergence, not pixel size (PNG
  streams differ in length between two different frames).
