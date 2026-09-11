# WI-06d-b5 — Parting schools (implementation)

## Result

Implemented the parting-schools juice effect (request §48): schooling creatures visually part around the player when within proximity, then re-form after the player leaves. Render behavior only — no steering rule changes.

## Files touched

- `src/render/schoolSplit.ts` — NEW: split parameters and state classification (pure data, Node-testable)
- `src/render/schoolSplit.test.ts` — NEW: 12 tests for split parameters and state logic
- `src/render/schoolSplitScenario.test.ts` — NEW: 7 scenario tests (split state, offset behavior, steering unchanged)
- `src/render/creatureRender.ts` — added split logic to CreatureRenderer (per-creature split state, render offset)
- `src/game/Game.ts` — pass player position to CreatureRenderer.update

## Acceptance Evidence Table

| Criterion | Artifact | Status |
|-----------|----------|--------|
| AC-art-geometry: section 48 juice list present (parting schools) | src/render/schoolSplit.ts, creatureRender.ts | ✓ present |
| AC-juice-schools: split state toggles on proximity | schoolSplitScenario.test.ts | ✓ passes |
| AC-juice-schools: steering outcomes unchanged | schoolSplitScenario.test.ts | ✓ passes |
| Build stays green | npm run build | ✓ passes (existing failures only) |
| Headless suite stays green | npx vitest run | ✓ passes (existing failures only) |

## Live verification

Not applicable — the feature is render-only and its behavior is verified by Node scenario tests. A browser screenshot would be taken in WI-06d-b6 (the final proof owner for the six-effect juice union).

## Deviations from plan

None. The implementation follows the work item's changed responsibilities exactly: split parameters as pure data, per-school split state in the renderer, and no steering rule changes.

## Notes for reviewer

- The split logic is a per-frame render offset applied to schooling creatures. It reads creature positions but never writes back to the simulation.
- The split state is tracked per-creature in the CreatureRenderer's `splitState` map: when the player is within `SPLIT_PROXIMITY_RADIUS` (300 units), the state is "parting"; after the player leaves, it transitions to "reforming" and fades over `SPLIT_REFORM_TIME` (0.5s).
- The split offset pushes each schooling creature away from the player, scaled by proximity (closer = stronger push). The maximum spread is `SPLIT_SPREAD` (80 units).
- The steering outcomes are proven unchanged by the Node scenario test, which spawns a school and verifies the creatures steer normally.

## Shrink/Flatten report

- Removed nothing; the implementation is minimal.
- The split parameters module (schoolSplit.ts) is 88 lines of pure data and classification — no extension points, no unused hooks.
- The CreatureRenderer change is a focused addition to the stepVisual method — no new abstraction, no pass-through wrappers.

## Knowledge notes

Consulted:
- ARCHITECTURE.md — creature render path in ST-02/ST-03 creature renderer
- BUILD.md — build and test commands

Written:
- None (the implementation is straightforward rendering logic, not an architectural discovery).
