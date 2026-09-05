# WI-04: Establish the visual language (water, particles, flashlight, parallax)

## Identity

- Task: hadal
- Story: implicit
- Owner role: `item-implementer`
- Complexity: medium
- Dependencies: WI-03

## Goal

Give one screen a genuinely atmospheric look — dark graphic-novel / scientific-sonar / cut-paper hybrid — with a water gradient, pooled particles, a flashlight cone mask, parallax terrain, and a per-depth-band palette/particle profile, without hand-drawn assets.

## Vision Link

Request §13 (procedural 2.5D on a 2D gameplay plane; `z` for visual layering only), §14 (dark silhouettes, restrained luminous accents, grain, particulate, light cones, sparse line detail, parallax; per-band distinct palette + particle profile, §14.3), §15 (cone/radial light mask; particles visible in beam; shorter visibility with depth; not pure black), §17 (terrain silhouette meshes + parallax). §45/§34 require the look to still read clearly in motion at 1920×1080 and stay smooth.

## Acceptance Criteria

- [ ] A deep desaturated water gradient with black/near-black silhouette terrain and restrained luminous accents renders at 1920×1080 (request §14.1).
- [ ] Pooled, reused particles (marine snow, silt, drifting motes) drift through the scene without per-frame allocation and follow the current field where one exists (request §34, §35, §64); a per-band particle profile changes with depth (request §14.3).
- [ ] A flashlight cone/radial light mask (shader or composited) makes particles visible inside the beam, lets silhouettes cross at the edge of illumination, and shortens effective visibility with depth without going pure black (request §15).
- [ ] Terrain renders as silhouette meshes with separate decorative edge geometry and background parallax versions with no collision (request §17); parallax layers move at different rates.
- [ ] At least one on-screen moment is genuinely atmospheric (light cone, grain, silhouettes, particles) — verified visually in a real browser (request §44 phase 2).
- [ ] The scene stays smooth (~60 FPS at 1080p) with the particle/parallax load (request §34).

## Required Evidence

| Criterion | Evidence type | Command or artifact |
|---|---|---|
| Water gradient + silhouettes + accents | manual (browser) | one screen reads as §14.1 hybrid at 1080p |
| Pooled particles, per-band profile | manual (browser) + workflow | particles follow current field; particle profile changes with depth; reviewer confirms pooling/no per-frame alloc |
| Flashlight cone mask | manual (browser) | particles visible in beam; visibility shortens with depth; not pure black |
| Parallax terrain | manual (browser) | terrain silhouettes + decorative edge + background parallax at different rates |
| Smooth at 1080p | manual (browser) | ~60 FPS with the visual load |

## Tests To Write First

- None required for rendering (not automatable here). If a pure function (e.g., depth→palette or current-field→velocity) is factored out, add a small Vitest test for it.

## Live Or External Verification

In a real desktop browser at 1920×1080: descend a few depth bands and confirm the water color, visibility, particle size, and parallax change; confirm the flashlight reveals particles and silhouettes and that the frame rate stays smooth.

## Infrastructure Required

- Start: `npm run dev`
- Restart: re-run `npm run dev`
- Health: atmospheric screen renders, ~60 FPS, no console exceptions
- Timeout: n/a
- Endpoint or MCP: none

## File Pointers

- `src/render/Renderer.ts`, `src/render/materials.ts`, `src/render/lighting.ts` (flashlight cone mask, request §15), `src/render/particles.ts` (pooled, request §34/§35), `src/render/postfx.ts` (grain/chromatic split, restrained, request §14.1, §35)
- `src/world/terrain.ts` (silhouette meshes + parallax, request §17)
- request §13, §14, §15, §17, §34, §35, §64

## Architecture And Integration Constraints

New files, L1 + archetype:

- `src/render/lighting.ts` — `masks — flashlight cone/radial light over the scene`; service-provider.
- `src/render/particles.ts` — `emits — pooled marine-snow/silt/mote particles`; service-provider (owns pooling; no per-frame allocation).
- `src/render/postfx.ts` — `post-processes — restrained grain/chromatic-split passes`; service-provider.

Constraints: `z` is visual layering only; gameplay stays on `x/y` (request §13). Post-processing is restrained — heavy bloom on everything is explicitly rejected (request §14.1, §72). This applies the look to the greybox world from WI-02/03; per-band palettes are finalized in WI-07/WI-15.

## Forbidden Substitute Success

- A flat unlit color field with no silhouettes/light/particles called "atmospheric".
- Particles that allocate new objects every frame.
- A flashlight that is just a static sprite, not a mask that reveals geometry.

## Expected Project Knowledge Update

Note the flashlight-mask technique and the particle-pooling approach in a project note if they are non-obvious or affect performance.

## Fresh-Session Handoff

Enter `item-implementer` mode for this exact work item. Read the task or story state from top to bottom, the project documentation, all passed gate artifacts, this work-item specification, and only then the listed source files.
