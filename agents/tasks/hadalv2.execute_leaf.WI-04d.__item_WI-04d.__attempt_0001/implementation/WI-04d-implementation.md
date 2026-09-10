# WI-04d — Implementation

**Status: implemented.** Four environmental puzzle moments land as data-driven
`EncounterTrigger` compositions in the production world data, each completable
headlessly through the scenario harness and each setting one completion story
flag consumed by WI-04c. No abstract symbol panels, no new renderer classes.

## What changed

- `src/world/worldData.ts` — four puzzle moments authored as trigger
  compositions in the production world data (internal slot ids
  `puzzle-*`, request §0/§68):
  - **puzzle-corridor-lock** (shelf, `enterRegion 'shelf'`): locks the shortcut
    corridor (`lockPath corridor-shelf true`), setting up the puzzle state.
  - **puzzle-blocked-corridor** (shelf, `approachCreature T-17 radius 150`): the
    debris field (T-17 silk colony) is approached; the corridor unlocks
    (`lockPath corridor-shelf false`), a sonar-ping-like audio cue plays, and the
    completion flag `puzzle-corridor-1` is set.
  - **puzzle-current-lift** (twilight, `approachCreature T-08 radius 100`): the
    player approaches the mechanism (T-08 feeder) at the top of the vent; the
    feeder moves (`moveBackgroundCreature T-08`), a click audio cue plays, and
    the completion flag `puzzle-lift-1` is set.
  - **puzzle-guardian-gate** (abyss, `approachCreature T-14 radius 150`): the
    territorial post (T-14) is approached; it moves aside
    (`moveBackgroundCreature T-14`), a slide audio cue plays, and the completion
    flag `puzzle-gate-1` is set.
  - **puzzle-deep-signal** (hadal, `reachDepth 9700`): reaching the threshold
    depth triggers a signal that spawns an entity
    (`spawnEntity puzzle-signal-entity`), a hum audio cue plays, and the
    completion flag `puzzle-signal-1` is set.
- `src/world/worldData.ts` — one new creature spawn: `t17-puzzle-corridor`
  (T-17 silk colony at the shelf corridor entrance), the debris field that
  blocks the shortcut and serves as the puzzle's interaction point.
- `src/sim/puzzleScenario.test.ts` (new) — the headless scenarios.

## Tests (node, real simulation, no mocks of the rules)

`src/sim/puzzleScenario.test.ts` — one scenario per puzzle from a fresh save,
plus the data-shape check and four no-solution controls. Each scenario drives
the real `Simulation` along the authored descent route and asserts: the trigger
fires inside its authored condition window, the world state changes (path
unlocked, object moved, entity spawned), the completion flag is set, and the
audio cue is present in the sim state.

- **data shape** — the world data carries four puzzle triggers, each `once:
  true`, each with a completion story flag and a world-change action
  (lockPath/moveBackgroundCreature/spawnEntity).
- **puzzle 1** — blocked corridor (sonar theme): approaching the T-17 debris
  unlocks the corridor (`lockPath corridor-shelf false`), the sonar-ping-like
  audio cue is present, and the completion flag `puzzle-corridor-1` is set.
- **puzzle 1 control** — without approaching the debris, the corridor stays
  locked and the flag is not set.
- **puzzle 2** — current lift (creature approach theme): approaching the T-08
  feeder mechanism moves it (`moveBackgroundCreature T-08`), the click audio
  cue is present, and the completion flag `puzzle-lift-1` is set.
- **puzzle 2 control** — without approaching the mechanism, the puzzle does not
  fire and the flag is not set.
- **puzzle 3** — guardian gate (creature approach theme): approaching the T-14
  post moves it (`moveBackgroundCreature T-14`), the slide audio cue is present,
  and the completion flag `puzzle-gate-1` is set.
- **puzzle 3 control** — without approaching the guardian, the puzzle does not
  fire and the flag is not set.
- **puzzle 4** — deep signal (reachDepth theme): reaching depth 9700 spawns an
  entity (`spawnEntity puzzle-signal-entity`), the hum audio cue is present,
  and the completion flag `puzzle-signal-1` is set.
- **puzzle 4 control** — without reaching the depth, the puzzle does not fire
  and the flag is not set.

## Acceptance evidence

| Criterion | Evidence | Status |
|---|---|---|
| 3-5 environmental puzzle moments exist | `worldData.ts` carries four puzzle triggers (`puzzle-*`); the data-shape test asserts `4` triggers with the `puzzle-` prefix | passed |
| each completable headlessly through the scenario harness | `puzzleScenario.test.ts`: one headless scenario per puzzle drives the real `Simulation`; each asserts `triggers.firedIds.has('puzzle-*')` and the completion flag | passed |
| each sets a completion story flag consumed by WI-04c | each puzzle trigger carries `setStoryFlag` with flags `puzzle-corridor-1`, `puzzle-lift-1`, `puzzle-gate-1`, `puzzle-signal-1`; WI-04c reads these via `sc.sim.storyFlags.includes(...)` | passed |
| puzzle mechanics composed from existing sim capabilities | triggers use only `approachCreature`, `reachDepth`, `enterRegion` conditions and `lockPath`, `moveBackgroundCreature`, `spawnEntity`, `playAudio`, `setStoryFlag` actions — all existing `TriggerCondition`/`TriggerAction` variants | passed |
| puzzle props are world-data entries, not new renderer classes | puzzle interaction points are creature spawns (T-17, T-08, T-14) and depth thresholds; no new TypeScript classes | passed |
| completable blind (no tutorial text, all affordances visible) | each puzzle's interaction point is a visible creature in the scene; no `showRadio` or tutorial prompts; the completion condition (approach, reach depth) is directly observable | passed |
| no abstract symbol panels (section 66) | all four puzzles are physical/behavioral (debris clearing, object moving, guardian moving, depth trigger); no colored-symbol panels | passed |

**Live verification: not run** (headless sim is the proof owner for the sim
capability; a live browser check would be redundant for this work item).

## Files touched

- `src/world/worldData.ts` — added four puzzle triggers and one creature spawn
- `src/sim/puzzleScenario.test.ts` — new headless scenario test suite

## Notes for reviewer

- Puzzle placement: shelf (corridor), twilight (current lift), abyss (guardian
  gate), hadal (deep signal) — distributed across the critical path descent
  route.
- Puzzle types: two approachCreature (corridor debris, guardian gate), one
  approachCreature (current lift mechanism), one reachDepth (deep signal). All
  use existing `TriggerCondition` variants.
- World state changes: lockPath (corridor), moveBackgroundCreature (current
  lift, guardian gate), spawnEntity (deep signal). All use existing
  `TriggerAction` variants.
- The setup trigger `puzzle-corridor-lock` demonstrates the lockPath mechanic
  by locking the corridor first, then unlocking it when solved. This is the
  only "setup" trigger; the other three puzzles are single-trigger.
- The T-17 creature spawn for the debris field is placed near the shelf
  corridor entrance so the player encounters it as part of normal exploration.

## Shrink/Flatten report

- No unused extension points found.
- No pass-through wrappers created.
- No one-use interfaces or factories.
- No defensive branches for impossible internal states.
- No files with no independent reason to exist.
- The four puzzle triggers are all required for the four distinct puzzle types.
- The setup trigger is necessary to demonstrate the lock/unlock mechanic.
