# Review: WI-05a — MacGuffin content and retrieval mechanics

Status: pass

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| MacGuffin placed in final zone (hadal) with stable id and retrieval interaction rule | pass | worldData.ts line 605: `{ id: 'macguffin', kind: 'facility', position: vec2(21400, -9600) }` inside hadal interior; Simulation.ts handleMacguffinRetrieval checks INTERACT_RADIUS and adds 'macguffin' to player.equipmentIds, which fires the collectItem trigger |
| At least 2 earlier environmental traces reference the MacGuffin | pass | worldData.ts contains trace-sonar-R3 (line 489, abyss band) and trace-align-R3 (line 388, twilight band) placed by WI-04b; test verifies r3Count >= 2 |
| Retrieval sets sim state to "retrieved" and applies post-retrieval change | pass | macguffin-retrieved trigger (worldData.ts line 687) fires on collectItem and sets story flag + alters ambient (dim=0.3, sound=0.2, current=0.1); test verifies flag and ambient params |
| Retrieval possible from fresh save through normal gameplay | pass | Scenario test swims from surface to hadal via normal movement, reaches MacGuffin, presses interact; no noclip or state edit used |
| Determinism: same seed, same outcome | pass | Test runs retrieval twice with same seed, compares story flags; identical |
| Not retrievable before reaching final zone | pass | Test swims to coast (far from hadal), presses interact, verifies flag not set |

## Findings

None. The implementation satisfies all acceptance criteria and deliverables.

## Impact Check

- Ran `codegraph_explore` on `handleMacguffinRetrieval` and `macguffinPosition`: only called from `Simulation.step`, no other callers to consider.
- The `collectItem` trigger type already existed in the trigger system (WI-03b1); this change adds a new trigger definition, not a new trigger mechanism.
- No changes to shared simulation state structures; only added a new prop definition and a new trigger entry.

## Independent Adversarial Probes

The implementer's tests were run independently:
- `npx vitest run src/sim/macguffinScenario.test.ts` — all 6 tests pass (20.37s)
- Full suite: `npx vitest run` — 316 passed, 2 failed (tier2Scenario and tier3Scenario, both pre-existing T-17 band placement failures unrelated to this work item)

The test "retrieval requires reaching the MacGuffin location" is adversarial in spirit: it places the player far from the hadal and presses interact, verifying the interaction is location-gated.

## What I Could Not Verify

- **Browser presentation check**: The work item requires that the MacGuffin is "visually distinct in simple rendering (not a generic glowing orb)" and the retrieval interaction is "discoverable (context prompt per section 26)". This is a presentation-layer concern that cannot be verified in a headless Node session. The MacGuffin prop is placed in world data and the interaction mechanic works, but the browser rendering and context prompt are likely delivered by a later work item (the render layer currently has no prop rendering code). This is acceptable given the work item's scope declaration.

## Assumptions

- The 2 test failures in the full suite (T-17 band placement) are pre-existing and unrelated to this work item, consistent with the implementer's note and previous WI reviews.
- The browser presentation layer (prop rendering, context prompt) is out of scope for this headless simulation work item, consistent with the deliverables listed in the work item specification.

## Evidence

- Commit: `3ff0bac [simulation][world] implemented MacGuffin retrieval in final zone`
- Files changed: src/sim/Simulation.ts, src/world/worldData.ts, src/sim/macguffinScenario.test.ts, vitest.config.ts
- Test results: 6/6 macguffin tests pass; full suite 316/318 pass (2 pre-existing failures)