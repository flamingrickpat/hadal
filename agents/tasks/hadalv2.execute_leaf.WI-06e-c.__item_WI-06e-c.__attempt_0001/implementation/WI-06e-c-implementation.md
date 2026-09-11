# WI-06e-c — Sparse music and final audio proof

## Status

Implemented and tested.

## What was done

1. Added sparse music moment definitions to `src/util/audio.ts`:
   - New `MusicMomentDefinition` interface for procedural music moments
   - `MUSIC_MOMENTS` array defining 6 moments tied to existing story/encounter trigger flags:
     - `beat-s1-lights`: harmonic swell (subtle tonal moment)
     - `beat-s2-creak`: drone chord (low tension)
     - `beat-s3-pulse`: ambient pad (matching pulse rhythm)
     - `beat-s4-heartbeat`: ambient pad (intense heartbeat)
     - `beat-s5-plates`: harmonic swell (metallic resonance)
     - `ending-triggered`: sparse theme (final theme incorporating sonar interval)

2. Extended `src/systems/AudioSystem.ts` with music moment playback:
   - `playMusicMoment(def)` method that dispatches to type-specific synthesizers
   - `playAmbientPad()`: warm low triad with slow envelope
   - `playHarmonicSwell()`: rising partials (eerie swell)
   - `playDroneChord()`: low detuned chord with slow drift
   - `playSparseTheme()`: final theme using sonar interval motif (transposed to low register)
   - All moments are procedural WebAudio (no sampled assets), short (< 30s each), sparse

3. Wired music moments into the game loop in `src/game/Game.ts`:
   - After `sim.step()`, consume `triggerState.audioCues` from the trigger system
   - Match cue IDs to `MUSIC_MOMENTS` definitions
   - Play the corresponding music moment via `AudioSystem.playMusicMoment()`
   - Exposed `MUSIC_MOMENTS` on `window` in debug mode for browser testing

## Tests

### Vitest (Node) tests
New test file: `src/systems/AudioSystem.test.ts` (5 tests)
- MUSIC_MOMENTS data definitions are valid
- Unique cueIds (no duplicate trigger mappings)
- Final theme cue (ending-triggered) is present
- All major story beat cues are present
- No 90-second loop: all moments are short (< 30s)

### Browser tests
New test file: `tests/browser/sparse-music.test.mjs` (4 tests)
- MUSIC_MOMENTS data is exposed on window in debug mode
- AudioSystem is instantiated with volume slider present
- Audio unlocks on user interaction
- Depth band transition plays depth motif without error

## Build status
Build passes (tsc --noEmit && vite build).
Vitest suite: 458 pass, 2 fail (pre-existing T-17 band test failures unrelated to this work item).

## No 90-second loop
Confirmed: MUSIC_MOMENTS does not contain any looping track definitions. All moments are individually short (≤ 12s) and triggered by events. Silence between moments is preferred.

## Shrink/Flatten pass
- Removed: pass-through wrapper method (initial `playMusicMoment` had an extra indirection layer)
- Kept: 4 separate synthesizer methods (playAmbientPad, playHarmonicSwell, playDroneChord, playSparseTheme) because each produces a distinct sonic character required by section 58

## Artifacts
- `src/util/audio.ts`: added `MusicMomentDefinition` interface and `MUSIC_MOMENTS` data
- `src/systems/AudioSystem.ts`: added music moment playback methods
- `src/game/Game.ts`: added music moment wiring to game loop
- `src/systems/AudioSystem.test.ts`: new Vitest test file
- `tests/browser/sparse-music.test.mjs`: new browser test file
- `agents/tasks/hadalv2.execute_leaf.WI-06e-c.__item_WI-06e-c.__attempt_0001/implementation/WI-06e-c-implementation.md`: this file
