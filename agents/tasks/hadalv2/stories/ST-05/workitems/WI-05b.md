---
id: WI-05b
kind: work_item
parent: ST-05
children: []
depends_on: ["WI-05a"]
criteria:
  AC-end-seq: "The final 5-10 minutes are mechanically different from the approach, the finale is not a conventional arena boss, and a headless scenario proves the ending trigger fires exactly once and the final sequence survives a save reload"
behavior: "Implement the non-arena final descent sequence: altered rules/context making the final 5-10 minutes mechanically different from the approach (section 39), the section-45 win condition as new simulation state, per-step save reload survival, and one-shot ending-trigger semantics"
subsystems: ["simulation rules", "world content data", "headless scenario tests"]
verification: "Headless scenario from fresh save (building on WI-05a's retrieval): enter the final sequence after MacGuffin retrieval, assert the mechanical difference from approach (altered rules active), assert the finale has no arena-boss structure, assert the ending trigger fires exactly once (re-attempt does not re-fire), save and reload at each step and continue correctly"
---

# WI-05b — Final descent sequence and win condition

## Goal

Deliver the final 5-10 minute sequence that is mechanically different from
the approach, ends the game (section 45 first criterion: new game to ending
playable without console commands), and is not a conventional arena boss
(sections 1.5, 24). The exact mechanism is secret and decided privately
(WI-01c, consistent with section 24's listed structures); plan nodes
reference it by id only.

The challenge comes from altered rules/context (section 39: "Do not simply
maximize numerical damage. Make the challenge come from altered rules /
context"). The win condition is a new simulation state: a boolean or
enum that the simulation sets when the final sequence completes, making
the game formally "won" without any console intervention.

## Deliverables (checkable)

- The final sequence's world layout in production world data: the altered
  rules (e.g. instruments unreliable, ecology shifted, structural
  constraints), the escape path, and the final decision point (where
  WI-05c's ending variants branch).
- Simulation rule(s) that activate the altered context: triggered by
  MacGuffin retrieval (WI-05a) and active for the final sequence's
  duration. The altered rules make the final 5-10 minutes mechanically
  different from the approach (section 23: "the final 5-10 minutes should
  feel mechanically different from the approach").
- Win condition state: a new field in the simulation state (e.g.
  `gameComplete`, `endingTriggered`, or equivalent) set exactly once when
  the final sequence's escape completes. This is the section 45 "new game
  to ending" criterion.
- One-shot semantics: the ending trigger fires exactly once; re-entering
  or re-attempting does not re-trigger it (section 70: duplicate-trigger
  prevention).
- Per-step save reload: the final sequence state survives a save/reload
  at any step; the player can continue from the reload point without
  losing sequence progress.

## Tests (node, real simulation, no mocks of the rules)

- Fresh-save scenario (building on WI-05a): retrieve the MacGuffin,
  enter the final sequence, assert:
  - The altered rules are active (mechanically different from approach:
    e.g. different navigation constraints, different creature behavior,
    different instrument state).
  - No arena-boss structure: no single HP pool to deplete, no enclosed
    arena with a single exit gate.
  - The escape path is traversable without noclip.
  - The ending trigger fires and sets the win-condition state.
- One-shot: after the trigger fires, a second attempt (if possible) does
  not re-fire it; the state remains "complete".
- Per-step save reload: at each major step of the final sequence,
  serialize the save, load into a fresh simulation, assert the sequence
  state is preserved and the sequence can continue to completion.
- Determinism: same seed, same sequence outcome.

## Constraints, assumptions, non-goals

- No HP-bar leviathan, no conventional boss arena (sections 1.5, 24).
- The final mechanism is private (WI-01c); the exact structure (extraction
  under altered ecology, stealth passage, unreliable instruments,
  structural collapse, help from a well-treated species, or another
  section-24 option) is chosen privately. Plan nodes reference it by id.
- No ending variants, no credits, no restart logic (WI-05c).
- No save-system schema changes (WI-05c owns the autosave extension);
  this item uses the existing save mechanism for per-step reload.
- No art/audio polish (ST-06). No balance tuning (ST-07).
- Spoiler rules (sections 0, 12, 68): commit style "implemented final
  descent sequence with altered rules" (no mechanism details).

## Fresh-session handoff

Read ST-05/plan.md, request sections 1.5, 23, 24, 39, 45, 70, WI-01c
(private endgame mechanism, by id only), WI-05a (the retrieval that gates
this sequence), and ST-03/ST-04 (final-zone context). The sequence's
world layout is in the same final zone where WI-05a places the MacGuffin;
the altered rules activate on retrieval.
