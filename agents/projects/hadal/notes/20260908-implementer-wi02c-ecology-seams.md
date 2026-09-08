---
tags: [ecology, world-signal-bus, creature, scenarios]
symbols: [ecology.ts, flockForce, applyEcology, scheduleSignal, emitPredatorSignals, EcologyDef]
---

# WI-02c ecology illusion — seams

The §20 cross-species reactions run on the **existing** `WorldSignalBus` with
no new signal type: the `noise` signal's `tag` field carries the conventions
`predator` / `kill` / `quiet` (defined in `src/creatures/ecology.ts` as
`PREDATOR_TAG` / `KILL_TAG` / `QUIET_TAG`). `senses.ts` was never extended —
the spec's assumption held, and no reaction needed a global state read.

## Key facts

- `src/creatures/ecology.ts` owns all reaction predicates (`fleeSignalStrength`,
  `scavengeSignalStrength`, `quietStrength`, `strongestTaggedPos`) and
  `flockForce` (separation/cohesion/alignment, bounded-local, plus player
  parting). Pure, allocation-free, caller-reused scratch lists.
- Reaction holds are applied in `Creature.steer()` **before** the generic
  state-machine steering (order: quiet → flee → scavenge → filterFeeder), so a
  bus-driven reaction owns motion while active. The creature's `percept`/
  `queryOut` buffers are reused; never stash them across steps.
- `Simulation.applyEcology` runs the reaction pass once per step; hunting
  predators (state `stalk`/`attack`) broadcast `PREDATOR_TAG` via
  `emitPredatorSignals`; scheduled events (`scheduleSignal` /
  `drainScheduledSignals`) fire `KILL_TAG`/`QUIET_TAG` at sim time.
- ST-03 roster species opt in purely via `CreatureDef.ecology` (`school`,
  `scavenge`, `quiet` number, `filterFeeder`) — no new mechanics needed.
- Fixtures with empty `senses` (SCAVENGER, FEEDER) exist so ONLY the ecology
  layer can move them — the generic sense engine would otherwise pull them
  into `investigate` and mask the reaction under test.
- Coast greybox band (`GREYBOX_WORLD`) is current-free; filter-feeder
  orientation is tested with a custom sim world carrying a current field.

## Gotchas

- Injecting a school for the browser check: give all members one **shared
  `home`** and push them to `sim.schoolMembers`, otherwise each member pins to
  its own spawn slot and the flock force never dominates.
- The browser check script computes `repoRoot` from its own directory depth —
  it only runs from `scratch/implementer/ecology-browser/`.
