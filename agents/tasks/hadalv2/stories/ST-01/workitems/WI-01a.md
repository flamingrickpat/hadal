---
id: WI-01a
kind: work_item
parent: ST-01
children: []
depends_on: []
criteria:
  AC-cp-world: "design_private/ holds three substantially different hidden-world interpretations, a written critique of each against the section 12 step B axes, and one selected world that hybridizes a single mechanism from a rejected candidate"
  AC-cp-spoiler: "design_private/ stays out of the public surface, and no plan artifact, commit message, screenshot, or progress report names deep creatures, the lore truth, the MacGuffin, or the endings"
behavior: "Generate three competing hidden-world interpretations, critique each against the section 12 step B axes, and write the hybridized final selection with the private lore truth"
subsystems: ["private design documentation"]
verification: "Read design_private/world_candidates.md and design_private/final_selected_world.md; confirm three distinct interpretations, a written critique per candidate, a rejected weakest candidate, and a single stolen mechanism from a rejected one"
---

# WI-01a — Hidden world candidates, critique, hybrid selection

## Goal

Write the three competing interpretations and the selection, privately.
Files: `design_private/world_candidates.md`, `design_private/final_selected_world.md`,
`design_private/lore_truth.md`. Add `design_private/` to `.gitignore` if the
environment exposes commits or diffs to the player; otherwise keep the
equivalent data in `src/content/secret/` and never quote it in chat.

## Deliverables (checkable)

- Three interpretations that differ in what the deep ocean actually is, why
  the installation failed, what the MacGuffin really is, how ecology connects
  to the old infrastructure, and the ending's emotional tone.
- A written critique per candidate on the step B axes: genre cliches,
  exposition burden, whether the explanation erodes mystery, support for
  visually weird creatures, deliverability in two hours, and whether the
  final reveal reinterprets earlier content.
- The rejected weakest candidate, explicitly named as rejected.
- The selected candidate plus exactly one excellent mechanism stolen from a
  rejected candidate (hybridize, do not average).
- The private lore truth: the central event, the contradictions between
  official records and observed reality (request section 22), and the 2-4
  earlier traces each major late reveal must plant (section 51).

## Constraints, assumptions, non-goals

- Tone per section 57: restrained, bureaucratic, increasingly uneasy.
- Assumption: the selected world must keep at least one largest-scale
  implication unanswered at the end (section 22 lore rule); falsified if the
  chosen truth requires a final exposition dump.
- No code changes. Do not draft creatures here (WI-01b). Do not name any of
  this content in the commit message; commit as "creative pass: world
  selection (private)".

## Fresh-session handoff

Read request sections 2, 12 (steps A-C), 22, 37, 51, 57, 74. The coast band
and the salvage premise are fixed (sections 2, 4.1); everything below the
shelf is yours to invent. Reviewer checks structure and spoiler safety only.
