# Review Reports

One report per reviewed work item, written by the `work-item-reviewer`
role:

- `WI-01-scaffold-project-review.md` — review of the Vite+TS+Three.js
  scaffold and fixed-step boot loop (pass, 2026-09-05; re-verified at the
  accepted revision, 2026-09-06).
- `WI-02-player-swim-terrain-oxygen-review.md` — review of inertial swim,
  terrain collision, meters, HUD, and debug teleport (pass, 2026-09-05;
  re-verified at the accepted revision `81eb9fa`, 2026 re-dispatch).
- `WI-03-base-resource-crafting-save-review.md` — review of the headless
  simulation core, versioned save, crafting, base, debug panel, and the
  §30/§70 verification harness (findings, 2026-09-06: headless core passes,
  but the browser does not boot — `main.ts` reads `#app` while `index.html`
  has `#game`; the frame accumulator was removed; `test:browser` is a build). Re-reviewed at HEAD `d611344` (attempt 3,
2026-09-06): **pass** — the browser-boot, frame-cadence, and `test:browser`
findings are all resolved by the browser-fix commit; headless (9 files / 61
tests), build, and the real browser harness all verified green; the
`.debug-readout` showing in normal mode is a minor (non-blocking) observation
for WI-15.
- `WI-04-visual-language-review.md` — review of the visual-language render
  stack (water gradient, pooled particles, flashlight, parallax terrain,
  post-fx; commit `fc7770f`, 2026-09-06): **findings** — the water gradient,
  pooled/no-alloc particles + per-band profile, terrain silhouette/parallax
  (no collision, distinct rates), atmospheric scene (luminance stddev ~69),
  build (exit 0), and headless suite (11 files / 72 tests) all pass, but the
  **flashlight beam is a ~2 px `PlaneGeometry(2,2)` that is never scaled** and
  is anchored to the camera center, so it does not reveal the scene (criterion
  3 / request §15 fails; the implementer's note overstates it).

Whole-task review (`task-review.md`) and independent testing
(`../testing/task-test.md`) arrive with their respective roles.
