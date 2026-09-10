# scratch/implementer/tier4-spot-check (WI-03d2)

Bounded presentation-only browser probe for WI-03d2 (request §70 focused
browser layer). Question: does one large organism (internal id T-19) and one
colossal presence (internal id T-23) render on the WI-02b spine pipeline
through the section 52 passes (background crossing layer, partial anatomy,
foreground occluder, no center framing, sonar-scale readout), and does the
largest tier-4 scene stay smooth in a focused inspection (request §34)?

The tier-4 production world placement is WI-03d3's job, so the probe injects
the organisms through the real `Creature` class and real content defs
(dynamic import from the dev server's module graph) into the live production
simulation via the §33 debug seam. Everything observed — sim stepping,
renderer, foreground pass, page — is production; only the spawn placement is
a stand-in. No mocks, no browser-reachability proof (request §70 layers).

## files

- `probe.mjs` — starts the real dev server (port 54322), drives headless
  Chromium (SwiftShader, 1920×1080, `?debug=1`), teleports the player into
  the abyss/hadal open water, injects T-19 then T-23, asserts spine visuals /
  moderate segment counts / playable-plane vs background-crossing layer /
  never-clean-full-body / partial realization / foreground pass live / sonar
  scale, then injects the remaining three tier-4 species and measures 150
  rAF frames of the largest tier-4 scene (steady-state scene growth + median
  frame time, no degradation). Writes `out/result.json` and screenshots.
- `debug.mjs` — minimal loop-alive diagnostic (page errors + sim clock
  advance); used once during probe development to rule out a dead game loop.

Run from the repo root:
`node agents/tasks/hadalv2.execute_leaf.WI-03d2.__item_WI-03d2.__attempt_0001/scratch/implementer/tier4-spot-check/probe.mjs`
