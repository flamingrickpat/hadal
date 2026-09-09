---
tags: [creatures, tier-3, controllers, simulation, signature-rules, roster]
symbols: [applyTier3Interactions, t14Post, t15Burst, t16Boulder, t17Silk, t18Herd, t14Controller, t15Controller, tier3State, tier3Driven, T14_NET_RADIUS, T15_CORNERED_NOISE, T16_WAKE_NOISE, T18_DRIVE_SPEED]
---

# Tier-3 controller seams (WI-03c1b)

Where the tier-3 per-predator behavior lives, for WI-03c2 (spawns/presentation)
and WI-03d (roster-wide audit).

## Summary

The tier-3 organisms use the established tier-2 pattern: a small
`behavior.controller` in `hiddenCreatures.ts` pins the rest state, and the
load-bearing signature rule runs simulation-side in
`Simulation.applyTier3Interactions` (called in `step` after the tier-2
pass), because the controller hook `(creature, percept, dt)` cannot see the
player or the ambient pool. Per-creature working state (windows, cooldowns,
one-hit flags, the T-15 burst phase) lives in one `Map<Creature, …>` on the
Simulation (`tier3`); driven T-18 prey are tracked in `tier3Driven`.

## Key Facts

- T-14 posts: `idle` → `alert` (armed, audio `t14-knock`) → `idle`; the snap
  (hit 10 + 220u drag) and the deter stand-down are in `t14Post`. Arm
  thresholds are read from the def's sense values, not hardcoded.
- T-15: the controller is deliberately a **no-op** — it stands the generic
  engine down (the noise sense would escalate to a chase). The burst cycle
  and the cornered charge (perceived noise ≥ 0.35, one bounded dash) are in
  `t15Burst`; the charge uses the `attack` state (one hit, then stand-down).
- T-16 / T-17: `idle` → `custom` (strike / silk) → `idle` with long resets;
  both read `percept.noise` against a threshold (T-17 reads the def's own).
  Both are in `t16Boulder` / `t17Silk`.
- T-18 drives small **schooling** prey (`ecology.school === true` only) via a
  §64 position drift (45u/s) into a 150u field; `interact` near a driven
  member inside the field banks one `salvage` and removes the member.
  No controller — generic `wander` is the whole motion.
- **Player-creature damage is new here**: `combat.damage` was data-only
  before; the tier-3 pass is its only application site (clamped to 0,
  `handleDeath` untouched). The generic `attack` state still does no
  player damage.
- Audio events from tier-3 transitions drain on the step *after* the
  transition (the pass runs after that step's audio collection) — scenarios
  must check `creatureAudioEvents` one step late.
- `Creature.setState('wander'|'idle'|'forage')` nulls `target` — set
  `target` *after* such a transition.
- Perceived-signal math for trigger tuning: `strength * (1 - age/3) *
  (1500/(1500+d))²` — tool noise 0.5 reads ~0.35 at 250u fresh, ~0.30 at
  447u, 0 at distance without a signal.

## Gotchas

- Driving prey by retargeting their state machine stalls: the
  schooling-cohesion pass (`applyEcology`) counter-steers target changes.
  Use the position-drift mechanism for herd motion (T-09/T-31 precedent).
- `runT`-style state polling must run every step to catch signature state
  paths; sparse sampling misses 1-step states.

## Commands

```
npx vitest run src/sim/tier3Scenario.test.ts
npx vitest run
npx tsc --noEmit
```
