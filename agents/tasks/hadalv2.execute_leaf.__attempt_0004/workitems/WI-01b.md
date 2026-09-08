---
id: WI-01b
kind: work_item
parent: ST-01
children: []
depends_on: ["WI-01a"]
criteria:
  AC-cp-roster: "design_private/ holds at least 30 scored rough creature concepts and a selected roster of 18-24 organisms, each major organism carrying private written answers to the 10-question section 11.3 rubric"
  AC-cp-spoiler: "design_private/ stays out of the public surface, and no plan artifact, commit message, screenshot, or progress report names deep creatures, the lore truth, the MacGuffin, or the endings"
behavior: "Generate and score at least 30 rough creature concepts, select the 18-24 that form the secret roster, and enforce the distribution, anti-cliche, and diversity constraints"
subsystems: ["private design documentation"]
verification: "Read design_private/creature_candidates.md; confirm 30+ scored concepts, a selected roster within 18-24, the section 11.1 minimums and distribution, per-organism rubric answers, and the section 47 principle coverage of at least eight"
---

# WI-01b — Creature roster generation and selection

## Goal

Write the roster privately. File: `design_private/creature_candidates.md`.

## Deliverables (checkable)

- At least 30 rough concepts, each scored 1-5 on: silhouette novelty,
  ecological plausibility inside the selected world, gameplay distinction,
  ease of procedural animation, surprise potential, cliché penalty.
- The selected 18-24 with the section 11.1 distribution (ambient/schools,
  useful/neutral, predators/territorial, huge set pieces, colossal
  presences) and every listed minimum: two genuinely helpful species, one
  dangerous-looking-but-safe, one harmless-with-a-second-behavior, one
  non-chase predator, one wreck-repurposer, one living-landmark, one
  never-fully-seen encounter, one presence felt through other fauna, one
  exploitable ecosystem relationship, one scale-misread, one beautiful-not-
  threatening, one architecture-bound lifecycle, at least one uncategorizable.
- Written answers to the 10-question section 11.3 rubric for every major
  organism (the implementer of ST-03 codes from these answers; weak answers
  mean redesign, not patch).
- Diversity gate: fewer than 25% of selected creatures may be summarized as a
  swimming mouth that attacks the player; record the count.
- Anti-cliche gate per section 11.2, including the ban on neon-blue
  bioluminescence everywhere and on size-scaled normal fish.
- Coverage record of at least eight section 47 principles.

## Constraints, assumptions, non-goals

- Depends on WI-01a: the roster must be ecologically plausible inside the
  selected world; do not invent a second world to fit creatures.
- Rendering feasibility: every selected organism must be drawable with the
  section 13 toolbox (ShapeGeometry, spine renderer, rigid mesh hierarchies,
  found-object attachment). Mark the intended renderer per organism.
- No code. No names of selected organisms in the commit message; commit as
  "creative pass: roster (private)".

## Fresh-session handoff

Read request sections 11, 13, 21, 46, 47, 52 and the selected world from
WI-01a. The section 46 questions (shark-replacement test, "just big" test,
friendly-species test, evidence-before-explanation test) are the quality bar.
Reviewer checks counts, structure, and spoiler safety only.
