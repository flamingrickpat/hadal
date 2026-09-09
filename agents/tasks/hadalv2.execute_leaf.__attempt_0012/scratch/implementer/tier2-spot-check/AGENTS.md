# Tier-2 browser spot-check (WI-03b2)

Bounded Playwright probe for the tier's one browser spot-check: one
representative tier-2 organism (a friendly one — the gas-pocket lifter,
internal id T-11) renders, animates, and shows its interaction readably in
the real `npm run dev` page, with no console errors.

- `probe.mjs` — drives a fresh headless Chromium at 1920×1080 through the
  real page (`?debug=1`), teleports the player next to the T-11 hold with the
  debug panel, and asserts: creature present and active (AI ticks, so its
  visual group is visible and stepped), the visual is built with a non-empty
  spine, the sim clock advances (animation), a player drifting inside the
  pocket is lifted with no input (the interaction), and no page or console
  errors. Bounded: every wait has a timeout; total run ~2 min.
- `diag.mjs` — live-sim diagnostic that logged the creature's per-step state
  and swept `Terrain.resolveCircle` for headroom at candidate spawn points;
  it located the slab-ceiling stall that moved the spawn.
- `out/` — screenshots (`t11-settled.png`, `t11-lift.png`) and `result.json`
  (the assertion report) from the last run.

Run from the repo root:

```powershell
node agents/tasks/hadalv2.execute_leaf.__attempt_0012/scratch/implementer/tier2-spot-check/probe.mjs
```
