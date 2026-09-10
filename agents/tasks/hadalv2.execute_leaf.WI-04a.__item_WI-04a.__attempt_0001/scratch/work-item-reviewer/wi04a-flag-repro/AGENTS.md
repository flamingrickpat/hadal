# wi04a-flag-repro — headless repro for Finding 1

Deterministic two-test repro (product API only, no mocks) that the trigger
`setStoryFlag` flags are visible in `sim.storyFlags` on the fresh
construction path (what the implementer's scenarios use) but orphaned on the
live game's load path (what `src/game/Game.ts` does: construct, then
`loadFromSave`):

- test 1 — fresh `createSimulation(makeSimWorld())`: cross the s2 depth
  line, assert `enc-beat-s2` fired and `sim.storyFlags` contains
  `beat-s2` (same array reference as `triggerState.storyFlags`).
- test 2 — `createSimulationFromSave(save)` (the live path): assert the two
  arrays are already split at boot, the fired flag lands only in
  `triggerState.storyFlags`, and is absent from `sim.storyFlags` and from
  `toSave().world.storyFlags`.

Both tests pass against the current code, i.e. the split is confirmed. Test
2's expectations invert into the green condition for the implementer's fix
(preserve `storyFlags` identity across `loadFromSave`).

Run from the repo root:

```powershell
npx vitest run --config agents/tasks/hadalv2.execute_leaf.WI-04a.__item_WI-04a.__attempt_0001/scratch/work-item-reviewer/wi04a-flag-repro/vitest.config.ts
```

Files: `flagRepro.test.ts` (the repro), `vitest.config.ts` (scratch runner
that includes only this file; root set to the repo root).
