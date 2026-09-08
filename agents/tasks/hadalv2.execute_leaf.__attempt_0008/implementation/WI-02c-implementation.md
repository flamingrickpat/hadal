# WI-02c — Schools and cross-species reactions

**Result:** done — schools and cross-species reactions run headlessly through the
world-signal bus, verified by a node scenario (9 new tests), unit tests on the
reaction predicates, a performance check, and a browser check on the real game.

## Acceptance evidence

| Criterion | Evidence | Status |
|---|---|---|
| AC-cf-ecology — school behavior and cross-species reactions run headlessly through the world-signal bus, verified by a node scenario | `src/sim/ecologyScenario.test.ts` — "flee, kill, scavenge, quiet-hold and current-orientation in one seeded run": one seeded `Scenario` run of the production `Simulation` asserts five distinct bus-driven reactions (school parts from a PREDATOR_TAG, a KILL_TAG draw — the scavenger has no generic sense so only the scavenge reaction can move it, a QUIET_TAG holds the predator at the event site, a filter feeder orients along the authored §64 drift field, plus the predator's ambient kill). PASS. | passed |
| Schools: aligned/flocking movement, part around the player, bounded local perception | `src/creatures/ecology.ts` `flockForce` (separation/cohesion/alignment within FLOCK_RADIUS 220, player parting within PART_RADIUS 300); unit test "flock force: separation, cohesion and alignment are bounded-local"; the scenario asserts the school's centroid moves away from the hunting predator (flee) and the browser check asserts the visible school parts (below). | passed |
| Every reaction keyed to a `WorldSignal` type or existing sim event; ST-03 can opt in via `CreatureDef.ecology` without new mechanics | All reactions read the existing `WorldSignalBus` noise tag conventions `predator` / `kill` / `quiet` (`senses.ts` was NOT extended — the existing signal type sufficed, confirming the work-item assumption). `CreatureDef.ecology` extended with `scavenge?`, `quiet?` (number), `filterFeeder?` beside the existing `school`. Unit test "fixture defs opt in via ecology/combat only, no new mechanics". No global state read anywhere in `ecology.ts` — every predicate is a `bus.queryNear` within a fixed radius. | passed |
| Seeded/deterministic per §61 | Scenario is seeded (seed 42) and asserts exact distances; critical behavior (flee, scavenge approach, quiet hold, kill geometry) is deterministic — no randomness in the reaction path; only wander/idle retargeting uses the seeded rng. Scenario re-runs pass identically. | passed |
| Unit tests for the reaction predicates (distance/strength thresholds) | `src/creatures/ecology.test.ts` — 7 tests: flee perceived near-not-far, wrong tag never triggers flee, scavenge near-not-far, quiet near-not-far, flock force bounded-local, `strongestTaggedPos` strongest-source/radius/tag filtering, fixture opt-in. All PASS. | passed |
| Performance: reaction cost within throttling budget; capped ambient counts run at simulation speed | `ecologyScenario.test.ts` — "capped ambient counts run the reaction pass at simulation speed": a capped-count scenario completes each 0.5 s sim window comfortably inside the per-frame budget. PASS (94 ms for the full test incl. setup). | passed |
| Browser check confirms schools are visible | `scratch/implementer/ecology-browser/school-visibility-check.mjs` — boots the real `npm run dev` page (headless chromium, vite :54431), injects the `fixture-schooler` ×5 next to the player through the real sim, asserts every member has a renderer visual tracking the sim position exactly, live non-frozen velocities, bounded cohesion, then injects a stalking `fixture-predator` 300u away and asserts the school parts. PASS: mean member distance from the injection center 23.2 → 164.4u. Screenshots: `school-visible.png`, `school-parted.png`. | passed |

## Files touched

Production:
- `src/creatures/ecology.ts` — **new** (~230 lines): tag conventions, reaction
  predicates (`fleeSignalStrength`, `scavengeSignalStrength`, `quietStrength`),
  `strongestTaggedPos`, `flockForce`, thresholds. Pure, allocation-free
  (caller-reused scratch lists, §34).
- `src/creatures/Creature.ts` — `dead` flag; reaction holds in `steer()`
  (quiet-hold, flee-hold, scavenge-hold, filterFeeder-hold), applied before the
  generic state-machine steering so the bus-driven reactions own motion while
  active.
- `src/creatures/CreatureDef.ts` — `EcologyDef` extended: `scavenge?`, `quiet?`
  (per-species quiet tolerance), `filterFeeder?`.
- `src/creatures/fixtures.ts` — five neutral fixtures: SCHOOLER (school, noise
  sense), FORAGER (forages; the ambient prey), SCAVENGER (`senses: {}` — only
  the scavenge reaction can move it), PREDATOR (combat; hunting predators emit
  the PREDATOR_TAG), FEEDER (`senses: {}`, filterFeeder).
- `src/sim/Simulation.ts` — ecology wiring: `scheduleSignal` /
  `drainScheduledSignals` (event-driven bus signals), `emitPredatorSignals`
  (hunting predators broadcast PREDATOR_TAG noise), `applyEcology` (reaction
  pass: flee → scavenge → quiet → school → filterFeeder; predator attack of
  ambient prey within PREDATOR_ATTACK_RANGE makes the kill that feeds scavenge).

Tests:
- `src/creatures/ecology.test.ts` — new, 7 unit tests (predicates).
- `src/sim/ecologyScenario.test.ts` — new, scenario + performance tests.
- `src/sim/creatureScenario.test.ts` — removed the stale "exactly two
  fixtures" count assertion (the fixture pool now holds five).

## Verification commands and results

- `npx tsc --noEmit` → clean.
- `npx vitest run` → 25 files, 178 tests, all pass.
- `npm run build` → built successfully.
- Browser check (final run): `PASS school is visible, flocked, and parts
  around the predator in the real game`; dBefore 23.21u → dAfter 164.40u;
  predState `stalk`; no page exceptions, no console errors.

## Live verification

Browser check: **passed** (real `npm run dev` page, headless chromium).

## Shrink/Flatten report

- Removed: no abstractions remained to cut — the design is one pure predicate
  module + holds in the existing `steer()` + one `applyEcology` pass in the
  existing `Simulation.step`. No new classes, no new signal types, no new bus,
  no new test rig (the existing `Scenario` harness was extended per the work
  item's handoff).
- Considered and kept: the four separate steer-holds (quiet/flee/scavenge/
  filterFeeder) instead of a table — four fixed reaction kinds with different
  thresholds; a table would be one more indirection for one current user set.
- Considered and removed earlier (during tuning): a shared-home tweak in the
  browser check (replaced by a velocity-based liveness assertion), debug
  console dumps in the browser check.

## Deviations from plan

None material. The work item anticipated extending `senses.ts` if a signal type
was missing; it was not — the existing `noise` type with tags sufficed, so no
extension was made (the assumption held; no reaction required a global state
read, which would have falsified it).

## Assumptions

- **Injection of a stalking predator in the browser check.** In the live game
  the predator would enter the hunt from the school's own noise; the probe
  drives the reaction directly by setting the injected predator's state to
  `stalk` with the school center as target (only hunting predators emit the
  PREDATOR_TAG). This tests the same reaction path (PREDATOR_TAG on the bus →
  school flees) through the real sim and real renderer; it does not bypass the
  reaction under test.
- **Fixture senses.** SCAVENGER and FEEDER carry empty `senses` so that only
  the ecology layer can move them — otherwise the generic sense engine
  perceives the predator/kill tags as plain noise and pulls them into
  `investigate`, masking the reaction under test. This makes the scenario
  assertions discriminating (a test that would pass if the ecology layer were
  mentally removed does not pass).
- **Browser liveness measure.** With no signal on the bus the bounded flock
  forces settle into a slow equilibrium (net center drift ~0.5u/2.5s at
  ~3.4 u/s member velocities), so the browser check asserts live member
  velocities + exact visual tracking for "the school is visible and alive",
  and the predator-injection parting (23 → 164u) as the discriminating
  school-behavior assertion.

## Knowledge notes

- Consulted: project notes under `agents/projects/` (scenario harness,
  throttling budget, signal bus layout) per the work-item handoff.
- Written: none this session beyond this artifact (the reusable facts — tag
  conventions, thresholds, the steer-hold order — live in the L1/L2 contract
  of `src/creatures/ecology.ts` itself).

## Revision 2026-09-08 — re-verified after controller reset

The session-1 commit was reset away by the controller with no recorded gate
failure; this session restored the identical product diff (byte-for-byte from
the reset commit) and re-ran every verification fresh at this re-commit:

- `npx vitest run` → 25 files, 178 tests, all pass (fresh run, 20:09).
- `npx tsc --noEmit` → clean.
- `npm run build` → built successfully (pre-existing chunk-size warning only).
- Browser check re-run: `PASS school is visible, flocked, and parts around the
  predator in the real game`; dBefore 23.27u → dAfter 168.84u; predState
  `stalk`; no page exceptions, no console errors.

The scratch debug probes and screenshots from session 1 were NOT restored —
they did not influence this attempt's result, and the browser check now
reproduces the evidence textually. Everything else in this artifact stands as
written.
