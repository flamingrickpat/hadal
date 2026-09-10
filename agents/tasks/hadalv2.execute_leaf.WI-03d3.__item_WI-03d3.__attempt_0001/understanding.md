# Understanding

This child implements one independently reviewed work item from C:\Temp\hadal-v2\agents\tasks\hadalv2.

---
id: WI-03d3
kind: work_item
parent: WI-03d
children: []
depends_on: ["WI-03d1", "WI-03d2"]
criteria:
  AC-roster-count: "At least 15 distinct implemented creature types are active in the production world data with their spawns, meeting the private roster's distribution"
  AC-roster-tests: "Every implemented major species has a headless behavior test for its signature rule, and no creature name or secret description appears outside debug internals and the private content files"
behavior: "Place the tier-4 organisms in the production world data on the private roster's bands and run the two roster-wide FINAL PROOFS: the whole-roster world-data count check (AC-roster-count) and the roster-wide test-existence check plus spoiler audit of every ST-03 commit and artifact (AC-roster-tests)"
subsystems: ["world content data", "headless scenario tests"]
verification: "Whole-roster world data check over the production world data: 15+ distinct creature types active, tier distribution matches the private roster's 18-24 selection per the section 11.1 bands, every creature id resolves to a def, every spawn sits in the band it was designed for; roster-wide per-species signature-rule test-existence check; spoiler audit of every ST-03 commit and artifact"
---

# WI-03d3 — Tier 4: production placement + roster-wide final proofs

## Goal

Close the roster. Put the tier-4 organisms WI-03d1 defines and WI-03d2
presents into the production world data on the bands the private roster
assigns, then run the two roster-wide FINAL PROOFS that ST-03 assigned to
WI-03d: the whole-roster world-data count check (AC-roster-count) and the
roster-wide test-existence check plus spoiler audit of every ST-03 commit
and artifact (AC-roster-tests).

## Deliverables (checkable)

- Placement in `src/world/worldData.ts` (spawns and/or fixed encounter
  positions) for every tier-4 organism id WI-03d1 lands, in the bands the
  private roster assigns; ids debug-only (section 33) — they never appear in
  normal UI.
- FINAL PROOF for AC-roster-count (owned here): a whole-roster world data
  check over the production world data that
  - at least 15 distinct creature types are active with their spawns;
  - the tier distribution matches the private roster's (18-24 selected,
    section 11.1 bands);
  - every creature id resolves to a def;
  - every spawn sits in the band it was designed for.
- FINAL PROOF for AC-roster-tests (owned here): a roster-wide check that
  every implemented major species has its headless signature-rule test, plus
  a spoiler audit of every ST-03 commit and artifact: no creature name or
  secret description appears outside debug internals and the private content
  files (sections 0, 12, 68).

## Tests (node, real data)

- The world-data check runs against the production world data (no fixtures),
  over all ST-03 tiers — this is the final, whole-roster pass; the per-tier
  portions were already checked in each tier's own item.
- The test-existence check enumerates implemented major species and asserts
  a headless signature-rule scenario exists for each.
- The spoiler audit scans ST-03 commits, identifiers, tests, and artifacts
  for creature names or secret descriptions outside the allowed homes.

## Constraints, assumptions, non-goals

- Placement and proofs only: no creature behavior or renderer changes in
  this item. If a proof exposes a defect in an earlier tier, send it through
  the existing fix-planning route — do not fix it here.
- No authored spectacle beats (ST-04); no ending content, no MacGuffin
  interaction (ST-05); the definitive 60 FPS check in the largest encounter
  remains ST-07's job.
- Spoiler rules (sections 0, 12, 68): internal ids only in identifiers,
  tests, and commit messages ("landed the final roster tier in the world
  data" style).

## Fresh-session handoff

Read WI-03d/plan.md (decomposition; criteria assignment; this item is the
final proof owner for AC-roster-count and AC-roster-tests), request sections
11.1, 33, 68, 70, 74; WI-01b for the selected organism ids and the private
roster's bands; WI-03a/b/c tier items for the earlier tiers' landed ids and
their per-tier checks; `design_private/` is the source of truth. Depends on
WI-03d1 and WI-03d2 (and inherits WI-03a/b/c through the WI-03d story) —
the whole-roster proofs need the entire roster present in the production
world data first.

