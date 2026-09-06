---
title: The visual-language render stack (water, flashlight, particles, parallax, post)
role: implementer
created: 2026-09-06
tags: [render, lighting, particles, parallax, postfx, band, visual-language]
symbols: [bandProfileAtDepth, BandProfile, ParticleField, stepParticleType, Lighting, PostFX, World.updateParallax, World.updatePalette, Renderer.cameraCenter, Game.renderVisuals]
files: [src/render/band.ts, src/render/particles.ts, src/render/lighting.ts, src/render/postfx.ts, src/world/World.ts, src/render/Renderer.ts, src/game/Game.ts, src/main.ts]
---

# The visual-language render stack (water, flashlight, particles, parallax, post)

## Summary

WI-04 added the atmospheric look (request §13–§17, §34, §35, §64) on top of the
WI-02/03 greybox as a thin set of render service-providers. The depth →
palette/particle mapping is a **pure function** (`band.ts`) so it is Node
unit-testable; the Three.js layers (`lighting`, `particles`, `postfx`, and the
`World` silhouette/parallax meshes) are service-providers driven each display
frame by `Game.renderVisuals(frameDt)`, called from `main.ts` before
`renderer.render()`.

## Key Facts

- **`band.ts` is the single source of the depth band.** `bandProfileAtDepth
  (depth)` interpolates six authored stops (depths 0 / 1600 / 4000 / 7000 /
  10000 / 12000) into a `BandProfile`: `waterTop`/`waterBottom`, `ambient`
  (never < 0.07), `visibility` (2000 → 310, the flashlight reach),
  `lightIntensity`, `accent`, `particleSize`, `snowCount`/`siltCount`/
  `moteCount`, `currentDir`/`currentSpeed`, `chromatic`, `grain`,
  `particleDrift`. Reuse it for any system that needs the current band (audio,
  sonar, creature behavior); do not re-derive the mapping. The palettes are the
  placeholder family (finalized in WI-07/WI-15).
- **Flashlight = a composited additive shader mask, not a Three.js light.**
  `Lighting` renders (a) the camera-anchored depth-tinted water gradient (z =
  -50, the ambient base, never pure black) and (b) an additive cone/radial
  beam quad (z = 12, no depth test) that tracks the player position/aim and the
  per-band `visibility`/`lightIntensity`. Because the beam is additive and
  never depth-tested, it *brightens (reveals)* the terrain/particles beneath it
  so silhouettes cross at the illumination edge; the ambient floor
  (`profile.ambient * 0.4`) keeps the frame above pure black. `visibility`
  shrinks with depth, so the lit radius shortens. This is request §15
  ("cone/radial light mask using shader materials or composited transparent
  meshes"; "not a pure black screen").
- **Particles are pooled (no per-frame allocation).** `ParticleField` owns
  three `THREE.Points` layers (marine snow, silt, motes). Each layer's position
  `Float32Array` is allocated **once** in the constructor; `stepParticleType`
  (pure, unit-tested) mutates it in place (per-band drift + current + a
  per-particle bob), and `update` wraps the positions into a camera-anchored
  box in place and sets the `setDrawRange` to the per-band active count. So the
  per-band profile changes the *drawn* count/size without reallocating
  (request §34/§35). `frustumCulled = false` on each layer (the buffer spans
  the whole view).
- **Parallax = rendered-only copies at different z + different rates.**
  `World` adds two background layers (z = -40 factor 0.4, z = -25 factor 0.65)
  as `Group`s of the same terrain silhouettes, darkened, offset up into the
  open water, with **no collision** (they are not fed to `buildTerrain`).
  `updateParallax(center)` sets `group.position = center * (1 - factor)` (+ the
  y offset), so each layer lags the camera at its own rate (request §17). The
  main terrain (z = 0..1.05) is the near-black silhouette fill + accent edge +
  a sparse luminous rim; `updatePalette` re-tints all of it to the band.
- **`z` is visual layering only (request §13).** Layer order (back → front):
  gradient -50 → far parallax -40 → mid parallax -25 → terrain fill 0 →
  terrain edge 1 → sparse rim 1.05 → snow 4 → silt 5 → motes 6 → player
  (`PLAYER_PLANE_Z` 10) → beam 12. Gameplay stays on `x/y`.
- **Post = one restrained full-screen pass.** `PostFX` renders the world to a
  `WebGLRenderTarget` (MSAA `samples: 4`), then composites a grain +
  chromatic-split quad to screen (request §14.1/§72, §35). No bloom.
  `Renderer.setPostFX` swaps `render()` to the target + quad pass.

## Navigation

- `src/render/band.ts` — `BandProfile`, `bandProfileAtDepth` (pure).
- `src/render/particles.ts` — `stepParticleType` (pure), `ParticleField`
  (owns the pooled layers).
- `src/render/lighting.ts` — `Lighting` (water gradient + flashlight beam).
- `src/render/postfx.ts` — `PostFX` (grain + chromatic pass).
- `src/world/World.ts` — silhouette meshes + the two parallax layers;
  `updatePalette`/`updateParallax`.
- `src/render/Renderer.ts` — `cameraCenter`/`cameraHalf`/`setPostFX`/`render`;
  `gl` getter.
- `src/game/Game.ts` — `renderVisuals(frameDt)`; the `Lighting`/
  `ParticleField`/`PostFX` wiring; player mesh at `PLAYER_PLANE_Z`.
- `src/main.ts` — the frame loop that calls `game.renderVisuals` before
  `renderer.render()`.

## Gotchas

- **The codegraph index was partially stale for `main.ts`/`Game.ts`** in this
  session (it showed a `game.render()` seam the real files do not have). The
  real `main.ts` drives `renderer.follow` + `renderer.render` directly and
  `Game` has no `render` method; the visual update is `Game.renderVisuals`
  called from `main.ts`. Re-read the real files before wiring.
- **A shader comment with backticks inside a template literal breaks the TS
  build** (the backticks terminate the template literal). Keep shader strings
  free of backticks (the `lighting.ts`/`postfx.ts` GLSL comments use no
  backticks).
- **`ShaderMaterial.uniforms` is an indexed type**; with `noUncheckedIndexedAccess`
  the `.value` access needs a non-null assertion (`uniforms.uTop!.value`).
- **The parallax must be offset *up* into the open water** (positive y
  offset) to be visible; offsetting it down hides it behind the main terrain
  fill.
- The SwiftShader software renderer reports ~28 FPS at 1080p; the ~60 FPS
  target is only verifiable on a real GPU.

## Commands

- `npx vitest run` → the headless suite (72 tests, incl. `band.test.ts` /
  `particles.test.ts`).
- `node agents/tasks/hadal/scratch/item-implementer/WI-04/probe.mjs` → boots
  the real dev page in headless Chromium (SwiftShader) at 1920×1080, teleports
  to three depths, measures FPS, and screenshots each (the visual evidence).
