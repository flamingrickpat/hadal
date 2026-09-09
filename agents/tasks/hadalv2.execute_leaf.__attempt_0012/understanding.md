# Understanding

This child implements one independently reviewed work item from C:\Temp\hadal-v2\agents\tasks\hadalv2.

---
id: WI-03b2
kind: work_item
parent: WI-03b
children: []
depends_on: ["WI-03b1"]
criteria:
  AC-roster-count: "At least 15 distinct implemented creature types are active in the production world data with their spawns, meeting the private roster's distribution"
  AC-roster-tests: "Every implemented major species has a headless behavior test for its signature rule, and no creature name or secret description appears outside debug internals and the private content files"
behavior: "Land the tier-2 organisms in the production world: spawns at band density with section 34 caps, data-driven small/medium body shapes on the existing WI-02b renderer pipeline, and the tier's one browser spot-check"
subsystems: ["world content data", "procedural creature rendering"]
verification: "World data check that tier-2 ids resolve and spawns sit in the designed band; tier-2 spoiler containment check; one browser spot-check of a representative tier-2 organism (preferably a friendly one) rendering, animating, and showing its interaction readably"
---

# WI-03b2 — Tier 2: production spawns + data-driven rendering

## Goal

Put the tier-2 organisms that WI-03b1 defines into the production world:
spawns in `src/world/worldData.ts` at band density (section 49) with
section 34 caps, new small/medium body shapes added as data-driven shape
parameters on the existing WI-02b renderer pipeline (section 13
silhouette-recognizable in two seconds), and the tier's one browser
spot-check.

## Deliverables (checkable)

- Spawns in `src/world/worldData.ts` for every tier-2 organism id that
  WI-03b1 lands, at the density the band needs (section 49: dense
  traversal, no empty corridors) with the section 34 caps; ids
  debug-only (section 33) - they never appear in normal UI.
- New small/medium body shapes for the tier added as data-driven shape
  parameters on the existing WI-02b renderer pipeline; no new renderer
  architecture. Section 13 bar: each silhouette is recognizable in two
  seconds, and the wreck-incorporating organism (if the private roster
  assigns it here) reads as found-object attachment per section 13.4.

## Tests and checks

- World data check: every tier-2 creature id resolves to a def and every
  spawn sits in the band the private roster designed it for (a tier-2
  portion of the roster-wide AC-roster-count check WI-03d finalizes).
- Spoiler containment for this item's artifacts: no creature name or
  secret description appears outside debug internals and the private
  content files (the tier's AC-roster-tests half; the roster-wide audit
  finalizes in WI-03d).

## Browser spot-check (presentation only)

One representative tier-2 organism (preferably a friendly one) renders,
animates, and shows its interaction readably, without console errors; no
browser reachability proof (section 70 layers).

## Constraints, assumptions, non-goals

- No new renderer architecture; no simulation rule changes - if the
  spot-check exposes a behavior defect, fix it through the existing
  fix-planning route, not here.
- No predators (WI-03c), no large/colossal staging (WI-03d).
- Spoiler rules (sections 0, 12, 68): internal ids only in identifiers,
  tests, and commit messages ("spawned the mid-depth useful fauna tier and
  added its body shapes" style).

## Fresh-session handoff

Read WI-03b/plan.md (decomposition; criteria assignment), request sections
13, 13.4, 33, 34, 49, 68, 70, 74; WI-01b for the selected organism ids and
band placement; WI-03b1 for the landed ids and shape parameters;
`design_private/` is the source of truth. Depends on WI-03b1; do not start
before WI-02a/b/c are accepted.

