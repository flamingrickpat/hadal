---
id: WI-07b
kind: work_item
parent: ST-07
children: []
depends_on: []
criteria:
  AC-bal-scarcity: "Every required permanent upgrade has 130-170 percent of critical materials in its first relevant area across at least 2 locations, verified by the section 32 validators paired with headless route scenarios"
behavior: "Build the section 32 `simulateCriticalPath()` progression validator (and extend the partial `validateWorldChunks` into the full `validateWorld()`), write physical route scenarios against production collision geometry, and tune material placement so every required permanent upgrade has 130-170% of its critical materials in its first relevant area across at least 2 locations"
subsystems: ["headless scenario tests", "balance tuning"]
verification: "`simulateCriticalPath()` runs headlessly and asserts the final objective becomes reachable from start capabilities (recipe/gate deadlock check); the full `validateWorld()` passes (chunk exits, critical-chunk connectivity, required resource nodes exist, story triggers and recipe/creature ids resolve); headless physical route scenarios reach each required gate over production collision geometry (not chunk adjacency); a Node test walks every required permanent upgrade and asserts its first relevant area holds 130-170% of its critical materials across >=2 distinct nodes, with no rare-random drop on the critical path; suite and build stay green"
---

# WI-07b — Section 32 reachability validator and section 40 scarcity

## Goal

Prove the critical path is physically and numerically winnable before any
timing numbers are trusted, and place critical materials so the section 40
scarcity rules hold. Two things are already known from the baseline: (1)
`src/world/chunks.ts` has a partial `validateWorldChunks` (duplicate ids,
exit targets, start-reaches-deepest) but the full section 32 `validateWorld()`
(recipe/gate/creature id checks) is not assembled, and (2) `simulateCriticalPath()`
does not exist anywhere in `src/` yet - `understanding.md` flags it as a gap a
later work item must build, and this is that work item. It is the
reachability/scarcity half of the balance pass; it does not tune pacing or
oxygen (WI-07c) and does not touch frame rate (WI-07d).

## Deliverables (checkable)

- `simulateCriticalPath()` (request §32): the state-space progression check -
  start capabilities -> collect guaranteed materials in reachable zones ->
  craft available upgrades -> recompute reachable gates -> repeat - asserting
  the final objective becomes reachable. It catches recipe/gate deadlocks and
  deliberately does not simulate player movement.
- Extend the section 32 `validateWorld()` checks over the existing
  `validateWorldChunks` (do not throw away its exit/connectivity checks):
  every chunk has valid exits, critical chunks connected, required resource
  nodes exist, story triggers reference valid ids, no recipe references a
  missing item id, all creature ids resolve.
- Physical route scenarios (request §32/§70): headless movement scenarios over
  the production `Simulation` collision geometry that reach each required gate
  at the capability stage that gate needs. Fresh-save scenarios only; waypoint
  steering via `Scenario.swimTo` - never teleport/noclip as progression proof.
- Scarcity placement (request §40): tune the world/recipe data so every
  required permanent upgrade has 130-170% of its critical materials in the
  first area where it becomes relevant, distributed across >=2 nodes, and no
  required critical material is a rare random drop. Small resource/cache
  adjustments only - if content is genuinely missing, file a defect (ST-07
  boundary) rather than adding it here.

## Tests

- Node: `simulateCriticalPath()` passes on the production world; a
  deliberately broken fixture (a recipe referencing a missing item, or a gate
  requiring an unreachable material) makes it fail - proving the check is
  live, not a no-op.
- Node: the full `validateWorld()` passes on the production world and reports
  the expected issue strings on a broken fixture.
- Node (route scenarios): for each required gate, a headless scenario reaches
  it via `swimTo`/steering against production collision; record the scenario
  trace. These are the "physical route" proof - adjacency alone is not
  reachability (§32).
- Node (scarcity walk): iterate every required permanent upgrade; for each,
  sum critical-material yield across the nodes in its first relevant area and
  assert 130-170% and >=2 distinct nodes; assert none of the critical
  materials are gated behind a rare random drop.
- Suite and build stay green.

## Constraints, assumptions, non-goals

- Assumption (recorded): `simulateCriticalPath()` is not yet implemented in
  the baseline; this leaf builds it as a precondition of AC-bal-scarcity. It
  is a debug/progression utility, not product gameplay - it reads recipes,
  gates, materials, and chunks; it adds no new behavior.
- Build on `validateWorldChunks` (extend, do not replace its checks).
- Route scenarios are headless (Node); they prove reachability, not pacing or
  frame rate. Fresh-save only, no noclip/teleport progression proof (§70).
- No pacing/oxygen/pressure tuning (WI-07c), no frame-rate work (WI-07d).
- Spoiler rules (§§0, 12, 68): evidence uses internal ids only; late-game
  gates/creatures are reported without names.

## Fresh-session handoff

Read ST-07/plan.md (proof ownership; this is the named final proof owner of
AC-bal-scarcity), request sections 32, 40, 70, and `understanding.md` (the
`simulateCriticalPath` gap note). Inspect `src/world/chunks.ts`
(`validateWorldChunks`, `WorldValidation`), `src/content/recipes.ts`
(`RECIPE_BY_ID`, `canCraft`), `src/world/worldData.ts` (`MACRO_WORLD`,
`ResourceNodeDef`, `BASE`), `src/sim/Simulation.ts` (capabilities, `nodes`,
`giveResources`, trigger state), and `src/sim/scenario.ts` (`swimTo`,
`findNodePosition`, `assert`). The scarcity walk needs the recipe -> critical
material -> first relevant area mapping; if the "first relevant area" is not
yet expressed in data, express it minimally or record the assumption in your
evidence.
