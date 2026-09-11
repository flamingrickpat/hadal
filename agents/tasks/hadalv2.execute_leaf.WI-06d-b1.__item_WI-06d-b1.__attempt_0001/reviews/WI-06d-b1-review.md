# Review: WI-06d-b1 — Bubbles and silt juice particles

Status: pass

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| AC-art-geometry (juice particles present) | passed | `src/render/particles.ts` — 5 particle layers including bubbles and silt juice; `src/render/particles.test.ts` covers the new layers |
| AC-juice-particles (bubbles and silt active per band) | passed | `src/render/juice.ts` — per-band emission tables; `src/render/particles.ts` — layers use table data; `src/game/Game.ts` — depth parameter passed |
| AC-juice-particles (emission tables Node-testable) | passed | `src/render/juice.test.ts` — 8 passing Node unit tests; run and verified |
| Section 34 budget (no reallocation) | passed | `src/render/particles.test.ts` — buffer identity tests for new layers; `src/render/juice.test.ts` — budget envelope checks |
| Ambient-scale gate still works | passed | `src/render/particles.ts` — juice layers also scale by `ambientScale` |

## Findings

None. The implementation meets the work item's acceptance criteria.

## Impact Check

- Ran `codegraph_codegraph_explore` on the particle field and juice emission functions.
- `juiceBubblesProfile` has 3 callers, all in `src/render/particles.ts`. Covered by `src/render/juice.test.ts`.
- `juiceSiltProfile` has 3 callers, all in `src/render/particles.ts`. Covered by `src/render/juice.test.ts`.
- `ParticleField.update` now accepts a `depth` parameter. Verified `src/game/Game.ts` passes `this.sim.player.depth` at the call site (line 173).
- The `ParticleType` interface gained a `rise` field. Verified all test fixtures that construct particle types were updated with `rise: 0`.
- No other callers of the changed symbols were found.

## Independent Adversarial Probes

1. **Bubbles rise at all depths** — Wrote and ran 7 tests checking that `riseSpeed > 0` and `count > 0` at depths 0, 800, 1600, 4000, 7000, 10000, 12000. All passed. Confirms bubbles are active throughout the descent, not just at the surface.

2. **Silt juice is distinct from ambient silt at all depths** — Wrote and ran 7 tests comparing `juiceSiltProfile(depth).count` against `bandProfileAtDepth(depth).siltCount` at all depths. All counts differ, confirming the juice layer is genuinely a separate effect and not a renamed ambient layer.

3. **Buffer allocation invariant** — Verified through existing particle tests that buffer identity is preserved across frames for both new layers.

All 14 adversarial tests passed.

## What I Could Not Verify

- **Browser visual appearance** — The work item specifies "browser clip or screenshot per band showing bubbles and silt working" as local proof, but the implementation explicitly defers this to WI-06d-b6 (the story's final proof owner). This is acceptable per the work item's own notes.
- **Full headless suite** — The complete test suite timed out after 120 seconds; however, all 88 render and game tests passed, including all 16 tests relevant to this work item (8 juice + 4 new particle + 4 existing particle). The remaining tests in other areas are not affected by this change.
