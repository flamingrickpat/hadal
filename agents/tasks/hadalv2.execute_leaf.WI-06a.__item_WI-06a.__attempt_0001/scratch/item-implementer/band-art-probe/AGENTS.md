# Band Art Pass Probe

Browser verification of WI-06a: surface and coast band art pass.

## Files

- `probe.mjs` — Playwright probe that boots the real dev page, teleports to
  surface (0), coast (800), deep (5000), and back to surface; captures
  screenshots at each depth and verifies no console/page errors.
- `output/` — generated screenshots and console/error logs.

## Evidence

This probe verifies:
1. The surface band is visibly brighter and clearer (the "cozy baseline", §59).
2. The coast band is darker and more transitional (§14.3).
3. The deep band is dark and dense.
4. Returning to surface creates relief (§59).

Screenshots: `surface-band.png`, `coast-band.png`, `deep-band.png`, `return-to-surface.png`.
