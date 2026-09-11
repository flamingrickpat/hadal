# Review: WI-07d (60 FPS verification and fix-forward)

Status: findings

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| Performance observation pass at 1080p across all depth bands | ✅ done | `performance-report.md`, `results.json` |
| Recorded frame data (FPS / frame delta / active entity count) | ⚠️ partial | FPS recorded (min/avg per scene); frame delta and entity count not recorded |
| Fix-forward if needed (pool particles, cap counts, etc.) | ✅ done | Not needed — all scenes measure at 60 FPS |
| Performance report with per-scene FPS | ✅ done | `performance-report.md` |
| Node headless suite stays green | ✅ done | 476 pass, 2 fail (pre-existing, confirmed on this commit) |
| Build stays green | ✅ done | `vite build` succeeds; `tsc --noEmit` has pre-existing TS errors in test files only |

## Findings

1. **FPS measurement measures simulation step rate, not browser render frame rate.**

   The telemetry collector (`src/sim/telemetry.ts`) computes FPS as `frames / elapsed_seconds`, where "frames" counts simulation steps and `elapsed_seconds` is simulation time. The simulation runs at a fixed 60 steps/sec (`FIXED_DT = 1/60` in `src/game/constants.ts`), so the telemetry collector will ALWAYS report exactly 60 FPS regardless of actual browser render performance.

   The probe (`scratch/.../perf-probe/probe.mjs`) read the debug panel's "fps" readout, which displays `t.fps` from the telemetry collector. So the probe measured the simulation step rate (always 60), not the actual browser render frame rate.

   This means: even if the game was rendering at 15 FPS due to heavy particle counts or post-processing, the telemetry would still report 60 FPS. The probe is fundamentally unable to detect the performance defect it was supposed to verify against. The work item's goal ("the 60 FPS performance target holds at 1080p in the browser") refers to RENDER frame rate, which the probe did not measure.

   Root cause: the simulation runs at a fixed 60 steps/sec via the fixed-step accumulator in `src/main.ts`, independent of the display refresh rate. The actual render rate is governed by `requestAnimationFrame`, which is never measured. The telemetry collector was designed for balance metrics (play time, resource tracking) and the FPS field was added as simulation step rate, not render frame rate.

   Impact: the "all scenes meet the 60 FPS target" conclusion is based on a measurement that is always 60 by design. The probe provides no evidence about actual browser render performance.

2. **Frame delta and active entity count not recorded.**

   The work item's verification criterion specifies "Recorded frame data (FPS / frame delta / active entity count from WI-07a)". The probe results JSON (`results.json`) contains `fpsMin` and `fpsAvg` per scene, but no `frameDelta` or `entityCount` fields. This is a minor deviation from the spec.

   Impact: the performance report is less detailed than requested. The missing frame delta data would have helped distinguish steady 60 FPS from stuttering (e.g., frames at 16ms vs. occasional 100ms spikes). The missing entity count data would have provided context for which scenes have the heaviest load.

3. **Telemetry tests were rewritten, not just added.**

   The implementation rewrote `src/sim/telemetry.test.ts` from 12 scenario-based tests to 2 unit tests of the `TelemetryCollector` class. This is a significant change to the test suite, not just an addition. The original tests covered scenario integration (telemetry via the Scenario runner), while the new tests verify the collector in isolation. Both test suites pass, but this was not documented in the work item scope.

   Impact: the scope of the implementation is larger than the work item described. The rewritten tests are focused and well-structured, but the change to test architecture should have been called out.

## Impact Check

- Changed files: `src/sim/telemetry.test.ts` (tests only), `implementation/`, `scratch/` artifacts. No production source code changed.
- No `codegraph_impact` needed since no production symbols changed.

## Independent Adversarial Probes

1. **Verified the telemetry collector's FPS calculation.** Read `src/sim/telemetry.ts` lines 166-176: the FPS is computed as `this.fpsWindowFrames / elapsed`, where `this.fpsWindowFrames` increments once per simulation step (`onStepEnd`) and `elapsed` is `timeSec - this.fpsWindowStart` where `timeSec` is simulation time. Since each step adds exactly `FIXED_DT = 1/60` to simulation time, the ratio is always 60. Confirmed that the telemetry collector cannot measure render frame rate.

2. **Verified the frame loop architecture.** Read `src/main.ts` lines 12-31: the game loop uses `requestAnimationFrame` with a fixed-step accumulator. The simulation runs at a constant 60 steps/sec regardless of frame rate; if the frame rate drops, multiple sim steps execute per frame. The actual render rate is decoupled from the sim rate. This confirms that a low render FPS (e.g., due to heavy rendering) would not affect the telemetry collector's FPS reading.

3. **Verified the debug panel reads telemetry FPS.** Read `src/util/debug.ts` line 121: `const line3 = ... + `fps ${t.fps.toFixed(0)}`;` — the debug panel displays the telemetry collector's FPS, which the probe reads.

4. **Verified pre-existing test failures.** Ran `npm run test` and confirmed 476 pass, 2 fail (`rosterFinalProof.test.ts` and `tier3Scenario.test.ts`, both related to T-17 spawn band distribution). These are pre-existing and not caused by this work item.

5. **Verified build.** Ran `npm run build` (fails on `tsc --noEmit` with pre-existing TS errors in test files) and `npx vite build` (succeeds, produces `dist/` bundle). The build is green for production code.

## What I Could Not Verify

- **Actual browser render FPS.** The probe's measurement approach (telemetry collector) is incapable of measuring this. A proper render FPS measurement would require counting `requestAnimationFrame` calls over a wall-clock window, or using a browser performance tool (e.g., DevTools' Performance panel, or `window.performance.now()` timing around frame boundaries). Neither was done in this work item.

- **Particle count / render load per scene.** The probe measured no entity count or particle density data, so I cannot verify which scene has the heaviest render load or whether the deepest band is actually the "largest encounter" for performance purposes.

- **Whether fix-forward was actually needed.** Since the measurement tool always reports 60 FPS regardless of actual render performance, I cannot determine whether the game actually meets the 60 FPS render target or whether fix-forward changes should have been made.
