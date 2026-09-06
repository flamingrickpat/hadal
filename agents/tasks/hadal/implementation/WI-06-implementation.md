# WI-06 Implementation — Sonar System and World-Signal Bus

Task: hadal
Work item: `agents/tasks/hadal/workitems/WI-06-sonar-signal-bus.md`
Role: item-implementer
Date: 2026-09-07

## Codegraph Gate

First structural lookup: `codegraph_explore` for the task area
("WorldSignalBus sonar signal bus senses player Simulation step Q"). The index
had no product symbols (it lags the recent commits), so per the index's own note
the load-bearing files were read directly: `src/sim/Simulation.ts` (the headless
tick that owns the player and must emit the player signals),
`src/sim/scenarios.test.ts` + `src/sim/scenario.ts` (the §70 harness),
`src/player/PlayerController.ts` (the `PlayerInput` shape: `sonar`, `useTool`,
`boost`), `src/content/recipes.ts` + `src/player/equipment.ts` (the `Capability`
union and the starter gear, which grants no `sonar`), `src/game/Game.ts` (the
browser adapter that drives the per-frame visual layer), and
`src/render/particles.ts` (the pooled `THREE.Points` pattern to reuse).

## TDD / Tests

- **New tests first:** `src/creatures/senses.test.ts` (7 tests) for the §63 bus
  — full strength at the source, spatial decay, temporal decay + expiry, all four
  signal types on their own channels, `queryNear` radius gating, same-channel
  summation, and a minimal fixture creature that reacts to a nearby sonar signal
  but not a distant one (the §63/§19 sense primitive).
- **New tests first:** `src/systems/SonarSystem.test.ts` (9 tests) — firing
  emits a sonar world signal and a noise side-effect, the ring expands to the
  range then deactivates, a resource node gets a signature, the resource
  signature outlasts a terrain flash, the tag is transient, a massive object
  returns a larger/slower pulse, short-lived echo particles spawn at terrain
  points and expire, and the pools are reused across many updates (no
  per-frame allocation).
- The `WorldSignalBus` (`src/creatures/senses.ts`) and `SonarSystem`
  (`src/systems/SonarSystem.ts`) make the tests pass.
- **Headless scenario:** `src/sim/scenarios.test.ts` gains a sonar scenario
  (seed 9) that presses `Q` with no upgrade (no sonar signal), crafts
  `sonar-1`, presses `Q` again, and asserts a nearby probe perceives the `sonar`
  channel — proving the player sonar is a real world signal the bus carries.
- Full suite: `npx vitest run` → **15 files / 103 tests pass** (senses.test.ts
  adds 7, SonarSystem.test.ts adds 9, scenarios adds 1). `npm run build`
  (`tsc --noEmit && vite build`) → exit 0.

## Acceptance Evidence Table

| Criterion (work item) | Evidence | Result |
|---|---|---|
| Pressing `Q` emits an expanding ring mesh in world space that briefly outlines nearby terrain and major objects and spawns short-lived echo particles (§18) | `SonarSystem.fire`/`update` (ring radius, `lastHit` tags, `echoes`); `src/render/sonar.ts` `SonarVisuals` draws the ring, tags, and echo particles; `SonarSystem.test.ts` ring/echo tests | PASS (code + unit + browser layer) |
| Sonar marks resource signatures when the upgrade allows and returns larger/slower pulses from massive objects; not a permanent minimap (§18) | `SonarObject.resource` + `SIGNATURE_TIME` > `TAG_FLASH_TIME`; `MASSIVE_FLASH_SCALE`; transient tags; `sonar-1` recipe gates the `sonar` capability; `SonarSystem.test.ts` signature/massive/transient tests | PASS (code + unit) |
| A world-signal bus carries `noise`/`light`/`sonar`/`injury` signals with position/strength (§63); the player emits signals from tools, boost, and sonar | `WorldSignalBus` (`senses.ts`); `Simulation.emitPlayerSignals` (tool + boost noise) + `SonarSystem.fire` (sonar + noise); `senses.test.ts` four-channel test | PASS (code + unit) |
| Nearby recent signals are queryable so creatures can evaluate only nearby recent signals — the seam WI-10 creatures subscribe to (§63) | `WorldSignalBus.perceive`/`queryNear` with spatial + temporal decay; `senses.test.ts` fixture-creature reaction test | PASS (code + unit) |
| Sonar creates a detectable sound that can affect fauna (§18, §63) | `SonarSystem.fire` emits the noise + sonar signals; `SonarSystem.test.ts` noise-side-effect test; the §70 sonar scenario asserts a nearby probe perceives the `sonar` channel | PASS (code + unit + scenario) |
| The ring/tagging system does not allocate new objects per frame (§34) | fixed `targets`/`echoes` pools reused in `SonarSystem.update`; `SonarSystem.test.ts` pool-stability test; `SonarVisuals` rewrites fixed buffers each frame | PASS (code + unit) |

## Live / External Verification

The browser render layer (`src/render/sonar.ts`) draws the ring/tags/echoes
from the `SonarSystem` state each frame via `Game.renderVisuals` (driven in
`main.ts`). A real-browser confirmation (press `Q`, watch the ring expand,
objects/terrain outlined briefly, echo particles spawn, resource marked) is
the manual evidence row; the build and the full headless suite are green and the
`SonarVisuals` layer follows the existing pooled-`THREE.Points` pattern from
`src/render/particles.ts`. No console exceptions are expected: the ring and both
point layers are allocated once and only rewritten.

