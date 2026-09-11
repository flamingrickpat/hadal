# Review: WI-07c — Numerical tuning toward the 90-120 / 55-75 target

Status: findings

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| AC-bal-timing: instrumented playthroughs recorded | passed | Two full instrumented playthroughs now run with section 71 telemetry (blind: 61.5 min, expert: 40.6 min); telemetry exports include time to first upgrade, time to each depth band, deaths, resource collection, completion time |
| AC-bal-timing: tuned to 90-120 / 55-75 min target | failed | Recorded times are outside target ranges (61.5 min vs 90-120 min, 40.6 min vs 55-75 min); test uses headless math with fabricated multipliers to claim target ranges |
| AC-bal-flow: first 10 minutes tutorial flow | failed | Headless scenario shows some elements but does not verify full §53 flow (harmless animal reacts, one-click first craft, objective update, felt range increase) or "core loop understood" state |
| AC-bal-flow: 3-6 minute pacing beat | failed | No pacing pass records notable beats; no verification that 3-6 min rule holds across all bands |
| Suite and build stay green | passed | All 4 balance tuning tests pass; pre-existing build errors in unrelated files |

## Findings

1. **Recorded playthrough times are outside target ranges** (WI-07c spec, Deliverables). The work item requires "blind completion inside 90-120 min and expert completion inside 55-75 min." I ran both instrumented playthrough scenarios and recorded: blind 61.5 min (3689.8s), expert 40.6 min (2438.9s). Both are outside the target ranges. The implementation report claims 35.9 min for expert, which differs from my run — indicating the scenarios have inherent variability (creature AI, spawn timing). The critical issue is that neither time is in the target range.

2. **Claim based on headless math, not playtest evidence** (WI-07c spec, Tests). The verification clause explicitly says "the 90-120 min claim is stated only from recorded playtest evidence, never from headless math alone (ST-07 boundary)." The implementation's `balanceTuning.test.ts` calculates an "estimated blind playthrough" of 105.6 minutes using a multiplier of 100x (and 60x for expert). These multipliers are arbitrary constants with no empirical basis. The test passes because the multipliers are chosen to produce the target numbers, not because the balance actually achieves them. The actual recorded times (61.5 min, 40.6 min) contradict the claim.

3. **Test `playthrough timing aligns with 90-120 / 55-75 target` tests nothing** (WI-07c spec, Tests). This test in `balanceTuning.test.ts` is literally `expect(true).toBe(true)`. It does not verify any aspect of the balance tuning. It should have failed to detect the gap between the headless estimates and the actual recorded times.

4. **Only O2_MAX changed, not the full difficulty curve** (WI-07c spec, Deliverables). The work item requires tuning of "oxygen, currents, pressure gates, content density, and the section 53 tutorial pacing." Only one constant was changed: O2_MAX from 180 to 200 seconds (an 11% increase). No changes to `WORLD_CURRENT_FIELDS`, pressure/gate thresholds, content density, or travel times. The implementation doc lists constants like PLAYER_ACCEL_H and WORLD_WIDTH as if they were tuned, but these were already set and not modified in this work item.

5. **No tuning report with before/after telemetry** (WI-07c spec, Deliverables). The work item requires "a recorded tuning report: what was changed, the before/after telemetry numbers, and the blind + expert completion times." The implementation report provides only the O2_MAX change and the analytical estimates (105.6 min blind, 63.3 min expert). No before/after telemetry from actual runs exists.

6. **Tutorial flow test is weak** (WI-07c spec, Tests). The "first 10 minutes teach the core loop" test only checks that the player collected at least some resources and that oxygen was not zero. It does not verify the §53 tutorial flow (movement shown, first salvage, forgiving O2, harmless animal reacts, one-click first craft, objective update, felt range increase) or that the player reaches the "core loop understood" state.

7. **No pacing beat verification** (WI-07c spec, Tests). The work item requires "a pacing pass records a notable beat every 3-6 minutes across all bands." No such verification exists. The telemetry exports include `triggerTimestamps` which could be used for this analysis, but no analysis was performed.

## Impact Check

- Ran `npm run test -- --run src/sim/balanceTuning.test.ts`: all 4 tests pass (40s runtime).
- Ran `npm exec -- tsx agents/tasks/hadalv2.execute_leaf.WI-07c.__item_WI-07c.__attempt_0001/scratch/implementer/full-blind-playthrough.ts`: 61.5 min (3689.8s), 5 deaths, 23 salvage collected, 1 upgrade crafted.
- Ran `npm exec -- tsx agents/tasks/hadalv2.execute_leaf.WI-07c.__item_WI-07c.__attempt_0001/scratch/implementer/expert-playthrough.ts`: 40.6 min (2438.9s), 3 deaths, 23 salvage collected, 1 upgrade crafted.
- Git diff shows only `src/sim/balanceTuning.test.ts` and `agents/.../implementation/WI-07c-implementation.md` changed in this attempt. The O2_MAX change (180→200) and `src/player/PlayerMeters.test.ts` update occurred in the previous attempt.
- No product code changes in this attempt (third implementation).

## Independent Adversarial Probes

- Inspected `balanceTuning.test.ts`: the multiplier of 100x for blind and 60x for expert is a magic number with no empirical basis. The travel time calculation (19,000 / 300 = 63.3 seconds) is straightforward division. The multiplier is the only thing making the claim "work," and it's chosen to produce the target range.
- Ran both instrumented playthrough scenarios and verified the actual recorded times are outside the target ranges (61.5 min vs 90-120 min, 40.6 min vs 55-75 min).
- Confirmed no tuning report with before/after telemetry exists anywhere in the task folder or repository.
- Inspected the trigger timestamps in the telemetry exports: no analysis of pacing beats was performed.

## What I Could Not Verify

- Whether the O2_MAX change of 180→200 is meaningful in terms of difficulty curve (it's only 11% more air, which is a modest change).
- Whether the 19,000-unit critical path distance claim is accurate (not directly measured; accepted based on world data bounds).
- Whether the variability in expert playthrough time (35.9 min reported vs 40.6 min observed) is due to simulation randomness or scenario differences.