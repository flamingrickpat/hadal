---
id: WI-03b
kind: story
parent: ST-03
children: ["WI-03b1", "WI-03b2"]
depends_on: []
criteria:
  AC-roster-count: "At least 15 distinct implemented creature types are active in the production world data with their spawns, meeting the private roster's distribution"
  AC-roster-behavior: "At least 4 creature behaviors are materially different from direct pursuit and at least 2 creatures are beneficial or mutually useful, matching the private roster's anti-cliche and section 47 principle coverage"
  AC-roster-tests: "Every implemented major species has a headless behavior test for its signature rule, and no creature name or secret description appears outside debug internals and the private content files"
behavior: "Implement the small/medium useful/neutral fauna tier (4-6 organisms, including the at-least-2 friendly species) with their simulation interactions, production spawns, and headless signature-rule tests"
subsystems: ["creature simulation", "procedural creature rendering", "world content data", "headless scenario tests"]
verification: "Node scenarios per species signature rule including the friendly-interaction advantage; world data check for this tier's ids and bands; roster floor check that the 2+ friendly species are mechanically beneficial headlessly; one browser spot-check of a tier organism"
---

# WI-03b — Tier 2: small/medium useful/neutral fauna (incl. friendly)

## Goal

Land the second roster tier: the 4-6 small/medium useful/neutral organisms
the private roster selects (section 11.1 distribution), including the
at-least-2 genuinely helpful or mutually beneficial species (section 21).
Their simulation-side interactions are new gameplay behavior, not data
tweaks, which is what makes this tier its own behavior batch.

## Why this shape (review split)

The leaf as written changed four named responsibilities and bundled four
independently testable behaviors (4-6 per-species signature rules plus the
friendly-interaction rules). The review receipt split it into two leaves,
each with at most three changed responsibilities and one focused behavior:

- WI-03b1: simulation behavior — CreatureDefs for the tier plus the
  simulation interactions for the tier's signature rules including the
  at-least-2 friendly behaviors, per-species headless signature-rule tests,
  and the 2+ friendly floor check. Subsystems: world content data, creature
  simulation, headless scenario tests.
- WI-03b2 (depends on WI-03b1): production presence — tier-2 spawns in the
  production world data at band density with section 34 caps, data-driven
  small/medium body shapes on the existing WI-02b renderer pipeline, and the
  one tier browser spot-check. Subsystems: world content data, procedural
  creature rendering.

Scope is preserved: the tier still lands with definitions, behavior, spawns,
rendering, tests and the friendly floor; only the ownership is divided. Each
child carries a strict subset of the parent's changed subsystems and a
strict subset of its parent's criteria.

## Criteria assignment and proof ownership

Children retain the parent criteria verbatim; their union covers all three:

- AC-roster-behavior: WI-03b1 — it delivers the "at least 2 creatures are
  beneficial" evidence for this tier (the 2+ friendly floor check, headless,
  through the production simulation). WI-03c remains the final proof owner
  for AC-roster-behavior overall across tiers, per the ST-03 plan.
- AC-roster-count: WI-03b2 — it lands the tier in the production world data
  (ids resolve, spawns in the designed band). The roster-wide count check
  (15+ active types) still finalizes in WI-03d.
- AC-roster-tests: WI-03b1 and WI-03b2 — each owns the per-tier half (one
  headless signature-rule test per species; spoiler containment of this
  tier's artifacts). Roster-wide test-existence check and the spoiler audit
  finalize in WI-03d.

## Dependency notes

- This story depends on nothing in-tier beyond its parent: it inherits
  ST-01 (WI-01b rubric answers) and ST-02 (WI-02a/b/c framework) through
  ST-03's dependencies.
- WI-03b2 depends on WI-03b1: spawns reference the definitions and the
  browser spot-check exercises the friendly interaction rendering.
- The existing WI-03c and WI-03d dependencies on WI-03b now mean all its
  leaves; WI-03c's final AC-roster-behavior proof counts the friendly
  species WI-03b1 lands.

## Constraints and non-goals

- No predators (WI-03c), no large/colossal staging (WI-03d). No new
  renderer architecture.
- Friendly interactions must fit the existing resource/interaction rules in
  `src/sim/Simulation.ts`; if one needs a new meter or rule, add it
  minimally in the simulation per section 30 and say so in the evidence.
- Section 46 friendly-species test: each friendly species must be
  mechanically useful or emotionally memorable without speech, mascot
  status, dialogue, or "press E to befriend" questification.
- Spoiler rules (sections 0, 12, 68): internal ids only in identifiers,
  tests, and commit messages; normal UI shows no creature names (section
  33: ids in debug only).

## Fresh-session handoff

Read ST-03/plan.md (criteria assignment; WI-03c is the final proof owner
for AC-roster-behavior overall, WI-03b1 owns the friendly floor), request
sections 10, 11.1, 13, 19, 21, 33, 34, 46, 49, 68, 70, 74; WI-01b for the
selected organism ids and rubric answers; `design_private/` is the source
of truth. Do not start before WI-02a/b/c are accepted.
