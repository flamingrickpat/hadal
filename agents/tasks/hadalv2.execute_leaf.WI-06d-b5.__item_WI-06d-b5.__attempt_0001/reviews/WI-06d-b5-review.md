# Review: WI-06d-b5 — Parting schools

Status: findings

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| AC-art-geometry: section 48 juice list present (parting schools) | pass | src/render/schoolSplit.ts with split parameters and classification logic; integrated into src/render/creatureRender.ts via splitOffset/splitState |
| AC-juice-schools: split state toggles on entering/leaving proximity | pass | Node scenario test "split state toggles on entering and leaving proximity during simulation" passes; verified manually by re-running tests |
| AC-juice-schools: steering outcomes unchanged | pass | Node scenario test "sim positions/velocities are identical with and without split logic active" passes — runs same simulation input twice, computes split offsets without applying, compares positions/velocities to within 1e-6 |
| Build stays green | findings | `npm run build` (tsc --noEmit) fails on src/render/schoolSplit.test.ts: imports `WORLD_SIGNAL_LIFETIME` which doesn't exist in ../creatures/senses (should be `SIGNAL_LIFETIME`). The import is also unused. |
| Headless suite stays green | pass | `npx vitest run` — 428 passed, 2 existing failures (T-17 band placement in rosterFinalProof.test.ts and tier3Scenario.test.ts) unrelated to this work item |

## Findings

1. **Unused incorrect import in schoolSplit.test.ts (build-breaker)** — `src/render/schoolSplit.test.ts:13` imports `WORLD_SIGNAL_LIFETIME` from `../creatures/senses`, but that export does not exist (the module exports `SIGNAL_LIFETIME`). The import is also unused in the test body. This causes the TypeScript build (`tsc --noEmit` step of `npm run build`) to fail with error TS2724. The vitest tests pass because vitest uses a different compilation path, but the build criterion requires the full build to be green. Fix: remove the unused import or rename to `SIGNAL_LIFETIME` if it's actually needed.

## Impact Check

- Ran `codegraph_codegraph_explore` on `CreatureRenderer.update` caller path: confirmed `Game.ts` now passes `this.sim.player.position` as the player position parameter to `CreatureRenderer.update`, which routes through to `stepVisual` where the split offset is computed and applied to the rendered group position only.
- Inspected `stepVisual` (src/render/creatureRender.ts:423-577): the split offset is applied at lines 499-500 by adding `splitOffX`/`splitOffY` to the visual group position; the simulated position and velocity are never modified. The `splitTracks` map (per-creature render-only state) is maintained separately from the Creature objects.
- Verified the split logic is gated on `isSchooler && playerPos !== null` (line 450), so only schooling creatures within proximity are affected.

## Independent Adversarial Probes

- Re-ran the two split test files: `npx vitest run src/render/schoolSplitScenario.test.ts src/render/schoolSplit.test.ts` — all 21 tests pass (12 unit + 9 scenario).
- Ran the full test suite: `npx vitest run` — 428 passed, 2 pre-existing failures unrelated to this work item.
- Ran the TypeScript build: `npm run build` — fails with 55 errors, including the unused import in schoolSplit.test.ts. The other errors (private property access in lighting.test.ts, node type imports, etc.) are pre-existing across the repo.

## What I Could Not Verify

- Browser clip/screenshot of a school parting around the player: the work item specification explicitly states that the final proof owner of the AC-art-geometry juice-part browser union is WI-06d-b6, and this work item does not re-assert the six-effect union. The work item result note confirms no live verification was done for this criterion here. This is correct per the specification.
