---
title: Toolchain and boot seam after WI-01
role: item-implementer
created: 2026-09-05
tags: [toolchain, vite, three, vitest, boot, fixed-step, webgl2]
symbols: [Game, GameState, Renderer, createRng, FIXED_DT, CAMERA_VIEW_WIDTH]
files: [package.json, vite.config.ts, vitest.config.ts, tsconfig.json, index.html, src/main.ts, src/game/Game.ts, src/game/GameState.ts, src/game/constants.ts, src/render/Renderer.ts, src/util/rng.ts]
---

# Toolchain And Boot Seam (After WI-01)

## Summary

The project is now a buildable Vite + TypeScript + Three.js skeleton.
Boot path: `index.html` -> `src/main.ts` -> `Renderer`
(`WebGLRenderer` + `Scene` + orthographic camera) -> `Game.start()` ->
a `requestAnimationFrame` loop that drains an accumulator into
`update(FIXED_DT)` steps and calls `render(alpha)` once per display
frame.

## Key Facts

- Stack (locked in `package.json`): `three` 0.185, `vite` 8.2,
  `typescript` 7.0 (native tsc), `vitest` 5.0, `@types/three` 0.185.
  Node 24 "Krypton" LTS; verified on 24.15.0 (see BUILD.md).
- `npm run build` = `tsc --noEmit && vite build`; tests:
  `npx vitest run` (`vitest.config.ts`, node environment,
  `src/**/*.test.ts`). Dev server: `npm run dev` (port 5173).
- The single simulation seam: `Game.update(FIXED_DT)`
  (`src/game/Game.ts`); `render(alpha)` receives the leftover frame
  fraction for later interpolation (camera rig, request §16).
- `src/game/constants.ts` is the sole source of shared tuning numbers
  (FIXED_DT, 1920x1080 design size, CAMERA_VIEW_WIDTH = 2000,
  WORLD_WIDTH / WORLD_DEPTH).
- Seeded RNG: `src/util/rng.ts` (mulberry32, known-vector pinned by
  `src/util/rng.test.ts`). Never use it for critical gates, resources,
  reveals, or lore order (request §61).
- The boot marker (bobbing box in `Renderer.scene`) is a stand-in for
  the player; WI-02 replaces it and registers into
  `Game.update`.

## Gotchas

- `WebGLRenderer` (three 0.185) requires WebGL2; verify in a real
  browser (headless SwiftShader also works).
- TS 7 native `tsc`: keep `tsconfig.json` plain (`moduleResolution:
  bundler`, `noEmit`); `vite build` alone does not type-check.
- `design_private/` is gitignored (request §12); hidden creative
  content must stay out of artifacts, commits, and reports.

## Commands

- `npm run dev` / `npm run build` / `npx vitest run` — all verified
  exit 0.
- Boot probe (real-browser frame + console check):
  `agents/tasks/hadal/scratch/item-implementer/WI-01/`
  (`node probe.mjs`; drives the local ms-playwright Chromium at
  1920x1080).
