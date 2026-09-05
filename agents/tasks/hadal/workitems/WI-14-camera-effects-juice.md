# WI-14: Camera, effects toolbox, juice, and post-processing

## Identity

- Task: hadal
- Story: implicit
- Owner role: `item-implementer`
- Complexity: medium-high
- Dependencies: WI-12

## Goal

Add the camera rig (smooth follow, lead, speed/encounter zoom, scale reveals, widescreen handling, restrained shake) and the effects/juice toolbox (bubbles, silt, sonar ring, bioluminescent motes, vignettes, grain, silhouette/foreground layers, camera lean), so the largest encounters read as huge and the moment-to-moment feedback makes the game feel finished.

## Vision Link

Request §16 (camera: 0.12–0.2 s lag, lead toward aim/velocity, speed/encounter zoom, clamp to bounds; scale reveals widening framing 10–30% for colossal encounters; low-frequency shake for distant impacts, short impulses for near collisions; 16:9 design tolerating 21:9 by widening visibility, aggro by world distance), §35 (effects toolbox), §48 (moment-to-moment juice; no excessive floating damage numbers), §52 (making enormous organisms work in 2D). §45/§34 require smooth performance in the largest encounter.

## Acceptance Criteria

- [ ] The camera smoothly follows with 0.12–0.2 s lag, leads toward aim/velocity, zooms by speed and encounter state, and clamps to world bounds (request §16).
- [ ] For select colossal encounters the camera framing very gradually widens 10–30% without announcing it, making the scene feel too large for normal framing (request §16, §52).
- [ ] Camera shake is restrained: low-frequency displacement for distant impacts/calls, short impulses for nearby collisions; no abuse (request §16); a screen-shake toggle exists (request §43).
- [ ] Widescreen: design at 16:9 and tolerate 21:9 by widening horizontal visibility, not stretching UI; offscreen AI aggro is by world distance, not screen edge (request §16).
- [ ] The effects toolbox exists and is reused: bubble emitter, marine snow, silt cloud, sonar ring, sonar outline flash, electrical arc, flashlight cone, bioluminescent motes, pressure/damage vignettes, restrained chromatic split, screen-space grain, low-frequency shake, distant-silhouette layer, foreground occluder pass (request §35).
- [ ] Moment-to-moment juice is present (acceleration bubbles, silt puff near seabed, resource fragments pulling at close range, tool recoil/tether snap, sonar echo particles, suit-light sway, depth-record UI tick, faint vibration for distant giant motion, predators visibly committing before contact, impact particles following local current, camera lean, ambient schools parting around the player) without excessive floating damage numbers (request §48).
- [ ] The largest creature encounter stays smooth (~60 FPS at 1080p) (request §34, §45).

## Required Evidence

| Criterion | Evidence type | Command or artifact |
|---|---|---|
| Camera follow/lead/zoom/clamp | manual (browser) | swim and aim; camera lags 0.12–0.2 s, leads, zooms, clamps to bounds |
| Scale reveal on colossal encounter | manual (browser) | during a colossal encounter the framing widens 10–30% without announcement |
| Widescreen + world-distance aggro | manual (browser) | at 21:9 visibility widens, UI not stretched; a creature aggroes by world distance offscreen |
| Effects toolbox + juice | manual (browser) | the §35 effects and §48 juice are visible; no excessive floating damage numbers |
| Smooth largest encounter | manual (browser) | ~60 FPS during the largest creature event |

## Tests To Write First

- A Vitest test for the camera lag/lead/zoom math (deterministic) if factored as pure functions; the visual effects are verified manually.

## Live Or External Verification

In a real desktop browser: swim and aim (camera feel), trigger a colossal encounter (scale reveal), set 21:9 (widescreen + world-distance aggro), and confirm the effects/juice are present and the largest encounter stays smooth.

## Infrastructure Required

- Start: `npm run dev`
- Restart: re-run `npm run dev`
- Health: camera feel correct; scale reveal + widescreen work; effects/juice present; smoothest on largest encounter; no console exceptions
- Timeout: n/a
- Endpoint or MCP: none

## File Pointers

- `src/render/CameraRig.ts` (request §16), `src/render/postfx.ts` (restrained, request §35), `src/render/particles.ts` (request §35), `src/systems/` (effects/juice emitters, request §35/§48), `src/ui/` (depth-record UI tick, request §48)
- request §16, §34, §35, §43, §48, §52

## Architecture And Integration Constraints

New files, L1 + archetype:

- `src/render/CameraRig.ts` — `frames — the orthographic camera around the player with lead, zoom, and scale reveals`; service-provider.

Constraints: post-processing stays restrained — heavy bloom on everything is rejected (request §14.1, §72); aggro is by world distance, not screen edge (request §16). The scale reveal and the §52 staging techniques are load-bearing for the WI-11/WI-12 spectacle beats. Performance rules (request §34) hold for the largest encounter.

## Forbidden Substitute Success
- A camera that snaps with no lag/lead/zoom (request §16).
- Heavy bloom everywhere muddying the art (request §14.1, §72).
- UI stretched on 21:9 or aggro keyed to the screen edge (request §16).
- A "largest encounter" that is only smooth because the creature was hidden (request §45).

## Expected Project Knowledge Update

Note the camera scale-reveal API and the effects/juice emitter names in a project note so the balance pass (WI-16) can tune them.

## Fresh-Session Handoff

Enter `item-implementer` mode for this exact work item. Read the task or story state from top to bottom, the project documentation, all passed gate artifacts, this work-item specification, and only then the listed source files.
