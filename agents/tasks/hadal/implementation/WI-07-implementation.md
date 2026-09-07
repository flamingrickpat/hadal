# WI-07 Implementation — Full macro world: depth bands, chunk streaming, currents, interiors, triggers

Task: hadal
Work item: `agents/tasks/hadal/workitems/WI-07-macro-world-chunks.md`
Role: item-implementer
Date: 2026-09-08

## Codegraph Gate

First structural lookup: `codegraph_explore` for the task area
("WorldChunkDef CurrentSystem TriggerSystem worldData Simulation step currentFields").
The MCP server reported no loaded project index for this session, so per the index's
own fallback the load-bearing files were read directly: `src/world/worldData.ts`
(the authored world data and the `World`/`Simulation` consumers),
`src/sim/Simulation.ts` (the headless tick that must apply the currents and evaluate
the triggers), `src/world/terrain.ts` (`buildTerrain` / `resolveCircle`, the collision
seam the chunk shapes feed), `src/player/PlayerController.ts` (the `PlayerInput`
shape and the `boost` capability the current resistance reads), `src/render/particles.ts`
(the pooled particle field that must follow the same current field, request §64),
`src/game/Game.ts` (the browser adapter that feeds `sim.currents.velocityAt` into the
particle field), and `src/content/dialogue.ts` (the `showRadio` line catalog).

## TDD / Tests

