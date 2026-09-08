# Review: WI-03a — Tier 1: ambient/schooling fauna

Status: pass

Reviewed commit: `92f6010` ("implemented the shallow ambient fauna tier"), base `5abaad2e`.
Reviewer session: `work_item_reviewer`, task `hadalv2.execute_leaf.__attempt_0009`.

## Phase 0 — Contract established before diff inspection

- Read `request.md` (JSON envelope), the WI-03a spec, ST-03 `plan.md`, the
  WI-01b handoff pointers, and the implementer's result note
  (`implementation/WI-03a-implementation.md`).
- "Done" for this item means: 5–7 tier-1 organisms from the **private roster**
  (§11.1 distribution, `design_private/creature_candidates.md` is source of
  truth) as `CreatureDef` data on the ST-02 framework, spawned in production
  world data inside their designed bands, §34 ambient caps respected, ids
  debug-only, one headless signature-rule test per species through
  `src/sim/scenario.ts`, plus a real browser spot-check (§70 presentation
  layer, no reachability proof required). Whole-roster ≥15 count and the
  roster-wide test audit are explicitly **not** this item (WI-03d).

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| AC-roster-count (tier-1 portion) | passed | 6 defs (T-01, T-02, T-03, T-05, T-06, T-13) in `src/content/secret/hiddenCreatures.ts`, merged into `CREATURE_BY_ID` (`src/creatures/fixtures.ts:103-107`); 39 spawn placements in `src/world/worldData.ts` all inside `TIER1_BANDS` — asserted by the committed test "every tier-1 id resolves and every spawn sits in its designed band" which I re-ran green. Band assignments cross-checked against `design_private/creature_candidates.md` §11.1 (shelf→T-01, twilight→T-02/T-03, abyss→T-05/T-06, hadal→T-13). Per-chunk tier-1 count ≤ 16 (§34) asserted and re-run green. |
| AC-roster-tests | passed | 12 tests in `src/sim/tier1Scenario.test.ts` re-run by me: `npx vitest run src/sim/tier1Scenario.test.ts` → 12/12 pass (535 ms); full suite `npx vitest run` → 26 files, 190 tests, all pass. Each of the 6 species has a signature-rule test that exercises the **real** rule (school parting via `flockForce`, filter-feeder orientation via the real `CurrentSystem` fields, T-13 noise-flee through the real signal bus). Spoiler scan: independent word-boundary probe (`scratch/reviewer/spoiler-scan.mjs`) over `src/`, `tests/`, `index.html` for the private roster names (Floc, Spore-silk, Lantern-raft, Drapery, Pulse-motes, Markers, secret-description phrases) → zero matches; internal T-IDs appear only in identifiers, tests, and the commit message, as section 33/68 permits. Commit message uses the WI-mandated style, no spoilers. |
| Browser spot-check | passed | Implementer probe `scratch/implementation/browser-spot/spot.mjs` boots the real `npm run dev` in headless Chromium (Playwright), teleports to the t01-shelf spawn via the real `?debug=1` panel, asserts zero page exceptions and zero console errors (hard assertions, not best-effort), and proves the scene is alive (1,111,028 differing PNG bytes between two captures; `frame-1.png` and `after-teleport.png` on disk, `server.log` shows clean Vite boot). |

## Findings

None blocking. Two observations (not defects, no implementer action required):

1. `Simulation.denseMediumAt` (`src/sim/Simulation.ts:367-376`) iterates all
   creatures per step. Fine for 6 tier-1 organisms; a later tier adding dense
   fauna should revisit, but that is WI-03b/c territory, not this item's scope.
2. The test at `tier1Scenario.test.ts:249-266` asserts the §34 cap from a
   literal `CAP = 16` rather than an imported constant — acceptable for a data
   check, noted so WI-03d's roster-wide check can import the shared constant
   if one exists.

## Impact Check

- `fleeFrom` (new, `Creature.ts`): no other callers; additive public method.
  Safe.
