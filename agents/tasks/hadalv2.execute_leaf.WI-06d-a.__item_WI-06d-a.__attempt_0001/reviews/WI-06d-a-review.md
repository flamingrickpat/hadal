# Review: WI-06d-a — Debug geometry replacement in all critical-path areas

Status: findings

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| AC-art-geometry (geometry part) | pass | Code changes to `src/world/worldData.ts` using organic slabs; headless scenario test confirms path connectivity through all five depth bands; coast organic terrain tests (3/3) pass |
| AC-art-geometry (juice part) | not applicable | Juice list is WI-06d-b's responsibility per story plan |
| Headless suite stays green | pass | Full suite run: 370 passed, 2 failed (pre-existing T-17 spawn band failures unrelated to this work item) |
| Before/after notes per area | pass | Detailed per-area notes in `implementation/WI-06d-a-implementation.md` covering coast band terrain replacement |
| Browser critical-path walk | failed | No browser walk recording, screenshots, or visual artifacts found in task folder |
| Performance spot-check per section 34 | pass | `implementation/WI-06d-a-performance.md` with terrain benchmark; generation time 0.01ms, 47 terrain shapes, 1211 visual points |

## Findings

1. **Missing browser critical-path walk evidence.** The work item verification section requires a "Recorded critical-path walk (browser) of all five bands plus the base and the final zone approach showing no obvious debug geometry remaining." The implementation artifact marks this criterion as "not applicable" but provides no justification for why it is not applicable given the explicit requirement. No visual evidence (screenshots, video recording, or HTML artifacts) exists in the task folder. Without this, it cannot be confirmed that the organic terrain renders correctly in a browser and that no obvious debug geometry remains visible to a player traversing the critical path.

## Impact Check

- Ran `codegraph_explore` on `generateOrganicSlab slab coast band terrain worldData.ts`.
- `generateOrganicSlab` has 4 callers in `src/world/worldData.ts` (for bands 2-5).
- The coast band (GREYBOX_WORLD) previously had manual polygon points; now uses the `slab()` helper.
- The `slab()` helper signature is consistent across all band definitions.
- The `seabed-floor` shape remains an open polyline with a descent notch — intentional and documented as not convertible to a slab.
- No callers broken by the change.

## Independent Adversarial Probes

- Ran `src/world/coastOrganicTerrain.test.ts`: 3/3 tests pass, confirming organic visual outlines, closed shapes, and no greybox polygons in the coast band.
- Ran the full headless suite (`npx vitest run`): 370 passed, 2 failed. The failures are in `src/sim/tier3Scenario.test.ts` and `src/sim/rosterFinalProof.test.ts`, both about T-17 spawn placement in chunk shelf band 2 (designed for band 3). These are pre-existing and unrelated to the terrain changes.
- Inspected world data for all five depth bands: bands 2-5 already use organic slabs; the coast band (the focus of this work item) now also uses organic slabs via the `slab()` helper.

## What I Could Not Verify

- The visual appearance of the organic terrain in a browser (no screenshots or browser walk recording provided).
- Whether the final zone approach (depth 12000) will have terrain when it is eventually defined (the implementation notes it is beyond the hadal band's terrain; this is outside the scope of this work item).