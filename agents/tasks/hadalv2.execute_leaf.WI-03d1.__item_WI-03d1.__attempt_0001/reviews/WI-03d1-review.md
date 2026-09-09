# Review: WI-03d1

Status: pass

Reviewed commit: `e52cc06` ("[creatures][simulation] add the tier-4
large-scale ecological set pieces") on top of the accepted revision
`c64ad8145e71`. Working tree clean; the commit contains 9 product files and 3
artifact files, no `state.md`, no renderer files, no `worldData.ts` placement
(non-goals respected).

Phase 0 was done before the diff: request sections 10, 11.1, 11.2, 20, 46, 47,
52, 68 read; the ST-WI-03d story plan (criteria assignment, proof ownership),
the child task spec/plan/understanding, and the implementer's result note
read first. "Done" for this item means: 5 tier-4 `CreatureDef`s per the
private roster selection, the four simulation-side section 52 rules
(speed mismatch F, fauna-first environment reaction D, sonar-scale signal E,
non-targetable presences), one headless signature scenario per organism, the
two AC-roster-large floors proven headlessly, and this item's spoiler
containment. Internal ids only in this report.

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| AC-roster-large: at least 3 large-scale creatures/events exist | passed | 5 defs in `src/content/secret/hiddenCreatures.ts` (T-19, T-20, T-22, T-23, T-25), all `sizeClass: 'large'`, `nonTargetable: true`, no `combat`; `bodyExtent` ≥ 800 asserted per def in `tier4Scenario.test.ts` (line 82); T-23 extent 6440 (root 600, farthest chain reach 2800+420). Private roster (`design_private/creature_candidates.md` lines 89-90) confirms the selection: 3 huge set pieces + 2 colossal presences, both colossals "not simply hostile" — matches the landed defs exactly. |
| AC-roster-large: ≥1 colossal presence communicated FIRST through other fauna | passed | `t23Crossing` (`Simulation.ts:1039-1064`): inside the 2400-unit announcement window (beyond the 1200 clean-view range) the rule emits only the environment-reaction tags (`PREDATOR_TAG` flee + `QUIET_TAG`) and nothing of its own; the heartbeat `custom` step starts only inside `FULL_BODY_VIEW_RANGE`. Scenario asserts `tReact < tVisual`, `tReact < tHeartbeat`, and `tVisual - tAnnounce >= 3` from a live trace (test lines 512-526). My independent probe (below) reproduced the ordering and excluded the confound. |
| AC-roster-large: ≥1 encounter with no clean full-body view, from the sim's visibility state | passed | `hasCleanFullBody` (`Simulation.ts:364-374`) — pure geometry over root + all chain circles vs `FULL_BODY_VIEW_RANGE` (1200), no allocation. The crossing scenario polls it every frame of the encounter and asserts `cleanViewAt < 0` (line 528). Geometrically airtight: the body span (6440) cannot fit inside 1200 from any point. Probe confirmed "never". |
| AC-roster-tests: headless signature-rule test per implemented major species (this tier) | passed | 17 tests in `src/sim/tier4Scenario.test.ts`, run through the `Scenario` harness (`src/sim/scenario.ts`) wrapping the production `Simulation`: T-19 standoff/withdrawal; T-20 pulse heard beyond sight + sonar echo at impossible scale (size 1400/300 = 4.67 > 4, long-lived echo) + rideable current; T-22 stepwise creaking drift < 5% of body; T-23 fauna-first + no-clean-view + measured speed mismatch (worldSpeed ≥ 60 u/s and < 5% body-lengths/s); T-25 eddy drift + periodic reconfigure. Plus roster-data tests, 3 non-targetable scenarios, the floor test, and the token-scan spoiler test. `npx vitest run src/sim/tier4Scenario.test.ts` → 17/17 (this session). |
| AC-roster-tests: no creature name or secret description outside debug internals and private content files (this item's artifacts) | passed | The token-scan test scans `src/sim`, `src/creatures`, `src/player`, `src/game`, the secret content file, `worldData.ts`, and this task's `implementation/` against `design_private/_spoiler_tokens.txt` (T-IDs excluded per §68) — 0 offenders. My independent `git grep -i` over all tracked files found no tier-4 name tokens in `src/` or in this task's artifacts. The only tracked hits for name/lore tokens anywhere in the repo are in a previous, already-accepted attempt's review artifact (`agents/tasks/hadalv2.execute_leaf.__attempt_0016/reviews/WI-03c2-review.md`) — outside this item's scope; the roster-wide audit finalizes in WI-03d3. |
| Deliverable: speed mismatch (F) in simulation | passed | Data half: `maxSpeed` 120 vs span 6440 (1.9% body-lengths/s), asserted in the §46 test (lines 116-137). Behavior half: the crossing scenario measures actual world-space speed from the trace (≥ 60 u/s, line 535) while body-space rate stays < 5%. |
| Deliverable: environment reaction (D) before any direct sight/sound | passed | See floor 2 above; see probe for attribution. |
| Deliverable: non-combat-target (§10): no HP bar, no kill path | passed | `nonTargetable` guards the only two kill paths — `fireHarpoon` target selection (line 1326) and `emitPredatorSignals` prey selection (line 557) — plus the T-18 harvest path is restricted to `ecology.school === true` (line 903), and no tier-4 def is a school member. Creatures carry no hp data at all (the §10 model is cost/deter, `creatures/combat.ts`). Three scenario tests: harpoon picks the small fauna in the same shot and never the presence; harpoon at a lone presence lances nothing; an armed T-14 hunt kills ordinary fauna (kill path live) but never the presence, entering hunting states while doing so. |
| Deliverable: one `CreatureDef` per selected organism with sim-side fields; sonar-scale signal (E) as sim state | passed | 5 defs in the secret content file with bodies, movement, rest-state pins, minimums, `nonTargetable`. Technique E: non-targetable presences register as `SonarObject`s with `size = bodyExtent / SONAR_MASSIVE_REF` (constructor, `Simulation.ts:327-335`), read by the renderer through the existing `SonarSystem` targets/echoes. Proven by the T-20 sonar test. |
| Constraints: no placement, no renderer, no ST-04/ST-05 content | passed | Commit file list: no `src/world/worldData.ts`, no `src/render/`, no trigger/ending files. `TIER4_BANDS` is exported data for WI-03d3, not a placement. |
| Constraint: §34 no per-frame allocation in tier-4 hot paths | passed (consistent with existing code) | `applyTier4Interactions` is allocation-free per step: T-20/T-22/T-25 allocate nothing; T-23 allocates only on lane flip (commented). T-19's `t19Plume` allocates one `target` vec2 per step only during the bounded return window — identical to the pre-existing tier-1 controller pattern (`hiddenCreatures.ts:181`) and the engine default (`Creature.ts:181`). No new allocation class introduced by this item. |
| Constraint: §46 colossal test + §11.2 anti-cliche (hard gate) | passed | Data-level: the §46 test asserts distinct body/movement fingerprints across all 22 defs and the speed-mismatch shape. Design-level: each def's signature was checked against `design_private/creature_candidates.md` (T-19 harmless display-organism, T-20 fixed-point pulse source, T-22 structure-bound organism read as geology, T-23 flank crossing felt through fauna, T-25 headless reconfiguring cluster) — main ideas all go beyond "it is very big", none hit the §11.2 rejection list, minimums encoded in the defs match the roster (including T-20's deliberately absent `minimums`). |
| Constraint: spoiler rules in identifiers/tests/commit messages | passed | Identifiers are T-IDs only; commit message names no creature; tests carry only internal ids and behavioral descriptions (verified by re-reading all 17 test bodies). |

## Findings

None. Every acceptance criterion has real, re-run evidence behind it.

## Impact Check

- Codegraph gate: first structural lookups were `codegraph_explore` calls
  (projectPath `C:\Temp\hadal-v2`) locating the tier-4 rules, the combat
  paths, `Simulation`, `SonarSystem`, and the signal bus, plus blast-radius
  data: `Simulation` has 11 callers (Game, scenario harness, menu — all
  whole-simulation consumers; the constructor's creature-before-sonar reorder
  is internal), `SonarSystem.fire` 4 callers, `emit` 3.
- `fireHarpoon`, `emitPredatorSignals`, `applyTier4Interactions`, and the
  `tier4` map are private to `Simulation` — no external callers can be
  affected.
- `Creature.steer` is called only from `Creature.update`
  (`Creature.ts:168`). The new flee-hold exemption
  (`nonTargetable !== true`) fires only for the five new defs, so tier-1/2/3
  behavior is untouched (confirmed by the full suite staying green and the
  unchanged sibling scenario assertions).
- `bodyExtent` has two real users (sonar registration, `hasCleanFullBody`) —
  no abstraction for one user.
- Shared-suite side effects: registry count 22 → 27 and distinct-body count
  17 → 22 are direct consequences of five defs joining the shared registry,
  and the distinct-body loop now also fingerprints the new bodies
  (strengthening). The `scenarios.test.ts` macro-traversal change is a
  documented explicit 15000 ms timeout on a pre-existing borderline test, no
  logic change; it passes in my full-suite run.
- `Simulation.ts` L1/L2 contract: the new invariant (non-targetable presences
  are never combat targets) was added; `CreatureDef.ts` L2 notes `bodyExtent`;
  both updates are appropriate for the public-surface change.

## Independent Adversarial Probes

1. **T-23 reaction attribution** (the probe that could falsify the
   "fauna-first" claim): `scratch/reviewer/t23-attribution/probe.ts`, run via
   `npx vite-node`. Run A replays the exact scenario (seed 441, same world,
   same player path) with instrumentation; run B replays the identical world
   and player path **without** the presence.
   - Why it could falsify: the player arrives at (10800, -3400), only ~900
     units from the drifters — if the drifters' 50-unit westward displacement
     were caused by the player's arrival rather than the presence's
     announcement, the `tReact < tVisual` assertion would be confounded.
   - Observed (A): `tAnnounce=35.22`, `tReact=39.20`, `tVisual=40.22`,
     `tHeartbeat=40.23`, `cleanViewAt=never`, sight head-start 5.00 s —
     reproduces the implementer's recorded values (t≈39.2/40.2) and the
     asserted orderings.
   - Observed (B): drifters moved 0 units (min-x 11700 → 11700, "moved >50
     west: false"). The reaction is attributable to the presence.
   - Attribution is airtight, not just player-excluded: at `tReact` the
     presence is beyond the 1200 clean-view range (so its heartbeat has not
     started), and the simulation has no creature-creature collision — the
     world signal bus is the only cross-species channel available, and the
     announcement tags are what the drifters can perceive.
2. **Spoiler scan** (independent of the in-repo token test): case-insensitive
   `git grep` over all tracked files for every name token of the five tier-4
   organisms and every lore token in `design_private/_spoiler_tokens.txt`
   (the tier-4 creature names from the private roster, plus the MacGuffin
   and lore phrases), and a scan over `src/` for the three common-word name
   forms. Result: no hits in `src/`, in this task's artifacts, or in this
   commit's note; the only tracked hits are the previously accepted WI-03c2
   review artifact (named above, out of scope for this item).
3. **Literal-AC decision table** (read, not run): the AC wording says fauna
   "state changes (schools flee, zones go quiet)". The scenario proves
   displacement-based flee of the local drifters; the drifters stay in
   `forage` state (ecology flee-steering moves them) and the `QUIET_TAG`
   quiet half is emitted but not separately asserted. Assessed against the
   literal request wording in "Assumptions" below.
4. **Kill-path audit**: all three `dead = true` sites in the simulation
   (predator kill 566, T-18 harvest 931, harpoon 1338) were read; each is
   unreachable for a non-targetable def (guards at 557, 903, 1326).

## What I Could Not Verify

- The browser/presentation half of the tier (techniques A/B/C/G, §34 FPS at
  1080p) — explicitly WI-03d2's, and this item has no user-visible surface;
  the spec itself marks live verification not applicable.
- Production placement and the roster-wide final proofs (15+ active types,
  whole-roster test-existence, spoiler audit of all ST-03 artifacts) —
  WI-03d3's.
- The implementer's `git stash` reproduction that the macro-traversal timeout
  is pre-existing: I did not re-run the base commit; the test passes today
  with the 15000 ms timeout and the change is timeout-only.
- The codegraph MCP connection dropped mid-session ("Connection closed")
  after two successful calls; the final caller lookup (`Creature.steer`) was
  therefore completed with a targeted search. All structural work that
  mattered was done while codegraph was up.
- No performance measurement of the tier-4 hot paths (allocation review was
  by code reading; §34's 60 FPS clause is a browser observation owned by
  WI-03d2).

## Assumptions

1. **"World data" in "production simulation and world data":** the scenarios
   run the production `Simulation` against greybox coast chunks plus a
   test-authored band-5 basin, because tier-4 production spawns do not exist
   by design until WI-03d3 — and every earlier tier's scenario tests use the
   same pattern. Rejected the reading that `makeSimWorld()` alone is required:
   it contains no tier-4 spawns, so it could not exercise any tier-4 rule.
2. **"State change" of other fauna = displacement-based flee.** The scenario
   asserts the drifters' westward flee displacement, not a `flee`
   state-machine transition; the implementer disclosed this (state transitions
   are not guaranteed at the designed signal strengths). The literal request
   ("communicated first through changes to other fauna", "schools flee") is
   met by the motion: a school that flees has changed. The strict reading
   (must assert a `flee` state) would test internal state naming rather than
   the observable phenomenon the AC describes, and the actual AC floor —
   ordering before any direct sight/sound — holds under either reading.
3. **"Zones go quiet" is emitted, not asserted.** The announcement refresh
   emits the `QUIET_TAG` at the presence each 2.5 s; no scenario asserts a
   zone-quieting reaction. The AC floor requires only that the environment
   reaction precede direct evidence, which the flee does. Noted so
   WI-03d2/WI-03d3 can decide if the quiet half needs its own proof.
4. **Spoiler interpretation for implementation prose:** the implementer note
   and tests describe the organisms by internal id plus one-line behavior
   summaries (matching the prior tiers' artifacts and the item's own
   token-scan test, which whitelists T-IDs and actively scans the
   implementation directory). "Secret description" is read as the private
   roster's wording/names — none appear outside `design_private/` and the
   secret content file in this item's artifacts.
