---
id: WI-03c
kind: story
parent: ST-03
children: ["WI-03c1", "WI-03c2"]
depends_on: ["WI-03b"]
criteria:
  AC-roster-count: "At least 15 distinct implemented creature types are active in the production world data with their spawns, meeting the private roster's distribution"
  AC-roster-behavior: "At least 4 creature behaviors are materially different from direct pursuit and at least 2 creatures are beneficial or mutually useful, matching the private roster's anti-cliche and section 47 principle coverage"
  AC-roster-tests: "Every implemented major species has a headless behavior test for its signature rule, and no creature name or secret description appears outside debug internals and the private content files"
behavior: "Implement the predator/territorial tier (4-6 organisms, including the non-chase hunting strategy) with readable per-predator rules, production spawns, and the final roster-wide check for the behavior/friendly floor"
subsystems: ["creature simulation", "procedural creature rendering", "world content data", "headless scenario tests"]
verification: "Node scenario per predator proving its readable rule is learnable by observation; damage-model checks per the section 10 table; final headless roster check that 4+ species have non-pursuit signature behaviors and 2+ species are beneficial; one browser spot-check of a tier predator"
---

# WI-03c — Tier 3: predator/territorial fauna

## Goal

Land the third roster tier: the 4-6 predator/territorial organisms the
private roster selects (section 11.1), including at least one non-chase
hunting strategy. Every predator carries at least one readable rule the
player can learn by observation (section 10), scaled to the section 39
difficulty curve by band. This tier owns the final roster-wide proof for
AC-roster-behavior across tiers 1-3.

## Why this shape (review split)

The leaf as written changed four named responsibilities and bundled several
independently testable behaviors (4-6 per-predator signature rules each with
a bespoke controller, the non-chase hunting strategy, the section 10 damage
model, and the roster-wide AC-roster-behavior floor). The review receipt
split it into two leaves, each with at most three changed responsibilities
and one focused behavior:

- WI-03c1: simulation behavior — CreatureDefs for the tier plus per-predator
  controllers (bespoke up to ~120 lines per section 19, or the generic state
  machine plus rules otherwise), the non-chase hunting strategy, the section
  10 damage model per size class, per-predator headless signature scenarios
  (a trigger approach plus a must-not-trigger control), and the FINAL PROOF
  for AC-roster-behavior (a headless roster check over production world
  data, counting WI-03b1's friendly species). Subsystems: world content
  data, creature simulation, headless scenario tests.
- WI-03c2 (depends on WI-03c1): production presence — tier-3 spawns in the
  production world data on the section 39 bands with section 34 caps,
  data-driven predator body shapes plus pre-contact telegraph/commit
  visibility on the existing WI-02b renderer pipeline, and the tier's one
  browser spot-check. Subsystems: world content data, procedural creature
  rendering.

Scope is preserved: the tier still lands with definitions, controllers,
behavior, the non-chase strategy, the damage model, spawns, rendering, tests
and the behavior/friendly floor; only the ownership is divided. Each child
carries a strict subset of the parent's changed subsystems and a strict
subset of its parent's criteria.

## Criteria assignment and proof ownership

Children retain the parent criteria verbatim; their union covers all three:

- AC-roster-behavior: WI-03c1 — FINAL PROOF OWNER (owned here): a headless
  roster check over the production world data that at least 4 implemented
  species across tiers 1-3 have signature behaviors materially different
  from direct pursuit and at least 2 species are beneficial/mutually useful.
  It counts the friendly species WI-03b1 lands plus the non-pursuit signature
  rules of its own tier, and runs after WI-03b lands.
- AC-roster-count: WI-03c2 — it lands the tier-3 organisms in the production
  world data (ids resolve, spawns in the designed band). The roster-wide
  count check (15+ active types) still finalizes in WI-03d.
- AC-roster-tests: WI-03c1 and WI-03c2 — each owns a per-tier half (one
  headless signature-rule test per species for its side; spoiler containment
  of its own artifacts). Roster-wide test-existence check and the spoiler
  audit finalize in WI-03d.

## Dependency notes

- This story depends on WI-03b: the final AC-roster-behavior proof counts the
  friendly species WI-03b1 lands. It inherits ST-01 (WI-01b rubric answers)
  and ST-02 (WI-02a/b/c framework) through ST-03's dependencies.
- WI-03c2 depends on WI-03c1: its spawns reference the definitions WI-03c1
  lands, and its browser spot-check exercises the controllers and body shapes
  WI-03c1 builds. Both leaves inherit WI-03b through this story.
- The existing WI-03d dependency on WI-03c now means all its leaves
  (WI-03c1 and WI-03c2).

## Constraints and non-goals

- No large/colossal staging (WI-03d), no authored beat triggers (ST-04). No
  new renderer architecture — WI-03c2 adds data-driven body shapes to the
  existing WI-02b pipeline only.
- Assumption: the ST-02 state machine covers predator flows with at most a
  bespoke controller per species; if the framework lacks a state the private
  design needs, extend the framework in place and note it in the evidence.
  Falsified if two predators need the same bespoke controller — generalize it
  instead of duplicating.
- Section 11.2 anti-cliche list is a hard gate (no generic giant shark, no
  neon-blue-everything, no simple size-scaled fish); section 46 shark test
  applies per species.
- Spoiler rules (sections 0, 12, 68): internal ids only in identifiers,
  tests, and commit messages; normal UI shows no creature names (section 33:
  ids in debug only).

## Fresh-session handoff

Read ST-03/plan.md (criteria assignment; this story's WI-03c1 is the final
proof owner for AC-roster-behavior overall across tiers 1-3), request
sections 10, 11.1, 11.2, 13, 19, 33, 34, 39, 46, 48, 49, 68, 70, 74; WI-01b
for the selected organism ids and rubric answers; `design_private/` is the
source of truth. Depends on WI-03b for the final behavior/friendly floor; do
not start before WI-02a/b/c are accepted.
