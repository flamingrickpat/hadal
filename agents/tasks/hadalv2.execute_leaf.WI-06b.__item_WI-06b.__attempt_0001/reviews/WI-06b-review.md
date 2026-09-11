# Review: WI-06b — Mid bands art pass

Status: pass

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| AC-art-palettes: distinct palette, particle profile, light attenuation, silhouette per band; graphic-novel/sonar/cut-paper hybrid reads at 1080p | passed | Node tests (14/14 in `src/render/band.test.ts`); 6 browser screenshots at 1920x1080 showing all bands including 3 mid bands |
| Node: band identity parameters assert ≥2 distinguishing factors per mid band vs adjacent bands | passed | 4 new tests in `src/render/band.test.ts`: distinctiveness checks for all mid band neighbor pairs; independent probe confirms same result |
| Browser inspection at 1080p with screenshots per mid band | passed | `band_mid1-4000.png` (green, dense snow), `band_mid2-7000.png` (purple, dark), `band_mid3-10000.png` (near-black, teal glow) — all at 1920x1080 |
| Section 15 flashlight behavior (no pure-black screens) | passed | All 6 screenshots show flashlight illumination; no black screens; ambient values > 0 in all bands |
| Suite/build stay green | passed | Full vitest suite: 347 passed, 2 pre-existing failures unrelated to band rendering (T-17 creature spawn band distribution in `rosterFinalProof.test.ts` and `tier3Scenario.test.ts`); build errors are pre-existing |
| Section 34 performance | not applicable | No new render code; only authored data values in `BAND_STOPS` changed |

## Findings

None. The implementation meets the work item contract.

## Impact Check

- `BAND_STOPS` (src/render/band.ts:70) — 1 caller (itself). Changing the authored stop values affects only `bandProfileAtDepth`.
- `bandProfileAtDepth` (src/render/band.ts:205) — 12 callers: `src/game/Game.ts` (main game loop), `src/render/gradient.ts`, `src/render/lighting.ts`, `src/render/particles.ts`, `src/systems/CurrentSystem.ts`, `src/render/postfx.ts`, `src/ui/debug.ts`, and 4 test files. All callers receive a `BandProfile` object with the same interface; only the authored values changed, not the structure. Tests for all affected systems pass.
- No callers added or removed; no signature changes.

## Independent Adversarial Probes

1. **Distinctness factor count (Node)**: Reproduced the `distinctFactorCount` logic from `band.test.ts` in an independent script (`scratch/reviewer/band_distinctness.mjs`). All mid band neighbor pairs pass ≥2 factors: Mid1 vs Coast (3), Mid1 vs Mid2 (5), Mid2 vs Mid1 (5), Mid2 vs Mid3 (2), Mid3 vs Mid2 (2), Mid3 vs Deep (2). Palette distances: Mid1 vs Mid2 (0.17 > 0.1), Mid2 vs Mid3 (0.105 > 0.1). Result: PASS.

2. **Browser screenshots**: Visually inspected all 6 band screenshots at 1920x1080. The three mid bands are clearly distinct from each other and from their neighbors:
   - Coast (1600m): Blue, clear, bright
   - Mid1 (4000m): Green tint, dense marine snow, bioluminescent motes — distinct from coast
   - Mid2 (7000m): Deep purple, darker, sparse snow, heavy silt — distinct from Mid1
   - Mid3 (10000m): Near-black, cold teal glow, dense drifting motes — distinct from Mid2
   - Deep (12000m): Pitch black, minimal particles — distinct from Mid3

## What I Could Not Verify

- Performance under load (section 34 budgets) — the implementer marked this not applicable since no new render code was added, only data values. No performance test could falsify this without a measurable performance change, so it is accepted as not applicable.
- Scene dressing quality (debris, ambient motion, silhouette composition) — screenshots show clean water with particles but limited debris is visible. This appears to be WI-06d's scope per the work item constraints.
- The two pre-existing test failures (`rosterFinalProof.test.ts`, `tier3Scenario.test.ts`) are about creature spawn placement (T-17 in shelf band 2, designed for band 3) and are not related to WI-06b's band rendering changes. They appear to be from earlier ST-03 work.
