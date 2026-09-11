# Review: WI-06e-b — Creature sound profiles and pre-visibility cues

Status: pass

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| Every registered major creature has a sound profile | passed | CREATURE_AUDIO_PROFILES has 22 profiles (T-01, T-02, T-03, T-05, T-06, T-08, T-09, T-10, T-11, T-13, T-14, T-15, T-16, T-17, T-18, T-19, T-20, T-22, T-23, T-25, T-27, T-31) |
| Every profile has a section 58 vocabulary tag | passed | All profiles use tags from SECTION_58_VOCABULARY; verified by test |
| Vocabulary is varied (not everything roaring) | passed | 14 distinct vocabulary tags used across 22 creatures; verified by test |
| Every profile has per-band cue lead time values | passed | All profiles have 6 values (one per depth band); verified by test |
| Cue distance stays ahead of visibility | passed | Test verifies cue distance > visibility for all creatures and bands |
| Cue emission when creature enters cue range | passed | Game.update() calls playCreatureCue when creatures enter cue range (lines 124-148) |
| AudioSystem extended with playCreatureCue | passed | playCreatureCue defined in AudioSystem.ts (line 610) |
| Browser verification (audible before visible) | blocked | Requires browser harness with audio capture; noted as legitimate blocker |

## Findings

None. All previous review findings have been addressed.

Previous findings resolved:
1. playCreatureCue is now called from Game.update() (lines 124-148 of Game.ts)
2. Dead code (unused lead/cueDist variables) removed from playCreatureCue
3. Test added verifying cue distance > visibility for all creatures and bands

## Impact Check

- Ran codegraph on Game.update, playCreatureCue, playCreatureSynthesis, and CREATURE_AUDIO_PROFILES.
- playCreatureCue is called from Game.update() for each active creature that enters its cue range.
- The cuePlayed Set prevents repeated cues per approach while allowing re-triggering when creatures leave range.
- The implementation reuses existing infrastructure (distanceGain, worldPan, routedEnv) and follows the same pattern as the camera impulse loop.
- No new creature behavior; cues read existing encounter state.

## Independent Adversarial Probes

1. Verified the commit exists: `git log --oneline` shows 861feb7 "wire up creature proximity cues in game loop"
2. Verified the code: examined Game.ts lines 124-148, confirmed the creature proximity loop and playCreatureCue call
3. Ran the tests: `npm test -- --run src/util/creatureAudio.test.ts` — all 5 tests pass
4. Ran the full suite: 444/446 tests pass (2 pre-existing failures unrelated to this work item)
5. Checked the build: `npm run build` shows pre-existing TypeScript errors in test files (not introduced by this work item)
6. Verified the cue distance > visibility test: test case 5 iterates all creatures and bands, confirms cueDist > visibility

## What I Could Not Verify

- The browser-side verification (audible before visible) requires the shared browser harness with audio capture. This is noted as blocked by the implementer and is a legitimate blocker.
- The actual audio quality and vocabulary variety cannot be verified without browser audio playback.
- The cue lead time tuning against final band visibility cannot be fully verified without the browser test.
