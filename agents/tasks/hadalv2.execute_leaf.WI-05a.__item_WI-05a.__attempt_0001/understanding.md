# Understanding

This child implements one independently reviewed work item from C:\Temp\hadal-v2\agents\tasks\hadalv2.

---
id: WI-05a
kind: work_item
parent: ST-05
children: []
depends_on: []
criteria:
  AC-end-mac: "The MacGuffin is visually memorable in simple rendering, tied to at least 2 earlier environmental traces, retrievable through gameplay from a fresh save, and its retrieval changes the environment, creature behavior, or return journey"
behavior: "Implement the MacGuffin object in the headless simulation: its placement in the final zone, the retrieval interaction rule, the at-least-2 links to earlier environmental foreshadow traces delivered by WI-04b, and the post-retrieval change to environment/creature behavior/return journey"
subsystems: ["simulation rules", "world content data", "headless scenario tests"]
verification: "Headless scenario from fresh save: physically reach the MacGuffin's location, perform the retrieval interaction, assert the sim state reflects the environmental/creature/return-journey change; assert at least 2 earlier traces (ids from WI-04b's foreshadow placement) reference this MacGuffin; browser spot-check that it is visually memorable in simple rendering"
---

# WI-05a — MacGuffin content and retrieval mechanics

## Goal

Land the MacGuffin in the headless simulation as a retrievable object whose
retrieval changes the game world. The MacGuffin's true nature is defined
privately in WI-01c's creative pass and referenced by id only here (sections
0, 12, 68). This item delivers: the object in production world data, the
retrieval interaction rule in the simulation, the post-retrieval state
change (environment, creature behavior, or return journey), and the
foreshadow links tying it to at least 2 earlier traces.

The MacGuffin must be visually memorable despite simple rendering (section
23). "Clearly important before the player fully understands why" is
satisfied by the foreshadow links; the visual distinctiveness is a
presentation constraint verified in the browser layer.

## Deliverables (checkable)

- MacGuffin object in production world data (`src/world/worldData.ts` or
  equivalent final-zone data): stable internal id, placement in the final
  zone region, and a retrieval interaction rule (distance + action, or
  context-specific per the private design).
- At least 2 foreshadow links: the object references at least 2 existing
  trace ids that WI-04b placed as environmental foreshadow (section 51).
  These traces exist in the world data and their content alludes to the
  MacGuffin without naming it.
- Post-retrieval state change: a simulation rule that, upon retrieval,
  alters at least one of: the environment (spawn table, region state,
  ambient conditions), creature behavior (a ST-03 species changes its
  signature rule), or the return journey (path state, region lock,
  navigation constraint). The exact change is per the private design;
  the sim must make it observable in state.
- Retrieval is possible from a fresh save through normal gameplay:
  no noclip, no direct state edit, no console command (section 45 first
  criterion).

## Tests (node, real simulation, no mocks of the rules)

- Fresh-save scenario via `src/sim/scenario.ts`: physical route to the
  final zone, reach the MacGuffin location, perform the retrieval
  interaction, assert:
  - The MacGuffin's sim state transitions to "retrieved".
  - The post-retrieval change is present in sim state (whichever of
    environment/creature/return-journey the private design chose).
  - At least 2 trace ids in world data reference this MacGuffin.
- Determinism: same seed, same retrieval outcome.
- No retrieval possible before reaching the final zone (the object is
  not in an earlier band).

## Browser check (presentation)

- The MacGuffin is visually distinct in simple rendering (not a generic
  glowing orb; section 23: avoid "pick up glowing orb, fade to credits").
- The retrieval interaction is discoverable (context prompt per section 26).
- No console errors.

## Constraints, assumptions, non-goals

- The MacGuffin's true nature, appearance rationale, and the specific
  retrieval mechanic are private (WI-01c). Plan nodes and commit messages
  reference it by internal id only.
- No ending logic, no final sequence, no ending variants (WI-05b, WI-05c).
- No save-system changes (WI-05c owns the autosave schema extension).
- No new creature AI: the post-retrieval creature behavior change uses
  existing ST-03 state/flag mechanisms (a flag gate, spawn table change).
- Spoiler rules (sections 0, 12, 68): the MacGuffin's id is internal;
  commit style "implemented MacGuffin retrieval in final zone" (no
  nature, no name).

## Fresh-session handoff

Read ST-05/plan.md, request sections 23, 45, 51, 70, WI-01c (private
MacGuffin decision, by id only), WI-04b (the foreshadow trace ids placed
in earlier zones), and ST-03 (stable creature ids for any post-retrieval
behavior change). The MacGuffin's placement is in the final zone (the
region WI-04a authored its last approach beats around).

