---
id: ST-04
kind: story
parent: null
children: ["WI-04a", "WI-04b", "WI-04c", "WI-04d"]
depends_on: ["ST-03"]
criteria:
  AC-enc-beats: "At least 5 authored spectacle beats fire through the trigger system inside live gameplay, each with authored timing, entrance, environmental reaction, and an available escape path"
  AC-enc-story: "The environmental story sequence is delivered through 8-12 radio messages, 10-16 short text fragments, 6-10 no-text story props, 3-5 major landmarks with visible history, and 1-2 deep discoveries contradicting the official timeline"
  AC-enc-reactions: "World-state reactions alter at least three earlier zones after major milestones through story flags and spawn-table changes"
  AC-enc-puzzles: "3-5 environmental puzzle moments exist near the critical path and are completable headlessly through the scenario harness"
behavior: "Author the encounter and story layer (request sections 22, 36, 38, 51, 60, 66): spectacle beats, the four-channel story delivery, world reactions, and environmental puzzles, all trigger-driven"
subsystems: ["trigger system", "world content data", "creature simulation", "headless scenario tests"]
verification: "Node scenarios fire each beat, each puzzle, and each flag-gated reaction from a fresh save; browser checks confirm the beats read as authored moments; every fragment passes the section 38 keep-or-delete test"
---

# ST-04 — Authored encounters, story sequence, world reactions

## Goal

Author the encounter and story layer on the WI-07 baseline: the five+
spectacle beats, the four-channel environmental story payload, the
flag-gated world-state reactions, and the 3-5 environmental puzzles, all
data-driven through the existing `EncounterTrigger` system
(`src/world/triggers.ts`) and the production world data
(`src/world/worldData.ts`). Beats stage around stable ST-03 roster ids.
Nothing here names deep creatures, the lore truth, or the MacGuffin
(sections 0, 12, 68); the private reveal map from WI-01c is the source of
truth and is referenced by id only, never quoted.

## Why this shape (review split)

The review split this empty story (15+ distinct deliverable behaviors).
Each child carries exactly one parent criterion (strictly fewer than the
parent's four) and at most three named changed responsibilities:

- WI-04a: the five+ authored spectacle beats (section 11.4 staging grammar,
  section 67 staging rules).
- WI-04b: the section 22 four-channel story payload inside the section 38
  budget, plus the section 51 foreshadow placement.
- WI-04c: the section 60 flag-gated world-state reactions.
- WI-04d: the 3-5 section 66 environmental puzzle moments.

## Criteria assignment and proof ownership

Children carry parent criteria verbatim; the union covers all four.

- AC-enc-beats: WI-04a alone. Final proof owner: WI-04a - one headless
  scenario per beat fired from a fresh save, plus the browser check that
  the beats read as authored moments in sequence (the cross-child proof of
  "inside live gameplay"; no other child re-asserts it).
- AC-enc-story: WI-04b alone. Final proof owner: WI-04b - the section 38
  budget check across all four channels, the keep-or-delete classification
  of every written fragment, and the section 51 foreshadow coverage check
  (2-4 earlier traces per major late reveal, none naming the reveal).
- AC-enc-reactions: WI-04c alone. Final proof owner: WI-04c - fresh-save
  scenarios that hit the authored milestone, physically return to at least
  three earlier zones, and assert the flag-gated spawn-table and
  world-state changes.
- AC-enc-puzzles: WI-04d alone. Final proof owner: WI-04d - one headless
  scenario per puzzle completed through the scenario harness from a fresh
  save, asserting the completion flag is set.

## Dependency notes

- The story depends on ST-03: beats reference stable roster organism ids
  and states; puzzle types that lure creatures reuse ST-03 behavior.
- WI-04a, WI-04b and WI-04d are parallel. WI-04c depends on WI-04a and
  WI-04d: reaction gates read the completion story flags their triggers
  set (the "major milestones" of section 60), and its scenarios must hit
  those milestones from a fresh save.
- Feeds ST-05: the final-zone approach content and the last foreshadow
  traces land in WI-04a/WI-04b, but the MacGuffin mechanics do not
  (ST-05 owns them). ST-06's section 26 map overlay consumes WI-04b's
  landmark ids.

## Constraints and non-goals

- The most important moments are authored, not randomly spawned (section
  67; section 61 randomization bans). Partial scripting is allowed per
  section 67; player control is preserved; no long cutscenes.
- Contradictions between official records and observed reality are allowed
  (section 22) without unreliable-narrator abuse.
- Reactions stay cheap: a few flags and spawn-table changes (section 60).
- No colored-symbol puzzle panels (section 66).
- Extend the trigger system, do not rebuild it (WI-07 baseline).
- No ending content, no MacGuffin, no balance tuning (ST-05/ST-07).

## Fresh-session handoff (for reviewers of the children)

Each child stands alone with its frontmatter plus this story. Read request
sections 3, 11.4, 22, 36, 38, 51, 53, 60, 66, 67 and ST-03. The private
reveal map from WI-01c is the source of truth for beat slots and foreshadow
placement; plan nodes reference it by id only, never quote it.
