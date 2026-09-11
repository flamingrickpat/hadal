# Review: WI-06e-b — Creature sound profiles and pre-visibility cues

Status: findings

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| Every registered major creature has a sound profile | passed | creatureAudio.ts has profiles for all 22 major creatures (T-01, T-02, T-03, T-05, T-06, T-08, T-09, T-10, T-11, T-13, T-14, T-15, T-16, T-17, T-18, T-19, T-20, T-22, T-23, T-25, T-27, T-31) |
| Every profile has a section 58 vocabulary tag | passed | All 22 profiles use tags from SECTION_58_VOCABULARY (clicks, sub-bass, scraping, resonant harmonics, chittering, creaking, groaning, popping, ratcheting, snapping, squeaking, thumping, trilling, whooshing) |
| Vocabulary is varied (not everything roaring) | passed | 14 distinct vocabulary tags used across 22 creatures |
| Every profile has per-band cue lead time values | passed | All profiles have 6 values (one per depth band) |
| Node test validates all profiles | passed | creatureAudio.test.ts (4/4 passed): profiles exist, vocabulary valid, lead times present, variety confirmed |
| Cue emission when creature enters cue range | failed | playCreatureCue method exists but is never called anywhere in the codebase |
| Browser verification (audible before visible) | blocked | Requires browser harness with audio capture; noted by implementer |

## Findings

### Finding 1: playCreatureCue is never called (major)

The `playCreatureCue` method was added to `src/systems/AudioSystem.ts` (line 610) but is never invoked anywhere in the codebase. I searched all TypeScript files in `src/` and found no call sites.

```bash
Get-ChildItem -Path src -Filter "*.ts" -Recurse | Select-String -Pattern "playCreatureCue"
# Result: only the definition in AudioSystem.ts
```

The work item requires: "a major creature emits its early cue from its profile when the creature enters the cue range". This wiring is missing. The simulation collects `creatureAudioEvents` when creatures change state, but those are not proximity-based and are not consumed by the audio system.

The audio cue emission mechanism exists as a method but is not connected to any game logic that would trigger it when a creature approaches.

### Finding 2: Dead code in playCreatureCue (minor)

Inside `playCreatureCue`, the variables `lead` and `cueDist` are computed but never used:

```typescript
const lead = profile.cueLeadTimePerBand[band]!;
const leadBand = CUE_LEAD_TIME_BANDS[band]!;
const cueDist = Math.floor(leadBand.multiplier * BAND_STOPS[band]!.visibility) - leadBand.multiplier * 0;
```

These values should either be used to determine if the cue should fire or removed.

### Finding 3: Cue distance vs. visibility not verified (minor)

The test `creatureAudio.test.ts` verifies that `cueLeadTimePerBand` values are > 0, but does not verify that the cue distance (visibility + lead time) is greater than the visibility value. The work item requires "the authored cue range stays ahead of (farther than) that band's final visibility value".

## Impact Check

- Ran `codegraph_codegraph_explore` on AudioSystem, playCreatureCue, playCreatureSynthesis, and related symbols.
- The `playCreatureCue` method is a leaf function — it is defined but has no callers.
- The `CreatureAudioProfile` interface is imported by `AudioSystem.ts` and used in the type signature of `playCreatureCue`.
- The `creatureAudioEvents` array on `Simulation` is populated but only consumed by tests, not by the audio system.

## Independent Adversarial Probes

1. **Searched for playCreatureCue callers**: No call sites found. The method is dead code.
2. **Searched for creatureAudioEvents consumers**: Only test files consume this array, not the audio system.
3. **Examined trigger system**: `TriggerState.audioCues` is used for authored triggers, not for creature proximity cues. The creature proximity cue mechanism is not using the trigger seam.
4. **Examined AudioSystem.update**: Only handles ambient audio and scheduled events (breath, hull tick, distant call, depth motif). No creature proximity logic.

## What I Could Not Verify

- The browser-side verification (audible before visible) requires the shared browser harness with audio capture. This is noted as blocked by the implementer and is a legitimate blocker.
- The actual audio quality and vocabulary variety cannot be verified without browser audio playback.
- The cue lead time tuning against final band visibility cannot be fully verified without the browser test.

## Recommendations for Re-implementation

1. Wire up `playCreatureCue` to be called when a creature enters its cue range. This likely involves checking creature proximity in the AudioSystem.update method or in the Simulation step, and calling playCreatureCue when the creature is within the cue range but not yet visible.
2. Remove the unused `lead` and `cueDist` variables in playCreatureCue, or use them to determine when to fire the cue.
3. Add a test that verifies cue distance > visibility for all creatures and bands.