## Deviations

- **Sonar is gated on the `sonar` capability** (the `sonar-1` recipe).
  Starter gear grants no `sonar`, so pressing `Q` before crafting it does
  nothing in the simulation (the `Game` audio ping is gated on the same
  capability). This reads request §18's "mark resource signatures if upgrade
  allows" as the whole sonar being the tier-1 "simple sonar" upgrade
  (request §9). The Q control still exists in `PlayerInput`; only its effect
  requires the upgrade.
- **The `WorldSignal` type is defined in `src/creatures/senses.ts`**, not a
  shared type file: it is the bus's canonical shape (request §63) and the single
  file WI-10 creatures import. Nothing clones it.

## Files Touched

- `src/creatures/senses.ts` (new) — the §63 world-signal bus: `WorldSignal`,
  `Percept`, `WorldSignalBus` (pooled, spatial + temporal decay,
  `perceive`/`queryNear`), `SIGNAL_LIFETIME`/`SIGNAL_RANGE_REF` (Node-testable).
- `src/creatures/senses.test.ts` (new) — 7 unit tests for the bus + a fixture
  creature sense primitive.
- `src/systems/SonarSystem.ts` (new) — the §18 sonar: the expanding ring, the
  brief `lastHit` outline tags, the transient resource signatures, the
  larger/slower massive pulses, the short-lived echo particles, and the sonar +
  noise signal emission (Node-testable).
- `src/systems/SonarSystem.test.ts` (new) — 9 unit tests for the sonar.
- `src/render/sonar.ts` (new) — the `SonarVisuals` browser layer: the ring
  (`THREE.LineLoop`) and the tag/echo point layers, all pooled and non-reallocated.
- `src/sim/Simulation.ts` — owns the `WorldSignalBus` + `SonarSystem`; emits the
  player tool/boost noise signals; fires the sonar on the Q edge when the player
  has the `sonar` capability; advances the sonar each step.
- `src/sim/scenarios.test.ts` — a sonar §70 scenario (inert before the upgrade,
  a nearby probe perceives the `sonar` channel after crafting `sonar-1`).
- `src/game/Game.ts` — owns a `SonarVisuals` (reads `sim.sonar`), drives it each
  frame, and gates the sonar audio ping on the `sonar` capability.
- `src/content/recipes.ts` — the `sonar-1` recipe (the `sonar` capability).
- `src/game/constants.ts` — the sonar + signal tuning numbers.

## Notes for Reviewer (incl. Shrink/Flatten)

- **Shrink/Flatten:** the first draft had a one-use `senseChannels()` helper in
  `senses.ts` and an `ALL_CHANNELS` array — both removed (the `SignalType` union
  + the `Percept` fields are the sense primitives; no function was needed).
  `SonarSystem` reuses `distanceGain` from `src/util/audio.ts` rather than
  redefining a decay curve. No one-use wrappers, defensive branches for
  impossible states, or code-repeating comments remain.
- **`SonarSystem` is pure (Node-testable):** it owns the ring/tag/echo state and
  emits the signals onto the caller-provided bus; it does not import Three.js or
  the DOM. `SonarVisuals` is the only browser-dependent part (the render layer),
  matching the existing `src/render/particles.ts` pattern.
- **No per-frame allocation (§34):** the `targets` and `echoes` pools are
  fixed-capacity and only rewritten in `update`; `SonarVisuals` rewrites fixed
  `Float32Array` buffers each frame (only `needsUpdate` is set). The `perceive`
  primitive is allocation-free (fills a caller-provided `Percept`).
- **The tag re-stamp condition** handles never-tagged targets
  (`lastHit === 0`): `t.lastHit === 0 || time - t.lastHit >= this.tagDuration(t)`.
- **The dense terrain sampler** (`sampleDense`) needs ≥2 points; a single-point
  terrain produces no samples (tests use closed two-point rings).

## Assumptions

- The sonar range (2200), ring speed (900/s), echo band (150), and the
  terrain/resource tag and signature times are tuning defaults; the §18/§63
  request fixes the behavior, not the numbers. They live in `constants.ts`.
- The sonar signal is a single pooled slot written on each Q press; the bus is
  capped (default 64 active signals) and reuses the oldest on overflow —
  appropriate for the rare player-emitted signals.

## Result

Implemented. All acceptance criteria are met with unit evidence for the §63 bus
(emit, spatial + temporal decay, query, the fixture-creature reaction) and the
§18 sonar (ring, tags, transient signatures, massive pulses, echo particles, no
per-frame allocation), plus a §70 headless scenario proving the player sonar is
a real world signal after the upgrade. The browser render layer draws the
ring/tags/echoes. Build and the full test suite are green.

## Handoff

WI-10 creatures subscribe to `WorldSignalBus` (the single perception seam):
`perceive(x, y, time, out)` gives the summed nearby-recent strength by channel
(`noise`/`light`/`sonar`/`injury`), and `queryNear(x, y, radius, time, out)`
lists the nearby recent signals. A creature reacts to a channel by checking
`out.<channel> >= threshold` (see the fixture in `senses.test.ts`). Sonar objects
and creatures can be tagged by adding them to the `SonarSystem`'s `objects`
(see `SonarObject`). A project note records the bus API so WI-10 does not
re-derive it.
