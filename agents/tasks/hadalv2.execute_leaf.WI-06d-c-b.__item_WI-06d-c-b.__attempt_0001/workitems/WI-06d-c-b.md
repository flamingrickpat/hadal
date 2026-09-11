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

## Implementation

**Result:** AC-widescreen verified.

### Changed files

- `src/render/widescreen.ts` — new: pure-data widescreen layout params module
  (aspect ratio breakpoints, view-width modifier function). Node-testable.
- `src/render/widescreen.test.ts` — new: unit tests for the layout params
  (9 tests, all passing).
- `src/render/Renderer.ts` — modified: camera transform applies the
  widescreen modifier on resize and camera modifier changes.

### Behavior

The camera keeps its fixed 2000-unit view width at 16:9 (baseline). On
widescreen aspect ratios (>16:9), the view widens proportionally so the
player sees more world horizontally (request §16). The modifier is capped
at 1.5x to avoid an absurdly wide view on 32:9+ monitors.

### Acceptance Evidence Table

| Criterion | Evidence | Status |
|---|---|---|
| AC-widescreen | Unit tests for layout params pass (9/9); Playwright browser probe captures at 16:9 vs 21:9 show the widescreen composition adapts (wider framing, no letterboxed dead zones) | passed |

### Live verification

**Status:** passed

Browser probe (Playwright Chromium) captured the game at 16:9 (1920x1080)
and 21:9 (3440x1440) on the same settled scene. The 21:9 capture shows:
- More world visible horizontally (the camera widened)
- The workbench UI remains at the same position (not stretched)
- The scene fills the entire frame — no letterboxed dead zones
- Same player position (x 1300.0, depth 100.0) confirming camera change, not player movement

Captures: `scratch/implementer/widescreen-probe/capture_16x9.png`,
`scratch/implementer/widescreen-probe/capture_21x9.png`.

### Tests run

- `npx vitest run src/render/widescreen.test.ts` — 9/9 tests pass
- `npx vitest run` (full suite) — 437/439 tests pass (2 pre-existing
  failures in roster tests, unrelated to this work item; verified by
  running the failing tests on the base commit)
- `npm run build` — 60 pre-existing TypeScript errors (same count as
  base commit, all in test files; none in the source files changed here)

### Deviations/Blockers

None.

### Notes for reviewer

The widescreen modifier is applied in two places:
1. `resize()` — when the browser window resizes
2. `setCameraModifier()` — stacked on top of camera modifiers (scale-reveal,
   encounter zoom) so widescreen widening still applies during those states

The layout params are pure data in `widescreen.ts` and fully testable in
Node without a browser, per the work item's changed responsibilities.

### Knowledge notes

Consulted: `src/game/constants.ts` (CAMERA_VIEW_WIDTH), existing Renderer.ts
camera implementation.
