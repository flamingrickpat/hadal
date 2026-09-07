---
id: WI-03d
kind: story
parent: ST-03
children: ["WI-03d1", "WI-03d2", "WI-03d3"]
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

## Why this shape (review split)

The leaf as written changed four named responsibilities and bundled six
independently testable behaviors (the huge set-piece organisms and their
signature rules, the colossal presences with the fauna-first-announcement and
no-clean-view floors, the section 52 simulation-side scale rules, the section
52 renderer extensions, the tier-4 production placement, and the two
roster-wide final proofs). The review receipt split it into three leaves,
each with at most three changed responsibilities:

- WI-03d1: simulation behavior — CreatureDefs for the tier-4 organisms, the
  simulation-side section 52 scale rules (speed mismatch, environment
  reaction, sonar-scale signal, non-targetable presences), and one headless
  signature-rule scenario per organism asserting the fauna-announcement
  ordering and the no-clean-view window from the sim's visibility state.
  Subsystems: world content data, creature simulation, headless scenario
  tests.
- WI-03d2 (depends on WI-03d1): section 52 rendering — the spine extension
  for very long bodies, the foreground-occluder and parallax passes, no
  center framing, all reading simulation state only, plus the tier's browser
  spot-checks of one large and one colossal organism and the section 34
  performance guard. Subsystems: procedural creature rendering.
- WI-03d3 (depends on WI-03d1 and WI-03d2): production and final proof —
  tier-4 spawns and fixed encounter positions in the private bands, the
  whole-roster world-data check as FINAL PROOF for AC-roster-count, and the
  roster-wide test-existence check plus spoiler audit as FINAL PROOF for
  AC-roster-tests. Subsystems: world content data, headless scenario tests.

Scope is preserved: the tier still lands with definitions, simulation
behavior, the section 52 techniques, production placement, per-species tests,
both floors, and the two roster-wide proofs; only the ownership is divided.
Each child carries a strict subset of the parent's changed subsystems and a
strict subset of its parent's criteria.

## Criteria assignment and proof ownership

Children retain the parent criteria verbatim; their union covers all three:

- AC-roster-large: WI-03d1 and WI-03d2 — the floors are split by layer,
  each with a named final proof owner. WI-03d1 (behavior, headless): at least
  one colossal presence communicated FIRST through changes to other fauna
  (environment reaction precedes any direct sight or sound evidence in the
  headless trace) and at least one encounter where the player never receives
  a clean full-body view (asserted from the sim's visibility state); the
  at-least-3 large-scale floor is met by the tier's 2-4 plus 2-3 definitions
  WI-03d1 lands. WI-03d2 (presentation): those same presences read through
  their section 52 techniques in the browser spot-checks, not through a
  centered boss intro.
- AC-roster-count: WI-03d3 — it places the tier in the production world data
  and owns the FINAL PROOF: whole-roster world data check (15+ distinct
  active types, distribution matches the private roster, every creature id
  resolves, every spawn in its designed band).
- AC-roster-tests: WI-03d1, WI-03d2, and WI-03d3 — WI-03d1 owns the
  per-species headless signature-rule tests for the tier; WI-03d1 and WI-03d2
  each own spoiler containment of their own artifacts; WI-03d3 owns the
  FINAL PROOF: roster-wide test-existence check plus the spoiler audit of
  every ST-03 commit and artifact.

## Dependency notes

- This story depends on WI-03a, WI-03b, and WI-03c: the whole-roster final
  proofs (WI-03d3) need every earlier tier present in the production world
  data, and the colossal "announced through other fauna" behavior (WI-03d1)
  needs other species present for the announcement to be observed. It
  inherits ST-01 (WI-01b rubric answers) and ST-02 (WI-02a/b/c framework)
  through ST-03's dependencies.
- WI-03d2 depends on WI-03d1: the passes read the simulation state the
  tier-4 scenarios define, and the browser spot-checks exercise the
  organisms WI-03d1 builds.
- WI-03d3 depends on WI-03d1 and WI-03d2: its placement references the
  landed definitions, and its roster-wide proofs (including the spoiler
  audit of all ST-03 artifacts) must run after the whole tier exists.
  All three leaves inherit WI-03a/b/c through this story.
- No node depends on WI-03d; ST-04's story-level dependency on ST-03 is
  unchanged, and the ids and states WI-03d1 introduces are the stable ones
  ST-04's authored beats will reference.

## Constraints and non-goals

- Authored spectacle BEATS around these creatures (triggers, timing, camera
  staging, escape paths) are ST-04's; this story delivers the creatures and
  their base behavior with stable ids and states. No ending content, no
  MacGuffin interaction (ST-05).
- No new renderer architecture — WI-03d2 extends in place under the WI-02b
  renderer; if a section 52 technique forces a new rendering architecture,
  extend in place and note it in the evidence. Falsified if a technique
  needs gameplay rules in the renderer — move it to the simulation instead.
- Section 46 colossal test applies: the main idea of each must be more than
  "it is very big". Section 11.2 anti-cliche list is a hard gate.
- Spoiler rules (sections 0, 12, 68): internal ids only in identifiers,
  tests, and commit messages ("added the first large-scale ecological set
  piece" style); normal UI shows no creature names (section 33: ids in
  debug only).

## Fresh-session handoff

Read ST-03/plan.md (criteria assignment; WI-03d1 is the headless final proof
owner for the AC-roster-large floors, WI-03d2 the presentation half, WI-03d3
the final proof owner for AC-roster-count and AC-roster-tests), request
sections 10, 11.1, 13, 20, 33, 34, 46, 47, 52, 68, 70, 74; WI-01b for the
selected organism ids and rubric answers; `design_private/` is the source of
truth. Depends on WI-03a/b/c: the whole-roster proofs need every earlier
tier present in the production world data.
