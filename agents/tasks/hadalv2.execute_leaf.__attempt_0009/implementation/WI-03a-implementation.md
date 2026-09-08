# Implementation — WI-03a (tier-1 ambient/schooling fauna)

Result: done — the six tier-1 organisms from the private roster are live as
`CreatureDef` data on the ST-02 framework, spawned in the production world
data, each with a headless signature-rule test; browser spot-check passed.

## Files touched (product)

| File | Change |
|---|---|
| `src/content/secret/hiddenCreatures.ts` (new, 151 lines) | Six tier-1 `CreatureDef`s (T-01, T-02, T-03, T-05, T-06, T-13) plus the one bespoke controller the rubric demands (T-13 noise-flee, ~40 lines). Exports `HIDDEN_CREATURES`, `TIER1_IDS`, `TIER1_BANDS`. |
| `src/world/worldData.ts` | `creatureSpawns` in the shelf, twilight, abyss, and hadal chunks — 39 tier-1 spawn placements, each inside the band the private roster designed the organism for. |
| `src/sim/tier1Scenario.test.ts` (new, 261 lines) | 12 headless tests through the scenario harness: per-species signature rule, school parting/reform around the moving player, §34 per-chunk ambient cap + offscreen deactivation/reactivation, and the tier-1 portion of the world-data check (ids resolve to defs; every spawn in the designed band). |
| `src/creatures/Creature.ts` | Added `fleeFrom(from)` (bespoke-controller support the rubric answer needed) and made `strongestPos(type)` public (was private with a wrapper; the wrapper was removed). |
| `src/creatures/CreatureDef.ts` | Added `density?: number` to `EcologyDef` (T-01's dense-medium signature). |
| `src/creatures/ecology.ts` | `PART_RADIUS` exported (tests assert parting distance against the real constant). |
| `src/creatures/fixtures.ts` | Registry now includes `HIDDEN_CREATURES` (5 fixture creatures + 6 hidden = 11). |
| `src/sim/Simulation.ts` | Dense-medium drag applied to `density`-tagged creatures (the §48 school medium). |
| `src/sim/creatureScenario.test.ts` | Registry/fixture counts updated for the six new defs (11 / 5). |

## Signature rules shipped (per WI-01b rubric answer)

- T-01: school parts around the player and reforms; dense medium (slow, drag-heavy).
- T-02: filter-feeder; descends with the current; 3-circle chain body.
- T-03: loose wide-radius school; parts around the player.
- T-05: filter-feeder; hangs from the overhang, sways in the vent current, holds its place.
- T-06: filter-feeder; drifts with the current.
- T-13: noise-flee via the bespoke controller (sees player tool-noise signals within 2000u, flees the source).

## Acceptance Evidence Table

| Criterion | Evidence | Status |
|---|---|---|
| AC-roster-count (tier-1 portion) | World-data test in `tier1Scenario.test.ts`: every TIER1 id resolves to a def; all 39 placements sit in `TIER1_BANDS[id]`; per-chunk tier-1 count within the §34 cap (16). Whole-roster ≥15 count is WI-03d's. | passed (headless) |
| AC-roster-tests | 12 tests in `tier1Scenario.test.ts` — one signature test per species plus school parting, ambient cap, offscreen throttle, world data. Spoiler scan (tokens from `design_private/_spoiler_tokens.txt`, minus the sanctioned T-IDs) finds no creature name or secret outside `design_private/` and `src/content/secret/`. | passed (headless) |
| Browser spot-check (§70 presentation) | Scratch probe `scratch/implementation/browser-spot/spot.mjs` (Playwright, real `npm run dev`, headless Chromium): canvas booted, teleported to the t01-shelf spawn (readout x 7008.8 / depth 3501.7), scene alive between two captures (1,111,028 differing PNG bytes), zero page exceptions, zero console errors. Screenshot `after-teleport.png` visually shows small polygon creature bodies with fins near the player's beam. | passed (live) |

Live verification: **passed** (browser spot-check above; full suite 190/190; `npx tsc --noEmit` exit 0; `npm run build` success).

## Deviations from plan

- T-13 needed a bespoke controller (rubric answer: flee on player noise).
  Implemented as a ~40-line controller registered on the def, plus `fleeFrom`
  on `Creature` and a public `strongestPos` — small extensions of the ST-02
  framework, not a parallel system.
- T-01's dense medium is a small `density` parameter + drag term in
  `Simulation.stepCreatures` (the §48 behavior), not a new simulation system.
- Assumption from the WI ("ST-02 school behavior is reusable as-is") held: no
  framework changes to `flockForce`; only the two small extensions above.

## Shrink/Flatten report

- Removed the `strongestSignalPos` wrapper in favor of making `strongestPos`
  public (one method, not two, for one job).
- Inlined the `DENSE_MEDIUM_DAMPING` constant (single use site) into the
  drag computation.
- Nothing else removable: every remaining change maps to a rubric behavior or
  a test requirement.

## Knowledge notes

- Consulted: `agents/projects/hadal/notes/20260907-implementer-wi01b-creature-roster.md`
  (selected ids, rubric answers, spoiler-token scan),
  `agents/projects/hadal/notes/20260906-implementer-wi03-browser-fixes.md`
  (Chromium resolution + debug-panel classes for the spot-check probe).
- Written: `agents/projects/hadal/notes/20260907-implementer-wi03a-tier1-fauna.md`

## Scratch probes

- `scratch/implementation/probe2..5.txt`, `t01-probe.txt`, `t13-probe.txt` —
  early headless scenario-shaping runs (superseded by the committed suite).
- `scratch/implementation/browser-spot/` — the browser spot-check probe and
  captures (committed as execution evidence).
