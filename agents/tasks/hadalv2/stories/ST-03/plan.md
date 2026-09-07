---
id: ST-03
kind: story
parent: null
children: ["WI-03a", "WI-03b", "WI-03c", "WI-03d"]
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

# ST-03 — Secret roster implementation (request sections 11, 47)

## Goal

Implement the private roster selected in WI-01b onto the ST-02 framework:
every selected organism becomes real `CreatureDef` data plus behavior in the
headless simulation, spawns in the production world data, a headless behavior
test for its signature rule, and a renderer that reads the sim state. Spoiler
content (names, lore, designs) stays in `design_private/` and
`src/content/secret/`; plan nodes, evidence and commit messages reference
organisms by internal id and size tier only (sections 0, 12, 68).

## Why this shape

The scope inventory said: split by size tier, each tier one behavior batch
with its own scenario tests; do not mix with a band-based split. That gives
four children, each strictly narrower than the parent in both criteria and
implementation responsibilities:

- WI-03a: tier 1 — ambient/schooling fauna (5-7 tiny organisms).
- WI-03b: tier 2 — small/medium useful/neutral fauna (4-6), including the
  at-least-2 friendly species (section 21).
- WI-03c: tier 3 — predator/territorial fauna (4-6), including the
  non-chase hunting strategy.
- WI-03d: tier 4 — huge ecological set pieces (2-4) plus colossal presences
  (2-3); final roster proof owner.

## Criteria assignment and proof ownership

Children carry parent criteria verbatim; the union covers all four.

- AC-roster-count: all four children (each lands its tier in production
  world data). Final proof owner: WI-03d — whole-roster world data check
  (15+ distinct active types, distribution matches the private roster, all
  creature ids resolve, every spawn sits in the band it was designed for).
- AC-roster-behavior: WI-03b and WI-03c (their tiers are where the
  non-pursuit behaviors and the friendly species live). Final proof owner:
  WI-03c — headless check that at least 4 implemented species have signature
  behaviors materially different from direct pursuit and at least 2 species
  are beneficial. WI-03b owns the 2+ friendly floor evidence for its own
  species.
- AC-roster-large: WI-03d alone.
- AC-roster-tests: all four children (per-species signature-rule tests for
  their own tier). Final proof owner: WI-03d — roster-wide test-existence
  check plus the spoiler audit of every ST-03 commit.

## Dependency notes

- The story depends on ST-01 (roster content, WI-01b answers) and ST-02
  (framework, WI-02a/b/c). No child starts before the framework's three
  work items are accepted.
- WI-03b depends on nothing in-tier; WI-03a is independent of it. WI-03c
  depends on WI-03b (its final AC-roster-behavior proof counts the friendly
  species). WI-03d depends on all three previous tiers (whole-roster count
  proof; its colossal "announced through other fauna" behavior needs other
  species present in the world data).
- ST-04's authored beats reference roster organisms: the ids and states each
  child introduces must be stable before ST-04 splits. ST-04 owns the
  authored spectacle beats (triggers, timing, camera staging); ST-03 owns
  the creatures and their base behavior only.

## Constraints and non-goals

- Section 46 quality bar applies per species; section 11.2 anti-cliche list
  is a hard gate. If a private rubric answer proves weak in code, redesign
  privately - do not ship a generic shark.
- No browser automation proof of reachability: headless scenarios for
  behavior, browser spot-checks for presentation (one organism per tier).
- No ending content, no MacGuffin interaction (ST-05); no authored beat
  staging (ST-04).
- Commit messages stay spoiler-safe ("implemented two mid-depth predator
  archetypes" style, section 68).
- Organisms are named by internal id in every planning and evidence
  artifact; normal UI shows no creature names (section 33: ids in debug
  only).

## Fresh-session handoff (for reviewers of the children)

Each child stands alone with its frontmatter plus this story. Read request
sections 10, 11, 13, 20, 21, 33, 34, 39, 45, 46, 47, 49, 52, 68, 70, 74;
ST-01/WI-01b (the rubric answers) and ST-02 (framework seams). The private
files under `design_private/` are the source of truth for which organisms
exist and what they do - reviewers may read them, but plan and evidence
artifacts never quote them.
