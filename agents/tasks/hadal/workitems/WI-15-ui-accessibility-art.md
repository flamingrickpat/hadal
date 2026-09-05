# WI-15: UI/UX, accessibility, and the full art/audio polish pass

## Identity

- Task: hadal
- Story: implicit
- Owner role: `item-implementer`
- Complexity: medium-high
- Dependencies: WI-14

## Goal

Replace obvious debug geometry in all critical-path areas and polish the full UI/UX (minimal HUD, bathymetry map, context prompts, pause), accessibility options, and per-band art/audio, so the game feels finished and readable at 1920×1080.

## Vision Link

Request §26 (minimal HUD that fades when full; inventory/map overlay that pauses unless it breaks a deliberate encounter; rough bathymetry map — player position, explored silhouettes, base, discovered landmarks, optional death beacon, no creature locations; short context prompts only when necessary), §43 (volume sliders, screen-shake toggle, reduced-flashing toggle, subtitles, high-contrast sonar option, no red/green-only state), §14.3 (per-band distinct palette + particle profile; restraint), §59 (cozy surface vs alien abyss; surface relief after a deep dive), §16 (widescreen). §45/§34 require smooth, readable performance.

## Acceptance Criteria

- [ ] The main HUD is minimal (oxygen, health, depth, selected tool, maybe compact power meter) and fades/hides when full (request §26); the inventory/map overlay pauses the game unless doing so breaks a deliberate encounter (request §26).
- [ ] The map is a rough explored-space bathymetry showing player position, explored chunk silhouettes, base, discovered major landmarks, and the optional death beacon — no creature locations (request §26); context prompts appear only when necessary (request §26).
- [ ] Accessibility options exist: volume sliders (master + layers), screen-shake toggle, reduced-flashing toggle, subtitles/text for radio messages, and a high-contrast sonar outline option if easy; critical state is not red/green-only (request §43).
- [ ] Every depth band has a distinct palette family and particle profile (water color, opacity/visibility, particle size, light attenuation, background silhouette, debris density, organic texture, chromatic-aberration amount, current direction, ambient motion) with restrained post-processing (request §14.3).
- [ ] Obvious debug geometry in all critical-path areas is replaced with the authored art (request §44 phase 7); the surface is cozy by comparison and returning from a deep dive creates relief (request §59).
- [ ] The UI is a small number of DOM nodes (no hundreds of DOM nodes) and the game stays smooth (~60 FPS at 1080p) (request §34).

## Required Evidence

| Criterion | Evidence type | Command or artifact |
|---|---|---|
| Minimal fading HUD + pausing overlay | manual (browser) | HUD fades when full; overlay pauses unless it would break an encounter |
| Bathymetry map + context prompts | manual (browser) | map shows explored silhouettes/base/landmarks/beacon, no creatures; prompts only when needed |
| Accessibility options | manual (browser) | each toggle/slider works; critical state not red/green-only; radio has subtitles |
| Per-band palette + particle profile | manual (browser) | each band is visually (and aurally) distinct; post-processing restrained |
| Debug geometry replaced; smooth UI | manual (browser) | no obvious debug geometry in critical paths; few DOM nodes; ~60 FPS |

## Tests To Write First

- A Vitest test for the map's explored-silhouette state (explored chunk IDs drive what is shown; creature locations are never included) if the map data is factored as logic.

## Live Or External Verification

In a real desktop browser: confirm the HUD fades, the map and prompts behave, every accessibility option works, each depth band looks distinct, the surface feels cozy against the abyss, and there is no obvious debug geometry in critical paths.

## Infrastructure Required

- Start: `npm run dev`
- Restart: re-run `npm run dev`
- Health: HUD/map/prompts behave; accessibility options work; bands distinct; no debug geometry in critical paths; ~60 FPS; no console exceptions
- Timeout: n/a
- Endpoint or MCP: none

## File Pointers

- `src/ui/hud.ts`, `src/ui/menu.ts`, `src/ui/map.ts`, `src/ui/styles.css` (request §26), `src/systems/AudioSystem.ts` (volume sliders, request §43), `src/render/` (per-band art, request §14.3), `src/world/worldData.ts` (band palettes)
- request §14.3, §16, §26, §34, §43, §59

## Architecture And Integration Constraints

New files, L1 + archetype:

- `src/ui/map.ts` — `renders — the explored-space bathymetry overlay`; controller (DOM, few nodes).

Constraints: keep the UI in a small number of DOM elements (request §34); the map never shows creature locations (request §26); per-band art is the final polish on the WI-04/WI-07 palettes (request §14.3). This is the phase-7 "replace debug geometry" pass; the visual/audio identity is already set — this refines it, it does not redesign it.

## Forbidden Substitute Success
- A detailed GPS-style chart that shows creature locations (request §26).
- A HUD that stays full-opacity at all times (request §26).
- Hundreds of DOM nodes for the UI (request §34).
- Leaving obvious debug geometry in critical-path areas (request §44 phase 7).

## Expected Project Knowledge Update

Note the accessibility option set and the map-state rule (no creature locations) in a project note if they extend the spec.

## Fresh-Session Handoff

Enter `item-implementer` mode for this exact work item. Read the task or story state from top to bottom, the project documentation, all passed gate artifacts, this work-item specification, and only then the listed source files.
