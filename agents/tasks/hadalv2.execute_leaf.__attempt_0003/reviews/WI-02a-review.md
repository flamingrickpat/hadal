# Review: WI-02a — Headless creature simulation core

Status: pass

Date: 2026-09-08
Role: work-item-reviewer
Commit reviewed: `4091ed6` (`[sim][creature] add headless creature runtime advanced on the fixed step`)

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| `CreatureDef` schema per §19 (id, body, movement, senses, behavior, combat?, ecology?, audio) | passed | `src/creatures/CreatureDef.ts:131-140` — verbatim shape, plain data; `audio` is a state→call-name map emitted as data (`Simulation.creatureAudioEvents`), never synthesized here |
| Sense primitives per §19/§63: creatures subscribe to `WorldSignalBus`, evaluate only nearby recent signals, never reference the player directly | passed | `Creature.update` uses `focus` only for the throttling distance (Creature.ts:122-127); all perception goes through `bus.perceive`/`queryNear`. `senses.ts` is pre-existing, player-independent, unmodified in this commit. Reviewer probe confirmed decay is by distance, age, and expiry (see probes below). Note: the bus's spatial term is a soft `distanceGain` falloff (≈0.11 at 2×REF), not a hard cutoff — this is the pre-existing bus behavior, not part of this commit |
| Generic state machine with all 11 states + documented bespoke hook | passed | `DEFAULT_TRANSITIONS` + `canTransition` (Creature.ts:42-60); `CreatureController` hook documented in CreatureDef.ts:78-100 and exercised by the controller (Creature.ts:131-137) |
| Movement with drag model matching §6 | passed | `steering.ts:34-36` `v *= exp(-dragRate*dt)` — identical to `PlayerController.update` (PlayerController.ts:85-87) |
| Collision via existing system (circles; chain circles for long bodies) | passed | `Simulation.stepCreatures` (Simulation.ts:268-277) calls `terrain.resolveCircle` for the root and every chain circle — the real shared terrain resolver, not a parallel system |
| Offscreen throttling: AI deactivates beyond a world distance cap (§34), world units not screen edges (§16) | passed | `CREATURE_AI_RANGE = 3000` (constants.ts); Creature.ts:123-127 deactivates by world distance to focus; reviewer probe confirmed an out-of-range creature does not even perceive a signal at its own position; reactivation test in `Creature.test.ts:177` |
| Two neutral placeholder organisms, clearly marked test fixtures | passed | `fixtures.ts` — `fixture-schooler` (schooling, `ecology.school=true`, no combat) and `fixture-forager` (chain circles, no combat); scenario test asserts the registry has exactly these two |
| Node unit tests: steering, senses, state machine, throttling — real functions, no mocks | passed | `steering.test.ts` (8), `Creature.test.ts` (11), `creatureScenario.test.ts` (2); all call real `Creature`, `steer*`, `WorldSignalBus`, `Terrain.resolveCircle`, production `Simulation` via the existing `Scenario` harness |
| Short node scenario: a test organism reacts to a bus signal | passed | `creatureScenario.test.ts:42-68` — production `Simulation` via `Scenario`; `useTool` emits a real `noise` signal (`Simulation.emitPlayerSignals`, Simulation.ts:370-372); schoolers go `wander`→`investigate`, emit the `schooler-attention` audio event, and measurably close distance to the player over 6 s |
| No rendering; pure simulation state | passed | No renderer, DOM, or scene references in `src/creatures/*`; only sim state is touched |

## Findings

None blocking. Observations:

1. (observation) The `light` channel has no dedicated unit test — noise, sonar, and injury each have one, but light shares the identical `attention`/`reacted` code path in `genericReact` (Creature.ts:165-173) and the threshold plumbing is per-channel symmetric. Not a defect: nothing distinguishes light's handling from the tested channels, and the scenario exercises the full bus pipeline. Logged so a later task (roster content) adds a light case when a species actually needs it.
2. (observation) `buildTriggerContext().creatureState` (Simulation.ts:358) went from `() => null` to live state. Impact checked: no authored trigger in `worldData.ts` uses the `creatureState` condition (only `reachDepth` triggers exist), and `triggers.test.ts` supplies its own context — so the change is additive with zero behavioral effect on existing content.

## Impact Check

- `codegraph_explore` on `emitPlayerSignals`/`TOOL_NOISE_STRENGTH` — the scenario's signal path is the real player-tool emission, not a test double.
- `codegraph_explore` on `TriggerContext`/`creatureState` consumers — `conditionMet` (triggers.ts:113-114) is the only consumer; no authored data triggers it yet (grep over `src/world/*.ts` confirms only type/test references).
- `codegraph_explore` on `PlayerController.update` — drag model verified identical to the creature's.
- Commit `4091ed6` covers exactly this work item: 6 new product files + 3 new tests + `Simulation.ts` (+62) + `constants.ts` (+5) + comment-only `chunks.ts`, plus the implementer's artifacts and one project note. No `state.md`, no out-of-scope files.

## Independent Adversarial Probes

Run from the repo root (scratch, disposable, not committed to product paths):

`npx vitest run -c agents/tasks/hadalv2.execute_leaf.__attempt_0003/scratch/work-item-reviewer/probes/vitest.config.mts`
→ `Test Files 1 passed, Tests 3 passed` (probe: `.../probes/reviewer-probes.test.ts`)

1. **Bus decay is real, not a flat within-range percept.** Emitted one noise signal, perceived at 100/750/3000 units and at ages 0/2.5/3.5 s: monotonic distance decay, age decay, exact expiry at `SIGNAL_LIFETIME`. Falsifiable if the bus returned a constant strength inside some radius — it doesn't. Note: my first probe wrongly assumed a hard cutoff at 2×REF; the actual 0.111 at 3000 units is the pre-existing `distanceGain` soft falloff (verified against `senses.ts:100-104`), so I corrected the probe threshold rather than flagging product code.
2. **Bespoke controllers are genuinely exempt.** A controller forcing `wander`→`attack` (illegal in `DEFAULT_TRANSITIONS`, confirmed `canTransition === false`) succeeds and the transition is recorded in `lastTransition` for audio. Falsifiable if the generic machine vetoes bespoke states — it doesn't, by documented design.
3. **Out-of-range creatures are fully inert.** A creature 10000 units from focus, with a strength-1 signal at its own position, stays `active=false`, `percept.noise=0`, and its start state — it neither senses nor moves. Falsifiable if deactivation skipped the percept — it short-circuits before `bus.perceive`.

## What I Could Not Verify

- Live browser rendering of creature audio events — out of scope by design (this item is pure simulation; the audio events are data for the browser adapter, which is a later item's consumption concern).
- Long-term behavioral tuning (investigate dwell, flee settle times) — these are starting constants, not acceptance criteria; they are testable but not pinned by the spec.

## Assumptions

- "Sufficient bus" assumption in the spec: confirmed true. The §63 bus defines exactly four channels (noise, light, sonar, injury); §19's "distance vision", "motion", and "line of sight" are not separate bus types — they map to the perceived-strength thresholds and `queryNear` radius already present. The spec's own fallback ("extend senses.ts rather than a parallel bus") was not needed, and no parallel bus was added.
- `CREATURE_AI_RANGE = 3000` world units: the spec names no number; 3000 is recorded in the implementer's assumptions and keeps the greybox world's fixtures reachable while the scenario exercises the cap at ~4325 units. Reasonable and test-visible; rejected alternatives (e.g. a screen-constant) violate §16.
