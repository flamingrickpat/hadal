---
id: WI-03c
kind: work_item
parent: ST-03
children: []
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
difficulty curve by band.

## Deliverables (checkable)

- One `CreatureDef` per selected tier-3 organism in
  `src/content/secret/hiddenCreatures.ts`, with bespoke controllers where
  the private rubric answer requires one (section 19 allows bespoke
  controllers up to ~120 lines; generic state machine plus rules otherwise).
- Per-predator readable rule from the section 10 rule categories (reacts to
  motion/light/sonar, attacks from cover, territory without long chase,
  follows blood, attacks noise sources, mistook tool signals, dangerous only
  in company - not a checklist; the private roster decides). Each rule must
  be discoverable by observation within a couple of encounters, no wiki.
- Non-chase hunting strategy for at least one predator (section 11.1
  minimum), e.g. ambush, luring through another species, or territory
  control - per the private design.
- Section 11.1 minimums assigned to this tier (e.g. the dangerous-phase-is-
  not-the-scary-phase organism, the ecosystem relationship the player can
  exploit) are implemented here and tested.
- Damage model per section 10: small fauna killable quickly; medium
  predators killable but costly; large predators deterable, not worth
  killing. No HP bars over anything in this tier or below.
- Spawns in `src/world/worldData.ts` placed so the section 39 curve holds:
  early-band predators telegraph clearly, mid-band forces learning one
  avoidance rule, deep-band combinations of sonar/light/decoy/movement;
  dense traversal per section 49, caps per section 34, ids debug-only
  (section 33).
- Rendering through the WI-02b renderers with data-driven body shapes;
  predators visibly commit to an attack before contact (section 48).

## Tests (node, real simulation, no mocks of the rules)

- One headless scenario per predator proving its readable rule: approach
  under the rule's trigger conditions and assert the expected reaction, plus
  a control approach that must not trigger.
- The non-chase predator's strategy completes headlessly without pursuing
  the player (its signature state path avoids the generic `attack` chase
  states).
- Damage model: the section 10 table holds per size class (harpoon cost,
  deter success, no-kill for large).
- World data check: tier-3 ids resolve; spawns sit in the designed band.
- FINAL PROOF for AC-roster-behavior (owned here): a headless roster check
  over the production world data that at least 4 implemented species across
  tiers 1-3 have signature behaviors materially different from direct
  pursuit, and at least 2 species are beneficial/mutually useful. This runs
  after WI-03b lands and is the acceptance evidence for that criterion.
- Spoiler containment for this tier's artifacts (roster-wide audit in
  WI-03d).

## Browser spot-check (presentation only)

One representative tier-3 predator renders, telegraphs, and commits visibly
without console errors; no browser reachability proof (section 70 layers).

## Constraints, assumptions, non-goals

- No large/colossal staging (WI-03d), no authored beat triggers (ST-04).
- Assumption: the ST-02 state machine covers predator flows with at most a
  bespoke controller per species; if the framework lacks a state the
  private design needs, extend the framework in place and note it in the
  evidence. Falsified if two predators need the same bespoke controller -
  generalize it instead of duplicating.
- Section 11.2 anti-cliche list is a hard gate (no generic giant shark, no
  neon-blue-everything, no simple size-scaled fish); section 46 shark test
  applies per species.
- Spoiler rules (sections 0, 12, 68): internal ids only in identifiers,
  tests, and commit messages ("implemented two mid-depth predator
  archetypes" style).

## Fresh-session handoff

Read ST-03/plan.md (this item is the final proof owner for
AC-roster-behavior), request sections 10, 11.1, 11.2, 13, 19, 33, 34, 39,
46, 48, 49, 68, 70, 74; WI-01b for the selected organism ids and rubric
answers; `design_private/` is the source of truth. Depends on WI-03b for
the final behavior/friendly floor; do not start before WI-02a/b/c are
accepted.
