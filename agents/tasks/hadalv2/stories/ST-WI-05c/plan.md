---
id: WI-05c
kind: story
parent: ST-05
children: ["WI-05ca", "WI-05cb"]
depends_on: ["WI-05b"]
criteria:
  AC-end-variants: "At least 2 ending variants are reachable from a single player decision, each producing a different final state, text, or shot, with credits and restart working"
behavior: "Implement at least 2 ending variants branched from a single player decision inside the final sequence, the section-25 autosave schema extension (versioned migration, pre-descent and post-trigger points), and the full headless ending verification (one-shot trigger, save-reload at each milestone, restart, credits)"
subsystems: ["save system", "simulation rules", "headless scenario tests"]
verification: "Full fresh-save headless scenario: reach the final site, retrieve the MacGuffin, observe the changed return journey, enter the final sequence, make the player decision, trigger each of the 2+ ending variants, assert each produces a different final state/text/shot, reload at each milestone and continue, verify duplicate-trigger prevention, verify credits and restart work"
---

# WI-05c — Ending variants, save milestones, and ending verification

## Why this shape (review split)

The review split this work item (two independently testable behaviors):
(1) ending-variant simulation rules and (2) the save-schema extension.
The save migration is testable in isolation without any ending logic; the
ending branching is testable with in-memory state without the save system.
This story preserves the original scope and now decomposes it:

- WI-05ca: ending-variant simulation rules (decision branches to 2+ endings,
  one-shot trigger, credits flag, restart) and the full headless ending
  verification as final proof owner. Subsystems: simulation rules, headless
  scenario tests.
- WI-05cb: save-schema extension (version bump, trivial migration,
  pre-descent and post-trigger autosave points per section 25). Subsystems:
  save system, headless scenario tests.

## Criteria assignment and proof ownership

AC-end-variants is the sole parent criterion. Both children carry it
verbatim; WI-05ca is the named final proof owner (the full fresh-save
ending scenario with save-reload at each milestone).

- WI-05ca: proves the decision branches to different final states, the
  one-shot trigger, credits, and restart; consumes WI-05cb's autosave
  points for the save-reload integration proof.
- WI-05cb: proves the schema migration loads pre-extension saves correctly,
  and that pre-descent/post-trigger autosave points persist and restore
  endgame state.

## Dependency notes

- The story depends on WI-05b (the final sequence and win condition).
- WI-05cb depends on WI-05b (the milestones bracket the final sequence).
- WI-05ca depends on WI-05b (the decision point is inside the final
  sequence) and on WI-05cb (the integration scenario uses the autosave
  points for save-reload at each milestone).

## Constraints and non-goals

- No art/audio polish (ST-06). No balance tuning (ST-07).
- The ending text content and shot specifics are private (WI-01c); the sim
  stores text ids and shot ids, the browser renders them. Plan nodes and
  commit messages never quote the ending content.
- One ending variant is the section 72 cut candidate; both must be
  implemented and tested, but one can be removed later without breaking
  the other.
- Spoiler rules (sections 0, 12, 68): commit style "implemented two
  ending variants and save milestones" (no ending names, no mechanism
  details).

## Fresh-session handoff

Read ST-05/plan.md, request sections 23, 24, 25, 39, 45, 70, WI-01c
(private ending content, by id only), WI-05a (retrieval and post-retrieval
state), WI-05b (the final sequence and win condition), and `src/game/save.ts`
(existing versioned save structure). The decision point is inside WI-05b's
final sequence; the save extension wraps the sequence's milestones.
