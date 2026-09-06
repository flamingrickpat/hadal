# Reviewer scratch — WI-02 (independent re-review probe)

Independent adversarial browser probe written fresh for the WI-02 **re-review**
at accepted revision `81eb9fa` (2026 re-dispatch). Separate from the prior
reviewer's probe at `../probe.mjs` (same directory) and the implementer's probe
at `../../../item-implementer/WI-02/`.

- `probe.mjs` — drives a real `npm run dev` server (port 5211) with the local
  ms-playwright Chromium (SwiftShader, real WebGL2) in a fresh 1920×1080 context
  at `?debug=1`, using real keyboard/mouse events. Verifies the work item's own
  acceptance criteria: boot + HUD + `?debug=1`, 2-axis inertial thrust + bounded
  coast (not frictionless), seabed + central-wall (west face and top) collision
  saturation at exactly one radius, O2/HP/depth (zero-O2 → 5/s HP drain, surface
  refill 12/s), keyboard mapping (W/A + Digit1 + Esc pause freeze), exact debug
  teleport, clean console.
- `package.json` — pins playwright-core 1.63.0. `node_modules/` is copied from a
  sibling probe dir (gitignored, not committed).
- `output/` — `result.json`, `server.log`, `console.json`, screenshots
  (`A-boot.png`, `C-seabed.png`).

Two of my assertions are intentionally loose/over-tight and failed for probe
noise, not product defects (documented in the review):
the O2-fall range (short dive from the refill boundary) and the HUD-vs-readout
5 m tolerance (4 Hz race at top speed). See the review re-review section.

Run: `node probe.mjs` from this directory (exits 0 when all checks pass).
