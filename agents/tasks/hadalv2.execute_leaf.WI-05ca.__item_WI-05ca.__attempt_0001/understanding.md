# Understanding

This child implements one independently reviewed work item from C:\Temp\hadal-v2\agents\tasks\hadalv2.

---
id: WI-05ca
kind: work_item
parent: WI-05c
children: []
depends_on: ["WI-05b", "WI-05cb"]
criteria:
  AC-end-variants: "At least 2 ending variants are reachable from a single player decision, each producing a different final state, text, or shot, with credits and restart working"
behavior: "Implement at least 2 ending variants branched from a single player decision inside the final sequence, with one-shot trigger, credits flag, and restart; deliver the full headless ending verification as final proof owner"
subsystems: ["simulation rules", "headless scenario tests"]
verification: "Full fresh-save headless scenario: trigger each ending variant from the decision point, assert different final state/text/shot per variant, verify one-shot trigger, credits flag, restart to fresh state, save-reload at milestones (using WI-05cb's autosave points)"
---

# WI-05ca — Ending variants and full ending verification

## Goal

Deliver the ending-variant simulation rules and the comprehensive headless
verification that the ending works correctly from a fresh save. The player
faces a single decision point inside the final sequence (WI-05b); the
decision branches to at least 2 different endings (section 24: "a decision
plus different final state / text / shot is enough"). One variant is the
section 72 cut candidate.

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
     save and reload (using WI-05cb's autosave points); assert the
     state is preserved and the sequence can continue or the ending
     can be re-presented.
- Duplicate-trigger: after the ending fires, a second trigger attempt
  does not re-fire or change the variant.
- Restart: after either ending, restart produces a completely fresh
  simulation (no residual endgame state).
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
- One ending variant is the section 72 cut candidate; both must be
  implemented and tested, but one can be removed later without breaking
  the other.
- Spoiler rules (sections 0, 12, 68): commit style "implemented two
  ending variants" (no ending names, no mechanism details).
- The save schema extension (WI-05cb) provides the autosave points this
  scenario uses for milestone save-reload; this item does not modify the
  save schema itself.

## Fresh-session handoff

Read WI-05c/plan.md (this story), ST-05/plan.md, request sections 23, 24,
39, 45, 70, WI-01c (private ending content, by id only), WI-05a (retrieval
and post-retrieval state), WI-05b (the final sequence and win condition),
and WI-05cb (the save milestones this scenario consumes). The decision
point is inside WI-05b's final sequence; all branching logic lives in the
simulation.

