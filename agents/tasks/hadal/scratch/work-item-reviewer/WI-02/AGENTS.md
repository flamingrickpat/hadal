# Reviewer scratch — WI-02

Independent adversarial browser probe for the WI-02 review (separate from the
implementer's probe at `../../item-implementer/WI-02/`).

- `probe.mjs` — drives a real `npm run dev` server (port 5196) with the local
  ms-playwright Chromium (SwiftShader) in a fresh 1920×1080 context and
  verifies: inertial dive + coast decay, seabed/wall/east-end collision
  saturation, end-to-end swim, zero-O2 health drain, surface refill, HUD
  text/fade, tool select, Esc pause freeze, mouse-aim facing, `?debug=1`
  panel + backtick+F2 toggle, clean console.
- `package.json` / `package-lock.json` / `node_modules/` — playwright-core.
- `output/` — `result.json`, `server.log`, screenshots
  (`A-boot-reviewer.png`, `C-seabed-reviewer.png`, `F-east-reviewer.png`,
  `Z-final-reviewer.png`).

Run: `node probe.mjs` from this directory (exits 0 when all checks pass).
