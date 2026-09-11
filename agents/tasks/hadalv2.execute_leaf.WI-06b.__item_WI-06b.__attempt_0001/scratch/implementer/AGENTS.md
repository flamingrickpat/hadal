# Implementer Scratch Probe

Playwright-driven browser inspection used to verify distinct mid band visuals at
different depths (section 14.3).

- `browser_capture.js` — CJS Playwright script: teleport to each band depth,
  capture screenshots for visual comparison
- `browser_capture.mjs` — ESM variant of the same probe
