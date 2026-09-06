# Architecture

## System Overview

A Vite + TypeScript browser game. Gameplay is strictly on the `x/y`
plane; `z` is visual layering only (request §13). The simulation runs on
a fixed 1/60 s timestep (request §30) inside the single seam
`Game.update(FIXED_DT)` (`src/game/Game.ts:85`), drained from an
accumulator in a `requestAnimationFrame` loop and independent of frame
timing. Rendering via Three.js `WebGLRenderer` (request §28); audio via
native `AudioContext` (after first input, request §27) — not yet built;
saves via versioned `localStorage` (request §42) — not yet built. No
server, no network.

Current state (built in 184d348 + 6a21844, approved at 7aa2435): the
boot loop, orthographic camera follow, player inertial swim, 2D terrain
collision, O2/HP/depth meters, a minimal HUD, and a hidden debug
teleport panel are implemented and unit-tested. See "Current State
(after WI-02)" below for what exists and "Main Components" for the
target layout the rest of the game grows into.

## Current State (after WI-02)

Built and unit-tested (4 test files / 31 tests, all passing):

- `src/main.ts` — boot: `#game` container -> `Renderer` -> `Game` ->
  `enableDebugPanel` -> `game.start()`.
- `src/game/` — `constants.ts` (all shared tuning numbers: `FIXED_DT`
  1/60, 1920×1080 design size, `CAMERA_VIEW_WIDTH` 2000, world
  24000×12000, player accel 600/560 + drag 2/s, O2/HP meters, camera lag
  0.15 s), `GameState.ts` (session clock `timeSec`), `Game.ts` (the
  single `update(FIXED_DT)` seam + frame accumulator + Esc pause +
  debug teleport/readout hooks).
- `src/player/` — `Player.ts` (state: position/velocity/O2/health/depth/
  tools/capabilities/cargo/facing), `PlayerController.ts` (request §6
  inertial integrator, §7 meters, §6 WASD/Shift/mouse/E/Q/1-4 input),
  `equipment.ts` (request §62 `EquipmentDef`/`Capability` + tier-0
  starter gear via `applyStarterGear`), `inventory.ts` (request §7 single
  cargo capacity).
- `src/world/` — `worldData.ts` (greybox `GREYBOX_WORLD`: seabed, west
  wall, central wall, ridge + `PLAYER_START` + `worldBounds`; the
  request §17 authored chunk model grows this file in WI-07),
  `terrain.ts` (request §31 `buildTerrain`/`resolveCircle` circle-vs-
  segment), `World.ts` (chunks -> silhouette meshes + collision terrain).
- `src/systems/CollisionSystem.ts` — per-step player/terrain resolution
  (request §31).
- `src/render/Renderer.ts` — `WebGLRenderer` + fixed-width orthographic
  camera follow (request §16) + `screenToWorld` for mouse aim.
- `src/ui/hud.ts` — minimal O2/HP/depth/tool readouts + pause overlay
  (request §26), a handful of fixed DOM nodes.
- `src/util/` — `math.ts` (`Vec2`/`Rect` + `vec2`/`clamp`/`lerpAngle`),
  `rng.ts` (request §61 seeded PRNG `createRng`), `debug.ts` (request
  §33 hidden panel: teleport + readout, `?debug=1` / Backquote+F2).

Test files: `src/world/terrain.test.ts`, `src/player/PlayerController.
test.ts`, `src/player/PlayerMeters.test.ts`, `src/util/rng.test.ts`.

## Main Components (target per request §29)

Target layout — items not yet built are marked `(target)`; new behavior
attaches to these existing seams rather than inventing parallel ones:

- `src/game/` — `Game.ts` (frame orchestration, single `update` seam),
  `GameState.ts`, `constants.ts`; (target) `save.ts` (versioned
  `SaveGameV1`, request §42).
- `src/render/` — `Renderer.ts`; (target) `CameraRig.ts` (aim lead +
  encounter zoom, request §16), `materials.ts`, `lighting.ts`
  (flashlight cone mask, request §15), `particles.ts`, `postfx.ts`.
