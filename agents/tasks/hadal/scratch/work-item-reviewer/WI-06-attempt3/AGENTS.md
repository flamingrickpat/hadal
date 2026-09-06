# Reviewer scratch — WI-06 attempt 3 (sonar ring-expansion probe)

Independent adversarial browser probe written fresh for the WI-06 attempt-3
review (2026-09-07). Drives the real `npm run dev` server (port 54322) with the
local ms-playwright Chromium (SwiftShader, real WebGL2) in a fresh 1920×1080
context at `?debug=1`, crafts `sonar-1` through the production workbench UI,
and fires the sonar on the `Q` input edge to re-confirm, in a fresh session,
that the sonar is a real expanding ring (request §18) — not a static sprite —
and that the signal-bus-receives-sonar claim (proven headlessly by
`senses.test.ts` / `scenarios.test.ts`) is wired through the live render path.

- `probe.mjs` — boots the dev server, crafts `sonar-1` (recipe card flips
  `Craft` → `Crafted`), fires Q, captures an early and a late frame, and checks:
  (1) boot with no console exceptions, (2) sonar-1 crafted + capability granted,
  (3) no runtime exception in the render path on Q, (4) a saturated-cyan ring is
  present in the early frame. The ring's *expansion* is confirmed by visual
  inspection of the two captured frames (early = a mid-size circle around the
  player; late = the same circle expanded so largely it is mostly off-screen);
  a raw per-pixel ring-radius metric is confounded by the scene's cyan-toned
  water gradient / cards / particles, so it is reported, not asserted. Resolves
  `playwright-core` from the repo root; `pngjs` (local `node_modules/`, not
  committed) for the PNG decode.
- `package.json` / `package-lock.json` — pins `pngjs` ^7 (local install).
- `output/` — `result.json` and the captured frames
  (`ring-attempt3-early.png`, `ring-attempt3-late.png`) from the probe run.

Result: all five checks pass. See
`../../../reviews/WI-06-sonar-signal-bus-review.md` (Revision — attempt 3) —
verdict **pass**.

Run: `npm install` then `node probe.mjs` from this directory.
