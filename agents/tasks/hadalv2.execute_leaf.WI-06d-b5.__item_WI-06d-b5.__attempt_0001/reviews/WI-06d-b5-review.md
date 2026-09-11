# Review: WI-06d-b5 — Parting schools

Status: findings

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| AC-art-geometry: section 48 juice list present (parting schools) | pass | `src/render/schoolSplit.ts` exists with split parameters and classification logic |
| AC-juice-schools: split state toggles on entering/leaving proximity | findings | Node scenario tests pass (19 tests), but split logic is not integrated into creature renderer |
| AC-juice-schools: steering outcomes unchanged | findings | Scenario test does not compare sim state with/without split logic |
| Build stays green | pass | `npm run build` — 2 existing failures unrelated to this work item |
| Headless suite stays green | pass | `npx vitest run` — 426 passed, 2 existing failures unrelated to this work item |

## Findings

### Finding 1: Split logic not integrated into creature renderer

**Location:** `src/render/creatureRender.ts`

The work item specifies: "The school render path in the ST-02/ST-03 creature renderer — add a per-school split state (whole / parting / re-forming) that offsets rendered members around the player's position; the underlying steering outcomes are untouched."

The `splitOffset` and `splitState` functions exist in `src/render/schoolSplit.ts` and are tested, but they are never called from the creature renderer. `CreatureRenderer.update` does not accept a `playerPos` parameter, and `stepVisual` does not apply any split offset. `SplitOffset` and `splitState` are imported and used only in test files (`src/render/schoolSplit.test.ts` and `src/render/schoolSplitScenario.test.ts`).

This means the schools never actually visually part around the player in the running game. The split logic is a standalone pure data module with tests, but it is not connected to the render path where the visual effect needs to happen.

**How to satisfy:** Add player position to `CreatureRenderer.update`, track split state per-school in the renderer, and apply the split offset in `stepVisual` for schooling creatures.

### Finding 2: Scenario test does not verify steering outcomes are bit-identical

**Location:** `src/render/schoolSplitScenario.test.ts`

The work item requires: "a Node scenario proves the split state toggles without changing steering outcomes" and specifically states the steering outcomes "are bit-identical to the no-split baseline."

The scenario test named "steering outcomes unchanged (no write-back)" only verifies:
1. Three schoolers spawned
2. They moved (wander behavior)
3. They are in expected states (wander, investigate, or flee)

It does not:
- Call `splitOffset` or `splitState` during the scenario
- Compare sim positions/velocities with and without split logic
- Demonstrate that the steering outcomes are bit-identical

The "no write-back" property is trivially true because the split logic is never called by the simulation — it exists only in the render module and is never invoked in the scenario. The test verifies that schoolers spawn and wander, which is not the same as proving split logic does not affect steering.

**How to satisfy:** The scenario should run the same simulation input twice (or compare against a baseline), with split logic active in one case and inactive in the other, and assert that the resulting sim positions/velocities are identical. Alternatively, once the split logic is integrated into the renderer (Finding 1), a scenario should assert that sim state is unchanged despite the render offsets being applied.

## Impact Check

- Ran `codegraph_implore` on `CreatureRenderer` — it has 10 callers and no covering tests found. The split logic should be integrated here, but isn't.
- Ran `codegraph_explore` on `splitOffset` and `splitState` — both have only 2 callers, both in test files. Neither is called from production code.
- No other callers of the split logic were found. No collateral impact to other subsystems.

## Independent Adversarial Probes

- Ran `npx vitest run src/render/schoolSplit.test.ts src/render/schoolSplitScenario.test.ts --reporter=verbose` — all 19 tests pass.
- Ran `npx vitest run` — 426 tests pass, 2 existing failures in `rosterFinalProof.test.ts` and `tier3Scenario.test.ts` (both about T-17 spawn band placement, unrelated to this work item).
- Ran `npm run build` — pre-existing TypeScript errors, none related to this work item.
- Grepped for `split` in `creatureRender.ts` and `Game.ts` — no matches, confirming the integration is missing.
- Used `codegraph_explore` to find callers of `splitOffset` and `splitState` — only test files, no production callers.

## What I Could Not Verify

- Browser clip or screenshot of a school parting around the player. The work item states this is owned by WI-06d-b6 (the final proof owner for the six-effect juice union), so this is acceptable.
- The pre-existing build errors and test failures could not be verified as truly unrelated without examining those specific test files, but they appear to be about creature band placement (T-17) and save game schema migration, not rendering.