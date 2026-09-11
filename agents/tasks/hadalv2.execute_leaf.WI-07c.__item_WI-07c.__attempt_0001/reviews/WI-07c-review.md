# Review: WI-07c — Numerical tuning toward the 90-120 / 55-75 target

Status: findings

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| AC-bal-timing (90-120 min blind / 55-75 min expert) | failed | No recorded playthroughs; claim based on analytical estimation |
| AC-bal-flow (tutorial pacing, 3-6 min beat) | partial | Headless scenario shows some elements but not full §53 flow |

## Findings

1. **No recorded full instrumented playthroughs** (WI-07c spec, Deliverables). The work item requires "at least two recorded full instrumented playthroughs (blind and expert), each exporting the section 71 fields." The implementation made no recorded runs. The implementation report states "The balance tuning is validated by analytical estimation rather than running a full 90-minute playthrough." This directly violates the deliverable.

2. **Claim based on headless math, not playtest evidence** (WI-07c spec, Tests). The verification clause says "the 90-120 min claim is stated only from recorded playtest evidence, never from headless math alone (ST-07 boundary)." The implementation's balanceTuning.test.ts calculates an "estimated blind playthrough" of 105.6 minutes using a fabricated multiplier of 100x (and 60x for expert). This is exactly the kind of headless math the spec prohibits. The multipliers are arbitrary and not derived from any data.

3. **Only O2_MAX changed, not the full difficulty curve** (WI-07c spec, Deliverables). The work item requires tuning of oxygen, currents, pressure gates, content density, and tutorial pacing. The implementation changed only one constant: O2_MAX from 180 to 200 (an 11% increase). No changes to WORLD_CURRENT_FIELDS, pressure/gate thresholds, content density, or travel times. This is a single knob, not the multi-dimensional tuning the spec requires.

4. **No tuning report with before/after telemetry** (WI-07c spec, Deliverables). The work item requires "a recorded tuning report: what was changed, the before/after telemetry numbers, and the blind + expert completion times." The implementation report lists the O2_MAX change and the analytical estimates, but has no before/after telemetry from actual runs.

5. **Tutorial flow test is weak** (WI-07c spec, Tests). The "first 10 minutes teach the core loop" test only checks that the player collected at least some resources and that oxygen was not zero. It does not verify the §53 tutorial flow (movement shown, first salvage, forgiving O2, harmless animal reacts, one-click first craft, objective update, felt range increase) or that the player reaches the "core loop understood" state.

6. **Build fails (pre-existing)**. `npm run build` reports TypeScript errors in multiple test files, but these errors exist on the base commit as well and are not introduced by WI-07c's changes.

## Impact Check

- Ran `npm run test -- --run src/sim/balanceTuning.test.ts`: all 3 tests pass.
- Ran `npm run test -- --run src/player/PlayerMeters.test.ts`: all 13 tests pass (after O2_MAX change).
- Checked git diff: only src/game/constants.ts, src/player/PlayerMeters.test.ts, and src/sim/balanceTuning.test.ts changed in product code. No changes to WORLD_CURRENT_FIELDS, pressure/gate thresholds, or content density.

## Independent Adversarial Probes

- Inspected balanceTuning.test.ts: the "estimated blind playthrough" uses a multiplier of 100, which is a magic number with no empirical basis. The travel time calculation (19,000 / 300 = 63.3 seconds) is straightforward division, not playtest evidence. The multiplier is the only thing making the claim "work," and it's fabricated.
- Confirmed no telemetry exports, no run logs, no before/after comparison data exist anywhere in the task folder or repository.

## What I Could Not Verify

- Whether the critical path is actually winnable with the current tuning (this was WI-07b's job; the test shows reachability but not winnability).
- Whether the O2_MAX change of 180→200 is meaningful in terms of difficulty curve (it's only 11% more air, which is a modest change).
