# Review: WI-02c — Schools and cross-species reactions

Status: pass

Reviewed implementation: commit `922f267` (product diff `c209bd0..922f267 -- src/`:
`src/creatures/ecology.ts` (new, 231 lines), `src/creatures/ecology.test.ts` (new,
115), `src/creatures/Creature.ts`, `src/creatures/CreatureDef.ts`,
`src/creatures/fixtures.ts`, `src/sim/Simulation.ts`,
`src/sim/ecologyScenario.test.ts` (new, 219), `src/sim/creatureScenario.test.ts`).
Commit `ebaec27..922f267 -- src/` is empty — the final commit touches only
artifacts (removed some implementer scratch dirs and screenshots), so the
product under review is exactly the `c209bd0..ebaec27` diff. `state.md` is
untouched in every reviewed commit.

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| AC-cf-ecology: school behavior and cross-species reactions run headlessly through the world-signal bus, verified by a node scenario | passed | `src/sim/ecologyScenario.test.ts` advances the production `Simulation` via the existing `Scenario` harness (no second rig). One seeded run (seed 42) asserts flee (school mean moves away from predator), kill (forager removed 7→6), scavenge (scavenger with `senses: {}` walks to KILL site, cos>0.8, keeps closing), quiet (predator held ~drift<50u over 2.5s then resumes >60u), and current-orientation (feeder cos>0.8 to the (1,1) drift). Re-ran: full `npx vitest run` — 25 files / 178 tests all green; `npx tsc --noEmit` clean. |
| Verification line: node scenario shows predator signal parts schools, scavengers approach a kill, zone quiets before a scheduled large event; browser check confirms schools visible | passed | Scenario asserts all three headlessly. Browser check `scratch/implementer/ecology-browser/school-visibility-check.mjs` re-run by this review: PASS — school visible and flocked (dSpan grows), parts on the predator signal (dBefore=23.3u → dAfter=166.6u, predState=stalk). Screenshot evidence (`school-visible.png` / `school-parted.png`) was deleted in commit `922f267`; the reproducible script remains and its output was re-observed live by this review. |
| Deliverable: schooling (aligned/flocking, part around player §48, bounded local perception) | passed | `flockForce` in `src/creatures/ecology.ts` — separation/cohesion/alignment within `FLOCK_RADIUS` 220, parting from the player position within `PART_RADIUS` 300. Unit-tested (`ecology.test.ts` "flock force … bounded-local"). |
| Deliverable: §20 reaction rules (flee, scavenge, orient to currents §64, quiet before major events, predators attack ambient prey) | passed | All five present and demonstrated in the one scenario run. "Hide before a colossal event" is delivered as the `quiet` hold (suppresses steering incl. mid-stalk, `Creature.ts:249-259`); colossal scheduling itself is a roster/set-piece concern (ST-03/ST-04) per the work item's own non-goals. |
| Deliverable: every reaction keyed to a `WorldSignal` type or existing sim event; ST-03 opts in via `CreatureDef.ecology` | passed | No new signal types: all reactions read tagged `noise` on the existing `WorldSignalBus` (`PREDATOR_TAG`/`KILL_TAG`/`QUIET_TAG` constants in `ecology.ts`). `CreatureDef.ts` gained optional `scavenge`, `quiet`, `filterFeeder` fields — additive opt-in, no other fixture affected (fixture-count assertion in `creatureScenario.test.ts` updated 2→5 deliberately). |
| Deliverable: seeded, deterministic per §61; critical behavior not randomized | passed | Scenario is seed-42 and re-runs byte-identical (verified by this review's determinism probe). Flee/scavenge/quiet/kill/attack are pure functions of bus signals and positions — no rng on critical paths; only idle wander uses the seeded rng. |
| Test: one scenario with ≥3 distinct cross-species reactions, state assertions, standard failure trace | passed | The single scenario covers five reactions with state assertions and `sc.trace` lines on each; `Scenario.assert` produces the standard failure trace. |
| Test: unit tests for the reaction predicates (distance/strength thresholds) | passed | `src/creatures/ecology.test.ts` — near/far thresholds for flee, scavenge, quiet; tag specificity (non-predator tag → 0); bounded-local flock force. All re-run green. |
| Test: performance — reaction cost within throttling budget, capped counts at simulation speed | passed | `ecologyScenario.test.ts` "capped ambient counts …" — 1000 steps (16.7 s of sim) of 7 capped creatures in one run, asserts <2000 ms (i.e. running far ahead of real time). Re-run green. The ecology pass is bounded-radius `bus.queryNear` + one local school scan, with caller-reused scratch arrays (allocation-free hot path). |

## Findings

No blocking findings. Two non-blocking observations (not AC violations):

1. **Stale renderer visuals for killed creatures** — `src/render/creatureRender.ts:173-197`.
   `CreatureRenderer.update` keys its `visuals: Map<Creature, VisualRec>` off the
   live `sim.creatures` list and never removes an entry when a creature is
   spliced out. WI-02c introduces the first in-sim creature removal
   (`Simulation.ts:400-401`, the predator kill), so a killed ambient creature
   leaves a frozen visual in the scene at its death position for the rest of
   the session. This does not affect any WI-02c criterion (the kill is
   headlessly verified; the browser criterion is school visibility), and it
   only becomes visible in the browser with ST-03/ST-04 roster content — but
   whoever ships the roster should make `update` (or the sim removal) dispose
   the visual of a removed creature so a corpse does not render frozen.
2. **Single kill per sim step** — `src/sim/Simulation.ts:370-410`
   (`emitPredatorSignals`). Only one `killed` target is recorded per step; if
   two predators each reach a distinct prey in the same tick, only the last
   kill is applied. With the current single-predator fixture this cannot fire,
   and the work item explicitly leaves predator personalities/multi-predator
   behavior to ST-03 — noted so ST-03 does not inherit the assumption silently.

## Impact Check

Changed symbols checked via codegraph (`codegraph_explore` with
`projectPath=C:\Temp\hadal-v2`: "Creature steer applyEcology
emitPredatorSignals scheduleSignal schoolMembers CreatureRenderer", then a
targeted "CreatureRenderer class update visuals" query — the first structural
lookup of this review used the index as required):

- `Creature.steer` (private, called only from `Creature`'s own update path) —
  the four new ecology early-returns can only shorten steering, never extend
  it; non-ecology fixtures take none of the holds (gated on `def.ecology` /
  `combat === undefined`), so existing `Creature.test.ts` behavior is
  untouched (re-run green).
- `CreatureDef` — additive optional fields; the only reader of
  `def.ecology` outside `Creature.ts` is the new ecology pass and
  `Simulation.ts:222` (school registration), both new.
- `Simulation.creatures` — readers: `Game.renderVisuals` →
  `CreatureRenderer.update`, scenario tests, and the debug systems. The
  splice-on-kill affects only the renderer observation in Finding 1; all
  simulation-side consumers iterate the live list and are unaffected.
- `WorldSignalBus` / `senses.ts` — **unchanged** in this diff; the
  implementer's assumption that existing signal types suffice held (tagged
  `noise`), so `senses.ts` needed no extension and the
  "falsified if a reaction needs a global state read" condition did not
  trigger: every predicate in `ecology.ts` goes through
  `bus.queryNear(...)` with bounded radii.
- `scheduleSignal`/`drainScheduledSignals` — new private/public sim API, no
  pre-existing callers; used only by the scenario harness (scheduled quiet
  event) and available to ST-03 for authored events.

## Independent Adversarial Probes

Probes in `scratch/reviewer/ecology-adversarial.test.ts` (own vitest config;
drives the production `Simulation` via the same `Scenario` harness, seed 42,
9 s) — each designed to falsify the implementation's interpretation of a
specific claim, not to re-assert the implementer's own tests:

1. **Scavenge causality** — same world with and without the KILL_TAG signal
   on the bus: with it, the senses-less scavenger closes to <433u from the
   kill site; without it it stays >483u. Falsifies "the scavenger is just
   wandering/generic-investigating". Passed.
2. **Quiet causality** — predator max displacement with the quiet signal vs.
   free: held run <0.8× of the free run. Falsifies "the predator was simply
   out of range or finished stalking". Passed.
3. **Flee causality** — farthest schooler from the predator's live position:
   >1000u with the predator vs. <930u in the predator-free control (idle
   wander ceiling). Falsifies "the school drifted away on its own". Passed.
4. **Determinism** — same seed → identical final creature positions across
   two fresh runs; a different seed diverges. Falsifies "unseeded rng in the
   critical path" (and confirms seed 61's guarantee holds at the output
   level, not just by code inspection). Passed.

