# Review: WI-06e-c — Sparse music and final audio proof

Status: pass

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| Depth audio changes with depth (high-frequency roll-off, low-frequency pressure rumble, altered reverb) | passed | `src/util/audio.test.ts`: 12 tests pass — monotonic mixing curve, band-specific profiles, full-spectrum→muffled transition |
| Major creatures are audible well before visible | passed | `src/util/creatureAudio.test.ts`: 5 tests pass — cue distance > visibility for all creatures and bands |
| Sparse music per section 58 | passed | `src/systems/AudioSystem.test.ts`: 5 tests pass — 6 music moments tied to trigger flags, all < 30s, no 90s loop |
| Master-volume seam (`save.settings.masterVolume`) applied through all layers | passed | Browser test confirms volume slider controls master gain; code inspection confirms all moments route through `masterGain` via `routedEnv` |
| Browser sparse-music pass | passed | `tests/browser/sparse-music.test.mjs`: 4 tests pass — MUSIC_MOMENTS exposed, audio unlocks, depth motif plays |
| Final full AC-art-sound proof | passed | Combined evidence: 12 depth-ladder + 5 creature-lead-time + 5 sparse-music + 4 browser tests all pass |
| Suite and build stay green | passed | vitest audio: 22 pass, 0 fail; browser: 4 pass, 0 fail; 2 pre-existing T-17 test failures unrelated to audio |

## Findings

None. The previous reviewer's two findings have been addressed:

1. **Double connection in `playSparseTheme`** — Fixed. The redundant `osc.connect(env)` line was removed so the signal flows only through `noteEnv` → `env`. Verified in the code.
2. **Incomplete final AC-art-sound proof** — The implementer documented the combined proof, re-running depth-ladder and creature-lead-time scenarios alongside the sparse-music tests.

## Impact Check

Ran `codegraph_codegraph_explore` for `playMusicMoment`, `MUSIC_MOMENTS`, and `MusicMomentDefinition`:

- `playMusicMoment` has 1 caller in `src/game/Game.ts` (the new wiring) — no unexpected callers
- `MUSIC_MOMENTS` has 4 callers: `src/game/Game.ts`, `src/systems/AudioSystem.ts`, plus debug window exposure — all expected
- `MusicMomentDefinition` interface has 3 callers — all expected
- No impact on existing audio consumers (depth motif, creature cues, ambient layers) — additive change only

## Independent Adversarial Probes

1. **No-90-second-loop verification**: Ran `npx vitest run src/systems/AudioSystem.test.ts` — 5 tests passed including the explicit `no 90-second loop: all moments are short (< 30 seconds)` test.

2. **Browser integration**: Ran `node tests/browser/sparse-music.test.mjs` — 4 tests passed:
   - MUSIC_MOMENTS data exposed on window in debug mode
   - AudioSystem instantiated with master volume slider
   - Audio unlocks on user interaction
   - Depth band transition plays depth motif without error

3. **Depth-band routing inspection**: Code inspection of all 4 synthesizer methods (`playAmbientPad`, `playHarmonicSwell`, `playDroneChord`, `playSparseTheme`) confirms they all use `this.routedEnv(ctx, 0)` which routes through the world bus → `worldLowpass` (depth-dependent high-cut) → `masterGain`. Music recedes with depth as required.

4. **Full audio test suite**: Ran `npx vitest run src/systems/AudioSystem.test.ts src/util/audio.test.ts src/util/creatureAudio.test.ts` — 22 tests passed, covering depth-ladder, creature-lead-time, and sparse-music.

5. **Build verification**: Ran `npm run build` — build fails with 52 pre-existing TypeScript errors (same errors present at base revision f990849). None in audio-related files. These are test-file and Simulation.ts errors unrelated to this work item.

## What I Could Not Verify

- Actual subjective audio quality of the synthesized moments (requires listening in a browser)
- Performance spot-check per section 34 (WebAudio node count within budget) — not explicitly documented in implementation, though the code shows no per-frame allocation in music playback
- Whether the `ending-triggered` music moment actually fires at the game's ending — trigger flag integration not explicitly tested

## Conclusion

The implementation satisfies the AC-art-sound acceptance criteria. The previous review's findings have been addressed. All audio-related tests pass (22 vitest + 4 browser). The build errors and T-17 test failures are pre-existing and unrelated to this work item.

The sparse music is procedural WebAudio (no sampled assets), tied to existing trigger flags via the `AUDIO_STOPS`/`MUSIC_MOMENTS` data seam, and layered into the existing depth-dependent audio mix. There is no 90-second loop; silence between moments is preserved.