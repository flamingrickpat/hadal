# scratch — work-item-reviewer / probe (WI-03b1)

Five independent adversarial probes for WI-03b1. Each drives the production
`Simulation` through the `Scenario` harness (no rule mocks, request §70) with
spawn positions/nodes/timings different from `src/sim/tier2Scenario.test.ts`,
so each could distinguish the literal request from the implementation's
interpretation. Evidence for `reviews/WI-03b1-review.md`.

Run from the repo root:

```
npx vitest run -c agents/tasks/hadalv2.execute_leaf.__attempt_0011/scratch/work_item_reviewer/probe/vitest.probe.config.ts
```

## files

- `probe.test.ts` — five checks, all passing:
  1. A1 — the T-08 trade gives a NET salvage gain (≥+1) for one carried unit;
  2. A2 — the T-11 pocket lifts a nearby player with no input (>50 u rise);
  3. B1 — the T-10 node is untouched before a full sweep and boosted after
     ("not before");
  4. C1 — every tier-2 def has no `combat` capability (the whole tier is safe);
  5. D1 — the T-27 ride carries a nearby player west but not a far one (bounded
     to the 150-u reach). Spawned below the coast wall (y<−1000) so terrain does
     not pin the player.
- `vitest.probe.config.ts` — minimal vitest config that includes only this
  directory (the project config only includes `src/**/*.test.ts`); does not
  modify the project config or any product file.
