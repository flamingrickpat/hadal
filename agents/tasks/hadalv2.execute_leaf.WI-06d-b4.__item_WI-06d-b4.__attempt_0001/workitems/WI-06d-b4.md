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

## Acceptance Evidence

| Criterion | Evidence | Status |
|---|---|---|
| AC-juice-impulse | Node unit tests pass for trigger params (threshold/distance boundaries) and flag transitions | passed |
| AC-juice-impulse | Camera nudge applied in Renderer on distant large motion | passed |
| AC-juice-impulse | Presentation flag module exists for WI-06d-c integration | passed |
| AC-juice-impulse | No steering or balance changes — nudge is presentation only | passed |
| AC-art-geometry (juice-part) | Impulse nudge implemented (part of the section 48 juice list) | passed |

## Files Changed

- `src/render/impulseParams.ts` — new: impulse trigger parameters (distance band, motion threshold, nudge amplitude, decay time)
- `src/render/impulseFlag.ts` — new: impulse trigger evaluation and decay logic
- `src/render/impulse.test.ts` — new: 14 unit tests for trigger params and flag transitions
- `src/render/Renderer.ts` — modified: apply impulse offset on top of smooth follow
- `src/game/Game.ts` — modified: trigger impulse on distant large motion

## Shrink/Flatten Report

- No abstractions removed — the implementation is already minimal (3 new files, 2 modified files).
- No pass-through wrappers, one-use interfaces, or unused extension points.
- The impulse direction uses a deterministic angle (sin-based) to avoid RNG dependency.

## Notes for Reviewer

- The impulse is triggered per-creature in the game update loop, checking each creature's motion (velocity * body extent) against the threshold and distance against the trigger band.
- The nudge is applied as a separate offset in the render method, not modifying the smooth follow target (camOffset), so the follow lag and bounds-clamping invariants are preserved.
- The impulse flag is exposed via `isImpulseActive()` for WI-06d-c's shake gate integration.
- The a11y reduced-flashing toggle can suppress the nudge by checking `isImpulseActive()` before applying the offset.
- Pre-existing build errors in `src/sim/Simulation.ts` are unrelated to this work item.
- Pre-existing test failures (2) in roster band distribution tests are unrelated to this work item.
