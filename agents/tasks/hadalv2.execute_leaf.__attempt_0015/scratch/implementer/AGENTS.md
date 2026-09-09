# scratch/implementer

Bounded headless probes for WI-03c1b (vite-node driven, production
simulation, no mocks).

- `t15-probe/probe.mjs` — burst envelope of the cornered-charge organism
  (max 193u from home in 12s); tuned the visible-motion assertion.
- `t18-probe/probe.mjs` — T-18 drive trace: target-retargeting stalled at
  ~270u under schooling cohesion; the §64 drift holds prey at 1–76u.
- `t14-probe/probe.mjs` — T-14 snap trace (player 1600→1380, hp 100→90);
  fixed the drag assertion.

Run: `npx vite-node <probe.mjs>` from the repository root.
