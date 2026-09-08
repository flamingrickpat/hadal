# WI-02a — Headless creature simulation core — implementation result

Date: 2026-09-08
Role: implementer
Status: **done**

## Result

One-line: the headless creature runtime (definition schema, steering, `WorldSignalBus`
sense subscription, generic state machine, bespoke controller hook, offscreen
throttling, chain-circle collision, audio-as-data) is implemented under
`src/creatures/` and advanced by `Simulation.step` on the fixed timestep, with 21
node tests (all passing) and a live node scenario where test organisms react to bus
signals.

## Tests (TDD evidence)

Sequence: tests written first against stubs, confirmed failing, then implemented.

- Red (skeletons in place): `npx vitest run src/creatures/steering.test.ts
  src/creatures/Creature.test.ts src/sim/creatureScenario.test.ts` →
  `Tests  15 failed | 6 passed (21)` — all 15 failures on the no-op stubs
  (steer no-ops, no state transitions, no creature resolution), i.e. failing for
  the intended behavioral reasons.
- Green (after implementation + Shrink/Flatten): same command → all pass;
  full suite `npx vitest run` → `Test Files  22 passed (22)`, `Tests  156 passed
  (156)` (21 new tests, no regressions).
- Build: `npm run build` (`tsc --noEmit && vite build`) → clean, no new warnings
  beyond the pre-existing chunk-size notice.

No mocks of the rules: tests call the real `Creature`, real `steer*` functions,
real `WorldSignalBus`, real `Terrain.resolveCircle`, and the production
`Simulation` through the existing `Scenario` harness.

## Acceptance Evidence

| Criterion | Evidence | Status |
|---|---|---|
| Steering: desired-velocity vs drag | `src/creatures/steering.test.ts` — acceleration holds the `maxSpeed` cap, drag decays to a stop, `settle` is drag-to-stop; drag model `v *= exp(-dragRate*dt)` matches `PlayerController.update` (request §6) | passed |
| Steering: boundary/terrain avoidance through real collision | `src/creatures/steering.test.ts` — a creature steered into a built `Terrain` wall is pushed out by `terrain.resolveCircle`; a long body (chain circles) is resolved along its tail circle | passed |
| Senses: each channel fires the right transition for the right strength/distance | `src/creatures/Creature.test.ts` — injury (predator→alert, prey→flee), noise/light/sonar (non-predator→investigate, predator→alert), below-threshold signals ignored, unsubscribed channels ignored, signals beyond `range` ignored | passed |
| State machine: legal transitions | `canTransition`/`DEFAULT_TRANSITIONS` tested; a fleeing creature stops fleeing once signals fade (`return` → home → start state) | passed |
| State machine: bespoke controller override | a `behavior.controller` sets `custom` where the generic engine would say `investigate` | passed |
| Offscreen throttling: beyond cap does not tick | creature > `CREATURE_AI_RANGE` (3000 world units) sets `active=false`; a loud signal does not wake it; position frozen | passed |
| Offscreen throttling: reactivation on approach | in-range focus tick reactivates and moves the creature | passed |
| Live node scenario: organism reacts to a bus signal | `src/sim/creatureScenario.test.ts` — production `Simulation` via `Scenario`: schoolers near the player leave `wander` → `investigate` after a tool-noise signal and move toward it; a far forager is AI-deactivated until the player approaches | passed |
| Audio as data (request §19) | `Simulation.creatureAudioEvents` populated from `lastTransition` + `def.audio`; scenario asserts the `schooler-attention` call appears with the right creature id and state | passed |

Live verification: **passed** (node scenario tests are the live checks for this
headless item; there is no UI, so no browser evidence applies).

## Files touched

New:
- `src/creatures/CreatureDef.ts` — `CreatureDef` schema (id, body, movement,
  senses, behavior, combat?, ecology?, audio) per request §19.
- `src/creatures/Creature.ts` — `Creature` runtime, `DEFAULT_TRANSITIONS`,
  `canTransition`, `CreatureAudioEvent`.
- `src/creatures/steering.ts` — `steerVelocity`, `settle`, `steerToward`,
  `steerAway`.
