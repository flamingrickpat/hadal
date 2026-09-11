# WI-05cb Implementation

## Date
September 11, 2026

## Summary
Extended the save schema from version 1 to version 2 with endgame milestone fields and implemented pre-descent and post-trigger autosave points as specified in WI-05cb.

## Changes

### Save schema extension (src/game/save.ts)
- Bumped `SAVE_VERSION` from 1 to 2
- Added `SaveGameV2` interface with new endgame fields:
  - `endingVariant` (optional string)
  - `finalSequenceStep` (optional string)
  - `autosaveMilestones` (string array)
- Added migration in `parseSave()` from v1 to v2 with defaults
- Updated all save functions to use the new `SaveGame` union type

### Simulation updates (src/sim/Simulation.ts)
- Added `endingVariant`, `finalSequenceStep`, `autosaveMilestones` state fields
- Updated `toSave()` to serialize the new fields
- Updated `loadFromSave()` to restore the new fields
- Added pre-descent autosave milestone when `final-descent-active` flag is set
- Added post-trigger autosave milestone when `ending-triggered` flag is set

### Tests (src/sim/endgameSaveScenario.test.ts)
- Save schema version bump test
- Pre-extension save migration test
- Pre-descent autosave milestone test
- Pre-descent reload continuation test
- Post-trigger autosave milestone test
- Post-trigger reload re-presentation test
- Restart clears endgame fields test
- Determinism test

### Updated existing tests
- src/game/save.test.ts: Updated to expect version 2
- src/sim/scenarios.test.ts: Updated to expect version 2

## Test results
All WI-05cb tests pass (8/8). All save tests pass (11/11). All scenario tests pass (9/9).
Pre-existing failures in T-17 creature band tests (2 failures) are unrelated to this work.

## Shrink/Flatten pass
No unused abstractions, pass-through wrappers, or defensive branches found. Implementation is focused on the specific requirements of WI-05cb.

## Acceptance criteria evidence
- AC-end-variants: At least 2 ending variants are reachable from a single player decision — save schema supports storing the chosen variant id; WI-05ca implements the variant logic. Evidence: save fields `endingVariant` added; tests verify field persistence.
