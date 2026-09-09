# WI-03d1 implementation — tier-4 CreatureDefs + simulation-side scale rules

Role: `item-implementer` · Status: **done** (evidence-based; see table)

## What was built

Five tier-4 organisms (T-19, T-20, T-22, T-23, T-25) as `CreatureDef` data in
`src/content/secret/hiddenCreatures.ts`, each with a small per-species
controller, plus the simulation-side half of the section 52 techniques in
`src/sim/Simulation.ts` (`applyTier4Interactions`, one rule per organism):

- **T-19** plume organism — close player closes the plume (flee) and it
  drifts off; stands away and it returns home and unfurls. §10
  dangerous-looking-but-safe, headless.
- **T-20** fixed-point pulse organ — deterministic pulse period stamps a
  `custom` audio step and a tagged bus signal (audible from far beyond the
  sight range); a player inside the ride radius is carried away by the
  pulsing current (§64 position drift).
- **T-22** living landmark — still except for bounded creaking steps
  (position shift + audio step on a period); the scale misread holds because
  the drift is a small fraction of the body.
- **T-23** crossing presence — holds at the lane start until a diver is near,
  then runs its lane. Inside the announcement window it emits the
  environment-reaction signals (flee + quiet tags) and NOTHING of its own;
  its heartbeat audio starts only inside the clean-view range. Technique D
  (fauna-first) + no-clean-view + technique F (data: maxSpeed 120 against a
  ~6840-unit body span).
- **T-25** headless plate cluster — rides the local current via the shared
  filter-feeder orientation; reconfigures on a clinking cycle.

Supporting seams added minimally:

- `CreatureDef.nonTargetable` (§10): the harpoon never selects it and
  predators never kill it — enforced in `Simulation.fireHarpoon` target
  selection and `emitPredatorSignals` prey selection. No HP bar, no kill
  path.
- `Creature.steer` flee-hold exemption: a non-targetable presence is not
  suppressed by its OWN announcement tag (T-23 announces with the predator
  tag; without the exemption it stood down inside its own announcement).
- `bodyExtent(def)` in `CreatureDef.ts` — pure read of a def's collision
  span; used by sonar registration and the visibility rule.
- Sonar-scale signal (technique E): non-targetable presences register as
  `SonarObject`s with `size = bodyExtent / SONAR_MASSIVE_REF` (constructor
  reorder: creatures built before the sonar system). A huge body returns a
  far larger echo; `FULL_BODY_VIEW_RANGE` (1200) is the sim's visibility
  constant the renderer will read.
- `Simulation.hasCleanFullBody(c)` — pure geometry, no allocation: true only
  when the ENTIRE body (root + chain circles) is within `FULL_BODY_VIEW_RANGE`.

## Acceptance evidence table

