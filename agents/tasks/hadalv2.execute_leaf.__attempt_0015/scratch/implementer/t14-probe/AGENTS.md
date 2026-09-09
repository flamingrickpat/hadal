# scratch/implementer/t14-probe (WI-03c1b)

One bounded experiment for WI-03c1b. Question: after the T-14 net snap, where
does the player end up — in the test the drag delta measured exactly 0 even
though drag and damage were both applying. Drives the real production
`Simulation` via the `Scenario` harness (no mocks); the trace pinned the
position and HP values the drag assertion should expect (1600→1380,
hp 100→90).

## files

- `probe.mjs` — spawns one T-14 at (1700,−300), approaches it to the snap
  radius, then teleports the player to (1600,300) and traces position,
  velocity and HP through a sonar step and 120 steps of free drift — the
  player's x moves 1600→1380 as the net drag applies. Also prints the terrain
  near x=1380 so the snap's landing point is visible against the coastline.

Run from the repo root:
`npx vite-node agents/tasks/hadalv2.execute_leaf.__attempt_0015/scratch/implementer/t14-probe/probe.mjs`
