# WI-02 Implementer Scratch

Bounded browser probe for the WI-02 acceptance criteria (inertial swim,
terrain blocking, oxygen/depth HUD, mouse aim, tool select, pause, debug
teleport).

- `probe.mjs` — starts `npm run dev --port 5197 --strictPort`, drives a
  fresh Chromium (SwiftShader) context at 1920x1080 with `?debug=1`,
  sends real keyboard/mouse events, asserts via the debug readout and the
  HUD DOM, writes `output/result.json` + `output/trace.txt`.
- `run.ps1` — installs deps and runs the probe.
- `output/` — screenshots, console capture, readout trace, server log.
