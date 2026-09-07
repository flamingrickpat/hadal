---
id: WI-05c
kind: work_item
parent: ST-05
children: []
depends_on: ["WI-05b"]
criteria:
  AC-end-variants: "At least 2 ending variants are reachable from a single player decision, each producing a different final state, text, or shot, with credits and restart working"
behavior: "Implement at least 2 ending variants branched from a single player decision inside the final sequence, the section-25 autosave schema extension (versioned migration, pre-descent and post-trigger points), and the full headless ending verification (one-shot trigger, save-reload at each milestone, restart, credits)"
subsystems: ["save system", "simulation rules", "headless scenario tests"]
verification: "Full fresh-save headless scenario: reach the final site, retrieve the MacGuffin, observe the changed return journey, enter the final sequence, make the player decision, trigger each of the 2+ ending variants, assert each produces a different final state/text/shot, reload at each milestone and continue, verify duplicate-trigger prevention, verify credits and restart work"
---

# WI-05c — Ending variants, save milestones, and ending verification

## Goal

Deliver the ending variants, the save-system extension for endgame
milestones, and the comprehensive headless verification that the ending
works correctly from a fresh save. The player faces a single decision
point inside the final sequence (WI-05b); the decision branches to at
least 2 different endings (section 24: "a decision plus different final
state / text / shot is enough"). One variant is the section 72 cut
candidate.

The section 25 autosave requirements are implemented here: the save
schema extends the existing versioned save (`src/game/save.ts`) with
trivial migration to support pre-descent and post-trigger autosave points.

This item is the final proof owner of the complete fresh-save ending
scenario (the full section 70 ending verification).

## Deliverables (checkable)

- At least 2 ending variants: a simulation rule where a single player
  decision (made inside the final sequence, after WI-05b's altered
  context is active) branches to at least 2 different outcomes. Each
  outcome produces a different final state (sim enum or text id),
  different text (shown by the browser), and/or different shot (camera
  state or scene id). The browser only presents; all logic is in the
  simulation.
- Credits and restart: after the ending triggers, the simulation state
  supports a credits sequence (a state flag the browser reads to show
  credits) and a restart (resetting to a fresh save, clearing all
  progression). Both are verifiable headlessly.
- Save schema extension: `src/game/save.ts` version bumps with a trivial
  migration that adds the endgame-specific fields (ending variant chosen,
  final sequence step, autosave milestone flags). Pre-descent and
  post-trigger autosave points are implemented per section 25.
- One-shot trigger: the ending trigger (set by WI-05b's win condition)
  fires exactly once; the section 70 duplicate-trigger check applies here.

## Tests (node, real simulation, no mocks of the rules)

- Full fresh-save scenario (this item is the final proof owner):
  1. Fresh save, physical route to the final zone.
  2. Retrieve the MacGuffin (WI-05a).
  3. Observe the changed return journey / altered context (WI-05a).
  4. Enter the final sequence (WI-05b).
  5. At the decision point, choose variant A: assert the ending
     triggers, the final state/text/shot is variant A's, credits flag
     is set, restart produces a fresh state.
  6. Repeat from step 5 with variant B: assert different final
     state/text/shot.
  7. At each milestone (pre-descent, post-trigger, post-ending),
     save and reload; assert the state is preserved and the sequence
     can continue or the ending can be re-presented.
- Duplicate-trigger: after the ending fires, a second trigger attempt
  does not re-fire or change the variant.
- Restart: after either ending, restart produces a completely fresh
  simulation (no residual endgame state).
- Save migration: a pre-extension save loads correctly into the
  extended schema (trivial migration adds defaults).
- Determinism: same seed, same decision, same ending.

## Browser check (presentation)

- After the ending triggers, the browser shows the correct text/shot
  for the chosen variant.
- Credits sequence displays and completes.
- Restart button/action produces a fresh game state.
- No console errors.

## Constraints, assumptions, non-goals

- The ending text content and shot specifics are private (WI-01c);
  the sim stores text ids and shot ids, the browser renders them.
  Plan nodes and commit messages never quote the ending content.
- No art/audio polish (ST-06). No balance tuning (ST-07).
- The save migration is trivial: the extension adds optional fields with
  defaults; no data transformation of existing fields.
- One ending variant is the section 72 cut candidate; both must be
  implemented and tested, but one can be removed later without breaking
  the other.
- Spoiler rules (sections 0, 12, 68): commit style "implemented two
  ending variants and save milestones" (no ending names, no
  mechanism details).

## Fresh-session handoff

Read ST-05/plan.md, request sections 23, 24, 25, 39, 45, 70, WI-01c
(private ending content, by id only), WI-05a (retrieval and post-retrieval
state), WI-05b (the final sequence and win condition), and `src/game/save.ts`
(existing versioned save structure). The decision point is inside WI-05b's
final sequence; the save extension wraps the sequence's milestones.
