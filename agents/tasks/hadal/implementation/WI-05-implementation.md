# WI-05 Implementation — Procedural WebAudio System

Task: hadal
Work item: `agents/tasks/hadal/workitems/WI-05-audio-system.md`
Role: item-implementer
Date: 2026-09-07

## Codegraph Gate

First structural lookup: `codegraph_explore` for the task area
("audiosystem game update boot loop main entry point audiocontext depth player
position renderer"). It located `src/game/Game.ts` (the browser adapter that
owns the `Simulation`, the per-frame `update`/`renderVisuals` loop, and the
`DebugPanelHost`), `src/main.ts` (the entry point that constructs the
`Renderer`/`Game`), and the player/band modules that supply depth and the
depth-band profile. Follow-up `codegraph_explore` calls for
`createSimulation`/`Simulation.step`/`bandProfileAtDepth` and for
`Simulation`/`masterVolume`/`settings` confirmed the sim owns the player's
depth (`player.depth`) and that the save carries `settings.masterVolume`
(request §42) — the audio master-gain seam the slider writes to.

## TDD / Tests

- **New test first:** `src/util/audio.test.ts` (10 tests) for the pure
  mappings — `audioProfileAtDepth` (monotonic depth trends, surface-vs-floor
  contrast, band distinctness, clamping, interpolation, determinism),
  `distanceGain` (1 at the listener, bounded, decays), and `worldPan`
  (0 at the listener, signed by side, bounded). Written before the `AudioSystem`.
- `src/util/audio.ts` (the pure module) and `src/systems/AudioSystem.ts`
  (the `AudioContext` service-provider) make the tests pass.
- Full suite: `npx vitest run` → **13 files / 85 tests pass** (audio.test.ts
  adds 10). `npm run build` (`tsc --noEmit && vite build`) → exit 0.

## Acceptance Evidence Table

| Criterion (work item) | Evidence | Result |
|---|---|---|
| Native `AudioContext` after first input (autoplay-safe) | `src/systems/AudioSystem.ts` `unlock()`; browser probe line 1/2/3 | PASS (code + browser) |
| Helper functions: noise buffer, filtered bursts, oscillator sweeps, low pulses, world-x pan, distance gain, reusable ambient loops | `AudioSystem.noiseBuffer` / `playNoiseBurst` / `playOscSweep` / `playLowPulse` / `createAmbientLoop`; `worldPan` / `distanceGain` in `src/util/audio.ts` | PASS (code + review) |
| Ambient layers: ocean bed, current rumble, hull, sonar ping, breathing, sparse drone/music bed (no obvious 90s loop) | `AudioSystem.buildAmbientLayers` + `playSonarPing` + `droneBed` | PASS (code + review) |
| Depth audio: highs drop, low rumble rises, reverb/delay character changes, distant calls > music | `applyProfile` + `playDistantCall` + `playDepthMotif`; `audioProfileAtDepth` test; browser probe line 4 | PASS (code + unit + browser) |
| Volume slider + master gain; aurally distinct between ≥2 depth bands | `AudioSystem.buildVolumeSlider` / `setMasterVolume`; browser probe line 3/5 + line 4 | PASS (code + browser) |

## Live / External Verification

`agents/tasks/hadal/scratch/item-implementer/WI-05/audio-probe.mjs` boots the
real `npm run dev` page in headless Chromium and reads the debug
`window.__HADAL_AUDIO__` snapshot (the headless audio output is silent, so the
probe asserts on the live audio-graph parameters). All 9 assertions pass:

```
PASS: audio is locked before any input (no AudioContext)  [unlocked=false state=not-created]
PASS: audio unlocks after the first input  [unlocked=true state=running]
PASS: the AudioContext is running after input  [state=running]
PASS: the master volume slider is present in the DOM
PASS: high frequencies drop with depth  [highCutoff 16000 -> 4000]
PASS: low pressure rumble rises with depth  [lowRumble 0.15 -> 0.8]
PASS: reverb/delay grows and the music bed recedes with depth  [reverb 0.15 -> 0.75  drone 0.45 -> 0.13]
PASS: moving the volume slider lowers the master gain  [masterVolume 1 -> 0.3]
PASS: no page exceptions during the probe  [clean]
AUDIO PROBE PASS
```

