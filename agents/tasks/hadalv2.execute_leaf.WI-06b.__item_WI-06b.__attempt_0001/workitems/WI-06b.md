---
id: WI-06b
kind: work_item
parent: ST-06
children: []
depends_on: []
criteria:
  AC-art-palettes: "Every depth band has a distinct palette family, particle profile, light attenuation, and background silhouette in the browser, with the section 14.1 graphic-novel/sonar/cut-paper hybrid reading at 1080p"
behavior: "Give the mid bands their section 14.3 visual identity (palette family, visibility, particle profile, light attenuation, background silhouettes, debris, currents) so they read as a clear transition between the surface baseline and the deep bands"
subsystems: ["rendering and materials", "world content data"]
verification: "Per-band browser inspection at 1080p (composition, readability, atmosphere) with recorded observations and screenshots for each mid band; band identity data asserted in a Node test (each mid band differs from the adjacent bands in at least two identity factors); headless suite and build stay green; performance spot-check per section 34"
---

# WI-06b — Mid bands art pass

## Goal

Set the visual identity of the mid bands (the middle depth bands between
the surface/coast pair and the deep pair) per section 14.3: water color,
visibility, particle profile, light attenuation, background silhouettes,
debris density, current direction and ambient motion. The mid bands are
the transition: the section 14.1 graphic-novel/sonar/cut-paper hybrid
keeps reading at 1920x1080, light falls off steadily, and each mid band
stays distinct from its neighbors in at least two identity factors.
Flashlight behavior per section 15 applies: no pure-black screens,
biological light sources reveal geometry from behind.

## Deliverables (checkable)

- Band identity parameter sets for each mid band in the production world
  data (the same data seam the WI-07 baseline uses for the five-band
  macro world).
- Rendering/materials work in `src/render/` to express those parameters:
  water color grade, visibility falloff, particle profile (size, density,
  drift), light attenuation, and background silhouette layers for each
  mid band. Extend the existing pipeline; do not rebuild it.
- Scene dressing of the critical-path areas inside the mid bands (debris,
  ambient motion, silhouette composition); no obvious debug geometry
  left in these areas - other areas remain WI-06d's job.
- Section 15 flashlight behavior for these bands.
- Section 16 camera polish for any select colossal encounter staged in
  the mid bands: scale-reveal zoom where the encounter's staging calls
  for it (the encounter itself is ST-04 content; this item only adds the
  camera behavior).

## Tests

- Node: the registered band identity parameters assert the two factors
  (minimum) that distinguish each mid band from its adjacent bands;
  suite and build stay green.
- Browser: inspect each mid band at 1080p in motion; record composition,
  readability and atmosphere with screenshots; spot-check the section 34
  budgets while inspecting.

## Constraints, assumptions, non-goals

- Post-processing restraint (section 14.3); readability at 1080p in
  motion is the bar.
- No audio (WI-06e), no juice list (WI-06d), no map or a11y work.
- No new gameplay rules or content; no balance tuning; no encounter
  re-authoring (ST-04 owns the encounters).
- Spoiler rules (sections 0, 12, 68, 70): evidence uses internal band
  and encounter ids only.

## Fresh-session handoff

Read ST-06/plan.md, request sections 1.1, 14, 15, 16, 34, the band data
seam described in `understanding.md`, and `src/render/` plus the world
data files it reads. The visual language baseline from the WI-07 work
(`understanding.md`) is the starting point - dress, do not redesign.
Encounter staging slots come from ST-04; do not move encounters.
