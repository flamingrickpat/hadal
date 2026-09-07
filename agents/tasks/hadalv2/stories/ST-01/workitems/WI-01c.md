---
id: WI-01c
kind: work_item
parent: ST-01
children: []
depends_on: ["WI-01a", "WI-01b"]
criteria:
  AC-cp-mapping: "design_private/ assigns creature reveals and lore clues to the 90-120 minute pacing timeline, defines 3-5 recurring motifs, and fixes the MacGuffin truth and at least two ending variants"
  AC-cp-spoiler: "design_private/ stays out of the public surface, and no plan artifact, commit message, screenshot, or progress report names deep creatures, the lore truth, the MacGuffin, or the endings"
behavior: "Map creature reveals, lore clues, motifs, the MacGuffin truth, and the ending variants onto the pacing timeline, then run the final spoiler audit over the whole creative pass"
subsystems: ["private design documentation"]
verification: "Read design_private/encounter_beats.md and design_private/spoiler_map.md; confirm reveal assignment on the 3-6 minute pacing grid, 3-5 motifs with at least two connected by the final reveal, MacGuffin design meeting section 23, at least two ending variants meeting section 24, and a passed final spoiler audit"
---

# WI-01c — Reveal mapping, MacGuffin, endings, final spoiler audit

## Goal

Close the creative pass. Files: `design_private/encounter_beats.md`,
`design_private/spoiler_map.md`.

## Deliverables (checkable)

- Every roster reveal and lore clue assigned to the 90-120 minute timeline
  with a 3-6 minute pacing beat (section 3); the best ideas are not all in
  the first half; the five spectacle beats get their slots with staging
  intent (section 11.4 grammar, not a literal checklist).
- 3-5 recurring motifs (section 37) each listed with the contexts they appear
  in; at least two motifs are connected by the final reveal without all of
  them being explained.
- The MacGuffin decision meeting section 23: visually memorable in simple
  rendering, tied to at least two earlier environmental traces, retrieval
  changes the environment or the return journey, forces one final decision,
  and makes the final 5-10 minutes mechanically different.
- At least two ending variants meeting section 24 (a decision plus different
  final state, text, or shot is enough), each tagged as modest-scope.
- `spoiler_map.md`: the list of every secret fact, the artifacts containing
  it, and the public-surface ban list.

## Final proof owner

WI-01c is the final proof owner for AC-cp-spoiler: it audits every file in
`design_private/`, the gitignore state, and the commit messages of this story
for leaks before the pass is declared done.

## Constraints, assumptions, non-goals

- Depends on WI-01a and WI-01b; do not change the selected world or roster
  here - if something in the roster does not map, record it as a defect for
  the reviewer instead of silently rewriting WI-01b's output.
- Assumption: one ending variant may be the section 72 cut candidate if scope
  balloons; both remain planned.
- No code. Commit as "creative pass: reveal map and spoiler audit (private)".

## Fresh-session handoff

Read request sections 3, 11.4, 23, 24, 37, 51, 66, 67, 74 and the outputs of
WI-01a/WI-01b. The ending must not be a glowing-orb fade to credits
(section 23). Reviewer checks mapping completeness and spoiler safety.
