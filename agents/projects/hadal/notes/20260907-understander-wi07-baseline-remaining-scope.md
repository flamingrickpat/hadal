---
title: hadalv2 baseline at 01066db - what is built and what remains
role: understander
created: 20260907
tags: [baseline, hadalv2, remaining-scope, creatures, sim-boundary, status]
symbols: [createSimulation, Simulation.step, makeSimWorld, MACRO_WORLD, BASE, WorldSignalBus, Scenario, serializeSave, parseSave, loadFromStorage]
files: [src/sim/Simulation.ts, src/sim/scenario.ts, src/world/worldData.ts, src/creatures/senses.ts, src/game/save.ts, src/game/Game.ts]
---

# hadalv2 baseline at 01066db - what is built and what remains

## Summary

The `hadalv2` task runs from a committed baseline, `01066db`
("checkpoint: kernel baseline for hadalv2"), that sits directly on top of
completed, reviewed WI-01..WI-07. The four project files under
`agents/projects/hadal/` were last refreshed at WI-02 (`7aa2435`) and still
label save and the macro world as "target"/"not implemented"; as of `01066db`
both are done. This note is the current-state overlay that supersedes those
stale labels. The simulation boundary (request section 30) is honored and the
headless suite is green.

## Key Facts

- Built at baseline: the headless sim core (`src/sim/Simulation.ts` - movement,
  collision, O2/health/power/cargo meters, base, crafting, versioned save,
  sonar, currents, soft gates, fixed-timestep `step`), the reusable headless
  scenario harness (`src/sim/scenario.ts`), the full five-band macro world
  (`src/world/worldData.ts` `MACRO_WORLD` = coast + shelf + twilight + abyss +
  hadal), the procedural WebAudio system, sonar visuals, the section 63
  world-signal bus (`src/creatures/senses.ts` `WorldSignalBus`), the visual
  language (`src/render/`), and the HUD / crafting menu / debug panel /
  versioned `localStorage` save.
- Not yet built (the remaining request scope, phases 4-9 + win condition):
  the creature framework (`Creature`, steering, spine renderer, behaviors) and
  the entire secret roster; the section 12 hidden creative pass
  (`design_private/` does not exist, but is gitignored); `src/content/secret/`;
  the MacGuffin, the non-boss endgame and ending variants; and the five
  authored spectacle beats. `worldData.ts` currently has zero
  `creatureSpawns`.
- Verification: `npm test` / `npx vitest run` = 19 files / 135 tests, all
  green, ~0.6s, exit 0 at this revision. `npm run build` type-checks + bundles.

## Navigation

- Next change seam for creature/encounter work: subscribe to the section 63
  `WorldSignalBus` (`src/creatures/senses.ts:66`) and drive encounters through
  the `TriggerSystem` (`src/world/triggers.ts`); all new gameplay rules attach
  inside `Simulation.step` (`src/sim/Simulation.ts:177`). Do not build a
  parallel creature island.
- The win condition (MacGuffin retrieval + ending flags) belongs in the sim so
  the headless scenarios can assert it (request sections 23, 24, 70).

## Gotchas

- The `.codegraph/` index is fresh and returns verbatim current source for
  `Simulation.ts` / `Game.ts` / `scenario.ts`; the old PROJECT.md claim that it
  is "stale for product symbols" no longer holds at this revision.
- Spoiler containment: roster, lore truth, MacGuffin nature, and endings live
  only in `design_private/` and `src/content/secret/` (request sections 0, 12,
  68). Never name them in notes, progress reports, or commit summaries.
- Headless tests prove rules and reachability, not visual quality, audio
  quality, or the section 34 60-FPS target in the largest encounter - those
  need live browser observation.

## Commands

- `npm test` or `npx vitest run` - headless suite (19 files / 135 tests).
- `npm run build` - `tsc --noEmit && vite build`.
- `npm run dev` - Vite dev server; `npm run preview` after a build.
- `node tests/browser/boot.test.mjs` - the focused browser boot probe.
