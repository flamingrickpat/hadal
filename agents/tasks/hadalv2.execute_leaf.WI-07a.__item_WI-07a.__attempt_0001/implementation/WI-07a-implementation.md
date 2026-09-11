# WI-07a — Implementation Result

**Work item:** WI-07a (Section 71 balance telemetry and headless export)
**Implemented by:** implementer role
**Date:** 2026-09-07

## Acceptance Evidence

| Criterion | Artifact | Status |
|-----------|----------|--------|
| Shared Telemetry collector (`src/sim/telemetry.ts`) | New module | ✅ done |
| Per-frame / FPS sampler | `TelemetryCollector` frame/FPS tracking | ✅ done |
| Browser debug panel extended readout | `src/util/debug.ts` `tick()` | ✅ done |
| Headless surface (`scenario.telemetry()`) | `src/sim/scenario.ts` `telemetry()` method | ✅ done |
| One typed field schema shared by both surfaces | `TelemetrySnapshot` interface | ✅ done |
| Node test: headless scenario export has all fields | `src/sim/telemetry.test.ts` (9 tests) | ✅ done |
| Node test: schema parity (identical keys) | `src/sim/telemetry.test.ts` "telemetry keys match browser schema" | ✅ done |

## Files Changed

- `src/sim/telemetry.ts` (new) — the shared `TelemetryCollector` and `TelemetrySnapshot` interface
- `src/sim/Simulation.ts` — integrated telemetry into the step loop (onStepStart, onStepEnd, onTriggerFired)
- `src/sim/scenario.ts` — added `telemetry()` export method
- `src/game/Game.ts` — added `telemetry()` method to satisfy `DebugPanelHost`
- `src/util/debug.ts` — extended 4 Hz readout with extended section 71 fields
- `src/sim/telemetry.test.ts` (new) — 9 headless tests

## Design Notes

- The `TelemetryCollector` is a pure observer of the simulation — it reads existing state (inventory, banked, maxDepth, etc.) and never modifies gameplay.
- Delta tracking for resource collection/spending uses snapshot comparisons at step boundaries.
- Frame/FPS data is sampled at each simulation step (headless) — one step = one "frame" for telemetry purposes. In the browser, each simulation update counts.
- The debug panel readout shows: position/depth/O2/HP on line 1, time/zone/maxDepth/deaths on line 2, upgrades/FPS on line 3. Internal IDs only, no creature names.

## Deviations from Plan

None.

## Notes for Reviewer

- Pre-existing test failures (2) in `rosterFinalProof.test.ts` and `tier3Scenario.test.ts` about tier-3 spawn band distribution — not related to this work item.
- The schema parity test asserts that the headless export key set equals the browser collector key set by enumerating the expected keys explicitly. This validates that both surfaces share one field list.
- Frame count and FPS are tracked per simulation step (headless). For browser use, each `update()` call counts one frame. This may differ slightly from requestAnimationFrame-based FPS, but is sufficient for the telemetry use case (WI-07b, WI-07c, WI-07d).

## Shrink/Flatten Report

Considered:
- The telemetry collector is the minimum abstraction required — it has two real users (browser debug panel + headless scenario export) which satisfies the Rule of Two.
- No pass-through wrappers, one-use interfaces, or defensive branches removed — the implementation is already tight.
- No files removed or merged.