---
id: WI-06d-a
kind: work_item
parent: WI-06d
children: []
depends_on: ["WI-06a", "WI-06b", "WI-06c"]
criteria:
  AC-art-geometry: "Obvious debug geometry is replaced in all critical-path areas and the section 48 juice list (bubbles, silt, light sway, depth-record tick, distant-motion impulse, parting schools) is present"
behavior: "Replace all obvious debug geometry in the critical-path areas with band-consistent real geometry, verified by a recorded inventory walk with before/after notes per area"
subsystems: ["world content data"]
verification: "Recorded critical-path walk (browser) of all five bands plus the base and the final zone approach showing no obvious debug geometry remaining; before/after notes per area; headless suite and build stay green; performance spot-check per section 34"
---

# WI-06d-a — Debug geometry replacement in all critical-path areas

## Goal

Walk every critical-path area (all five depth bands, the base, and the
final zone approach) and replace the obvious debug geometry (placeholder
boxes, wire frames, and other clearly-artificial stand-ins for real
structure) with geometry consistent with the dressed bands. The result:
a player traversing the critical path sees no "placeholder" geometry —
every visible surface is part of the intended band identity.

## Deliverables (checkable)

- A recorded inventory walk of every critical-path area with before/after
  notes per area. Each note names the area (internal id), the debug
  geometry found, the replacement applied, and the band-consistency
  rationale (which section 14.3 factors the replacement aligns with).
- If a replacement exposes a real simulation gap (e.g. the geometry
  implies a collision surface or a gate that does not exist in the sim),
  record it as a defect report with scene, reproduction steps, and
  severity. Do not add gameplay rules to close it.
- No new content beyond replacing existing placeholder geometry with
  band-consistent structure. No new creatures, mechanics, or areas.

## Tests

- Browser (final proof owner of the AC-art-geometry geometry part):
  critical-path walk recording all areas with no obvious debug geometry
  remaining. The walk covers all five bands, the base, and the final
  zone approach. Each area is captured before/after with notes.
- Headless: suite and build stay green after the content data changes.
- Performance spot-check per section 34: the walk is performed at 1080p
  and frame rate is recorded per area; no area drops below the section 34
  budget.

## Constraints, assumptions, non-goals

- Band identity is set by WI-06a/b/c; this item replaces geometry to
  match the settled look, not to redefine it. If a band's settled look
  makes a particular replacement ambiguous, note the assumption and
  proceed with the most conservative choice.
- No juice effects (WI-06d-b), no shake or widescreen work (WI-06d-c).
- No new gameplay rules, no steering or balance changes, no new content.
- Spoiler rules (sections 0, 12, 68, 70): late-game areas (final zone
  approach and deep bands) are recorded with private fixtures and internal
  ids only; no creature names or lore in evidence.
- Restraint: replacements must not hurt readability at 1080p in motion
  (section 14.3); the section 34 budgets apply.

## Fresh-session handoff

Read WI-06d/plan.md (story scope; criteria assignment; proof ownership),
ST-06/plan.md (band identity scope; section 14.3 factors), request
sections 14.3, 34, 70. Read the three band items (WI-06a, WI-06b,
WI-06c) for the settled band look and their recorded observations.
Inspect the world content data for critical-path areas (the five bands,
base, final zone approach) and identify all placeholder/debug geometry.
Record evidence in the browser; use internal ids only.
