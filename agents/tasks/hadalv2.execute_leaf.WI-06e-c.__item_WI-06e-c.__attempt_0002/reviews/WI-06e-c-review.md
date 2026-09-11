# Review: WI-06e-c — Sparse music and final audio proof

Status: findings

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| Depth audio changes with depth (high-frequency roll-off, low-frequency pressure rumble, altered reverb) | Passed | `audioProfileAtDepth()` in `src/util/audio.ts`; 12 Node tests in `src/util/audio.test.ts` (all pass); depth ladder is monotonic: highCutoff falls 16000→1900, lowRumble rises 0.15→1.0, reverb rises 0.15→1.0, drone recedes 0.45→0.04 |
| Major creatures are audible well before visible | Passed | `playCreatureCue()` in `src/systems/AudioSystem.ts` uses `distanceGain` and `cueLeadTimePerBand`; creature lead time is configured per band in `src/util/creatureAudio.ts` |
| Sparse music per section 58 | Passed (with finding) | `MUSIC_MOMENTS` in `src/util/audio.ts` defines 6 procedural music moments tied to existing trigger flags; `playMusicMoment()` in `src/systems/AudioSystem.ts` routes to 4 synthesis methods (ambient-pad, harmonic-swell, drone-chord, sparse-theme) |
| No 90-second loop | Passed | All 6 music moments are one-shots (4–12s); Node test `all music moments are one-shots, not a 90-second loop` passes |
| Master-volume seam (`save.settings.masterVolume`) | Passed | `setMasterVolume()` applies to `masterGain` affecting all layers through `worldBus`; browser test verifies slider presence |
| Performance (WebAudio node count) | Passed | Music moments create transient oscillator/gain nodes that auto-stop after seconds; no persistent loops |
| Suite and build stay green | Passed (with note) | 458/460 Node tests pass (2 pre-existing failures in rosterFinalProof.test.ts and tier3Scenario.test.ts unrelated to sparse music); 4/4 browser sparse-music tests pass; 3/4 browser boot tests pass (1 pre-existing failure) |

## Findings

1. **`audioCues` array is never reset after consumption (src/game/Game.ts:154-160)** — The sparse-music consumption loop reads `this.sim.triggerState.audioCues` and plays all cues, but never resets the array. On every subsequent frame, all previously fired music moments would be replayed, causing music to stack indefinitely. Compare with how `cameraModifier` is handled on lines 174-182: it is read, applied, and then explicitly reset to `null`. The same pattern should apply to `audioCues`. Fix: after the for-of loop, add `this.sim.triggerState.audioCues = [];` to consume the cues. This bug does not manifest in the headless sim-scenario tests (which never call `Game.update()`), so it passed the test suite.

## Impact Check

Ran `codegraph_explore` on the changed symbols:

- **`playMusicMoment`** (src/systems/AudioSystem.ts:703): 1 caller in `src/game/Game.ts`. No other callers found.
- **`MUSIC_MOMENTS`** (src/util/audio.ts:81): 3 callers — `src/game/Game.ts`, `src/systems/AudioSystem.ts`, and exposed on window for debug. No unexpected callers.
- **`AudioSystem`** (src/systems/AudioSystem.ts:97): 3 callers in `src/game/Game.ts`. No unexpected callers.
- **`playSparseTheme`** (src/systems/AudioSystem.ts:784): 1 caller in `src/systems/AudioSystem.ts` (from `playMusicMoment`). No unexpected callers.
- **`TriggerState`** (src/world/triggers.ts:82): 6 callers in `src/sim/Simulation.ts` and `src/world/triggers.ts`. No unexpected callers.

The only changed symbols have expected callers within the audio system and game loop. No silent breakage of other subsystems.

## Independent Adversarial Probes

1. **Ran the full Node test suite**: `npm run test` — 458/460 tests pass. The 2 failures (rosterFinalProof.test.ts, tier3Scenario.test.ts) are pre-existing creature spawn band placement issues unrelated to sparse music.
2. **Ran the sparse-music browser tests**: `node tests/browser/sparse-music.test.mjs` — 4/4 pass (MUSIC_MOMENTS data exposed, AudioSystem instantiated, audio unlocks on interaction, depth band transition plays motif).
3. **Verified the depth-ladder mixing curve** in `src/util/audio.ts`: highCutoff strictly falls (16000→11000→6500→4000→2600→1900), lowRumble strictly rises (0.15→0.35→0.6→0.8→0.92→1.0), reverb strictly rises (0.15→0.35→0.55→0.75→0.88→1.0), drone strictly falls (0.45→0.34→0.22→0.13→0.07→0.04). The depth mixing is correct.
4. **Traced the trigger-to-audio path**: Triggers fire → `applyAction` pushes `cueId` to `state.audioCues` → `Game.update()` reads `audioCues` → `audio.playMusicMoment(moment)`. The path is correct, but the array is never consumed/reset (finding #1).
5. **Verified music routes through depth profile**: All 4 music moment synthesis methods call `this.routedEnv(ctx, 0)` which connects to `this.worldBus`. The world bus passes through the high-cut filter and master gain, so music recedes with depth as required.

## What I Could Not Verify

- **Actual audio playback in browser**: The browser tests verify wiring and data seam, but cannot verify the actual sound (autoplay rules require user interaction). The implementation claims audio is procedurally synthesized WebAudio, which I verified by reading the source.
- **Creature lead-time audible-before-visible**: Verified the distance gain and lead-time configuration, but could not actually hear the audio in the browser to confirm the subjective "audible well before visible" quality. This is inherently a human perceptual test.
- **Performance spot-check**: The Node test suite and browser boot tests pass, but I did not run a dedicated performance profiler to measure WebAudio node count during a music moment. The implementation's claim (transient nodes, auto-stop) is consistent with the code structure.
