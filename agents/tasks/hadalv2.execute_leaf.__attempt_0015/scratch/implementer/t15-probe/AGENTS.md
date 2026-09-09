# scratch/implementer/t15-probe (WI-03c1b)

One bounded experiment for WI-03c1b. Question: what is the burst envelope of
the cornered-charge organism (T-15) — its max distance from home and
per-second travel — so the visible-motion assertion is tuned to real behavior
instead of a guessed number. Drives the real production `Simulation` (no
mocks); the run measured max 193u from home over 12s.

## files

- `probe.mjs` — spawns one T-15 at (1700,−300) and steps the simulation for
  12s of idle input, recording per-second travel and the running max distance
  from home so the burst's reach and per-second speed are observable.

Run from the repo root:
`npx vite-node agents/tasks/hadalv2.execute_leaf.__attempt_0015/scratch/implementer/t15-probe/probe.mjs`
