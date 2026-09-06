---
title: WI-06 world-signal bus + sonar (the §63 perception seam)
role: item-implementer
created: 2026-09-07
tags: [sonar, world-signal-bus, senses, perception, creatures, service-provider, information-holder]
symbols: [WorldSignalBus, WorldSignal, Percept, SignalType, SonarSystem, SonarObject, SonarTarget, SonarEcho, SonarVisuals, emitPlayerSignals, sonar-1]
files: [src/creatures/senses.ts, src/systems/SonarSystem.ts, src/render/sonar.ts, src/sim/Simulation.ts, src/sim/scenarios.test.ts]
---

# Summary

The §63 world-signal bus is the single perception seam the game builds around.
`WorldSignalBus` (in `src/creatures/senses.ts`, information-holder) is a pooled
bus of short-lived environmental signals; `SonarSystem` (in
`src/systems/SonarSystem.ts`, service-provider) is the §18 sonar that emits two
of those signal types. The `Simulation` owns both and emits the player's
tool/boost/sonar signals. **WI-10 creatures subscribe to the bus, not the
player** — a creature never references the player directly; it perceives
nearby-recent signals and reacts.

# Key Facts

- **The `WorldSignal` type is canonical in `senses.ts`** (reuse it, never
  clone it):
  ```ts
  type WorldSignal =
    | { type: 'noise';  pos: Vec2; strength: number; tag: string }
    | { type: 'light';  pos: Vec2; strength: number; tag: string }
    | { type: 'sonar';  pos: Vec2; strength: number }
    | { type: 'injury'; pos: Vec2; strength: number };
  ```
  Four channels: `noise` / `light` / `sonar` / `injury`. `noise` and `light`
  carry a `tag` (what made them); `sonar` and `injury` do not.
- **Bus API** (`WorldSignalBus`):
  - `emit(signal, time)` — write a signal onto a reused pooled slot (no
    allocation). The bus is capped (default 64) and reuses the oldest on
    overflow.
  - `update(time)` — expire signals older than `SIGNAL_LIFETIME` (call once per
    sim step; `Simulation.step` does this via `SonarSystem.update`).
  - `perceive(x, y, time, out)` — a creature's summed nearby-recent strength by
    channel into a caller-provided `Percept {noise, light, sonar, injury}`
    (allocation-free). This is the main creature primitive.
  - `queryNear(x, y, radius, time, out)` — list the nearby-recent signals within
    `radius`, each with its perceived strength; returns the count.
  - `size` — the number of currently active signals.
- **Decay** (the "nearby recent" rule, §63): a signal's perceived strength is
  `strength * (1 - age / SIGNAL_LIFETIME) * distanceGain(dist, SIGNAL_RANGE_REF)`.
  `SIGNAL_LIFETIME = 3.0` s, `SIGNAL_RANGE_REF = 1500` (reuses `distanceGain`
  from `src/util/audio.ts`). A creature near a fresh signal reacts; a distant or
  stale one does not.
- **Creature reaction pattern** (the seam WI-10 uses): a creature keeps a
  `Percept`, calls `bus.perceive(x, y, time, this.percept)` each update, and
  reacts when `percept.<channel> >= threshold`. See the fixture creature in
  `src/creatures/senses.test.ts`.
- **The `Simulation` emits the player signals** (`Simulation.emitPlayerSignals`
  + `SonarSystem.fire`): a used tool makes a `noise` blip (`TOOL_NOISE_STRENGTH`),
  a sustained boost makes a throttled `noise` signal (`BOOST_NOISE_STRENGTH`,
  every `BOOST_SIGNAL_INTERVAL` s, only when the `boost` capability is present),
  and a sonar fire emits a `sonar` + `noise` signal pair
  (`SONAR_SIGNAL_STRENGTH` / `SONAR_NOISE_STRENGTH`, tag `'sonar'`).
- **The sonar is gated on the `sonar` capability** (the `sonar-1` recipe).
  Starter gear grants no `sonar`, so `Q` is inert until the upgrade is crafted.
  `SonarSystem` emits the signals; `SonarVisuals` (browser) draws the ring/tags/
  echoes. The ring expands to `SONAR_RANGE`, stamps brief `lastHit` outline tags
  (terrain `TAG_FLASH_TIME`, resource signatures `SIGNATURE_TIME`), returns
  larger/slower pulses from massive objects (`MASSIVE_FLASH_SCALE`), and spawns
  short-lived echo particles (`ECHO_LIFE`).
- **Sonar objects** (for WI-10): to make a creature a sonar target, add it to
  the `SonarSystem` constructor's `objects` as a `SonarObject
  {x, y, size, resource}` — `size > 1` makes it massive (larger/slower pulse).

# Navigation

- `src/creatures/senses.ts` — the §63 bus: `WorldSignal`, `Percept`,
  `SignalType`, `WorldSignalBus`, `SIGNAL_LIFETIME`, `SIGNAL_RANGE_REF`.
- `src/systems/SonarSystem.ts` — the §18 sonar (pure, Node-testable).
- `src/render/sonar.ts` — `SonarVisuals` (the only browser-dependent part).
- `src/sim/Simulation.ts` — owns the bus + sonar; `emitPlayerSignals`.
- `src/sim/scenarios.test.ts` — the sonar §70 scenario (inert before, signal
  after crafting `sonar-1`).
- `src/creatures/senses.test.ts`, `src/systems/SonarSystem.test.ts` — unit tests.

# Gotchas

- `tsconfig` has `noUncheckedIndexedAccess`: index the bus/sonar pools with `!`.
- The sonar tag re-stamp condition must handle never-tagged targets
  (`lastHit === 0`): `t.lastHit === 0 || time - t.lastHit >= this.tagDuration(t)`.
- The dense terrain sampler needs ≥2 points; a single-point terrain produces no
  samples.
- The sonar ring advances by `SONAR_RING_SPEED * dt` per `update` call, not by
  a time jump — tests must step slowly (`time += FIXED_DT`), not jump time.

# Commands

- Unit: `npx vitest run src/creatures/senses.test.ts src/systems/SonarSystem.test.ts`
- Full suite: `npm test` (15 files / 103 tests)
- Build: `npm run build`
