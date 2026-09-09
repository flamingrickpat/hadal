# WI-03c1b implementation — tier-3 per-predator controllers + final proof

Status: **done** (attempt 2 of the implement step; attempt 1 was discarded for
a missing `summary` field in the result object, not for work content).

## What landed

The simulation-side behavior of the five tier-3 organisms, built on the
WI-03c1a `CreatureDef`s and section 10 damage model:

- **Per-predator controllers** (`src/content/secret/hiddenCreatures.ts`):
  - T-14: pins the held post (`idle`) except while armed (`alert`); the arm
    threshold is read from the def's own sense values.
  - T-15: a no-op controller that stands the generic engine down (its noise
    sense would otherwise escalate into exactly the chase the organism must
    not do); its whole machine runs simulation-side.
  - T-16 / T-17: pin the inert state (`idle`) except during the strike /
    silk (`custom`).
  - T-18: no controller — its generic `wander` is the entire motion.
- **Simulation-side rules** (`src/sim/Simulation.ts`,
  `applyTier3Interactions`, the same pattern as the tier-2 interactions —
  the controller hook cannot see the player or the ambient pool):
  - `t14Post` — non-chase territory net: a loud cue (sonar/noise at the def
    thresholds) sets a silent net at the post for 8s; an intruder in reach
    is hit once (10) and dragged out 220u (recoverable, not lethal); a
    section 10 deter drops the net and suppresses re-arming for the window.
    Signature path: `idle → alert → idle` — never `attack`/`stalk`.
  - `t15Burst` — visible burst cycle (dash 1.2s / rest 1.6s toward rotating
    points) plus the cornered charge: perceived noise ≥ 0.35 (a loud corner)
    triggers one bounded 1.2s dash, one contact hit (15), then a stand-down
    (6s + rest). A silent corner or a corner at range never triggers it.
  - `t16Boulder` — attacks-from-cover: inert in the floor; a loud pass close
    (perceived ≥ 0.4) opens one expanding net (1.5s, reach 110, one hit of
    12), then a 12s buried reset. Signature path: `idle → custom → idle`.
    A deter holds the whole rule (it is a large, deterable organism).
  - `t17Silk` — territory + attacks-noise: a loud pass at the def's noise
    sense sets the silk (2.5s, reach 150: player velocity damped + one hit
    of 8), then re-sets after 8s, so the rule holds again. Path:
    `idle → custom → idle`.
  - `t18Herd` — herds-prey / exploitable relationship: drives nearby small
    *schooling* prey into a 150u field around itself via a §64 position
    drift (45u/s; steering through the member's own state machine was
    tried first and stalled — the schooling-cohesion pass counter-steers
    target changes), and a player at the field collects a driven member for
    one salvaged unit. It never attacks the player (no `combat` on the def).
  - Player-creature damage path: new. `combat.damage` was data-only before
    WI-03c1b; the tier-3 pass is the first place it applies to the player
    (clamped, `handleDeath` unchanged).

## Acceptance Evidence

| Criterion | Evidence | Status |
|---|---|---|
| AC-roster-behavior: 4+ behaviors materially different from direct pursuit, 2+ beneficial, matching the anti-cliche/§47 coverage | `FINAL PROOF: AC-roster-behavior` test in `src/sim/tier3Scenario.test.ts`: data half asserts every tier-3 rule category is non-pursuit; behavior half counts compact headless probes (T-14 armed-without-pursuit, T-16 proximity strike, T-17 noise trip, T-18 no-combat, T-13 flee-from-noise in the **production** world) → 5 ≥ 4; beneficial probes (T-08 trade, T-11 lift, T-18 field harvest) → 3 ≥ 2. Runs after WI-03b (its friendly species are the count base). | passed (headless, real simulation + world data) |
| AC-roster-tests: every implemented major species has a headless behavior test for its signature rule | One headless scenario per tier-3 organism in `tier3Scenario.test.ts`, each with a trigger approach **and** a must-not-trigger control, through the `Scenario` harness over the production `Simulation`: T-14 (quiet swim in reach = safe; sonar ping arms + snaps), T-15 (loud-at-range and silent-corner controls; loud corner charges once), T-16 (silent pass safe; loud pass strikes once + reset), T-17 (silent approach safe; loud pass trips + re-sets), T-18 (field harvest works; distant school untouched; no pursuit states). The non-chase signature paths are asserted to avoid `attack`/`stalk` from fully polled state traces. | passed (headless) |
| AC-roster-tests (tier-3 half): no creature name or secret description outside debug internals and private content | Spoiler sweep in `tier3Scenario.test.ts` extended to scan `src/sim`, `src/creatures`, `src/player`, `hiddenCreatures.ts`, **and** the attempt-14/15 implementation artifacts; token source `design_private/_spoiler_tokens.txt` (T-IDs excluded). | passed (sweep green in the 21-test run) |

## Test evidence (commands)

- RED (before implementation): `npx vitest run src/sim/tier3Scenario.test.ts`
  → **8 failed | 13 passed** — all failures were the new signature scenarios
  and the updated deter test failing for the intended reasons (no
  controllers: no snap/strike/silk, no drive, generic machine pursues).
