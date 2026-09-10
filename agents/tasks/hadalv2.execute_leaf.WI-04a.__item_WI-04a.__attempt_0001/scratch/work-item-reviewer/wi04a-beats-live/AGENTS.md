# wi04a-beats-live — reviewer browser probe

Answers the browser half of the WI-04a verification that the implementer
did not run: do the five authored spectacle beats fire, in the authored
sequence, through the real trigger system inside the LIVE game page
(production simulation + real render loop), with each beat's authored
presentation state (camera modifier / audio cue / environmental-reaction
ambient params) present in the live sim, the authored organism
repositioned, player control preserved, and no console errors?

The physical no-noclip route is proven headlessly
(`src/sim/beatScenario.test.ts`); the probe positions the player with the
request §33 debug teleport (a development measurement channel) and reads
live sim state via `window.__HADAL_GAME__.sim` (exposed under `?debug=1`).
Only internal slot ids (s1..s5) and roster ids (T-NN) — no private names.

Files:

- `probe.mjs` — the probe. Spawns `npm run dev -- --port 5223 --strictPort`,
  boots a fresh browser profile at 1920×1080 (SwiftShader), steps the beats
  s1..s5 in timeline order, and writes `output/result.json` (checks, trace,
  first-fire sim times, both storyFlags arrays), `output/console.json`,
  `output/server.log`, and per-beat screenshots. Watchdog 240 s.
- `package.json` / `package-lock.json` — `playwright-core` only.
- `output/` — last run's artifacts.

Run from this directory:

```powershell
npm install
node probe.mjs
```

Result of the run recorded in `../../reviews/WI-04a-review.md`: 31/36 green;
the 5 red checks are the finding on the orphaned `storyFlags` array (see
`output/result.json` → `flagEvidence`).
