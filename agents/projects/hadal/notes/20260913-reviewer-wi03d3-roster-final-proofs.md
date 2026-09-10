# Note: whole-roster final proofs and the spoiler-audit shape (reviewer, WI-03d3)

## Summary

The two roster-wide FINAL PROOFS that close ST-03 live in one test file:
`src/sim/rosterFinalProof.test.ts` (6 tests, run with the normal
`npx vitest run`). It is the place to re-verify the whole roster after any
world-data or creature change.

## Facts

- **World data**: `src/world/worldData.ts` — four authored chunks
  (`shelf` b2, `twilight` b3, `abyss` b4, `hadal` b5), 42 closed slabs
  built by the local `slab()` helper, 37 `creatureSpawns` across 22
  distinct creature types. The only runtime reader of `MACRO_WORLD`/
  `creatureSpawns` is `Simulation` (spawn ids resolve through
  `CREATURE_BY_ID` and throw on unknown — `src/sim/Simulation.ts`).
- **Private roster**: `src/content/secret/hiddenCreatures.ts` (not in the
  codegraph index) — `HIDDEN_CREATURES` (22 defs, the 18-24 selection) plus
  the authoritative per-tier band maps `TIER1_BANDS`…`TIER4_BANDS`.
  Design prose band mentions in `design_private/` are narrative; the
  `TIERn_BANDS` maps are what the checks assert (e.g. T-20 is band 5
  despite prose saying "abyss wall").
- **Token manifest**: `design_private/_spoiler_tokens.txt` — 30
  name/description tokens after excluding the `T-\d\d` ids and comments;
  case-insensitive whole-word matching, "The X" prefix stripped.
- **Audit shape (the accepted scope, four prior reviews + this one)**:
  hard scope = product source (`src/**`), the git commit history, and
  implementer deliverables (`implementation/` in task folders) — must be
  empty of tokens. Meta-audit documents (review reports, scanner probes,
  spec/state files that must name tokens to prove absence) are allowed
  homes, checked fail-loud by path.
- **Known pre-existing defect (routed to fix-planning, not fixed in
  ST-03)**: spawn `t03-twilight` (T-03) at (11000, -5000) sits strictly
  inside the shelf band's `shelf-floor-east` slab (cross-chunk overlap).
  The roster-wide clearance test pins it as the single allowed exception
  and fails on any other trapped spawn.

## Gotchas

- The audit's commit filter (`/ST-03|WI-03[a-d]/`) is case-sensitive;
  reviewer-report commits use lowercase `wi-03xx` subjects. Those four
  commits are clean, but a superset (case-insensitive) scan is the safer
  ground truth — reviewer probe
  `agents/tasks/hadalv2.execute_leaf.WI-03d3.__item_WI-03d3.__attempt_0001/scratch/work-item-reviewer/final-proofs/probe-commits.mjs`
  is the reusable version (plain node, no deps).
- Raw-source parsing of `worldData.ts`: chunk definitions appear in file
  order shelf→twilight→abyss→hadal; when splitting on the chunk header,
  segment 0 is the file preamble (off-by-one trap).

## Tags

`worldData`, `MACRO_WORLD`, `creatureSpawns`, `rosterFinalProof`,
`HIDDEN_CREATURES`, `TIERn_BANDS`, `_spoiler_tokens`, `spoiler audit`,
`ST-03`
