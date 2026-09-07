---
id: WI-06d-b6
kind: work_item
parent: WI-06d-b
children: []
depends_on: ["WI-06a", "WI-06b", "WI-06c", "WI-06d-b1", "WI-06d-b2", "WI-06d-b3", "WI-06d-b4", "WI-06d-b5"]
criteria:
  AC-art-geometry: "Obvious debug geometry is replaced in all critical-path areas and the section 48 juice list (bubbles, silt, light sway, depth-record tick, distant-motion impulse, parting schools) is present"
  AC-art-palettes: "Every depth band has a distinct palette family, particle profile, light attenuation, and background silhouette in the browser, with the section 14.1 graphic-novel/sonar/cut-paper hybrid reading at 1080p"
  AC-perf-walk: "Frame rate is recorded during the cross-band walk and no band drops below the section 34 performance budget"
behavior: "Record the cross-band contrast walk and re-trigger all six juice effects: final proof of the AC-art-geometry juice part and the AC-art-palettes cross-band walk, plus the section 34 performance spot-check"
subsystems: ["rendering - verification and evidence"]
verification: "Recorded cross-band contrast walk (one entry per band: palette family, particle profile, light attenuation, background silhouette, each marked distinct between adjacent bands with at least two identity factors) at 1080p with the section 14.1 hybrid reading; recorded six-effect juice re-trigger; recorded frame-rate log per band within the section 34 budget; headless suite and build stay green"
---

# WI-06d-b6 — Cross-band contrast walk and final juice proof

## Goal

After all six juice effects (WI-06d-b1..b5) and the three band passes
(WI-06a/b/c) are in, prove the visual union in the browser: record the
cross-band contrast walk (every band distinct in at least two identity
factors, section 14.1 hybrid reading at 1080p) and re-trigger all six
juice effects end to end. This item is the final proof owner of both
retained parent criteria — no other child re-asserts this union. It
also carries the section 34 performance spot-check (AC-perf-walk).

## Changed responsibilities (the only owners that change)

1. The shared browser harness — add the cross-band walk scenario:
   script the visit of every critical-path band, trigger each of the
   six juice effects at the appropriate band, and capture per-band
   screenshots/frames for the identity-factor comparison.
2. The performance log for the walk — a small harness-side frame-rate
   recording (per-band average/frame times written into the evidence
   output), so AC-perf-walk is measured rather than eyeballed.

That is the complete owner list: this item changes verification
tooling and evidence only. No product art, render code or game code
changes here — if the walk finds a band that is not distinct in two
identity factors, or a band below the section 34 budget, that is a
defect report through the fix-planning route, not an inline art fix.

## Deliverables (checkable)

- Cross-band contrast walk recording: one entry per band naming the
  palette family, particle profile, light attenuation and background
  silhouette; adjacent bands differ in at least two identity factors;
  the section 14.1 graphic-novel/sonar/cut-paper hybrid reading holds
  at 1080p.
- Six-effect juice re-trigger recording: each of bubbles, silt, light
  sway, depth-record tick, distant-motion impulse and parting schools
  triggered and captured in this final pass.
- Frame-rate log per band; every band within the section 34 budget.

## Tests

- Browser (final proof owner, both retained criteria): the recorded
  walk plus the recorded six-effect re-trigger, as evidence in this
  item's folder.
- Node: the harness scenario itself is covered by the harness test
  suite (suite and build stay green).

## Constraints, assumptions, non-goals

- Verification-focused: no product code changes by default;
  discoveries (a too-similar band, a missed budget) go through the
  fix-planning route as defect reports.
- Restraint checks: readability at 1080p in motion (section 14.3) is
  judged from the walk footage.
- Spoiler rules (sections 0, 12, 68, 70): late-game bands are recorded
  with private fixtures and internal ids only.
- No audio (WI-06e), no map (WI-06f), no a11y UI (WI-06g).

## Fresh-session handoff

Read WI-06d-b/plan.md (proof ownership) and the three band items
(WI-06a, WI-06b, WI-06c) for the per-band identity factors to compare.
Use the shared browser harness for band traversal and capture, and the
section 34 budget values from the request for the frame-rate log.
Request sections: 14.1, 14.3, 34, 48, 70.
