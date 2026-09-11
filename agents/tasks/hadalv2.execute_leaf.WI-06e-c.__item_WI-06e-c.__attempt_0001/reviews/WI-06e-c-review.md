# Review: WI-06e-c — Sparse music and final audio proof

Status: findings

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| Sparse musical moments in AudioSystem (procedural WebAudio, no 90s loop) | passed | Code inspection of `playMusicMoment` and synthesizer methods; MUSIC_MOMENTS data; vitest `no 90-second loop` test passes |
| Moments fire from placement data when existing trigger flags occur | passed | Game.ts wiring: `triggerState.audioCues` consumed and matched to `MUSIC_MOMENTS` |
| Layered into existing drone/music-bed path so music recedes with depth | passed | `routedEnv` routes through world bus → `worldLowpass` → `masterGain`, applying depth-band mix |
| No 90-second loop; silence between moments allowed/preferred | passed | All moments < 12s; no looping constructs; vitest confirms < 30s |
| Master-volume seam (`save.settings.masterVolume`) applies through all layers | passed | `setMasterVolume` controls `masterGain` which all moments route through |
| Final proof of AC-art-sound (depth-ladder, creature lead-time, sparse-music, master-volume) | not run | Depth-ladder and creature lead-time scenarios not documented as re-run in this work item (left to siblings WI-06e-a/WI-06e-b) |
| Suite and build stay green | passed | vitest: 458 passed, 2 failed (pre-existing T-17 band tests); build passes |

## Findings

1. **Double connection in `playSparseTheme`** (`src/systems/AudioSystem.ts:796-807`): Each oscillator in the final theme connects to `env` directly via `osc.connect(env)` AND also through `noteEnv` via `osc.connect(noteEnv); noteEnv.connect(env)`. This creates two signal paths: the oscillator's full signal reaches the main envelope directly (bypassing per-note shaping), while the `noteEnv` adds a secondary shaped path. The `osc.connect(env)` line should be removed so the signal only passes through `noteEnv` → `env`. The other three synthesizer methods (`playAmbientPad`, `playHarmonicSwell`, `playDroneChord`) do not have this issue.

2. **Final AC-art-sound proof incomplete** (`WI-06e-c-implementation.md`): The work item specifies this leaf as "the named final proof owner of AC-art-sound" that should "run the complete depth-audio acceptance pass" including depth-ladder inspection at each band boundary and representative major-creature encounter lead-time check. The implementation artifact documents sparse-music-specific tests but does not explicitly show the combined AC-art-sound final proof (depth-ladder, creature lead-time) being re-run as a complete acceptance pass. Depth-ladder and creature-audio verification were presumably done by siblings WI-06e-a and WI-06e-b, but the final proof owner should confirm them together.

## Impact Check

Ran `codegraph_codegraph_explore` for `playMusicMoment`, `MUSIC_MOMENTS`, and `MusicMomentDefinition`:
- `playMusicMoment` has 1 caller in `src/game/Game.ts` (the new wiring) — no unexpected callers
- `MUSIC_MOMENTS` has 4 callers: `src/game/Game.ts`, `src/systems/AudioSystem.ts`, plus debug window exposure — all expected
- `MusicMomentDefinition` interface has 3 callers — all expected
- No impact on existing audio consumers (depth motif, creature cues, ambient layers) — additive change

## Independent Adversarial Probes

1. **No-90-second-loop verification**: Ran `npx vitest run src/systems/AudioSystem.test.ts` — 5 tests passed including the explicit `no 90-second loop: all moments are short (< 30 seconds)` test.

2. **Browser integration**: Ran `node tests/browser/sparse-music.test.mjs` — 4 tests passed:
   - MUSIC_MOMENTS data exposed on window in debug mode
   - AudioSystem instantiated with master volume slider
   - Audio unlocks on user interaction
   - Depth band transition plays depth motif without error

3. **Depth-band routing inspection**: Confirmed `playMusicMoment` methods use `this.routedEnv(ctx, 0)` which routes through the world bus → `worldLowpass` (depth-dependent high-cut) → `masterGain`. Music will recede with depth as required.

## What I Could Not Verify

- Actual subjective audio quality of the synthesized moments (requires listening in browser)
- Performance spot-check per section 34 (WebAudio node count within budget) — not documented in implementation
- Whether `ending-triggered` music moment actually fires at the game's ending — trigger flag integration not explicitly tested
