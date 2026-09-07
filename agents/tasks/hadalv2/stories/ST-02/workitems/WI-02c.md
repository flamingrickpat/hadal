---
id: WI-02c
kind: work_item
parent: ST-02
children: []
depends_on: ["WI-02a", "WI-02b"]
criteria:
  AC-cf-ecology: "School behavior and cross-species reactions run headlessly through the world-signal bus and are verified by a node scenario"
behavior: "Implement the ecology illusion (section 20): schooling plus cross-species reactions (flee, scavenge, orient, hide, zone quiet before large events) driven by the world-signal bus, verified headlessly"
subsystems: ["creature simulation", "world signal bus"]
verification: "Node scenario advances the production simulation: a predator signal makes nearby schools part, scavengers approach a kill event, and a zone quiets before a scheduled large event; browser check confirms schools are visible"
---

# WI-02c — Schools and cross-species reactions

## Goal

Create the illusion of an ecosystem with a few cross-species reactions
(section 20), all simulated headlessly and driven by the bus - no
omniscience, no direct player references.

## Deliverables (checkable)

- Schooling: aligned/flocking movement for the ambient school fixture,
  schools part around the player (section 48), bounded local perception.
- Reaction rules from section 20 that are cheap to run: small fauna flee
  predator proximity; scavengers approach recent kills; filter feeders
  orient to currents (existing current fields, section 64); animals hide
  before a colossal event; predators occasionally attack ambient prey;
  zones quiet temporarily before major events.
- Every reaction keyed to a `WorldSignal` type or an existing sim event, so
  ST-03's roster species can opt in via `CreatureDef.ecology` without new
  mechanics.
- Seeded, deterministic per section 61: school formation and idle variation
  use the scenario seed; critical behavior is not randomized.

## Tests (node)

- One scenario covering at least three distinct cross-species reactions in a
  single run, with state assertions and the standard failure trace.
- Unit tests for the reaction predicates (distance/strength thresholds).
- Performance: reaction cost stays within the throttling budget; a scenario
  with capped ambient counts runs at simulation speed.

## Constraints, assumptions, non-goals

- This is the illusion, not an ecosystem simulator (section 20 first line).
  No population dynamics, no food web model.
- Assumption: existing signal types suffice; if one is missing, extend
  `senses.ts` minimally. Falsified if a reaction needs a global state read
  instead of a nearby signal.
- Roster species, predator personalities, and authored set pieces belong to
  ST-03/ST-04; here only the neutral fixtures demonstrate the layer.

## Fresh-session handoff

Read request sections 20, 48, 61, 63, 64 and the WI-02a/WI-02b notes. Extend
the existing scenario harness; do not create a second test rig.
