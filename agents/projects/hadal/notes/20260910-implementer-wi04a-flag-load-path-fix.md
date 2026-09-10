---
title: storyFlags load-path split fixed in loadFromSave (WI-04a implement attempt 2)
role: item-implementer
created: 2026-09-10
tags: [storyflags, trigger-system, load-path, wi-04a, save, regression]
symbols: [Simulation.loadFromSave, Simulation.storyFlags, Simulation.triggerState, createSimulationFromSave, storyFlagLoadPath.test.ts]
files: [src/sim/Simulation.ts, src/sim/storyFlagLoadPath.test.ts]
---

# storyFlags load-path split: fixed and covered by a product regression test

Resolves the defect recorded in
`20260910-reviewer-wi04a-storyflags-load-path.md`: `loadFromSave`
re-assigned `this.storyFlags`, orphaning `triggerState.storyFlags` on the
live game path (Game.ts constructs the Simulation, then calls loadFromSave
at boot).

## The fix (the seam fact)

`loadFromSave` now restores the save's flags **into the existing array in
place** (`length = 0; push(...)`) instead of re-assigning it, so the
reference the constructor shared with `triggerState.storyFlags`
(Simulation.ts constructor, `this.triggerState.storyFlags = this.storyFlags`)
survives the load. Any future field restored by `loadFromSave` that is
shared by reference with another subsystem must follow the same in-place
rule — re-assigning a shared field in `loadFromSave` silently breaks the
constructor's sharing invariant on the live path only.

## Regression coverage

`src/sim/storyFlagLoadPath.test.ts` — two fast tests through the live
`createSimulationFromSave` path: (1) array identity preserved + a fired
`setStoryFlag` beat flag visible in `sim.storyFlags` and
`toSave().world.storyFlags`; (2) saved flags plus newly fired flags both
persist. The §33 `teleportTo` debug channel makes these ~20 ms tests
instead of a 200 s scenario run.

## Commands

```powershell
npx vitest run src/sim/storyFlagLoadPath.test.ts
npx vitest run src/sim/beatScenario.test.ts
```
