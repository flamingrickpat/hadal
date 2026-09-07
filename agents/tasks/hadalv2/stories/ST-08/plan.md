---
id: ST-08
kind: story
parent: null
children: []
depends_on: ["ST-07"]
criteria:
  AC-fin-mvp: "Every section 45 MVP acceptance criterion is evidenced at its assigned layer: headless for rules, reachability, and persistence; browser inspection for presentation, audio, performance, and usability"
  AC-fin-run: "The game is playable from a fresh browser profile to the ending with no developer intervention, with save, death, respawn, and restart all working from a clean start"
  AC-fin-spoiler: "A final audit of commits, notes, screenshots, and the public README confirms no development artifact spoiled hidden content, and the README is spoiler-safe per section 69"
  AC-fin-checklist: "The section 70 final coverage checklist (boot, core loop, progression, creatures, save, ending) passes with recorded commands, exit statuses, and scenario names"
behavior: "Run the spoiler-safe handoff (request phase 9, sections 45, 69, 70): final end-to-end verification across all evidence layers, the public README, and the spoiler audit"
subsystems: ["verification and handoff", "debug telemetry", "save system"]
verification: "Recorded headless suite run, browser harness run, and a fresh-profile manual playthrough to an ending; README diff against the section 69 list; audit log listing every checked commit and artifact"
---

# ST-08 — Final verification and spoiler-safe handoff (UNEXPANDED)

## Status

Explicit expansion task. Split in a future planning session; natural split:
(1) end-to-end fresh-save verification (headless + browser, the section 70
checklist); (2) README and developer-section finishing per section 69;
(3) the spoiler audit of the full commit history, notes, and artifacts.

## Scope inventory (honest)

- Full MVP gate per section 45: new-game-to-ending playable, four+
  meaningful depth transitions, crafting gates depth, 15+ creatures, 4+
  non-pursuit behaviors, 2+ friendly, 3+ large-scale, 5+ surprise beats,
  MacGuffin reach and retrieval effect, death and save/load, under-2.5-hour
  blind completion, smooth largest encounter, no development spoilers.
- Section 70 final coverage checklist end to end: boot, core loop,
  progression, creatures, save, ending - with commands, exit statuses, and
  scenario names recorded in the role artifact.
- Re-verify ST-06's map overlay (AC-art-map) and accessibility controls
  (AC-art-a11y) in the final fresh-profile pass; failures go through the
  fix-planning route, not into this story.
- README per section 69: install, build, controls, browser requirements,
  expected playtime, save location, developer section; no creature list, no
  story synopsis beyond the starting premise.
- Spoiler audit per sections 0/68/70: commit messages, screenshots,
  progress reports, task notes, and `agents/projects/hadal/` notes checked
  for leaked hidden content.

## Dependencies and boundaries

- Depends on ST-07; this is the last story. Anything it finds broken goes
  through the existing fix-planning route (fresh ids), not into this
  story's scope.
- A whole-game delivery check that also promises to fix arbitrary defects
  is oversized - this story verifies and records; fixes are separate items.

## Constraints and non-goals

- No feature work; only verification, documentation, and small user-facing
  fixes (README). The section 26 map overlay and the section 43
  accessibility controls are owned by ST-06 (AC-art-map, AC-art-a11y);
  ST-08 re-verifies them, it does not implement them.
- Handoff message to the human per section 68: how to run, controls, save
  status, target playtime, technical limitations - nothing else.

## Fresh-session handoff for the expander

Read request sections 26, 43, 45, 68, 69, 70; the section 70 evidence layers
for which claims need which proof; ST-06's AC-art-map/AC-art-a11y for the
re-verification; `understanding.md` for the baseline seams.
The audit log is a normal (non-private) artifact; it lists artifacts
checked, never their hidden content.
