# Review: WI-06e-a — Depth-based mixing

Status: pass

## Context

This work item finalizes per-band depth-based audio mixing on the existing
AudioSystem. The existing `AUDIO_STOPS` data in `src/util/audio.ts` already
defines six band stops (0/1600/4000/7000/10000/12000m) mirroring the visual band
stops in `src/render/band.ts`, with `highCutoff`, `lowRumble`, `reverb`, and
other `AudioProfile` parameters. `AudioSystem.update()` calls
`audioProfileAtDepth(player.depth)` each frame and applies the profile via
`applyProfile()` (ramping `worldLowpass.frequency`, `subRumbleGain`, reverb
send/delay/convolver gains, etc.).

The implementer's contribution was two focused tests:
1. Strict monotonicity: `highCutoff` strictly falls, `lowRumble` and `reverb`
   strictly rise across all `AUDIO_STOPS`.
2. Interpolation correctness: `audioProfileAtDepth` at each authored stop
   returns the exact stop values.

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| Per-band mixing parameters finalized in `AUDIO_STOPS` (roll-off, rumble, reverb) | passed | `src/util/audio.ts` — six stops with appropriate depth progression; highCutoff falls 16000→1900 Hz, lowRumble rises 0.15→1.0, reverb rises 0.15→1.0 |
| `AudioSystem` applies finalized profile per depth (audible change at band boundaries) | passed | `src/systems/AudioSystem.ts` `update()` calls `audioProfileAtDepth(player.depth)` each frame; `applyProfile()` ramps all depth-sensitive parameters with smoothing |
| Master-volume seam (`save.settings.masterVolume`, `setMasterVolume`) works through the mix | passed | `src/systems/AudioSystem.ts` `setMasterVolume()` sets `masterGain` via `setTargetAtTime`; slider wired in `buildVolumeSlider()`; `masterGain` is in the main graph |
| Node: strict monotonicity test for roll-off and rumble | passed | `src/util/audio.test.ts` "mixing curve is strictly monotonic..." — iterates all stops, asserts `curr.highCutoff < prev.highCutoff`, `curr.lowRumble > prev.lowRumble`, `curr.reverb > prev.reverb` |
| Node: interpolation at band stops resolves to authored values | passed | `src/util/audio.test.ts` "audioProfileAtDepth at each band stop resolves to the authored values" — asserts exact equality for all profile fields at each stop |
| Browser depth-ladder inspection recording audible change | blocked (deferred to tester) | Work item notes this is deferred; `AudioSystem.snapshot()` exposes the required fields (depth, highCutoff, lowRumble, reverb) for inspection |
| Suite and build stay green | passed | Ran `npx vitest run src/util/audio.test.ts` — 12/12 pass. Ran full suite — 439 passed, 2 failed. Ran `npx vite build` — success. |

## Findings

None. The implementation is correct, minimal, and properly scoped.

### Pre-existing test failures (not caused by this work item)

Two tests fail on the baseline commit `2edfce2` as well as on the implementation
commit, so they are not caused by this work item:
- `src/sim/rosterFinalProof.test.ts` — "every spawn sits in the band it was
  designed for, and each species covers every designed band" (T-17 in chunk
  shelf band 2, designed 3)
- `src/sim/tier3Scenario.test.ts` — "every tier-3 spawn resolves, sits in a
  designed band..." (same T-17 issue)

These are creature roster/distribution tests, unrelated to the audio mixing.

## Impact Check

Using `codegraph_codegraph_explore("audioProfileAtDepth AUDIO_STOPS AudioSystem applyProfile")`:

- `AUDIO_STOPS` (src/util/audio.ts:53) — 3 callers in AudioSystem, tests in audio.test.ts
- `applyProfile` (src/systems/AudioSystem.ts:477) — 1 caller in AudioSystem.update()
- `AudioSystem` (src/systems/AudioSystem.ts:95) — 3 callers in Game.ts
- `audioProfileAtDepth` (src/util/audio.ts:68) — 5 callers in AudioSystem

All callers are accounted for in the existing code. The two new tests are the
only changes. No unintended callers affected.

## Independent Adversarial Probes

Designed and ran:
1. **Monotonicity check across all stops**: Verified that `highCutoff` strictly
   decreases and `lowRumble`/`reverb` strictly increase across the six stops
   using the existing strict test. Passes.
2. **Interpolation at boundaries**: Verified that at each authored stop depth,
   the interpolated profile returns the exact authored values (not slightly
   off due to floating-point or boundary conditions). Passes.
3. **Audio band depth alignment**: Confirmed that the six audio stops
   (0/1600/4000/7000/10000/12000m) match exactly the six visual band stops in
   `src/render/band.ts`. Match confirmed.
4. **Baseline test failure check**: Verified that the two failing tests
   (`rosterFinalProof.test.ts`, `tier3Scenario.test.ts`) fail identically on
   the baseline commit, proving they are pre-existing and not caused by this
   work item.

## What I Could Not Verify

- **Browser depth-ladder inspection**: The work item explicitly defers this to
  the tester role. The `AudioSystem.snapshot()` method provides the required
  fields for inspection (depth, highCutoff, lowRumble, reverb), but I did not
  run an in-browser inspection.
- **Actual auditory perception**: I verified the numeric values change with
  depth and that the WebAudio parameters are being driven by these values, but
  I could not actually listen to the audio to confirm it "sounds" correct.

## Notes

The implementation is a good example of minimal, well-scoped work. The existing
audio architecture (pure data stops → interpolation → per-frame apply) is clean
and testable. The two added tests document and guard the monotonicity and
interpolation invariants effectively.

The work item's assumption that the existing `AUDIO_STOPS` values are already
the "finalized" mixing parameters is reasonable — the values show appropriate
progression and satisfy all requirements. Any further tuning would be a
separate polish pass.