| Criterion | Evidence | Status |
|---|---|---|
| AC-roster-large: ≥3 large-scale creatures/events | 5 defs, all `sizeClass: 'large'`, all body extent ≥ 800 (roster test in `tier4Scenario.test.ts`) | passed |
| AC-roster-large: ≥1 colossal communicated FIRST through fauna | T-23 scenario: `tReact` (local drifters flee west) recorded at t≈39.2s, `tVisual` (direct sight) at t≈40.2s, heartbeat strictly later — `tReact < tVisual` asserted in the headless trace | passed |
| AC-roster-large: ≥1 encounter with no clean full-body view | T-23 scenario: `hasCleanFullBody(t23)` polled every frame of the encounter; `cleanViewAt < 0` asserted (body span ~6840 vs 1200 view range — the body can never fully fit) | passed |
| AC-roster-tests: signature-rule headless test per organism | One scenario per organism in `src/sim/tier4Scenario.test.ts` (17 tests): T-19 standoff/withdrawal, T-20 pulse-heard-beyond-sight + sonar echo at impossible scale + ride, T-22 creaking-step drift, T-23 fauna-first + no-clean-view + speed mismatch, T-25 drift + reconfigure | passed |
| AC-roster-tests: spoiler containment (this item's artifacts) | Spoiler test in `tier4Scenario.test.ts` scans `src/` product dirs + this task's `implementation/` against `design_private/_spoiler_tokens.txt`; T-IDs excluded per §68 | passed |
| Non-combat-target (§10): no HP bar, no kill path | 3 non-targetable tests: harpoon picks the small fauna in the same shot and never the presence; harpoon at a lone presence lances nothing; an armed T-14 hunt kills ordinary fauna (kill path live) but never the presence, while the predator does enter hunting states | passed |

Live verification: **not applicable** — headless simulation work item; the
scenario harness runs the production `Simulation` + production world data in
Node (the real hard dependency for this item). No user-visible surface.

## Commands run (all from `C:\Temp\hadal-v2`)

- `npx tsc --noEmit` → exit 0
- `npx vitest run src/sim/tier4Scenario.test.ts` → 17/17 passed
- `npx vitest run` (full suite) → 31 files, 253/253 passed

## Files touched

- `src/content/secret/hiddenCreatures.ts` — T19/T20/T22/T23/T25 defs +
  controllers, `TIER4_LIST` / `TIER4_CREATURES` / `TIER4_IDS` /
  `TIER4_BANDS`, `HIDDEN_CREATURES` now includes tier 4.
- `src/sim/Simulation.ts` — tier-4 constants, `applyTier4Interactions` + five
  per-organism rules, `hasCleanFullBody`, `tier4` working-state map, sonar
  registration of non-targetable presences, non-targetable guards in
  `fireHarpoon` / `emitPredatorSignals`, L1/L2 contract note.
- `src/creatures/CreatureDef.ts` — `nonTargetable` field, six tier-4
  `RosterMinimum` values, `bodyExtent()`.
- `src/creatures/Creature.ts` — flee-hold exemption for non-targetable
  presences.
- `src/game/constants.ts` — `FULL_BODY_VIEW_RANGE`, `SONAR_MASSIVE_REF`.
- `src/sim/tier4Scenario.test.ts` — new: 17 headless scenarios.
- `src/sim/creatureScenario.test.ts` — registry count 22 → 27 (revised
  comment added; the shared registry grew by the five tier-4 defs).
- `src/sim/tier1Scenario.test.ts` — distinct-bodies count 17 → 22 (the loop
  now also fingerprints the tier-4 bodies — desired).
- `src/sim/scenarios.test.ts` — explicit `15000` timeout on the
  macro-traversal test (see Deviations).

## Deviations from plan

1. **Pre-existing borderline timeout (not caused by this item).**
   `scenarios.test.ts` "traverses the macro world end to end" timed out at
   the default 5000ms on this machine. Verified by `git stash` of all
   WI-03d1 changes: the clean base commit times out identically (5505ms).
   The sibling "blocked route" test in the same file had the same problem
   and was already fixed by WI-03c1a with an explicit `15000` timeout and a
   documented comment. Applied the same documented remedy (no logic change)
   so the shared suite is green.
2. **Roster count assertions updated** (creatureScenario 22→27,
   tier1Scenario 17→22): direct consequence of adding five defs to the
   shared registry; the tier-1 distinct-bodies loop now also covers the
   tier-4 bodies, which is a strengthening, not a weakening.
3. **T-19 disturbance radius (440) sits outside the organism's own collision
   standoff** (~390 on the test's approach path): a 260-radius trigger could
   never fire because the body blocks the player first. The return radius
   (620) matches; the test measures "close" against the trigger radius.
4. **T-23 fauna-announcement radius set to 2400** (twice the 1200 sight
   range) — the designed reaction window; the headless trace shows the
   local drifters react ~1.0s before first sight (deterministic, seed 441).
   The fauna reaction is measured as displacement (the drifters stay in
   `forage` state while the ecology pass steers them away — the observable
   state change is the flee motion).

## Assumptions

- The section 52 sim-side rules fit the existing ST-02 framework (assumption
  from the spec): confirmed — no new framework machinery, only per-organism
  rules beside the existing tier-2/3 pattern.
- T-20 carries no §11.1 minimum per the private roster (fixed-point set
  piece); `minimums` stays absent and the roster test asserts that.
- The drifters' reaction is displacement-driven (state stays `forage`): the
  ecology flee steering moves them; a `flee` STATE transition is not
  guaranteed at the signal strengths designed, so the scenario asserts the
  motion.

## Shrink/Flatten report

- Removed `emitTier4Call` (a second audio-event mechanism added for T-20):
  T-22/T-23/T-25 already use the established `setState('custom')` →
  `lastTransition` drain, and the controllers' direct `creature.state =`
  assignment never clobbers it, so T-20 was consolidated onto the same
  pattern. One mechanism, not two.
- Removed the temporary `src/sim/t23probe.test.ts` and the "debug
  (temporary)" console probe block from the test file before commit.
- Nothing else was removable: each constant has one user, `bodyExtent` has
  two real users (sonar + visibility), the `tier4` working-state map mirrors
  the pre-existing `tier3Driven` pattern, and no pass-through or defensive
  branch was added.

## Knowledge notes

- Consulted: the tier-2/tier-3 interaction pattern in `Simulation.ts`,
  `Creature.setState`/`lastTransition` audio mechanics, the
  `design_private/` roster for organism ids and minimums.
- Written: `agents/projects/hadal/notes/tier4-sim-rules.md` (the
  `setState('custom')` audio timing rule, the non-targetable flee-hold
  exemption, and the collision-standoff vs trigger-radius gotcha).
