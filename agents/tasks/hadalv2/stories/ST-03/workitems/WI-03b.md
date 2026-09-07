---
id: WI-03b
kind: work_item
parent: ST-03
children: []
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

## Deliverables (checkable)

- One `CreatureDef` per selected tier-2 organism in
  `src/content/secret/hiddenCreatures.ts`, plus simulation behavior for the
  interactions the private rubric assigns: candidate categories from
  section 21 (feeding trade, guide behavior, warning behavior, shelter
  territory, investigating resource nodes, following light, response to
  repeated nonviolent interaction) - only the ones the private roster chose.
- At least one friendly interaction gives the player a practical advantage
  they can discover organically (section 21); no "press E to befriend"
  questification, no dialogue.
- Section 11.1 minimums assigned to this tier by the private roster (e.g.
  the looks-dangerous-but-safe organism, the apparently-harmless organism
  with a surprising second behavior, the wreck-incorporating organism) are
  implemented here; the dangerous-looking-safe one must be safe in
  simulation, the second-behavior one must have both behaviors tested.
- Spawns in `src/world/worldData.ts` at band density (section 49) with
  section 34 caps; ids debug-only (section 33).
- Rendering through the WI-02b renderers; new small/medium body shapes are
  added as data-driven shape parameters on the existing renderer pipeline,
  keeping the section 13 silhouette-recognizable bar (two seconds).

## Tests (node, real simulation, no mocks of the rules)

- One headless behavior test per species for its signature rule.
- Friendly floor check: at least 2 species deliver a mechanically
  beneficial interaction headlessly (e.g. feeding trade yields a resource;
  shelter territory blocks or deters a threat), through the production
  simulation and world data - this is the evidence for the "at least 2
  creatures are beneficial" half of AC-roster-behavior.
- The apparent-harmless second behavior triggers under the designed
  condition and not before.
- World data check: tier-2 ids resolve; spawns sit in the designed band.
- Spoiler containment: no name or secret description outside debug
  internals and the private content files (AC-roster-tests half for this
  tier; roster-wide audit finalizes in WI-03d).

## Browser spot-check (presentation only)

One representative tier-2 organism (preferably a friendly one) renders,
animates, and shows its interaction readably, without console errors; no
browser reachability proof (section 70 layers).

## Constraints, assumptions, non-goals

- No predators (WI-03c), no large/colossal staging (WI-03d). No new
  renderer architecture.
- Assumption: friendly interactions fit the existing resource/interaction
  rules in `src/sim/Simulation.ts`; if one needs a new meter or rule, add it
  minimally in the simulation per section 30 and say so in the evidence.
  Falsified if a friendly behavior requires a UI quest element - redesign
  privately per section 21 instead.
- Section 46 friendly-species test applies: each must be mechanically
  useful or emotionally memorable without speech or mascot status.
- Spoiler rules (sections 0, 12, 68): internal ids only in identifiers,
  tests, and commit messages.

## Fresh-session handoff

Read ST-03/plan.md (criteria assignment; WI-03c is the final proof owner
for AC-roster-behavior overall, this item owns the friendly floor), request
sections 10, 11.1, 13, 19, 21, 33, 34, 46, 49, 68, 70, 74; WI-01b for the
selected organism ids and rubric answers; `design_private/` is the source of
truth. Do not start before WI-02a/b/c are accepted.
