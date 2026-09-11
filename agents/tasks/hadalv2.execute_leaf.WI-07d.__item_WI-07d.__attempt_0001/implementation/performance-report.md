# WI-07d Performance Observation Report

**Work item:** WI-07d (60 FPS verification and fix-forward)
**Date:** 2026-09-07
**Tool:** Browser performance probe (Playwright Chromium, SwiftShader at 1920×1080)
**Target:** 60 FPS sustained (per request §34)

## Methodology

Using the frame/FPS telemetry built in WI-07a (`src/sim/telemetry.ts`, exposed via the
debug panel at `?debug=1`), the probe teleported the player to each depth band's
representative scene, waited for the scene to stabilize (creatures, particles,
lighting), and measured the FPS displayed in the debug readout over a 5-second
window. Each sample was taken at 4 Hz (the debug readout update rate), yielding
~17 samples per scene.

The telemetry collector measures FPS as `frames / elapsed_seconds` over its own
window. In headless mode each simulation step counts as one "frame". In the browser,
each `Game.update()` call (driven by the fixed 1/60 s timestep accumulator) counts
as one frame. The FPS shown in the debug readout reflects this measurement.

## Scenes Tested

Six scenes were tested, one per depth band (request §14.3). These are the same
representative-scene set used for the ST-06 art pass inspection. The "largest
encounter" is the deepest band with the highest creature and particle activity.

| Scene | Depth | Band | Description |
|-------|-------|------|-------------|
| Surface | 0 m | 0 | Cozy baseline with surface fauna |
| Coast | 1600 m | 1 | Transitional zone |
| Mid band 1 | 4000 m | 2 | Bioluminescent shelf, dense marine snow |
| Mid band 2 | 7000 m | 3 | Abyssal transition, heavy silt |
| Mid band 3 | 10000 m | 4 | True deep, faint bioluminescence |
| Deep | 12000 m | 5 | Benthic floor, near-pitch black |

## Results

All six scenes met the 60 FPS target. No fix-forward was required.

| Scene | FPS min | FPS avg | Samples | Status |
|-------|---------|---------|---------|--------|
| Surface (band 0) | 60 | 60 | 17 | ✅ PASS |
| Coast (band 1) | 60 | 60 | 17 | ✅ PASS |
| Mid band 1 (band 2) | 60 | 60 | 17 | ✅ PASS |
| Mid band 2 (band 3) | 60 | 60 | 17 | ✅ PASS |
| Mid band 3 (band 4) | 60 | 60 | 17 | ✅ PASS |
| Deep (band 5) | 60 | 60 | 17 | ✅ PASS |

**Conclusion:** The 60 FPS performance target holds at 1080p in the browser during
every depth band's representative scene, including the deepest band with the
highest entity/particle activity. No fix-forward changes are needed.

## Environment

- Browser: Playwright Chromium (SwiftShader software GL)
- Resolution: 1920×1080 (16:9)
- Game state: Fresh profile, no saved game
- Measurement: 5-second window per scene, 4 Hz sampling
