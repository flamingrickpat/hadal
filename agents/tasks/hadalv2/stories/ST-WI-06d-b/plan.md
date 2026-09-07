---
id: WI-06d-b
kind: story
parent: WI-06d
children: ["WI-06d-b1", "WI-06d-b2", "WI-06d-b3", "WI-06d-b4", "WI-06d-b5", "WI-06d-b6"]
depends_on: ["WI-06a", "WI-06b", "WI-06c"]
criteria:
  AC-art-geometry: "Obvious debug geometry is replaced in all critical-path areas and the section 48 juice list (bubbles, silt, light sway, depth-record tick, distant-motion impulse, parting schools) is present"
  AC-art-palettes: "Every depth band has a distinct palette family, particle profile, light attenuation, and background silhouette in the browser, with the section 14.1 graphic-novel/sonar/cut-paper hybrid reading at 1080p"
behavior: "Implement the six section 48 juice effects (bubbles, silt, light sway, depth-record tick, distant-motion impulse, parting schools) by extending the section 35 effects toolbox, and record the cross-band contrast walk proving every band is distinct"
subsystems: ["rendering - particle toolbox", "rendering - band lighting and postfx", "ui - hud cue", "rendering - camera nudge and impulse flag", "rendering - school render path", "rendering - verification and evidence"]
verification: "Each juice effect triggered and recorded in the browser; cross-band contrast walk recording per band that palette family, particle profile, light attenuation and background silhouette are each distinct between adjacent bands (at least two identity factors) with the section 14.1 hybrid reading at 1080p; headless suite and build stay green; performance spot-check per section 34"
---

# WI-06d-b — Section 48 juice effects and cross-band contrast walk (story)

## Goal

Implement the six section 48 juice effects by extending the existing
section 35 effects toolbox in `src/render/` (particles, postfx, sonar) —
do not rebuild it. The six effects: bubbles, silt, light sway,
depth-record tick, distant-motion impulse, and parting schools. After
all six are in, record the cross-band contrast walk proving every band
is distinct in at least two identity factors with the section 14.1
hybrid reading at 1080p.

## Why this shape (review split)

The review found seven independently testable behaviors bundled in one
leaf, touching at least five distinct implementation responsibilities
(particle toolbox, postfx path, `src/ui/hud.ts` cue seam, camera nudge
plus the WI-06d-c impulse flag, school render-split path) — over the
three-responsibility limit. Each child below owns one behavior and
changes a strict subset of the parent's responsibilities:

- WI-06d-b1: bubbles and silt juice particles on the particle toolbox.
  Subsystems: rendering - particle toolbox.
- WI-06d-b2: light sway in the section 35 band-lighting/postfx path.
  Subsystems: rendering - band lighting and postfx.
- WI-06d-b3: the depth-record tick HUD cue.
  Subsystems: ui - hud cue.
- WI-06d-b4: the distant-motion impulse (camera nudge + the
  presentation flag WI-06d-c's shake path gates).
  Subsystems: rendering - camera nudge and impulse flag.
- WI-06d-b5: parting schools (render split only, no steering changes).
  Subsystems: rendering - school render path.
- WI-06d-b6: the cross-band contrast walk and the final browser proof.
  Subsystems: rendering - verification and evidence.

## Criteria assignment and proof ownership

Children retain the parent criteria verbatim; their union covers both:

- AC-art-geometry (juice part only — the geometry part is owned by
  WI-06d-a): all six children retain it. WI-06d-b1..b5 each carry
  child-local criteria for their own effect plus their own local
  browser clip. WI-06d-b6 is the final proof owner of the juice-part
  browser union: after all six effects are in, it re-triggers and
  records all six together, so "the section 48 juice list is present"
  is proven once, end to end.
- AC-art-palettes: retained by WI-06d-b6 only — the cross-band walk
  (per band: palette family, particle profile, light attenuation,
  background silhouette each distinct between adjacent bands, at least
  two identity factors, section 14.1 hybrid reading at 1080p) is
  recorded there. No other child re-asserts this union. The walk's
  particle-profile factor depends on the per-band juice particles of
  WI-06d-b1, which is why WI-06d-b6 depends on all effect children.
- Child-local (WI-06d-b6): AC-perf-walk adds the section 34
  performance spot-check (frame rate recorded during the cross-band
  walk; no band drops below the section 34 budget) as focused
  verification; it does not replace a parent criterion.

## Dependency notes

- The story depends on WI-06a, WI-06b, WI-06c: the juice must be tuned
  against the settled band look, and the cross-band contrast walk needs
  all three band passes complete.
- WI-06d-b1..b5 inherit depends_on: [WI-06a, WI-06b, WI-06c] and are
  parallel with respect to each other.
- WI-06d-b6 additionally depends on WI-06d-b1..b5: it records the
  union only after every juice effect exists.
- The existing WI-06d-c dependency on WI-06d includes this story:
  WI-06d-c's shake path gates the presentation flag WI-06d-b4 creates;
  WI-06d-c's reduced-flashing toggle (from WI-06g) gates the impulse
  sources implemented here. Integration proof of the flag->shake
  interplay is owned by WI-06d-c, not by this story.
- The existing WI-06g dependency on WI-06d includes this story: its
  reduced-flashing toggle gates the impulse/cue sources WI-06d-b3 and
  WI-06d-b4 implement.

## Constraints and non-goals

- Extend, do not rebuild: the section 35 toolbox (particles, postfx,
  sonar) is the foundation. New effects are extensions, not rewrites.
- Restraint: juice must not hurt readability at 1080p in motion
  (section 14.3) or break the section 34 budgets.
- No audio changes (WI-06e), no map (WI-06f), no a11y UI (WI-06g) —
  only the presentation flag and HUD-adjacent cue seams they will
  consume.
- No new gameplay rules, no steering or balance changes, no new content.
- The distant-motion impulse feeds the presentation flag WI-06d-c's
  shake path reads; WI-06d-b4 implements the trigger and the nudge,
  not the low-frequency gate or the amplitude budget (WI-06d-c).
- Spoiler rules (sections 0, 12, 68, 70): late-game areas are recorded
  with private fixtures and internal ids only.

## Fresh-session handoff

Read WI-06d/plan.md (story scope; criteria assignment; this story owns
the juice part of AC-art-geometry and the AC-art-palettes cross-band
walk), ST-06/plan.md, request sections 14.1, 14.3, 34, 35, 48, 70.
Inspect `src/render/` (particles, postfx, lighting, sonar) for the
section 35 toolbox extension points, `src/ui/hud.ts` for the
depth-record cue seam, and the school render path in the ST-02/ST-03
creature renderer for the parting-schools split. Read the three band
items (WI-06a, WI-06b, WI-06c) for the settled per-band look the juice
must complement.
