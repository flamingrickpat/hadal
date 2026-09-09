# scratch/reviewer/adversarial

Independent adversarial probe for WI-03c1b — three vitest probes at seeds and
positions different from the implementer's scenarios, driving the production
`Simulation` over `GREYBOX_WORLD` (no rule mocks) to independently confirm the
load-bearing claims:

- `reviewer.test.ts` —
  1. T-14 re-arms across three repeated loud encounters, snaps recoverably
     (player health stays > 0), and its state path never enters `attack`/`stalk`;
  2. T-15 never charges a silent 40u corner (15s, health 100) but does charge
     once on a loud corner at the same proximity;
  3. T-18 drives T-03 schooling prey into its 150u field, never attacks the
     player (health 100), stays `wander`-only, and yields +1 salvage on harvest.
- `vitest.config.ts` — minimal vitest config that runs only this probe file
  (the project config only includes `src/**/*.test.ts`); touches no project or
  product file.

Run from the repo root:
`npx vitest run --config agents/tasks/hadalv2.execute_leaf.__attempt_0015/scratch/reviewer/adversarial/vitest.config.ts`

All three pass against commit `0ed789a`.
