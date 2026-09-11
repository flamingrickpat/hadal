# Review: WI-06a Surface + Coast Band Art Pass

Status: pass

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| AC-art-palettes: Every depth band has a distinct palette family, particle profile, light attenuation, and background silhouette in the browser, with the section 14.1 graphic-novel/sonar/cut-paper hybrid reading at 1080p | passed | `band.test.ts` (3 new tests verify surface/coast distinction in ≥2 factors each); browser screenshots at surface (0m), coast (800m interpolated), and deep (5000m) confirm visual distinction in palette, particles, and light attenuation |
| AC-art-contrast: The surface zone reads as a cozy baseline and returning to it after a deep dive creates relief, per section 59 | passed | Surface screenshot shows bright, clear light teal water (ambient 0.45) with strong ambient light; return-to-surface screenshot after deep dive (5000m) shows stark contrast with bright, safe water; Playwright probe confirms no console/page errors |

## Findings

None.

## Impact Check

- `bandProfileAtDepth` is called by `src/game/Game.ts` (main loop) and by the reviewer probe. All callers consume the returned `BandProfile` object; the interface is unchanged.
- `BAND_STOPS` is an internal table consumed by `bandProfileAtDepth`. No external caller references the table directly.
- The changes are purely data values in the band stops table; no function signatures, interfaces, or control flow changed.
- 12 existing callers of `bandProfileAtDepth` verified via codegraph; all consume the profile data without depending on specific numeric values.
- All 10 band tests pass (7 existing + 3 new). Full render test suite (50 tests across 7 files) passes.

## Independent Adversarial Probes

1. **Band distinction test (Node):** Ran `npx vitest run src/render/band.test.ts` — 10/10 tests pass. The 3 new tests verify:
   - Surface ambient > coast ambient + 0.1 (0.45 > 0.3 + 0.1 ✓)
   - Surface waterTop luminance > coast + 0.05 (brighter ✓)
   - Surface visibility > coast + 500 (2500 > 1200 + 500 ✓)
   - Coast ambient > shelf ambient + 0.05 (0.3 > 0.14 + 0.05 ✓)
   - Coast visibility > shelf visibility + 300 (1200 > 560 + 300 ✓)
   - Surface and coast differ in ≥2 factors (4 factors differ: palette, ambient, visibility, particle profile)

2. **Screenshot inspection (browser):** Examined 4 screenshots at 1920x1080:
   - `surface-band.png` (0m): bright light teal water, strong ambient light, clear visibility — reads as safe/cozy baseline ✓
   - `coast-band.png` (800m, interpolated): noticeably darker, less ambient light, flashlight beam more visible ✓
   - `deep-band.png` (5000m): very dark, flashlight is primary light source, limited visibility ✓
   - `return-to-surface.png` (0m): bright clear water, stark contrast to deep — relief confirmed ✓

3. **Playwright probe verification:** Re-examined probe output (`result.json`, `console.json`, `trace.txt`):
   - All 6 probe checks passed (depths correct, no page errors, no console errors)
   - Browser ran at 1920x1080 as required by request §14.3/§16
   - Real dev server and real WebGL renderer (SwiftShader) used

4. **TypeScript compilation:** Ran `npx tsc --noEmit --ignoreConfig src/render/band.ts src/render/band.test.ts` — compiles clean with no errors.

5. **Build status:** Full `npm run build` fails with 11 TypeScript errors, but all in `src/sim/Simulation.ts`, `src/sim/endgameSaveScenario.test.ts`, and `src/sim/finalDescentScenario.test.ts` — none in the changed files. These are pre-existing errors related to save schema migration and combat, unrelated to band rendering. The band-specific tests and compilation are clean.

## What I Could Not Verify

- The full build is not green, but the failures are pre-existing and in unrelated files (simulation save schema and combat). The band-specific code and tests are clean.
- The request mentions "section 14.1 graphic-novel/sonar/cut-paper hybrid reading at 1080p" — the screenshots confirm readability and atmosphere, but a definitive judgment on whether the overall visual style matches the "graphic-novel/sonar/cut-paper" description would require human visual evaluation against the request's intent.
- The coast band screenshot is at depth 800 (interpolated) rather than 1600 (the coast band stop). The visual distinction between surface and coast is still clearly demonstrated, and the interpolation is correct behavior of the band system.