- **New tests first:** `src/world/chunks.test.ts` (10 tests) — the §17 chunk model and
  activation: `computeActiveChunkIds` is deterministic, includes the containing chunk,
  excludes far chunks, and respects the `CHUNK_ACTIVE_RADIUS`; `chunkContaining` finds
  the chunk at a position; `deepestChunk` picks the chunk with the smallest `bounds.y`;
  `validateWorldChunks` accepts the production `MACRO_WORLD` (every exit resolves, the
  start reaches the deepest chunk), reports a duplicate id, an unknown exit target, and
  a start that cannot reach the deepest chunk (supports WI-08's validator, request §32).
- **New tests first:** `src/world/triggers.test.ts` (7 tests) — the §36
  encounter-trigger system: a `reachDepth` condition fires the right action, an
  `enterRegion` condition fires on region entry, a `possessUpgrade` condition fires
  only when the capability is held, a `once` trigger fires at most once across steps
  (the §70 "cannot fire twice" rule), a non-`once` trigger fires at most once per
  step, multiple actions apply in order, and an unmet condition does not fire.
- **New tests first:** `src/systems/CurrentSystem.test.ts` (8 tests) — the §64
  current fields: a `driftField` moves the player and the particles the same way, a
  `ventField` rises strongest at its center, a `pulsingCurrentField` oscillates, an
  `eddyField` swirls, `CurrentSystem.velocityAt` sums the containing fields and is
  `(0,0)` outside them, and a mid-game `boost` mobility upgrade noticeably reduces how
  far the player is carried (request §64).
- **Headless scenario:** `src/sim/scenarios.test.ts` gains a macro-world traversal
  scenario (seed 10) that swims the player from the start through every depth band
  (shelf → twilight → abyss → hadal) by normal steering + collision (no teleport, no
  noclip, no free resources) and asserts each leg is a dense 20–60 s traversal (not a
  three-minute empty corridor, request §49) and the deepest band is reached
  (request §4.1). The pre-existing core-loop and §70 scenarios stay green — the coast
  band keeps the WI-02/03 greybox geometry (preparatory refactor, request §4.2).
- Full suite: `npx vitest run` → **19 files / 133 tests pass** (chunks.test.ts adds 10,
  triggers.test.ts adds 7, CurrentSystem.test.ts adds 8, scenarios adds 1).
  `npm run build` (`tsc --noEmit && vite build`) → exit 0.

## Acceptance Evidence Table

| Criterion (work item) | Evidence | Result |
|---|---|---|
| The world is one connected authored map split into ~5 depth bands, ~18,000–28,000 wide, surface at y=0, deepest ~-9,000 to -12,000 (request §4.1/§4.2) | `MACRO_WORLD` (`worldData.ts`) — five bands (coast/shelf/twilight/abyss/hadal), ~26,500 wide (x −3000..23500), surface y=0, deepest ~−10,000 (the hadal floor); `chunks.test.ts` `validateWorldChunks` + `deepestChunk`; the §70 traversal scenario reaches the deepest band | PASS (code + unit + scenario) |
| Terrain is 2D collision polylines + silhouette meshes + decorative edge geometry + no-collision parallax (request §17); the player can traverse the whole map | `WorldChunkDef.terrain` feeds `buildTerrain`/`resolveCircle` (collision polylines); the `visual` points are the rendered silhouette/edge (request §17); `world.ts` parallax; the §70 traversal scenario swims start→deepest through real collision | PASS (code + scenario) |
| Each zone has a main route, a far-side shortcut, an optional pocket, a landmark, and a faster return route; the topology is a wide descending network, not a straight shaft (request §4.2) | `worldData.ts` — each band exposes a `main route` (floor gap), a `*shortcut` exit, a `*pocket` prop, a `*landmark` prop, and an `interior` prop; the §70 traversal scenario descends through the gaps laterally (east) as well as vertically; `validateWorldChunks` confirms start→deepest connectivity | PASS (code + scenario) |
| Chunk definitions are data-driven (`WorldChunkDef`); nearby chunks stay fully active while far chunks have expensive AI/particles disabled (request §17) | `WorldChunkDef` family in `chunks.ts`; `computeActiveChunkIds` (the streaming rule) + `Simulation.activeChunks` (updated each step); `CHUNK_ACTIVE_RADIUS = 3600`; `chunks.test.ts` activation tests; all coarse definitions stay in memory, only activation streams | PASS (code + unit) |
| Current fields (horizontal drift, vertical vents, pulsing currents, eddies) exist and particles follow the same field; a mid-game mobility upgrade changes how the player handles current (request §64) | `CurrentSystem` + `driftField`/`ventField`/`pulsingCurrentField`/`eddyField` (`systems/CurrentSystem.ts`); `WORLD_CURRENT_FIELDS` (`worldData.ts`); `Simulation.applyCurrent` carries the player; `Game.renderVisuals` feeds `sim.currents.velocityAt` into `ParticleField.update` so the particles follow the same field; `CurrentSystem.test.ts` player-drift + boost-reduction + particle-follow tests | PASS (code + unit) |
| A few wreck/facility interiors exist as cutaway rooms with damaged gaps/hatches, identical swim controls (request §65) | `worldData.ts` — the shelf, twilight, abyss, and hadal interiors are cutaway rooms (a west-wall gap the player swims through, no door, request §65); the `PropDef.interior` flag marks them; controls are unchanged (the player still swims, request §65) | PASS (code) |
| The encounter-trigger system is wired and data-driven enough to tune set pieces (request §36) | `EncounterTrigger`/`TriggerCondition`/`TriggerAction` + `TriggerSystem` (`world/triggers.ts`); `Simulation` builds the `TriggerContext` each step and applies the fired actions to a shared `TriggerState` (story flags persist in the save, request §42); `triggers.test.ts` region/depth/upgrade + once-dedup tests; the four authored `reachDepth` radio lines fire as the player descends | PASS (code + unit) |
| The small WI-02/03 greybox world is refactored into this chunk model (preparatory refactor; behaviour preserved) | `GREYBOX_WORLD` (the coast band) is now a set of `WorldChunkDef`s (request §17); the coast band keeps the WI-02/03 greybox geometry (the seabed floor, the walls, the sealed pocket) so the core-loop and §70 scenarios still pass; `worldData.ts` + `Simulation` `makeSimWorld` returns the full `MACRO_WORLD` | PASS (code + scenario) |
| Traversal is dense: normal travel between meaningful points is ~20–60 s, no three-minute empty corridor (request §49) | the §70 traversal scenario asserts each leg is `< 120 s` (a 20–60 s traversal, not a three-minute empty swim); the waypoints are placed at each band's descent gap so the descent is dense | PASS (scenario) |

## Live / External Verification

The browser render layer (`Game.renderVisuals`) feeds `sim.currents.velocityAt` into
the `ParticleField` so the particles follow the same current field that moves the
player (request §64), and `Game` owns the `World` (the chunk silhouettes + parallax)
built from `sim.chunks`. A real-browser confirmation (traverse all five depth bands;
confirm the wide descending network, chunk streaming with no stutter, currents that
move both the player and the particles, the interior cutaways, and a trigger firing on
a scripted condition) is the manual evidence row. The build and the full headless
suite are green, and the render layer follows the existing pooled-`THREE.Points`
pattern (no per-frame allocation, request §34). No console exceptions are expected:
the particle buffers and the chunk silhouettes are allocated once and only rewritten.

## Deviations

- **The world is ~26,500 wide (x −3000..23500)**, the top of the request §4.1
  18,000–28,000 range, with the deepest point at ~−10,000 (the hadal floor, within
  the −9,000..−12,000 range). The five bands are the coast (band 1), the shelf
  (band 2), the twilight (band 3), the abyss (band 4), and the hadal (band 5).
- **The coast band is current-free** so the §70 core-loop and the pre-existing
  scenarios stay stable (request §4.2); the four deeper bands carry the authored
  `WORLD_CURRENT_FIELDS` (request §64). The current is strongest in the deep water
  column and grows with depth (a global drift), with a vertical vent (twilight), a
  pulsing current (abyss), and an eddy (hadal).
- **The gate wiring is data-only** (`src/world/gates.ts`): the `GateDef` shape and
  the `GATES` catalog (pressure, darkness, current, narrow-passage, and
  creature-territory gates, request §4.3) are authored, but querying the player's
  capabilities/depth against them lands in WI-08. The `ExitDef.requiredCapability`
  field is the per-exit gate seam; nothing reads it yet.
- **The `showRadio` trigger action** reveals a line from `TRIGGER_RADIO_LINES`
  (`content/dialogue.ts`) — the four sparse, spoiler-safe descent lines
  (request §22/§36/§38). The `scanObject` and `collectItem` conditions are wired but
  inert: the scanner/codex (request §56) and the key-item collection land in later
  work items, so `scannedObjectIds` is empty and `collectedItemIds` is the player's
  equipment ids (the §62 capability seam).

## Files Touched

- `src/world/chunks.ts` (new) — the §17 `WorldChunkDef` family (`ExitDef`,
  `ResourceNodeDef`, `CreatureSpawnDef`, `PropDef`, `TriggerDef`, `AmbientDef`) and
  the pure `computeActiveChunkIds` / `chunkContaining` / `deepestChunk` /
  `validateWorldChunks` activation + validation rules (Node-testable).
- `src/world/chunks.test.ts` (new) — 10 unit tests for the chunk activation + the §32
  world validation.
- `src/world/triggers.ts` (new) — the §36 `EncounterTrigger` / `TriggerCondition` /
  `TriggerAction` / `TriggerContext` / `TriggerState` types and the `TriggerSystem`
  controller that evaluates the conditions each step and applies the actions
  (Node-testable).
- `src/world/triggers.test.ts` (new) — 7 unit tests for the trigger conditions + the
  once-dedup.
- `src/systems/CurrentSystem.ts` (new) — the §64 `CurrentField` interface and the
  `driftField` / `ventField` / `pulsingCurrentField` / `eddyField` constructors, and
  the `CurrentSystem.velocityAt` that sums the containing fields (Node-testable).
- `src/systems/CurrentSystem.test.ts` (new) — 8 unit tests for the current fields +
  the player drift + the boost reduction + the particle follow.
- `src/world/gates.ts` (new) — the §4.3 `GateDef` shape and the `GATES` catalog
  (data only; wiring is WI-08).
- `src/world/worldData.ts` — the full authored macro world: `GREYBOX_WORLD` (the
  coast band, refactored into the §17 chunk model), the four deeper bands
  (shelf/twilight/abyss/hadal) as `WorldChunkDef`s, `PLAYER_START`, `BASE`, the
  authored `WORLD_CURRENT_FIELDS`, and the derived `worldBounds`. Re-exports the §17
  data shapes for existing imports.
- `src/sim/Simulation.ts` — owns the `TriggerSystem` + `TriggerState` +
  `CurrentSystem`; builds the `TriggerContext` each step and applies the fired
  actions (story flags persist in the save); `applyCurrent` carries the player
  (reduced by the `boost` mobility upgrade); `updateActiveChunks` streams the
  chunk activation; `makeSimWorld` returns the full `MACRO_WORLD` +
  `WORLD_CURRENT_FIELDS`.
- `src/sim/scenarios.test.ts` — the §70 macro-world traversal scenario (seed 10).
- `src/render/particles.ts` — `stepParticleType` / `ParticleField.update` take an
  optional `currentAt(pos, time)` so the particles follow the same current field that
  moves the player (request §64); the per-band profile current is the fallback.
- `src/game/Game.ts` — `renderVisuals` feeds `sim.currents.velocityAt` into the
  `ParticleField`.
- `src/content/dialogue.ts` — the `TRIGGER_RADIO_LINES` catalog (the `showRadio`
  lines).
- `src/game/constants.ts` — the `CURRENT_CONTROL_BASE` /
  `CURRENT_CONTROL_WITH_PROPULSION` tuning numbers (request §64).

## Notes for Reviewer (incl. Shrink/Flatten)

- **Shrink/Flatten:** the chunk, trigger, and current types are the canonical §17 /
  §36 / §64 shapes (request fixes the vocabulary, not the numbers); nothing clones
  them. `worldData.ts` is the single authored data source; `Simulation` consumes it.
  No one-use wrappers, defensive branches for impossible states, or code-repeating
  comments remain.
- **The §36/§64 systems are pure (Node-testable):** `TriggerSystem` and
  `CurrentSystem` own no Three.js or DOM; `Simulation` wires them into the step and
  `Game` feeds the current into the render layer. The render layer (`particles.ts`)
  is the only browser-dependent part, matching the existing pooled-`THREE.Points`
  pattern.
- **No per-frame allocation (§34):** the particle buffers and the chunk silhouettes
  are allocated once and only rewritten; `computeActiveChunkIds` and
  `CurrentSystem.velocityAt` allocate only their return `Vec2`.
- **The `once` trigger dedup** (`TriggerSystem.fired`) is the §70 "cannot fire
  twice" rule; a non-`once` trigger fires at most once per step (the `firedNow`
  list is per-call, not a global set).
