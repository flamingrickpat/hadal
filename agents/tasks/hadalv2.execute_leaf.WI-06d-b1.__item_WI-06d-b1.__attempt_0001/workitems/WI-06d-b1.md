---
id: WI-06d-b1
kind: work_item
parent: WI-06d-b
children: []
depends_on: ["WI-06a", "WI-06b", "WI-06c"]
criteria:
  AC-art-geometry: "Obvious debug geometry is replaced in all critical-path areas and the section 48 juice list (bubbles, silt, light sway, depth-record tick, distant-motion impulse, parting schools) is present"
  AC-juice-particles: "Bubbles and silt particle systems are active in every band, driven by per-band data-driven emission tables, with the emission tables covered by Node unit tests"
behavior: "Add the bubbles and silt juice particle layers to the section 35 particle toolbox with data-driven per-band emission tables"
subsystems: ["rendering - particle toolbox"]
verification: "Node unit tests pass for the bubble/silt emission tables and per-band emission counts; browser clip or screenshot per band showing bubbles and silt working; headless suite and build stay green; section 34 budgets hold"
---

# WI-06d-b1 — Bubbles and silt juice particles

## Goal

Extend the section 35 particle toolbox with the two section 48 juice
particle effects — bubbles and silt — so both are present and tuned per
band. Extend, do not rebuild: the existing particle field owns the
placement, wrap and per-band scaling invariants, and this item adds
layers on top of that design.

## Changed responsibilities (the only owners that change)

1. `src/render/particles.ts` — the particle field: add bubble and silt
   layers (new `makeLayer` calls / a new layer kind), keeping the
   no-reallocation buffer invariant and the active-chunks ambient gate.
2. The per-band juice emission tables — a data module (new file next to
   the band profile data in `src/render/`, or an extension of the
   `BandProfile` data in `src/render/band.ts`) with per-band emission
   rates, sizes, drift and accent values for bubbles and silt. Node-
   testable as pure data.

Tests for these two owners (`src/render/particles.test.ts` and the
emission-table tests) do not count as additional responsibilities.

## Deliverables (checkable)

- Bubbles: a particle layer with per-band emission, size, rise drift
  and fade behavior from the data tables.
- Silt: a particle layer distinct from the existing ambient silt motes
  in profile (juice-scale silt from movement/disturbance per section
  48), likewise data-driven.
- Emission tables are pure data: unit-testable without a browser.

## Tests

- Node: emission-table unit tests (per-band values present for every
  band; counts/sizes within the section 34 budget envelope);
  particle-field tests updated to cover the two new layers (counts
  track the band profile; buffers never re-allocated).
- Browser (local proof): per-band clip or screenshot with bubbles and
  silt visibly active. The final proof owner of the AC-art-geometry
  juice-part browser union is WI-06d-b6 — do not re-assert the six-
  effect union here.

## Constraints, assumptions, non-goals

- Readability: per section 14.3 the juice must not hurt readability at
  1080p in motion; per-band tuning follows the settled band look from
  WI-06a/b/c.
- Section 34 budgets: emission counts stay within budget; the ambient-
  scale gate still disables work near the camera when inactive.
- No changes to light sway (WI-06d-b2), HUD (WI-06d-b3), camera
  (WI-06d-b4) or schools (WI-06d-b5); no new gameplay rules, no
  steering or balance changes, no audio.
- Spoiler rules (sections 0, 12, 68, 70): late-game band recordings use
  private fixtures and internal ids only.

## Fresh-session handoff

Read WI-06d-b/plan.md (story scope and proof ownership) and the three
band items (WI-06a, WI-06b, WI-06c) for the settled per-band look.
Inspect `src/render/particles.ts` (layer construction, per-band counts,
active-chunks gate) and `src/render/band.ts` (BandProfile shape) for
the extension points. Request sections: 14.1, 14.3, 34, 35, 48, 70.
