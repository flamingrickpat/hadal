---
title: Re-plan at 3b12fa7 — verification-architecture seam
role: task-planner
created: 2026-09-06
tags: [replan, simulation-boundary, scenario-harness, verification, wi-03, wi-08]
symbols: [Game.update, createRng, PlayerController.update, resolveCircle, GREYBOX_WORLD, EquipmentDef]
files: [agents/tasks/hadal/plan.md, agents/tasks/hadal/workitems/WI-03-base-resource-crafting-save.md, agents/tasks/hadal/workitems/WI-08-materials-upgrades-gates.md]
---

# Re-plan at 3b12fa7 — verification-architecture seam

## Summary

The task-planner re-ran at 3b12fa7 (after the understander refreshed
`understanding.md` at 7aa2435). It confirmed the 17-work-item decomposition
(WI-01..WI-17) still covers every request §45 acceptance criterion and is
unchanged (no work item added/removed/renumbered). WI-01 (184d348) and WI-02
(6a21844) are implemented and reviewed/approved at 7aa2435. The current queue is
WI-03..WI-17.

The re-plan closed two verification-architecture gaps the request's executive
directive (§0) and §30/§70 require but that no work item explicitly carried:

1. The §30 headless simulation boundary + §70 reusable Node scenario harness +
   the §70 9-step continuous core-loop scenario + separate headless/browser test
   commands → assigned to **WI-03** (append-only addendum), the item that
   delivers the first full headless core loop (base + resource + crafting + save).
2. The §70/§32 physical route scenarios (gates/shortcuts/progression materials
   verified against production collision geometry, paired with
   `simulateCriticalPath()`) → assigned to **WI-08** (append-only addendum),
   which owns the critical-path validator.

## Key Facts

- As of 3b12fa7 there is **no** `createSimulation(world, seed)` /
  `step(state, input, dt)` API and **no** scenario harness. A search of `src/`
  finds only local `step(controller, n)` helpers inside
  `PlayerController.test.ts` and `PlayerMeters.test.ts`.
- WI-02 established the correct *start*: the movement integrator, O2/health
  meter math, and circle-vs-segment terrain resolution are each Node-importable
  per-function unit tests under `src/**/*.test.ts` (`npx vitest run` = 31 tests).
  What is missing is the **unified** boundary: a simulation core the browser
  renders, a thin input adapter that feeds player actions as data, and the
  reusable harness that advances the production simulation over production world
  data + the actual spawn.
- The single simulation seam is `Game.update(FIXED_DT)`
  (`src/game/Game.ts:85`). WI-03's simulation core should live where
  `Game.update` can delegate to it; browser side effects (Three.js, DOM,
  WebAudio, `localStorage`) stay as adapters around it, never inside it.
- Reuse, do not re-derive: `createRng` (`src/util/rng.ts:16`, mulberry32,
  never for gates/resources/reveals — request §61), the WI-02 movement/meter/
  terrain units, `EquipmentDef`/`Capability`
  (`src/player/equipment.ts:28`), and the `GREYBOX_WORLD` /
  `worldData.ts` world data (the WI-07 refactor target).
- `package.json` currently has `test: vitest run` (headless). A separate browser
  test command is still to be added (request §44 phase 1, §70).
- `design_private/` is already gitignored (request §12); `state.md` and
  `agents/tasks/*/scratch/**` are ignored by the workflow runtime.

## Navigation

- Plan revision + gap closure: `agents/tasks/hadal/plan.md` → "## Revision —
  re-plan at 3b12fa7 (2026-09-06)".
- Simulation boundary + harness + core-loop scenario:
  `agents/tasks/hadal/workitems/WI-03-base-resource-crafting-save.md` →
  "## Addendum (re-plan at 3b12fa7, 2026-09-06)".
- Physical route scenarios:
  `agents/tasks/hadal/workitems/WI-08-materials-upgrades-gates.md` →
  "## Addendum (re-plan at 3b12fa7, 2026-09-06)".
- Seam map for the built state:
  `agents/projects/hadal/notes/20260905-understander-post-wi02-seam-map.md` and
  `20260905-implementer-wi02-world-seams.md`.

## Gotchas

- Do not create a second simulation or a simplified collision system for tests
  (request §30) — the harness must advance the *production* simulation.
- Waypoint scenarios select movement inputs only; they must never assign player
  positions or bypass collision (request §70).
- Keep this spoiler-safe: report systems, not hidden content (request §68).

## Commands

- `npx vitest run` — headless (Node) suite; `npm test` is the alias.
- `npm run build` — `tsc --noEmit && vite build`.
- `npm run dev` / `npm run preview` — browser run.
