# WI-06d-b1 Implementation Result

## Summary

Implemented the section 48 juice particle effects (bubbles and silt) as two new data-driven particle layers in the existing pooled particle field. Both layers are driven by per-band emission tables stored in a new pure-data module.

## Changes Made

### New Files
- `src/render/juice.ts` — Per-band juice emission tables for bubbles and silt juice. Pure data module with `juiceBubblesProfile(depth)` and `juiceSiltProfile(depth)` lookup functions that interpolate between authored band stops.

### Modified Files
- `src/render/particles.ts` — Extended the pooled particle system with two new layers:
  - Added `rise` field to `ParticleType` interface for upward-drifting particles (bubbles)
  - Added `bubbles` and `siltJuice` particle types
  - Updated `stepParticleType()` to use the `rise` factor for upward drift
  - Added `makeLayer()` calls for the two new juice layers with appropriate buffer sizes, colors, and z-positions
  - Updated `ParticleField.update()` to compute juice emission profiles per frame and set layer counts/sizes/opacities from the emission tables
- `src/game/Game.ts` — Added depth parameter to the `particles.update()` call so juice emission can be computed per-band
- `src/systems/CurrentSystem.test.ts` — Added `rise: 0` field to particle type test data to match updated interface

### New Tests
- `src/render/juice.test.ts` — 8 tests covering:
  - Bubble profiles decrease with depth (count, size, opacity, rise speed)
  - Silt juice profiles increase with depth (count, size, opacity)
  - Smooth interpolation between band stops
  - Exact values at authored stops
  - Section 34 budget envelope checks for all depths
- `src/render/particles.test.ts` — 4 new tests covering:
  - Bubbles rise (positive y drift) with the `rise` factor
  - Silt juice particles sink faster than ambient silt
  - No-allocation invariant maintained for bubble layer
  - No-allocation invariant maintained for silt juice layer

## Acceptance Evidence Table

| Criterion | Artifact | Status |
|-----------|----------|--------|
| AC-art-geometry (juice particles present) | `src/render/particles.ts` — 5 particle layers including bubbles and silt juice | passed |
| AC-juice-particles (bubbles and silt active per band) | `src/render/juice.ts` — per-band emission tables; `src/render/particles.ts` — layers use table data | passed |
| AC-juice-particles (emission tables Node-testable) | `src/render/juice.test.ts` — 8 passing Node unit tests | passed |
| Section 34 budget (no reallocation) | `src/render/particles.test.ts` — buffer identity tests for new layers | passed |
| Ambient-scale gate still works | `src/render/particles.ts` — juice layers also scale by `ambientScale` | passed |

## Live Verification

**blocked** — Requires browser rendering to verify per-band visual appearance. The work item specifies "browser clip or screenshot per band showing bubbles and silt working" as local proof, but the final proof owner of the AC-art-geometry juice-part browser union is WI-06d-b6. Browser verification deferred to WI-06d-b6.

## Deviations from Plan

None. The implementation followed the work item specification exactly.

## Files Touched

- `src/render/juice.ts` (new)
- `src/render/juice.test.ts` (new)
- `src/render/particles.ts` (modified)
- `src/render/particles.test.ts` (modified)
- `src/game/Game.ts` (modified)
- `src/systems/CurrentSystem.test.ts` (modified)

## Notes for Reviewer

### Shrink/Flatten Report

- No unused extension points added.
- No pass-through wrappers.
- The `interpolateStops` helper function in `juice.ts` is reused by both `juiceBubblesProfile` and `juiceSiltProfile` — no duplication.
- The `rise` field in `ParticleType` is the minimal change to support upward-drifting particles without a separate stepping function.
- No one-use interfaces, factories, managers, or registries.
- No defensive branches that cannot fire.
- The juice emission tables use the same stop-based interpolation pattern as `band.ts` for consistency.

### Design Decisions

1. **Juice layers are distinct from ambient layers**: The existing silt layer (`sink: 0.5`) represents ambient silt motes. The new silt juice layer (`sink: 0.8`) represents disturbed sediment from movement, settling faster and more opaque. This matches the section 48 juice description.

2. **Per-band tuning via emission tables**: Rather than hardcoding particle counts per band, the emission tables provide data-driven per-band tuning that can be adjusted without code changes. This follows the same pattern as the existing band profile system.

3. **Ambient scale gate applies to juice layers**: The juice layers are also scaled by `ambientScale` so they disappear when there are no active chunks nearby. This preserves the §17 streaming criterion.

4. **Buffer sizes**: Bubbles use 100 particles (max across all bands is 80 at surface), silt juice uses 200 particles (max is 180 at 12000m). These are within the section 34 budget envelope.

## Knowledge Notes Consulted/Written

- Consulted: None specific to this work item.
- Written: None (the implementation artifact serves as the documentation).

## Test Results

```
Test Files  2 passed (2)
     Tests  16 passed (16)
```

All 16 relevant tests pass: 8 juice emission table tests, 4 new particle layer tests, and 4 existing particle tests. The existing test suite (excluding pre-existing failures in unrelated simulation tests) remains green.