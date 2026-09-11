---
id: WI-06d-b5
kind: work_item
parent: WI-06d-b
children: []
depends_on: ["WI-06a", "WI-06b", "WI-06c"]
criteria:
  AC-art-geometry: "Obvious debug geometry is replaced in all critical-path areas and the section 48 juice list (bubbles, silt, light sway, depth-record tick, distant-motion impulse, parting schools) is present"
  AC-juice-schools: "Schools visually part when the player enters their proximity and re-form after, as a render-only split with data-driven split parameters; a Node scenario proves the split state toggles without changing steering outcomes"
behavior: "Implement parting schools: the school render splits around the player and re-forms, render behavior only"
subsystems: ["rendering - school render path"]
verification: "Node scenario passes: split state toggles around the player and steering outcomes are unchanged; browser clip or screenshot of a school parting around the player; headless suite and build stay green"
---

# WI-06d-b5 — Parting schools

## Goal

Implement the section 48 parting-schools juice effect: when the player
enters a school's proximity, the school visually parts around the
player, then re-forms after the player leaves. Render behavior only —
a visual split state on the school render path, not a steering-rule
change.

## Changed responsibilities (the only owners that change)

1. The school render path in the ST-02/ST-03 creature renderer — add a
   per-school split state (whole / parting / re-forming) that offsets
   rendered members around the player's position; the underlying
   steering outcomes are untouched.
2. The split parameters — a data module (proximity radius, parting
  spread, re-form time) as pure data, Node-testable.

Tests do not count as additional responsibilities.

## Deliverables (checkable)

- Split: a visual effect — school members render offset/avoiding the
  player within the proximity radius, re-forming after departure.
- No steering-rule changes: the sim-side school positions/velocities
  are exactly what the existing steering produces.

## Tests

- Node scenario (via the shared scenario harness): a school near the
  player — assert the render-split state toggles on entering/leaving
  proximity, and that the steering outcomes (sim positions/velocities
  after the same input) are bit-identical to the no-split baseline.
- Browser (local proof): clip or screenshot of a school parting
  around the player in an early/fixture area. The final proof owner of
  the AC-art-geometry juice-part browser union is WI-06d-b6 — do not
  re-assert the six-effect union here.

## Constraints, assumptions, non-goals

- Render only: no steering-rule changes, no creature AI, no balance
  changes, no new content.
- No changes to particles (WI-06d-b1), lighting (WI-06d-b2), HUD
  (WI-06d-b3) or camera (WI-06d-b4); no audio.
- Spoiler rules (sections 0, 12, 68, 70): record with early bands or
  private fixtures and internal ids only.

## Fresh-session handoff

Read WI-06d-b/plan.md (story scope and proof ownership). Inspect the
school render path in the ST-02/ST-03 creature renderer (the school
member draw call and where per-member render offsets can be applied),
and the shared scenario harness for the steering-outcome comparison.
Request sections: 14.3, 34, 35, 48, 70.

## Result (2026-09-07)

Implemented parting schools: schooling creatures render offset away from the player within 300u proximity, re-forming after departure. Pure render offset — sim positions/velocities unchanged. 19 Node tests pass (split logic + scenario).
