# Understanding

This child implements one independently reviewed work item from C:\Temp\hadal-v2\agents\tasks\hadalv2.

---
id: WI-02a
kind: work_item
parent: ST-02
children: []
depends_on: []
criteria:
  AC-cf-core: "A headless Creature runtime with steering, WorldSignalBus sense subscription, a generic state machine, and bespoke controller hooks advances inside the existing fixed-step simulation, with node unit tests covering senses, state transitions, and offscreen throttling"
behavior: "Implement the headless Creature runtime (definition schema, steering, sense subscription on the existing WorldSignalBus, generic state machine, bespoke controller hook) advanced by the fixed-step simulation, with unit tests"
subsystems: ["creature simulation"]
verification: "Run the node unit tests for steering, sense channels, state transitions, and offscreen throttling; run a short node scenario where a test organism reacts to a bus signal"
---

# WI-02a — Headless creature simulation core

## Goal

Add the creature runtime to the simulation. New files under `src/creatures/`
(`CreatureDef.ts`, `Creature.ts`, `steering.ts`, plus behavior extensions)
wired into `src/sim/Simulation.ts` (`step`, line 177) so creatures advance on
the same fixed timestep as the player.

## Deliverables (checkable)

- `CreatureDef` schema per section 19 (id, body, movement, senses, behavior,
  combat optional, ecology optional, audio) with audio as data the
  simulation emits and the browser adapter consumes.
- Sense primitives per section 19/63: distance vision, light, motion, noise,
  sonar, line of sight, injury/blood events - creatures subscribe to
  `WorldSignalBus` channels (`src/creatures/senses.ts:66`) and only evaluate
  nearby recent signals, never reference the player directly.
- Generic state machine (`idle`, `forage`, `wander`, `investigate`, `alert`,
  `stalk`, `attack`, `flee`, `return`, `interact`, custom) plus a documented
  hook for a bespoke per-species controller.
- Movement in the simulation with drag model matching section 6; collision
  via the existing `CollisionSystem` (circles; chain circles for long
  bodies).
- Offscreen throttling: AI deactivates beyond a world distance cap
  (section 34), distance measured in world units, not screen edges
  (section 16).
- Two neutral placeholder organisms (a schooling type and a simple forager)
  clearly marked as framework test fixtures.

## Tests (node, real functions, no mocks of the rules)

- Steering: desired-velocity vs drag behavior; boundary and terrain
  avoidance through real collision.
- Senses: each channel fires the right state transition for the right signal
  strength/distance.
- State machine: legal transitions; a bespoke controller can override.
- Throttling: creatures beyond the cap do not tick; reactivation on
  approach.

## Constraints, assumptions, non-goals

- No rendering in this item; the runtime is pure simulation state.
- Assumption: the existing bus API is sufficient; if a signal type from
  section 63 is missing, extend `senses.ts` rather than adding a parallel
  bus. Falsified if the bus forces player-specific references.
- No roster content; no creature audio synthesis (that is `AudioSystem`'s
  existing job consuming sim events).

## Fresh-session handoff

Read request sections 6, 19, 28, 30, 31, 34, 63; `understanding.md` for the
seam citations. Extend `src/sim/scenario.ts` usage for the reaction scenario
rather than inventing a new harness.

