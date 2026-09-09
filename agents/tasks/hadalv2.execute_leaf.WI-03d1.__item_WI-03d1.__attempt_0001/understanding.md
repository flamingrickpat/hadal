# Understanding

This child implements one independently reviewed work item from C:\Temp\hadal-v2\agents\tasks\hadalv2.

---
id: WI-03d1
kind: work_item
parent: WI-03d
children: []
depends_on: []
criteria:
  AC-roster-large: "At least 3 large-scale creatures or creature events exist, including at least one colossal presence communicated first through changes to other fauna and one encounter where the player never gets a clean full-body view"
  AC-roster-tests: "Every implemented major species has a headless behavior test for its signature rule, and no creature name or secret description appears outside debug internals and the private content files"
behavior: "Implement the tier-4 CreatureDefs plus the simulation-side section 52 scale rules (speed mismatch, fauna-first environment reaction, sonar-scale signal, non-targetable presences) with one headless signature-rule scenario per organism asserting the fauna-announcement ordering and the no-clean-view window from the sim's visibility state"
subsystems: ["world content data", "creature simulation", "headless scenario tests"]
verification: "Node scenario per tier-4 organism for its signature rule (fauna-announcement ordering before any direct sight/sound evidence, no-clean-view window from sim visibility state, sonar echo at impossible scale, crossing/speed mismatch); non-targetable check (no HP bar, no kill path); tier-4 spoiler containment check"
---

# WI-03d1 — Tier 4: CreatureDefs + simulation-side scale rules

## Goal

Implement the 2-4 huge ecological set pieces and the 2-3 truly colossal
presences the private roster selects for tier 4 (section 11.1), at least one
colossal presence not simply hostile, as `CreatureDef` data plus their
simulation-side behavior. Their scale comes from the simulation-side half of
the section 52 techniques: the body moves slowly in body-space but covers
large world distance (F), other fauna react before the presence can be seen
or heard (D), and sonar returns at impossible scale (E). Their signature
rules are new gameplay behavior in the headless simulation, evidenced by one
headless signature-rule test per organism.

## Deliverables (checkable)

- One `CreatureDef` per selected tier-4 organism in
  `src/content/secret/hiddenCreatures.ts`, with the simulation-side fields
  its private design needs. The presentation half of the section 52
  techniques (partial anatomy A, parallax crossing B, foreground pass C, no
  center framing G) is WI-03d2's; the sonar-scale signal (E) is defined here
  as simulation state the renderer reads (section 13).
- Speed mismatch (F) in simulation: body-space velocity small while
  world-space distance covered per second is large.
- Environment reaction (D) in simulation: the fauna-announcement trigger —
  other species' state changes (schools flee, zones go quiet) in a designed
  radius/time window before any direct sight or sound evidence of the
  presence exists (section 20).
- Non-combat-target (section 10): no HP bar, no kill path; the simulation
  never exposes these organisms as combat targets.
- AC-roster-large floors, delivered here (headless):
  - at least one colossal presence communicated FIRST through changes to
    other fauna — in the headless trace the environment reaction must
    precede any direct sight or sound evidence;
  - at least one encounter where the player never receives a clean
    full-body view — the sim's visibility state never reports a clean
    full-body window for that encounter (the presentation side of techniques
    A/C/G is WI-03d2's);
  - at least 3 large-scale creatures or events in total: the tier's 2-4 plus
    2-3 definitions WI-03d1 lands meet this; their production presence is
    proven by WI-03d3.

## Tests (node, real simulation, no mocks of the rules)

- One headless scenario per tier-4 organism for its signature rule, through
  the scenario harness (`src/sim/scenario.ts`), using the production
  simulation and world data: e.g. fauna-announcement window, sonar echo at
  impossible scale, crossing event, no-full-view window.
- The fauna-announcement species: the scenario asserts other species' state
  changes (flee/quiet) before the player's senses report the colossal
  presence — final proof owner for the behavior half of the AC-roster-large
  floors (owned here).
- The no-full-view encounter: the scenario asserts from the sim's visibility
  state that no clean full-body window ever occurs.
- Non-targetable check: no HP bar, no kill path for any tier-4 organism
  (section 10).
- Spoiler containment for this item's artifacts: no creature name or secret
  description appears outside debug internals and the private content files
  (the tier's AC-roster-tests half; the roster-wide audit finalizes in
  WI-03d3).

## Constraints, assumptions, non-goals

- No production world data placement in this item (WI-03d3) and no renderer
  work (WI-03d2); no authored spectacle beats (ST-04); no ending content, no
  MacGuffin interaction (ST-05).
- Assumption: the section 52 simulation-side rules fit the existing ST-02
  simulation framework (`src/sim/Simulation.ts`); if one needs a new rule or
  signal, add it minimally in the simulation per section 30 and note it in
  the evidence. Falsified if a technique needs gameplay rules in the
  renderer — move it to the simulation instead.
- Section 34: no per-frame allocation in the tier-4 simulation hot paths.
- Section 46 colossal test applies: the main idea of each must be more than
  "it is very big". Section 11.2 anti-cliche list is a hard gate.
- Spoiler rules (sections 0, 12, 68): internal ids only in identifiers,
  tests, and commit messages ("added the first large-scale ecological set
  piece" style).

## Fresh-session handoff

Read WI-03d/plan.md (decomposition; criteria assignment; this item is the
headless final proof owner for the AC-roster-large floors), request sections
10, 11.1, 13, 20, 30, 33, 34, 46, 47, 52, 68, 70, 74; WI-01b for the
selected organism ids and rubric answers; `design_private/` is the source of
truth. Inherits WI-03a/b/c through the WI-03d story — the announcement
scenarios need the other tiers' species present in the world data; do not
start before the earlier tier stories are accepted.

