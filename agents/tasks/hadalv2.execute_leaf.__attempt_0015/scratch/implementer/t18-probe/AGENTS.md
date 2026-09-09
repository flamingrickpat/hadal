# scratch/implementer/t18-probe (WI-03c1b)

One bounded experiment for WI-03c1b. Question: why do the T-03 prey not reach
the T-18 field in the scenario? Drives the real production `Simulation` over
the greybox world (no mocks). The trace showed the herder's target
retargeting stalling at ~270u under schooling cohesion, while the §64 drift
held the prey at 1–76u — the numbers the scenario assertions encode.

## files

- `probe.mjs` — spawns one T-18 herder at (1700,−300) and three T-03 prey to
  the east, steps the simulation for 40s, and prints the herder's position,
  state and target flag alongside each prey's position, state and distance to
  the herder every 5s.

Run from the repo root:
`npx vite-node agents/tasks/hadalv2.execute_leaf.__attempt_0015/scratch/implementer/t18-probe/probe.mjs`
