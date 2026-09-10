# wi04a-beats-live-fix — implementer browser probe (post-fix)

Re-runs the WI-04a browser check — the final proof owner of AC-enc-beats —
after the live load-path story-flag fix (implement attempt 2). Question
answered: with the fix in, do the five authored spectacle beats fire, in the
authored sequence, through the real trigger system inside the LIVE game page
(production simulation + real render loop), with each beat's presentation
state (camera modifier / audio cue / ambient reaction) present, each
completion flag present in `sim.storyFlags` AND persisted by
`sim.toSave().world.storyFlags` (the part the review found broken), player
control preserved, and no console errors?

The physical no-noclip route is proven headlessly
(`src/sim/beatScenario.test.ts` + `src/sim/storyFlagLoadPath.test.ts`); the
probe positions the player with the request §33 debug teleport (a
development measurement channel) and reads live sim state via
`window.__HADAL_GAME__.sim` (exposed under `?debug=1`). Only internal slot
ids (s1..s5) and roster ids (T-NN) — no private names.

Files:

- `probe.mjs` — the probe. Spawns `npm run dev -- --port 5224 --strictPort`
  (repo root), boots a fresh browser context at 1920×1080 (SwiftShader GL,
  fresh save), steps the beats s1..s5 in timeline order, asserts the flag
  persistence checks, and writes `output/result.json` (checks, trace,
  first-fire sim times, saved flags), `output/console.json`,
  `output/server.log`, and per-beat screenshots. Watchdog 300 s.
- `package.json` / `package-lock.json` — `playwright-core` only.
- `output/` — last run's artifacts.

Run from the repo root:

```powershell
cd agents/tasks/hadalv2.execute_leaf.WI-04a.__item_WI-04a.__attempt_0001/scratch/item-implementer/wi04a-beats-live-fix
npm install
node probe.mjs
```

Result of the run recorded in
`../../implementation/WI-04a-implementation.md` (Revision 2026-09-10):
33/33 green, including all five `sim.storyFlags` checks and the
`toSave()` persistence check that were red in the reviewer's pre-fix probe.
