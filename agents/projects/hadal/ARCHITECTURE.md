# Architecture

## System Overview

Greenfield at 207a690: no product code exists. Target system (request
§28, §30): a Vite + TypeScript browser game. Gameplay is strictly on the
`x/y` plane; `z` is visual layering only (request §13). Simulation runs
on a fixed 1/60 s timestep (request §30). Rendering via Three.js
`WebGLRenderer` (request §28); audio via native `AudioContext`
(initialized after first input, request §27); saves via versioned
`localStorage` (request §42). No server, no network.

## Main Components

Target layout per request §29 — none of these files exist yet:

- `src/main.ts` — boot; fixed-step frame loop (request §30).
- `src/game/` — `Game.ts` (frame orchestration), `GameState.ts`,
  `constants.ts`, `save.ts` (versioned `SaveGameV1`, request §42).
- `src/render/` — `Renderer.ts`, `CameraRig.ts` (orthographic follow,
  request §16), `materials.ts`, `lighting.ts` (flashlight cone mask,
  request §15), `particles.ts`, `postfx.ts`.
- `src/world/` — `World.ts`, `chunks.ts` (`WorldChunkDef`, request
  §17), `terrain.ts` (2D polyline collision, request §17/§31),
  `worldData.ts` (authored chunk data), `gates.ts` (soft equipment
  gates, request §4.3), `triggers.ts` (encounter triggers, request §36).
- `src/player/` — `Player.ts`, `PlayerController.ts` (inertial swim
  model, request §6), `equipment.ts` (`EquipmentDef` + capabilities,
  request §62), `inventory.ts` (single cargo capacity, request §7).
- `src/creatures/` — `Creature.ts`, `CreatureDef.ts` (request §19),
  `creatureFactory.ts`, `steering.ts`, `senses.ts` (world-signal bus,
  request §63), `spineRenderer.ts` (spline/spine creatures, request
  §13.2), `behaviors/` (data-driven states; bespoke controllers
  allowed, request §19).
- `src/systems/` — collision, resources, crafting, sonar (request §18),
  audio (request §27), triggers, currents (request §64).
- `src/content/` — `recipes.ts`, `items.ts`, `resources.ts`,
  `dialogue.ts`, `landmarks.ts`, and `secret/` (hidden world,
  creatures, encounters, lore — request §12/§29, kept out of
  player-facing docs and progress reports).
- `src/ui/` — HUD, menus, map overlay, `styles.css` (request §26).
- `src/util/` — math, seeded RNG (request §61), spatial hash, debug
  panel (request §33) hosting `validateWorld()` /
  `simulateCriticalPath()` (request §32).
- `design_private/` — private creative design files (request §12).

## Entry Points

- User entry point (target): `index.html` -> `src/main.ts`; does not
  exist yet.
- Dev/prod entry points (target): `npm run dev`; `npm run build` +
  `npm run preview` (request §69).
- Hidden developer entry point (target): `?debug=1` or backtick + `F2`
  debug panel (request §33).

## Integration Seams

All seams are to be created; the request's own structure is the seam
map:

- Simulation tick: `Game.update(FIXED_DT)` drives player, creatures,
  systems, and triggers (request §30, §36).
- Perception: creatures subscribe to the world-signal bus
  (`noise` / `light` / `sonar` / `injury`, request §63); the player
  emits signals from tools, boost, and sonar.
- Progression: recipes -> `EquipmentDef.capabilities` -> gates query
  capabilities and depth rating instead of hardcoded recipe IDs
  (request §9, §62, §4.3).
- Persistence: `save.ts` owns the versioned `localStorage` object
  (request §42); autosave on base return, major unlocks, and before the
  final descent (request §25).
- Content: chunk definitions and triggers are data-driven (request
  §17, §36); `validateWorld()` and `simulateCriticalPath()` guard the
  critical path (request §32, §4.4).

## Data And Persistence

- World: one connected authored map, ~18,000–28,000 units wide,
  deepest point ~-9,000 to -12,000 (request §4.1). Coarse chunk
  definitions stay fully in memory; only nearby chunks run AI/particles
  (request §17).
- Save: versioned `SaveGameV1` in `localStorage` (request §42); keep
  migration trivial; malformed save resets or backs up gracefully
  (request §70).
- Randomness: deterministic seeds for schools, particles, ambient
  scatter, idle variation; never for gates, critical resources, major
  reveals, lore order, or final-path viability (request §61).

## External Systems

None. Fully client-side. Browser APIs: WebGL (Three.js), `AudioContext`
(after first input), `localStorage`. No network calls, no backend.

## Known Constraints

- 60 FPS at 1080p on an ordinary desktop browser (request §34): pool
  particles, throttle offscreen AI, cap ambient counts, reuse
  geometry/materials, no per-frame allocations in hot loops, few DOM
  nodes.
- No React, no general ECS, no heavy physics engine (request §28).
- Widescreen-first: design 16:9, tolerate 21:9 by widening horizontal
  visibility, not stretching UI; aggro by world distance, not screen
  edge (request §16).
- Spoiler containment: hidden content lives only in
  `src/content/secret/` and `design_private/`; never in chat, commit
  summaries, screenshots, or progress reports (request §0, §12, §68).
- Scope-cut order if development balloons (request §72): gamepad,
  settings UI, codex, cosmetic upgrades, side caves, creature-vs-
  creature combat, second ending, post-processing. Never cut: creature
  roster quality, depth progression, sonar, atmosphere, the five
  spectacle beats, the final reveal/ending, friendly fauna, saves.
