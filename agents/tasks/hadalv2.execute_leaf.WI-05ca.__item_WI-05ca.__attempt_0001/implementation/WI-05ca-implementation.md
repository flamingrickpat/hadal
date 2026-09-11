# WI-05ca Implementation

## Goal
Implement at least 2 ending variants branched from a single player decision inside the final sequence, with one-shot trigger, credits flag, and restart; deliver the full headless ending verification as final proof owner.

## Approach
The ending variants are implemented as two different ending triggers at different locations inside the final sequence. The player faces a decision point at the exit of the hadal interior:
- **Variant A**: Swim to exit point (22300, -9600) — the canonical ending
- **Variant B**: Swim to exit point (22300, -9650) — the alternative ending

Each trigger sets a unique story flag (`ending-variant-A` or `ending-variant-B`) along with the shared `ending-triggered` flag. The simulation detects which variant was triggered and records it in `endingVariant`.

## Changes
1. **`src/world/worldData.ts`**: Added a second ending trigger (variant B) at (22300, -9650). Modified the existing ending trigger to set the `ending-variant-A` story flag.
2. **`src/sim/Simulation.ts`**: Added logic to detect which ending variant was triggered based on the story flags and record it in `endingVariant`.
3. **`src/content/dialogue.ts`**: Added a radio line for the ending-B variant.
4. **`src/sim/endingVariantsScenario.test.ts`**: Comprehensive headless scenario tests covering both variants, one-shot trigger, save-reload at milestones, and determinism.

## Evidence
- All 9 ending variant tests pass (fresh-save scenario, both variants, one-shot, save-reload, determinism).
- Existing endgame tests continue to pass (21/21).
- Full test suite: 340/342 pass (2 pre-existing failures unrelated to this work item).

## Acceptance Criteria
- [x] At least 2 ending variants are reachable from a single player decision
- [x] Each variant produces a different final state (story flag), text (radio line), and shot (different exit location)
- [x] One-shot trigger verified (ending fires exactly once)
- [x] Credits flag set after ending (ending-triggered story flag)
- [x] Restart clears all ending state (fresh save)
- [x] Save-reload at milestones works (pre-descent and post-trigger)
- [x] Determinism verified (same seed, same decision, same variant)

## Notes for Reviewer
- The decision point is a physical choice at the exit location (swim to exit A or exit B).
- No art or audio assets were added (text ids only, per WI-01c).
- One variant (B) is the section 72 cut candidate.
- Save schema extension (WI-05cb) already provided the `endingVariant` field.
- No new abstractions were introduced; the implementation extends the existing trigger system.

## Shrink/Flatten
- No unused extension points.
- No pass-through wrappers.
- No one-use interfaces or factories.
- No defensive branches that cannot fire.
- No comments that repeat code.
- No files with no independent reason to exist.
- The implementation is minimal: 2 triggers, variant detection logic, 1 radio line.

## Knowledge Notes
- Consulted WI-05b and WI-05cb implementation notes.
- Read existing endgame scenario tests for patterns.
