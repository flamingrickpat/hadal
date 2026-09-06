# WI-08: Material families, upgrades, soft gates, and the critical-path validator

## Identity

- Task: hadal
- Story: implicit
- Owner role: `item-implementer`
- Complexity: high
- Dependencies: WI-07

## Goal

Build the progression backbone: 4–6 material families, 10–14 permanent capability upgrades (as `EquipmentDef`), soft equipment gates, deterministic critical resources with scarcity tuning, and the `validateWorld()` / `simulateCriticalPath()` validators — so the game is completable as boxes and circles with a provable, non-deadlocking critical path.

## Vision Link

Request §8 (4–6 material families; 2–4 min gathering for a required upgrade), §9 (10–14 permanent upgrades across tiers; capabilities as new affordances; 3–4 cheap consumables), §4.3 (soft equipment gates; not colored-key doors), §62 (`EquipmentDef` + `Capability`; gates query capabilities/depth rating), §4.4/§40 (deterministic critical resources; 130–170% of critical materials, ≥2 locations, no rare random drops), §32 (`validateWorld()` + `simulateCriticalPath()`), §70 (validators). §45 "crafting gates access to depth/capabilities".

## Acceptance Criteria

- [ ] 4–6 core material families are visually recognizable at a glance and harvestable (salvage, shed biological material, wreck internals, etc., request §8/§55); no money currency (request §8).
- [ ] 10–14 permanent upgrades exist as `EquipmentDef` with `Capability[]` and effect text (request §9, §62, §54); each unlocks a new behavior/route, not just a stat bump; 3–4 cheap consumables exist (request §9).
- [ ] Access to depth/capabilities is gated by soft equipment gates (pressure below a depth, practical darkness without a lamp, current without propulsion, toxic/insulation, narrow passage with cutter, vertical chasm with better O2/speed, learnable creature territory with a decoy, request §4.3); gates query capabilities/depth rating, not hardcoded recipe IDs (request §62).
- [ ] Critical resources are deterministic: for each required upgrade, ≥130–170% of critical materials exist in the first relevant area, across ≥2 locations, with no rare random drop on the critical path (request §40, §4.4).
- [ ] `validateWorld()` checks: every chunk has valid exits; critical chunks are connected; required resource nodes exist; story triggers, recipe, and creature IDs resolve (request §32).
- [ ] `simulateCriticalPath()` runs start-capabilities → guaranteed materials → craftable upgrades → reachable gates, repeated, and asserts the final objective becomes reachable (request §32); it catches recipe/gate deadlocks.
- [ ] Both validators are reachable from the debug panel (request §33) and pass on the current world data.
- [ ] The game is completable as boxes and circles from start to the bottom (request §44 phase 3).

## Required Evidence

| Criterion | Evidence type | Command or artifact |
|---|---|---|
| Material families + harvest | manual (browser) | harvest each family; visually distinct at a glance |
| Upgrades as EquipmentDef + capabilities + effect text | workflow (code + review) + manual | craft each; confirm capability + effect text; reviewer confirms `EquipmentDef`/`Capability` reuse |
| Soft gates query capabilities | workflow (code + review) + manual | reviewer confirms gates read capabilities/depth rating; in-game, a gate opens when the capability is gained |
| Deterministic critical resources | automated | Vitest: for each critical upgrade, critical materials exist ≥130–170% across ≥2 locations, no rare random drop |
| validateWorld() passes | automated | `npx vitest run` for the validator over current world data; exit 0 |
| simulateCriticalPath() reaches final objective | automated | `npx vitest run` for the critical-path simulation; asserts reachability |
| Complements-as-boxes playthrough | manual (browser) | reach the bottom and retrieve the (placeholder) objective without a softlock |

## Tests To Write First

- Vitest tests for `validateWorld()` (exits, connectivity, resource presence, ID resolution) and `simulateCriticalPath()` (final objective reachable) over the authored world data (request §32, §70).
- A Vitest test for resource-determinism and gate-capability queries (request §40, §62).

## Live Or External Verification

In a real desktop browser: craft the full upgrade chain in order and descend through every gate to the bottom; confirm no softlock. Run both validators from the debug panel and confirm they pass.

## Infrastructure Required

- Start: `npm run dev`
- Restart: re-run `npm run dev`
- Health: full upgrade chain craftable; all gates pass; validators green; no softlock
- Timeout: n/a
- Endpoint or MCP: none

## File Pointers

- `src/content/resources.ts`, `src/content/recipes.ts`, `src/content/items.ts`, `src/player/equipment.ts` (`EquipmentDef` + `Capability`, request §62)
- `src/world/gates.ts` (request §4.3), `src/systems/ResourceSystem.ts` (request §8), `src/systems/CraftingSystem.ts`
- `src/util/` or `src/game/` — `validateWorld.ts` / `simulateCriticalPath.ts` (request §32), reachable from `src/util/debug.ts`
- request §4.3, §8, §9, §32, §40, §54, §55, §62, §70

## Architecture And Integration Constraints

New files, L1 + archetype:

- `src/world/gates.ts` — `evaluates — soft equipment gates against capabilities/depth rating`; service-provider.
- `src/util/validateWorld.ts` / `src/util/simulateCriticalPath.ts` — `validate — world integrity and critical-path reachability`; service-provider.

Constraints: reuse the §62 `EquipmentDef`/`Capability` and §8 resource types (never clone them). Gates read capabilities/depth rating, not recipe IDs (request §62). Seeded RNG touches only optional/extra scatter, never critical gates or resources (request §61). This completes Phase 3: the game is completable as boxes and circles.

## Forbidden Substitute Success

- Colored-key or level-number doors (request §4.3).
- A validator that hardcodes "pass" without checking the real world data.
- A critical path that only works because RNG happened to place the required node (request §40/§4.4).
- Upgrades that are bare stat bumps with no new affordance (request §9).

## Expected Project Knowledge Update

Note the `Capability` set, the gate-capability mapping, and the validator entry points in a project note so WI-13 (endgame) and the balance pass reuse them.

## Fresh-Session Handoff

Enter `item-implementer` mode for this exact work item. Read the task or story state from top to bottom, the project documentation, all passed gate artifacts, this work-item specification, and only then the listed source files.

## Addendum (re-plan at 3b12fa7, 2026-09-06): §70/§32 physical route scenarios

The abstract `simulateCriticalPath()` does not prove that physical routes are
traversable (request §32). It must be paired with headless movement scenarios that
verify required passages against production collision geometry at the capability
stage then available. This is an additional acceptance criterion and test on top of
the spec above; the material/upgrade/gate/validator work above remains in force.

### Additional acceptance criteria

- [ ] Headless movement/waypoint scenarios verify that each required gate,
  shortcut, and progression-material passage is physically traversable using the
  actual production collision geometry and the capabilities available at that
  progression stage — not inferred from chunk adjacency alone (request §32, §70).
- [ ] Waypoints select movement inputs only; they never assign player positions or
  bypass collision. Each scenario has a finite simulated duration and an explicit
  success condition; if the condition remains false, the scenario fails with the
  harness state trace (request §70).
- [ ] The scenarios run on the same production simulation + scenario harness
  (WI-03 addendum) and are paired with `simulateCriticalPath()` to cover
  progression dependencies (request §32, §70).

### Additional tests to write first

- One headless waypoint scenario per required gate / shortcut / progression-material
  passage, asserting reachability at the correct capability stage, paired with the
  `simulateCriticalPath()` assertion that the final objective is reachable
  (request §32, §70).
