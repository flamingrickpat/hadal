# Review: WI-07d — 60 FPS verification and fix-forward

Status: findings

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| 60 FPS target holds at 1080p in largest encounter | Not verified — see Finding 1 | `implementation/performance-report.md`, `scratch/.../perf-probe/output/results.json` |
| 60 FPS target holds in every band's representative scene | Not verified — see Finding 1 | Same as above |
| Recorded frame data (FPS / frame delta / entity count) | Partial — FPS only, no frame delta or entity count | `results.json` shows 5 FPS samples per scene; no frame delta or entity count fields |
| Fix-forward within section 34 rules if needed | Passed | Eliminated per-frame Vec2 allocations in particle stepping and current system velocity calculation |
| Node headless suite stays green | Passed | Verified independently: 476 passed, 2 failed (pre-existing T-17 spawn band failures) |
| Build stays green | Passed | Verified independently: `npx vite build` succeeds (688.33 kB bundle) |

## Findings

### Finding 1: The 60 FPS criterion is not verified — the environment limitation is assumed, not proven

**Files:** `implementation/performance-report.md`, `scratch/.../perf-probe/probe.mjs`

The implementer measured ~20-24 FPS across all six depth bands in headless Chromium with SwiftShader software GL. They correctly observe that all scenes run at similar FPS regardless of depth or encounter complexity, suggesting the bottleneck is the rendering environment rather than the game's rendering workload. They conclude the 60 FPS criterion is "blocked by environment."

However, this conclusion is an assumption, not a proven fact. The implementer did not verify that SwiftShader in this environment cannot achieve 60 FPS for any WebGL workload. A simple WebGL benchmark (e.g., rendering a rotating quad at 60 FPS) would establish whether the environment itself is the bottleneck. Without this, the criterion remains unverified rather than blocked.

**Why this matters:** The acceptance criterion AC-bal-perf is not met. The implementer should either:
1. Prove the environment limitation with a baseline WebGL benchmark, or
2. Accept that the criterion fails in the available environment and report it as a defect (possibly requiring further optimization or a different verification approach).

**Note:** The frame loop regression from the previous review has been fixed — the initial `requestAnimationFrame(frame)` call has been restored, and the FPS values vary across samples, confirming the loop is running.

### Finding 2: Frame data is incomplete — no frame delta or entity count

**File:** `scratch/.../perf-probe/output/results.json`

The work item requires "recorded frame data (FPS / frame delta / active entity count from WI-07a)." The probe records FPS (5 samples per scene), but does not capture frame delta (time between frames) or active entity count. The performance report also lacks these fields.

**Why this matters:** Frame delta would reveal stutter or frame spikes that average FPS hides. Entity count would establish the workload context for the FPS measurements. The criterion asks for all three.

## Impact Check

The changed symbols are:
- `requestAnimationFrame(frame)` call in `src/main.ts` — restores the game loop for all users
- `stepParticleType` in `src/render/particles.ts` — now takes an optional current field callback with output parameter
- `CurrentSystem.velocityAt` and field constructors in `src/systems/CurrentSystem.ts` — now write into output objects
- `Game.ts` particle callback and `Simulation.ts` velocityAt callers — updated to new signature

All changes are performance optimizations that do not alter gameplay behavior. The Node test suite confirms the changes are behaviorally correct (476 tests pass).

## Independent Adversarial Probes

- **Built the project:** `npx vite build` succeeds, producing a 688.33 kB bundle.
- **Ran the full Node test suite:** `npm test` completes with 476 passed, 2 failed (the same T-17 spawn band failures the implementer reported as pre-existing).
- **Examined the frame loop fix:** Read `src/main.ts` in full. Confirmed the initial `requestAnimationFrame(frame)` call is present at line 64. Confirmed `updateRenderFps` is called every frame at line 51.
- **Traced the allocation fix:** Examined `src/render/particles.ts` and `src/systems/CurrentSystem.ts`. Confirmed that per-frame Vec2 allocations have been eliminated by using shared temp objects (`tempPos`, `tempVel`, `tempSum`) written to in place.
- **Reviewed the probe results:** All six scenes show varying FPS values (not stuck at default), confirming the frame loop is running. The consistent ~20-24 FPS across scenes suggests an environment bottleneck.

## What I Could Not Verify

- I did not run a WebGL benchmark to verify the SwiftShader environment's 60 FPS capability. This is the missing verification that would resolve Finding 1.
- I did not inspect the actual rendering workload (draw calls, GPU utilization) to confirm whether the game's rendering is CPU-bound or GPU-bound in this environment.

## Summary

The implementer made solid progress: the game loop regression was fixed, a valid section 34 optimization was applied (eliminating per-frame allocations), and real FPS measurements were taken across all depth bands. The Node tests and build are green.

However, the 60 FPS criterion is not verified. The implementer assumes the environment is the bottleneck without proving it. The probe also does not capture frame delta or entity count as the work item requires. These are findings that prevent a "pass" verdict, but they do not indicate broken work — the implementer is close and the core optimization is correct.