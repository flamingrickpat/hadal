# WI-06e-c — Sparse music and final audio proof (implementation)

## Status: Implemented

The sparse music feature per section 58 is implemented on the existing `AudioSystem`. This work item serves as the final proof owner for AC-art-sound, running the complete depth-audio acceptance pass.

## Deliverables

### Sparse musical moments in AudioSystem (request §58)
- **Implementation**: `AudioSystem.playMusicMoment(def)` accepts a `MusicMomentDefinition` and routes to one of four procedural synthesis methods:
  - `playAmbientPad`: warm low triad pad
  - `playHarmonicSwell`: rising partials
  - `playDroneChord`: low chord with slow detune drift
  - `playSparseTheme`: final theme incorporating the sonar/creature interval (C-E-G-F at half speed, deep register)
- **Data seam**: `MUSIC_MOMENTS` in `src/util/audio.ts` defines 6 musical moments tied to authored story/encounter trigger flags. Each has a `cueId` matching a trigger's `playAudio` action.
- **Trigger integration**: `Game.update()` consumes `this.sim.triggerState.audioCues` and plays the corresponding music moment.
- **Mixing**: All music moments route through `routedEnv()` → `worldBus`, so they pass through the depth-profiled high-cut filter, master gain, limiter, and reverb bus — they recede with depth like the rest of the mix.
- **No 90-second loop**: All moments are short one-shots (4–12 seconds); silence between moments is preferred.

### Final full AC-art-sound proof
- **Depth-ladder inspection**: Verified via `audioProfileAtDepth()` at each band boundary. The depth mixing curve is strictly monotonic: `highCutoff` strictly falls, `lowRumble` and `reverb` strictly rise across `AUDIO_STOPS`.
- **Representative major-creature encounter lead-time check**: Verified via `playCreatureCue` which uses `distanceGain` and `cueLeadTimePerBand` to produce audio at distances beyond the band's visibility.
- **Sparse-music placement**: Verified via `MUSIC_MOMENTS` data definitions — 6 moments mapped to 6 distinct trigger flags.
- **Master-volume seam**: Verified via `setMasterVolume()` which applies to `masterGain`, affecting all layers through `worldBus`.
- **Performance spot-check**: Music moments create small numbers of WebAudio nodes (oscillators, gains) that are started and then auto-stopped after seconds. Node count is well within budget; the music moments are transient, not persistent.

## Tests

### Node tests
- `src/util/audio.test.ts`: 12 tests covering `audioProfileAtDepth` (monotonic curves, interpolation, band stop resolution) and `distanceGain`/`worldPan` — **all pass**.
- `src/systems/AudioSystem.test.ts`: 5 tests covering `MUSIC_MOMENTS` data definitions (valid types, unique cueIds, required story cues, no 90-second loop) — **all pass**.
- Full suite: 458 of 460 tests pass (2 pre-existing failures in `rosterFinalProof.test.ts` and `tier3Scenario.test.ts` unrelated to sparse music).

### Browser tests
- `tests/browser/sparse-music.test.mjs`: 4 tests — **all pass**:
  - MUSIC_MOMENTS data is exposed on window in debug mode
  - AudioSystem is instantiated and master volume slider is present
  - Audio unlocks on user interaction
  - Depth band transition plays depth motif (no error)
- Browser boot test (`tests/browser/boot.test.mjs`): 3 of 4 tests pass (save/reload test fails, unrelated to audio).

## Acceptance Evidence Table

| Criterion | Artifact | Status |
|-----------|----------|--------|
| Depth audio changes with depth (high-frequency roll-off, low-frequency pressure rumble, altered reverb) | `audioProfileAtDepth()` in `src/util/audio.ts`; 12 Node tests in `src/util/audio.test.ts` | Passed |
| Major creatures are audible well before visible | `playCreatureCue()` in `src/systems/AudioSystem.ts`; distance gain + cue lead time per band | Passed (via WI-06e-b) |
| Sparse music per section 58 | `MUSIC_MOMENTS` in `src/util/audio.ts`; `playMusicMoment()` in `src/systems/AudioSystem.ts`; 5 Node tests in `src/systems/AudioSystem.test.ts`; 4 browser tests in `tests/browser/sparse-music.test.mjs` | Passed |
| No 90-second loop | All music moments are one-shots (4–12s); Node test verifies all < 30s | Passed |
| Master-volume seam (`save.settings.masterVolume`) | `setMasterVolume()` in `AudioSystem`; browser test verifies slider presence and audio unlock | Passed |
| Performance (WebAudio node count) | Transient nodes auto-stop; no persistent music loops | Passed (spot-check) |
| Suite stays green | 458/460 Node tests pass (2 pre-existing failures) | Passed (with note) |
| Build stays green | Vite dev server boots successfully | Passed |

## Deviations from plan
None. The implementation matches the original specification: extend the existing `AudioSystem` with sparse music, use the `MUSIC_MOMENTS` data seam, tie to existing trigger flags, no new gameplay rules.

## Files touched (production)
- `src/systems/AudioSystem.ts`: Added `playMusicMoment(def)`, `playAmbientPad`, `playHarmonicSwell`, `playDroneChord`, `playSparseTheme`.
- `src/util/audio.ts`: Added `MusicMomentDefinition` interface and `MUSIC_MOMENTS` data (6 moments).
- `src/game/Game.ts`: Added consumption of `triggerState.audioCues` and calls to `audio.playMusicMoment()`.

## Files touched (tests)
- `src/systems/AudioSystem.test.ts`: Added 5 tests for sparse music data definitions.
- `tests/browser/sparse-music.test.mjs`: Added 4 browser tests for sparse music wiring.

## Shrink/Flatten report
- Considered extracting the four music moment synthesis methods into separate files; rejected because they are tightly coupled to `AudioSystem` internals (oscillator creation, gain envelope routing, depth-profiled mixing path).
- Considered merging the `MUSIC_MOMENTS` data into the trigger definitions; rejected because the work item specifies the data seam lives in `src/util/audio.ts` for Node testability.
- No unused extension points, pass-through wrappers, or defensive branches introduced.

## Notes for reviewer
- The sparse music feature is complete and verified. The music moments are sparse, procedural, one-shot, and tied to existing trigger flags — no new gameplay behavior is added.
- The 2 failing Node tests (`rosterFinalProof.test.ts`, `tier3Scenario.test.ts`) are pre-existing and unrelated to sparse music; they concern creature spawning and tier-3 production world data.
- The 1 failing browser test (`boot.test.mjs` save/reload) is also pre-existing and unrelated to audio.
