# Review: WI-06d-b5 — Parting schools

Status: pass

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| AC-art-geometry: parting schools juice effect present | pass | `src/render/schoolSplit.ts` implements split parameters (proximity radius 300u, spread 80u, re-form time 0.5s) and state classification; integrated into `src/render/creatureRender.ts` via split offset in `stepVisual` |
| AC-juice-schools: split state toggles on entering/leaving proximity | pass | Node scenario test "split state toggles on entering and leaving proximity during simulation" in `src/render/schoolSplitScenario.test.ts` passes; verified by running `npx vitest run src/render/schoolSplitScenario.test.ts` (all 9 scenario tests pass) |
| AC-juice-schools: steering outcomes unchanged (render-only) | pass | Node scenario test "sim positions/velocities are identical with and without split logic active" passes — runs same simulation twice (once with split offsets computed but not applied), compares bit-identical positions/velocities; verified by running the test suite |
| Build stays green | pass | `npm run build` exits with errors only in pre-existing files unrelated to this work item (lighting.test.ts, tier4Render.test.ts, Simulation.ts, etc.); the files changed by this work item (schoolSplit.ts, creatureRender.ts, Game.ts, schoolSplit.test.ts, schoolSplitScenario.test.ts) produce no build errors |
| Headless suite stays green | pass | `npx vitest run` — 428 passed, 2 failed (both pre-existing T-17 spawn band failures in rosterFinalProof.test.ts and tier3Scenario.test.ts, unrelated to school split); all 21 school split tests pass (12 unit + 9 scenario) |

## Findings

None.

## Impact Check

- Ran `codegraph_explore` on "school split render creature renderer" — confirmed the split logic is in `src/render/schoolSplit.ts` (data module) and integrated into `src/render/creatureRender.ts` (split tracking per schooling creature).
- Ran `codegraph_explore` on "CreatureRenderer update method signature split" — confirmed the `update` method now accepts an optional `playerPos` parameter; the only caller is `Game.ts` (line 195), which passes `this.sim.player.position`.
- Checked callers of `CreatureRenderer.update` via grep — only `Game.ts` calls it in product code; existing render tests call it without the player position parameter (it's optional), and all 29 creature render tests pass.
- The split state tracking (`SplitTrack` interface) is internal to `CreatureRenderer` and does not expose new public API.

## Independent Adversarial Probes

- Ran `npx vitest run src/render/schoolSplit.test.ts src/render/schoolSplitScenario.test.ts` — 21 tests pass, including the key scenario test that proves steering outcomes are bit-identical with and without split logic active.
- Ran `npx vitest run src/render/creatureRender.test.ts src/render/tier3Render.test.ts src/render/tier4Render.test.ts` — 29 tests pass, confirming the split logic change doesn't break existing render tests.
- Inspected the split offset computation in `schoolSplit.ts`: it pushes members away from the player proportional to proximity (stronger when closer), with fade-out during reforming. The offset is never applied to the simulated position — only to the render position in `stepVisual` (line 499-500).

## What I Could Not Verify

- Browser clip or screenshot of a school parting around the player: the work item spec states that WI-06d-b6 owns the final proof of the six-effect browser union, so this work item does not need to provide it. The Node scenario tests are the designated verification for this work item.
