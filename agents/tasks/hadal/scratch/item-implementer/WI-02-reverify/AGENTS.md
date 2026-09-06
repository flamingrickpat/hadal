# WI-02 Re-verify Scratch

Independent re-confirmation (item-implementer role, 2026 re-dispatch) that the
already-committed WI-02 implementation still meets its acceptance criteria on
the current baseline. Does not touch product code.

- `probe.mjs` — starts `npm run dev --port 5199 --strictPort`, drives a fresh
  Chromium (SwiftShader) context at 1920x1080 with `?debug=1`, sends real
  keyboard/mouse events, asserts via the debug readout and the HUD DOM, writes
  `output/result.json` + `output/trace.txt`. 13 checks covering the greybox
  boot, inertial swim (not frictionless), circle-vs-segment terrain blocking,
  the O2/HP/depth/tool HUD, and the debug teleport.
- `package.json` — pins `playwright-core` (dev-only, scratch-local).
- `output/` — screenshots, console capture, readout trace, server log.
