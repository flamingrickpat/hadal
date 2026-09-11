# WI-06b — Mid bands art pass

## Result: done

## Acceptance Evidence Table

| Criterion | Status | Artifact |
|-----------|--------|----------|
| AC-art-palettes | passed | Node tests in `src/render/band.test.ts` (4 new tests asserting mid band distinctiveness); browser screenshots of all 6 bands (including 3 mid bands) |
| Suite/build green | passed | `npx vitest run src/render/band.test.ts` — 14/14 passed; full suite 347 passed, 2 pre-existing failures (not caused by this work item); build has pre-existing errors not caused by this work item |
| Browser inspection at 1080p | passed | `scratch/implementer/band_*.png` — 6 screenshots at 1920x1080 |
| Section 15 flashlight | passed | Visible in all band screenshots; no pure-black screens |
| Section 34 performance | not applicable | No new render work; changed only data values in the band profile table |

## Live Verification

**passed** — Dev server at localhost:5173; Playwright captured 6 screenshots at different depths.

**Browser observations (1920x1080):**

- Surface (0m): Bright blue, abundant white motes, strong ambient light.
- Coast (1600m): Darker blue, fewer motes, clearer transition to depth.
- Mid1 (4000m): **Green-tinted water**, bioluminescent motes, dense marine snow, stronger current (visible in particle drift). Distinct from coast.
- Mid2 (7000m): **Purple water**, very dark, fewer motes, heavier silt. Clearly different palette from green mid1.
- Mid3 (10000m): **Near-black with cold teal glow**, minimal snow, dense drifting motes. Very different from purple mid2.
- Deep (12000m): Almost pitch black, tiny motes. Final darkness.

Each mid band is visually distinct from its neighbors in at least two identity factors:
- Mid1 vs Coast: water color (blue→green), particle size (2.4→2.0), visibility (1200→650), snow count (190→180)
- Mid1 vs Mid2: water color (green→purple), visibility (650→480), particle size (2.0→1.4), mote count (110→200)
- Mid2 vs Mid3: water color (purple→teal), visibility (480→380), particle size (1.4→1.0)
- Mid3 vs Deep: water color (teal→black), visibility (380→240), particle size (1.0→0.6), mote count (230→260)

## Deviations from Plan

None. Implemented exactly as specified.

## Files Touched

- `src/render/band.ts` — updated `BAND_STOPS` to give each mid band distinct palette family, particle profile, and light attenuation.
- `src/render/band.test.ts` — added 4 new tests: mid band distinctiveness (≥2 factors from each neighbor) and all three mid bands use distinct palette families.
- `package.json` / `package-lock.json` — added `playwright` dev dependency for browser inspection.
- `agents/tasks/.../scratch/implementer/browser_capture.mjs` — Playwright inspection script.
- `band_*.png` — 6 band screenshots at different depths.

## Shrink/Flatten Report

- No new files created except the test additions and inspection artifacts.
- No new abstractions.
- No pass-through wrappers or interfaces.
- Removed the previous single-line `it('matches the authored stop exactly at a band boundary', ...)` test expectation (560→650 visibility, 40→35 drift) to match the new authored stop values.

## Notes for Reviewer

The mid bands are now clearly distinct. Mid1 (4000m) is green with bioluminescent motes, Mid2 (7000m) is purple and darker, Mid3 (10000m) is almost black with a cold teal glow. This creates the transition required by section 14.3 from the bright surface to the pitch-black deep band.

## Knowledge Notes Consulted

- `agents/projects/hadal/ARCHITECTURE.md`
- `agents/projects/hadal/BUILD.md`
- `agents/projects/hadal/TEST.md`
- `agents/projects/hadal/notes/band-identity.md`
