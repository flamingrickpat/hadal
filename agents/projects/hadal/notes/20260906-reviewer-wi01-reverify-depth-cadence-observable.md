---
title: WI-01 re-verify — the boot marker is gone; use a DOM sim-clock observable for cadence
role: work-item-reviewer
created: 2026-09-06
tags: [browser, playwright, cadence, fixed-step, verification, hud, reverify]
symbols: [Game.frame, Game.update, GameState.timeSec, Hud.update, PlayerController.update]
files: [agents/tasks/hadal/scratch/work-item-reviewer/WI-01-reverify/probe.mjs, agents/tasks/hadal/reviews/WI-01-scaffold-project-review.md, src/game/Game.ts, src/ui/hud.ts]
---

# WI-01 Re-verify — Cadence Observable After WI-02 Removed the Boot Marker

## Summary

At the accepted revision (2deabb0 / HEAD fdcd243) the repository carries the
approved WI-02 player/terrain build on top of the intact WI-01 scaffold. The
WI-01 reviewer's cadence check measured the position of the **boot marker**, a
deliberately trivial object that bobbed on `GameState.timeSec`. WI-02 replaced
that marker with a **static player capsule** (idle at rest, no input), so a
marker-position displacement is now ~0 and the first review's cadence probe no
longer distinguishes a fixed-step sim from a frame-tied one. Re-verify the
scaffold by driving a *moving* sim-clock observable instead.

## Key Facts

- Reliable moving sim-clock observable at the accepted revision: sink the
  player (hold `S` → `thrustY = -1`) and read `#hud-depth-text`
  (`Math.round(player.depth)` m), which `Hud.update` writes once per sim step.
  From `PLAYER_START` (1300, -100) holding S sinks ~280 u/s (≈700 m in 3 s),
  well clear of the greybox floor (~-1300) for a 3 s window.
- Cadence test: install the same vsync pump as the first review (deliver the
  page's rAF on 1 of 4 vsyncs via `addInitScript`), measure the depth advance
  over an identical 3 s window throttled vs unthrottled. Observed +700 m vs
  +696 m (within 0.6%); a frame-tied sim would advance ~1/4 as far.
- Keep the throttled rate above the clamp floor: headless rAF measured ~36 Hz
  throttled (109 delivered / 3 s) vs ~118 Hz unthrottled (354 / 3 s). 36 Hz
  keeps each callback gap ≈ 0.028 s < `MAX_FRAME_DT` 0.1, so no sim time is
  clamped away — the depth comparison stays valid. (Complements
  `20260905-reviewer-wi02-probe-sim-clock.md`.)

## Navigation

- Re-verify probe: `agents/tasks/hadal/scratch/work-item-reviewer/WI-01-reverify/`
  (`probe.mjs`, `output/result.json`, `output/A-dev-1920x1080.png`).
- Re-verification section: `agents/tasks/hadal/reviews/WI-01-scaffold-project-review.md`.

## Gotchas

- Do not re-run the first reviewer's marker probe
  (`scratch/work-item-reviewer/WI-01/probe.mjs`) and expect the cadence check
  to pass: its `sampleMarkerY` samples the region where the boot marker used
  to be, which now holds a static player — the "marker moves" assertion
  fails even though the fixed-step sim is correct.
- Read canvas pixels over several rAF ticks and take the max luminance range;
  a single synchronous `readPixels` can catch a cleared/presented back buffer
  and read as blank (lumRange 0).

## Commands

```text
node agents/tasks/hadal/scratch/work-item-reviewer/WI-01-reverify/probe.mjs
```
