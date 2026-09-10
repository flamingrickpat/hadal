---
title: storyFlags array split across the loadFromSave seam + WI-04a beat slot map
role: work-item-reviewer
created: 2026-09-10
tags: [storyflags, trigger-system, load-path, wi-04a, wi-04c, save, scenario-vs-live]
symbols: [Simulation.loadFromSave, Simulation.triggerState, TriggerSystem, createSimulationFromSave, setStoryFlag, beat-s1..beat-s5, enc-beat-s1..s5]
files: [src/sim/Simulation.ts, src/game/Game.ts, src/world/triggers.ts, src/sim/beatScenario.test.ts]
---

# storyFlags array split across the loadFromSave seam + WI-04a beat slot map

## Summary

Two reusable facts from the WI-04a review (child task
`hadalv2.execute_leaf.WI-04a.__item_WI-04a.__attempt_0001`).

## The Scenario path is not the live Game path (gotcha)

`Scenario` (src/sim/scenario.ts) constructs the `Simulation` directly; the
live `Game` (src/game/Game.ts:65) always additionally calls
`sim.loadFromSave(...)` at boot. Anything that re-assigns a field in
`loadFromSave` breaks invariants the constructor set up by shared reference —
first observed case: `loadFromSave` re-assigns `this.storyFlags`
(Simulation.ts:1570) while `triggerState.storyFlags` keeps the constructor's
reference (Simulation.ts:341), so `setStoryFlag` actions write to an orphaned
array on the live path (`toSave()` at :1544 and `TriggerContext` at :1286
both read the re-assigned array). Headless scenarios never catch this.
**Rule for future work:** any behavior that depends on save/load round-trips
must be tested through `createSimulationFromSave` (the live path), not only
through `Scenario`. Reviewer probes for the defect are in that child task's
`scratch/work-item-reviewer/` (browser probe + flag repro test).

## The WI-04a beat slots (for WI-04c and later stories)

Internal ids only (request §0/§68). Completion flags `beat-s1..beat-s5` are
what the WI-04c reaction gates read:

- `enc-beat-s1` — shelf band, `enterRegion 'shelf'`; moves T-03 and T-09.
- `enc-beat-s2` — abyss, `reachDepth 9300`; moves T-22 west.
- `enc-beat-s3` — `reachDepth 9550` (just above the hadal strip); wide camera.
- `enc-beat-s4` — `reachDepth 9640` (strip entry); tight camera; interlocks
  with the T-23 crossing (starts within 2500 units of a diver).
- `enc-beat-s5` — `approachCreature T-25 radius 1200` (strip east end);
  moves T-25 west; pullback camera.

All `once: true`, none lock a path. Note the region subsumption trap: in the
deep strip the player's region resolves to the abyss chunk (first-match
containment, src/world/chunks.ts:120), so `enterRegion`/`timeInRegion` on
`'hadal'` can never fire there — `approachCreature` (added in WI-04a) is the
expressible condition for position-keyed deep beats.

## Commands

```powershell
npx vitest run src/sim/beatScenario.test.ts --reporter=verbose
npx vitest run src/world/triggers.test.ts
```
