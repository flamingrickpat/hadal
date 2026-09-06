---
title: WI-03 review — browser boot crash (container id) and the frame-cadence regression
role: work-item-reviewer
created: 2026-09-06
tags: [browser-adapter, boot, main.ts, frame-loop, vitest, playwright, sim-boundary]
symbols: [Game.update, main.ts, Renderer, DebugPanel, test:browser]
files: [src/main.ts, index.html, src/game/Game.ts, src/render/Renderer.ts, package.json]
---

# WI-03 review — browser boot crash (container id) and the frame-cadence regression

## Summary

WI-03's headless core is solid (`npm test` = 8 files / 56 tests, exit 0), but
its browser adapter regressed in two ways that headless tests cannot catch:
(a) `main.ts` points at a container id that `index.html` does not define, so
the page crashes on boot and renders nothing; (b) the fixed-step frame
accumulator was removed, tying sim cadence to the display refresh rate. Both
are invisible to the Vitest suite and to `npm run test:browser` (which is only
a `vite build`).

## Key Facts

- **Boot crash.** `src/main.ts:7` reads
  `document.getElementById('app')!`, but `index.html:27` defines only
  `<div id="game">`. The non-null `!` silences the type error, so `tsc` and
  `vite build` pass, but `Renderer`'s constructor
  (`src/render/Renderer.ts:40`, `container.appendChild(...)`) throws
  `TypeError: Cannot read properties of null (reading 'appendChild')`. The
  canvas, `#hud-root`, and `#debug-panel` are all absent. The approved WI-02
  `main.ts` correctly used `getElementById('game')` with an explicit null
  guard; WI-03 dropped the guard and changed the id.
- **Frame cadence.** WI-03 removed `Game.start()/stop()/frame(now)` and the
  `accumulator`/`MAX_FRAME_DT` machinery (diff `8939cb7 → 877ecd9`).
  `src/main.ts` now calls `game.update(FIXED_DT)` once per
  `requestAnimationFrame` with no accumulator, so the sim advances once per
  display frame: ~2× real time on 120 Hz, ~0.5× on 30 Hz. Headless scenarios
  step with an explicit `FIXED_DT` and are unaffected, which is why the suite
  stays green.
- **`test:browser` is a build.** `package.json` `test:browser` = `vite build`;
  it compiles the bundle but never loads a page, so it cannot catch a boot
  crash. A real browser check must load the page.

## Navigation

- Sim seam: `src/sim/Simulation.ts` (`createSimulation`, `step`, `toSave`,
  `loadFromSave`); the single seam is `sim.step`, called by both
  `Game.update` and the `Scenario` harness (`src/sim/scenario.ts`).
- Node-import boundary is real: `src/sim/*` + the reused
  `PlayerController`/`Terrain`/`constants`/`GameState` import and run in Node
  with no browser globals; `save.ts` keeps serialization/version handling
  separate from `localStorage` (browser adapter in `Game`).
- Scenario harness: `src/sim/scenario.ts` — `swimTo`/`steerToward` select
  movement inputs only (no position assignment, real collision), `trace`
  carries seed/time/position/input/assertion (request §70).
- Boot probe recipe: `agents/tasks/hadal/scratch/work-item-reviewer/WI-03/`
  (real `npm run dev` on a private port + local ms-playwright Chromium,
  fresh context, `?debug=1`).

## Gotchas

- A non-null assertion on a possibly-missing DOM element is a latent boot
  crash: `getElementById('app')!` passes type-check and the build, then throws
  at runtime. Always reconcile the container id in `main.ts` with
  `index.html`, and verify a page actually boots in a real browser — a
  `vite build` / `test:browser` cannot catch this.
- When refactoring the frame loop, preserve the accumulator (request §30).
  Stepping the sim once per `requestAnimationFrame` silently ties game speed to
  refresh rate and is invisible to fixed-step headless tests.
- `BUILD.md` "Delivery Verification Capabilities" documents the ms-playwright
  Chromium binary (`C:/Users/rick/AppData/Local/ms-playwright/chromium-*/...`)
  for headless boot probes — the environment has a usable browser even when an
  implementer claims it does not.

## Commands

```text
npm test                 # 8 files / 56 tests (headless)
npm run build            # tsc --noEmit && vite build
git diff 8939cb7 877ecd9 -- src/game/Game.ts src/main.ts   # frame-loop regression
node probe.mjs           # from scratch/work-item-reviewer/WI-03 (port 5311)
```
