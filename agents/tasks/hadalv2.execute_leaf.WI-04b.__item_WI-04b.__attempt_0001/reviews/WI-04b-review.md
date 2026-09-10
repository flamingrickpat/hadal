# Review: WI-04b

Status: findings

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| 8-12 radio messages | Passed | dialogue.ts has 8 TRIGGER_RADIO_LINES entries |
| 10-16 short text fragments | Passed | textFragments.ts has 12 entries |
| 6-10 no-text story props | Passed | worldData.ts has 8 trace props |
| 3-5 major landmarks with visible history | Passed | worldData.ts has 4 landmarks |
| 1-2 deep discoveries contradicting timeline | Passed | frag-abyss-1, frag-abyss-2, frag-abyss-3 contradict "hull collapse" narrative |
| Section 51 foreshadowing (2-4 traces per major reveal) | Passed | 8 trace props, 2 per reveal (R1-R4) |
| Section 38 keep-or-delete test | Passed | All 12 fragments have classifications |
| Channel counts within budget | Passed | All within specified ranges |
| Every radio trigger textId resolves | Passed | All 8 trigger textIds match TRIGGER_RADIO_LINES |
| Every fragment carries a keep-or-delete classification | Passed | All 12 have valid reason fields |
| Spoiler audit (section 68) | Failed | "germination core" appears in test comment |

## Findings

1. **Spoiler containment violation (section 68)**: `src/sim/storyPayload.test.ts:72` contains the spoiler token "germination core" in a test comment. Section 68 requires that content be referenced by id only in code, tests, plan artifacts, and commits. The test comment should use "R3" instead of the actual reveal text.

   This is a clear violation that would be caught by the spoiler containment test (`rosterFinalProof.test.ts`, `tier2Scenario.test.ts`, `tier3Scenario.test.ts`, `tier4Scenario.test.ts`) — indeed, all 4 of these tests are currently failing because of this.

   Fix: Change the comment at line 72 of `src/sim/storyPayload.test.ts` from:
   ```typescript
   // R3 (MacGuffin is germination core): traces = sonar echo, alignments,
   ```
   to:
   ```typescript
   // R3: traces = sonar echo, alignments,
   ```

## Impact Check

- `TRIGGER_RADIO_LINES` (src/content/dialogue.ts:23) — used by `Simulation.ts` via trigger system and `storyPayload.test.ts`
- `TEXT_FRAGMENTS` (src/content/textFragments.ts:35) — used by `textFragments.test.ts`
- `TriggerSystem` and related interfaces (src/world/triggers.ts) — no changes, only new trigger data added
- `worldData.ts` — new props and triggers added to existing world chunks, no breaking changes to structure

## Independent Adversarial Probes

- Ran `npm test` and observed 4 failing tests, all related to the "germination core" spoiler token in `storyPayload.test.ts:72`
- Verified channel counts: 8 radio, 12 text fragments, 8 story props, 4 landmarks — all within budget
- Checked that all 8 radio trigger textIds match entries in `TRIGGER_RADIO_LINES`
- Verified that text fragments span multiple depth bands (shelf, twilight, abyss, hadal)
- Inspected text fragments for keep-or-delete classifications — all 12 have valid reasons
- Checked that the 8 foreshadow trace props are distributed across the world with proper id prefixes (trace-XXX-RN)

## What I Could Not Verify

- Live simulation testing: the implementation adds world data and trigger definitions, but I could not run the actual game to confirm that the triggers fire correctly in context. The unit tests verify the data structures but not the runtime behavior of the encounter trigger system in a live simulation.
