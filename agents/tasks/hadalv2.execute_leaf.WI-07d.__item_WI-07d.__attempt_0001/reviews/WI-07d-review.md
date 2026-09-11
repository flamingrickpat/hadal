# Review: WI-07d — 60 FPS verification and fix-forward

Status: findings

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| 60 FPS target holds at 1080p in largest encounter | Passed | Headless Chromium with hardware-accelerated WebGL achieves 133 FPS in the largest encounter (deep band 5). Probe output log at `scratch/item-implementer/perf-probe/output/probe-output-nogpu.log`. |
| 60 FPS target holds in every band's representative scene | Passed | All 6 depth band scenes achieve ~133 FPS, well above the 60 FPS target. Same probe output. |
| Recorded frame data (FPS / frame delta / entity count) | Partial | FPS recorded for all 6 scenes with 5 samples each. Frame delta and active entity count not recorded. Frame loop verified running via `isLoopRunning: true`. |
| Fix-forward within section 34 rules | Passed | Eliminated per-frame Vec2 allocations in particle stepping and current system velocity calculations (section 34: "avoid per-frame vector allocation in hot loops"). |
| Before/after frame data for fixes | Failed | No before/after frame data provided for the allocation fix. Only after-fix measurements exist. |
| Node headless suite stays green | Passed | 476 tests pass; 2 pre-existing failures in `rosterFinalProof.test.ts` and `tier3Scenario.test.ts` (T-17 spawn band distribution), unrelated to this work item. |
| Build stays green | Passed | `npx vite build` succeeds (223ms). Note: `npm run build` (which includes `tsc --noEmit`) fails due to pre-existing TypeScript errors in test files unrelated to this work item. |

## Findings

1. **Telemetry source deviates from spec.** The work item specification requires using "WI-07a's frame/FPS telemetry." The implementer built a new FPS measurement in `src/main.ts` (`__HADAL_RENDER_FPS__`) instead. The reason given (WI-07a's telemetry measures simulation step rate, not actual render FPS) is technically valid, but the spec explicitly names WI-07a's telemetry as the source. The implementer should have either used the WI-07a telemetry endpoint or documented why it was insufficient and what alternative was used.

2. **Stale `results.json`.** The probe output file `scratch/item-implementer/perf-probe/output/results.json` shows ~23 FPS across all scenes (from a previous run with `--disable-gpu`). The final successful run produced `probe-output-nogpu.log` with ~133 FPS values, but `results.json` was not updated. The implementer should update `results.json` to reflect the final results for artifact consistency.

3. **Missing before/after frame data for fix-forward.** The specification requires that fix-forward changes be "evidenced with before/after frame data." The implementer applied a fix (eliminating per-frame allocations in `particles.ts` and `CurrentSystem.ts`) but only measured after-fix FPS. No before-fix baseline was captured.

4. **Missing frame delta and active entity count.** The specification requires "recorded frame data (FPS / frame delta / active entity count from WI-07a)." The probe only records FPS values. Frame delta and active entity count are not captured in the reported data.

## Impact Check

- **`CurrentSystem.velocityAt` signature change**: This is the most significant change. The method now writes into an output parameter (`out`) instead of returning a value. I verified via codegraph and grep that all 6 callers in production code (`Game.ts`, `Simulation.ts`) and all callers in tests have been updated to the new signature. The shared temp object pattern is safe because `velocityAt` is synchronous and does not retain the position object.

- **`particles.ts` allocation fix**: The change uses shared temp objects (`tempPos`, `tempVel`) for the particle step loop. This is safe because `stepParticleType` is called synchronously per frame and the current field calculation (`currentAt`) is also synchronous and does not retain the position object.

- **No impact on other subsystems**: The changes are localized to the render loop and the current system. No other subsystems depend on the `velocityAt` return value or the particle stepping internals.

## Independent Adversarial Probes

I ran the following verification commands:

1. **Build verification**: `npx vite build` — succeeded in 223ms, producing the dist bundle. Confirms the production bundle builds correctly.

2. **Test verification**: `npx vitest run` — 476 passed, 2 failed. Both failing tests are pre-existing issues about T-17 spawn band distribution, unrelated to this work item. The `CurrentSystem.test.ts` tests (8 tests) all pass, confirming the allocation fix is correct.

3. **Probe output verification**: Read `scratch/item-implementer/perf-probe/output/probe-output-nogpu.log` — confirmed ~133 FPS across all 6 scenes with hardware acceleration. Frame loop verified running (`isLoopRunning: true`).

4. **Code impact verification**: Used codegraph to explore `CurrentSystem.velocityAt` callers and grep to verify all callers use the new output-parameter signature. No callers were missed.

## What I Could Not Verify

- **Before/after performance comparison**: I could not verify the performance impact of the allocation fix because no before-fix baseline was captured. The fix is claimed to eliminate ~14,400 allocations per second, but I cannot independently verify this claim.

- **Frame delta and entity count**: These metrics were not captured by the probe, so I could not verify them.

- **The `results.json` discrepancy**: I could not determine why the implementer left `results.json` stale. It may have been an oversight or the implementer may have run the probe multiple times and only committed the final log file.
