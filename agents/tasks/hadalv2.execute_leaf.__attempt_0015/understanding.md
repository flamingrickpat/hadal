# Understanding

This child implements one independently reviewed work item from C:\Temp\hadal-v2\agents\tasks\hadalv2.

---
id: WI-03c1b
kind: work_item
parent: WI-03c1
children: []
depends_on: ["WI-03c1a"]
criteria:
  AC-roster-behavior: "At least 4 creature behaviors are materially different from direct pursuit and at least 2 creatures are beneficial or mutually useful, matching the private roster's anti-cliche and section 47 principle coverage"
  AC-roster-tests: "Every implemented major species has a headless behavior test for its signature rule, and no creature name or secret description appears outside debug internals and the private content files"
behavior: "Implement the per-predator controllers (bespoke up to ~120 lines per section 19, or the generic state machine plus rules otherwise) over the WI-03c1a CreatureDefs, including at least one non-chase hunting strategy, one headless signature-rule scenario per predator (trigger approach plus a must-not-trigger control), and the FINAL PROOF headless roster check for AC-roster-behavior over production world data"
subsystems: ["creature simulation", "headless scenario tests"]
verification: "Node scenario per predator proving its readable rule is learnable by observation (trigger approach plus a control that must not trigger); the non-chase predator completes headlessly without pursuing (its signature state path avoids the generic attack chase states); FINAL PROOF headless roster check that 4+ species across tiers 1-3 have non-pursuit signature behaviors and 2+ are beneficial; tier-3 spoiler containment check"
---

# WI-03c1b — Tier 3: per-predator controllers (incl. non-chase) + final proof

## Goal

Implement the simulation-side behavior of the 4-6 tier-3 predators the private
roster selects, on top of the `CreatureDef`s and section 10 damage model
WI-03c1a lands: per-predator controllers where the private rubric answer
requires one (bespoke up to ~120 lines per section 19, or the generic state
machine plus rules otherwise), at least one non-chase hunting strategy, one
readable rule per predator the player can learn by observation (section 10),
and the FINAL PROOF for AC-roster-behavior across tiers 1-3.

## Deliverables (checkable)

- Per-predator controllers over the WI-03c1a `CreatureDef`s, where the private
  rubric answer requires one: bespoke controllers up to ~120 lines each
  (section 19), or the generic ST-02 state machine plus per-species rules
  otherwise. Each controller reads the definition and rule-category fields
  WI-03c1a encodes.
- Per-predator readable rule from the section 10 rule categories the
  definitions carry (reacts to motion/light/sonar, attacks from cover,
  territory without long chase, follows blood, attacks noise sources, mistook
  tool signals, dangerous only in company - the private roster decides). Each
  rule must be discoverable by observation within a couple of encounters, no
  wiki.
- Non-chase hunting strategy for at least one predator (section 11.1 minimum),
  e.g. ambush, luring through another species, or territory control - per the
  private design. Its signature state path avoids the generic `attack` chase
  states.
- The section 11.1 minimums assigned to this tier (e.g. the
  dangerous-phase-is-not-the-scary-phase organism, the ecosystem relationship
  the player can exploit) are realized in simulation here on the WI-03c1a
  definitions and tested here.

## Tests (node, real simulation, no mocks of the rules)

- One headless scenario per predator proving its readable rule, through the
  scenario harness (`src/sim/scenario.ts`), using the production simulation and
  world data: approach under the rule's trigger conditions and assert the
  expected reaction, plus a control approach that must not trigger.
- The non-chase predator's strategy completes headlessly without pursuing the
  player (its signature state path avoids the generic `attack` chase states).
- FINAL PROOF for AC-roster-behavior (acceptance evidence, owned here): a
  headless roster check over the production world data that at least 4
  implemented species across tiers 1-3 have signature behaviors materially
  different from direct pursuit and at least 2 species are
  beneficial/mutually useful. It counts the friendly species WI-03b1 lands plus
  the non-pursuit signature rules of this tier, and runs after WI-03b lands.
- Spoiler containment for this item's artifacts: no creature name or secret
  description appears outside debug internals and the private content files
  (the simulation half of this tier's AC-roster-tests; the roster-wide audit
  finalizes in WI-03d).

## Browser spot-check

None in this item - the tier's one browser spot-check (WI-03c2) covers
presentation; all evidence here is headless (section 70 layers). The scenarios
must still use the production simulation and world data, not mocks of the
rules.

## Constraints, assumptions, non-goals

- No production world data spawns and no renderer work in this item (WI-03c2);
  no large/colossal staging (WI-03d), no authored beat triggers (ST-04). No new
  renderer architecture.
- The `CreatureDef`s and the section 10 damage model are WI-03c1a's; this item
  builds the controllers and the final proof on top of them and does not
  re-own the definitions or the damage table.
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

Read WI-03c1/plan.md (decomposition; this item is the controller and final
proof half and is the final AC-roster-behavior proof owner across tiers 1-3),
request sections 10, 11.1, 11.2, 13, 19, 33, 46, 68, 70, 74; WI-01b for the
selected organism ids and rubric answers; `design_private/` is the source of
truth. Depends on WI-03c1a (its CreatureDefs and damage model) and inherits
WI-03b through the WI-03c story (its final proof counts the friendly species
WI-03b1 lands); do not start before WI-02a/b/c are accepted.

