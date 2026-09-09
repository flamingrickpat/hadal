# scratch/implementer/tier3-spot-check (WI-03c2)

One bounded presentation-only browser probe for WI-03c2. Question: does one
representative tier-3 predator (the burst interceptor, internal id T-15)
render on the WI-02b spine pipeline in the real `npm run dev` page,
telegraph/commit visibly (the commit state widens the body and spreads the
fins, request §48/§13.5), and run without console errors. Drives the real
production `Simulation` through `window.__HADAL_GAME__` under `?debug=1` (no
mocks, no browser-reachability proof — request §70 layers).

## files

- `probe.mjs` — starts a real dev server (Playwright Chromium, SwiftShader
  software GL, 1920×1080, fresh profile), teleports the player next to the
  band-3 T-15 via the §33 debug panel, asserts the creature is active/visible
  on the spine pipeline with the tier-3 silhouette, then drives the real
  renderer directly (rest vs commit state at a fixed time) and asserts the
  commit widens the body and spreads the fins. Writes `out/result.json` and
  `out/t15-rest.png` / `out/t15-commit.png`.

Run from the repo root:
`node agents/tasks/hadalv2.execute_leaf.__attempt_0016/scratch/implementer/tier3-spot-check/probe.mjs`