The existing browser suite (`npm run test:browser`) still passes (4 tests:
boot, keyboard, resize, save) — the `Game` changes (audio field, first-input
listeners, sonar ping on Q) did not regress the boot/save/resize behavior.

## Deviations

- The sonar ping is wired to the Q-edge in `Game.update` (request §6/§27) so
  the layer is audible in the running game; the sonar *ring* and the
  world-signal bus remain WI-06.
- The master volume slider is a minimal DOM control in the bottom-left
  corner (the `settings.masterVolume` save seam from request §42 will
  persist it in a later work item; this work item only requires the slider +
  master gain to be present and functional).

## Files Touched

- `src/util/audio.ts` (new) — pure `AudioProfile` / `AUDIO_STOPS` /
  `audioProfileAtDepth` / `distanceGain` / `worldPan` (Node-testable).
- `src/util/audio.test.ts` (new) — 10 unit tests for the pure mappings.
- `src/systems/AudioSystem.ts` (new) — the `AudioContext` service-provider:
  layered ambient loops, depth-driven high-cut + reverb/delay bus, event
  sounds (breath puffs, hull ticks, distant calls, depth-band motif, sonar
  ping), the §27 helpers, and the master volume slider.
- `src/game/Game.ts` — imports/owns `AudioSystem`, unlocks on the first user
  gesture, feeds the player depth each frame, fires the sonar ping on the Q
  edge, and exposes `window.__HADAL_AUDIO__` under `?debug=1`.
- `src/main.ts` — unchanged (the `Game` drives audio in its frame loop).

## Notes for Reviewer (incl. Shrink/Flatten)

- **Shrink/Flatten (Phase 4):** removed the one-use `connectIntoGain` helper
  (inlined the single sub-rumble noise branch into `buildAmbientLayers`);
  `noiseBuffer()` no longer takes an `AudioContext` argument (it uses
  `this.ctx` internally), collapsing 5 call sites. No other one-use wrappers,
  defensive branches for impossible states, or code-repeating comments found.
- **`AudioSystem.ts` is ~657 lines** but is one concern (the whole audio
  graph) with a flat public surface: `unlock` / `update` / `setMasterVolume` /
  `snapshot` (lifecycle), the §27 helpers (`noiseBuffer`, `playNoiseBurst`,
  `playOscSweep`, `playLowPulse`, `playSonarPing`, `createAmbientLoop`), and
  the private graph builders. The generic §27 helpers are the reusable API for
  WI-10/11 creature audio; the bespoke event methods (`playBreathPuff`,
  `playHullTick`, `playDistantCall`, `playDepthMotif`) are the specific
  ambient events.
- **No per-frame allocation:** the ambient layers are built once in `unlock()`;
  `update()` only ramps node *parameters* via `setTargetAtTime` and schedules
  the sparse events (request §34). Event nodes are short-lived and stop
  themselves.
- **Determinism:** all event timing and the convolution impulse response use
  `createRng` (request §61); there is no `Math.random`.
- **The volume slider** writes `masterVolume`, which is the value the
  `settings.masterVolume` save seam (request §42) will persist later.

## Assumptions

- Headless Chromium (SwiftShader) runs the `AudioContext` in the `running`
  state when unlocked by a real user gesture with
  `--autoplay-policy=no-user-gesture-required`; audio *output* is silent in
  headless, so the probe asserts on graph parameters, not audibility.
- The debug `window.__HADAL_AUDIO__` handle is only set under `?debug=1` and
  does not affect the production game.

## Result

Implemented. All acceptance criteria are met with unit evidence for the pure
mappings and browser evidence for the autoplay-safe unlock, the depth-driven
soundscape, and the volume slider. Build and the full test suite are green;
the existing browser suite is unregressed.

## Handoff

The reusable §27 helper names for WI-10/WI-11 creature audio are on
`AudioSystem`: `noiseBuffer`, `playNoiseBurst`, `playOscSweep`,
`playLowPulse`, `playSonarPing`, `createAmbientLoop`, and the pure
`worldPan`/`distanceGain` in `src/util/audio.ts`. Creature-specific
sound-design content (clicks, sub-bass pulses, scraping, resonant metallic
harmonics) is added in WI-10/WI-11 on this foundation.
