---
id: WI-06d-c
kind: work_item
parent: WI-06d
children: []
depends_on: ["WI-06a", "WI-06b", "WI-06c"]
criteria:
  AC-shake-rules: "Section 16 low-frequency shake rules are implemented through a single flag-gated path with the section 16 amplitude budget; the presentation flag that WI-06g's screen-shake toggle will consume is in place; flag off means no shake from any source"
  AC-widescreen: "Widescreen composition holds on widescreen aspect ratios without letterboxed dead zones per section 16"
behavior: "Land the section 16 low-frequency shake rules (single flag-gated path, amplitude budget, presentation flag for WI-06g) and the section 16 widescreen composition behavior"
subsystems: ["camera"]
verification: "Browser: shake sources observed to stay low-frequency and gated by the flag (flag off = no shake); widescreen check at a wide aspect ratio showing composition holds without letterboxed dead zones; Node: the shake flag plumbing and widescreen layout params covered by unit tests; headless suite and build stay green"
---

# WI-06d-c — Section 16 shake rules and widescreen behavior

## Goal

Land the section 16 camera feel: (1) low-frequency shake rules where
all shake sources emit through one low-frequency-gated path driven by a
single presentation flag, with the amplitude budget of section 16; and
(2) widescreen composition that holds on widescreen aspect ratios
without letterboxed dead zones. The presentation flag is the seam
WI-06g's screen-shake toggle will control.

## Deliverables (checkable)

- Low-frequency shake path: a single gated path in the camera/render
  layer where all shake sources (including the distant-motion impulse
  from WI-06d-b) emit. The path applies:
  - A low-frequency gate: only low-frequency oscillations pass;
    high-frequency jitter is filtered out.
  - The section 16 amplitude budget: no individual shake event or
    accumulated shake exceeds the section 16 limit.
  - A single presentation flag: when the flag is off, no shake of any
    amplitude is applied, regardless of source. The flag is a simple
    boolean state that WI-06g's screen-shake toggle will flip.
- Widescreen behavior: composition holds on widescreen aspect ratios
  (e.g. 21:9, 32:9) without letterboxed dead zones. The section 16
  widescreen rules are implemented: the scene composition adapts
  rather than pillarboxing.

## Tests

- Node: the shake flag plumbing (flag on/off gates the path correctly;
  amplitude budget is enforced) and the widescreen layout params
  (aspect ratio breakpoints, composition offsets) covered by unit
  tests. Suite and build stay green.
- Browser (final proof owner of AC-shake-rules): shake behavior
  observed to stay low-frequency (no high-frequency jitter) and gated
  by the flag. With a shake source active (e.g. the distant-motion
  impulse from WI-06d-b), flag on = shake present, flag off = no
  shake. Amplitude stays within the section 16 budget.
- Browser (final proof owner of AC-widescreen): widescreen check at
  a wide aspect ratio (e.g. 21:9) — composition holds, no letterboxed
  dead zones, the scene is fully visible and correctly framed.

## Constraints, assumptions, non-goals

- This item creates the shake infrastructure (the path, the gate, the
  budget, the flag) but does not add shake sources beyond what already
  exists or what WI-06d-b's distant-motion impulse provides. The
  distant-motion impulse is implemented in WI-06d-b; it emits through
  the path this item creates.
- No juice effects (WI-06d-b), no geometry replacement (WI-06d-a).
- No new gameplay rules, no steering or balance changes, no new content.
- The presentation flag is the exact seam WI-06g's screen-shake toggle
  will consume; it is a simple boolean in the render/camera state.
  No additional settings UI is built here (WI-06g owns the UI).
- Widescreen: this is a composition/framing behavior, not a UI layout
  task. The HUD and overlays adapt via the existing responsive
  patterns; this item ensures the 3D scene composition holds.
- Spoiler rules (sections 0, 12, 68, 70): late-game areas are recorded
  with private fixtures and internal ids only.

## Fresh-session handoff

Read WI-06d/plan.md (story scope; criteria assignment; this item has
child-local criteria AC-shake-rules and AC-widescreen because no
parent criterion covers shake or widescreen), ST-06/plan.md, request
section 16 (low-frequency shake rules, amplitude budget, widescreen
behavior). Inspect the camera/render path in `src/render/` for where
the shake gate and presentation flag live; inspect the existing camera
transform code for the widescreen composition seam. Read WI-06d-b for
the distant-motion impulse that feeds this item's shake path. Do not
start before WI-06a/b/c are accepted (the shake and widescreen
behavior must work in the settled band scenes).
