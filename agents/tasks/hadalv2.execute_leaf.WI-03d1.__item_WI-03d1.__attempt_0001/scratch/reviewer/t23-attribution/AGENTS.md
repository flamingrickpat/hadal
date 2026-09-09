# scratch/reviewer/t23-attribution

Reviewer probe for WI-03d1 — attributes the T-23 crossing scenario's fauna
reaction to the presence itself rather than the player's arrival.

- `probe.ts` — replays the exact scenario (seed 441) with instrumentation
  (run A), then the identical world and player path without the presence
  (run B). Run via `npx vite-node <this dir>/probe.ts` from the repo root.
  Result recorded in `../../reviews/WI-03d1-review.md` (Independent
  Adversarial Probes): run A reproduces the asserted orderings; run B shows
  no drifter reaction, so the fauna-first ordering is presence-attributed.
