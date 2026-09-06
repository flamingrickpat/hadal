---
title: Post-WI-02 seam map — what exists and where the next work items attach
role: understander
created: 2026-09-05
tags: [seams, architecture, save, crafting, world, creatures, signal-bus, codegraph-stale]
symbols: [Game.update, GameState, Player.capabilities, EquipmentDef, Capability, Cargo, WorldChunkDef, GREYBOX_WORLD, buildTerrain, applyStarterGear, createRng]
files: [src/game/Game.ts, src/game/GameState.ts, src/game/constants.ts, src/player/PlayerController.ts, src/player/equipment.ts, src/player/inventory.ts, src/world/worldData.ts, src/world/terrain.ts, src/world/World.ts, src/systems/CollisionSystem.ts, src/render/Renderer.ts, src/util/rng.ts, src/util/debug.ts]
---

# Post-WI-02 Seam Map

## Summary

After WI-02 (approved at 7aa2435) the buildable game has a single
simulation seam and a small greybox world. This note maps each not-yet-
built system to the exact existing type or file it must consume, so a
future implementer does not re-derive the integration point or clone a
concept the spec already owns.

## Key Facts

- Single seam: `Game.update(FIXED_DT)` (`src/game/Game.ts:85`) runs
  state -> `PlayerController` -> `CollisionSystem` -> mesh sync -> `Hud`.
  Every upcoming system (base/crafting, sonar, creatures, triggers,
  currents) slots into this step in authored order; do not add a second
  tick (plan A-C7).
- Persistence gap: `GameState` (`src/game/GameState.ts`) owns only
  `timeSec` and explicitly does NOT own persistence. The versioned
  `localStorage` save (request §42) is a new `src/game/save.ts` module
  (WI-03); a browser adapter reads/writes the storage, serialization is
  storage-independent (request §30).
- Progression types already exist: `EquipmentDef` + the `Capability`
  union and `applyStarterGear`/`STARTER_GEAR` (tier 0) are in
  `src/player/equipment.ts` (request §62); `Player.capabilities`
  (a `Set<Capability>`) is the capability carrier. The crafting system
  (WI-03/WI-08) consumes these — do not clone a second capability type.
- Cargo: `Cargo` (`src/player/inventory.ts`) is a single
  `capacity`/`used` pair (request §7); the resource system (WI-03)
  adds/subtracts `used` and must clamp.
- World refactor target: `GREYBOX_WORLD` + `WorldChunkDef` +
  `worldBounds` (`src/world/worldData.ts`) is the current greybox map
  and the WI-07 target for the full request §17 authored chunk model
  (a preparatory refactor, not a new parallel file). `buildTerrain` /
  `resolveCircle` (`src/world/terrain.ts`, request §31) are the
  collision core that survives that refactor.
- Randomness: `createRng` (`src/util/rng.ts`, request §61) is the only
  PRNG; never feed it into gates, critical resources, major reveals, or
  lore order (request §61, §4.4).
- Not yet built (target homes): `src/game/save.ts`,
  `src/world/chunks.ts`/`gates.ts`/`triggers.ts`, `src/creatures/*`,
  `src/systems/` (resources/crafting/sonar/audio/triggers/currents),
  `src/content/*` + `src/content/secret/`, `src/render/` (lighting,
  particles, camera rig), `design_private/` (gitignored).

## Gotchas

- The codegraph index at `.codegraph/` is stale for product symbols:
  `codegraph_explore` for `Game`, `PlayerController`, `createRng`, etc.
  returns "No relevant code found". Use direct file reads (this tree is
  small) until the index is rebuilt; see the WI-01 reviewer note.

## Commands

- `npx vitest run` — 4 files / 31 tests (movement, meters, terrain, RNG).
- `npm run build` — `tsc --noEmit && vite build`, exit 0.
- Browser probe recipe: `agents/tasks/hadal/scratch/` (Playwright
  Chromium driving a real `npm run dev` page at 1920x1080).