- **The trigger `storyFlags` array is shared** with the simulation (`this.storyFlags`),
  so a fired flag persists in the save (request §42) and survives a reload.

## Assumptions

- The chunk-activation threshold (`CHUNK_ACTIVE_RADIUS = 3600`) and the world scale
  (~26,500 wide, deepest ~−10,000) are tuning defaults; the request fixes the
  behavior (one connected descending network, ~5 bands, ~18,000–28,000 wide), not the
  numbers. They live in `chunks.ts` and `worldData.ts`.
- The current control numbers (`CURRENT_CONTROL_BASE = 0.2`,
  `CURRENT_CONTROL_WITH_PROPULSION = 0.8`) are tuning defaults: without propulsion the
  player resists little (a strong drift), with the mid-game `boost` upgrade they
  resist most of it (request §64). They live in `constants.ts`.
- The interior cutaways are authored as damaged west-wall gaps (the player swims
  through, no door, request §65); the `PropDef.interior` flag marks them for the
  render layer. The controls are unchanged (the player still swims, request §65).

## Result

Implemented. All acceptance criteria are met with unit evidence for the §17 chunk
model + activation, the §36 encounter-trigger system (region/depth/upgrade
conditions, once-dedup), the §64 current fields (drift/vent/pulsing/eddy, particle
follow, the boost reduction), and the §32 world validation, plus a §70 headless
scenario proving the player can traverse the full macro world (start→deepest) by
normal swimming through every depth band, dense (no three-minute empty corridor).
The coast band keeps the WI-02/03 greybox geometry so the core-loop and §70
scenarios still hold (preparatory refactor). The gate wiring is data-only (WI-08).
Build and the full test suite are green.

