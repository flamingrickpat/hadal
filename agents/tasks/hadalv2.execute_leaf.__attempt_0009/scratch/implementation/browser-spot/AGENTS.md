# Scratch — WI-03a browser spot-check

Question answered: does one representative tier-1 organism render and
animate in the real browser without console errors (WI-03a "Browser
spot-check", request §70 presentation layer only)?

- `spot.mjs` — Playwright probe. Boots the real `npm run dev` page in
  headless Chromium (same resolution strategy as
  `tests/browser/boot.test.mjs`), opens `?debug=1`, teleports the player
  to the t01-shelf spawn (x 7000, depth 3500) via the debug panel, and
  asserts: canvas present, no page exceptions, no console errors, and
  the rendered scene changes between two captures 2.5 s apart.
- `after-teleport.png` — the second capture (player standing in the
  tier-1 school area).

Run: `node agents/tasks/hadalv2.execute_leaf.__attempt_0009/scratch/implementation/browser-spot/spot.mjs`
