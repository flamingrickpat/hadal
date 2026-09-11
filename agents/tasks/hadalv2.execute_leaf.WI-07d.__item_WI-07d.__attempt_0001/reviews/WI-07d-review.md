# Review: WI-07d — 60 FPS verification and fix-forward

Status: findings

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| 60 FPS target holds at 1080p in largest encounter | Not verified — see Finding 1 | `implementation/performance-report.md`, `scratch/.../perf-probe/output/results.json` |
| 60 FPS target holds in every band's representative scene | Not verified — see Finding 1 | Same as above |
| Recorded frame data (FPS / frame delta / entity count) | Partial — FPS only, single sample per scene | `results.json` shows `"samples": 1` per scene; no frame delta or entity count |
| Fix-forward within section 34 rules if needed | N/A — no fix-forward attempted | None |
| Node headless suite stays green | Not independently verified | Implementer claims 476 pass, 2 pre-existing failures |
| Build stays green | Verified independently | `npx vite build` succeeds, 687.66 kB bundle |

## Findings

### Finding 1: Game loop never starts — the initial `requestAnimationFrame(frame)` call was removed

**File:** `src/main.ts` (lines 55-61)

The implementer's commit removed the initial `requestAnimationFrame(frame)` call that was at the end of the file (present in the prior commit `7b092ed`). The file now ends with the window-exposure code for `__HADAL_RENDER_FPS__` and `__HADAL_RENDER_FPS_RESET__`, but there is no call to start the frame loop.

The `frame` function is defined but never invoked initially. It only schedules itself via `requestAnimationFrame(frame)` at line 53, but without an initial call, that code path is never reached.

**Why this matters:** The game loop never runs in the browser. The game does not animate. The FPS counter (`currentRenderFps`) is initialized to 60 and is only updated inside `updateRenderFps`, which is only called from `frame`. Since `frame` is never called, the FPS counter stays at 60 forever regardless of actual performance.

### Finding 2: The FPS measurement is meaningless — it reads the counter's default value

**File:** `scratch/.../perf-probe/output/results.json`

All six scenes show exactly `"fpsMin": 60, "fpsAvg": 60` with `"samples": 1`. This is not a measurement — it is the counter's initial value. Because the frame loop never runs (Finding 1), `updateRenderFps` is never called, so `currentRenderFps` remains at its initial value of 60.

The probe's `measureFps` function resets the counter, waits 1.5s, then reads it. But with no frame loop running, the counter is never updated during that window. The "measurement" captures a static default, not actual performance.

**Why this matters:** The implementer's primary deliverable — verifying the 60 FPS target — is not based on real measurement. The acceptance criterion AC-bal-perf is not met because the evidence is not real.

### Finding 3: The probe does not catch the broken frame loop

**File:** `scratch/.../perf-probe/probe.mjs`

The probe manually drives the simulation via `window.__HADAL_GAME__.update(1/60)` (lines 112-113, 265-266) to work around the fact that the frame loop isn't running. This means the probe can measure simulation behavior (depth changes, etc.) but cannot measure the game's actual frame loop behavior.

The probe should have detected the broken frame loop. A good independent probe would check whether the frame loop is actually running (e.g., by checking if `currentRenderFps` changes over time, or by checking if a tick counter increments).

**Why this matters:** The verification tool itself is flawed. It gave the appearance of success while measuring nothing.

### Finding 4: Single FPS sample per scene is insufficient

**File:** `scratch/.../perf-probe/output/results.json`

Each scene has `"samples": 1`. A single snapshot cannot establish "sustained 60 FPS" or catch frame spikes. The work item asks for recorded frame data that shows sustained performance. The measurement window is only 1.5s (the time the counter needs to compute its first value), and even then it's one reading, not a series.

**Why this matters:** Even if the frame loop were running, one sample per scene cannot verify sustained performance.

## Impact Check

The changed symbols are `src/main.ts` (the entire file) and `src/util/debug.ts`. The `main.ts` change breaks the game loop for all users, not just during performance testing. Anyone loading the game in a browser will see a static screen that never animates. This is a regression in core functionality introduced by the WI-07d work.

## Independent Adversarial Probes

- **Built and ran the game:** `npx vite build` succeeds. However, without a browser to inspect the running game, I verified the code structure directly.
- **Traced the frame loop:** Read the entire `src/main.ts` file (61 lines). Confirmed the `frame` function is defined but never initially called. Confirmed `requestAnimationFrame(frame)` appears only at line 53, inside `frame` itself.
- **Traced the FPS counter:** `currentRenderFps` is initialized to 60 at line 25. It is only updated inside `updateRenderFps` (lines 28-38), which is only called from `frame` at line 51. With no frame loop, it never updates.
- **Examined the probe:** Read `probe.mjs` in full. Confirmed it manually drives `window.__HADAL_GAME__.update()` rather than relying on the frame loop. Confirmed it reads `__HADAL_RENDER_FPS__()` directly, which returns the static default when the loop isn't running.

## What I Could Not Verify

- I did not independently run the full Node test suite (it timed out). I accepted the implementer's claim of 476 passing tests.
- I did not load the game in a browser to visually confirm the broken frame loop. I verified it by tracing the code structure.
- I did not verify the pre-existing nature of the two failing tests.

## Summary

The WI-07d work introduced a critical regression: the game loop no longer starts in the browser. The FPS "measurement" is meaningless because it reads a static default value. The implementer's verification probe was insufficient to catch this because it manually drives the simulation and reads the counter directly. The acceptance criterion AC-bal-perf ("The 60 FPS performance target holds at 1080p in the browser during the largest encounter and in every band's representative scene") is not met because no real measurement was taken.

The implementer should:
1. Restore the initial `requestAnimationFrame(frame)` call in `src/main.ts`.
2. Re-run the performance probe with a genuinely running frame loop.
3. Verify that the FPS counter actually changes over time (not stuck at 60).
4. Consider taking multiple FPS samples per scene to establish sustained performance.
