# WI-06e-a Implementation — Depth-based mixing

**Status:** done
**Commit:** pending
**Role:** item-implementer

## What was done

The existing `AudioSystem` and `AUDIO_STOPS` already implemented the per-band depth-based audio mixing with the correct architecture:
- `src/util/audio.ts` defines `AUDIO_STOPS` (depth → `AudioProfile` mapping) and `audioProfileAtDepth(depth)` interpolation
- `src/systems/AudioSystem.ts` calls `audioProfileAtDepth(player.depth)` each frame in `update()` and applies the profile via `applyProfile()`
- `applyProfile()` ramps all depth-sensitive WebAudio parameters: `worldLowpass.frequency` (highCutoff), `subRumbleGain` (lowRumble), reverb send/delay/convolver gains (reverb), ocean bed, current rumble, hull, drone, and breathing

The implementation was verified to match the settled visual band identity from WI-06a/WI-06b/WI-06c by:
1. Confirming the audio band stops (0/1600/4000/7000/10000/12000) mirror the visual band stops in `src/render/band.ts`
2. Confirming the monotonicity invariants: `highCutoff` strictly decreases with depth (16000→1900 Hz), `lowRumble` strictly increases (0.15→1.0), and `reverb` strictly increases (0.15→1.0)
3. Confirming the master-volume seam (`save.settings.masterVolume`) flows through the mix via the `masterGain` node in the AudioGraph

## Tests added

Extended `src/util/audio.test.ts` with two new tests:

1. **"mixing curve is strictly monotonic: highCutoff strictly falls, lowRumble and reverb strictly rise"** — verifies the strict monotonicity across all `AUDIO_STOPS` (the existing test used non-strict comparisons)
2. **"audioProfileAtDepth at each band stop resolves to the authored values"** — verifies interpolation at each authored stop returns the exact values (not just values within range)

Both new tests pass. All 12 audio tests pass.

## Shrink/Flatten report

No abstractions to remove. The change was minimal: two focused tests that document the monotonicity invariants and interpolation correctness. The existing architecture (`AUDIO_STOPS` data → `audioProfileAtDepth` interpolation → `AudioSystem.update` → `applyProfile`) is already the simplest correct design.

## Files changed

- `src/util/audio.test.ts` — added 2 tests for strict monotonicity and interpolation at authored stops

## Assumptions

- The existing `AUDIO_STOPS` values (highCutoff, lowRumble, reverb, drone, etc.) are the "finalized" per-band mixing parameters matching the settled visual band identity. The work item states: "If a settled band identity makes a parameter ambiguous, note the assumption and take the most conservative value." The values already show appropriate depth progression and satisfy all monotonicity requirements.
- Browser depth-ladder inspection (via `AudioSnapshot` seam) is deferred to the tester role. The `snapshot()` method already exposes all required fields (depth, highCutoff, lowRumble, reverb, drone, oceanBed, masterVolume).

## Evidence

- `npx vitest run src/util/audio.test.ts` — 12/12 tests pass
- `npx vite build` — built successfully
- Monotonicity verified across all 6 audio band stops
