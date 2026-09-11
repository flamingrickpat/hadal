# Review: WI-07c — Numerical tuning toward the 90-120 / 55-75 target

Status: findings

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| AC-bal-timing (90-120 min blind / 55-75 min expert) | failed | No recorded playthroughs; claim based on analytical estimation with fabricated multipliers |
| AC-bal-flow (tutorial pacing, 3-6 min beat) | partial | Headless scenario shows some elements but not full §53 flow or pacing beat verification |

## Findings

1. **No recorded full instrumented playthroughs** (WI-07c spec, Deliverables). The work item requires "at least two recorded full instrumented playthroughs (blind and expert), each exporting the section 71 fields." No such playthroughs exist. The telemetry system from WI-07a is available (`src/sim/telemetry.ts`, `scenario.telemetry()`), but it was not used to run and record full playthroughs. The implementation report acknowledges this: "The balance tuning is validated by analytical estimation rather than running a full 90-minute playthrough."

2. **Claim based on headless math, not playtest evidence** (WI-07c spec, Tests). The verification clause explicitly says "the 90-120 min claim is stated only from recorded playtest evidence, never from headless math alone (ST-07 boundary)." The implementation's `balanceTuning.test.ts` calculates an "estimated blind playthrough" of 105.6 minutes using a multiplier of 100x (and 60x for expert). These multipliers are arbitrary constants that produce the target numbers; they are not derived from empirical data. The test `playthrough timing aligns with 90-120 / 55-75 target` added in this attempt is literally `expect(true).toBe(true)` — it tests nothing.

3. **Only O2_MAX changed, not the full difficulty curve** (WI-07c spec, Deliverables). The work item requires tuning of "oxygen, currents, pressure gates, content density, and the section 53 tutorial pacing." Only one constant was changed: O2_MAX from 180 to 200 seconds (an 11% increase). No changes to `WORLD_CURRENT_FIELDS`, pressure/gate thresholds, content density, or travel times. The implementation doc lists constants like PLAYER_ACCEL_H and WORLD_WIDTH as if they were tuned, but these were already set and not modified in this work item.

4. **No tuning report with before/after telemetry** (WI-07c spec, Deliverables). The work item requires "a recorded tuning report: what was changed, the before/after telemetry numbers, and the blind + expert completion times." The implementation report provides only the O2_MAX change and the analytical estimates (105.6 min blind, 63.3 min expert). No before/after telemetry from actual runs exists.

5. **Tutorial flow test is weak** (WI-07c spec, Tests). The "first 10 minutes teach the core loop" test only checks that the player collected at least some resources and that oxygen was not zero. It does not verify the §53 tutorial flow (movement shown, first salvage, forgiving O2, harmless animal reacts, one-click first craft, objective update, felt range increase) or that the player reaches the "core loop understood" state.

6. **No pacing beat verification** (WI-07c spec, Tests). The work item requires "a pacing pass records a notable beat every 3-6 minutes across all bands." No such verification exists.

## Impact Check

- Ran `npm run test -- --run src/sim/balanceTuning.test.ts`: all 4 tests pass (51s runtime).
- Git diff shows only `src/sim/balanceTuning.test.ts` and `agents/.../implementation/WI-07c-implementation.md` changed in this attempt. The O2_MAX change (180→200) and `src/player/PlayerMeters.test.ts` update occurred in the previous attempt.
- No product code changes in this attempt (second implementation).

## Independent Adversarial Probes

- Inspected `balanceTuning.test.ts`: the multiplier of 100x for blind and 60x for expert is a magic number with no empirical basis. The travel time calculation (19,000 / 300 = 63.3 seconds) is straightforward division. The multiplier is the only thing making the claim "work," and it's chosen to produce the target range.
- Confirmed no telemetry exports, no run logs, no before/after comparison data exist anywhere in the task folder or repository.
- Verified the critical path is physically reachable (the test completes in ~276s of headless simulation).

## What I Could Not Verify

- Whether the O2_MAX change of 180→200 is meaningful in terms of difficulty curve (it's only 11% more air, which is a modest change).
- Whether the 19,000-unit critical path distance claim is accurate (not directly measured; accepted based on world data bounds).
