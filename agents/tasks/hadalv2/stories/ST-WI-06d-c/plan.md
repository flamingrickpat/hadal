---
id: WI-06d-c
kind: story
parent: WI-06d
children: ["WI-06d-c-a", "WI-06d-c-b"]
depends_on: ["WI-06a", "WI-06b", "WI-06c"]
criteria:
  AC-shake-rules: "Section 16 low-frequency shake rules are implemented through a single flag-gated path with the section 16 amplitude budget; the presentation flag that WI-06g's screen-shake toggle will consume is in place; flag off means no shake from any source"
  AC-widescreen: "Widescreen composition holds on widescreen aspect ratios without letterboxed dead zones per section 16"
behavior: "Land the section 16 low-frequency shake rules (single flag-gated path, amplitude budget, presentation flag for WI-06g) and the section 16 widescreen composition behavior"
subsystems: ["camera"]
verification: "Browser: shake sources observed to stay low-frequency and gated by the flag (flag off = no shake); widescreen check at a wide aspect ratio showing composition holds without letterboxed dead zones; Node: the shake flag plumbing and widescreen layout params covered by unit tests; headless suite and build stay green"
---

# WI-06d-c — Section 16 shake rules and widescreen behavior (story)

## Goal

Land the section 16 camera feel: (1) low-frequency shake rules where
all shake sources emit through one low-frequency-gated path driven by a
single presentation flag, with the amplitude budget of section 16; and
(2) widescreen composition that holds on widescreen aspect ratios
without letterboxed dead zones. The presentation flag is the seam
WI-06g's screen-shake toggle will control.

## Why this shape (review split)

The review found two independently testable, independently shippable
behaviors bundled in one leaf: (1) the section 16 low-frequency shake
rules (single flag-gated path, amplitude budget, presentation flag seam
for WI-06g) and (2) the section 16 widescreen composition (no
letterboxed dead zones at wide aspect ratios). Shake is testable and
shippable at any aspect ratio; widescreen composition is testable with
no shake active. Each child owns exactly one behavior and strictly
fewer parent criteria (1 < 2):

- WI-06d-c-a: the low-frequency shake path, the gate, the amplitude
  budget and the presentation flag. Subsystems:
  camera - low-frequency shake path. Final proof owner of
  AC-shake-rules.
- WI-06d-c-b: the widescreen layout params and composition offsets.
  Subsystems: camera - widescreen composition. Final proof owner of
  AC-widescreen.

## Criteria assignment and proof ownership

Children retain the parent criteria verbatim; their union covers both:

- AC-shake-rules: retained by WI-06d-c-a only. Final proof owner:
  WI-06d-c-a — browser proof with the WI-06d-b4 distant-motion
  impulse active (flag on = low-frequency shake within the section 16
  budget; flag off = no shake from any source), plus Node unit tests
  for the flag plumbing and the gate.
- AC-widescreen: retained by WI-06d-c-b only. Final proof owner:
  WI-06d-c-b — browser check at a wide aspect ratio (e.g. 21:9)
  showing the composition holds with no letterboxed dead zones, plus
  Node unit tests for the layout params.
- These criteria are child-local with respect to the WI-06d story
  (no WI-06d criterion covers shake or widescreen); they do not
  replace or duplicate WI-06d's criteria.

## Dependency notes

- The story depends on WI-06a, WI-06b, WI-06c: shake and widescreen
  must work in the settled band scenes.
- WI-06d-c-a and WI-06d-c-b inherit depends_on: [WI-06a, WI-06b,
  WI-06c] and are parallel with respect to each other.
- WI-06d-c-a additionally depends on WI-06d-b4: its final browser
  proof of AC-shake-rules exercises the flag with the distant-motion
  impulse — the concrete shake source WI-06d-b4 emits through this
  path. WI-06d-b4 implements the trigger and the nudge, not the
  low-frequency gate or the amplitude budget; its handoff note assigns
  the flag->shake integration proof to WI-06d-c, which this leaf owns.
- The existing WI-06g dependency on WI-06d includes this story:
  WI-06g's screen-shake toggle gates the flag WI-06d-c-a creates.

## Constraints and non-goals

- This story creates the shake infrastructure (the path, the gate, the
  budget, the flag) but does not add shake sources beyond what already
  exists or what WI-06d-b4's distant-motion impulse provides. The
  distant-motion impulse is implemented in WI-06d-b4; it emits through
  the path WI-06d-c-a creates.
- No juice effects (WI-06d-b), no geometry replacement (WI-06d-a).
- No new gameplay rules, no steering or balance changes, no new content.
- The presentation flag is the exact seam WI-06g's screen-shake toggle
  will consume; it is a simple boolean in the render/camera state.
  No settings UI is built here (WI-06g owns the UI).
- Widescreen is a composition/framing behavior, not a UI layout task:
  the HUD and overlays adapt via the existing responsive patterns;
  WI-06d-c-b ensures the 3D scene composition holds.
- Spoiler rules (sections 0, 12, 68, 70): late-game areas are recorded
  with private fixtures and internal ids only.

## Fresh-session handoff

Read WI-06d/plan.md (parent story scope; AC-shake-rules and
AC-widescreen are child-local to WI-06d because no parent criterion
covers shake or widescreen), ST-06/plan.md, and request section 16
(low-frequency shake rules, amplitude budget, widescreen behavior).
Inspect the camera/render path in `src/render/` for where the shake
gate and presentation flag live, and the existing camera transform
code for the widescreen composition seam. Read WI-06d-b4 for the
distant-motion impulse that feeds the shake path (WI-06d-c-a). Do not
start either child before WI-06a/b/c are accepted (the shake and
widescreen behavior must work in the settled band scenes).
