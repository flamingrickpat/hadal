---
id: WI-03c1
kind: story
parent: WI-03c
children: ["WI-03c1a", "WI-03c1b"]
depends_on: []
criteria:
  AC-roster-behavior: "At least 4 creature behaviors are materially different from direct pursuit and at least 2 creatures are beneficial or mutually useful, matching the private roster's anti-cliche and section 47 principle coverage"
  AC-roster-tests: "Every implemented major species has a headless behavior test for its signature rule, and no creature name or secret description appears outside debug internals and the private content files"
behavior: "Implement the tier-3 CreatureDefs plus per-predator controllers (bespoke up to ~120 lines per section 19, or the generic state machine plus rules otherwise), the non-chase hunting strategy, and the section 10 damage model per size class, with one headless signature-rule scenario per predator (trigger plus must-not-trigger control) and the final roster-wide AC-roster-behavior proof"
subsystems: ["world content data", "creature simulation", "headless scenario tests"]
verification: "Node scenario per predator proving its readable rule is learnable by observation (trigger approach plus a control that must not trigger); the non-chase predator completes headlessly without pursuing; the section 10 damage-model table holds per size class; FINAL PROOF headless roster check that 4+ species have non-pursuit signature behaviors and 2+ are beneficial; tier-3 spoiler containment check"
---

# WI-03c1 — Tier 3 simulation behavior: definitions, damage model, controllers

## Goal

Implement the 4-6 predator/territorial organisms the private roster selects
for tier 3 (section 11.1) as `CreatureDef` data plus their simulation-side
behavior on the ST-02 framework: the section 10 damage model per size class,
per-predator controllers where the private rubric answer requires one (bespoke
up to ~120 lines per section 19, or the generic state machine plus rules
otherwise), and at least one non-chase hunting strategy. Every predator carries
at least one readable rule the player can learn by observation (section 10).
This story owns the FINAL PROOF for AC-roster-behavior across tiers 1-3.

## Why this shape (review split)

The leaf as written bundled three independently testable behaviors: (1) the
per-predator signature rules and their controllers (4-6 distinct controllers,
each up to ~120 lines per section 19), each independently shippable and
testable via its own trigger-plus-control scenario; (2) the section 10 damage
model per size class, a shared mechanic independently verifiable without any
specific predator controller (harpoon cost, deter success, no-kill for large);
and (3) the FINAL PROOF headless roster check, a cross-tier integration test
with a different dependency profile (requires the WI-03b friendly species to be
landed). The non-chase hunting strategy is a specific instance of (1) and does
not add a behavior. The review receipt split it into two leaves, each with a
strict subset of the parent's three changed subsystems:

- WI-03c1a: the simulation foundation — the 4-6 tier-3 `CreatureDef`s in the
  production content plus the section 10 damage model per size class (small
  killable quickly, medium killable but costly, large deterable not worth
  killing, no HP bars). No per-predator controllers and no headless scenarios
  yet. Subsystems: world content data, creature simulation.
- WI-03c1b (depends on WI-03c1a): the per-predator controllers (bespoke up to
  ~120 lines per section 19, or the generic state machine plus rules otherwise)
  including the non-chase hunting strategy, one headless signature-rule
  scenario per predator (trigger approach plus a must-not-trigger control), and
  the FINAL PROOF headless roster check for AC-roster-behavior over production
  world data. Subsystems: creature simulation, headless scenario tests.

Scope is preserved: the tier still lands with definitions, the damage model,
per-predator controllers, the non-chase strategy, per-predator tests, and the
cross-tier proof; only the ownership is divided. Each child carries a strict
subset of the parent's changed subsystems and a strict subset of its parent's
criteria.

## Criteria assignment and proof ownership

Children retain the parent criteria verbatim; their union covers both:

- AC-roster-behavior: WI-03c1a and WI-03c1b — WI-03c1a lands the foundation:
  the section 10 size-class damage model establishes the large-predator
  deterable-not-killable behavior and the CreatureDefs encode each species'
  signature rule category, the data basis for the 4+ non-pursuit behaviors.
  WI-03c1b is the FINAL PROOF OWNER (owned there): a headless roster check over
  the production world data that at least 4 implemented species across tiers
  1-3 have signature behaviors materially different from direct pursuit and
  at least 2 species are beneficial/mutually useful. It counts the friendly
  species WI-03b1 lands plus the non-pursuit signature rules of its tier, and
  runs after WI-03b lands.
- AC-roster-tests: WI-03c1b — it owns the per-predator headless
  signature-rule tests (one trigger-plus-control scenario per predator) and the
  spoiler containment of this story's artifacts (the simulation half of this
  tier's AC-roster-tests; the roster-wide audit finalizes in WI-03d).

## Dependency notes

- This story inherits WI-03b through the WI-03c story: the final
  AC-roster-behavior proof (WI-03c1b) counts the friendly species WI-03b1
  lands. It inherits ST-01 (WI-01b rubric answers) and ST-02 (WI-02a/b/c
  framework) through ST-03's dependencies. Do not start before WI-02a/b/c are
  accepted.
- WI-03c1b depends on WI-03c1a: its controllers extend the `CreatureDef`s and
  damage model the foundation lands, and its per-predator scenarios exercise
  those controllers.
- The parent story's dependency of WI-03c2 on WI-03c1 now means both leaves of
  this story (WI-03c1a and WI-03c1b): WI-03c2's spawns reference the
  definitions WI-03c1a lands, and its browser spot-check exercises the
  controllers WI-03c1b builds.

## Constraints and non-goals

- No spawns in production world data and no renderer work in this story
  (WI-03c2); no large/colossal staging (WI-03d), no authored beat triggers
  (ST-04). No new renderer architecture.
- Assumption: the ST-02 state machine covers predator flows with at most a
  bespoke controller per species; if the framework lacks a state the private
  design needs, extend the framework in place and note it in the evidence.
  Falsified if two predators need the same bespoke controller - generalize it
  instead of duplicating.
- Section 11.2 anti-cliche list is a hard gate (no generic giant shark, no
  neon-blue-everything, no simple size-scaled fish); section 46 shark test
  applies per species.
- Spoiler rules (sections 0, 12, 68): internal ids only in identifiers,
  tests, and commit messages ("implemented two mid-depth predator archetypes"
  style); normal UI shows no creature names (section 33: ids in debug only).

## Fresh-session handoff

Read WI-03c/plan.md (criteria assignment; this story's WI-03c1b is the final
AC-roster-behavior proof owner across tiers 1-3), request sections 10, 11.1,
11.2, 13, 19, 33, 46, 68, 70, 74; WI-01b for the selected organism ids and
rubric answers; `design_private/` is the source of truth. Depends on WI-03b
(inherited through the WI-03c story - its final proof counts the friendly
species WI-03b1 lands); do not start before WI-02a/b/c are accepted.
