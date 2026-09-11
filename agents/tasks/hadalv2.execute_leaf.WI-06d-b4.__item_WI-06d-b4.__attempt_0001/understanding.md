# Understanding

This child implements one independently reviewed work item from C:\Temp\hadal-v2\agents\tasks\hadalv2.

---
id: WI-06d-b4
kind: work_item
parent: WI-06d-b
children: []
depends_on: ["WI-06a", "WI-06b", "WI-06c"]
criteria:
  AC-art-geometry: "Obvious debug geometry is replaced in all critical-path areas and the section 48 juice list (bubbles, silt, light sway, depth-record tick, distant-motion impulse, parting schools) is present"
  AC-juice-impulse: "A low-amplitude camera nudge triggers on distant large motion (creature or environmental) and sets the presentation flag WI-06d-c's shake path gates, with trigger params covered by Node unit tests and no steering or balance changes"
behavior: "Implement the distant-motion impulse: low-amplitude camera nudge plus the presentation flag WI-06d-c's shake path gates"
subsystems: ["rendering - camera nudge and impulse flag"]
verification: "Node unit tests pass for the impulse trigger params and flag transitions; browser clip or screenshot of the nudge on a distant large motion; headless suite and build stay green; integration of the flag with WI-06d-c's shake gate is proven there, not here"
---

# WI-06d-b4 — Distant-motion impulse

## Goal

Implement the section 48 distant-motion impulse: when a large distant
motion happens (a big creature passing far away, or an environmental
event), the camera takes a low-amplitude nudge, and a presentation
flag is set that WI-06d-c's low-frequency shake path will gate on.
This item implements the trigger and the nudge — not the low-frequency
gate or the amplitude budget, which belong to WI-06d-c.

## Changed responsibilities (the only owners that change)

1. `src/render/Renderer.ts` — the camera follow path: apply a decaying
   low-amplitude offset (the nudge) on top of the existing smooth
   follow, without touching the follow lag or bounds-clamping
   invariants.
2. The presentation flag — a small shared presentation-state module
   (new file in `src/render/` or `src/game/`) exposing the impulse
   flag WI-06d-c's shake path will read; no other consumers exist
   yet.
3. The impulse trigger parameters — data module (trigger distance
  band, motion threshold, nudge amplitude, decay time) as pure data,
  Node-testable.

Tests do not count as additional responsibilities.

## Deliverables (checkable)

- Trigger: distant large motion (creature or environmental) sets the
  impulse; nearby motion and small distant motion do not.
- Nudge: low amplitude, short decay, no steering or balance effect.
- Flag: set for the trigger duration; WI-06d-c reads it (its
  integration proof lives in WI-06d-c).

## Tests

- Node: unit tests for trigger params (threshold/distance boundaries)
  and flag transitions (set on distant large motion, cleared after
  decay, not set by near or small motion).
- Browser (local proof): clip or screenshot of the nudge firing on a
  distant large motion in an early/fixture area. The final proof
  owner of the AC-art-geometry juice-part browser union is
  WI-06d-b6 — do not re-assert the six-effect union here.

## Constraints, assumptions, non-goals

- No steering rules, no creature AI, no balance changes — the nudge
  is presentation only.
- The low-frequency gate and amplitude budget of the section 16 shake
  rules are WI-06d-c's scope; do not implement them here.
- The a11y reduced-flashing toggle (WI-06g) will gate this nudge
  downstream; the flag design must let a single boolean suppress it.
- No changes to particles (WI-06d-b1), lighting (WI-06d-b2), HUD
  (WI-06d-b3) or schools (WI-06d-b5); no audio.

## Fresh-session handoff

Read WI-06d-b/plan.md (story scope and proof ownership) and WI-06d-c
for the shake path this flag feeds. Inspect `src/render/Renderer.ts`
(camera follow, lag constant) and how creature/environmental motion
is observable from the render layer. Request sections: 14.3, 16, 34,
35, 48, 70.

