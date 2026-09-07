---
id: WI-03d
kind: work_item
parent: ST-03
children: []
depends_on: ["WI-03a", "WI-03b", "WI-03c"]
criteria:
  AC-roster-count: "At least 15 distinct implemented creature types are active in the production world data with their spawns, meeting the private roster's distribution"
  AC-roster-large: "At least 3 large-scale creatures or creature events exist, including at least one colossal presence communicated first through changes to other fauna and one encounter where the player never gets a clean full-body view"
  AC-roster-tests: "Every implemented major species has a headless behavior test for its signature rule, and no creature name or secret description appears outside debug internals and the private content files"
behavior: "Implement the huge set-piece and colossal presence tier (2-4 plus 2-3 organisms) with section 52 scale techniques, production placement, headless per-species tests, and the final roster-wide count and test/spoiler proof"
subsystems: ["creature simulation", "procedural creature rendering", "world content data", "headless scenario tests"]
verification: "Node scenarios for each large/colossal signature behavior (fauna-announcement, no-clean-view window, sonar scale); final world data check that 15+ distinct creature types are active with all ids resolving and spawns in the designed bands; roster-wide per-species test-existence check and spoiler audit of all ST-03 commits; browser spot-checks of one large and one colossal organism"
---

# WI-03d — Tier 4: huge set pieces and colossal presences

## Goal

Land the final roster tier: the 2-4 huge ecological set pieces and the 2-3
truly colossal presences the private roster selects (section 11.1), at least
one colossal presence not simply hostile. These close the roster and own
the final roster-wide proof for ST-03.

## Deliverables (checkable)

- One `CreatureDef` per selected tier-4 organism in
  `src/content/secret/hiddenCreatures.ts`, with the section 52 scale
  techniques its private design needs: partial anatomy (A), parallax
  crossing (B), foreground pass (C), environment reaction (D), sonar scale
  (E), speed mismatch (F), no center framing (G). Simulation side: body
  moves slowly in body-space but covers large world distance (F); the
  creature is not a combat target - no HP bar, no kill path (section 10).
- AC-roster-large floors, per the private designs:
  - at least one colossal presence communicated FIRST through changes to
    other fauna (schools flee, zones go quiet before events, section 20) -
    the environment reaction must precede any direct sight or sound
    evidence in the headless trace;
  - at least one encounter where the player never receives a clean
    full-body view (techniques A/C/G);
  - at least 3 large-scale creatures or events in total across this tier.
- Placement in `src/world/worldData.ts` (spawns and/or fixed encounter
  positions) in the bands the private roster assigns; ids debug-only
  (section 33). Section 34: moderate spine segment counts, pooled
  particles, no per-frame allocation in the large-creature hot paths.
- Rendering: spine renderer extension for very long bodies plus the
  foreground occluder and parallax passes the techniques require, all
  reading simulation state only (section 13; renderer never changes rules).

## Tests (node, real simulation, no mocks of the rules)

- One headless scenario per tier-4 organism for its signature rule
  (e.g. fauna-announcement window, sonar echo at impossible scale, crossing
  event, no-full-view window asserted from the sim's visibility state).
- The fauna-announcement species: a scenario asserts other species' state
  changes (flee/quiet) before the player's senses report the colossal
  presence.
- FINAL PROOF for AC-roster-count (owned here): whole-roster world data
  check over the production world data that at least 15 distinct creature
  types are active, the tier distribution matches the private roster's
  (18-24 selected, section 11.1 bands), every creature id resolves to a
  def, and every spawn sits in the band it was designed for.
- FINAL PROOF for AC-roster-tests (owned here): roster-wide check that
  every implemented major species has its headless signature-rule test,
  plus a spoiler audit of every ST-03 commit and artifact: no creature
  name or secret description outside debug internals and the private
  content files (sections 0, 12, 68).
- Performance guard: the largest tier-4 scene stays smooth in a focused
  browser inspection (section 34); the definitive 60 FPS check in the
  largest encounter remains ST-07's job.

## Browser spot-checks (presentation only)

One large and one colossal organism: render, animate, and read as
large without console errors; the colossal reads through its techniques,
not through a centered boss intro. No browser reachability proof
(section 70 layers).

## Constraints, assumptions, non-goals

- Authored spectacle BEATS around these creatures (triggers, timing,
  camera staging, escape paths) are ST-04's; this item delivers the
  creatures and their base behavior with stable ids and states for ST-04
  to reference. No ending content, no MacGuffin interaction (ST-05).
- Assumption: the section 52 techniques fit the existing renderer
  pipeline with an extension pass; if a technique forces a new rendering
  architecture, extend in place under the WI-02b renderer and note it in
  the evidence. Falsified if a technique needs gameplay rules in the
  renderer - move it to the simulation instead.
- Section 46 colossal test applies: the main idea of each must be more
  than "it is very big". Section 11.2 anti-cliche list is a hard gate.
- Spoiler rules (sections 0, 12, 68): internal ids only in identifiers,
  tests, and commit messages ("added the first large-scale ecological set
  piece" style).

## Fresh-session handoff

Read ST-03/plan.md (this item is the final proof owner for
AC-roster-count and AC-roster-tests), request sections 10, 11.1, 13, 20,
33, 34, 46, 47, 52, 68, 70, 74; WI-01b for the selected organism ids and
rubric answers; `design_private/` is the source of truth. Depends on
WI-03a/b/c: the whole-roster proof needs every earlier tier present in the
production world data.
