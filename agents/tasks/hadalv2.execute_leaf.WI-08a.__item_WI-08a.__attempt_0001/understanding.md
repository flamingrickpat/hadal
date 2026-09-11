# Understanding

This child implements one independently reviewed work item from C:\Temp\hadal-v2\agents\tasks\hadalv2.

---
id: WI-08a
kind: work_item
parent: ST-08
children: []
depends_on: []
criteria:
  AC-fin-mvp: "Every section 45 MVP acceptance criterion is evidenced at its assigned layer: headless for rules, reachability, and persistence; browser inspection for presentation, audio, performance, and usability"
  AC-fin-run: "The game is playable from a fresh browser profile to the ending with no developer intervention, with save, death, respawn, and restart all working from a clean start"
  AC-fin-checklist: "The section 70 final coverage checklist (boot, core loop, progression, creatures, save, ending) passes with recorded commands, exit statuses, and scenario names"
behavior: "Run the section 70 final coverage checklist end to end from a fresh save - headless suite, shared browser harness, and one fresh-profile manual playthrough to an ending - re-verify ST-06's map overlay and accessibility controls, and record commands, exit statuses, and scenario names, routing any failure to fix planning instead of fixing in place"
subsystems: ["verification and handoff", "debug telemetry", "save system"]
verification: "Recorded headless suite run (exit status + scenario names) and shared browser harness run (exit status + checked claims) covering boot, core loop, progression, creatures, save, and ending; a fresh-profile manual playthrough log reaching an ending with save, death, respawn, and restart all observed from a clean start; re-verification notes for AC-art-map and AC-art-a11y; a per-criterion layer-evidence table for the section 45 MVP list (rules/reachability/persistence headless, presentation/audio/performance/usability browser)"
---

# WI-08a — Fresh-save end-to-end verification and section 70 checklist

## Goal

Prove, from a clean fresh save, that the ST-07 game is playable to an ending
with no developer intervention, and record the section 70 final coverage
checklist with commands, exit statuses, and scenario names. This leaf is the
layer-evidence base for the story: it runs the headless suite, the shared
browser harness, and one fresh-profile manual playthrough, re-verifies ST-06's
map overlay and accessibility controls in that pass, and writes the per-criterion
layer-evidence table for the section 45 MVP list. It verifies and records; it
does not fix. A product defect found here is a fresh work item through the
fix-planning route, not an in-place edit. It is the named final proof owner of
AC-fin-run and AC-fin-checklist, and of AC-fin-mvp's "evidenced at its assigned
layer" half.

## Deliverables (checkable)

- A recorded headless run of the full section 70 suite (commands + exit status +
  scenario names): rules, reachability (fresh-save route scenarios paired with
  `simulateCriticalPath()`), persistence (save round trips), and trigger
  behavior.
- A recorded shared browser harness run (commands + exit status + checked
  claims): fresh boot with a visible WebGL scene and no console errors, keyboard
  input moving the player, HUD reflecting simulation state, storage round-trip
  across a real reload, resize, and audio-after-input.
- One fresh-profile manual playthrough to an ending, logged: save, death,
  respawn, and restart all observed from a clean start; no console commands,
  teleport, noclip, or free materials used as progression.
- Re-verification notes for the two ST-06 criteria in the final fresh-profile
  pass (their verbatim text is below), plus the layer-evidence table mapping
  each section 45 MVP criterion to its evidence layer.

## Re-verification of ST-06 criteria (verbatim)

- AC-art-map: "The section 26 bathymetry map opens on Tab and pauses the game;
  it shows the player position, explored chunk silhouettes from the tracked
  discoveredChunks state, the base, discovered major landmarks, and a death
  beacon only if one is tracked, and it never shows creature locations;
  verified in the browser."
- AC-art-a11y: "The section 43 accessibility controls work and persist through a
  save round-trip: master volume slider, screen shake toggle, reduced flashing
  toggle, and text subtitles for radio messages, plus a high-contrast sonar
  option if easy or a recorded cut; verified in the browser."

## Tests

- Node (headless, final proof for AC-fin-run rules/persistence half): run the
  section 70 headless scenarios; assert exit 0 and record the scenario names.
  Keep the core-loop steps 1-9 as one continuous fresh-save scenario; add
  separate death, depleted-resources, insufficient-materials, and blocked-route
  scenarios; verify ending triggers and save continuity headlessly.
- Browser (final proof owner of AC-fin-run presentation half and
  AC-fin-checklist): run the shared harness for boot, input, HUD, storage
  round-trip, resize, and audio-after-input; assert the section 70 boot/core-loop
  browser claims; re-verify AC-art-map (Tab opens, pauses, contents, no creature
  markers) and AC-art-a11y (toggles work and persist through a save round-trip)
  in the same pass.
- Manual (final proof for AC-fin-run): fresh browser profile, new game, play to
  an ending; log each save, death, respawn, and restart; confirm no developer
  intervention was required.

## Constraints, assumptions, non-goals

- Verify and record only. No product code changes. Any defect is filed through
  the normal fix-planning route as a fresh work item; do not fix it here.
- No teleport/noclip/free-materials/direct-state-edit as reachability proof
  (section 70). Fixture-based evidence is labeled and never implies fresh-save
  reachability.
- Spoiler rules (sections 0, 12, 68, 70): late-game scenes are inspected with
  private fixtures and reported by internal id or band, never by name;
  screenshots use early-game coast or generic debug areas.
- Does not own AC-fin-spoiler (WI-08b) or the README (WI-08c); it only re-
  verifies the two ST-06 presentation criteria.

## Fresh-session handoff

Read ST-08/plan.md (this is the final proof owner of AC-fin-run and
AC-fin-checklist, and of AC-fin-mvp's layer-evidence half), request section 45
(MVP list) and section 70 (evidence layers + final coverage checklist); ST-06's
AC-art-map / AC-art-a11y (above, verbatim). Run the headless scenario harness
(`src/sim/scenario.ts`) and the shared browser harness; record commands, exit
statuses, and scenario names in the role artifact; build the per-criterion
layer-evidence table for the section 45 list.

