---
title: WI-06 sonar render layer — per-vertex point size (massive objects render larger)
role: item-implementer
created: 2026-09-07
tags: [sonar, sonar-visuals, render, three.js, shader, per-vertex-size, service-provider]
symbols: [SonarVisuals, pointMat, echoSize, tagSize, ECHO_BASE_SIZE, TAG_BASE_SIZE, markDirty, MASSIVE_FLASH_SCALE]
files: [src/render/sonar.ts, src/render/sonar.test.ts, src/game/constants.ts]
---

# Summary

The `SonarVisuals` render layer (`src/render/sonar.ts`, the only browser-dependent
part of the sonar) scales the **point size** of echo and tag particles by the sonar
object's size, so a massive object (`size > 1`) renders a larger echo/tag than a
small one (request §18, §52E "sonar scale"). This was added in the WI-06
attempt-2 revision after the work-item review found the render layer expressed
only the *slower* half of the massive pulse (the simulation already sets
`echo.size = t.size` and scales the duration; the pixels did not scale).

# Key Facts

- **One shared `THREE.ShaderMaterial` (`pointMat`)** draws both the echo-particle
  and echo-tag point layers (the ring stays a `THREE.LineLoop` with a
  `LineBasicMaterial`). It has a per-vertex `attribute float size` plus the
  existing per-vertex `tint`; the vertex shader sets `gl_PointSize = size`
  (pixels), and the fragment shader outputs `vTint` with the existing
  discard-when-dark / premultiplied-alpha blend.
- **Per-vertex size is driven from the object size** in `update`:
  `size = BASE * (1 + (t.size - 1) * MASSIVE_FLASH_SCALE)`. `ECHO_BASE_SIZE = 6`,
  `TAG_BASE_SIZE = 5` (px). A `size 1` object stays at the base size (no visual
  change); a `size 8` object renders ~5.2x larger (echo 31px, tag 26px), matching
  the simulation's `echo.size` and the scaled tag duration.
- **Public readonly `echoSize: Float32Array` and `tagSize: Float32Array`** are
  parallel to the `tint` buffers and are written each `update`. The test
  (`src/render/sonar.test.ts`) asserts the per-vertex size through these buffers
  rather than mocking the geometry.
- `markDirty(points)` uploads the `position` + `tint` + `size` buffers
  (`needsUpdate`); no geometry is reallocated per frame (§34). `dispose` disposes
  the ring geo/mat, both point geos, and `pointMat`.

# Why / Gotchas

- The `size` attribute is what makes the render match the simulation: without it
  every echo/tag point is a fixed pixel size and "massive" is invisible in the
  pixels even though `echo.size` is correct.
- Do not clone the `MASSIVE_FLASH_SCALE` constant (it lives in
  `src/game/constants.ts`); reuse it so the render and the simulation stay in
  lockstep.
- `tsconfig` has `noUncheckedIndexedAccess` — index the `echoSize`/`tagSize`
  pools with `!`.

# Navigation / Commands

- `src/render/sonar.ts` — `SonarVisuals` (ring + echo/tag point layers + `pointMat`).
- `src/render/sonar.test.ts` — 4 unit tests (massive renders larger echo/tag,
  size comes from the `size` attribute, size-1 stays at base).
- Run: `npx vitest run src/render/sonar.test.ts`.
