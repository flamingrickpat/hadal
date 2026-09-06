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

## Attempt 2 (2026-09-07) — the probe now verifies the flashlight beam

After the reviewer's finding that the beam did not reveal the scene (it was a
~2 px quad, not scaled, and anchored to the camera center), the probe was
updated to decode each screenshot in-node and sample pixel brightness to verify
the beam: the scene is not a flat field (luminance stddev), the beam reveals a
bright region around the diver, it is anchored to the player (not the clamped
camera center), the bright area shortens with depth, and the open water is
never pure black. The depths are now 300 / 700 / 1400 (a shallow band and a
clamped deep band); `depth-300.png` is new.

The PNG decoder was corrected: the "left" reference in row filtering must be the
reconstructed current-row value, not the raw filtered byte (the reviewer's probe
still uses the uncorrected decoder, so its beam metrics are unreliable — the
screenshots and this probe's metrics are the reliable evidence).

- `output/depth-300.png`, `depth-700.png`, `depth-1400.png` — the screenshots.
- `output/result.json` — FPS per depth, per-depth beam metrics, and the five
  checks (A scene-not-flat, B beam-reveals, B2 anchored-to-player, C
  shortens-with-depth, D never-pure-black).
