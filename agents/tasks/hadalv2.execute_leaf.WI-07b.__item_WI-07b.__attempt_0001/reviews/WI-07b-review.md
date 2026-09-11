# Review: WI-07b — Section 32 reachability validator and section 40 scarcity

Status: findings

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| AC-bal-scarcity | partial | 130-170% scarcity rules are satisfied for all 3 recipes (tank-1: 150% in shelf, fins-1: 150% in twilight, sonar-1: 140% in abyss), each across >=2 nodes. However, the test suite has a regression: `scenarios.test.ts` "depleted resources" now fails because the new nodes are not harvested in that test. |

## Deliverables

- ✅ `simulateCriticalPath()` implemented in `src/sim/criticalPath.ts` — performs the state-space reachability check: collects guaranteed materials, crafts upgrades, recomputes reachable gates, iterates. The test proves it catches a deadlock (blocked gate).
- ✅ `validateWorld()` extended from `validateWorldChunks` — checks chunk exits, creature ids, recipe materials, story trigger ids. Tests prove it catches broken ids.
- ✅ Physical route scenarios in `src/sim/routeScenarios.test.ts` — 4 tests prove the player can swim from start → shelf → twilight → abyss → hadal using `Scenario.swimTo`. Each test takes 1-27 seconds of real simulation time, confirming they use production collision geometry, not teleportation.
- ✅ Scarcity placement in `src/world/worldData.ts` — added 10 resource nodes across shelf (3), twilight (4), and abyss (3) with proper amounts to satisfy 130-170% rules.

## Findings

1. **Regression in `scenarios.test.ts`**: The work item modified `src/world/worldData.ts` to add 10 new resource nodes (salvage-shelf-1/2/3, salvage-twilight-1/2/3/4, salvage-abyss-1/2/3). The pre-existing `scenarios.test.ts` "depleted resources" test harvests all 5 original salvage nodes (salvage-1 through salvage-5) and asserts that all reachable nodes are harvested. Now there are 10 additional nodes that the test doesn't harvest, so the assertion fails. The test passed on the base commit (23a147d) and fails on the current commit. The work item's "Suite and build stay green" criterion is not met. Fix: update the depleted resources test to include the new node IDs, or update the test to dynamically enumerate all reachable nodes.

## Impact Check

- Ran `codegraph_explore` on `simulateCriticalPath`, `validateWorld`, and `validateWorldChunks`. The new functions have no callers beyond their own tests (they are new diagnostic/validation utilities).
- `validateWorldChunks` is called by `validateWorld`, which is a new caller. This is intentional and correct.
- The new resource nodes in `worldData.ts` are picked up by `makeSimWorld()` and therefore affect all scenarios. This is the root cause of the regression in `scenarios.test.ts`.

## Independent Adversarial Probes

1. **Scarcity calculation verification**: I manually calculated the percentages from the new node amounts in `worldData.ts`:
   - shelf (band 2): 9 salvage across 3 nodes ÷ 6 (tank-1 cost) = 150% ✅
   - twilight (band 3): 12 salvage across 4 nodes ÷ 8 (fins-1 cost) = 150% ✅
   - abyss (band 4): 7 salvage across 3 nodes ÷ 5 (sonar-1 cost) = 140% ✅
   All are within the 130-170% range and each has >=2 nodes.

2. **Route scenario verification**: I confirmed the route scenarios use `Scenario.swimTo` with real physics simulation (the tests take 1-27 seconds each), not teleportation or noclip. The player swims through actual collision geometry.

3. **Deadlock detection verification**: I verified that `criticalPath.test.ts` has a negative test that blocks all paths to the hadal chunk and confirms `simulateCriticalPath` returns `reachable: false`.

## What I Could Not Verify

- The "first relevant area" assumption (tank-1 at shelf/band 2, fins-1 at twilight/band 3, sonar-1 at abyss/band 4) is based on the implementer's documentation rather than the request itself. The request does not explicitly define this mapping, so I accepted the implementer's stated interpretation.
- The TypeScript build has pre-existing errors in files unrelated to this work item (tier2/3/4 scenarios, lighting, etc.) that were already present on the base commit.

## Conclusion

The implementation is complete and correct for its stated deliverables: the reachability validator, world validation, physical route scenarios, and scarcity placement all work as specified. The only issue is a regression in the `scenarios.test.ts` suite that the implementer should fix before this work item can be considered done.