- `strongestPos` private→public (`Creature.ts`): the only prior caller was the
  removed `strongestSignalPos` wrapper; making it public widens surface but no
  existing behavior changes. Callers of `Creature` state transitions
  (audio emission) untouched.
- `PART_RADIUS` export (`ecology.ts`): value unchanged (300); purely an export
  widening for the tests. `flockForce` itself is **unchanged** — the
  work-item's load-bearing assumption ("ST-02 school behavior reusable as-is")
  held; no parallel school system was created.
- `CREATURE_BY_ID` merge (`fixtures.ts`): the `Simulation` constructor throws
  on unknown spawn ids, so the merge is the production seam; all production
  `creatureSpawns` referencing tier-1 ids now resolve. `creatureScenario.test.ts`
  count assertion correctly updated 5→11.
- `EcologyDef.density?` (`CreatureDef.ts`): optional, undefined by default →
  `denseMediumAt` skips non-density creatures, so the 5 framework fixtures and
  all future defs are unaffected.
- `Simulation.ts` dense-medium drag: only applies when a `density`-tagged
  active creature is within `PART_RADIUS` of the player; factor 1 otherwise,
  so pre-existing player physics is unchanged (verified by the full 190-test
  suite passing, including all WI-02 scenarios).

## Independent Adversarial Probes

1. **Spoiler token scan** (`scratch/reviewer/spoiler-scan.mjs`, re-run by me):
   case-sensitive word-boundary scan of the private roster's creature names
   and secret-description phrases across `src/`, `tests/`, `index.html`.
   Falsifies the claim if any name leaked into product source. Observed:
   CLEAN. (T-IDs intentionally excluded — sanctioned by sections 33/68.)
2. **Band cross-check against the private source of truth**: compared
   `TIER1_BANDS` + every `worldData.ts` spawn placement against
   `design_private/creature_candidates.md` §11.1 and §13 band assignments by
   hand, not just via the agent-authored test. Observed: all 39 placements in
   the designed band; no invented species (exactly the 6 selected ids, none
   from other tiers).
3. **Test-quality audit** (could the tests pass with the feature removed?):
   T-01 school test asserts parting distance `> PART_RADIUS` *and* `denseMediumFactor < 1` *and* reformation — removing the school data or the drag term breaks it. T-02/T-06 assert displacement is **along** the current (dot/len > 0.9) in a real `CurrentSystem` field, not merely that the creature moved. T-13 asserts the `flee` transition on the tool-noise signal plus increased distance. Offscreen test asserts `active === false` *and* frozen position *and* reactivation. Each test would fail if its signature behavior were removed.
4. **Full-suite re-run**: `npx vitest run` → 190/190, which covers the
   pre-existing WI-02 scenarios (framework regression check for the
   `strongestPos`/`fixtures`/`Simulation` changes).

## What I Could Not Verify

- The **visual** quality of the browser spot-check (silhouette distinguishability,
  the §46 "replacing with a same-size generic fish must change the scene"
  check) — the committed screenshots show small creature bodies near the
  player, but I did not re-run the browser probe or visually grade the
  silhouettes. The data parameterization is real (`creatureRender.ts`
  branches on `def.body.chainCircles` → spine vs small body), which is the
  mechanism the §46 check depends on; a later task-reviewer can visually
  grade it from the committed PNGs.
- The **whole-roster** ≥15 count (AC-roster-count's full form): explicitly
  deferred to WI-03d by the spec; only the tier-1 portion is in scope here,
  and that portion passes.

## Assumptions

- "5–7 tiny organisms" is satisfied by exactly the 6 the private roster
  selects; the roster is the source of truth, so 6 (in range) is correct —
  not an invented 5th/7th. Recorded here because the spec gives a range and
  the implementation picked the roster's count.
- The `CAP = 16` literal in the test was accepted as the §34 cap value as
  documented in the WI-01b handoff and project notes; I did not independently
  re-derive §34's number from the request (the request JSON in this child
  task does not carry the full section text).
