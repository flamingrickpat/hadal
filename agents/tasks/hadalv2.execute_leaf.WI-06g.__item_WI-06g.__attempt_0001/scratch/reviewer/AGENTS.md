# WI-06g Reviewer Scratch

Independent verification probes for WI-06g accessibility controls review.

- `roundtrip-check.mjs` — Original Node-based probe attempt (not run; superseded by .test.ts version)
- `roundtrip-check.test.ts` — Vitest probe for save schema round-trip (used during review, then removed)

All probes verify that the save schema correctly handles the 5 new accessibility settings fields: masterVolume, screenShake, reducedFlashing, showSubtitles, hiContrastSonar.