# Tier-2 spawn-clearance probe (WI-03b2 review)

Bounded headless probe that checks whether every tier-2 spawn sits in open
water or is trapped inside a solid the terrain resolve will not push it out of.
It uses the **real** `buildTerrain`, `MACRO_WORLD`, and `Simulation` (no mocks).

- `probe.ts` — reports (a) whether the `t31-twilight` spawn (17000,-5700) is
  inside the `twilight-landmark` slab and whether `resolveCircle(spawn, r=12)`
  pushes it out; (b) a live-sim step of the T-31 twilight instance to show it
  drifts west and box-walks at the interior left wall, never escaping. This
  produced Finding 1 in `reviews/WI-03b2-review.md`.

Run from the repo root:

```powershell
npx tsx agents/tasks/hadalv2.execute_leaf.__attempt_0012/scratch/work-item-reviewer/clearance/probe.ts
```
