# WI-04 implementer scratch

Implementer probes for WI-04 (the visual language: water gradient, particles,
flashlight, parallax).

## `probe.mjs`

Boots the real `npm run dev` page in headless Chromium (SwiftShader WebGL),
1920x1080, `?debug=1`. Teleports the player to three depths (100 / 700 / 1400),
measures the render-loop FPS over 3 s at each, and screenshots each. Verifies the
atmospheric scene renders without console/page exceptions and that the FPS is
stable across the depth range (the particle/parallax load does not collapse the
frame rate).

- `output/depth-100.png`, `depth-700.png`, `depth-1400.png` — the screenshots.
- `output/result.json` — the measured FPS per depth + console/page errors.
- `output/server.log` — the dev-server log.

Run: `node agents/tasks/hadal/scratch/item-implementer/WI-04/probe.mjs` from the
repo root (resolves `playwright-core` from the root `node_modules`).
