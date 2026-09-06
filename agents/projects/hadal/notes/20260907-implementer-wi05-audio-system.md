---
title: WI-05 procedural WebAudio system (depth soundscape, helpers, volume slider)
role: item-implementer
created: 2026-09-07
tags: [audio, webaudio, depth, service-provider, browser, volume]
symbols: [AudioSystem, audioProfileAtDepth, AUDIO_STOPS, distanceGain, worldPan, AudioProfile, playNoiseBurst, playOscSweep, playLowPulse, playSonarPing, createAmbientLoop, noiseBuffer, masterVolume]
files: [src/systems/AudioSystem.ts, src/util/audio.ts, src/game/Game.ts]
---

# Summary

The game's audio is fully procedural (native `WebAudio`, no asset files, no
audio library). A single `AudioSystem` (service-provider) owns one
`AudioContext` that is **created only after the first user input** (the
browser autoplay rules), and synthesizes layered ambient loops whose
parameters ramp with the player's depth, so the soundscape is aurally distinct
across the depth bands. The pure depth→audio, distance→gain and world-x→pan
mappings live in `src/util/audio.ts` and are unit-tested.

# Key Facts

- **Lazy autoplay-safe unlock.** `Game` registers `once`-only
  `pointerdown`/`keydown`/`touchstart` listeners that call
  `AudioSystem.unlock()`. The `AudioContext` is not constructed (and no
  ambient layers are built) until that first gesture, so the page is silent
  before any input (request §27/§70). `unlock()` is idempotent.
- **Depth → soundscape (pure).** `audioProfileAtDepth(depth)` interpolates the
  `AudioProfile` (`highCutoff`, `lowRumble`, `oceanBed`, `currentRumble`,
  `hull`, `reverb`, `drone`, `breathing`) across `AUDIO_STOPS` (depths
  0/1600/4000/7000/10000/12000 — mirroring `src/render/band.ts`). Deeper
  water: `highCutoff` falls (16000→4000), `lowRumble` rises (0.15→0.8),
  `reverb` rises (0.15→0.75), `drone` recedes (0.45→0.13). `AudioSystem.update(player)`
  ramps every node parameter to the profile via `setTargetAtTime` (no
  per-frame allocation). The global high-cut is a lowpass on the world bus;
  the reverb/delay character (short-echo delay + large-space convolver) grows
  with `reverb`.
- **Ambient layers** (`buildAmbientLayers`): ocean bed (lowpassed looping
  noise), current rumble (bandpassed noise + LFO swell), sub-rumble (38 Hz
  sine + low noise + swell), hull (bandpassed noise + scheduled metallic
  ticks), breathing (persistent gain the scheduled puffs route through), and a
  sparse procedural drone bed (three detuned triangle oscillators through a
  lowpass + swell). There is **no looped music track** (request §58); a brief
  harmonic `playDepthMotif` fires when crossing into a new depth band, and
  sparse `playDistantCall` (panned + distance-attenuated) events scale with
  depth so distant calls outweigh the music.
- **Reusable §27 helpers** (the API WI-10/11 creature audio builds on):
  `noiseBuffer()`, `playNoiseBurst(opts)`, `playOscSweep(opts)`,
  `playLowPulse(opts)`, `playSonarPing()` (wired to the Q edge in `Game`),
  `createAmbientLoop(source, filterType, filterFreq, q)`, and the pure
  `worldPan(worldX, listenerX)` / `distanceGain(distance)` in `src/util/audio.ts`.
- **Volume slider + master gain** (request §43): the constructor builds a
  `.audio-volume-slider` range input (bottom-left) that calls
  `setMasterVolume(v)`, which ramps the master gain. `masterVolume` is the
  value the `settings.masterVolume` save seam (request §42) will persist.
- **Browser verification handle:** `window.__HADAL_AUDIO__` (set under
  `?debug=1`) exposes `AudioSystem.snapshot()` →
  `{ unlocked, contextState, depth, masterVolume, highCutoff, lowRumble,
  reverb, drone, oceanBed }` — used by the browser probe because headless
  audio output is silent.

# Navigation

- `src/systems/AudioSystem.ts` — the `AudioContext` owner + graph + helpers.
- `src/util/audio.ts` — the pure, Node-testable mappings (`audioProfileAtDepth`,
  `distanceGain`, `worldPan`, `AUDIO_STOPS`, `AudioProfile`).
- `src/game/Game.ts` — the seam: owns `AudioSystem`, unlocks on first input,
  feeds `player.depth` each frame, fires the sonar ping on Q.
- `src/util/audio.test.ts` — unit tests for the pure mappings.
- `agents/tasks/hadal/scratch/item-implementer/WI-05/audio-probe.mjs` — the
  browser probe (autoplay-safe unlock, depth soundscape, volume slider).

# Gotchas

- **`?debug=1` panel toggles on any keydown** (`src/util/debug.ts`
  `panelToggle`). A key press used to unlock audio also closes the debug panel
  and hides `.debug-teleport-x`. Use a **mouse click** (a `pointerdown`
  gesture) to unlock audio in browser probes, so the panel stays open for
  teleporting.
- Headless Chromium (SwiftShader) has **no audible output**; verify audio via
  the `window.__HADAL_AUDIO__` snapshot (graph parameters), not audibility.
  The probe launches with `--autoplay-policy=no-user-gesture-required` so the
  `AudioContext` reaches the `running` state.
- All event timing and the convolution impulse response use `createRng`
  (deterministic, request §61); there is no `Math.random` in the audio path.

# Commands

- Unit: `npx vitest run src/util/audio.test.ts`
- Full suite: `npm test` (13 files / 85 tests)
- Build: `npm run build`
- Browser suite: `npm run test:browser`
- Browser probe: `node agents/tasks/hadal/scratch/item-implementer/WI-05/audio-probe.mjs`
