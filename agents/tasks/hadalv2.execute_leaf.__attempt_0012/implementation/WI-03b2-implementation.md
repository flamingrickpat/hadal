# WI-03b2 — Implementation Result

Result: **done** — the tier-2 useful/neutral fauna tier is active in the
production world (`src/world/worldData.ts`), its small/medium body shapes are
landed as data-driven parameters on the existing WI-02b spine renderer
pipeline, and the tier's one browser spot-check (a friendly tier-2 organism)
passed end to end.

Internal ids only, per request §0/§12/§68.

## Codegraph usage (structural gate)

First structural lookup: `codegraph_explore "worlddata creature spawn band
tier creature def renderer pipeline"` — located the `worldData.ts` chunk/
spawn layout, the `hiddenCreatures.ts` tier-2 defs landed by WI-03b1, and the
`CreatureRenderer` dispatch seam. Second: `codegraph_explore "simulation
collide creatures terrain resolve stepcreatures ai range deactivation cap"`
— located `Simulation.stepCreatures` (root + chain-circle terrain resolve),
the §34 AI-range deactivation, and the signature-interaction pass added by
WI-03b1. All later reads targeted files the index had already identified.

## What changed

### Production spawns — `src/world/worldData.ts`

Spawns for every tier-2 organism id WI-03b1 landed, each in the band the
private roster designed it for (tier-2 portion of the roster-wide
AC-roster-count check that WI-03d finalizes):

- band 1 (coast): the depth-tiered drifter at its shallow stage.
- band 2 (shelf): the node sweeper (×2) and the drifter at its shelf stage.
- band 3 (twilight): the feeding trader, the herder (×2), the node sweeper
  (×2), the gas-pocket lifter, the chain sweeper, and the drifter at its
  mid stage.
- band 4 (abyss): the feeding trader, the herder, and the drifter at its
  deep stage.
- band 5 (hadal): the drifter at its deepest stage.

Ids are debug-only (§33): they appear only in identifiers and in the debug
world overlay — never in normal UI. Counts keep every per-chunk per-type
ambient total under the §34 cap. Placement follows §49 dense traversal: each
tier-2 id appears in every band it was designed for, and no designed band is
left without its tier-2 fauna.

### Data-driven body shapes — `src/content/secret/hiddenCreatures.ts`

The five small/medium tier-2 body shapes were added as
`body.chainCircles` parameters on the defs — no renderer code was touched;
`CreatureRenderer` already dispatches to the WI-02b spine pipeline for any
def with chain circles. Each silhouette is recognizable in two seconds
(§13): a broad flat body with two manipulator arms reads as a tool; a broad
leading plate with a trailing frill reads as a set-dresser; a small round
body with wide brush arms reads as a mop; a pale round membrane over a
settlement ring reads as a balloon/bubble; five even segments at a steady
radius read as a laid cable. The roster assigns no wreck-incorporating
organism to this tier, so §13.4 found-object attachment is out of scope here
(recorded as an assumption below).

### Tests — `src/sim/tier2Scenario.test.ts`

New `tier-2 production world data (WI-03b2)` block:

1. Every production spawn in `MACRO_WORLD` resolves to a def via
   `CREATURE_BY_ID`; every tier-2 spawn sits inside the chunk of the band the
   private roster designed it for; every tier-2 id appears in **every** band
   it was designed for (AC-roster-count tier-2 portion).
2. Per-chunk per-type ambient counts stay under the §34 cap for all tier-1 +
   tier-2 roster ids.
3. Every hidden-roster type (the 12 implemented species) has at least one
   spawn in the production data (AC-roster-count floor).

The tier's spoiler-containment sweep was extended to also cover
`src/world` (the production spawn data this tier lands in) and this work
item's own implementation artifact directory (AC-roster-tests tier half).

## Shrink / Flatten

- No new abstraction, class, or file was introduced: spawns are data entries
  in the existing `creatureSpawns` arrays, shapes are data on existing defs,
  and the tests extend an existing describe block in an existing file.
- One comment per spawn group (band + which ids are debug-only); no
  comments narrating the code were added.
- Nothing removable remained after the pass — the diff is data and one test
  block, both load-bearing for the criteria.

## Evidence

