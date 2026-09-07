# Reviewer scratch — WI-07 (attempt 2)

Independent adversarial probes for the WI-07 macro-world review
(`../../reviews/WI-07-macro-world-chunks-review.md`), run against the
production world data, simulation, and render code (not the implementer's
tests):

- `probe.test.ts` — 14 headless tests that re-derive the acceptance facts:
  world scale/band count, exit-graph connectivity, wide descending network
  (band centres + skip-band shortcuts), per-band §4.2 topology, greybox
  subset, currents carry the player and the boost upgrade reduces the drift,
  the **authored** world triggers fire in the live simulation (once-dedup +
  depth thresholds), the shelf interior is reachable, the hadal terminus
  pocket is reachable by real steering + collision (attempt-2 finding 1),
  the per-chunk ambient work gate drives the real `ParticleField`
  (attempt-2 finding 2), and the descent legs stay dense (attempt-2 finding 3).
- `vitest.config.ts` — scratch vitest runner that includes only
  `probe.test.ts`, so the probe runs through the project's vitest (the Vite
  resolver handles the source's extensionless TS imports) without touching
  the product test dir (`src/**/*.test.ts`).
- `browser-probe.mjs` — focused browser check (attempt 2): fresh Chromium
  profile at 1920×1080 boots the dev build with a live WebGL2 canvas, no
  console/page errors, and keyboard input reaches the production simulation
  (HUD depth increases). Output in `output/` (result.json + a surface/coast
  screenshot — spoiler-safe).

Run:

- headless: `npx vitest run --config
  agents/tasks/hadal/scratch/work-item-reviewer/WI-07/vitest.config.ts`
- browser: `node
  agents/tasks/hadal/scratch/work-item-reviewer/WI-07/browser-probe.mjs`

Result (HEAD `fe82eb4`): 14/14 headless probes pass; browser probe passes.
This supersedes the attempt-1 probe (in dangling commit `8a9bb34`), which
passed 8/9 — the one "failure" was this probe's own per-band assertion that
the implementer then fixed.
