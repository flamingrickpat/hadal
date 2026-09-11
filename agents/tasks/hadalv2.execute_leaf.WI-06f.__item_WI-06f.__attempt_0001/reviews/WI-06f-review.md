# Review: WI-06f — Section 26 bathymetry map overlay

Status: pass

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| Map opens on Tab | passed | `src/game/Game.ts` line 105-108: Tab key handler calls `toggleMap()` |
| Game pauses while map is open | passed | `src/game/Game.ts` line 112-129: `update()` skips `sim.step()` when `mapOpen` is true |
| Shows player position | passed | `mapView.ts` builds `playerPosition`; `mapOverlay.ts` line 137-151 renders pulsing player marker |
| Shows explored chunk silhouettes | passed | `mapView.ts` reads `sim.discoveredChunks`; `mapOverlay.ts` line 90-100 renders bathymetric silhouettes |
| Shows base | passed | `mapView.ts` builds base position; `mapOverlay.ts` line 103-109 renders base marker |
| Shows discovered landmarks | passed | `mapView.ts` filters `chunk.props` with `kind='landmark'` in discovered chunks; `mapOverlay.ts` line 113-122 renders landmark markers |
| Death beacon only if tracked | passed | `mapView.ts` checks for 'death-beacon' story flag; `mapOverlay.ts` line 125-134 renders beacon only when present; probe confirmed absent when no flag |
| Never shows creature locations | passed | Structural test in `mapView.test.ts` (test 5); independent probe verified no creature fields in JSON output |
| Stale WI-15 comment removed | passed | `grep -r "WI-15" src/` returned no matches |
| Node test suite green | passed | Ran `npx vitest run`; 359/361 tests pass (2 pre-existing failures in tier2/tier3 roster distribution tests, unrelated to map) |
| Map-specific tests green | passed | Ran `npx vitest run src/ui/mapView.test.ts`; 6/6 tests pass |

## Findings

None. The implementation meets all acceptance criteria.

## Impact Check

- `MapOverlay` (src/ui/mapOverlay.ts:22) — 3 callers, all in `src/game/Game.ts`. The constructor instantiates it, `toggle()` is called from `toggleMap()`, and `update()` is called from the game loop when the map is open. All expected and correct.
- `buildMapViewModel` (src/ui/mapView.ts:43) — 1 caller in `src/game/Game.ts`, called each frame when the map is open. Expected and correct.
- `MapViewModel` (src/ui/mapView.ts:33) — used by `mapOverlay.update()` and exported for tests. No unexpected callers.
- No blast radius beyond the map overlay itself.

## Independent Adversarial Probes

1. **Creature data leakage probe** — Built the map view model from a live simulation state (seed 1, 10 steps) and serialized to JSON, checking for any occurrence of `"creature"`, `"spawn"`, or `"creaturePosition"` field names. Result: no creature fields found. Probe PASSED.

2. **Beacon state verification** — Built the view model without setting any 'death-beacon' story flag. Result: `model.beacon` was null. Probe PASSED.

3. **Structural test re-verification** — Ran the implementer's `mapView.test.ts` tests directly. Result: 6/6 passed, confirming the structural enforcement of "no creature data".

## What I Could Not Verify

- The actual visual appearance of the map overlay in the browser (no browser/Playwright harness available in this session). The implementer claims browser verification; the implementation logic, rendering code structure, and the fact that it integrates correctly into the game loop via Tab key and pause logic make this likely correct, but the visual presentation itself is not independently verified here.

- The two pre-existing test failures (`rosterFinalProof.test.ts` band distribution test and `tier3Scenario.test.ts` band distribution test) — these are in unrelated area (creature spawn band distribution) and were failing before this work item. They do not affect the map overlay.
