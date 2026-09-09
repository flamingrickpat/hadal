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

### Re-review probe (attempt 3)

- `probe-try3.ts` — re-review of the fix (`d93c720`). Independently confirms the
  relocated `t31-twilight` spawn `(18200,-5300)` is strictly outside all closed
  slabs (47) and `resolveCircle` does not move it; feeds the *old* position
  `(17000,-5700)` through the same containment logic to prove the added regression
  test is not vacuous; and live-simulates the twilight T-31 to show it drifts west
  monotonically (18200→17240 over 120 s) with no box-walk. Feeds the re-review
  section of `reviews/WI-03b2-review.md`.

```powershell
npx tsx agents/tasks/hadalv2.execute_leaf.__attempt_0012/scratch/work-item-reviewer/clearance/probe-try3.ts
```
