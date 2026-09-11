# Critical Path Debug Probe

**Question:** Why does `simulateCriticalPath` fail on the production world?

This probe traces the simulation to identify where the critical path breaks — which chunks are unreachable, what materials are available, and what capabilities are needed.

## Artifacts

- `probe.ts` — Debug script that runs the simulation, logs reachable chunks, material availability, and craftable upgrades at each iteration.
