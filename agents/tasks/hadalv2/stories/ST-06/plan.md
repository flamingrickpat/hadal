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
behavior: "Run the full art and audio pass (request phase 7, sections 14, 15, 27, 48, 58, 59) across all critical-path areas, keeping restraint with post-processing"
subsystems: ["rendering and materials", "audio system", "world content data"]
verification: "Live browser inspection per band and per major encounter (composition, readability, atmosphere, audio) with recorded observations; headless suite and build stay green; performance spot-checks per section 34"
---

# ST-06 — Full art/audio pass (UNEXPANDED)

## Status

Explicit expansion task. Split in a future planning session; natural split
by band (surface+coast, mid bands, deep bands, final zone) plus one audio
item. Presentation work is inherently per-scene, so each child should name
its scenes and the inspection evidence it records.

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

## Dependencies and boundaries

- Depends on ST-04/ST-05 so there is stable content to dress; do not art a
  band whose encounters are still moving.
- ST-07 measures performance in the largest encounter; this story keeps the
  section 34 budgets but does not own the balance numbers.
- Spoiler rule for inspection: late-game presentation is inspected with
  private fixtures and reported without names (section 70).

## Constraints and non-goals

- Restraint on post-processing (section 14.3); readability at 1920x1080 in
  motion is the bar.
- No new gameplay rules in this story; if art work exposes a simulation
  gap, file it as a defect, not a scope grab.
- No balance tuning, no new content (sections 44 phase 7 scope only).

## Fresh-session handoff for the expander

Read request sections 14, 15, 16, 27, 35, 48, 58, 59; `src/render/` and
`src/systems/AudioSystem.ts`; `understanding.md` for the existing visual
language baseline from WI-07. Inspect in the real browser; record defects
with scene and reproduction steps.
