---
id: WI-06d-b
kind: work_item
parent: WI-06d
children: []
depends_on: ["WI-06a", "WI-06b", "WI-06c"]
criteria:
  AC-art-geometry: "Obvious debug geometry is replaced in all critical-path areas and the section 48 juice list (bubbles, silt, light sway, depth-record tick, distant-motion impulse, parting schools) is present"
  AC-art-palettes: "Every depth band has a distinct palette family, particle profile, light attenuation, and background silhouette in the browser, with the section 14.1 graphic-novel/sonar/cut-paper hybrid reading at 1080p"
behavior: "Implement the six section 48 juice effects (bubbles, silt, light sway, depth-record tick, distant-motion impulse, parting schools) by extending the section 35 effects toolbox, and record the cross-band contrast walk proving every band is distinct"
subsystems: ["rendering and materials"]
verification: "Each juice effect triggered and recorded in the browser; cross-band contrast walk recording per band that palette family, particle profile, light attenuation and background silhouette are each distinct between adjacent bands (at least two identity factors) with the section 14.1 hybrid reading at 1080p; headless suite and build stay green; performance spot-check per section 34"
---

# WI-06d-b — Section 48 juice effects and cross-band contrast walk

## Goal

Implement the six section 48 juice effects by extending the existing
section 35 effects toolbox in `src/render/` (particles, postfx, sonar) —
do not rebuild it. The six effects: bubbles, silt, light sway,
depth-record tick, distant-motion impulse, and parting schools. After
all six are in, record the cross-band contrast walk proving every band
is distinct in at least two identity factors with the section 14.1
hybrid reading at 1080p.

## Deliverables (checkable)

- Bubbles and silt: particle systems extending the section 35 particle
  toolbox. Emission tables are data-driven (Node-testable).
- Light sway: light animation in the section 35 postfx path — low-
  amplitude, slow period; per-band tuned to match the settled look.
- Depth-record tick: HUD-adjacent cue (seam in `src/ui/hud.ts`) that
  fires when the player sets a new depth record. No gameplay logic
  beyond the depth comparison already in the sim.
- Distant-motion impulse: low-amplitude camera nudge triggered by
  distant large motion (creature or environmental). The nudge feeds
  the presentation flag that WI-06d-c's shake path gates. No steering
  or balance changes.
- Parting schools: school render splitting around the player (ST-02/
  ST-03 schools). Render behavior only — no steering-rule changes. The
  split is a visual effect: schools visually part when the player
  enters their proximity, then re-form.
- Cross-band contrast walk: recorded per-band verification that
  palette family, particle profile, light attenuation, and background
  silhouette are each distinct between adjacent bands (at least two
  identity factors per band), with the section 14.1 hybrid reading
  at 1080p.

## Tests

- Node: juice and shake data (emission tables, the distant-motion
  impulse trigger params, parting-schools split state) covered by unit
  tests. Parting-schools scenario asserting the school render-split
  state toggles around the player without changing steering outcomes.
  Suite and build stay green.
- Browser (final proof owner of the AC-art-geometry juice part): each
  of the six juice effects triggered and recorded in the browser with
  a short clip or screenshot showing it working.
- Browser (final proof owner of the AC-art-palettes cross-band walk):
  cross-band contrast walk — record per band that palette family,
  particle profile, light attenuation and background silhouette are
  each distinct between adjacent bands (at least two identity factors),
  with the section 14.1 hybrid reading at 1080p. No other child
  re-asserts this union.
- Performance spot-check per section 34: frame rate recorded during
  the cross-band walk; no band drops below the section 34 budget.

## Constraints, assumptions, non-goals

- Extend, do not rebuild: the section 35 toolbox (particles, postfx,
  sonar) is the foundation. New effects are extensions, not rewrites.
- Restraint: juice must not hurt readability at 1080p in motion (section
  14.3) or break the section 34 budgets.
- No audio changes (WI-06e), no map (WI-06f), no a11y UI (WI-06g) — only
  the presentation flag and HUD-adjacent cue seams they will consume.
- No new gameplay rules, no steering or balance changes, no new content.
- The distant-motion impulse feeds the presentation flag WI-06d-c's
  shake path reads; this item implements the trigger and the nudge,
  not the low-frequency gate or the amplitude budget (WI-06d-c).
- Spoiler rules (sections 0, 12, 68, 70): late-game areas are recorded
  with private fixtures and internal ids only.

## Fresh-session handoff

Read WI-06d/plan.md (story scope; criteria assignment; this item owns
the juice part of AC-art-geometry and the AC-art-palettes cross-band
walk), ST-06/plan.md, request sections 14.1, 14.3, 34, 35, 48, 70.
Inspect `src/render/` (particles, postfx, sonar) for the section 35
toolbox extension points, `src/ui/hud.ts` for the depth-record cue
seam, and the school render path in the ST-02/ST-03 creature renderer
for the parting-schools split. Read the three band items (WI-06a,
WI-06b, WI-06c) for the settled per-band look that the juice must
complement.
