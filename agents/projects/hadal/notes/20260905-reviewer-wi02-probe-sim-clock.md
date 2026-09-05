---
title: WI-02 review — measuring sim time in headless browser probes
role: work-item-reviewer
created: 2026-09-05
tags: [testing, browser-probe, sim-clock, vitest, playwright]
symbols: [PlayerController.updateMeters, Game.update, hud, debugTeleport]
files: [src/player/PlayerController.ts, src/game/constants.ts, src/ui/hud.ts]
---

# WI-02 review — measuring sim time in headless browser probes

## Summary

When driving the real game page from a headless browser probe, do not assume
sim time equals wall time. The O2 meter is a reliable in-page sim clock:
below depth 100 with no boost/injury it drains at exactly 1/s
(`PLAYER_O2_DRAIN_PER_SEC`), so `o2(t1) - o2(t0)` is sim seconds. The HUD and
debug readout update at 4 Hz, so any two consecutive reads can differ by up
to 250 ms of sim time.

## Key Facts

- Headless Chromium rAF cadence is not vsync-capped and varies under
  SwiftShader load; the `MAX_FRAME_DT = 0.1` clamp discards callback gaps,
  so a stalled page makes the sim fall behind wall time (observed ~0.8–1.0×).
- The O2/HP meters carry across `debugTeleport` calls — teleporting does not
  reset them. Phase-based probe plans must track the meter state explicitly.
- Terrain resolution pushes the player tangentially along sloped segments:
  holding thrust into the east-rising seabed slope (x 1000–1800) slides the
  player west. Expected local depth at floor x is `1420 - (x-1000)*0.0875`
  (floor height −30 radius).
- `bindToWindow` defaults `aimPoint` to the world origin (0,0) before the
  first mouse event; the player body visibly rotates toward it on boot until
  the mouse moves.
- The 4 Hz `#debug-readout` format:
  `x <x>  depth <y>  o2 <n>s  hp <n>  facing <f>  aim <x> <y>` — parse with
  the regex in `scratch/work-item-reviewer/WI-02/probe.mjs`.

## Navigation

- Probe recipe: `agents/tasks/hadal/scratch/work-item-reviewer/WI-02/`
  (real `npm run dev` on a private port + local ms-playwright Chromium,
  fresh context, `?debug=1`).
- Movement/meter model: `src/player/PlayerController.ts` (integrator +
  `updateMeters`), constants in `src/game/constants.ts`.
- Sim seam: `Game.update(FIXED_DT)` in `src/game/Game.ts` (single tick).

## Gotchas

- Asserting a HUD value against a concurrently read readout races by up to
  250 ms of sim time (≈ 70 world units at top speed). Assert exact matches
  only while the player is at rest.
- The O2 row/HP row opacity is 0.25 when full, 1 otherwise — a good
  fade-when-full check (request §26).
- A wall-clamp on the dev-server port (`--strictPort`) keeps probes from
  silently attaching to a stale server on the default port.

## Commands

```text
npx vitest run          # 4 files / 31 tests (WI-01 + WI-02)
npm run build           # tsc --noEmit && vite build
node probe.mjs          # from the reviewer scratch dir (port 5196)
```
