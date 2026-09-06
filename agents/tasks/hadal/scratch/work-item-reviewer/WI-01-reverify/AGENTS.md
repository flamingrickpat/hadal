# WI-01 Re-verification Probe (work-item-reviewer scratch)

Re-runs the WI-01 boot + cadence checks in a fresh session against the live
repository at the accepted revision, independent of the implementer's and the
first reviewer's probes (see `../WI-01/`).

Answers: at the accepted revision, does the committed scaffold really boot a
WebGL2 frame at 1920×1080 with a clean console in a fresh browser profile
(criterion 2), and is the simulation cadence independent of
`requestAnimationFrame` timing (criterion 3)?

The WI-01 boot marker was replaced by a static player mesh (WI-02), so the
cadence observable is the `#hud-depth-text` advance (a pure function of the
sim clock `GameState.timeSec`) measured by sinking the player (hold S) over an
identical 3 s window — not marker position.

- `probe.mjs` — starts `npm run dev --port 5310 --strictPort` and
  `npm run preview --port 5311 --strictPort` in the repo root; drives the
  local ms-playwright chromium-1234 engine (playwright-core) with fresh
  contexts at 1920×1080 dpr 1. Phase A: unthrottled boot + console capture +
  depth advance. Phase B: same with the page's rAF callbacks delivered on only
  1 of every 4 vsyncs (vsync pump via `addInitScript`) to test frame-rate
  independence of the fixed-step simulation. Phase C: production build via
  `npm run preview`. 180 s watchdog; bounded by design.
- `package.json` — playwright-core 1.63.0 only (node_modules is gitignored by
  `.gitignore:11`).
- `output/` — `result.json` (all check results + per-phase detail),
  `A-dev-1920x1080.png`, `B-throttled-1920x1080.png`, `dev-server.log`,
  `preview-server.log`.

Evidence for `../../reviews/WI-01-scaffold-project-review.md`
(Re-verification section).