A temporary trajectory-printing probe (since deleted) was used to calibrate
the flee metric: the control school's idle wander reaches ~912u from the
phantom-at-spawn point, so the with/without thresholds above sit well inside
their bands, not on a knife edge.

## What I Could Not Verify

- **Screenshots from the implementer's original browser run** — both PNGs were
  deleted in commit `922f267` (artifact cleanup, with the reproducible
  `school-visibility-check.mjs` left in place). The live re-run of that script
  by this review is the standing evidence; the original captured frames are
  no longer openable.
- **Absolute wall-clock performance numbers** — the performance test asserts a
  relative budget (1000 steps < 2000 ms) on this machine; I did not
  independently benchmark on other hardware. The work item asks for
  "within the throttling budget" at capped counts, which the test measures.
- **ST-03 roster opt-in** — by the work item's own non-goals, roster species
  do not exist yet, so "roster species can opt in via `CreatureDef.ecology`"
  is verified structurally (additive fields, per-species tolerances, no new
  mechanics) rather than through a roster species.

## Assumptions

- **"Hide before a colossal event" is satisfied by the `quiet` hold.** The
  §20 hide/quiet distinction: the work item lists both "animals hide" and
  "zones quiet temporarily before major events"; the implementation delivers
  a single `quiet`-tag signal that holds any opt-in species' steering (incl.
  mid-stalk). I read "hide" as a per-species flavor ST-03 can add on the
  same signal without new mechanics (the tolerance field is per-species),
  which matches the work item's own constraint that ST-03 owns roster
  specifics. Rejected reading: a separate hide mechanism with shelter
  locations — that would be ecosystem simulation, which the work item's
  first constraint forbids. This choice would be wrong if a future
  acceptance check requires species-specific hide destinations.
- **Player-position parting is not "direct player references".** The goal
  says no direct player references, but §48 explicitly requires schools to
  part around the player; `flockForce(..., this.player.position, ...)`
  passes only a world position, not any player state, so it is the intended
  §48 behavior, not the forbidden omniscience. This choice would be wrong if
  §48's parting is meant to come via a player-emitted world signal instead —
  no part of the request says that.
