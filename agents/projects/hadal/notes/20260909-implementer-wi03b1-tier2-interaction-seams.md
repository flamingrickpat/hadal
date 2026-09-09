---
title: Sim-side creature interaction pass (WI-03b1 tier-2 fauna)
role: implementer
created: 2026-09-09
tags: [creature, simulation, interaction, tier-2, friendly, position-drift, roster]
symbols: [applyTier2Interactions, doT08Trade, herdT09, sweepT10, liftT11, rideT27, driftT31, nearestCreatureOf, tier2Sweep, TIER2_CREATURES, TIER2_IDS, TIER2_BANDS, HIDDEN_CREATURES]
files: [src/sim/Simulation.ts, src/content/secret/hiddenCreatures.ts, src/sim/tier2Scenario.test.ts, src/creatures/fixtures.ts]
---

# Sim-side creature interaction pass (WI-03b1 tier-2 fauna)

## Summary

The tier-2 useful/neutral fauna (request §11.1, §21) need rules the generic
creature state machine cannot express — they reference sibling creatures, the
world node list, the player's inventory, or a per-condition speed. The
seam for all of them is one pass in `Simulation.step` (not the `Creature`
controller hook).

## Key Facts

- `Simulation.applyTier2Interactions(input, dt)` runs once per `step`, after
  `stepCreatures(dt)`. It dispatches per creature id: `doT08Trade` (on
  `input.interact`), `herdT09`, `sweepT10`, `liftT11`, `rideT27`, `driftT31`.
  A creature's `behavior.controller` (request §19) is used only to pin the
  state; the load-bearing rule is sim-side (request §30).
- Why sim-side: the `CreatureController` hook signature is
  `(creature, percept, dt)` — it CANNOT see sibling creatures (herding needs
  the nearest T-03), the node list (sweep needs a `ResourceNode`), or the
  player's inventory (trade). `Simulation` has all of them.
- Per-creature working state (e.g. the sweeper's accrual timer + finished
  nodes) lives in a `Map<Creature, {...}>` on the Simulation (`tier2Sweep`);
  creature instances are stable, so keying by instance is safe.
- Player-facing nudges use the request §64 mechanism: a **position drift**
  (`player.position += v*dt` / `creature.position += v*dt`), the same one
  `applyCurrent` uses on the player — consistent, and it lets a headless
  player (no input) move. Lift/ride/herd/drift all use it.
- Adding a roster tier to `hiddenCreatures.ts` bumps two pre-existing count
  assertions: `HIDDEN_CREATURES` length in `tier1Scenario.test.ts` and
  `Object.keys(CREATURE_BY_ID)` length in `creatureScenario.test.ts`. Bump
  both when a tier lands (they are sizes, not weakened checks).

## Navigation

- Registry merge: `fixtures.ts` spreads `HIDDEN_CREATURES` into
  `CREATURE_BY_ID`; tier defs just need to be in `HIDDEN_CREATURES`.
- Tier-2 defs/controllers: `src/content/secret/hiddenCreatures.ts`
  (`T08`…`T31`, `TIER2_LIST`, `TIER2_CREATURES` record-by-id, `TIER2_IDS`,
  `TIER2_BANDS`).
- Per-species signature-rule scenarios + friendly floor + spoiler sweep:
  `src/sim/tier2Scenario.test.ts`.

## Gotchas

- `creature.time` and `creature.stateTime` are **private** — a controller
  cannot use them for a phase/sine. Use `position`/`home` or drop the
  animation.
- One `maxSpeed` constant per def cannot encode several cruising speeds. For a
  depth/condition-scaled speed, don't set `creature.velocity` in the
  controller under the `custom` state (the shared `settle` integrator damps it
  toward 0 and the result does not track the tier). Apply the speed as a sim
  position drift instead (see `driftT31`).
- Coordinate sign: `y = 0` is the surface, negative is deeper, so "rising" /
  "lift" is `+y`. (PlayerController documents this.)
- `applyCurrent` and `rideT27` move `player.position` directly, bypassing
  terrain collision — fine in clear water (the tier-2 scenarios are), but a
  production spawn near terrain would need a collision check.

## Commands

```
npx vitest run src/sim/tier2Scenario.test.ts
npx tsc --noEmit
```
