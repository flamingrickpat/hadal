---
title: storyFlags sharing invariant verified; the committed defect repro is red-stable
role: work-item-reviewer
created: 2026-09-10
tags: [storyflags, load-path, trigger-system, save, wi-04a, regression, red-stable]
symbols: [Simulation.loadFromSave, Simulation.storyFlags, Simulation.triggerState, createSimulationFromSave, storyFlagLoadPath.test.ts, flagRepro.test.ts]
files: [src/sim/Simulation.ts, src/sim/storyFlagLoadPath.test.ts]
---

# storyFlags sharing invariant: post-fix state and the red-stable defect repro

## The load-bearing invariant

`Simulation.storyFlags` is ONE array shared three ways: the constructor
aliases it into `triggerState.storyFlags` (Simulation.ts:341),
`toSave()` serializes it (:1544), and the `TriggerContext` the trigger
system reads is built from it (:1286). `loadFromSave` therefore restores
the save's flags **in place** (`length = 0; push(...)` at :1574-1575) —
re-assigning that field in `loadFromSave` silently breaks the sharing on
the live `Game` path only (construct + load at `Game.ts:63-65`), which the
headless scenario path (direct construction) never catches. Product
regression: `src/sim/storyFlagLoadPath.test.ts` (2 fast tests through
`createSimulationFromSave`, the exact boot mirror).

## Gotcha: a committed test that is expected to fail

The WI-04a reviewer's defect-asserting repro,
`agents/tasks/hadalv2.execute_leaf.WI-04a.__item_WI-04a.__attempt_0001/scratch/work-item-reviewer/wi04a-flag-repro/flagRepro.test.ts`,
asserts the OLD split. Post-fix, its test 2 is **red by design** (fails at
the `not.toBe` identity assertion, line 33) and test 1 stays green. Run it
with its own config:

```powershell
npx vitest run --config agents/tasks/hadalv2.execute_leaf.WI-04a.__item_WI-04a.__attempt_0001/scratch/work-item-reviewer/wi04a-flag-repro/vitest.config.ts
```

Do not "fix", delete, or count this scratch test as a product regression —
it lives outside `src/` and the root vitest config excludes it. The green
product test is `storyFlagLoadPath.test.ts`.

## Live-page probe reuse

The reviewer's live-page probe
(`scratch/work-item-reviewer/wi04a-beats-live/probe.mjs` in the same task
folder) spawns its own `npm run dev` on port 5223, fresh browser profile,
240 s watchdog, and rewrites its tracked `output/` artifacts on every run
(the pre-fix 31/36 outputs remain in git history at `b538e3d`; post-fix
rerun = 36/36). Reusable as the template for any "does it fire in the
live game" proof: debug-teleport positioning + `window.__HADAL_GAME__.sim`
reads under `?debug=1`.
