# Implementer scratch — WI-06 Sonar + World-Signal Bus (attempt 2)

Implementer browser probe for the WI-06 attempt-2 revision (the render-layer fix
for the review's Finding 1: massive sonar objects now render a larger echo/tag).

## `probe.mjs`

Boots the real `npm run dev` page in headless Chromium (SwiftShader WebGL,
`--autoplay-policy=no-user-gesture-required`) and reuses the live Vite dev
server + the product modules. It has two parts:

1. **Standalone sonar render** — in the live game page it dynamically imports the
   product `SonarSystem` + `SonarVisuals` (plus the same pre-bundled `three` the
   game imports) and renders a standalone scene with a normal (`size 1`) and a
   massive (`size 8`) object, covering the viewport. It asserts the massive
   object's echo (31.2px) and tag (26px) render larger than the normal one's
   (6px / 5px), and that the render produced no console exception (the new
   shader compiles in a real WebGL context). Screenshot:
   `output/sonar-massive-vs-normal.png`.
2. **Real-game regression** — boots the real game, crafts `sonar-1`, fires Q, and
   confirms the ring + echoes render with no console exception (the shader did
   not break the render path). Screenshot: `output/real-game-sonar-ring.png`.

- run: `node agents/tasks/hadal/scratch/item-implementer/WI-06/probe.mjs`
  from the repo root (resolves `playwright-core` from the root `node_modules`).
- result: printed PASS/FAIL lines + `IMPLEMENTER PROBE PASS` / `IMPLEMENTER
  PROBE FAIL`; structured evidence in `output/result.json`.

## Gotcha (Vite 8 HTML handling)

Vite 8 (rolldown) SPA-falls-back any non-`index.html` page (root or nested
`probe.html`) to the game's `index.html`, and its `?html-proxy` module returns
500 — so a standalone probe HTML page does not load. The probe therefore loads
the real game page (`?debug=1`) and builds the sonar scene in-page via a
dynamic `import()` of the dev-server module URLs (`/src/...`, and the exact
pre-bundled `three` URL extracted from the transformed `src/render/sonar.ts`),
so the rendered objects use the same `three` the product uses.
