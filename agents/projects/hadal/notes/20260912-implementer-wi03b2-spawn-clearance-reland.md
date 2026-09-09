---
tags: [world-data, spawns, terrain, gotcha, cross-chunk]
symbols: [MACRO_WORLD, WorldChunkDef, slab, Terrain.resolveCircle, buildTerrain, TIER2_BANDS]
---

# World spawn clearance: exact "inside a solid" check + cross-chunk slab overlap

## Fact 1 — how to test "is a spawn inside a solid" (not resolveCircle)

`Terrain.resolveCircle` (src/world/terrain.ts) pushes a circle out **only when
it is within its radius of a segment**. A body deep inside a closed slab
returns the same point (moved=false), so `resolveCircle` **cannot**
distinguish "open water" from "trapped inside a slab." A clearance test must
do a direct geometric containment check.

Every closed authored slab (see `slab(id, x, y, w, h)` in
src/world/worldData.ts) is an **axis-aligned rectangle**, so strict
bounding-box containment is exact: a spawn is trapped iff
`x0 < px < x1 && y0 < py < y1` (strict, so a point on an edge resolves back
to open water and is not trapped). This is what the tier-2 regression test in
`src/sim/tier2Scenario.test.ts` (`no tier-2 spawn sits inside a closed
terrain slab`) uses.

## Fact 2 — world chunks spatially overlap across band boundaries

Chunk terrain is authored per-chunk but the rectangles can overlap
neighbouring bands' play space. Concrete: the shelf chunk's
`shelf-floor-east` slab (x 10000–14000, y -5200 to -4900) sits at the very top
of the twilight band (twilight bounds y -8000 to -4800). A twilight spawn in
that band is actually inside the shelf slab — e.g. `t03-twilight` (T-03) at
(11000, -5000) is strictly inside `shelf-floor-east` and is a trapped
tier-1 instance. This was found during the WI-03b2 re-land; it is out of that
item's tier-2 scope (routed to the fix-planning path, not fixed there).

Consequence: a "spawn in open water" check must test against **all** closed
slabs in the world, not just the spawn's own chunk.

## Symptom (a trapped spawn)

The creature drifts/steers toward the nearest interior wall and box-walks it
with zero effective escape (see the companion note on the T-11 rise stall).
A trapped spawn is also never encountered by the player and never contributes
to the band's §49 dense traversal.
