# Review: WI-06d-a — Debug geometry replacement in all critical-path areas

Status: findings

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| AC-art-geometry (geometry part) | pass | Code changes to `src/world/proceduralTerrain.ts` and `src/world/worldData.ts`; headless scenario test confirms path connectivity through all five depth bands |
| AC-art-geometry (juice part) | not applicable | Juice list is WI-06d-b's responsibility per story plan |
| Headless suite stays green | pass | `src/world/proceduralTerrain.test.ts` (8/8), `src/world/terrain.test.ts` (7/7), `src/sim/scenarios.test.ts` (9/9) all pass |
| Before/after notes per area | failed | No before/after notes per area found in implementation artifact or task folder |
| Browser critical-path walk | failed | No browser walk recording or screenshots found; only headless tests run |
| Performance spot-check per section 34 | failed | No performance measurements recorded |

## Findings

1. **Missing before/after notes per area.** The work item deliverables require "A recorded inventory walk of every critical-path area with before/after notes per area. Each note names the area (internal id), the debug geometry found, the replacement applied, and the band-consistency rationale." The implementation artifact provides a high-level summary but does not include the required per-area before/after notes with section 14.3 rationale.

2. **No browser critical-path walk evidence.** The verification section requires a "Recorded critical-path walk (browser) of all five bands plus the base and the final zone approach showing no obvious debug geometry remaining." The implementation only ran headless tests. While the headless `traverses the macro world end to end` scenario confirms path connectivity, it does not visually verify that debug geometry has been replaced.

3. **No performance spot-check.** The verification section requires a "performance spot-check per section 34" with frame rate recorded per area. The implementation artifact does not include any performance measurements.

4. **Coast band terrain not updated to use organic generator.** The coast band (band 1) terrain slabs (`seabed-floor`, `west-wall-slab`, `wall-slab`, `ridge-slab`, `seal-slab`) are defined inline with custom `visual` arrays and do not use the `slab()` helper. While they already have custom visual shapes (not "obvious debug geometry"), they were not updated to use the organic terrain generator. This may be intentional, but it's worth noting that the coast band terrain is visually different in approach from the other four bands.

5. **Base and final zone approach not explicitly covered.** The implementation focuses on the five depth bands but does not explicitly mention the base or the final zone approach in its evidence. The base is defined in `src/world/worldData.ts` but has no terrain slabs. The "final zone approach" (depth 12000 per `src/render/band.test.ts`) is beyond the hadal band's terrain (y -10000 to -10400), so it's unclear whether this area has terrain that needed updating.

## Impact Check

- Ran `codegraph_explore` on `proceduralTerrain generateOrganicSlab worldData slab`.
- `generateOrganicSlab` has 3 callers in `src/world/worldData.ts` (the shelf, twilight, abyss, and hadal band terrain definitions).
- `TerrainShapeDef` has 16 callers across the codebase; the change adds an optional `visual` field which is backward-compatible.
- The `slab()` helper signature was extended with an optional `band` parameter; all existing calls were updated to pass the band number.
- No callers were found that would be broken by the change.

## Independent Adversarial Probes

- Ran `src/world/proceduralTerrain.test.ts`: 8/8 tests pass, confirming organic shapes have more than 4 visual points, are deterministic for the same seed, vary by band, and fit within original bounds.
- Ran `src/world/terrain.test.ts`: 7/7 tests pass, confirming terrain collision resolution still works.
- Ran `src/sim/scenarios.test.ts`: 9/9 tests pass, including the critical `traverses the macro world end to end: the terrain is swimmable through every depth band` scenario, confirming path connectivity is preserved through all five bands.
- Inspected the coast band terrain in `src/world/worldData.ts`: the coast band uses inline terrain definitions with custom `visual` arrays, not the `slab()` helper.

## What I Could Not Verify

- The visual appearance of the organic terrain in a browser (no screenshots or browser walk recording provided).
- The performance impact of the organic terrain generation (no frame rate measurements provided).
- Whether the coast band terrain is considered "obvious debug geometry" or not (the work item says "obvious debug geometry" but the coast band has custom visual shapes).
- Whether the base and final zone approach have terrain that needed updating (the base has no terrain slabs; the final zone approach at depth 12000 is beyond the hadal band's terrain).
