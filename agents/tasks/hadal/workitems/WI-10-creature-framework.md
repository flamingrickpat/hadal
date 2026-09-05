# WI-10: Creature framework (steering, senses, spine renderer, schools, predators, cross-species)

## Identity

- Task: hadal
- Story: implicit
- Owner role: `item-implementer`
- Complexity: high
- Dependencies: WI-06, WI-07

## Goal

Build the reusable creature system: data-driven steering and state machines, the spine/spline renderer, small-creature and massive-creature renderers, the found-object/wreck-symbiosis attachment system, schools, predator primitives, and cross-species ecology events — so the hidden roster (WI-11) can be implemented on a real, extensible framework.

## Vision Link

Request §13 (procedural 2.5D: small creatures §13.1, spine creatures §13.2, massive rigid/hierarchy §13.3, wreck symbiosis §13.4, non-periodic animation §13.5), §19 (creature AI: `CreatureDef`, class + state machine, senses), §20 (ecology illusion via cross-species reactions), §34 (performance: instancing, throttled offscreen AI, no per-frame allocations). §45 requires the framework to support 15+ creatures and 4+ non-chase behaviors.

## Acceptance Criteria

- [ ] A data-driven `CreatureDef` (body/movement/senses/behavior/combat?/ecology?/audio, request §19) drives a class + state machine with states `idle/forage/wander/investigate/alert/stalk/attack/flee/return/interact` plus custom species states (request §19); major organisms may use bespoke controllers instead of forcing the generic machine.
- [ ] A reusable spline/spine renderer (`SpineNode` head→constrained nodes, body geometry from left/right normals, attached fins/plates/tendrils/lights/debris at normalized positions, request §13.2) produces eels, ribbon animals, colonial life, and long filter feeders.
- [ ] Small creatures render via `ShapeGeometry`/polygons/translucent fins/outline lines/`CanvasTexture` masks/simple vertex deformation (request §13.1); massive rigid/semi-rigid organisms use a mesh hierarchy on a root transform with parts moving on different time scales, often extending beyond screen bounds (request §13.3).
- [ ] A generic attachment system lets a creature carry pieces generated from the same geometry library as world wreckage (request §13.4), preserving the design principle that huge life appropriates human-scale objects as anatomy/camouflage/shelter/nursery.
- [ ] Animation is not perfectly periodic: noise modulation, occasional pauses, breathing/pumping cycles, asymmetric appendages, reactions to nearby objects, acceleration-dependent deformation, and sudden posture change when alert (request §13.5).
- [ ] Senses are the §63/§19 primitives (distance vision, light/motion/noise/sonar sensitivity, line of sight, chemical/blood) that creatures subscribe to on the world-signal bus (request §19, §63).
- [ ] Schools use instancing and follow the current field (request §34, §64); offscreen AI is throttled and ambient counts are capped (request §34).
- [ ] Predator primitives (deter/stalk/territory) exist (request §10, §19) and cross-species reactions create the ecology illusion (prey flees, scavengers approach kills, filter feeders orient to currents, animals hide before a colossal event, predators attack ambient prey, carcass particles attract species, zones go quiet before events, request §20).
- [ ] The framework is exercised by at least a few placeholder organisms and stays smooth (~60 FPS at 1080p) (request §34).

## Required Evidence

| Criterion | Evidence type | Command or artifact |
|---|---|---|
| Data-driven CreatureDef + state machine | workflow (code + review) | reviewer confirms `CreatureDef` reuse and the §19 states; a placeholder creature cycles states |
| Spine renderer produces varied bodies | manual (browser) | render eel/ribbon/colonial/filter-feeder shapes from one spine system |
| Small + massive renderers | manual (browser) | small creatures and a screen-spanning massive organism render correctly |
| Wreck-symbiosis attachment | manual (browser) | a creature carries wreckage-generated pieces as anatomy |
| Non-periodic animation | manual (browser) | appendage motion is not a uniform sine; posture changes on alert |
| Schools + offscreen throttle + cross-species | manual (browser) + workflow | instanced schools follow current; offscreen AI throttled; a cross-species reaction (e.g., prey flees a predator) is visible |
| Smooth at 1080p | manual (browser) | ~60 FPS with active creatures |

## Tests To Write First

- A Vitest test for steering/segment-constraint math and for a sense primitive reacting to a nearby §63 signal (deterministic).
- A Vitest test for the offscreen-AI throttle (a distant creature's update is skipped).

## Live Or External Verification

In a real desktop browser: run several placeholder creatures; confirm varied body shapes, non-periodic animation, a wreck-symbiosis carrier, instanced schools following the current, a cross-species reaction, and ~60 FPS.

## Infrastructure Required

- Start: `npm run dev`
- Restart: re-run `npm run dev`
- Health: placeholder creatures animate/react/interact; offscreen AI throttled; ~60 FPS; no console exceptions
- Timeout: n/a
- Endpoint or MCP: none

## File Pointers

- `src/creatures/Creature.ts`, `src/creatures/CreatureDef.ts` (request §19), `src/creatures/creatureFactory.ts`, `src/creatures/steering.ts`, `src/creatures/senses.ts` (request §19, §63), `src/creatures/spineRenderer.ts` (request §13.2), `src/creatures/behaviors/` (request §19)
- request §10, §13, §19, §20, §34, §63, §64

## Architecture And Integration Constraints

New files, L1 + archetype:

- `src/creatures/CreatureDef.ts` — `holds — authored creature definitions`; information-holder (reuse the §19 type).
- `src/creatures/Creature.ts` — `runs — a creature's steering + state machine per frame`; coordinator.
- `src/creatures/spineRenderer.ts` — `renders — spline/spine creature bodies from constrained nodes`; service-provider.
- `src/creatures/behaviors/` — `implement — generic + bespoke creature states`; controller.

Constraints: data-driven but not ECS-heavy (request §19); reuse the §19 `CreatureDef` and §63 signal bus (never clone them). Bespoke controllers are allowed for major organisms (request §19). This framework is content-neutral; the hidden roster is WI-11. Performance rules (instancing, throttling, no per-frame allocations) are load-bearing for WI-12's spectacle beats (request §34, §72).

## Forbidden Substitute Success

- A framework that only renders static sprites (no steering/spine/schools/behavior).
- Every creature forced through one rigid state machine that cannot express interesting behavior (request §19).
- Placeholder creatures that are all the same shape or all periodic sine-waves.

## Expected Project Knowledge Update

Note the spine-renderer API, the creature state vocabulary, and the sense/signal subscription API in a project note so WI-11 implements the roster on the same seams.

## Fresh-Session Handoff

Enter `item-implementer` mode for this exact work item. Read the task or story state from top to bottom, the project documentation, all passed gate artifacts, this work-item specification, and only then the listed source files.