| Criterion | Evidence | Status |
|---|---|---|
| AC-roster-count (tier-2 portion) | `npx vitest run src/sim/tier2scenario.test.ts` — 3 new production-data tests pass; full suite 205/205 | passed |
| AC-roster-tests (tier half) | same file: spoiler sweep now covers `src/world` + this artifact dir; full suite 205/205 | passed |
| Spawns at band density, §34 caps | tests 1–2 above (band containment + cap check over MACRO_WORLD) | passed |
| Data-driven shapes on existing pipeline | no change under `src/render/`; shapes are `chainCircles` on defs; browser probe confirms `kind=spine nodes=4` on the live renderer | passed |
| Browser spot-check (friendly tier-2) | probe run below — all 9 checks passed | passed |
| Live verification | browser probe against the real built product | passed |

## Browser spot-check (request §70 focused layer)

Command: `node agents/tasks/hadalv2.execute_leaf.__attempt_0012/scratch/implementer/tier2-spot-check/probe.mjs`
(starts the real vite dev server, drives the real page with `?debug=1`, kills
its own server by PID).

Representative friendly tier-2 organism: the gas-pocket lifter (the tier's
passive-lift species). All checks passed:

1. exists in the running production simulation — at (14500, -5900)
2. reactivates near the player (§34 AI range) — state=forage
3. rises to its hold and hangs (signature rule) — at hold y-band
4. visual built on the spine pipeline with a real body — kind=spine nodes=4
5. sim clock advances (animation is driven)
6. alive at its hold (moving, not frozen) — 26.2 u moved in 2.5 s
7. player drifting inside the pocket is lifted with no input (interaction
   readable) — rose 99 u in 6 s
8. no page exceptions
9. no console errors

Screenshots: `scratch/implementer/tier2-spot-check/out/t11-settled.png`
(organism hanging at its hold, interaction prompt visible) and
`t11-lift.png` (player inside the pocket mid-lift).

No browser-reachability proof per §70 layers (presentation-only layer).

## Deviations

- **Spawn relocation after the spot-check (defect found in my own data, fixed
  in this item, not a sim-rule change).** The gas-pocket lifter was first
  placed under the shelf-floor-east slab: its rise (hold = spawn + 300 u)
  met a solid ceiling 166 u up, and the creature box-walked into it and froze
  below its hold. A clearance sweep through the live `Terrain.resolveCircle`
  picked (14500, -5900) — 420 u of clear headroom, open twilight water, still
  inside the designed band. This is world-data placement, not a simulation
  rule change, so it stays inside this item's seams.

## Assumptions

- The private roster assigns no wreck-incorporating organism to tier 2, so
  the §13.4 found-object-attachment bar is not exercised by this item.
  Wrong if `design_private/` says otherwise — the renderer pipeline already
  supports the attachment as chain circles, so only the def data would move.
- "Preferably a friendly one" for the spot-check → the passive-lift species,
  the tier's clearest friendly interaction with no combat or threat surface.
- §34 cap asserted as 16 per chunk per type, the ambient count cap the
  existing cap-check helpers use.

## Files touched

- `src/world/worldData.ts` — tier-2 spawns in the five production chunks
- `src/content/secret/hiddenCreatures.ts` — small/medium `chainCircles` body
  shapes on the tier-2 defs (already landed by WI-03b1's commit lineage;
  shape parameters finalized in this item)
- `src/sim/tier2scenario.test.ts` — production world-data tests + extended
  spoiler sweep
- `agents/tasks/hadalv2.execute_leaf.__attempt_0012/implementation/` (this
  artifact + index), scratch probe artifacts under
  `agents/tasks/hadalv2.execute_leaf.__attempt_0012/scratch/implementer/`

## Knowledge notes

Consulted: `20260907-implementer-wi01b-creature-roster.md` (roster/bands),
`20260908-implementer-wi02b-creature-render-seams.md` (spine renderer
dispatch), `20260909-implementer-wi03b1-tier2-interaction-seams.md` (signature
interaction seams). Wrote: a note on the spawn-clearance gotcha (a rising
hold-point creature must be placed with the hold offset of vertical headroom
above its spawn — slabs cap the twilight band and a spawn directly under one
freezes the rise).
