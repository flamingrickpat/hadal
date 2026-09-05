# WI-05: Procedural WebAudio system and per-depth soundscape

## Identity

- Task: hadal
- Story: implicit
- Owner role: `item-implementer`
- Complexity: medium
- Dependencies: WI-01

## Goal

Build an asset-light, procedural WebAudio system with reusable helpers and layered ambient sounds that change with depth, so audio can carry the atmosphere and announce creatures before they are seen.

## Vision Link

Request §27 (layers, depth audio, creature sound design, native `AudioContext`, init after first input, helper functions, distance/pan), §58 (sparse procedural music), §43 (volume sliders). §45/§70 require audio to start after input and be aurally distinct per depth band (§14.3).

## Acceptance Criteria

- [ ] A native `AudioContext` is initialized only after the first user input, respecting browser autoplay restrictions (request §27, §70).
- [ ] Helper functions exist for: noise buffer; filtered noise bursts; oscillator sweeps; low-frequency pulses; stereo pan by world `x`; gain by distance; reusable ambient loops (request §27).
- [ ] Ambient layers exist: deep filtered ocean bed, current rumble, subtle hull/equipment sound, sonar ping, breathing, and a sparse procedural drone/music bed (request §27, §58); no obvious 90-second looped track (request §58).
- [ ] As depth increases, high frequencies are reduced, low-frequency pressure rumble increases, and reverb/delay character changes; distant creature calls become more important than music (request §27).
- [ ] A volume slider (and a master gain) is present (request §43); audio is aurally distinct between at least two depth bands (request §14.3).

## Required Evidence

| Criterion | Evidence type | Command or artifact |
|---|---|---|
| AudioContext after first input | manual (browser) | load page (silent), then click/key (audio unlocks); reviewer confirms lazy init |
| Helper functions + layers | workflow (code + review) | `src/systems/AudioSystem.ts` exposes the §27 helpers and §27/§58 layers; reviewer confirms no looped track |
| Depth-based audio change | manual (browser) | descend; highs drop, low rumble rises, reverb changes |
| Volume slider | manual (browser) | slider changes master gain; aurally distinct bands confirmed |

## Tests To Write First

- A small Vitest test for the deterministic parts (e.g., depth→filter-frequency and distance→gain mappings), if factored as pure functions. Audio output itself is verified manually.

## Live Or External Verification

In a real desktop browser: confirm audio is silent until the first input, then confirm the ambient layers play, that descending changes the soundscape, and that the volume slider works.

## Infrastructure Required

- Start: `npm run dev`
- Restart: re-run `npm run dev`
- Health: audio unlocks after input; ambient layers audible; no console exceptions
- Timeout: n/a
- Endpoint or MCP: none

## File Pointers

- `src/systems/AudioSystem.ts` (request §27), `src/util/` (pure audio mapping helpers if factored)
- request §27, §43, §58, §14.3, §70

## Architecture And Integration Constraints

New files, L1 + archetype:

- `src/systems/AudioSystem.ts` — `synthesizes — procedural WebAudio layers from pure mapping functions`; service-provider (owns the AudioContext + helpers).

Constraints: native `AudioContext`; no audio library unless clearly useful (request §27). Music is sparse and procedural (request §58). The AudioContext must be created/resumed after first input (request §27, §70). Creature-specific sound design content is added in WI-10/WI-11 on this foundation.

## Forbidden Substitute Success

- A single looping music track playing throughout (request §58 forbids it).
- Audio that starts before any user input (autoplay violation).
- A "depth soundscape" that is the same ambience at every depth.

## Expected Project Knowledge Update

Note the WebAudio init-after-input handling and any autoplay gotcha in a project note; note the reusable helper names for later creature audio.

## Fresh-Session Handoff

Enter `item-implementer` mode for this exact work item. Read the task or story state from top to bottom, the project documentation, all passed gate artifacts, this work-item specification, and only then the listed source files.
