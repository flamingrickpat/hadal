---
id: ST-06
kind: story
parent: null
children: []
depends_on: ["ST-04", "ST-05"]
criteria:
  AC-art-palettes: "Every depth band has a distinct palette family, particle profile, light attenuation, and background silhouette in the browser, with the section 14.1 graphic-novel/sonar/cut-paper hybrid reading at 1080p"
  AC-art-sound: "Depth audio changes with depth (high-frequency roll-off, low-frequency pressure rumble, altered reverb) and major creatures are audible well before visible, with sparse music per section 58"
  AC-art-geometry: "Obvious debug geometry is replaced in all critical-path areas and the section 48 juice list (bubbles, silt, light sway, depth-record tick, distant-motion impulse, parting schools) is present"
  AC-art-contrast: "The surface zone reads as a cozy baseline and returning to it after a deep dive creates relief, per section 59"
  AC-art-map: "The section 26 bathymetry map opens on Tab and pauses the game; it shows the player position, explored chunk silhouettes from the tracked discoveredChunks state, the base, discovered major landmarks, and a death beacon only if one is tracked, and it never shows creature locations; verified in the browser"
  AC-art-a11y: "The section 43 accessibility controls work and persist through a save round-trip: master volume slider, screen shake toggle, reduced flashing toggle, and text subtitles for radio messages, plus a high-contrast sonar option if easy or a recorded cut; verified in the browser"
behavior: "Run the full art and audio pass (request phase 7, sections 14, 15, 26, 27, 43, 48, 58, 59) across all critical-path areas, keeping restraint with post-processing"
subsystems: ["rendering and materials", "audio system", "world content data", "UI overlays and settings"]
verification: "Live browser inspection per band and per major encounter (composition, readability, atmosphere, audio) with recorded observations; browser checks for the Tab map overlay (contents, pause behavior, no creature markers) and for the section 43 toggles persisting through a save round-trip; headless suite and build stay green; performance spot-checks per section 34"
---

# ST-06 — Full art/audio pass (UNEXPANDED)

## Status

Explicit expansion task. Split in a future planning session; natural split
by band (surface+coast, mid bands, deep bands, final zone) plus one audio
item, one map-overlay item (section 26), and one accessibility item
(section 43). Presentation work is inherently per-scene, so each child
should name its scenes and the inspection evidence it records.

## Scope inventory (honest)

- Distinct band identity per section 14.3: water color, visibility,
  particle size, light attenuation, background silhouettes, debris density,
  current direction, ambient motion - at least two of these differ per band
  (section 1.1 is the design pillar behind it).
- Flashlight behavior per section 15: no pure-black screens; biological
  sources reveal geometry from behind.
- Audio per sections 27 and 58: procedural WebAudio layers, depth-based
  mixing, creature sound vocabulary (clicks, sub-bass, scraping, resonant
  harmonics - not everything roaring), sparse music, no 90-second loop.
- Juice per section 48 across the whole game; effects toolbox from section
  35 already partially exists in `src/render/` (particles, postfx, sonar) -
  extend, do not rebuild.
- Camera polish per section 16: scale-reveal zoom for select colossal
  encounters, low-frequency shake rules, widescreen behavior.
- Bathymetry map overlay per section 26: Tab-bound, pauses the game, rough
  explored-space silhouettes (not a GPS chart), player position, base,
  discovered major landmarks, optional death beacon, never creature
  locations. The baseline already tracks `discoveredChunks` in the
  simulation (`Simulation.ts`, saved in `save.world.discoveredChunks`), so
  the overlay reads existing state; landmark discovery tracking comes from
  ST-04's landmark data, and a death beacon is shown only if a story
  (section 25) adds beacon tracking. The stale "(WI-15)" comment in
  `src/ui/hud.ts` refers to this unbuilt overlay.
- Accessibility per section 43: master volume slider (exists since the
  WI-05 audio work, `save.settings.masterVolume`), screen shake toggle,
  reduced flashing toggle, subtitles/text for radio messages, and a
  high-contrast sonar option if easy. Toggles persist in the versioned
  save settings; adding setting fields keeps the section 42 migration
  trivial.

## Dependencies and boundaries

- Depends on ST-04/ST-05 so there is stable content to dress; do not art a
  band whose encounters are still moving.
- The map overlay needs ST-04's landmarks (AC-enc-story) for the
  discovered-landmark markers; its other inputs (explored chunks, base,
  player position) already exist in the baseline simulation.
- ST-07 measures performance in the largest encounter; this story keeps the
  section 34 budgets but does not own the balance numbers.
- Spoiler rule for inspection: late-game presentation is inspected with
  private fixtures and reported without names (section 70).

## Constraints and non-goals

- Restraint on post-processing (section 14.3); readability at 1920x1080 in
  motion is the bar.
- No new gameplay rules in this story; the map overlay and accessibility
  toggles read or track presentation state only (the same pattern as
  `discoveredChunks`). If art work exposes a real simulation gap, file it as
  a defect, not a scope grab.
- No balance tuning, no new content (sections 44 phase 7 scope only).

## Fresh-session handoff for the expander

Read request sections 14, 15, 16, 26, 27, 35, 43, 48, 58, 59; `src/render/`,
`src/ui/` (hud.ts, menu.ts — the stale "(WI-15)" comment in hud.ts names the
unbuilt map overlay), `src/systems/AudioSystem.ts`, and the save settings
schema in `src/game/save.ts`; `understanding.md` for the existing visual
language baseline from WI-07. Inspect in the real browser; record defects
with scene and reproduction steps.
