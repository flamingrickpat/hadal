# WI-07: Full macro world — depth bands, chunk streaming, currents, interiors, triggers

## Identity

- Task: hadal
- Story: implicit
- Owner role: `item-implementer`
- Complexity: high
- Dependencies: WI-03

## Goal

Replace the small greybox world with the full authored macro world: a connected side-view map of ~5 depth bands as authored chunks, with chunk streaming, 2D terrain, current fields, a few wreck/facility interiors, and the encounter-trigger system — so the world is a wide descending network the player can traverse end to end.

## Vision Link

Request §4.1 (finite authored world, ~18,000–28,000 wide, deepest ~-9,000 to -12,000, surface y=0), §4.2 (wide descending network; per-zone route/shortcut/pocket/landmark/encounter/return), §17 (chunk model `WorldChunkDef`, terrain polylines + silhouettes + parallax, keep nearby chunks active), §64 (current fields), §65 (interiors as cutaway rooms), §36 (encounter triggers), §60 (world-state reactions), §49 (dense traversal, no empty corridors). §45 "at least four meaningful depth transitions after the starting coast".

## Acceptance Criteria

- [ ] The world is one connected authored map split into ~5 depth bands (request §4.1/§4.2), ~18,000–28,000 units wide, surface at y=0, deepest point ~-9,000 to -12,000.
- [ ] Terrain is represented as 2D collision polylines + silhouette meshes + decorative edge geometry + no-collision parallax versions (request §17); the player can traverse the whole map.
- [ ] Each zone has a main route, at least one far-side shortcut, at least one optional pocket, at least one landmark, and a faster return route (request §4.2); the topology is a wide descending network, not a straight shaft (request §4.2).
- [ ] Chunk definitions are data-driven (`WorldChunkDef`, request §17); nearby chunks stay fully active while far chunks have expensive AI/particles disabled (request §17).
- [ ] Current fields (`CurrentField`, request §64) exist (horizontal drift, vertical vents, pulsing currents, eddies) and particles follow the same field (request §64); at least one mid-game mobility upgrade noticeably changes how the player handles current.
- [ ] A few wreck/facility interiors exist as cutaway rooms with damaged gaps/hatches (not a tile platformer; identical swim controls, request §65).
- [ ] The encounter-trigger system (`EncounterTrigger`/`TriggerCondition`/`TriggerAction`, request §36) is wired and data-driven enough to tune set pieces.
- [ ] The small WI-02/03 greybox world is refactored into this chunk model (preparatory refactor; behaviour preserved).
- [ ] Traversal is dense: normal travel between meaningful points is ~20–60 s and no three-minute empty corridor exists (request §49).

## Required Evidence

| Criterion | Evidence type | Command or artifact |
|---|---|---|
| Full map, ~5 bands, correct scale | manual (browser) + workflow | traverse the whole map; reviewer confirms band count/scale and §4.2 per-zone topology |
| Terrain representation | manual (browser) + workflow | swim through terrain; reviewer confirms polylines + silhouettes + parallax + interior cutaways |
| Chunk streaming | workflow (code + review) + manual | reviewer confirms nearby-active/far-disabled; player traverses without stutter |
| Current fields + particles follow | manual (browser) | swim through a current; particles follow the field; a mobility upgrade changes handling |
| Encounter-trigger system | workflow (code + review) | a test triggers a region/depth/upgrade condition and asserts the action fires |
| Greybox refactor preserved behaviour | workflow (code + review) | existing greybox traversal still works after the refactor |

## Tests To Write First

- A Vitest test that the macro world is connected (every chunk has valid exits; start to deepest is reachable) over the `WorldChunkDef` data (supports WI-08's validator).
- A Vitest test that the encounter-trigger system fires the right action for a region/depth/upgrade condition (request §36).

## Live Or External Verification

In a real desktop browser: traverse all five depth bands; confirm the wide descending network, chunk streaming (no stutter), current fields with following particles, interior cutaways, and a trigger firing on a scripted condition.

## Infrastructure Required

- Start: `npm run dev`
- Restart: re-run `npm run dev`
- Health: full map traversable, chunks stream, currents work, triggers fire, no console exceptions
- Timeout: n/a
- Endpoint or MCP: none

## File Pointers

- `src/world/World.ts`, `src/world/chunks.ts` (`WorldChunkDef`, request §17), `src/world/worldData.ts` (authored chunk data), `src/world/terrain.ts`, `src/world/gates.ts` (request §4.3 — data only here; wiring in WI-08), `src/world/triggers.ts` (request §36), `src/systems/CurrentSystem.ts` (request §64)
- request §4.1, §4.2, §17, §36, §49, §60, §64, §65

## Architecture And Integration Constraints

New files, L1 + archetype:

- `src/world/chunks.ts` — `holds — authored WorldChunkDef data + activation`; information-holder.
- `src/world/triggers.ts` — `evaluates — EncounterTrigger conditions to actions on the fixed step`; controller.
- `src/systems/CurrentSystem.ts` — `computes — CurrentField velocity at (pos, time)`; service-provider.

Constraints: reuse the §17 `WorldChunkDef` family and §64 `CurrentField` and §36 `EncounterTrigger` types (never clone them). All coarse chunk definitions stay in memory; only activation is streamed (request §17). Deterministic seeded RNG for decoration/scatter only (request §61). This is a preparatory refactor of the WI-02/03 greybox world — behaviour is preserved, not a parallel island (plan A-R8).

## Forbidden Substitute Success

- A straight vertical shaft instead of a wide descending network (request §4.2).
- A "world" of a handful of disconnected islands the player teleports between.
- Currents that do not move the player or the particles.
- An encounter-trigger system that cannot actually fire on any condition.

## Expected Project Knowledge Update

Note the chunk-activation threshold and the world scale constants in a project note; note the trigger-condition/action vocabulary if it extends the §36 shape.

## Fresh-Session Handoff

Enter `item-implementer` mode for this exact work item. Read the task or story state from top to bottom, the project documentation, all passed gate artifacts, this work-item specification, and only then the listed source files.
