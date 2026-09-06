# Reviewer scratch — WI-04 (flashlight-reach probe)

Independent adversarial browser probe written fresh for the WI-04 review
(2026-09-06). Drives the real `npm run dev` server (port 53341) with the local
ms-playwright Chromium (SwiftShader, real WebGL2) in a fresh 1920×1080 context
at `?debug=1`, decodes the captured PNG in-node, and samples luminance.

Purpose: test the flashlight criterion (request §15) that the implementer's
screenshots could not settle by eye — does the beam actually reveal the scene,
or is it a ~2 px region? The mean luminance is confounded by the evenly
scattered particles, so the probe uses (A) the whole-canvas luminance stddev
(not a flat field), (B3) a radial brightness profile from the beam origin, and
(B4) the minimum (background-floor) luminance at the beam origin vs 600 px
away.

- `probe.mjs` — boots the dev server, teleports to depth 1400 (camera clamped,
  so the beam origin is the screen center), captures + decodes the screenshot,
  and samples A / B3 / B4 plus a horizontal-teleport parallax column scan.
  Resolves `playwright-core` from the repo root (or a local `node_modules/`,
  not committed).
- `package.json` — pins playwright-core 1.63.0 (matches the repo root).
- `output/` — `result.json`, `server.log`, and the captured screenshots
  (`reviewer-depth700/1100/1400/1500.png`, `reviewer-parallax-x1300/2300.png`)
  from the probe run.

Result: A (not a flat field) **PASS** (stddev ~69); B3 radial profile **flat**
(no peak/fall) and B4 background floor `centerMin=0 awayMin=0` — the beam does
not reveal the scene. Combined with the code (`src/render/lighting.ts:100`
`PlaneGeometry(2,2)` never scaled), the flashlight is a ~2 px region. See
`../../../reviews/WI-04-visual-language-review.md` (Finding 1) — verdict
**findings**.

Run: `npm install` then `node probe.mjs` from this directory.

## Re-verify probe (attempt 2, commit `07b68fb`)

- `probe-reverify.mjs` — re-review probe: boots the dev server (port 52341) at
  1920×1080, teleports to depth 1400 (camera clamped, diver below the screen
  center) and depth 300, decodes each screenshot with a corrected PNG decoder,
  and verifies the flashlight beam is now a wide cone **anchored to the player**
  (bright cone base y near the diver, not the screen center), reveals the scene
  (bright core far above surrounding water), shortens with depth (smaller
  illuminated area), and never pure black. All checks pass; ~27 FPS on
  SwiftShader.
- `output/` (attempt 2): `result-reverify.json`, `reverify-depth1400.png`,
  `reverify-depth300.png`, `server-reverify.log`.

Run: `node probe-reverify.mjs` from this directory.