- `src/world/` — `World.ts`, `terrain.ts`, `worldData.ts` (authored
  chunk data); (target) `chunks.ts` (chunk streaming, request §17),
  `gates.ts` (soft equipment gates, request §4.3), `triggers.ts`
  (encounter triggers, request §36).
- `src/player/` — `Player.ts`, `PlayerController.ts`, `equipment.ts`
  (`EquipmentDef` + capabilities, request §62), `inventory.ts`.
- `src/creatures/` — (target) `Creature.ts`, `CreatureDef.ts` (request
  §19), `creatureFactory.ts`, `steering.ts`, `senses.ts` (world-signal
  bus, request §63), `spineRenderer.ts` (request §13.2), `behaviors/`.
- `src/systems/` — `CollisionSystem.ts`; (target) resources, crafting,
  sonar (request §18), audio (request §27), triggers, currents
  (request §64).
- `src/content/` — (target) `recipes.ts`, `items.ts`, `resources.ts`,
  `dialogue.ts`, `landmarks.ts`, and `secret/` (hidden world/creatures/
  encounters/lore — request §12/§29, kept out of player-facing docs and
  progress reports).
- `src/ui/` — `hud.ts`; (target) menus, map overlay, `styles.css`
  (request §26).
- `src/util/` — `math.ts`, `rng.ts` (request §61), `debug.ts` (request
  §33); (target) spatial hash, and the `validateWorld()` /
  `simulateCriticalPath()` validators (request §32).
- `design_private/` — (target) private creative design files (request
  §12); gitignored.

## Entry Points

- User entry point: `index.html` -> `src/main.ts`.
- Dev/prod: `npm run dev`; `npm run build` + `npm run preview`
  (request §69).
- Hidden developer entry point: `?debug=1` or Backquote + `F2` debug
  panel (request §33) — currently a teleport + readout panel; the rest
  of §33 grows in `src/util/debug.ts` (WI-03+).

## Integration Seams

The single simulation seam and the future perception seam own all
behavior — new systems attach here, not to parallel islands:

- Simulation tick: `Game.update(FIXED_DT)` drives state -> controller ->
  collision -> mesh sync -> hud (request §30, §36). Every new system
  (creatures, sonar, crafting, triggers, currents) runs inside this step
  in authored order.
- Perception (target): the world-signal bus (`noise` / `light` /
  `sonar` / `injury`, request §63) — creatures subscribe; the player
  emits signals from tools, boost, and sonar.
- Progression (target): recipes -> `EquipmentDef.capabilities` -> gates
  query capabilities and depth rating instead of hardcoded recipe IDs
  (request §9, §62, §4.3).
- Persistence (target): `save.ts` owns the versioned `localStorage`
  object (request §42); autosave on base return, major unlocks, and
  before the final descent (request §25).
- Content (target): chunk definitions and triggers are data-driven
  (request §17, §36); `validateWorld()` and `simulateCriticalPath()`
  guard the critical path (request §32, §4.4).

## Data And Persistence

- World: one connected authored map, ~18,000–28,000 units wide, deepest
  point ~-9,000 to -12,000 (request §4.1). Currently a small greybox
  (`GREYBOX_WORLD`, x −3000…5600, floor ~-1200…-1550); the full macro
  world grows in WI-07. Coarse chunk definitions stay fully in memory;
  only nearby chunks run AI/particles (request §17).
- Save (target): versioned `SaveGameV1` in `localStorage` (request §42);
  keep migration trivial; malformed save resets or backs up gracefully
  (request §70). Not implemented yet.
- Randomness: `createRng` (request §61) for schools, particles, ambient
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
  edge (request §16). The renderer keeps a fixed 2000-unit view width
  and scales height to the window aspect (`Renderer.resize`).
- Spoiler containment: hidden content lives only in
  `src/content/secret/` and `design_private/` (gitignored); never in
  chat, commit summaries, screenshots, or progress reports (request §0,
  §12, §68).
- Scope-cut order if development balloons (request §72): gamepad,
  settings UI, codex, cosmetic upgrades, side caves, creature-vs-
  creature combat, second ending, post-processing. Never cut: creature
  roster quality, depth progression, sonar, atmosphere, the five
  spectacle beats, the final reveal/ending, friendly fauna, saves.
