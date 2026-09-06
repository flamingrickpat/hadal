---
title: Headless simulation core, save, crafting, and scenario harness after WI-03
role: item-implementer
created: 2026-09-06
tags: [simulation, save, crafting, scenario-harness, death-respawn, base, debug, localStorage]
symbols: [Simulation, createSimulation, makeSimWorld, createSimulationFromSave, emptyInput, Scenario, SaveGameV1, serializeSave, parseSave, loadFromStorage, saveToStorage, resetSave, makeMemoryStorage, CraftingSystem, canCraft, applyEquipment, findItem, CraftingMenu, DebugPanel]
files: [src/sim/Simulation.ts, src/sim/scenario.ts, src/game/save.ts, src/systems/CraftingSystem.ts, src/content/recipes.ts, src/content/resources.ts, src/content/items.ts, src/content/dialogue.ts, src/ui/menu.ts, src/game/Game.ts, src/main.ts, src/util/debug.ts, src/world/worldData.ts, src/player/Player.ts, src/player/PlayerController.ts, src/game/constants.ts]
---

# Headless Simulation Core, Save, Crafting, And Scenario Harness (After WI-03)

## Summary

The core gameplay logic (movement, collision, oxygen, harvesting, crafting,
base return, death/respawn, and save) now lives in a Node-importable
`Simulation` core (`src/sim/Simulation.ts`). The browser is a thin adapter
around it; headless scenarios advance the same core with normal player
actions through a reusable `Scenario` harness (`src/sim/scenario.ts`). The
versioned `SaveGameV1` save persists to `localStorage` with graceful
malformed-save handling. A tiny surface base holds one harvestable material,
one craftable upgrade, and the debug panel.

## Key Facts

- **The single simulation seam.** `Game.update(FIXED_DT)` (browser) and
  `Scenario.step(input, dt)` (harness) both call `sim.step(input, dt)`.
  `Simulation.step` runs: `state.tick` -> `controller.update` (movement +
  meters + facing) -> optional `setToolIndex` -> `terrain.resolveCircle`
  (skipped when `noclip`) -> harvest -> craft -> base-return -> death ->
  progression. There is no second movement/collision path (request §30).
- **Player actions are data.** `PlayerInput` (in `PlayerController.ts`)
  carries level state (thrust/boost/interact/sonar) plus one-shot actions
  (`toolSelect`, `craftRequest`) that `sim.step` consumes and resets, so a
  browser frame with several simulation steps consumes each once. The
  browser input adapter is `PlayerController.bindToWindow`; the crafting
  menu submits a craft by setting `controller.input.craftRequest`.
- **Save (request §42, §25, §70).** `src/game/save.ts` owns the
  versioned `SaveGameV1` (`version: 1`), the `localStorage` key
  `hadal.save.v1`, and the backup key `hadal.save.v1.bak`. `serializeSave` /
  `parseSave` are storage-independent (typed `SaveParseError` on bad
  input); `loadFromStorage` resets + backs up a malformed stored value. The
  browser adapter is the `window.localStorage` passed by `Game`.
- **Crafting (request §9, §62).** `CraftingSystem` is pure (recipes ->
  `EquipmentDef` capabilities from a material pool). The `Simulation`
  wraps it: `handleCraft` requires the player at the base (workbench),
  draws the cost from banked then carried resources, applies the
  `EquipmentDef` (`applyEquipment`), records the equipment id, and requests
  an autosave. First recipe `tank-1` (+65 s O2) and `fins-1` (+speed,
  `boost` capability) are `EquipmentDef`s in `content/recipes.ts`.
- **Base (request §5).** `worldData.ts BASE` is a tiny surface platform
  (radius `BASE_RADIUS` 260) at `PLAYER_START` with stations
  workbench / storage / dive-terminal / radio / launch-edge. Returning to
  the base region banks carried resources, autosaves, and pushes a concise
  story line (`content/dialogue.ts`); the browser shows the line in a radio
  div and the workbench in the `CraftingMenu`. No large hub.
- **Death/respawn (request §25).** `Simulation.respawn` puts the player at
  the base, refills O2/health, keeps permanent upgrades + banked +
  discoveries, and drops `DEATH_RESOURCE_LOSS_FRACTION` (0.3) of unbanked
  resources.
- **World (request §8, §32).** `worldData.ts GREYBOX_WORLD` gained five
  reachable `salvage` nodes plus a sealed pocket (`seal` chunk, a
  full-column wall) holding an unreachable `salvage-sealed` node — the
  blocked-route target.
- **Scenario harness (request §70).** `Scenario` wraps a `Simulation` and
  advances it on `FIXED_DT`. `swimTo` / `steerToward` select movement
  inputs only (never assign positions or bypass collision). `assert` /
  `assertNear` throw `ScenarioFailure` whose message is the concise trace:
  `seed, t, pos, input, assertion`.

## Navigation

- Create a simulation: `createSimulation(makeSimWorld(), seed)`; from a
  save: `createSimulationFromSave(save, seed)`.
- Headless scenario: `const s = new Scenario(seed); s.swimTo(pos); s.stepFor(1, input); s.assert(...)`.
- Browser: `main.ts` builds `Game(renderer)` + `DebugPanel(game)`; `game.update(FIXED_DT)` steps the sim, `renderer.follow` + `renderer.render` draw it.

## Gotchas

- `PlayerController` imports `Renderer` **type-only** so the sim stays
  browser-free; `bindToWindow` (the only browser-touching method) is called
  by `Game`, never by the sim.
- Crafting requires `isAtBase`; a craft off the base returns
  `{ reason: 'notAtBase' }`.
- The sim's `loadFromSave` re-applies starter gear then the saved
  equipment, so derived state (`o2Max`, `speedMult`, `cargo`,
  `capabilities`) is rebuilt, not stored.
- `npm test` runs the headless Vitest suite (`environment: 'node'`);
  `npm run test:browser` is the distinct browser-layer command (`vite
  build`).

## Commands

- `npm test` — headless suite once, returns exit status.
- `npm run test:browser` — distinct browser-layer command.
- `npm run build` — `tsc --noEmit && vite build`.
