# Understanding

This child implements one independently reviewed work item from C:\Temp\hadal-v2\agents\tasks\hadalv2.

---
id: WI-06d-b2
kind: work_item
parent: WI-06d-b
children: []
depends_on: ["WI-06a", "WI-06b", "WI-06c"]
criteria:
  AC-art-geometry: "Obvious debug geometry is replaced in all critical-path areas and the section 48 juice list (bubbles, silt, light sway, depth-record tick, distant-motion impulse, parting schools) is present"
  AC-juice-lightsway: "Light sway is a low-amplitude, slow-period light animation in the section 35 band-lighting/postfx path, per-band tuned to the settled look, with the sway parameters covered by Node unit tests"
behavior: "Add light sway to the section 35 band-lighting/postfx path: low-amplitude, slow-period, per-band tuned"
subsystems: ["rendering - band lighting and postfx"]
verification: "Node unit tests pass for the sway parameters (amplitude, period, per-band values); browser clip or screenshot showing the slow light movement in at least two bands; headless suite and build stay green; section 34 budgets hold"
---

# WI-06d-b2 — Light sway

## Goal

Add the section 48 light-sway juice effect to the section 35 lighting/
postfx path: a low-amplitude, slow-period animation of the band light
that reads as living water, per-band tuned to the settled look.
Extend, do not rebuild: the existing band lighting and post pass keep
their invariants (one extra full-screen pass per frame, no heavy
bloom).

## Changed responsibilities (the only owners that change)

1. `src/render/lighting.ts` — the band lighting path: drive the light
   (intensity / direction / subtle color drift) with a slow animated
   clock inside the existing update flow.
2. The per-band sway parameters — sway amplitude, period and phase in
   the `BandProfile` data (`src/render/band.ts`) or a data module next
   to it, per band, Node-testable as pure data. If the post pass
   (`src/render/postfx.ts`) needs a uniform hook for the sway, that
   small pass-through is part of owner 1's extension, not a third
   responsibility.

Tests do not count as additional responsibilities.

## Deliverables (checkable)

- Light sway active in every band: slow period (seconds-scale, not
  frame-scale), low amplitude — the settled band palette must remain
  recognizable in motion (section 14.3).
- Per-band parameter values in the data tables; unit-testable without
  a browser.

## Tests

- Node: sway-parameter unit tests (every band has finite amplitude and
  period within the restraint envelope; deeper bands sway less, per
  the settled look).
- Browser (local proof): clip or screenshot pair (time offset) in at
  least two bands showing the slow movement. The final proof owner of
  the AC-art-geometry juice-part browser union is WI-06d-b6 — do not
  re-assert the six-effect union here.

## Constraints, assumptions, non-goals

- Restraint: low amplitude, slow period; must not read as flicker or
  hurt readability at 1080p in motion (section 14.3).
- Section 34 budgets: no new render passes beyond the existing post
  path.
- No particle (WI-06d-b1), HUD (WI-06d-b3), camera (WI-06d-b4) or
  school (WI-06d-b5) changes; no new gameplay rules, no audio.

## Fresh-session handoff

Read WI-06d-b/plan.md (story scope and proof ownership) and the three
band items (WI-06a, WI-06b, WI-06c) for the settled per-band light
attenuation and palette. Inspect `src/render/lighting.ts`,
`src/render/band.ts` and `src/render/postfx.ts` for the extension
points. Request sections: 14.1, 14.3, 34, 35, 48.

