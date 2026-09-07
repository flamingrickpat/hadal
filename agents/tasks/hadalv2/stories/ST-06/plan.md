---
id: ST-06
kind: story
parent: null
children: ["WI-06a", "WI-06b", "WI-06c", "WI-06d", "WI-06e", "WI-06f", "WI-06g"]
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

# ST-06 — Full art/audio pass

## Goal

Run the full art and audio pass (request phase 7) across all critical-path
areas on the stable ST-04/ST-05 content: per-band visual identity (sections
14, 15, 59), debug-geometry replacement plus the section 48 juice list,
depth audio (sections 27, 58), the section 26 bathymetry map overlay, and
the section 43 accessibility controls. Restraint on post-processing; no new
gameplay rules, no balance tuning.

## Why this shape (review split)

The review split this empty story. Presentation work is inherently per-scene,
so each child names its scenes/bands and the inspection evidence it records.
Every child carries strictly fewer than the parent's six criteria and a
strict subset of its four subsystems:

- WI-06a: surface + coast band identity (sections 14.3, 15) and the
  section 59 cozy surface baseline and return relief.
- WI-06b: mid bands identity (sections 14.3, 15).
- WI-06c: deep bands + final zone identity (sections 14.3, 15);
  inspected under the section 70 spoiler rule. The section 16
  scale-reveal zoom for select colossal encounters is owned by each band
  item for the encounters staged in its own bands (if any).
- WI-06d: debug-geometry replacement in all critical-path areas, the
  section 48 juice list, and the section 16 low-frequency shake rules and
  widescreen behavior.
- WI-06e: depth audio (sections 27, 58): depth-based mixing, creature
  sound vocabulary, sparse music.
- WI-06f: section 26 bathymetry map overlay.
- WI-06g: section 43 accessibility controls with save persistence.

## Criteria assignment and proof ownership

Children carry parent criteria verbatim; the union covers all six.

- AC-art-palettes: WI-06a, WI-06b, WI-06c (each proves its own bands in
  the browser). Final proof owner: WI-06d - after all three band passes it
  walks every critical-path area and records the cross-band contrast
  (each band distinct in at least two identity factors, section 14.1
  hybrid reading at 1080p). No other child re-asserts the cross-band part.
- AC-art-contrast: WI-06a alone. Final proof owner: WI-06a.
- AC-art-geometry: WI-06d alone. Final proof owner: WI-06d.
- AC-art-sound: WI-06e alone. Final proof owner: WI-06e.
- AC-art-map: WI-06f alone. Final proof owner: WI-06f.
- AC-art-a11y: WI-06g alone. Final proof owner: WI-06g.

## Dependencies and execution order

- The story depends on ST-04/ST-05 so there is stable content to dress;
  do not art a band whose encounters are still moving.
- WI-06a, WI-06b, WI-06c are parallel.
- WI-06d depends on WI-06a, WI-06b, WI-06c: geometry replacement and juice
  must be tuned against the settled band look, and it owns the AC-art-
  palettes cross-band proof.
- WI-06e depends on WI-06a, WI-06b, WI-06c: the "audible well before
  visible" lead time is measured against the final band visibility and
  attenuation, which the band passes set.
- WI-06f depends on WI-04b (ST-04's landmark ids feed the
  discovered-landmark markers); its other inputs (explored chunks, base,
  player position) already exist in the baseline simulation. It can run in
  parallel with the band chain.
- WI-06g depends on WI-04b (radio-message content for the subtitles) and
  WI-06d (the shake rules it must gate); it finishes last among the
  story's leaves.
- Feeds ST-07: this story keeps the section 34 budgets but does not own
  the balance numbers; ST-07 measures the largest encounter.

## Scope inventory (honest, carried into the children)

- Band identity per section 14.3: water color, visibility, particle size,
  light attenuation, background silhouettes, debris density, current
  direction, ambient motion - at least two differ per band (section 1.1 is
  the design pillar).
- Flashlight behavior per section 15: no pure-black screens; biological
  sources reveal geometry from behind.
- Audio per sections 27 and 58: procedural WebAudio layers, depth-based
  mixing, creature sound vocabulary (clicks, sub-bass, scraping, resonant
  harmonics - not everything roaring), sparse music, no 90-second loop.
  Extend `src/systems/AudioSystem.ts`; do not rebuild it.
- Juice per section 48; the section 35 effects toolbox already partially
  exists in `src/render/` (particles, postfx, sonar) - extend, do not
  rebuild.
- Camera polish per section 16: scale-reveal zoom (WI-06c), low-frequency
  shake rules and widescreen behavior (WI-06d).
- Map overlay per section 26: Tab-bound, pauses the game, rough
  explored-space silhouettes (not a GPS chart), player position, base,
  discovered major landmarks, optional death beacon, never creature
  locations. The baseline tracks `discoveredChunks` in the simulation
  (`Simulation.ts`, saved in `save.world.discoveredChunks`), so the
  overlay reads existing state; landmark discovery tracking comes from
  WI-04b; a death beacon is shown only if a story (section 25) adds beacon
  tracking. The stale "(WI-15)" comment in `src/ui/hud.ts` refers to this
  overlay.
- Accessibility per section 43: master volume slider (exists since the
  baseline WI-05 audio work - that is a baseline work item, not the ST-05
  story - `save.settings.masterVolume`), screen shake toggle, reduced
  flashing toggle, subtitles/text for radio messages, high-contrast sonar
  option if easy. New setting fields extend the versioned save settings;
  the section 42 migration stays trivial.

## Constraints and non-goals

- Restraint on post-processing (section 14.3); readability at 1920x1080 in
  motion is the bar.
- No new gameplay rules in this story; the map overlay and accessibility
  toggles read or track presentation state only (the same pattern as
  `discoveredChunks`). If art work exposes a real simulation gap, file it
  as a defect, not a scope grab.
- No balance tuning, no new content (sections 44 phase 7 scope only).
- Spoiler rule for inspection: late-game presentation is inspected with
  private fixtures and reported without names (section 70).

## Fresh-session handoff (for reviewers of the children)

Each child stands alone with its frontmatter plus this story. Read request
sections 14, 15, 16, 26, 27, 35, 43, 48, 58, 59; `src/render/`, `src/ui/`
(hud.ts, menu.ts), `src/systems/AudioSystem.ts`, and the save settings
schema in `src/game/save.ts`; `understanding.md` for the existing visual
language baseline. Inspect in the real browser; record defects with scene
and reproduction steps.
