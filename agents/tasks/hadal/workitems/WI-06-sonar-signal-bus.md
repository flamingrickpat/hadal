# WI-06: Sonar system and world-signal bus

## Identity

- Task: hadal
- Story: implicit
- Owner role: `item-implementer`
- Complexity: medium
- Dependencies: WI-04, WI-05

## Goal

Implement the `Q` sonar (expanding ring, echo tagging, echo particles, resource signatures, larger pulses from massive objects, noise side-effect) and the world-signal bus (`noise`/`light`/`sonar`/`injury`) that creatures will subscribe to, so sonar is both a utility and a horror mechanism and perception is a real event system.

## Vision Link

Request §18 (sonar as utility + horror; expanding ring, `lastSonarHitTime`, outline/echo flash, echo particles, resource signatures, larger pulses from massive objects; not a permanent minimap cheat), §63 (world-signal event bus with `noise`/`light`/`sonar`/`injury`), §19 (senses primitives), §34 (no per-frame allocation). §45/§72 treat sonar as never-cut.

## Acceptance Criteria

- [ ] Pressing `Q` emits an expanding ring mesh in world space that briefly outlines nearby terrain and major objects and spawns short-lived echo particles (request §18).
- [ ] Sonar marks resource signatures when the upgrade allows and returns larger/slower pulses from massive objects (request §18); it is not a permanent minimap (request §18).
- [ ] A world-signal bus carries `noise`, `light`, `sonar`, and `injury` signals with position/strength (request §63); the player emits signals from tools, boost, and sonar.
- [ ] Nearby recent signals are queryable so creatures can evaluate only nearby recent signals (request §63) — the seam WI-10 creatures subscribe to.
- [ ] Sonar creates a detectable sound that can affect fauna (request §18, §63).
- [ ] The ring/tagging system does not allocate new objects per frame (request §34).

## Required Evidence

| Criterion | Evidence type | Command or artifact |
|---|---|---|
| Expanding ring + outline + echo particles | manual (browser) | press `Q`; ring expands, objects/terrain outlined briefly, echo particles spawn |
| Resource signatures + massive pulses | manual (browser) | sonar marks resources (with upgrade) and shows larger pulses from large objects |
| World-signal bus | workflow (code + review) + automated | `src/creatures/senses.ts` / `src/systems/` bus exposes the four signal types; a Vitest test asserts a signal is emitted/queryable nearby and decays |
| Sonar affects fauna (seam) | workflow (code + review) | a test fixture creature/subscriber reacts to a nearby `sonar` signal |

## Tests To Write First

- A Vitest test for the signal bus: emit a `noise`/`sonar` signal, query nearby recent signals, assert spatial + temporal decay (request §63).

## Live Or External Verification

In a real desktop browser: press `Q` and confirm the ring, echo flash, echo particles, resource marking, and that the signal bus receives the emitted `sonar` signal.

## Infrastructure Required

- Start: `npm run dev`
- Restart: re-run `npm run dev`
- Health: `Q` sonar works; signal bus emits/queries; no console exceptions
- Timeout: n/a
- Endpoint or MCP: none

## File Pointers

- `src/systems/SonarSystem.ts` (request §18), `src/creatures/senses.ts` (world-signal bus + sense primitives, request §63, §19), `src/systems/` (signal emission from player tools/boost)
- request §18, §19, §34, §63

## Architecture And Integration Constraints

New files, L1 + archetype:

- `src/systems/SonarSystem.ts` — `emits — sonar rings, echoes, and the sonar world signal`; service-provider.
- `src/creatures/senses.ts` — `carries — the world-signal bus and sense primitives creatures subscribe to`; information-holder (the §63 bus).

Constraints: the signal bus is the single perception seam (ARCHITECTURE.md "Perception"); creatures in WI-10 subscribe to it rather than referencing the player directly (request §63). Reuse the §63 `WorldSignal` type (never clone it). Sonar is a never-cut capability (request §72).

## Forbidden Substitute Success

- A permanent minimap/sonar overlay (request §18 forbids it).
- A sonar "ring" that is a static sprite with no echo/tagging.
- A signal bus that creatures cannot actually query (a decorative emitter).

## Expected Project Knowledge Update

Note the signal-bus API (signal types, decay, query) in a project note so WI-10 creature senses reuse it without re-derivation.

## Fresh-Session Handoff

Enter `item-implementer` mode for this exact work item. Read the task or story state from top to bottom, the project documentation, all passed gate artifacts, this work-item specification, and only then the listed source files.
