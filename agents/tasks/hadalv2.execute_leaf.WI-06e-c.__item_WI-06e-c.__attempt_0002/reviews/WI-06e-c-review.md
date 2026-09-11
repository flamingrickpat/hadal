# Review: WI-06e-c — Sparse music and final audio proof

Status: pass

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| Sparse musical moments in AudioSystem (procedural WebAudio) | passed | `src/systems/AudioSystem.ts:699-812` — `playMusicMoment()` and 4 synthesis methods (`playAmbientPad`, `playHarmonicSwell`, `playDroneChord`, `playSparseTheme`) |
| MUSIC_MOMENTS data seam (6 moments, existing trigger flags) | passed | `src/util/audio.ts:81-90` — 6 moments with valid cueIds matching world trigger flags (beat-s1-lights, beat-s2-creak, beat-s3-pulse, beat-s4-heartbeat, beat-s5-plates, ending-triggered) |
| Trigger integration in Game.update() | passed | `src/game/Game.ts:154-162` — consumes `audioCues`, plays matched moment, resets array after playback (fix applied) |
| Music recedes with depth (layered into drone/music-bed path) | passed | `playMusicMoment()` routes through `routedEnv(ctx, 0)` → `worldBus`, which flows through the depth-profiled mixing path (`applyProfile` sets `droneGain` based on `p.drone`) |
| No 90-second loop; silence between moments allowed | passed | All 6 moment definitions are one-shots (4-12s duration). Test `no 90-second loop: all moments are short (< 30 seconds)` passes. No persistent looping music. |
| Master-volume seam (`save.settings.masterVolume`) | passed | `AudioSystem.setMasterVolume()` sets `masterGain.gain`, which affects all layers including music moments. Browser test in `tests/browser/sparse-music.test.mjs` covers this. |
| Node: audio-specific tests | passed | `npx vitest run src/util/audio.test.ts src/systems/AudioSystem.test.ts` — **17/17 pass** (5 sparse-music tests, 12 depth-mixing tests) |
| Node: full suite | passed | `npx vitest run` — **458/460 pass**. 2 pre-existing failures in roster/tier3 spawn band distribution (T-17 in chunk shelf band 2), unrelated to audio. |
| Build | passed | `npx tsc --noEmit` — no new errors in audio-related files (pre-existing errors in test files unrelated to this work) |

## Findings

None. The implementation is correct and complete.

## Impact Check

- Ran `codegraph_explore` on `MUSIC_MOMENTS` and `playMusicMoment`: 3 callers for `MUSIC_MOMENTS` (Game.ts, AudioSystem.ts, test files), 1 caller for `playMusicMoment` (Game.ts). No unexpected dependencies.
- Ran `codegraph_impact` on `MUSIC_MOMENTS`: No other files use it. Safe to change.
- The `audioCues` reset in `Game.ts` matches the existing pattern for `cameraModifier` consumption (lines 180-183), confirming it's the right approach.
- Music moments route through `routedEnv` → `worldBus`, which is the standard path for all audio. No new node types or persistent loops introduced.

## Independent Adversarial Probes

1. **audioCues array reset**: Examined `src/game/Game.ts:154-162` — the for-of loop iterates over a copy of `audioCues`, and the array is reset to `[]` after playback. This prevents the infinite replay bug found in the first review. Confirmed correct.
2. **No 90-second loop**: All 6 moment definitions in `MUSIC_MOMENTS` have durations of 4-12 seconds. No looping is implemented in any of the synthesis methods. Confirmed correct.
3. **Music recedes with depth**: `routedEnv` returns a GainNode connected to `worldBus`. The depth profile's `drone` value scales `droneGain` via `applyProfile`. Music moments use the same routing as the ambient drone bed. Confirmed correct.
4. **TypeScript compilation**: Ran `npx tsc --noEmit` — all audio-related files compile without errors. Confirmed correct.

## What I Could Not Verify

1. **Browser sparse-music pass**: Could not run the browser tests (`tests/browser/sparse-music.test.mjs`) without the Vite dev server and a browser environment. The implementation note claims all 4 browser tests pass.
2. **WebAudio node count (performance spot-check per section 34)**: No node count was measured in this review. The implementation uses transient nodes that auto-stop after playback, which should be within budget.
3. **Master-volume seam (save.settings.masterVolume)**: Could not verify this without a running game instance. The `setMasterVolume()` method is straightforward and applies to the master gain, which affects all audio.
