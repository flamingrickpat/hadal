# Review: WI-04d — Environmental puzzle moments

Status: pass

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| 3-5 environmental puzzle moments exist near the critical path and are completable headlessly through the scenario harness | passed | `src/world/worldData.ts` carries four puzzle triggers plus one setup trigger (`puzzle-corridor-lock`); the data-shape test in `puzzleScenario.test.ts` asserts `>=3` and `<=5` triggers with the `puzzle-` prefix — passed; one headless scenario per puzzle fires the trigger, changes world state, and sets the completion flag — all 9 tests passed |

## Findings

No findings.

## Impact Check

- `EncounterTrigger` (src/world/triggers.ts:55): explored via codegraph; callers are `src/sim/Simulation.ts`, `src/world/triggers.ts`, `src/world/chunks.ts`, and tests. The puzzle triggers add to the existing trigger set — no existing callers are affected.
- `TriggerSystem` (src/world/triggers.ts:177): explored via codegraph; the sim owns a single `TriggerSystem` that flattens all chunk triggers. Adding puzzle triggers changes no existing behavior — they are additive only.
- `Simulation` (src/sim/Simulation.ts:282): explored via codegraph; the puzzle scenarios run the production simulation from a fresh save and assert real world-state changes — no mocks.

No existing callsites are broken by this change; the puzzles are purely additive world data.

## Independent Adversarial Probes

**Probe 1: puzzle-invariants** (scratch/reviewer/puzzle-invariants/probe.ts) — A standalone TypeScript script that imports the production world data, filters triggers by the `puzzle-` prefix, and checks: count in [3,5] range (found 5), each puzzle uses a known `TriggerCondition` type (enterRegion, approachCreature, reachDepth), each sets a `setStoryFlag` action with a unique flag name, each has a world-change action (lockPath, moveBackgroundCreature, spawnEntity), all are `once: true`, and all action types are known. All invariant checks passed.

**Probe 2: test suite re-run** — Ran `npx vitest run src/sim/puzzleScenario.test.ts` and observed all 9 tests pass (1 data-shape + 4 scenarios + 4 no-solution controls). Each scenario advances the production `Simulation` from a fresh save, drives real player inputs (thrust via swimTo, approach), and asserts: the trigger fires, the world state changes (path unlocked, creature moved, entity spawned), the completion flag is set, and audio cues play. The four no-solution controls confirm the puzzles do not fire without the authored input.

## What I Could Not Verify

- The near-critical-path placement is assumed from the route waypoints in the test file, which follow the same descent path as the WI-04a beat route. Without the private reveal map (WI-01c), I cannot verify exact puzzle slot placement — but the scenario routes demonstrate reachability along the critical path.
- Whether the specific puzzle slot ids (puzzle-*) match the reveal map's allocation — the implementer noted they use "internal slot ids" per request §0/§68.
