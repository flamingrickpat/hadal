# Widescreen Composition Probe

Browser verification of WI-06d-c-b: widescreen layout adaptation (request §16).

## Files

- `probe.mjs` — Playwright probe that launches the game at 16:9 (1920x1080) and
  21:9 (3440x1440) viewports, captures screenshots at each, and compares the
  camera framing.
- `capture_16x9.png` — baseline 16:9 capture.
- `capture_21x9.png` — widescreen 21:9 capture showing wider horizontal framing.

## Evidence

This probe verifies:
1. The camera widens on ultrawide aspect ratios (21:9) instead of letterboxing.
2. The scene is fully visible without letterboxed dead zones.
3. Baseline 16:9 framing is unchanged.
4. The workbench UI remains correctly positioned (not stretched).