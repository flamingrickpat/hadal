# Understanding

This child implements one independently reviewed work item from C:\Temp\hadal-v2\agents\tasks\hadalv2.

---
id: WI-06c
kind: work_item
parent: ST-06
children: []
depends_on: []
criteria:
  AC-art-palettes: "Every depth band has a distinct palette family, particle profile, light attenuation, and background silhouette in the browser, with the section 14.1 graphic-novel/sonar/cut-paper hybrid reading at 1080p"
behavior: "Give the deep bands and the final zone their section 14.3 visual identity (darkest palettes, lowest visibility, distinct particles and silhouettes) with the section 16 scale-reveal zoom for select colossal encounters staged there, inspected spoiler-safely per section 70"
subsystems: ["rendering and materials", "world content data"]
verification: "Per-band browser inspection at 1080p (composition, readability, atmosphere) with recorded observations and screenshots for each deep band and the final zone, run with private fixtures and reported without names per section 70; band identity data asserted in a Node test (each band differs from the adjacent band in at least two identity factors); headless suite and build stay green; performance spot-check per section 34"
---

# WI-06c — Deep bands + final zone art pass

## Goal

Set the visual identity of the two deepest bands and the final zone per
section 14.3: the darkest palette families of the game, the lowest
visibility, distinct particle profiles (silt, marine-snow scale) and
background silhouettes. The section 14.1 graphic-novel/sonar/cut-paper
hybrid must still read at 1920x1080 - the deep bands are where the hybrid
relies most on sonar contrast and cut-paper silhouette layering.
Flashlight behavior per section 15 applies strictly: no pure-black
screens, biological light sources reveal geometry from behind.

## Deliverables (checkable)

- Band identity parameter sets for the two deep bands and the final zone
  in the production world data (the same data seam the WI-07 baseline
  uses for the five-band macro world).
- Rendering/materials work in `src/render/` to express those parameters:
  water color grade, visibility falloff, particle profile, light
  attenuation, and background silhouette layers. Extend the existing
  pipeline; do not rebuild it.
- Scene dressing of the critical-path areas in these bands and the final
  zone; no obvious debug geometry left in these areas - other areas
  remain WI-06d's job.
- Section 16 scale-reveal zoom for each select colossal encounter staged
  in these bands: the authored camera zoom-in that establishes scale.
  The encounters themselves are ST-04/ST-05 content; this item only adds
  the camera behavior.
- Section 15 flashlight behavior for these bands.

## Tests

- Node: the registered band identity parameters assert the two factors
  (minimum) that distinguish each deep band from its adjacent band and
  the final zone from the band above it; suite and build stay green.
- Browser (section 70 spoiler rule): inspect each band and the final
  zone at 1080p in motion using private fixtures; record composition,
  readability and atmosphere with screenshots; report without naming
  creatures, the lore truth, the MacGuffin, or the endings. Verify the
  scale-reveal zoom fires for each colossal encounter staged here.
  Spot-check the section 34 budgets while inspecting.

## Constraints, assumptions, non-goals

- Post-processing restraint (section 14.3); readability at 1080p in
  motion is the bar even at the darkest depths.
- No audio (WI-06e), no juice list (WI-06d), no map or a11y work.
- No new gameplay rules or content; no balance tuning; no encounter
  re-authoring (ST-04/ST-05 own the encounters).
- Spoiler rules (sections 0, 12, 68, 70) are load-bearing here: plan
  artifacts, commit messages and evidence use internal band and
  encounter ids only, never names.

## Fresh-session handoff

Read ST-06/plan.md, request sections 1.1, 14, 15, 16, 34, 70, the band
data seam described in `understanding.md`, and `src/render/` plus the
world data files it reads. Encounters staged in these bands come from
ST-04/ST-05 (referenced by id only); do not move or name them. Use the
private fixture route described in ST-04/ST-05 for inspection.

