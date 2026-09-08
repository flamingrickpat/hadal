---
id: WI-03a
kind: work_item
parent: ST-03
children: []
depends_on: []
criteria:
  AC-roster-count: "At least 15 distinct implemented creature types are active in the production world data with their spawns, meeting the private roster's distribution"
  AC-roster-tests: "Every implemented major species has a headless behavior test for its signature rule, and no creature name or secret description appears outside debug internals and the private content files"
behavior: "Implement the ambient/schooling tier (5-7 tiny organisms) of the private roster as CreatureDef data with school behavior on the ST-02 framework, spawned in the production world data, each with a headless signature-rule test"
subsystems: ["creature simulation", "world content data", "headless scenario tests"]
verification: "Node scenarios per species signature rule (school parting, ambient caps, offscreen throttling); world data check that this tier's ids resolve and spawn in the designed band; one browser spot-check of a tier organism rendering"
---

# WI-03a — Tier 1: ambient/schooling fauna

## Goal

Land the first roster tier in production: the 5-7 tiny ambient/schooling
organisms the private roster selects (section 11.1 distribution). Each
becomes a `CreatureDef` in `src/content/secret/hiddenCreatures.ts`, advances
on the ST-02 framework (WI-02a runtime, WI-02c school behavior), and spawns
from `src/world/worldData.ts` where the private roster places it.

## Deliverables (checkable)

- One `CreatureDef` per selected tier-1 organism, data-driven on the ST-02
  generic state machine plus school parameters; no bespoke controller unless
  the private rubric answer demands one (section 19 allows bespoke
  controllers up to ~120 lines).
- Spawns in `src/world/worldData.ts` at the density the band needs
  (section 49: dense traversal, no empty corridors) with the section 34
  ambient count caps; ids never appear in normal UI (section 33 - internal
  ids in debug only).
- Per-organism signature rule per the WI-01b private rubric answer (e.g.
  school parts around the player per section 48; ambient type orients to
  current per section 20). If an answer proves weak in code, redesign
  privately first (section 11.3) - never ship a generic fish.
- Reuse the WI-02b small-creature renderer; parameterize silhouettes via
  data rather than new renderer classes. A section 46 check applies:
  replacing the organism with a same-size generic fish must change the scene.
- Section 11.1 minimums that fall in this tier (e.g. the scale-misread
  organism or the colony that reads as one animal) are implemented here if
  the private roster assigns them to this tier; they are not invented here.

## Tests (node, real simulation, no mocks of the rules)

- One headless behavior test per species for its signature rule, through the
  scenario harness (`src/sim/scenario.ts`).
- School scenario: a school parts around the moving player and reforms.
- Ambient caps: active ambient entities per chunk stay within the section 34
  cap; offscreen throttling deactivates and reactivates correctly.
- World data check: every tier-1 creature id resolves to a def and every
  spawn sits in the band the private roster designed it for (a tier-1
  portion of the roster-wide check WI-03d finalizes).

## Browser spot-check (presentation only)

One representative tier-1 organism renders and animates without console
errors; no browser reachability proof (section 70 layers).

## Constraints, assumptions, non-goals

- No predators, no friendly species, no large-creature staging (later
  tiers). No new renderer architecture; data-parameterized bodies only.
- Assumption: the ST-02 school behavior is reusable as-is; if a private
  species needs a school variant, extend the framework behavior in place
  rather than forking it. Falsified if the framework forces a parallel
  school system - then fix the framework in this item and note it.
- Spoiler rules (sections 0, 12, 68): internal ids only in code identifiers,
  plan nodes, tests, and commit messages. Commit style: "implemented the
  shallow ambient fauna tier".

## Fresh-session handoff

Read ST-03/plan.md (criteria assignment, proof ownership), request sections
11.1, 13, 19, 20, 33, 34, 48, 49, 68, 70, 74; WI-01b for the selected
organism ids and rubric answers; `design_private/` is the source of truth.
The whole-roster count and test audit are finalized in WI-03d, not here.
