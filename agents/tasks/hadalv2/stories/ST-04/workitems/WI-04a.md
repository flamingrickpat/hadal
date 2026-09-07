---
id: WI-04a
kind: work_item
parent: ST-04
children: []
depends_on: []
criteria:
  AC-enc-beats: "At least 5 authored spectacle beats fire through the trigger system inside live gameplay, each with authored timing, entrance, environmental reaction, and an available escape path"
behavior: "Author the five+ spectacle beats of the private reveal map as data-driven EncounterTrigger entries staged around stable ST-03 roster ids, each with authored timing, entrance, environmental reaction, and an available escape path (sections 11.4, 36, 67)"
subsystems: ["trigger system", "world content data", "headless scenario tests"]
verification: "One headless scenario per beat from a fresh save asserting the trigger fires inside its authored timing window, the entrance ran, the environmental reaction is present in the sim, and the escape path is traversable without noclip; browser check that the beats read as authored moments in sequence (final proof owner of AC-enc-beats)"
---

# WI-04a — Authored spectacle beats

## Goal

Land the five+ deliberate spectacle moments the private reveal map (WI-01c)
slots into the 90-120 minute timeline, inside live gameplay (section 11.4:
not cutscenes). Each beat is one authored `EncounterTrigger` (or a small
authored set sharing one milestone flag) in the production world data,
composed from the section 36 action/condition vocabulary: timing via
`enterRegion`/`reachDepth`/`timeInRegion`, entrance via `spawnEntity` /
`moveBackgroundCreature` / `camera`, environmental reaction via
`alterAmbient` / `playAudio` / `despawnEntity`, and escape guaranteed by
authored path state (`lockPath` only where an authored exit exists). Beats
reference ST-03 organisms by stable internal id and state
(`creatureState` condition, `moveBackgroundCreature` action); no creature
controller changes.

## Deliverables (checkable)

- 5+ beats staged with the section 11.4 grammar (foreground occlusion
  pass, object-that-was-terrain, swarm formation change,
  lights-that-are-not-lights, wreckage against the current, sonar-scale
  arc, background crossing, scale recontextualization - grammar, not a
  literal checklist), placed at the slots the reveal map assigns.
- Each beat sets one completion story flag (`setStoryFlag`) that WI-04c
  reactions gate on and the scenario assertions record.
- Section 67 compliance: scripted timing, entrance angle, camera behavior,
  environmental reactions and escape-path availability; player control
  preserved; no long cutscenes (a sub-3-second cinematic framing beat only
  if absolutely necessary).
- No new trigger vocabulary unless a beat is impossible with the section 36
  set; if one is needed, the minimal addition lands in
  `src/world/triggers.ts` with a unit test, noted in the item evidence.

## Tests (node, real simulation, no mocks of the rules)

- One scenario per beat via `src/sim/scenario.ts`: fresh save, physical
  route to the beat region, assert the trigger fires inside its authored
  timing window, the entrance action ran (entity/creature/camera state in
  the sim), the environmental reaction is present, and the escape path is
  traversable to a safe region without noclip.
- `once` semantics: re-entering the region does not re-fire the beat.
- Determinism: same seed, same beat order and timing.

## Browser check (presentation; final proof owner of AC-enc-beats)

Representative beats fire in sequence in the live game and read as
authored moments (camera modifier + audio cue + visible environmental
reaction); no console errors. This is the cross-child browser proof that
the beats fire "inside live gameplay"; no other ST-04 child re-asserts it.

## Constraints, assumptions, non-goals

- No creature controller or AI changes: beats read ST-03 states and move
  background creatures via the existing action. If a beat truly requires
  new creature behavior, report it as a defect for the reviewer - do not
  expand scope here.
- No story payload (WI-04b), no reactions (WI-04c), no puzzles (WI-04d).
- Spoiler rules (sections 0, 12, 68): beat names in code, tests, plan
  artifacts and commits are internal ids only (e.g. "beat-03"); commit
  style "authored three encounter beats".

## Fresh-session handoff

Read ST-04/plan.md, request sections 3, 11.4, 36, 61, 67, 70, ST-03 (the
stable roster ids and states) and WI-01c's reveal map (beat slots by id
only). Beat staging slots come from the private reveal map; do not invent
slots here.
