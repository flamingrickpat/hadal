# WI-01 Boot Probe (work-item-reviewer scratch)

Answers: does the committed scaffold really boot a WebGL2 frame at
1920×1080 with a clean console in a fresh browser profile, does the
production build also boot, and is the simulation cadence independent of
`requestAnimationFrame` timing (WI-01 criteria 2 and 3)?

- `probe.mjs` — starts `npm run dev --port 5210 --strictPort` and
  `npm run preview --port 5211 --strictPort` in the repo root; drives the
  local ms-playwright chromium-1234 engine (playwright-core) with fresh
  contexts at 1920×1080 dpr 1. Phase A: unthrottled boot + console
  capture + marker-centroid sampling. Phase B: same with the page's rAF
  callbacks delivered on only 1 of every 4 vsyncs (vsync pump via
  `addInitScript`) to test frame-rate independence of the fixed-step
  simulation. Phase C: production build via `npm run preview`. 150 s
  watchdog; bounded by design.
- `package.json` / `package-lock.json` — playwright-core 1.63.0 only
  (node_modules is gitignored by `.gitignore:11`).
- `output/` — `result.json` (all check results + per-phase detail),
  `A-dev-1920x1080.png`, `B-dev-throttled-1920x1080.png`,
  `C-preview-1920x1080.png`, `dev-server.log`, `preview-server.log`.

Evidence for `../../reviews/WI-01-scaffold-project-review.md`
(Independent Adversarial Probes).
