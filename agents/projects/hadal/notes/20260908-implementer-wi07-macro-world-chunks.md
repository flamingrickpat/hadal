---
title: WI-07 macro world chunk model, currents, triggers, and soft gates
role: item-implementer
created: 2026-09-08
tags: [world, chunks, currents, triggers, gates, macro]
symbols: [WorldChunkDef, computeActiveChunkIds, CHUNK_ACTIVE_RADIUS, validateWorldChunks, ambientWork, ambientIntensityAt, TriggerSystem, TriggerCondition, TriggerAction, CurrentSystem, CurrentField, driftField, ventField, pulsingCurrentField, eddyField, GateDef, GATES, MACRO_WORLD, WORLD_CURRENT_FIELDS]
files: [src/world/chunks.ts, src/world/worldData.ts, src/world/triggers.ts, src/systems/CurrentSystem.ts, src/world/gates.ts, src/sim/Simulation.ts, src/render/particles.ts, src/game/Game.ts]
---

# WI-07 macro world chunk model, currents, triggers, and soft gates

## Summary

The full authored macro world (request §4.1/§4.2/§17/§36/§64/§65): the starting
coast band plus four deeper bands as a wide descending network, each band a set of
`WorldChunkDef` entries (terrain, exits, props, interiors, triggers), the surface
base, the player start, and the authored current fields. The chunk *shapes* live in
`src/world/chunks.ts`; the authored chunk *instances* live in `src/world/worldData.ts`.

## Key Facts

- **World scale constants (request §4.1):** the world spans 27,000 units wide
  (x −3000..24000 — the abyss east wall extends past the hadal east wall), surface
  at y = 0, deepest point ~−10,000 (the hadal floor). The five depth bands are the
  coast (band 1), the shelf (band 2), the twilight (band 3), the abyss (band 4), and
  the hadal (band 5). The `WorldChunkDef.band` field is the band index.
- **Per-chunk ambient work gate (request §17):** `Simulation.ambientWork` is a
  per-chunk budget — each ACTIVE chunk allocates its authored `ambient.particleDensity`
  and every far chunk is removed, so its expensive per-chunk work is disabled, not
  deferred. `Simulation.ambientIntensityAt(pos)` sums the local active-chunk
  budgets, and `Game.renderVisuals` reads it to scale the ambient particle field
  (`ParticleField.update` gained an `ambientScale` argument). The coast (density 0.8)
  resolves to scale 1.0 (shallow-water visual unchanged); deeper bands (0.4–0.6) run
  sparser. This is the "disable expensive AI/particles far away" half of §17 —
  consumed and asserted in `chunks.test.ts`; the creature-AI half is the WI-10 seam.
- **Chunk-activation threshold (request §17):** `CHUNK_ACTIVE_RADIUS = 3600`
  world units (`src/world/chunks.ts`). Chunks whose bounds are within this radius
  of the player stay fully active; farther chunks have their expensive
  AI/particles disabled. All coarse chunk definitions stay in memory — only
  activation is streamed (`Simulation.activeChunks`, updated each step by
  `updateActiveChunks`).
- **Trigger-condition/action vocabulary (request §36):** the `TriggerCondition`
  kinds are `enterRegion`, `reachDepth`, `possessUpgrade`, `scanObject`,
  `collectItem`, `creatureState`, `timeInRegion`, and `returnThrough`
  (`src/world/triggers.ts`). The `TriggerAction` kinds are `spawnEntity`,
  `despawnEntity`, `playAudio`, `alterAmbient`, `moveBackgroundCreature`,
  `lockPath`, `showRadio`, `camera`, `timedEvent`, and `setStoryFlag`. A `once`
  trigger fires at most once across all steps; a non-`once` trigger fires at most
  once per step. The `showRadio` action reveals a line from
  `TRIGGER_RADIO_LINES` (`src/content/dialogue.ts`). The `scanObject` and
  `collectItem` conditions are wired but inert (the scanner/codex and the key-item
  collection land in later work items).
