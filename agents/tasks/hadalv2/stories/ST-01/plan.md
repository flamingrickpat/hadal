---
id: ST-01
kind: story
parent: null
children: ["WI-01a", "WI-01b", "WI-01c"]
depends_on: []
criteria:
  AC-cp-world: "design_private/ holds three substantially different hidden-world interpretations, a written critique of each against the section 12 step B axes, and one selected world that hybridizes a single mechanism from a rejected candidate"
  AC-cp-roster: "design_private/ holds at least 30 scored rough creature concepts and a selected roster of 18-24 organisms, each major organism carrying private written answers to the 10-question section 11.3 rubric"
  AC-cp-mapping: "design_private/ assigns creature reveals and lore clues to the 90-120 minute pacing timeline, defines 3-5 recurring motifs, and fixes the MacGuffin truth and at least two ending variants"
  AC-cp-spoiler: "design_private/ stays out of the public surface, and no plan artifact, commit message, screenshot, or progress report names deep creatures, the lore truth, the MacGuffin, or the endings"
behavior: "Private section 12 creative pass: invent the hidden world, the creature roster, the reveal mapping, the motifs, the MacGuffin, and the endings inside the repository without exposing them in any public surface"
subsystems: ["private design documentation"]
verification: "A review session reads the design_private/ files against the section 12 steps A through G and confirms the spoiler boundary holds across commits and artifacts"
---

# ST-01 — Private creative pass (request section 12)

## Goal

Produce the hidden design payload every later story consumes: the selected
world, the scored roster, the reveal/encounter map, the motifs, and the
MacGuffin plus ending decisions. Output lives in `design_private/`
(`world_candidates.md`, `creature_candidates.md`, `final_selected_world.md`,
`encounter_beats.md`, `lore_truth.md`, `spoiler_map.md`) or, if gitignored
files are inconvenient, in `src/content/secret/` under the same rules.

## Why this shape

Section 12 prescribes three sequential steps (worlds -> roster -> mapping),
so the story is already split. Each child is a documentation behavior,
independently checkable, with no code. Spoiler containment is a shared
criterion across all three children; WI-01c is the named final proof owner for
AC-cp-spoiler (it audits the whole folder at the end of the pass).

## Decomposition (already applied)

- WI-01a: three competing worlds, critique, hybridized selection (steps A-C).
- WI-01b: 30+ rough creature concepts, scored, 18-24 selected, diversity
  enforced (steps D-E).
- WI-01c: reveal mapping on the pacing timeline, motifs, MacGuffin truth,
  endings, final spoiler audit (steps F-G).

## Constraints and non-goals

- No product code, no rendering, no simulation changes in this story.
- Nothing in these files, their commits, or reports may expose hidden content
  (request sections 0, 12, 68). Keep this story's artifacts generic by design.
- Do not write creatures into `worldData.ts`; that is ST-03's job.

## Fresh-session handoff

Read request sections 1, 2, 12, 37, 47, 51, 57, 74 for tone and rules. Read
`understanding.md` for the baseline state. Work only inside
`design_private/` (plus the `.gitignore` entry). Deliver the files named in
the children's bodies; reviewers will check structure and spoiler safety, not
taste.
