# Tier-2 spawn-clearance probe (WI-03b2 re-land)

Bounded headless probe that checks, for every creature spawn in the
production world, whether its center is strictly inside a closed terrain
slab (a solid the terrain resolve will not push it out of). It uses the
**real** `MACRO_WORLD` data; every closed authored slab is an axis-aligned
rectangle, so strict bounding-box containment is exact.

- `probe.ts` — enumerates all `MACRO_WORLD` creature spawns against every
  closed slab. Before the fix it reported `t31-twilight` (17000,-5700)
  inside `twilight-landmark` (the reviewer's Finding 1); after relocating the
  spawn to (18200,-5300) it reports that spawn clear. It also surfaced an
  out-of-scope tier-1 cross-chunk overlap — `t03-twilight` (11000,-5000)
  inside the shelf chunk's `shelf-floor-east` slab — recorded as a finding,
  not fixed here.

Run from the repo root:

```powershell
npx tsx agents/tasks/hadalv2.execute_leaf.__attempt_0012/scratch/implementer/clearance/probe.ts
```
