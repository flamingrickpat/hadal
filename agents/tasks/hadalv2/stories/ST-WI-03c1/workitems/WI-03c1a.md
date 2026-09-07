---
id: WI-03c1a
kind: work_item
parent: WI-03c1
children: []
depends_on: []
criteria:
  AC-roster-behavior: "At least 4 creature behaviors are materially different from direct pursuit and at least 2 creatures are beneficial or mutually useful, matching the private roster's anti-cliche and section 47 principle coverage"
behavior: "Implement the 4-6 tier-3 predator/territorial CreatureDefs in the production content plus the section 10 damage model per size class (small killable quickly, medium killable but costly, large deterable not worth killing, no HP bars) as the simulation foundation the per-predator controllers build on"
subsystems: ["world content data", "creature simulation"]
verification: "Node check that every tier-3 CreatureDef resolves in the production world data (ids, size class, rule-category fields); the section 10 damage-model table holds per size class (harpoon cost, deter success, no-kill for large, no HP bar); the large-predator deterable-not-killable behavior is exercised headlessly"
---

# WI-03c1a — Tier 3 foundation: CreatureDefs + section 10 damage model

## Goal

Land the simulation foundation for the third roster tier: the 4-6
predator/territorial organisms the private roster selects (section 11.1) as
`CreatureDef` data, plus the section 10 damage model per size class. This item
provides the definitions and the size-class damage rules that the per-predator
controllers (WI-03c1b) build on. It is headless and data-focused: no bespoke
controllers, no per-predator scenarios, no production spawns, and no renderer
work in this item.

## Deliverables (checkable)

- One `CreatureDef` per selected tier-3 organism in
  `src/content/secret/hiddenCreatures.ts`, carrying the simulation-side fields
  its private design needs: size class, the section 10 signature rule category
  (reacts to motion/light/sonar, attacks from cover, territory without long
  chase, follows blood, attacks noise sources, mistook tool signals, dangerous
  only in company - not a checklist; the private roster decides), and the
  fields WI-03c1b's controllers will read. The per-predator controllers
  themselves are WI-03c1b's.
- The section 11.1 minimums that are data-level and assigned to this tier (e.g.
  the dangerous-phase-is-not-the-scary-phase organism, the ecosystem
  relationship the player can exploit) are encoded in the definitions here;
  their simulation behavior is realized and tested in WI-03c1b.
- Damage model per section 10, implemented in the simulation: small fauna
  killable quickly; medium predators killable but costly; large predators
  deterable, not worth killing. No HP bars over anything in this tier or below.

## Tests (node, real simulation, no mocks of the rules)

- Every tier-3 `CreatureDef` resolves in the production world data: ids, size
  class, and the rule-category fields WI-03c1b's controllers read.
- The section 10 damage-model table holds per size class, verified headlessly
  without any specific predator controller: harpoon cost scales correctly
  (small quick kill, medium costly kill), deter success for large, and no-kill
  for large. No HP bar is exposed for any tier-3 organism.
- The large-predator deterable-not-killable behavior is exercised headlessly:
  the simulation resolves a deterrence interaction rather than a kill for a
  large-predator size class. This is the data/behavior basis of the large-
  predator half of AC-roster-behavior (the per-predator non-pursuit controllers
  and the roster-wide count are WI-03c1b's).

## Constraints, assumptions, non-goals

- No per-predator controllers, no non-chase strategy, and no per-predator
  headless signature scenarios in this item (WI-03c1b); no production world
  data spawns and no renderer work (WI-03c2); no large/colossal staging
  (WI-03d), no authored beat triggers (ST-04). No new renderer architecture.
- Section 11.2 anti-cliche list is a hard gate on the definitions (no generic
  giant shark, no neon-blue-everything, no simple size-scaled fish); section 46
  shark test applies per species.
- Spoiler rules (sections 0, 12, 68): internal ids only in identifiers, tests,
  and commit messages ("added the tier-3 creature definitions" style); normal
  UI shows no creature names (section 33: ids in debug only).

## Fresh-session handoff

Read WI-03c1/plan.md (decomposition; this item is the foundation half -
definitions plus the section 10 damage model; WI-03c1b is the controller and
final-proof half), request sections 10, 11.1, 11.2, 13, 19, 33, 46, 68, 70,
74; WI-01b for the selected organism ids and rubric answers; `design_private/`
is the source of truth. Inherits WI-03b and the ST-02 framework through the
WI-03c story; do not start before WI-02a/b/c are accepted.
