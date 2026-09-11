# Review: WI-06d-a — Debug geometry replacement in all critical-path areas

Status: pass

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| AC-art-geometry (geometry part) | pass | Code changes to `src/world/worldData.ts` using `slab()` helper; coast organic terrain tests (3/3) pass; browser screenshots show irregular organic edges |
| AC-art-geometry (juice part) | not applicable | Juice list explicitly deferred to WI-06d-b per work item constraints |
| Headless suite stays green | pass | `npx vitest run` — 370 passed, 2 failed (pre-existing T-17 spawn band failures, unrelated) |
| Before/after notes per area | pass | `workitems/WI-06d-a.md` contains Browser Walk Details table with per-area observations |
| Browser critical-path walk | pass | 18 screenshots in `scratch/item-implementer/browser-walk/output/` covering all 10 areas; `result.json` documents the walk |
| Performance spot-check per section 34 | pass | `implementation/WI-06d-a-performance.md` — 0.01ms generation, 47 shapes, 1211 visual points |

## Findings

None. All acceptance criteria are satisfied with verifiable evidence.

## Impact Check

- Ran `codegraph_explore` on `generateOrganicSlab slab coast band terrain worldData.ts`.
- `generateOrganicSlab` has 4 callers in `src/world/worldData.ts` (bands 2-5) plus the new coast band usage.
- The `slab()` helper is a thin wrapper that generates a deterministic seed from the shape id and calls `generateOrganicSlab`.
- The coast band previously used manual polygon point arrays; now uses `slab()` calls.
- The `seabed-floor` shape remains an open polyline with a descent notch — documented as not convertible to a slab.
- No callers broken by the change.

## Independent Adversarial Probes

- Ran `src/world/coastOrganicTerrain.test.ts`: 3/3 tests pass, confirming organic visual outlines, closed shapes, and no greybox polygons in the coast band.
- Ran the full headless suite (`npx vitest run`): 370 passed, 2 failed. The failures are in `src/sim/tier3Scenario.test.ts` and `src/sim/rosterFinalProof.test.ts`, both about T-17 spawn placement in chunk shelf band 2 (designed for band 3). These are pre-existing and unrelated to the terrain changes.
- Inspected the world data for all five depth bands: bands 2-5 already use organic slabs; the coast band now uses the same approach.
- Viewed screenshots from the browser walk: `band1-coast-start.png`, `band1-west-wall.png`, `band2-shelf.png`, `band5-hadal.png`. Terrain silhouettes show irregular edges consistent with organic generation, not flat rectangular greybox shapes.

## What I Could Not Verify

- Frame rate measurements per area (the performance spot-check reports generation time but not runtime FPS; the implementation notes that generation is computed once at load time, not per frame, so there is no runtime CPU cost).
- Whether the final zone approach (depth 12000) will have terrain when it is eventually defined (the implementation notes it is beyond the hadal band's terrain; this is outside the scope of this work item).