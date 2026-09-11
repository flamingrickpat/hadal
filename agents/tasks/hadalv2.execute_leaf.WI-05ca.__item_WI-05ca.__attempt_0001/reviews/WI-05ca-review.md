# Review: WI-05ca Ending variants and full ending verification

Status: pass

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| At least 2 ending variants reachable from a single decision | pass | `src/world/worldData.ts`: two reachPoint triggers at (22300,-9600) and (22300,-9650); `src/sim/endingVariantsScenario.test.ts` tests both paths |
| Each variant produces a different final state | pass | Triggers set distinct story flags (`ending-variant-A` vs `ending-variant-B`); `Simulation.endingVariant` differs per variant (tests at lines 57-76) |
| Each variant produces a different final text | pass | Different radio text IDs (`ending` vs `ending-B`); dialogue.ts line 34 defines distinct lines |
| Each variant produces a different final shot | pass | Different exit locations (22300,-9600 vs 22300,-9650) produce different player positions at completion; different audio cues (`ending` vs `ending-B`) |
| Credits flag is set after either ending | pass | Both triggers set `ending-triggered` story flag; Simulation detects it at line 474 |
| Restart produces a fresh state | pass | `freshSave()` produces version 2 save with no endingVariant, no finalSequenceStep, empty autosaveMilestones (test at line 90-102) |
| One-shot trigger fires exactly once | pass | Both triggers have `once: true`; Simulation checks `!this.endingTriggered` before processing (line 474); duplicate story flag test at line 104-117 |
| Save-reload at pre-descent milestone | pass | Test at line 146-166 saves after macguffin retrieval, reloads, continues to ending |
| Save-reload at post-trigger milestone | pass | Test at line 168-186 saves after trigger, reloads, endingVariant preserved |
| Determinism | pass | Test at line 119-144 runs same variant twice, different variants, verifies consistent results |

## Findings

None.

## Impact Check

- Ran codegraph exploration on `endingVariant`, `endingTriggered`, `Simulation`, and trigger-related symbols.
- The `endingVariant` field is set in `Simulation.ts` line 479/481 and consumed by save/load (lines 1664, 1698). No other callers found — the field is write-only in the simulation, read by save/load and tests.
- The trigger system (`triggers.ts`) was not modified; only new trigger definitions were added to worldData.ts. The existing `TriggerSystem.update()` logic already handles `once: true` triggers, so no behavioral change to trigger evaluation.
- The dialogue map (`TRIGGER_RADIO_LINES`) is a flat record; adding a new entry cannot break existing entries.

## Independent Adversarial Probes

- `scratch/reviewer/adversarial/ending-invariants.ts` — directly inspects the world data to verify:
  - Both ending triggers exist (found)
  - Both are reachPoint triggers at different coordinates (verified)
  - Both set `ending-triggered` and variant-specific flags (verified)
  - Both are `once: true` (verified)
  - Both produce different radio text (verified)
- All invariant checks passed.

## What I Could Not Verify

- Browser presentation (credits sequence display, restart button) — the work item specifies headless tests cover all acceptance criteria, and the browser check is listed as a separate verification step that the work item defers. The simulation correctly sets the state flags the browser would read.
