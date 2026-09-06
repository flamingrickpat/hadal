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
  has `#game`; the frame accumulator was removed; `test:browser` is a build).

Whole-task review (`task-review.md`) and independent testing
(`../testing/task-test.md`) arrive with their respective roles.
