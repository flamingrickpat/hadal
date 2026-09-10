---
id: WI-04d
kind: work_item
parent: ST-04
children: []
depends_on: []
criteria:
  AC-enc-puzzles: "3-5 environmental puzzle moments exist near the critical path and are completable headlessly through the scenario harness"
behavior: "Author 3-5 environmental puzzle moments near the critical path (section 66) as data-driven trigger and world-data compositions of existing simulation capabilities, each completable headlessly through the scenario harness and each setting a completion story flag consumed by WI-04c"
subsystems: ["trigger system", "world content data", "headless scenario tests"]
verification: "One headless scenario per puzzle from a fresh save completing it through authored player inputs (interact, sonar, current riding, creature approach) and asserting the completion flag is set; puzzle-moment count check (3-5) and near-critical-path placement check; no abstract symbol panels (section 66); final proof owner of AC-enc-puzzles"
---

# WI-04d — Environmental puzzle moments

## Goal

Author 3-5 environmental puzzle moments (section 66) near the critical
path, placed per the private reveal map. Each puzzle is a composition of
existing simulation capabilities wired through the trigger system: sonar
revealing a hidden mechanism (`scanObject`), a current carrying an object
(`CurrentSystem`), a restraint cut or two nodes connected via the existing
interact action, a path revealed or unlocked by sonar (`lockPath`), or a
creature lured by ST-03 behavior to touch the mechanism. No abstract
colored-symbol panels.

## Deliverables (checkable)

- 3-5 puzzle moments, each with: a physical approach on the critical path
  (or its direct shoulder), a single readable environmental goal (no
  tutorial text), and a completion that both changes the world (unlocked
  path, moved object, altered state) and sets one completion story flag
  (`setStoryFlag`) consumed by WI-04c.
- Puzzle mechanics composed from existing sim capabilities; puzzle props
  are world-data entries (objects, nodes, restraints, currents) - not new
  renderer classes.
- Completable blind (section 39 spirit): every required affordance is
  visible in the scene; no hidden inputs, no guessing.

## Tests (node, real simulation, no mocks of the rules)

- One scenario per puzzle via `src/sim/scenario.ts` from a fresh save:
  drive the authored inputs (thrust, interact, sonar, current riding)
  headlessly, assert the puzzle state completes and the completion flag is
  set; a no-solution control (inputs omitted) stays incomplete.
- Count and placement check: 3-5 moments, each reachable near the
  critical path per the scenario routes.

## Constraints, assumptions, non-goals

- Assumption: the reveal map's chosen puzzle types compose from existing
  capabilities (sonar, currents, interact, `lockPath`, ST-03 creature
  states). Falsified if a chosen type needs a new sim rule (e.g. physical
  buoyancy after cutting a restraint): then report the gap through the
  normal fix-planning route before touching the sim core - do not silently
  add rules here.
- No puzzle UI, no symbol logic, no colored panels (section 66).
- No critical-gate or final-path randomization (section 61): a puzzle's
  consequence (unlock, moved object) is authored and deterministic;
  whether it gates a branch follows the reveal map.

## Fresh-session handoff

Read ST-04/plan.md, request sections 36, 39, 61, 66, 70, WI-01c's reveal
map (puzzle slots by id only) and the existing interaction surface
(interact handling, `CurrentSystem`, `SonarSystem` in
`src/sim/Simulation.ts`). WI-04c consumes the completion flag names this
item defines.
