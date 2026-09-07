---
id: ST-02
kind: story
parent: null
children: ["WI-02a", "WI-02b", "WI-02c"]
depends_on: []
criteria:
  AC-cf-core: "A headless Creature runtime with steering, WorldSignalBus sense subscription, a generic state machine, and bespoke controller hooks advances inside the existing fixed-step simulation, with node unit tests covering senses, state transitions, and offscreen throttling"
  AC-cf-render: "A reusable spine creature renderer plus small and rigid body renderers draw creature state from the simulation in the Three.js layer without changing gameplay rules"
  AC-cf-ecology: "School behavior and cross-species reactions run headlessly through the world-signal bus and are verified by a node scenario"
behavior: "Build the data-driven creature framework (request sections 13, 19, 20, 63) as one behavior in the simulation and one rendering pass, attached to the existing WorldSignalBus seam rather than a parallel island"
subsystems: ["creature simulation", "procedural creature rendering", "world signal bus", "headless scenario tests"]
verification: "Node unit tests for the runtime, a node scenario for schools and cross-species reactions, and a focused browser check that a test organism renders and animates without console errors"
---

# ST-02 — Creature framework (request sections 13, 19, 20, 63)

## Goal

Provide the machinery ST-03 implements the secret roster on: a headless
creature runtime in the simulation, the procedural 2.5D renderers, and the
ecology illusion. No secret species exist yet; this story ships with neutral
test organisms (a schooling organism and one simple forager) sufficient to
prove the pipeline. Those placeholders are public-safe and may be reused or
replaced by ST-03.

## Why this shape

The framework is three independently testable responsibilities: simulation
behavior (headless), rendering (browser), and the cross-species behavior
layer (headless, needs both to be visually meaningful). Splitting further
would fragment one behavior; this is the smallest useful decomposition.

## Decomposition (already applied)

- WI-02a: simulation core — Creature runtime, steering, senses via
  `WorldSignalBus` (`src/creatures/senses.ts:66`), generic state machine,
  bespoke controller hook, offscreen throttling.
- WI-02b: rendering — spine renderer (section 13.2), small-creature and
  rigid-hierarchy renderers (13.1/13.3), animation principles (13.5),
  found-object attachment hook (13.4).
- WI-02c: ecology illusion — schools, flee/scavenge/hide reactions,
  zone-quiet-before-events, cross-species events driven by the bus
  (section 20).

## Dependency notes

WI-02b depends on WI-02a (renders sim state). WI-02c depends on both
(behavior is sim-side, proof is a scenario plus visible schools). ST-03
depends on this whole story.

## Constraints and non-goals

- No ECS framework, no general-purpose engine (section 28). A class plus
  state machine, with 120-line bespoke controllers allowed where clearer
  (section 19).
- Keep gameplay rules (collision, senses, states, throttling) in the
  simulation per section 30; the renderer only reads state.
- No secret roster content; no names from the creative pass may appear in
  code identifiers visible outside `src/content/secret/` (internal IDs are
  fine per section 33).
- Performance rules from section 34 apply from the first commit: pooled
  particles, capped counts, no per-frame vector allocation in hot loops.

## Fresh-session handoff

Read request sections 13, 19, 20, 28, 30, 31, 34, 63 and
`understanding.md` for the `WorldSignalBus` seam. Collision primitives exist
in `src/systems/CollisionSystem.ts`; creatures use circles/capsule circle
chains there. Reviewers check the three criteria; the placeholder organisms
are explicitly labeled as fixtures in any scenario.
