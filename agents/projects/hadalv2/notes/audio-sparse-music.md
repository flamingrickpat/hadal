---
title: Sparse music data seam and integration
tags: [audio, music, triggers, wi-06e-c]
symbols: [MUSIC_MOMENTS, playMusicMoment, AudioSystem, MusicMomentDefinition]
---

## Summary

Sparse procedural music per section 58 is implemented on the existing `AudioSystem` via the `MUSIC_MOMENTS` data seam in `src/util/audio.ts`.

## How it works

- `MUSIC_MOMENTS` (array of `MusicMomentDefinition`) defines musical moments with `id`, `cueId`, `type`, `scale`, `duration`, and `frequency`.
- `AudioSystem.playMusicMoment(def)` routes to one of four synthesis methods: `playAmbientPad`, `playHarmonicSwell`, `playDroneChord`, `playSparseTheme`.
- `Game.update()` consumes `this.sim.triggerState.audioCues` (populated by triggers with `playAudio` actions) and calls `audio.playMusicMoment()` for matching `MUSIC_MOMENTS` entries.
- All music routes through `routedEnv()` → `worldBus`, so it passes through the depth-profiled high-cut filter, master gain, and reverb bus — music recedes with depth.

## Trigger flags with music moments

- `beat-s1-lights`: harmonic-swell (story beat 1)
- `beat-s2-creak`: drone-chord (story beat 2)
- `beat-s3-pulse`: ambient-pad (story beat 3)
- `beat-s4-heartbeat`: ambient-pad (story beat 4)
- `beat-s5-plates`: harmonic-swell (story beat 5)
- `ending-triggered`: sparse-theme (final theme incorporating sonar interval)

## Tests

- Node: `src/systems/AudioSystem.test.ts` (5 tests for music moment data definitions)
- Browser: `tests/browser/sparse-music.test.mjs` (4 tests for wiring and playback)