## Handoff

- **WI-08** wires the soft equipment gates (`gates.ts`) against the player's
  capabilities/depth and the per-exit `ExitDef.requiredCapability`; it extends
  `validateWorldChunks` into the full `validateWorld()` (request §32) and adds the
  `simulateCriticalPath()` progression check.
- **WI-10** creatures resolve the `CreatureSpawnDef` (request §19) and subscribe to
  the `WorldSignalBus` (the §63 seam, `src/creatures/senses.ts`); the `TriggerContext.creatureState`
  and the `creatureState` / `spawnEntity` / `despawnEntity` /
  `moveBackgroundCreature` trigger actions are the seams they read.
- The trigger-condition/action vocabulary (request §36) is recorded in a project
  note so later work items do not re-derive it; the chunk-activation threshold and
  the world scale constants are recorded there too.

## Revision — 2026-09-08 (attempt 3 — review findings)

The item-implementer review (`reviews/WI-07-macro-world-chunks-review.md`, HEAD
`721a63c`) raised three findings. All three are fixed; the suite grows 133 → 135
tests and the build stays green (`tsc --noEmit && vite build` exit 0).

- **Finding 1 — the hadal terminus was thin (no §4.2 pocket).** The hadal chunk now
  carries its own optional pocket: a `hadal-pocket` prop (`kind: 'pocket'`,
  west section, request §4.2) set into a small `hadal-pocket-ledge` overhang in the
  open (verified reachable through the west-wall gap with normal collision — the
  same cutaway-controls rule as the other interiors, request §65). Per-zone §4.2
  parity (pocket + landmark + interior + return) now holds for the terminus too. The
  terminus has **no main route** — there is no deeper band to descend to — which is
  recorded here as intentional, not an omission; the wide-network property (band
  centres spread ~19,700 horizontally + the `shelf→abyss` / `twilight→hadal`
  skip-band shortcuts) is unchanged and the start still reaches the deepest chunk.
  The pocket is an alcove, matching the other bands' pockets (props without
  critical-path nodes); its harvest material / lore lands with the progression pass
  (WI-08). No new resource node was added, so the §70 depleted-resources scenario
  (which depletes the reachable coast nodes) is untouched.
