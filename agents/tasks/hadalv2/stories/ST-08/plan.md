---
id: ST-08
kind: story
parent: null
children: ["WI-08a", "WI-08b", "WI-08c"]
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

# ST-08 — Final verification and spoiler-safe handoff

## Goal

Run the spoiler-safe handoff (request phase 9) on the stable, balanced ST-07
game: prove the game is playable from a fresh browser profile to an ending with
save, death, respawn, and restart all working, record the section 70 final
coverage checklist with commands and exit statuses, finish the public README
and the section 68 handoff message, and audit the whole commit history, notes,
screenshots, and README so nothing leaks hidden content. This story verifies
and records; it does not implement. Anything it finds broken goes through the
existing fix-planning route as a fresh work item, not into this story.

## Why this shape (review split)

The review split this empty story and named three independently shippable
behaviors. Each leaf carries strictly fewer than the parent's four criteria and
keeps the fix-planning-route boundary (verification and recording only):

- WI-08a: the section 70 fresh-save end-to-end pass (headless suite + shared
  browser harness + one fresh-profile manual playthrough to an ending), which
  re-verifies ST-06's map overlay (AC-art-map) and accessibility controls
  (AC-art-a11y) and owns AC-fin-run and AC-fin-checklist.
- WI-08b: the spoiler audit of the full commit history, notes, screenshots, and
  `agents/projects/hadal/` notes, owning AC-fin-spoiler as final proof owner.
- WI-08c: the section 69 README / developer-section finish and the section 68
  handoff message to the human.

## Criteria assignment and proof ownership

Children carry parent criteria verbatim; the union covers all four.

- AC-fin-run: WI-08a alone. Final proof owner: WI-08a - the criterion only
  closes once the recorded fresh-profile playthrough reaches an ending with
  save, death, respawn, and restart all observed from a clean start, never from
  a fixture.
- AC-fin-checklist: WI-08a alone. Final proof owner: WI-08a - the section 70
  checklist (boot, core loop, progression, creatures, save, ending) is recorded
  with commands, exit statuses, and scenario names.
- AC-fin-spoiler: WI-08c produces the final spoiler-safe README (section 69);
  WI-08b is the final proof owner - it audits every checked commit and artifact
  and confirms no development artifact spoiled hidden content.
- AC-fin-mvp: cross-cutting evidence collection, split by the review. WI-08a is
  the final proof owner for the "evidenced at its assigned layer" half (a
  per-criterion table mapping each section 45 MVP criterion to headless for
  rules/reachability/persistence and browser inspection for
  presentation/audio/performance/usability). WI-08b is the final proof owner for
  the no-development-spoilers half (section 45's last bullet: "the user has not
  been spoiled by development chatter").

## Dependencies and execution order

- The story depends on ST-07 (the balanced, arted, content-complete game); all
  leaves inherit it.
- WI-08a (E2E verification) runs first: it is the layer-evidence base for the
  section 45 MVP table and produces the run artifacts the other leaves audit.
- WI-08c (README + handoff message) depends on WI-08a: the section 68 handoff
  message reports whether the full playthrough works and the save status, both
  established by WI-08a's pass; the README documents the final verified state.
- WI-08b (spoiler audit) depends on WI-08a and WI-08c: it is the final gate,
  auditing the E2E artifacts (including screenshots) and the finished README, so
  it must run last.

## Scope inventory (honest, carried into the children)

- Section 70 final coverage checklist end to end: boot, core loop, progression,
  creatures, save, ending - with commands, exit statuses, and scenario names
  recorded in the role artifact. Headless is primary for rules, reachability,
  persistence, and trigger behavior; browser is primary for boot, input, HUD,
  storage round-trip, resize, and audio-after-input; a fresh-profile manual
  playthrough to an ending proves AC-fin-run.
- Re-verify ST-06's map overlay (AC-art-map) and accessibility controls
  (AC-art-a11y) in the final fresh-profile pass. Failures go through the
  fix-planning route, not into this story.
- Section 45 MVP acceptance criteria, each evidenced at its assigned layer
  (headless for rules/reachability/persistence; browser inspection for
  presentation/audio/performance/usability), plus the no-development-spoilers
  bullet.
- README per section 69: install, build, controls, browser requirements,
  expected playtime, save location (`localStorage`), a clearly separated
  developer/debug section; no creature list, no story synopsis beyond the
  starting premise.
- Section 68 handoff message: systems completed, performance, bugs fixed,
  approximate content completeness, whether the full playthrough works - nothing
  that spoils hidden content.
- Spoiler audit per sections 0/68/70: commit messages, screenshots, progress
  reports, task notes, and `agents/projects/hadal/` notes checked for leaked
  hidden content; the audit log lists artifacts checked, never their hidden
  content.

## Constraints and non-goals

- No feature work. This story verifies, records, and edits only the public
  README and the handoff message. A whole-game delivery check that also promises
  to fix arbitrary defects is oversized: this story does not fix product code;
  discoveries become fresh work items through the fix-planning route.
- The section 26 map overlay and section 43 accessibility controls are owned by
  ST-06 (AC-art-map, AC-art-a11y); WI-08a re-verifies them, it does not
  implement them.
- Spoiler rules throughout (sections 0, 12, 68, 70): no deep-creature names or
  descriptions, no lore truth, no MacGuffin truth, no ending variants, no
  late-zone visuals in any report, README, or handoff message; use early-game
  coast or generic debug areas for screenshots.

## Fresh-session handoff (for reviewers of the children)

Each child stands alone with its frontmatter plus this story. Read request
sections 0, 45, 68, 69, 70; the section 70 evidence layers for which claims
need which proof; ST-06's AC-art-map / AC-art-a11y (verbatim in WI-08a) for the
re-verification; the shared browser harness and the headless scenario harness
(`src/sim/scenario.ts`); `understanding.md` for the baseline seams. The audit
log is a normal (non-private) artifact: it lists artifacts checked, never their
hidden content.
