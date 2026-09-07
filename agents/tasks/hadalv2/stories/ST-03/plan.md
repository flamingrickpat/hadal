---
id: ST-03
kind: story
parent: null
children: []
depends_on: ["ST-01", "ST-02"]
criteria:
  AC-roster-count: "At least 15 distinct implemented creature types are active in the production world data with their spawns, meeting the private roster's distribution"
  AC-roster-behavior: "At least 4 creature behaviors are materially different from direct pursuit and at least 2 creatures are beneficial or mutually useful, matching the private roster's anti-cliche and section 47 principle coverage"
  AC-roster-large: "At least 3 large-scale creatures or creature events exist, including at least one colossal presence communicated first through changes to other fauna and one encounter where the player never gets a clean full-body view"
  AC-roster-tests: "Every implemented major species has a headless behavior test for its signature rule, and no creature name or secret description appears outside debug internals and the private content files"
behavior: "Implement the selected secret roster (request sections 11, 47) on the ST-02 framework, authored into the production world data, spoiler-contained"
subsystems: ["creature simulation", "procedural creature rendering", "world content data", "headless scenario tests"]
verification: "Node scenarios per major species behavior plus a world data check that all creature ids resolve and spawns sit in the band they were designed for; browser spot-checks on one organism per size tier; spoiler audit of commits"
---

# ST-03 — Secret roster implementation (UNEXPANDED)

## Status

Explicit expansion task. This node is deliberately too broad to implement as
one work item; a future planning session must split it before implementation.
The criteria above are the acceptance floor from section 45 plus the roster
quality bar; they are written so any split can partition them cleanly.

## Scope inventory (honest)

Implementing 15-24 organisms across four size tiers changes more than three
responsibilities' worth of behavior. A useful first split is by size tier
(ambient/schools, small/medium, predators/territorial, huge/colossal set
pieces), each tier one behavior batch with its own scenario tests; the
colossal tier may need a second split because its staging overlaps ST-04.
Alternative split: by band of the macro world. Choose one; do not mix.

## What the children must carry

- Creature data in `src/content/secret/hiddenCreatures.ts` with ids that
  never appear in normal UI (section 33: internal ids in debug only).
- Behavior per the private rubric answers from WI-01b; if an answer proves
  weak in code, redesign privately - do not ship a generic shark.
- Every predator has at least one readable rule the player can learn by
  observation (section 10); fairness per section 39.
- Spawns in `src/world/worldData.ts` at the density the band needs
  (section 49: dense traversal, capped ambient counts per section 34).
- Friendly species per section 21: practical advantage, no questification.

## Dependencies and boundaries

- Depends on ST-01 (roster content) and ST-02 (framework). Do not start a
  tier before the framework's three work items are accepted.
- ST-04's authored beats reference roster organisms; the ids and states they
  need must be stable before ST-04 splits.
- No ending content, no MacGuffin interaction in this story (ST-05).

## Constraints and non-goals

- Section 46 quality bar applies per species; section 11.2 anti-cliche
  constraints are hard gates.
- No browser automation proof of reachability; headless scenarios only for
  behavior, browser spot-checks for presentation.
- Commit messages stay spoiler-safe ("implemented two mid-depth predator
  archetypes" style, section 68).

## Fresh-session handoff for the expander

Read request sections 10, 11, 20, 21, 39, 46, 47, 52, 68, 74; ST-01/ST-02
bodies; `understanding.md`. The private files under `design_private/` are
the source of truth for what gets built - the expander reads them and keeps
their content out of the plan nodes (name organisms by internal id only).
