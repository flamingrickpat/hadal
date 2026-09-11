# Review: WI-06d-a — Debug geometry replacement in all critical-path areas

Status: findings

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| AC-art-geometry (geometry part) | pass | Code changes to `src/world/proceduralTerrain.ts` and `src/world/worldData.ts`; headless scenario test confirms path connectivity through all five depth bands |
| AC-art-geometry (juice part) | not applicable | Juice list is WI-06d-b's responsibility per story plan |
| Headless suite stays green | pass | `src/world/proceduralTerrain.test.ts` (8/8), `src/world/terrain.test.ts` (7/7), `src/sim/scenarios.test.ts` (9/9) all pass; full suite 367/369 (2 pre-existing failures unrelated to this work item) |
| Before/after notes per area | pass | Detailed per-area notes in `implementation/WI-06d-a-implementation.md` covering all five bands, base, and final zone approach |
| Browser critical-path walk | failed | No browser walk recording, screenshots, or visual artifacts found in task folder |
| Performance spot-check per section 34 | pass | `implementation/WI-06d-a-performance.md` with terrain benchmark; generation time 0.01ms, 47 terrain shapes, 1211 visual points |

## Findings

1. **Missing browser critical-path walk evidence.** The work item verification section requires a "Recorded critical-path walk (browser) of all five bands plus the base and the final zone approach showing no obvious debug geometry remaining." The implementation artifact mentions the walk was performed, but no visual evidence (screenshots, video recording, or HTML artifacts) exists in the task folder. The BUILD.md documents that a Playwright Chromium binary is available for browser probes (`C:/Users/rick/AppData/Local/ms-playwright/chromium-*/chrome-win64/chrome.exe`). Without visual evidence, it cannot be confirmed that the organic terrain renders correctly in a browser and that no obvious debug geometry remains visible.

## Impact Check

- Ran `codegraph_explore` on `proceduralTerrain generateOrganicSlab worldData slab terrain`.
- `generateOrganicSlab` has 4 callers in `src/world/worldData.ts` (shelf, twilight, abyss, hadal band terrain definitions).
- `TerrainShapeDef` has 16 callers across the codebase; the change adds an optional `visual` field which is backward-compatible.
- The `slab()` helper signature was extended with an optional `band` parameter; all existing calls were updated.
- No callers were found that would be broken by the change.

## Independent Adversarial Probes

- Ran `src/world/proceduralTerrain.test.ts`: 8/8 tests pass, confirming organic shapes have more than 4 visual points, are deterministic for the same seed, vary by band, and fit within original bounds.
- Ran `src/world/terrain.test.ts`: 7/7 tests pass, confirming terrain collision resolution still works.
- Ran `src/sim/scenarios.test.ts`: 9/9 tests pass, including the critical `traverses the macro world end to end: the terrain is swimmable through every depth band` scenario, confirming path connectivity is preserved through all five bands.
- Ran the full headless suite: 367/369 tests pass (2 pre-existing failures in `src/sim/tier3Scenario.test.ts` related to T-17 spawn band assignment, unrelated to this work item).

## What I Could Not Verify

- The visual appearance of the organic terrain in a browser (no screenshots or browser walk recording provided).
- Whether the coast band terrain is considered "obvious debug geometry" (the work item says "obvious debug geometry" but the coast band has custom visual shapes that are already irregular).
- Whether the final zone approach (depth 12000) will have terrain when it is eventually defined (the implementation notes it is beyond the hadal band's terrain).
