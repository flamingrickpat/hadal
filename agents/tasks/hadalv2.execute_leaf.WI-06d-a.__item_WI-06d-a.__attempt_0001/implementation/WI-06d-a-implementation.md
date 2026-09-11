# Implementation: WI-06d-a — Debug geometry replacement in all critical-path areas

## Status: done

## Work Performed

Replaced all obvious debug geometry (flat-colored rectangular slabs) in the five depth bands with band-consistent organic terrain. The terrain now has irregular, organic outlines that vary by depth band, while preserving the original rectangular collision shapes to maintain path connectivity.

### Changes Made

1. **Created `src/world/proceduralTerrain.ts`**: A procedural terrain generator that creates organic slab shapes with irregular edge detail. The generator uses a seeded PRNG for deterministic output and varies the roughness based on the depth band (deeper bands have more irregular terrain).

2. **Modified `src/world/worldData.ts`**: Updated the `slab()` helper function to generate organic terrain shapes with the `generateOrganicSlab()` function. Each terrain slab now has:
   - `points`: The original rectangular collision shape (4 points) — unchanged for collision compatibility
   - `visual`: An organic outline with jitter (8-48 points) — the new rendered silhouette

3. **Created `src/world/proceduralTerrain.test.ts`**: Tests for the procedural terrain generator, verifying:
   - Organic shapes have more than 4 visual points
   - Deterministic output for the same seed
   - Band-varying edge detail
   - Shapes fit within the original slab bounds

### Terrain Generation Details

- Band 1 (coast): 3-8 edge segments, 0.15 roughness
- Band 2 (shelf): 3-8 edge segments, 0.2 roughness
- Band 3 (twilight): 3-8 edge segments, 0.25 roughness
- Band 4 (abyss): 3-8 edge segments, 0.3 roughness
- Band 5 (hadal): 3-8 edge segments, 0.35 roughness

Each segment adds 1-4 organic vertices, creating 12-56 total visual points per slab.

### Juice List Status (Section 48)

- ✅ **Parting schools**: Implemented in `ecology.ts` (PART_RADIUS = 300)
- ✅ **Silt particles**: Implemented in `particles.ts` (siltCount profile)
- ⏳ **Bubbles from acceleration**: Not implemented (separate WI)
- ⏳ **Light sway with acceleration**: Not implemented (separate WI)
- ⏳ **Depth-record tick**: Not implemented (separate WI)
- ⏳ **Distant-motion impulse**: Not implemented (separate WI)

## Test Results

- `proceduralTerrain.test.ts`: 8/8 tests pass
- `scenarios.test.ts`: 9/9 tests pass (all traversal scenarios succeed)
- `terrain.test.ts`: 7/7 tests pass
- Two pre-existing test failures in `rosterFinalProof.test.ts` and `tier3Scenario.test.ts` (T-17 spawn band assignment issue, unrelated to this work item)

## Evidence

The headless scenario `traverses the macro world end to end: the terrain is swimmable through every depth band` confirms that the organic terrain preserves path connectivity through all five depth bands. The scenario swims through the coast, shelf, twilight, abyss, and hadal bands, reaching the deepest point at depth ~9670.

## Files Changed

- `src/world/proceduralTerrain.ts` (new)
- `src/world/proceduralTerrain.test.ts` (new)
- `src/world/worldData.ts` (modified)