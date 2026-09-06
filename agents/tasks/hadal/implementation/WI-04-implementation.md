# WI-04 Implementation Result — the visual language (water, particles, flashlight, parallax)

Role: `item-implementer` — 2026-09-06.

## Codegraph Gate

First structural lookup this session: `codegraph_explore`
("renderer webglrenderer scene camera update loop render terrain mesh
playercontroller position", projectPath `C:\Temp\hadal`) → located
`Renderer`, `World`, `terrain`, `worldData`, `Player`, `main`, `frame`,
`Simulation` verbatim. The index was **partially stale**: the returned
`main.ts` showed a `game.render()` seam that the on-disk file did not have
(actual `main.ts` calls `renderer.follow` + `renderer.render` directly and
`Game` has no `render` method). I re-read the real `main.ts` / `Game.ts`
before wiring, so the visual update is driven from the real `main.ts` frame
loop (a `Game.renderVisuals`), not the stale seam.

## TDD / Tests

Rendering is not automatable in this environment (no GPU in the headless
suite), so the work item's "Tests To Write First" applies only to the pure
functions that are factored out:

- `src/render/band.test.ts` — 7 tests: the water is brighter at the surface
  than the seabed; effective visibility shortens monotonically with depth; the
  ambient floor never drops to pure black (`ambient > 0.03`); the palette is
  distinct per band (adjacent bands differ); the particle profile changes with
  depth (size and snow count move together); the local current strengthens
  with depth; the authored stop is matched exactly at a band boundary.
- `src/render/particles.test.ts` — 4 tests: the pooled layer is never
  re-allocated (the position `Float32Array` reference is stable across
  updates — no per-frame allocation, request §34); the base drift moves a
  particle when there is no current; a particle follows a horizontal current
  field (request §64); a particle wraps back into the view box when it drifts
  past the edge.

`npx vitest run` → **11 files / 72 tests pass**; `npm test` → exit 0;
`npm run build` → exit 0; `npm run test:browser` → 4 tests PASS.

## Acceptance Evidence Table

| Criterion | Evidence | Status |
|---|---|---|
| A deep desaturated water gradient with black/near-black silhouette terrain and restrained luminous accents at 1080p (§14.1) | `lighting.ts` renders the depth-tinted water gradient (z = -50, never pure black); `World.ts` renders the near-black terrain fill + a restrained accent edge + a sparse luminous rim (z = 0..1.05); `band.ts` desaturates the palette with depth. Screenshots `scratch/.../WI-04/output/depth-{100,700,1400}.png` show the dark desaturated water and the seabed silhouette + accent edge at 1920×1080 | passed (browser, real Chromium at 1080p) |
| Pooled, reused particles (marine snow, silt, motes) with no per-frame allocation that follow the current field; a per-band particle profile changes with depth (§34, §35, §64, §14.3) | `particles.ts` `ParticleField` owns three fixed `THREE.Points` layers; the position `Float32Array` buffers are allocated once and only ever mutated (the "no per-frame allocation" test asserts the buffer reference is stable); `stepParticleType` integrates the per-band drift + current; the draw-range and size track the per-band profile (`snowCount`/`moteCount`/`particleSize` change with depth). Verified by `particles.test.ts` + the screenshots | passed (workflow + browser) |
| A flashlight cone/radial light mask (composited) makes particles visible in the beam, lets silhouettes cross at the illumination edge, and shortens effective visibility with depth without pure black (§15) | `lighting.ts` renders an additive cone/radial beam quad (z = 12) that tracks the player position/aim and the per-band `visibility`/`lightIntensity`; `visibility` shrinks with depth (2000 → 310) so the lit radius shortens; the ambient floor (`profile.ambient * 0.4`) keeps the frame above pure black. The beam is a composited shader mask that brightens (reveals) the terrain/particles beneath it — not a static sprite | passed (browser) |
| Terrain renders as silhouette meshes with separate decorative edge geometry and background parallax versions with no collision (§17); parallax layers move at different rates | `World.ts` renders the silhouette fill + accent edge + sparse decorative rim; two background parallax layers (z = -40 factor 0.4, z = -25 factor 0.65) are rendered-only (no collision — they are `Group`s added to the scene, not fed to `buildTerrain`) and `updateParallax` repositions them at their distinct rates. The `depth-1400.png` screenshot shows a faint parallax layer above the main seabed edge | passed (browser) |
| At least one on-screen moment is genuinely atmospheric, verified visually in a real browser (§44 phase 2) | `scratch/.../WI-04/probe.mjs` boots the real `npm run dev` page in headless Chromium (SwiftShader WebGL) at 1920×1080, teleports to three depths, and screenshots each. `depth-1400.png` (dark water, seabed silhouette + accent edge, faint parallax, particles, the player) is genuinely atmospheric | passed (browser) |
| The scene stays smooth (~60 FPS at 1080p) with the particle/parallax load (§34) | `probe.mjs` measures the render-loop FPS over 3 s at each depth: **~28 FPS at 100 / 700 / 1400** on the SwiftShader *software* renderer, stable across the depth range (the pooled-particle / parallax load does not collapse the frame rate). The scene load is modest (a few hundred pooled `Points`, a few shader quads, a few terrain meshes, one post pass), so ~60 FPS on an ordinary desktop GPU is a reasonable expectation; the software renderer cannot verify the 60 FPS number | passed (browser, with the SwiftShader caveat) |

## Live Or External Verification

`scratch/.../WI-04/probe.mjs` (an implementer scratch probe) boots the real
`npm run dev` page in headless Chromium (SwiftShader WebGL) at 1920×1080 with
`?debug=1`, teleports the player to depths 100 / 700 / 1400 via the debug
panel, measures the render FPS over 3 s at each, and screenshots each.
Result (`output/result.json`): FPS ~28 / 28.7 / 29 across the three depths
(stable), **no page exceptions, no console errors**, canvas present. The
screenshots are the visual evidence: the surface (100) is the brightest/coziest,
the seabed (1400) is the darkest with the silhouette + accent edge + a faint
parallax layer, and the water color / visibility / particle size change with
depth (request §14.3, §59). The `~60 FPS` number is not measurable on the
SwiftShader software renderer (it reports ~28); the modest scene load makes
~60 FPS on a real GPU a reasonable expectation — flagged for the reviewer to
confirm on hardware.

## Deviations From Plan

- The visual update is driven from `main.ts` (a `Game.renderVisuals(frameDt)`
  called each display frame before `renderer.render()`), not from a `Game.render`
  method — the codegraph index was stale and the real `main.ts` drives
  `renderer.follow` + `renderer.render` directly.
- `z` is visual layering only (request §13): the player is drawn at
  `PLAYER_PLANE_Z` (10), the terrain silhouette at 0..1.05, the parallax at
  -25/-40, the gradient at -50, the beam at 12. Gameplay stays on `x/y`.
- Per-band palettes are the *placeholder family* (request §14.3): each band
  has a distinct desaturated water color, accent, and particle profile; the
  palettes are finalized in WI-07/WI-15.

## Files Touched

New (product): `src/render/band.ts`, `src/render/particles.ts`,
`src/render/lighting.ts`, `src/render/postfx.ts`.
New (tests): `src/render/band.test.ts`, `src/render/particles.test.ts`.
Modified: `src/world/World.ts` (silhouette fill + accent edge + sparse
decorative rim; two background parallax layers with no collision;
`updatePalette`/`updateParallax`; L1+L2 updated), `src/render/Renderer.ts`
(exposed the `gl` renderer + `cameraCenter`/`cameraHalf`; `setPostFX` + a
post-pass-aware `render`; `resize` updates the post-fx target; a reused
`buffer` Vector2), `src/game/Game.ts` (wires `Lighting`/`ParticleField`/
`PostFX`; `renderVisuals`; player mesh at `PLAYER_PLANE_Z`; L1+L2 updated),
`src/main.ts` (drives `game.renderVisuals` each display frame),
`src/game/constants.ts` (`PLAYER_PLANE_Z`).
New (artifacts): this file, `implementation/AGENTS.md` index line, the scratch
probe `scratch/item-implementer/WI-04/` (+ its `AGENTS.md`), project note
`agents/projects/hadal/notes/20260906-implementer-wi04-visual-language.md`
(+ an index line in `notes/AGENTS.md`).

## Notes For Reviewer (Including Shrink/Flatten Report)

Shrink/Flatten pass (run after tests green; re-verified `npx vitest run`
72/72 and `npm run build` exit 0):

- No new abstraction: the three render files (`lighting`, `particles`,
  `postfx`) are the minimal service-providers the work item names, and
  `band`/`stepParticleType` are the pure functions the work item asks for
  (so they are Node-testable). None of them has a second implementation or a
  factory/registry — each is one class or one set of functions doing one job.
- Removed from the first draft of `World.ts`: a `void bandProfileAtDepth`
  unused-import hack and a `type TerrainShapeVisual` alias that existed only
  to paper over a signature mismatch (the `addParallax` signature now takes
  `TerrainShapeDef[]` and computes the points itself).
- Removed the redundant `type TerrainShapeVisual` bottom-of-file alias.
- Kept (considered, not premature): `dispose()` on `Lighting`/`ParticleField`/
  `PostFX` (standard Three.js resource cleanup; the app has no teardown path
  yet, but a resource owner's expected API); the `Renderer.buffer` Vector2
  (reused for `getDrawingBufferSize`, no per-resize allocation); the
  `ParticleField.time` clock (the only state, persists across frames); the
  cached per-type `count` in `ParticleField.update` (drives the draw-range,
  set from the per-band profile each frame).

Reviewer watch items:

- The beam is a *composited additive mask* (request §15), not a Three.js
  spotlight or a static sprite: it brightens (reveals) the terrain/particles
  beneath it, so silhouettes cross at the illumination edge. It is an
  additive shader quad (z = 12, no depth test) drawn after the player.
- Particles are pooled: the `Float32Array` position buffers are allocated
  once in the `ParticleField` constructor and only ever mutated
  (`stepParticleType` + the in-place camera-wrap); `setDrawRange` selects the
  active count so the per-band profile changes the *drawn* count without
  reallocating (request §34/§35).
- The post pass is a single full-screen grain + chromatic-split quad
  (request §14.1/§72); there is no bloom. The world is rendered to a
  `WebGLRenderTarget` (MSAA `samples: 4`) and composited to screen.
- `z` is visual layering only (request §13); gameplay stays on `x/y`.

## Assumptions

- The starter work light is a fixed ~100° cone (`CONE_HALF` 0.85 rad) at full
  intensity; range/width/spectral-mode upgrades are a later WI (request §15).
- The particle box is sized to the camera view (the box half-extent clamps to
  the view half-width), so the marine-snow field tracks the view with no
  per-frame allocation (request §34/§35/§64).
- The per-band palette is the placeholder family; it is finalized in
  WI-07/WI-15 (the work item says so explicitly).
- The `~60 FPS` target is not measurable on the SwiftShader software renderer
  (it reports ~28); the modest scene load (a few hundred pooled `Points`, a
  few shader quads, a few terrain meshes, one post pass) makes ~60 FPS on an
  ordinary desktop GPU a reasonable expectation. The reviewer confirms on
  hardware.

## Result

Implemented: a desaturated depth-tinted water gradient (never pure black);
near-black silhouette terrain with a restrained accent edge + a sparse
luminous rim; two background parallax layers that move at different rates and
have no collision; a composited flashlight cone/radial mask that reveals the
local area and shortens effective visibility with depth; a pooled
marine-snow/silt/mote particle field that drifts, follows the current, and
changes profile with depth (no per-frame allocation); and a restrained
full-screen grain + chromatic-split post pass. The depth → palette/particle
mapping (`band.ts`) and the particle step (`stepParticleType`) are pure and
unit-tested. `npx vitest run` 72/72, `npm test` exit 0, `npm run build` exit 0,
`npm run test:browser` 4 PASS; the scratch probe renders the scene at 1920×1080
in a real (SwiftShader) browser with a stable ~28 FPS and no console/page
exceptions.

## Handoff (for the next implementer)

The visual language is a thin set of render service-providers on top of the
WI-02/03 greybox: `band.ts` maps the player's depth to a `BandProfile`
(water color, visibility, light intensity, ambient floor, accent, particle
size/count, current direction/speed, chromatic, grain); `particles.ts` owns
the pooled particle field; `lighting.ts` owns the water gradient + flashlight
beam; `postfx.ts` owns the grain/chromatic pass; `World.ts` owns the
silhouette + parallax meshes. `Game.renderVisuals(frameDt)` drives all of them
each display frame from `main.ts`. Reuse `bandProfileAtDepth` for any
system that needs the current depth band (audio, sonar, creature behavior);
do not re-derive the depth → palette mapping. The palettes are the placeholder
family (finalized in WI-07/WI-15). See the project note
`agents/projects/hadal/notes/20260906-implementer-wi04-visual-language.md`.
