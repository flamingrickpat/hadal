---
id: WI-06d
kind: story
parent: ST-06
children: ["WI-06d-a", "WI-06d-b", "WI-06d-c"]
depends_on: ["WI-06a", "WI-06b", "WI-06c"]
criteria:
  AC-art-geometry: "Obvious debug geometry is replaced in all critical-path areas and the section 48 juice list (bubbles, silt, light sway, depth-record tick, distant-motion impulse, parting schools) is present"
  AC-art-palettes: "Every depth band has a distinct palette family, particle profile, light attenuation, and background silhouette in the browser, with the section 14.1 graphic-novel/sonar/cut-paper hybrid reading at 1080p"
behavior: "Replace obvious debug geometry in all critical-path areas, implement the six section 48 juice effects on the section 35 toolbox, and land the section 16 low-frequency shake rules and widescreen behavior"
subsystems: ["world content data", "rendering and materials", "camera"]
verification: "Recorded critical-path walk (browser) showing no obvious debug geometry in any critical-path area; each section 48 juice effect demonstrated and recorded; cross-band contrast walk recording that every band is distinct in at least two identity factors with the section 14.1 hybrid reading at 1080p; shake rules and widescreen behavior checked in the browser; headless suite and build stay green; performance spot-check per section 34"
---

# WI-06d — Debug geometry replacement, section 48 juice, camera feel

## Goal

After the three band passes (WI-06a/b/c) have settled the look of every band,
make the critical path look finished everywhere: replace the obvious debug
geometry with band-consistent real geometry, implement the full section 48
juice list on the section 35 effects toolbox, and land the section 16 camera
feel (low-frequency shake rules and widescreen behavior).

## Why this shape (review split)

The review found three independently testable, independently shippable
behaviors bundled in one leaf: geometry replacement (world content data), the
six juice effects (rendering and materials), and the camera feel (shake path
plus widescreen composition). Four named responsibilities changed (content
data, effects toolbox, shake path, widescreen layout), over the three limit.
The split into three leaves each changes at most three responsibilities:

- WI-06d-a: geometry replacement in all critical-path areas.
  Subsystems: world content data. Final proof owner of the
  AC-art-geometry geometry part.
- WI-06d-b: the six section 48 juice effects on the section 35 toolbox.
  Subsystems: rendering and materials. Final proof owner of the
  AC-art-geometry juice part and of the AC-art-palettes cross-band walk
  (whose particle-profile factor depends on per-band juice particles).
- WI-06d-c: section 16 shake rules and widescreen behavior.
  Subsystems: camera. Child-local criteria for shake and widescreen
  (no parent criterion covers them).

## Criteria assignment and proof ownership

Children retain the parent criteria verbatim; their union covers both:

- AC-art-geometry: WI-06d-a (geometry part: no obvious debug geometry in
  any critical-path area) and WI-06d-b (juice part: all six section 48
  effects present and demonstrated). Final proof owner of the geometry
  part: WI-06d-a. Final proof owner of the juice part: WI-06d-b.
- AC-art-palettes: WI-06d-b — after all band passes and the juice
  effects are in, it walks every critical-path area and records the
  cross-band contrast (each band distinct in at least two identity
  factors, section 14.1 hybrid reading at 1080p). No other child
  re-asserts the cross-band part.
- Child-local (WI-06d-c): AC-shake-rules and AC-widescreen add focused
  verification for the camera feel; they do not replace or duplicate
  parent criteria.

## Dependency notes

- This story depends on WI-06a, WI-06b, WI-06c: geometry replacement and
  juice must be tuned against the settled band look, and the cross-band
  contrast walk needs all three band passes complete.
- All three children inherit depends_on: [WI-06a, WI-06b, WI-06c].
  They are parallel with respect to each other.
- The existing WI-06g dependency on WI-06d means all three leaves:
  WI-06g's shake toggle gates the flag WI-06d-c creates, its reduced
  flashing toggle gates sources WI-06d-b implements, and its browser
  checks exercise the geometry WI-06d-a lands.
- Feeds ST-07: this story keeps the section 34 budgets.

## Constraints and non-goals

- Restraint: juice must not hurt readability at 1080p in motion or the
  section 34 budgets; spot-check performance while verifying.
- No audio changes (WI-06e), no map (WI-06f), no a11y UI (WI-06g) — only
  the presentation flag and HUD-adjacent cue seams they will consume.
- No new gameplay rules, no steering or balance changes, no new content.
- If a geometry replacement exposes a real simulation gap, record it as
  a defect report — do not add gameplay rules.
- Spoiler rules (sections 0, 12, 68, 70): late-game areas are recorded
  with private fixtures and internal ids only.

## Fresh-session handoff

Read ST-06/plan.md, request sections 14.3, 16, 34, 35, 48, 70, and the
three band items (WI-06a, WI-06b, WI-06c) for the settled band look.
Inspect `src/render/` (particles, postfx, sonar, camera/shake paths)
and `src/ui/hud.ts` for the depth-record cue seam.
