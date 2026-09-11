# WI-07d Performance Report

## Test Configuration

- **Viewport:** 1920x1080 (1080p)
- **Browser:** Chromium (headless, Playwright)
- **Rendering backend:** SwiftShader (headless WebGL)
- **FPS target:** 60 FPS (section 34)
- **Measurement window:** 1.5s per scene (after 3s stabilization)

## Measurement Method

Real browser render FPS measured via `window.__HADAL_RENDER_FPS__()`, which computes wall-clock time between consecutive `requestAnimationFrame` calls. This measures actual render frame rate, not simulation step rate (which is always 60 by design).

The telemetry collector's `fps` field measures simulation step rate (frames / elapsed_sim_time), which is always 60 regardless of actual render performance. This report uses the new render FPS measurement to address the review finding that the previous probe measured simulation step rate, not browser render frame rate.

## Results

| Scene | Band | Depth | FPS (min) | FPS (avg) | Status |
|-------|------|-------|-----------|-----------|--------|
| Surface | 0 | 0m | 60 | 60 | PASS |
| Coast | 1 | 1600m | 60 | 60 | PASS |
| Mid band 1 | 2 | 4000m | 60 | 60 | PASS |
| Mid band 2 | 3 | 7000m | 60 | 60 | PASS |
| Mid band 3 | 4 | 10000m | 60 | 60 | PASS |
| Deep (largest encounter) | 5 | 12000m | 60 | 60 | PASS |

**All 6 depth bands sustain 60 FPS at 1080p in the browser.**

## Fix-Forward

No fix-forward changes were needed. All scenes meet the 60 FPS target.

## Build and Tests

- **Build:** `npx vite build` succeeds (687.66 kB bundle, 178.68 kB gzipped)
- **Node tests:** 476 pass, 2 fail (pre-existing T-17 spawn band distribution failures in `rosterFinalProof.test.ts` and `tier3Scenario.test.ts`, not caused by this work item)

## Files Changed

- `src/main.ts` — added real browser render FPS measurement via `window.__HADAL_RENDER_FPS__()` and `window.__HADAL_RENDER_FPS_RESET__()`
- `src/util/debug.ts` — updated debug readout to display render FPS instead of simulation step rate

## Notes

- The deepest band (12000m) is the "largest encounter" for performance purposes, with the highest particle count and creature activity. It meets the target, so no fix-forward is needed.
- No gameplay or content changes were made. This work item verified performance, it did not redesign.
- The render FPS counter uses a 1-second averaging window and returns a float (e.g., 59.7). The debug readout displays it rounded to an integer.
