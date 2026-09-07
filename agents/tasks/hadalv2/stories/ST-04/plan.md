---
id: ST-04
kind: story
parent: null
children: []
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

# ST-04 — Authored encounters, story sequence, world reactions (UNEXPANDED)

## Status

Explicit expansion task. Too broad for one work item; split in a future
planning session. Natural split: (1) the five spectacle beats as one or two
items with authored triggers; (2) the story channel content (radio,
fragments, props, landmarks, contradictions); (3) world-state reactions and
puzzles. Each child must own the cross-child proof explicitly (for example,
the beat item owns the browser check that its beats fire in sequence).

## Scope inventory (honest)

- Five+ spectacle beats (section 11.4 staging grammar; section 67: scripted
  for timing/entrance/camera but preserving player control; no long
  cutscenes). Each beat needs a trigger entry in
  `src/world/triggers.ts` plus creature/event coordination from ST-03.
- Story delivery on the four channels (section 22) within the section 38
  budget; every written fragment must foreshadow gameplay, explain a human
  decision, recontextualize a place, hint at hidden lore, or add emotional
  texture - delete the rest.
- Foreshadowing per section 51: 2-4 earlier traces per major late reveal,
  none naming the reveal.
- World-state reactions per section 60: cheap flag-driven changes so return
  trips differ.
- 3-5 environmental puzzles per section 66, no colored-symbol panels.

## Dependencies and boundaries

- Depends on ST-03: beats are staged around real roster organisms and their
  stable ids/states.
- Feeds ST-05: the final-zone approach content and the last foreshadow
  traces land here, but the MacGuffin mechanics do not (ST-05 owns them).
- The trigger system already exists (WI-07); extend it, do not rebuild it.

## Constraints and non-goals

- The most important moments are authored, not randomly spawned
  (section 67 first paragraph; section 61 randomization bans).
- Contradictions between official records and observed reality are allowed
  (section 22) without unreliable-narrator abuse.
- No ending content, no MacGuffin, no balance tuning (ST-05/ST-07).

## Fresh-session handoff for the expander

Read request sections 3, 11.4, 22, 36, 38, 51, 53, 60, 66, 67 and ST-03. The
private reveal map from WI-01c is the source of truth for beat slots and
foreshadow placement; plan nodes reference it by id only, never quote it.
