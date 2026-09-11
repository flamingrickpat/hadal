# Review: WI-07d — 60 FPS verification and fix-forward

Status: findings

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| 60 FPS target holds at 1080p in largest encounter | Passed | 133 FPS in deep band 5 (largest encounter) at 1920x1080, hardware-accelerated WebGL. Probe output at `scratch/item-implementer/perf-probe/output/results.json`. |
| 60 FPS target holds in every band's representative scene | Passed | All 6 depth band scenes achieve 123-134 FPS, well above the 60 FPS target. Same probe output. |
| Recorded frame data (FPS / frame delta / entity count) | Passed | FPS, frame delta, and active entity count recorded for all 6 scenes with 5 samples each via WI-07a's telemetry endpoint. |
| Fix-forward within section 34 rules | Passed | Eliminated per-frame Vec2 allocations in particle stepping and current system velocity calculations. |
| Before/after frame data for fix-forward | Failed | No before/after frame data provided for the allocation fix. Only after-fix measurements exist. |
| Node headless suite stays green | Passed | telemetry tests pass (2/2). Pre-existing failures in `rosterFinalProof.test.ts` and `tier3Scenario.test.ts` (T-17 spawn band distribution) are unrelated to this work item. |
| Build stays green | Passed | `npx vite build` succeeds (222ms). |

## Findings

1. **Missing before/after frame data for the fix-forward change.** The work item specification requires that fix-forward changes be "evidenced with before/after frame data." The implementer applied a fix (eliminating per-frame allocations in `src/render/particles.ts` and `src/systems/CurrentSystem.ts`) and claims it eliminates ~14,400 allocations per second at 60 FPS, but only after-fix measurements exist. No before-fix baseline was captured. The implementer argues that the game already exceeds the 60 FPS target without the fix, so no fix-forward was *needed* — but the fix was still applied, and the spec's language about before/after data applies to "any fix." Either the implementer should have captured before/after data, or the fix should have been documented as a proactive optimization (not a fix-forward) with a rationale for why it's worth making when the target is already met by a wide margin.

## Impact Check

- **`CurrentSystem.velocityAt` signature change**: The method now writes into an output parameter (`out`) instead of returning a value. Verified via codegraph and grep that all 6 callers in production code (`src/sim/Simulation.ts`, `src/game/Game.ts`) and all callers in tests (`src/systems/CurrentSystem.test.ts`) have been updated to the new signature. The shared temp object pattern is safe because `velocityAt` is synchronous and does not retain the position object.
- **`particles.ts` allocation fix**: Uses shared temp objects (`tempPos`, `tempVel`) for the particle step loop. Safe because `stepParticleType` is called synchronously per frame and the current field calculation is also synchronous.
- **`src/sim/telemetry.ts` additions**: The `frameDelta` and `activeEntityCount` fields and `onFrame()` method are additive. No existing callers depend on the previous shape of `TelemetrySnapshot`.
- **`src/game/Game.ts` getter**: The `get simulation()` getter exposes the internal simulation object. Used by the telemetry code in `src/main.ts` to call `onFrame()`. Low risk, but slightly increases coupling.

## Independent Adversarial Probes

I ran the following verification commands:

1. **Build verification**: `npx vite build` — succeeded in 222ms, producing the dist bundle. Confirms the production bundle builds correctly.
2. **Test verification**: `npx vitest run` — 476 passed, 2 failed. Both failing tests are pre-existing issues about T-17 spawn band distribution, unrelated to this work item.
3. **Focused test verification**: `npx vitest run src/render/particles.test.ts src/systems/CurrentSystem.test.ts src/sim/telemetry.test.ts` — all 18 tests pass.
4. **Probe output verification**: Read `scratch/item-implementer/perf-probe/output/results.json` — confirmed all 6 scenes pass the 60 FPS target at 1920x1080 with hardware acceleration. Frame loop verified running (`isLoopRunning: true`).
5. **Code impact verification**: Used codegraph to explore `CurrentSystem.velocityAt` callers and grep to verify all callers use the new output-parameter signature. No callers were missed.

## What I Could Not Verify

- **Before/after performance comparison**: I could not verify the performance impact of the allocation fix because no before-fix baseline was captured. The fix is claimed to eliminate ~14,400 allocations per second, but I cannot independently verify this claim.
- **Live performance under load**: The probe measures performance with hardware acceleration, but I cannot verify how the game performs on lower-end hardware or with a GPU struggling to maintain 60 FPS at 1080p. The spec targets 1080p browser performance, which is what was measured.
- **Large-creature reveal stutter**: The spec mentions "a stuttering large-creature reveal is a hard defect." I cannot verify this without a live browser session where I can observe the reveal animation. The telemetry measurements show the FPS is well above target in the largest encounter scene, which suggests the reveal is not stuttering.

## Assumptions

- I assumed the pre-existing test failures in `rosterFinalProof.test.ts` and `tier3Scenario.test.ts` are unrelated to this work item. I verified that the failures reference T-17 spawn band distribution, which is not part of the rendering or particle systems that were changed in this work item.
- I assumed the headless Chromium browser with hardware acceleration is representative of the target 1080p browser environment. The spec does not mandate a specific browser, only "the browser" at 1080p. The probe output explicitly uses hardware-accelerated WebGL, which is the standard for modern desktop browsers.
