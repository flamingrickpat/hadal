# Review: WI-05-audio-system

Status: pass

Task: hadal
Work item: `agents/tasks/hadal/workitems/WI-05-audio-system.md`
Reviewed at: HEAD `58536b7` (`[audio][webaudio] Procedural WebAudio system with depth soundscape and volume slider`)
Reviewer: work-item-reviewer, 2026-09-07

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| Native `AudioContext` initialized only after the first user input (autoplay-safe) | pass | `AudioSystem.unlock()` is the only `new AudioContext` site; `Game` registers `pointerdown`/`keydown`/`touchstart` with `{ once: true }` (Game.ts:79-81). Reviewer probe hooks the constructor: `acCount` 0 before any gesture, exactly 1 after; `contextState` `not-created` → `running`. |
| Helper functions: noise buffer, filtered noise bursts, oscillator sweeps, low pulses, stereo pan by world x, gain by distance, reusable ambient loops | pass | Code: `AudioSystem.noiseBuffer` / `playNoiseBurst` / `playOscSweep` / `playLowPulse` / `playSonarPing` / `createAmbientLoop` (AudioSystem.ts:200-326) + pure `worldPan` / `distanceGain` (audio.ts:96-108). All §27 helpers present. |
| Ambient layers: ocean bed, current rumble, hull/equipment, sonar ping, breathing, sparse procedural drone/music bed; no obvious 90-second looped track | pass | Code: `buildAmbientLayers` (AudioSystem.ts:381-411) builds ocean bed / current rumble / sub-rumble / hull / breathing / drone bed; `playSonarPing` is wired to the Q edge (Game.ts:102). Reviewer probe: 4 looping `BufferSource`s, max looping buffer duration **2.00 s** (all short noise beds), drone bed is oscillator-based (7 oscillators) — no long looping music track. |
| As depth increases: highs reduced, low rumble rises, reverb/delay changes, distant calls outweigh music | pass | Unit: `audio.test.ts` (monotonic depth trends, surface-vs-floor contrast). Reviewer probe (node-level): `worldLowpass.frequency` 15993 → 4297, `reverbSend.gain` 0.105 → 0.515 + `convWet.gain` 0.120 → 0.588, `hullGain.gain` 0.0718 → 0.0228. `playDistantCall` level scales with `lowRumble` while `drone` recedes (0.45 → 0.04). |
| A volume slider + master gain present; aurally distinct between ≥2 depth bands | pass | Reviewer probe: `.audio-volume-slider` in the DOM; moving it changes the **actual** `masterGain.gain` node 1.000 → 0.300. Unit: band-distinctness test (all 8 `AudioProfile` keys differ between depth 0 and 7000). |

## Findings

1. (Minor, non-blocking) The `Game` L2 `owns` list (`src/game/Game.ts:11-14`) names the owned browser glue — "the Simulation, the Three.js scene/world/mesh, the HUD, the crafting menu, and the `localStorage` autosave adapter" — but does not name the `AudioSystem` the class now owns (the `audio` field, the first-input `unlock` listeners, the sonar ping on the Q edge, and the `__HADAL_AUDIO__` handle). Per the contract-update threshold rule (a new owned concern was added), the L2 `owns` list should name the audio system. This is a documentation gap, not a functional defect: the new-file contract for `AudioSystem.ts` itself is correct and complete, the work item's architecture constraint (a new `AudioSystem.ts` service-provider with L1 + archetype) is met, and no work-item contract term is violated. The audio is arguably part of "the browser glue" the list already names generically, so this is advisory — flag for a later cleanup rather than a rework of this work item.

## Impact Check

- `AudioSystem` (new, `src/systems/AudioSystem.ts`) — constructed only in `Game.ts:73`; its public methods (`unlock` / `playSonarPing` / `update` / `setMasterVolume` / `snapshot`) are called only from `Game.ts`. No other production callers.
- `src/util/audio.ts` pure module (new) — `audioProfileAtDepth` / `distanceGain` / `worldPan` / `AUDIO_STOPS` are imported only by `AudioSystem.ts` and `audio.test.ts`.
- `Game` (modified, `src/game/Game.ts`) — constructed only in `main.ts:9`. The changes are **additive**: a new `audio` field, three `once` gesture listeners, the sonar ping on the Q edge in `update`, `__HADAL_AUDIO__` under `?debug`, and `audio.update` in `renderVisuals`. No existing gameplay path is altered. The new `AudioSystem` constructor adds a `#audio-volume` DOM node + `<style>` to `document.body` at boot (the slider), which does not block input.
- codegraph blast radius: `World` (3 callers in `Game.ts`) and `worldBounds` (2 callers in `World.ts`) are untouched by this work item.
- Depth-stop alignment: `AUDIO_STOPS` depths (0/1600/4000/7000/10000/12000) exactly mirror the visual `BAND_STOPS` (verified in `band.ts:70-179`), so the audio bands line up with the visual bands (request §14.3) as the `audio.ts` L2 invariant claims.
- `main.ts` (unchanged) drives the frame loop: fixed-step `game.update(FIXED_DT)` + per-frame `game.renderVisuals` (where `audio.update` lives), so the ambient graph ramps every display frame.