- `src/creatures/fixtures.ts` — `SCHOOLER`, `FORAGER`, `CREATURE_BY_ID`
  (two neutral placeholders, id-prefixed `fixture-`, marked test scaffolding).
- `src/creatures/steering.test.ts`, `src/creatures/Creature.test.ts`,
  `src/sim/creatureScenario.test.ts`.

Modified:
- `src/game/constants.ts` — `CREATURE_AI_RANGE = 3000` (world-unit cap,
  request §34/§16).
- `src/sim/Simulation.ts` — imports; `creatures` + `creatureAudioEvents`
  fields; constructor resolves `chunk.creatureSpawns` (throws on unknown id,
  request §32); `step()` calls `stepCreatures(dt)` after sonar; new
  `stepCreatures` (update → root+chain-circle collision → audio drain);
  `buildTriggerContext().creatureState` returns live creature state.
- `src/world/chunks.ts` — comment-only fix on `CreatureSpawnDef` (no longer
  "resolve in WI-10"; the simulation resolves them now).

## Shrink/Flatten report

Removed:
- Two identical steer case-groups in `Creature.steer` merged into one
  (wander/forage/investigate/alert/stalk/attack/return all steer to `target`) —
  duplicated branches with no semantic difference.
- Module-level shared scratch vectors in `steering.ts` (`scratchDesired`,
  `ZERO`) replaced by small local `vec2` allocations — the scratch carried a
  re-entrancy assumption (one steer call per creature per step) that a bespoke
  controller hook could break; one tiny allocation per steer call matches the
  codebase's ordinary style and the cost is negligible. The `L2` invariant in
  `steering.ts` was updated to match.
Nothing else removable: every file has a distinct reason to exist (schema /
runtime / motion / fixtures), and there are no pass-through wrappers,
one-use interfaces, or defensive branches for impossible states —
`noUncheckedIndexedAccess` null checks (`sig !== undefined`) are required by
the tsconfig, not defensive noise.

## Deviations / notes for reviewer

- Test-assertion corrections during the red→green cycle (code was right, tests
  wrong): the chain-circle wall bound (resolve snaps exactly to
  `500 − radius`), `toBeFinite` → `Number.isFinite` (Chai has no such matcher),
  and the post-flee settle state — a `return` lands in the def's `startState`
  (`forage` for the forager), not `wander`.
- `interact` state: the generic engine has no `interact` behavior (holding
  position); it exists in the schema and transition table for bespoke
  controllers and companion work items. `flee → return` is the only legal flee
  exit, matching "flee until the threat fades or you're out of range."
- `buildTriggerContext().creatureState` now returns live state — this changes
  a stub to real data (additive; trigger conditions that used it get a real
  value instead of `null`).
- No new dependencies.
- The `SimWorld` interface has no top-level `creatureSpawns`; spawns are
  per-chunk (`WorldChunkDef.creatureSpawns`), so the scenario test injects
  them onto `GREYBOX_WORLD` chunk[0] via a small `worldWithSpawns` helper.

## Assumptions

- The existing `WorldSignalBus` API is sufficient (spec assumption): confirmed,
  not falsified — the bus is player-independent (`emit`, `update`, `perceive`,
  `queryNear` take positions only), so no `senses.ts` extension was needed.
- `CREATURE_AI_RANGE = 3000` world units is the offscreen cap value (the spec
  says "a world distance cap" without a number; 3000 keeps fixtures and
  scenario spawns inside the greybox world while still exercising the cap at
  ~4500,3000).
- Behavior tuning constants (investigate dwell 10 s, flee settle 2 s, stalk
  give-up 15 s, etc.) are starting values in `Creature.ts`; they are testable
  now and tunable later without schema changes.

## Knowledge notes

- Consulted: `agents/projects/hadal/notes/20260907-implementer-wi06-sonar-signal-bus.md`
  (bus API), `20260905-implementer-wi02-world-seams.md` (world seams).
- Written: `agents/projects/hadal/notes/20260908-implementer-wi02a-creature-runtime-seams.md`.
