# Understanding

This child implements one independently reviewed work item from C:\Temp\hadal-v2\agents\tasks\hadalv2.

---
id: WI-06a
kind: work_item
parent: ST-06
children: []
depends_on: []
criteria:
  AC-art-palettes: "Every depth band has a distinct palette family, particle profile, light attenuation, and background silhouette in the browser, with the section 14.1 graphic-novel/sonar/cut-paper hybrid reading at 1080p"
  AC-art-contrast: "The surface zone reads as a cozy baseline and returning to it after a deep dive creates relief, per section 59"
behavior: "Give the surface and coast bands their section 14.3 visual identity (palette, visibility, particles, light attenuation, silhouettes, debris, currents) with the section 15 flashlight behavior, and make the surface zone read as the cozy baseline with return relief per section 59"
subsystems: ["rendering and materials", "world content data"]
verification: "Per-band browser inspection at 1080p (composition, readability, atmosphere) with recorded observations and screenshots for both bands; a recorded return-to-surface observation after a deep dive showing relief per section 59 (final proof owner of AC-art-contrast); band identity data asserted in a Node test (this band differs from the other registered bands in at least two identity factors); headless suite and build stay green"
---

# WI-06a — Surface + coast band art pass

## Goal

Set the visual identity of the two shallowest bands (surface and coast) per
section 14.3: water color, visibility, particle profile, light attenuation,
background silhouettes, debris density, current direction and ambient
motion, so the section 14.1 graphic-novel/sonar/cut-paper hybrid reads at
1920x1080. The surface zone is the cozy baseline of the whole game
(section 59): bright enough to feel safe, with ambient life and gentle
motion; returning to it after a deep dive must create relief. Flashlight
behavior per section 15 applies: no pure-black screens, biological light
sources reveal geometry from behind.

## Deliverables (checkable)

- Band identity parameter sets for the surface and coast bands in the
  production world data (the same data seam the WI-07 baseline uses for
  the five-band macro world), each distinct from the other bands in at
  least two identity factors.
- Rendering/materials work in `src/render/` to express those parameters:
  water color grade, visibility falloff, particle profile (size, density,
  drift), light attenuation, and background silhouette layers for both
  bands. Extend the existing pipeline; do not rebuild it.
- Scene dressing of the critical-path areas inside these two bands
  (debris, ambient motion, silhouette composition); no placeholder
  geometry left that WI-06d would have to find here - only "obvious debug
  geometry" in other areas remains WI-06d's job.
- Section 15 flashlight behavior for these bands (no pure-black screens;
  biological sources reveal geometry from behind).
- The section 59 cozy baseline: the surface zone is lit and populated
  enough to feel like the safe baseline; a recorded observation of
  returning to it after a deep dive.

## Tests

- Node: the registered band identity parameters assert the two factors
  (minimum) that distinguish the surface band and the coast band from
  each other and from the placeholder values of the not-yet-dressed
  bands; suite and build stay green.
- Browser (final proof owner of AC-art-contrast): inspect each band at
  1080p in motion; record composition, readability and atmosphere with
  screenshots; then dive deep (fixture or short real route) and return to
  the surface and record the relief observation per section 59.

## Constraints, assumptions, non-goals

- Post-processing restraint (section 14.3); readability at 1080p in
  motion is the bar.
- No audio (WI-06e), no juice list (WI-06d), no map or a11y work.
- No new gameplay rules or content; no balance tuning.
- Spoiler rules (sections 0, 12, 68, 70) are not an issue in these
  shallow bands, but commit messages and evidence use internal band
  names only.

## Fresh-session handoff

Read ST-06/plan.md, request sections 1.1, 14, 15, 59, the band data seam
described in `understanding.md`, and `src/render/` plus the world data
files it reads. The visual language baseline from the WI-07 work
(`understanding.md`) is the starting point - dress, do not redesign.