- **Current fields (request §64):** `WORLD_CURRENT_FIELDS`
  (`src/world/worldData.ts`) is a global horizontal drift across the deep water
  column, a vertical vent (twilight), a pulsing current (abyss), and a slow eddy
  (hadal). The coast band is current-free so the §70 core-loop and the
  pre-existing scenarios stay stable. `CurrentSystem.velocityAt` sums the fields
  whose bounds contain the position; a position outside every field is `(0, 0)`.
  The player is carried by `current * (1 - control) * dt` (request §64): without
  propulsion `control = CURRENT_CONTROL_BASE` (0.2), with the mid-game `boost`
  mobility upgrade `control = CURRENT_CONTROL_WITH_PROPULSION` (0.8). The
  particles follow the same field: `Game.renderVisuals` feeds
  `sim.currents.velocityAt` into `ParticleField.update` (request §64).
- **Soft equipment gates (request §4.3):** `GateDef` + `GATES`
  (`src/world/gates.ts`) are the pressure, darkness, current, narrow-passage, and
  creature-territory gates (data only). The gate *wiring* (querying the player's
  capabilities/depth against them) lands in WI-08. The `ExitDef.requiredCapability`
  field is the per-exit gate seam; nothing reads it yet.
- **The coast band keeps the WI-02/03 greybox geometry** (the seabed floor, the
  walls, the sealed pocket) so the core-loop and §70 scenarios still hold
  (preparatory refactor, request §4.2). The `seal` pocket is sealed (its node is
  unreachable from the start, request §32).

## Navigation

- `src/world/chunks.ts` — the §17 `WorldChunkDef` family + the pure
  `computeActiveChunkIds` / `chunkContaining` / `deepestChunk` /
  `validateWorldChunks` activation + validation rules.
- `src/world/worldData.ts` — the authored chunk instances (`GREYBOX_WORLD`,
  `MACRO_WORLD`), `PLAYER_START`, `BASE`, `WORLD_CURRENT_FIELDS`, `worldBounds`.
- `src/world/triggers.ts` — the §36 `EncounterTrigger` / `TriggerCondition` /
  `TriggerAction` / `TriggerContext` / `TriggerState` types + the `TriggerSystem`.
- `src/systems/CurrentSystem.ts` — the §64 `CurrentField` interface + the
  `driftField` / `ventField` / `pulsingCurrentField` / `eddyField` constructors +
  the `CurrentSystem.velocityAt`.
- `src/world/gates.ts` — the §4.3 `GateDef` shape + the `GATES` catalog (data only).
- `src/sim/Simulation.ts` — owns the `TriggerSystem` / `TriggerState` /
  `CurrentSystem`; builds the `TriggerContext` each step; `applyCurrent` carries
  the player; `updateActiveChunks` streams the chunk activation.

## Gotchas

- **The `showRadio` trigger action** reveals a line from `TRIGGER_RADIO_LINES`;
  the `radioText` is mapped through the catalog to the player-facing line
  (`Simulation.step`). The `scanObject` and `collectItem` conditions are wired but
  inert — the scanner/codex (request §56) and the key-item collection land in
  later work items.
- **The coast band is current-free** so the §70 core-loop and the pre-existing
  scenarios stay stable. The four deeper bands carry the authored
  `WORLD_CURRENT_FIELDS`.
- **The gate wiring is data-only** (`gates.ts`); querying the player's
  capabilities/depth against the gates lands in WI-08. The
  `ExitDef.requiredCapability` field is the per-exit gate seam.
- **The trigger `storyFlags` array is shared** with the simulation
  (`Simulation.storyFlags`), so a fired flag persists in the save (request §42)
  and survives a reload.

## Commands

- `npx vitest run src/world/chunks.test.ts` — the §17 chunk activation + the §32
  world validation.
- `npx vitest run src/world/triggers.test.ts` — the §36 trigger conditions + the
  once-dedup.
- `npx vitest run src/systems/CurrentSystem.test.ts` — the §64 current fields +
  the player drift + the boost reduction + the particle follow.
- `npx vitest run src/sim/scenarios.test.ts` — the §70 macro-world traversal
  scenario (seed 10) + the pre-existing core-loop and §70 scenarios.
- `npx vitest run` — the full headless suite.
