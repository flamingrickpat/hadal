---
tags: [world-data, spawns, terrain, creatures, gotcha]
symbols: [MACRO_WORLD, creatureSpawns, Terrain.resolveCircle, stepCreatures, hiddenCreatures]
---

# Spawn clearance gotcha: rising hold-point creatures vs slabs

## Fact

A creature whose signature rule rises to a hold offset above its spawn
(see the gas-pocket lifter in `src/content/secret/hiddenCreatures.ts`, hold
= spawn + 300 u, driven by the lift interaction in
`src/sim/Simulation.ts`) must be placed with at least the hold offset of
**vertical headroom** above its spawn. The shelf-floor slabs cap the top of
the twilight band: a spawn directly under `shelf-floor-east`
(x 10000–14000, slab bottom at y = -5200) gives a rising creature a solid
ceiling, and the per-step terrain resolve in
`Simulation.stepCreatures` (root circle then every `body.chainCircles`
world circle via `Terrain.resolveCircle`) zeroes its velocity against the
slab — the creature **freezes below its hold with zero velocity and target
still set**, looking like a hang rather than a stall.

## How to check placement

Rise a probe circle of the def's root radius from the candidate spawn
upward through the live `Terrain.resolveCircle` and measure the first
contact — it must exceed the hold offset plus margin. In the production
world, (14500, -5900) has 420 u of clear headroom in open twilight water;
(13400, -5400) has only 166 u.

## Symptom

Live browser: creature rises at ~38 u/s, then in one step its velocity
y snaps 38 → 0 and its position clamps to a round-ish number (the slab
bottom minus the root radius). The generic state machine keeps steering at
the unreachable target forever.

## Fix applied in WI-03b2 (attempt 0012)

Moved the lifter spawn from (13400, -5400) to (14500, -5900) in
`src/world/worldData.ts` — same designed band, open water, 420 u clear.
