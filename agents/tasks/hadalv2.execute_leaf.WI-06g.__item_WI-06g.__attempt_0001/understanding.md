# Understanding

This child implements one independently reviewed work item from C:\Temp\hadal-v2\agents\tasks\hadalv2.

---
id: WI-06g
kind: work_item
parent: ST-06
children: []
depends_on: ["WI-04b", "WI-06d"]
criteria:
  AC-art-a11y: "The section 43 accessibility controls work and persist through a save round-trip: master volume slider, screen shake toggle, reduced flashing toggle, and text subtitles for radio messages, plus a high-contrast sonar option if easy or a recorded cut; verified in the browser"
behavior: "Land the section 43 accessibility controls - master volume slider, screen shake toggle, reduced flashing toggle, text subtitles for radio messages, and a high-contrast sonar option if easy or a recorded cut - in the settings UI, wired into the audio, render and sonar paths, and persisted through a versioned save-settings round-trip"
subsystems: ["UI overlays and settings", "audio system", "rendering and materials"]
verification: "Browser checks: each control works live (master volume slider scales the mix, screen shake toggle gates the WI-06d shake path, reduced flashing toggle removes flashing effects, radio messages render as on-screen text, high-contrast sonar option works or the cut is recorded); each control persists through a save round-trip via the shared browser harness (change, save, reload, assert); Node test on the save settings schema (new fields, defaults, migration); suite and build stay green"
---

# WI-06g — Section 43 accessibility controls

## Goal

Land the section 43 accessibility controls in the existing settings UI:
the master volume slider (the baseline audio work already persists
`save.settings.masterVolume` - wire and verify it in the UI), a screen
shake toggle (gates the WI-06d low-frequency shake path via its
presentation flag), a reduced flashing toggle (removes flashing effect
sources), text subtitles for radio messages (WI-04b's radio channel),
and a high-contrast sonar option if it is easy - otherwise a recorded
cut. All controls persist through a save round-trip: the new fields
extend the versioned save settings, keeping the section 42 migration
trivial.

## Deliverables (checkable)

- Settings UI entries in `src/ui/` (menu/settings area) for all five
  controls, in the existing UI language.
- Screen shake toggle: flips the single presentation flag WI-06d's
  shake path reads; flag off means no shake from any source.
- Reduced flashing toggle: removes the named flashing effect sources
  (recorded in the evidence) via the same flag-gated pattern.
- Radio-message subtitles: every radio message from WI-04b's radio
  channel also renders as on-screen text in the subtitle line (HUD
  seam); content is read from WI-04b's data, not duplicated.
- Master volume slider: wired to the existing
  `save.settings.masterVolume` seam; the full audio mix scales with it.
- High-contrast sonar option: implemented if it fits the section 35
  sonar path without a rewrite; otherwise a recorded cut with the
  reason (section 43 allows either).
- Save settings schema extension in `src/game/save.ts`: new versioned
  fields with defaults, a section 42-compatible migration, and a Node
  test for the round-trip (old save without the fields loads with
  defaults; new fields survive a save/load cycle).

## Tests

- Node: settings schema test - defaults, old-save migration, and
  save/load round-trip for every new field; suite and build stay green.
- Browser (final proof owner of AC-art-a11y): each control verified
  live - slider scales the mix, shake toggle on/off with a shake source
  active, reduced flashing toggle with a flashing effect active,
  subtitles appearing for a radio message, high-contrast sonar option
  (or the recorded cut); then each control set to a non-default value,
  saved, reloaded, and asserted to persist.

## Constraints, assumptions, non-goals

- Presentation/state only: the toggles gate existing rendering, audio
  and sonar paths; they add no gameplay rules.
- No shake or flash sources added here (WI-06d owns the shake path and
  juice effects); this item consumes their seams.
- No radio content authoring (WI-04b owns the messages); no sonar
  redesign (section 35 system stays as-is except the optional contrast
  mode).
- No new save format: versioned fields + trivial migration per section
  42.
- Spoiler rules (sections 0, 12, 68, 70): subtitle evidence uses
  fixture messages or is redacted; internal ids only in commits.

## Fresh-session handoff

Read ST-06/plan.md, request sections 26-adjacent UI context is not
needed; read section 43, WI-04b (radio channel data), WI-06d (the shake
presentation flag), and `understanding.md`. Inspect `src/ui/menu.ts`,
`src/ui/hud.ts` (subtitle line seam), `src/game/save.ts`,
`src/systems/AudioSystem.ts`, and the sonar path in `src/render/`.

