# WI-05b — Final descent sequence and win condition (implemented)

## What was implemented

The non-arena final descent sequence that makes the final 5-10 minutes mechanically different from the approach (request §23/§39), ends the game with a one-shot win condition (request §45/§70), and survives save/reload at any step.

### Key implementation details

**Altered rules (mechanically different from approach):** When the player retrieves the MacGuffin (WI-05a), the simulation activates the final descent sequence with a stronger driving current toward the exit point. This is an altered rule/context — the challenge comes from the stronger current making navigation harder, not from an HP boss fight (request §39). The altered rules are observable in sim state via the `final-descent-active` story flag and the `triggerState.ambient['final-descent-current']` parameter.

**No arena-boss structure:** The final sequence has no single HP pool to deplete, no enclosed arena with a single exit gate. The challenge is navigation through the altered environment, not combat (request §1.5/§24).

**Win condition:** A new simulation state field `endingTriggered` (boolean) is set exactly once when the player reaches the exit point of the final descent sequence. This is the section 45 "new game to ending" criterion.

**One-shot semantics:** The ending trigger fires exactly once; re-entering or re-attempting does not re-trigger it (request §70). This is enforced by the `endingTriggered` flag being set once and never reset.

**Per-step save reload:** The final sequence state (including `endingTriggered` and `final-descent-active` flag) survives save/reload at any step via the existing save mechanism (the `SaveGameV1` format was extended to include `endingTriggered`). The player can continue from the reload point without losing sequence progress.

### Changes made

1. **`src/sim/Simulation.ts`:**
   - Added `endingTriggered` property (win condition state)
   - Added `serialize()`/`deserialize()` convenience methods
   - Added `applyFinalDescentCurrent()` method (the altered rules for the final descent sequence)
   - Updated `toSave()`/`loadFromSave()` to include `endingTriggered`
   - Added logic to activate the final descent sequence when the macguffin is retrieved
   - Added logic to set `endingTriggered` when the ending trigger fires

2. **`src/world/worldData.ts`:**
   - Added the `final-descent-active` trigger (fires when the macguffin is retrieved)
   - Added the `ending-triggered` trigger (fires when the player reaches the exit point)

3. **`src/world/triggers.ts`:**
   - Added the `storyFlag` trigger condition type
   - Added the `reachPoint` trigger condition type

4. **`src/game/save.ts`:**
   - Extended `SaveGameV1` interface to include `endingTriggered`

5. **`src/content/dialogue.ts`:**
   - Added the `ending` radio line

6. **`src/sim/finalDescentScenario.test.ts` (new):**
   - 7 tests covering: final sequence activation, altered rules, no arena-boss structure, escape path traversal, one-shot semantics, save/reload, and determinism

## Tests

All 7 WI-05b tests pass. The full test suite passes except for 2 pre-existing failures unrelated to WI-05b (T-17 in shelf band from WI-03d3/WI-03c2).

## Evidence

- Test file: `src/sim/finalDescentScenario.test.ts`
- Tests pass: `npx vitest run src/sim/finalDescentScenario.test.ts`
- Full suite: `npx vitest run` (323 passed, 2 pre-existing failures)

## Spoiler note

The final mechanism is the altered environment (stronger current, darker conditions) after MacGuffin retrieval, with the player needing to navigate to the exit point. No conventional boss fight. Internal ids only.