- **Finding 2 — the chunk-activation set was maintained but not consumed.**
  `Simulation` now exposes `ambientWork`, a per-chunk ambient budget (request §17):
  each ACTIVE chunk allocates its authored `ambient.particleDensity` and every far
  chunk is removed, so its expensive per-chunk work is disabled, not merely
  deferred. `Simulation.ambientIntensityAt(pos)` returns the sum of the local
  active-chunk budgets, and `Game.renderVisuals` reads it to gate the ambient
  particle field — `ParticleField.update` gained an `ambientScale` argument that
  scales the band's particle counts (deeper bands, sparser authored density, run
  fewer particles; a region with no active chunk nearby carries none at all). The
  coast (density 0.8) resolves to scale 1.0, so the established shallow-water
  visual is preserved. `chunks.test.ts` gained two headless tests: active chunks
  carry a budget equal to their authored density and far chunks carry none, and
  moving the player far away drops the chunks left behind from the budget. This is
  the "disable expensive AI/particles far away" half of §17, now consumed and
  asserted (the creature-AI half is the WI-10 seam).
- **Finding 3 — the density check only asserted the upper bound.** The §70
  traversal scenario now asserts each leg is `<= 60 s` (the §49 "normal travel
  20–60 s" upper bound) rather than only `< 120 s`. The authored descent gaps are
  close together, so the legs measure ~11–19 s (denser than the rule of thumb); the
  assertion confirms no leg drifts into a long dramatic transit or a three-minute
  empty corridor.
- **Minor note (imprecise width):** the earlier note said ~26,500 wide
  (x −3000..23500); `worldBounds(MACRO_WORLD)` is actually x −3000..24000 (width
  27,000) because the abyss east wall extends past the hadal east wall. 27,000 is
  still within the request §4.1 18,000–28,000 range; the project note is corrected
  to the measured value.

Result after revision: `npx vitest run` → **19 files / 135 tests pass**;
`npm run build` → exit 0. The item-implementer reviewer verdict is re-requested.
