---
tags: [review, scratch, probes, vitest, sim, harpoon, player-start]
symbols: [PLAYER_START, fireHarpoon, HARPOON_RANGE, DETER_HOLD_SECONDS, resolveHarpoonHit, deterredUntil]
---

# Reviewer probes for sim-level work items (WI-03c1a review)

How to independently verify creature/sim behavior in a reviewer session,
without re-running only the implementer's tests.

- **Out-of-tree probe pattern**: vitest's `include` is `src/**/*.test.ts`, so
  reviewer probes under `agents/tasks/<task>/scratch/reviewer/<wi>/` do not run
  in the default suite. Drop a tiny `vitest.config.ts` next to the probe
  (`test.include` = the probe path, `environment: 'node'`) and run
  `npx vitest run --config <that config>`. Import product source by relative
  path (allowed: referencing/importing, never modifying).
- **Player start is `PLAYER_START = vec2(1300, -100)`** (`src/world/worldData.ts`);
  `new Simulation` places the player there. Anchor headless distance math to
  this, not to test comments — the WI-03c1a implementer note once said
  "(1300, 1400)" (typo); the test comment "(1300, -100)" is the correct one.
- **Harpoon timing**: in `Simulation.step`, the tool-noise signal is emitted
  *before* `stepCreatures`, and `fireHarpoon()` runs *after* it — so a
  noise-sensing creature (e.g. T-14) is alerted by the shot's own blip on the
  same step, and a harpoon hit on it always resolves as deter + `return`.
  Senseless creatures (T-16) deter while idle.
- **Starter tool slots**: index 0 knife, 1 light, 2 harpoon — `toolSelect: 2`
  selects the harpoon; `fireHarpoon` gates on
  `player.selectedTool === HARPOON.name` ("Simple Harpoon").
- **Size-class check that catches a wrong keying**: to prove the damage model
  is keyed by size class (not the `combat` flag), exercise a medium def with
  *no* `combat` (T-18) — it must still die on the table's 5th hit.