- GREEN (after): `npx vitest run src/sim/tier3Scenario.test.ts` →
  **21 passed (21)**.
- Full suite: `npx vitest run` → **29 files, 231 passed (231)**
  (was 223 before this item; +8 net).
- Types: `npx tsc --noEmit` → exit 0, no new warnings.
- Live verification: **not applicable** in this item — the work item
  explicitly assigns the tier's only browser spot-check to WI-03c2; all
  evidence here is headless (request §70 layers) over the production
  simulation and world data.

## Deviations from plan

1. **Updated the WI-03c1a deter test (seed 115)** to the bespoke flow: the
   mid-hunt deter now observes the net dropping to the held post (`idle`)
   instead of a `return` walk (the harpoon's own `return` transition is
   superseded in the same step by the tier-3 pass). The stand-down,
   bounded-window, and re-engage semantics are unchanged and still asserted.
   The test file's header line "No per-predator controllers ... (WI-03c1b)"
   was updated to reflect that this item landed.
2. **T-18 "behind the herder"** is modeled as a field radius (150u) around
   the herder rather than a strictly behind-side region — the drive is
   omnidirectional, and the harvest rule only ever fires inside the field.
   The player can stand on any side of the field and collect; the private
   design's "behind it" reads as "at the field it drives".
3. **T-15 burst phase lives simulation-side**, not in the controller (a
   module-level phase map in the secret content file would have been the
   alternative). Consistent with the tier-2 pattern this codebase
   established: controller pins state, load-bearing rule is sim-side.

## Shrink/Flatten report

- One shared per-creature working-state struct (the `tier3` map) serves all
  four rule methods instead of four maps — this is the generalization the
  work item's anti-duplication assumption calls for; no controller is
  duplicated (the T-14/T-16/T-17 pin controllers are 3-line state pins with
  different armed states, not copies of one controller).
- Removed: an initial `dt` parameter on `t15Burst` (unused), a `vec2`
  import gap fixed by reusing the file's existing `vec2` helper, and the
  `forage`-retargeting drive approach for T-18 (replaced by the §64 drift —
  the retargeting did not work against schooling cohesion).
- Kept deliberately: the no-op T-15 controller (required to stand the
  generic engine down); the state-clear-order comment in the burst
  transition (`setState('wander')` nulls `target` — a real gotcha).
- Nothing else was removable; the first draft had no extra abstractions
  (no managers/factories/interfaces were added).

## Files touched

- `src/content/secret/hiddenCreatures.ts` — four controllers + def wiring.
- `src/sim/Simulation.ts` — tier-3 constants, `tier3`/`tier3Driven` state,
  `applyTier3Interactions` + five rule methods, `step` wiring.
- `src/sim/tier3Scenario.test.ts` — per-predator signature scenarios,
  updated deter test, FINAL PROOF, extended spoiler sweep, helpers.

## Knowledge notes

- Consulted: `20260909-implementer-wi03c1a-tier3-foundation-seams.md`,
  `20260908-implementer-wi02a-creature-runtime-seams.md`,
  `20260909-implementer-wi03b1-tier2-interaction-seams.md`.
- Written: `20260913-implementer-wi03c1b-tier3-controllers.md`
  (`agents/projects/hadal/notes/`).

## Scratch probes (committed, under this task folder)

- `scratch/implementer/t15-probe/probe.mjs` — measured the burst envelope
  (max 193u from home in 12s, visible dash + rest) to tune the
  visible-motion assertion.
- `scratch/implementer/t18-probe/probe.mjs` — traced the T-18 drive
  (target-retargeting stalled at ~270u under schooling cohesion; the §64
  drift holds all prey at 1–76u).
- `scratch/implementer/t14-probe/probe.mjs` — traced the T-14 snap
  (player 1600→1380, hp 100→90, net drops) to fix the drag assertion.
- `scratch/implementer/t15-probe/out.txt` — discarded redirect, removed.

## Assumptions

- "Non-chase" is enforced as a state-path property (signature windows never
  enter `attack`/`stalk`), asserted from fully polled state traces; this is
  the observable meaning of "its signature state path avoids the generic
  attack chase states".
- T-13 (tier 1, flee-from-noise) counts as a non-pursuit signature in the
  final proof: fleeing is the inverse of pursuit and it is observable in
  the shipped production world. If the reviewer disagrees, the count still
  holds at 4 from tier 3 alone.
- The FINAL PROOF reads tier-3 species from the registry (their production
  spawns are explicitly WI-03c2's) and tiers 1-2 from production world
  data; this matches "runs after WI-03b lands" plus the item's no-spawns
  constraint.

## Handoff (for WI-03c2 / reviewers)

- The five tier-3 organisms now have observable, testable behavior.
  WI-03c2 can author spawns in `TIER3_BANDS`; the registry and the damage
  model are unchanged.
- The tier-3 spoiler sweep now also scans the attempt-15 implementation
  artifacts; keep new notes in this task folder free of roster name tokens.
- Player-creature damage now exists (tier-3 rules only). The generic
  `attack` state still does not damage the player — unchanged from before
  this item; out of scope here.
