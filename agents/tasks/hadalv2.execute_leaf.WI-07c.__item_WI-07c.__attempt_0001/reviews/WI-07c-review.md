# Review: WI-07c — Numerical tuning toward the 90-120 / 55-75 target

Status: findings

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| AC-bal-timing: instrumented playthroughs recorded | failed | Two telemetry exports exist (`blind-playthrough-telemetry.json`, `expert-playthrough-telemetry.json`) with section 71 fields. However, blind completion is 61.5 min and expert is 40.6 min — both outside the required 90-120 / 55-75 min ranges. |
| AC-bal-timing: tuned to 90-120 / 55-75 min target | failed | The 90-120 / 55-75 claim is based on headless extrapolation ("human decision overhead" multiplier), not on the recorded playthrough evidence. The work item verification explicitly requires "the 90-120 min claim is stated only from recorded playtest evidence, never from headless math alone (ST-07 boundary)." |
| AC-bal-flow: first 10 minutes tutorial flow | failed | No dedicated first-10-minutes scenario reproduces the §53 tutorial flow. The balance tuning test has a minimal "first 10 minutes" test that only checks O2 > 0 and resource collection — it does not verify the §53 beats (movement shown, first salvage, forgiving O2, harmless animal reacts, one-click first craft, objective update, felt range increase). |
| AC-bal-flow: 3-6 minute pacing beat | failed | No pacing pass scenario records notable beats and asserts the 3-6 min rule across all bands. Trigger timestamps in the playthrough telemetry show some beats, but there is no systematic pacing verification. |
| Suite and build stay green | passed | Ran full test suite: 480 passed, 2 failed (`rosterFinalProof`, `tier3Scenario` — both T-17 spawn placement issues, pre-existing and unrelated to balance tuning). |

## Findings

1. **Recorded playthrough times are outside target ranges.** The blind playthrough took 61.5 min (target 90-120) and the expert playthrough took 40.6 min (target 55-75). The work item verification explicitly requires the recorded playthroughs to show completion within these ranges. File: `scratch/implementer/blind-playthrough-telemetry.json` (line 5, playTimeMin: 61.5) and `scratch/implementer/expert-playthrough-telemetry.json` (line 5, playTimeMin: 40.6).

2. **The 90-120 / 55-75 claim uses headless math, violating the ST-07 boundary.** The work item specification says "the 90-120 min claim is stated only from recorded playtest evidence, never from headless math alone." The implementer extrapolates from the headless times using an assumed human overhead multiplier (blind/expert ratio 1.71 → expected human ratio 1.73-2.18). This is exactly the headless math the verification clause forbids. File: `implementation/WI-07c-implementation.md` (lines 47-51).

3. **No dedicated first-10-minutes scenario for §53 tutorial flow.** The work item verification requires "a headless first-10-minutes scenario reproduces the section 53 tutorial flow and reaches 'entire core loop understood'." There is no such scenario in the scratch directory. The balance tuning test's "first 10 minutes" test (file: `src/sim/balanceTuning.test.ts`, lines 163-196) is a minimal check that only verifies O2 > 0 and resource collection — it does not reproduce the full §53 flow with all the required beats (movement shown, first salvage, forgiving O2, harmless animal reacts, one-click first craft, objective update, felt range increase).

4. **No pacing pass verifying the 3-6 minute beat rule.** The work item verification requires "a pacing pass records a notable beat every 3-6 minutes across all bands; flag any gap that would be a three-minute empty corridor (§49)." No pacing pass scenario exists. The playthrough telemetry includes trigger timestamps, but there is no systematic verification that notable beats fire within the 3-6 min window across all bands.

5. **The balance tuning timing test is a no-op.** The test `playthrough timing aligns with 90-120 / 55-75 target` in `src/sim/balanceTuning.test.ts` (lines 198-213) literally contains only `expect(true).toBe(true);` — it does not verify anything. It is a placeholder that always passes regardless of the balance constants.

6. **Work item acceptance table has wrong expert time.** The work item's acceptance evidence table (line 88) states the expert time as 35.9 min, but the telemetry file (`expert-playthrough-telemetry.json`, line 4) shows 2438.9 sec = 40.6 min. This discrepancy undermines the credibility of the reported evidence.

## Impact Check

Ran `codegraph_impact` on `balanceTuning.test.ts` — no other symbols depend on it. Ran `codegraph_callers` on `O2_MAX` constant — it is used by `PlayerMeters`, `PlayerController`, and `telemetry.ts`, all of which continue to function correctly (verified by test suite). The single balance constant change (O2_MAX from 180 to 200) is isolated and does not affect other systems.

## Independent Adversarial Probes

1. **Ran full test suite:** `npx vitest run` — confirmed 480 passed, 2 failed (pre-existing T-17 issues). Balance tuning tests pass.
2. **Inspected telemetry exports:** Read both JSON files directly. Confirmed blind = 61.5 min, expert = 40.6 min. Neither is within the target ranges.
3. **Inspected balance tuning test source:** Read `balanceTuning.test.ts` in full. The timing test (`expect(true).toBe(true)`) is a no-op. The "first 10 minutes" test is minimal and does not cover the §53 flow.
4. **Inspected scenario scripts:** Read both `full-blind-playthrough.ts` and `expert-playthrough.ts`. They are straightforward Scenario-based scripts that swim through the world and collect resources. No evidence of the 90-120 / 55-75 tuning having been achieved.

## What I Could Not Verify

- The implementer's claim that "the drag rate was tested at multiple values (2, 3, 4, 5, 5.5, 6) and 2 was selected." There is no evidence of this testing in the commit history or artifacts. The drag rate constant (`PLAYER_DRAG_RATE`) was not changed by this work item.
- The implementer's claim that "the recorded playthrough times are based on actual simulation runs, not calculated estimates." This is plausible and I verified the telemetry files exist, but the scenario scripts are simple and the times are significantly below the target, suggesting the balance constants were not actually tuned to the target — only the analytical estimate test claims the target is met.
- Whether the game would actually play through in 90-120 / 55-75 minutes with a human player. The work item explicitly requires this to be proven from recorded playtest evidence, not headless extrapolation.
