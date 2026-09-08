---
title: Headless creature runtime seams (WI-02a)
role: implementer
created: 2026-09-07
tags: [creature, simulation, steering, state-machine, signal-bus, throttling]
symbols: [Creature, CreatureDef, steerVelocity, steerToward, steerAway, settle, canTransition, DEFAULT_TRANSITIONS, CREATURE_BY_ID, SCHOOLER, FORAGER, stepCreatures, CREATURE_AI_RANGE]
files: [src/creatures/Creature.ts, src/creatures/CreatureDef.ts, src/creatures/steering.ts, src/creatures/fixtures.ts, src/creatures/senses.ts, src/sim/Simulation.ts, src/game/constants.ts]
---

# Headless creature runtime seams (WI-02a)

## Summary

The creature runtime (`src/creatures/`) is pure simulation state, advanced by
`Simulation.step` → `stepCreatures(dt)` on the same fixed step as the player.
Creatures react only to `WorldSignalBus` channels — the player position is
passed to `Creature.update` solely as the AI-throttling focus (request §34,
§16: a world distance, not a screen edge).

## Key Facts

- `Simulation` constructor resolves each chunk's `creatureSpawns` against
  `CREATURE_BY_ID` (`src/creatures/fixtures.ts`) and throws on unknown ids
  (request §32). Fixture organisms are `fixture-schooler` (schooling) and
  `fixture-forager` (long-bodied, chain circles) — test scaffolding, not
  roster content.
- `Creature.update(dt, time, focus)`: beyond `CREATURE_AI_RANGE`
  (`src/game/constants.ts`, 3000 world units) sets `active = false` and skips
  everything — reactivation is automatic on the next in-range tick.
- Generic engine: `genericReact` (sense → transition) then
  `genericStateWork` (retarget/escalation/fades), then `steer`. A bespoke
  `behavior.controller` replaces `genericReact` + `genericStateWork` entirely
  and may set any state (the hook is trusted).
- `setState` records `lastTransition`; `Simulation.stepCreatures` drains it
  into `creatureAudioEvents` (audio is data for the browser adapter, request
  §19) and resets it, so audio fires exactly once per transition.
- Drag model matches the player: `v *= exp(-dragRate * dt)` (request §6);
  the steering functions in `src/creatures/steering.ts` are allocation-light
  pure mutators and know nothing about terrain — `Simulation.stepCreatures`
  runs `terrain.resolveCircle` for the root and each `chainCircles` entry
  (the tail correction is applied to the creature position, request §31).
- Senses: the creature owns a `Percept` filled by `bus.perceive(x, y, time,
  percept)`; signal-position lookups use `bus.queryNear` into a per-creature
  `queryOut` buffer, only on transitions (allocation off the hot path).
- `buildTriggerContext().creatureState(id)` now returns the live creature
  state (was a null stub), so §36 triggers can condition on creature states.

## Navigation

- Spawn authoring: `WorldChunkDef.creatureSpawns` (`src/world/chunks.ts`).
- Reaction scenario: `src/sim/creatureScenario.test.ts` uses the existing
  `Scenario` harness — spawns are injected onto `GREYBOX_WORLD` chunk[0].
- State legality: `canTransition` + `DEFAULT_TRANSITIONS` in
  `src/creatures/Creature.ts`.

## Gotchas

- A generic `return` state ends in the def's `startState` — for the forager
  that is `forage`, not `wander`; tests asserting the post-return state must
  use the def's start state.
- `percept`/`queryOut` are reused buffers: never stash them across steps.
- Deactivated creatures freeze completely (position and state) — a world
  authored with creatures > 3000 units from the player start sees no motion
  until the player approaches.

## Commands

```
npx vitest run src/creatures/steering.test.ts src/creatures/Creature.test.ts src/sim/creatureScenario.test.ts
```
