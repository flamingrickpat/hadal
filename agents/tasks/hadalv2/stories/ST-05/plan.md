---
id: ST-05
kind: story
parent: null
children: ["WI-05a", "WI-05b", "WI-05c"]
depends_on: ["ST-03", "ST-04"]
criteria:
  AC-end-mac: "The MacGuffin is visually memorable in simple rendering, tied to at least 2 earlier environmental traces, retrievable through gameplay from a fresh save, and its retrieval changes the environment, creature behavior, or return journey"
  AC-end-seq: "The final 5-10 minutes are mechanically different from the approach, the finale is not a conventional arena boss, and a headless scenario proves the ending trigger fires exactly once and the final sequence survives a save reload"
  AC-end-variants: "At least 2 ending variants are reachable from a single player decision, each producing a different final state, text, or shot, with credits and restart working"
behavior: "Implement the MacGuffin and the non-arena endgame (request sections 23, 24) with the win condition, ending variants, and headless ending verification"
subsystems: ["simulation rules", "world content data", "save system", "headless scenario tests"]
verification: "Headless scenario from fresh save: reach the final site, retrieve, observe the changed return journey, trigger each ending variant, reload at each milestone and continue; duplicate-trigger and restart checks per section 70"
---

# ST-05 — MacGuffin and endgame

## Goal

Deliver the MacGuffin, the non-arena endgame sequence, and the ending
variants: the game becomes completable (section 45 first criterion) without
console commands. The MacGuffin's true nature and the exact final mechanism
are private (sections 0, 12, 68); plan nodes and code reference them by id
only. The final 5-10 minutes are mechanically different from the approach
(section 23); the challenge comes from altered rules/context, not maxed
numerical damage (section 39).

## Why this shape (review split)

The review split this empty story (7 distinct deliverable behaviors). Each
child carries exactly one parent criterion and at most three named changed
responsibilities:

- WI-05a: MacGuffin content and retrieval mechanics in the simulation.
  Ties to at least 2 earlier environmental traces from WI-04b's delivered
  foreshadow work; retrieval changes environment/creature behavior/return
  journey.
- WI-05b: the final descent sequence (altered rules, instruments, escape)
  with the section-45 win condition. Not a conventional arena boss; the
  no-arena/no-HP-bar constraint is owned here.
- WI-05c: at least 2 ending variants from a single player decision, the
  section-25 save milestones (autosave schema extension, pre-descent and
  post-trigger points), and the one-shot trigger + restart verification.

## Criteria assignment and proof ownership

Children carry parent criteria verbatim; the union covers all three.

- AC-end-mac: WI-05a alone. Final proof owner: WI-05a — headless scenario
  from fresh save: reach the MacGuffin, retrieve it, assert the
  environmental/creature/return-journey change is present in sim state;
  assert at least 2 earlier traces (from WI-04b) reference the MacGuffin.
- AC-end-seq: WI-05b alone. Final proof owner: WI-05b — headless scenario
  enters the final sequence, proves mechanical difference from the approach,
  asserts the ending trigger fires exactly once, per-step save reload
  continues correctly.
- AC-end-variants: WI-05c alone. Final proof owner: WI-05c — full
  fresh-save scenario (reach, retrieve, changed return, both variants,
  reload at each milestone, restart); section 70 duplicate-trigger and
  restart checks.

## Dependency notes

- The story depends on ST-03 (final-zone fauna and the species that may help
  or hinder) and ST-04 (final-zone approach content, last foreshadow traces,
  trigger wiring).
- WI-05a is independent of the other ST-05 children; it needs only ST-03 and
  ST-04 delivered.
- WI-05b depends on WI-05a: the final sequence is gated on the MacGuffin
  having been retrieved (the retrieval triggers the altered context).
- WI-05c depends on WI-05b: the ending variants branch from a decision
  inside the final sequence; the save milestones bracket the sequence.
- ST-06 needs the endgame in place before the full art pass; ST-07 tunes
  the finale's difficulty (altered context, not maxed damage - section 39).
  Both depend on ST-05, which now means all three leaves.

## Constraints and non-goals

- No HP-bar leviathan, no conventional boss arena (sections 1.5, 24).
- The final challenge comes from altered rules/context (section 39).
- Ending logic stays in the simulation; the browser only presents the final
  state/shot/text.
- Plan nodes never describe the mechanism; the private files are the source
  of truth and stay out of these artifacts (sections 0, 12, 68).
- The MacGuffin's nature comes from the private creative pass (WI-01c);
  referenced by id only.
- One variant is the section 72 cut candidate; the other is retained.

## Fresh-session handoff (for reviewers of the children)

Each child stands alone with its frontmatter plus this story. Read request
sections 1.5, 22, 23, 24, 25, 39, 45, 70 (Ending checklist) and ST-03/ST-04
bodies. The private MacGuffin decision and endgame mechanism come from WI-01c
and are referenced by id only.
