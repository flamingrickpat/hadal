---
id: WI-05cb
kind: work_item
parent: WI-05c
children: []
depends_on: ["WI-05b"]
criteria:
  AC-end-variants: "At least 2 ending variants are reachable from a single player decision, each producing a different final state, text, or shot, with credits and restart working"
behavior: "Extend the versioned save schema with endgame milestone fields (trivial migration) and implement pre-descent and post-trigger autosave points per section 25"
subsystems: ["save system", "headless scenario tests"]
verification: "Load a pre-extension save and verify defaults are added; save and reload at pre-descent and post-trigger milestones; assert endgame state is preserved and the sequence can continue or the ending can be re-presented"
---

# WI-05cb — Save-schema extension and endgame autosave milestones

## Goal

Extend the existing versioned save (`src/game/save.ts`) with endgame
milestone fields and implement the section 25 autosave points. The save
schema bumps its version with a trivial migration that adds optional
endgame-specific fields (ending variant chosen, final sequence step,
autosave milestone flags). Pre-descent and post-trigger autosave points
are implemented so that WI-05ca's integration scenario can save and
reload at each milestone.

This item is independently testable: the migration loads a pre-extension
save and verifies defaults; the autosave points persist and restore
endgame state — no ending-variant logic is required.

## Deliverables (checkable)

- Save schema version bump: `src/game/save.ts` version increments with a
  trivial migration that adds endgame-specific fields (ending variant
  chosen, final sequence step, autosave milestone flags). All new fields
  are optional with defaults; no data transformation of existing fields.
- Pre-descent autosave point: the simulation writes a save snapshot at
  the moment the player begins the final descent sequence (gated by
  WI-05b's final-sequence entry).
- Post-trigger autosave point: the simulation writes a save snapshot
  after the ending trigger fires but before the credits sequence.
- Reload continuation: loading a save from either milestone restores the
  simulation to a state where the sequence can continue (pre-descent) or
  the ending can be re-presented (post-trigger) without re-firing the
  trigger.

## Tests (node, real simulation, no mocks of the rules)

- Save migration: a pre-extension save (version N) loads correctly into
  the extended schema (version N+1); trivial migration adds defaults to
  the new endgame fields; no existing fields are altered.
- Pre-descent autosave: fresh save, reach the final zone, retrieve the
  MacGuffin (WI-05a), enter the final sequence (WI-05b); assert the
  pre-descent autosave point is written. Reload from that point; assert
  the final sequence is in progress and the decision point is reachable.
- Post-trigger autosave: from the pre-descent reload, make the decision,
  trigger the ending; assert the post-trigger autosave point is written.
  Reload from that point; assert the ending is re-presented (final state,
  text id, shot id preserved) without re-firing the trigger.
- Restart clears endgame fields: after restart, the fresh save has
  default (empty) values for all endgame fields.
- Determinism: same seed, same route, same autosave-point contents.

## Browser check (presentation)

- After the ending triggers, loading the post-trigger save from browser
  storage shows the correct final state/shot/text for the triggered
  variant.
- No console errors during save or load.
- Restart produces a fresh game state with no endgame fields.

## Constraints, assumptions, non-goals

- The save migration is trivial: the extension adds optional fields with
  defaults; no data transformation of existing fields.
- No ending-variant branching logic here (WI-05ca owns that); this item
  only stores the chosen variant id as part of the milestone state.
- No art/audio polish (ST-06). No balance tuning (ST-07).
- The ending text content and shot specifics are private (WI-01c); the
  save stores text ids and shot ids only.
- Spoiler rules (sections 0, 12, 68): commit style "implemented save
  milestones" (no ending names, no mechanism details).

## Fresh-session handoff

Read WI-05c/plan.md (this story), ST-05/plan.md, request sections 24, 25,
70, WI-05b (the final sequence entry/exit points that gate the autosave
milestones), and `src/game/save.ts` (existing versioned save structure and
migration pattern). The autosave points are gated by WI-05b's final
sequence entry (pre-descent) and the ending trigger (post-trigger).

## Result

Implemented save schema extension (v1→v2) with endgame milestone fields and pre-descent/post-trigger autosave points. All 8 WI-05cb tests pass. Save tests updated to expect version 2. Commit message follows the WI-05cb spoiler rules: "implemented save milestones".