## Independent Adversarial Probes

All run at HEAD `58536b7`; the working tree is clean.

- **Unit suite** — `npx vitest run` → 13 files / **85 tests pass** (incl. `audio.test.ts` 10 tests). Exit 0.
- **Build** — `npm run build` (`tsc --noEmit && vite build`) → **exit 0** (the >500 kB chunk notice is the three.js bundle, informational).
- **Implementer's browser probe** — `node agents/tasks/hadal/scratch/item-implementer/WI-05/audio-probe.mjs` → 9/9 PASS (silent-before-input, unlock-after-click, context running, slider present, high-cut/low-rumble/reverb-drone change with depth, slider lowers master, no page exceptions).
- **Reviewer probe (independent)** — `node agents/tasks/hadal/scratch/work-item-reviewer/WI-05/probe.mjs` → **12/12 PASS**. Boots the real `npm run dev` page in headless Chromium and hooks `AudioContext` construction + `createBufferSource` + `createOscillator`, then reads the **live WebAudio node values** (not just the `snapshot()` field) so it can distinguish the literal request from the implementation's interpretation:
  - no `AudioContext` constructed before any gesture (`acCount=0`, 0 bufferSources/oscillators); exactly 1 after (`acCount=1`), `contextState` `running` — confirms lazy init at the construction level, not just the `unlocked` field.
  - all 11 ambient layer nodes present after input (`worldBus`/`worldLowpass`/`reverbSend`/`convWet`/`masterGain`/`oceanBedGain`/`currentGain`/`subRumbleGain`/`hullGain`/`breathGain`/`droneGain`).
  - **no long looping music track**: max looping buffer duration **2.00 s** (4 looping noise beds); the drone bed is oscillator-based (7 oscillators) — directly falsifies the "a single looping music track" substitute (request §58).
  - node-level depth change: `worldLowpass` 15993 → 4297 (highs drop), `reverbSend` 0.105 → 0.515 + `convWet` 0.120 → 0.588 (reverb/delay character grows), `hullGain` 0.0718 → 0.0228 (equipment recedes with depth).
  - the volume slider changes the **actual** `masterGain.gain` node 1.000 → 0.300 (not just the `masterVolume` field).
  - no page exceptions.
- **Determinism** — `src/util/audio.ts` and `AudioSystem.ts` use only `createRng` (seeds `0x5eaf0` / `0x11ce` / `0xa0d10`); no `Math.random` in the audio path (verified by code read + the `audio.test.ts` determinism test).

## What I Could Not Verify

- **True audibility** — headless Chromium (SwiftShader) has no audible output, so the perceived soundscape and the human-ear "aurally distinct between two depth bands" claim cannot be confirmed headlessly. Verified as far as possible: all 8 `AudioProfile` keys differ between depth 0 and 7000, and the live node parameters change with depth. The request §14.3/§70 manual browser audio inspection is the end-to-end contract and remains a manual verification item.
- **Distant-calls-outweigh-music** — a design consequence (`playDistantCall` level scales with `lowRumble` while `drone` recedes) verified by code read + the unit-tested profile, not a direct unit test of the scheduled event. The work item's "Tests To Write First" only requires unit tests of the deterministic pure mappings, which are present and pass.
- The **TDD ordering** ("test written first") is claimed in the implementation note but not independently verifiable from the single squash commit; the tests are present and would fail without the implementation, which is what matters.

## Assumptions

- Headless Chromium runs the `AudioContext` in the `running` state when unlocked by a real user gesture under `--autoplay-policy=no-user-gesture-required`; audio *output* is silent in headless, so the probes assert on the live graph parameters, not audibility. (Matches the implementer's assumption; consistent with the project `BUILD.md` note that headless audio output is silent.)
- The `__HADAL_AUDIO__` debug handle (set only under `?debug`) does not affect the production game; it is the headless audio-verification seam.
- The master-volume slider writes `masterVolume`, which a later work item (request §42 save seam) will persist; this work item only requires the slider + master gain to be present and functional, which they are.
