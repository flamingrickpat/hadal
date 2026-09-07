---
id: WI-06d
kind: work_item
parent: ST-06
children: []
depends_on: ["WI-06a", "WI-06b", "WI-06c"]
criteria:
  AC-art-geometry: "Obvious debug geometry is replaced in all critical-path areas and the section 48 juice list (bubbles, silt, light sway, depth-record tick, distant-motion impulse, parting schools) is present"
  AC-art-palettes: "Every depth band has a distinct palette family, particle profile, light attenuation, and background silhouette in the browser, with the section 14.1 graphic-novel/sonar/cut-paper hybrid reading at 1080p"
behavior: "Replace all obvious debug geometry in the critical-path areas with real band-consistent geometry, implement the full section 48 juice list on the existing section 35 effects toolbox, and land the section 16 low-frequency shake rules and widescreen behavior"
subsystems: ["rendering and materials", "world content data"]
verification: "Recorded critical-path walk (browser) showing no obvious debug geometry in any critical-path area (before/after notes per area); each section 48 juice effect demonstrated and recorded (bubbles, silt, light sway, depth-record tick, distant-motion impulse, parting schools); cross-band contrast walk recording that every band is distinct in at least two identity factors with the section 14.1 hybrid reading at 1080p (final proof owner of the AC-art-palettes cross-band part); shake rules and widescreen behavior checked in the browser; headless suite and build stay green; performance spot-check per section 34"
---

# WI-06d — Debug geometry replacement, section 48 juice, camera feel

## Goal

After the three band passes have settled the look of every band, make the
critical path look finished everywhere: replace the obvious debug
geometry (placeholder boxes/wires standing in for real structure) in all
critical-path areas with geometry consistent with the dressed bands, and
implement the full section 48 juice list - bubbles, silt, light sway,
depth-record tick, distant-motion impulse, parting schools - on top of
the existing section 35 effects toolbox in `src/render/` (particles,
postfx, sonar). Also land the section 16 camera feel: low-frequency
shake rules (shake is a presentation flag WI-06g's toggle will gate) and
widescreen behavior.

## Deliverables (checkable)

- A recorded inventory walk of every critical-path area (all five bands
  plus the base and the final zone approach) with the obvious debug
  geometry replaced by band-consistent real geometry; before/after notes
  per area. If a replacement exposes a real simulation gap, record it as
  a defect report - do not add gameplay rules.
- The six section 48 juice effects implemented by extending the section
  35 toolbox (do not rebuild): bubbles and silt (particle systems),
  light sway (light animation), depth-record tick (HUD-adjacent cue),
  distant-motion impulse (low-amplitude camera nudge on distant large
  motion - feeds the shake flag below), parting schools (school render
  splitting around the player; ST-02/ST-03 schools, rendered behavior
  only - no steering-rule changes).
- Section 16 low-frequency shake rules: shake sources emit through one
  low-frequency-gated path driven by a single presentation flag (the
  flag WI-06g's screen-shake toggle controls), with the amplitude
  budget of section 16.
- Widescreen behavior per section 16: composition holds on widescreen
  aspect ratios without letterboxed dead zones.

## Tests

- Node: juice and shake data (emission tables, the shake flag plumbing,
  widescreen layout params) covered by unit tests; parting-schools
  scenario asserting the school render-split state toggles around the
  player without changing steering outcomes; suite and build stay green.
- Browser: critical-path walk with no obvious debug geometry remaining
  (final proof owner of AC-art-geometry); each juice effect triggered
  and recorded; shake behavior observed to stay low-frequency and gated
  by the flag (flag off = no shake); widescreen check at a wide aspect
  ratio.
- Cross-band contrast walk (final proof owner of the AC-art-palettes
  cross-band part): record per band that palette family, particle
  profile, light attenuation and background silhouette are each
  distinct between adjacent bands (at least two identity factors), with
  the section 14.1 hybrid reading at 1080p. No other child re-asserts
  this union.

## Constraints, assumptions, non-goals

- Restraint: juice must not hurt readability at 1080p in motion or the
  section 34 budgets; spot-check performance while verifying.
- No audio changes (WI-06e), no map (WI-06f), no a11y UI (WI-06g) - only
  the presentation flag and HUD-adjacent cue seams they will consume.
- No new gameplay rules, no steering or balance changes, no new content.
- Spoiler rules (sections 0, 12, 68, 70): late-game areas are recorded
  with private fixtures and internal ids only.

## Fresh-session handoff

Read ST-06/plan.md, request sections 14.3, 16, 34, 35, 48, 70, and the
three band items (WI-06a, WI-06b, WI-06c) for the settled band look.
Inspect `src/render/` (particles, postfx, sonar, camera/shake paths) and
`src/ui/hud.ts` for the depth-record cue seam.
