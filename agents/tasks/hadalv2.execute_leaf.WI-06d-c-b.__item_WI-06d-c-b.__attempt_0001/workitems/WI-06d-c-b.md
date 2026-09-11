---
id: WI-06d-c-b
kind: work_item
parent: WI-06d-c
children: []
depends_on: ["WI-06a", "WI-06b", "WI-06c"]
criteria:
  AC-widescreen: "Widescreen composition holds on widescreen aspect ratios without letterboxed dead zones per section 16"
behavior: "Land the section 16 widescreen composition: the scene composition adapts to widescreen aspect ratios (e.g. 21:9, 32:9) without letterboxed dead zones"
subsystems: ["camera - widescreen composition"]
verification: "Node unit tests pass for the widescreen layout params (aspect ratio breakpoints, composition offsets); browser (final proof): at a wide aspect ratio (e.g. 21:9) the composition holds — no letterboxed dead zones, the scene fully visible and correctly framed; headless suite and build stay green"
---

# WI-06d-c-b — Section 16 widescreen composition

## Goal

Land the section 16 widescreen behavior: composition holds on
widescreen aspect ratios (e.g. 21:9, 32:9) without letterboxed dead
zones — the scene composition adapts rather than pillarboxing. This
is a composition/framing behavior of the 3D scene, not a UI layout
task.

## Changed responsibilities (the only owners that change)

1. The widescreen layout params — a pure-data module (aspect ratio
   breakpoints and composition offsets per breakpoint) next to the
   camera/render data in `src/render/`, Node-testable without a
   browser.
2. The camera transform's widescreen seam — the existing camera
   transform code (`src/render/`) applies the composition offsets so
   the scene frames correctly at each widescreen breakpoint instead
   of pillarboxing.

Tests for these owners (unit tests for the layout params) do not
count as additional responsibilities.

## Deliverables (checkable)

- Widescreen layout params: aspect ratio breakpoints (e.g. 21:9,
  32:9) and the composition offsets for each, as pure data.
- The camera transform applies them: at wide aspect ratios the scene
  composition adapts — no letterboxed dead zones, the scene is fully
  visible and correctly framed.
- Baseline aspect ratios keep their current framing behavior.

## Tests

- Node: unit tests for the widescreen layout params (breakpoints
  resolve to the expected composition offsets; baseline aspects
  unchanged). Suite and build stay green.
- Browser (final proof owner of AC-widescreen): widescreen check at
  a wide aspect ratio (e.g. 21:9) in a settled band scene —
  composition holds, no letterboxed dead zones, the scene is fully
  visible and correctly framed. Record the wide-aspect capture.

## Constraints, assumptions, non-goals

- Composition/framing only: the HUD and overlays adapt via the
  existing responsive patterns; this item ensures the 3D scene
  composition holds.
- No shake work (WI-06d-c-a), no juice effects (WI-06d-b), no
  geometry replacement (WI-06d-a).
- No new gameplay rules, no steering or balance changes, no new content.
- Spoiler rules (sections 0, 12, 68, 70): late-game areas are
  recorded with private fixtures and internal ids only.

## Fresh-session handoff

Read WI-06d-c/plan.md (story scope, criteria assignment, proof
ownership), WI-06d/plan.md and ST-06/plan.md for context, and
request section 16 (widescreen behavior). Inspect the existing camera
transform code in `src/render/` for the widescreen composition seam.
Do not start before WI-06a/b/c are accepted (the widescreen behavior
must work in the settled band scenes).
