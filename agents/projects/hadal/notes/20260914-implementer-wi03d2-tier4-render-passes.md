# WI-03d2 — tier-4 section 52 render passes (implementer)

tags: [render, tier4, section52, spine, foreground, browser-probe]
symbols: [ForegroundPass, RenderView, isCrossingPresence, CROSSING_PRESENCE_Z,
FOREGROUND_OCCLUDER_Z, FOREGROUND_OCCLUDER_DEPTH, CreatureRenderer.update]

## Summary

The section 52 large-creature presentation lives entirely inside the WI-02b
renderer pipeline — no new renderer architecture:

- `src/render/creatureRender.ts` — `CreatureRenderer.update(creatures, time,
  profile, view?: RenderView)`. The `RenderView` (`{center, half}` in world
  units) is the one new input; it only culls and parallaxes, never moves the
  simulated creature. `isCrossingPresence(def)` = non-targetable and
  `bodyExtent(def) >= 2 * CAMERA_VIEW_WIDTH` (only the T-23 class qualifies:
  its span ≈ 6440 vs the 4000 threshold; the other tier-4 spans are 820–2260).
  Crossing presences render on `CROSSING_PRESENCE_Z = -20` (behind the terrain
  at z 0, in front of far parallax) at parallax 0.35; partial anatomy collapses
  ribbon edge vertices of nodes beyond view + `PARTIAL_ANATOMY_MARGIN` (150)
  to the node center and hides their head/parts/fins.
- `src/render/foreground.ts` — `ForegroundPass`: 10 pooled slabs at
  `FOREGROUND_OCCLUDER_Z = 14` (in front of player z 10 and beam z 12). Each
  slab's fixed deep-water reference is placed at `q*1.4 + center*(1-1.4)`,
  i.e. its screen offset moves at 1.4× the camera — one reference is staged
  on the hadal crossing lane (≈17000, −9300).

## Browser spot-check injection pattern (placement lands in WI-03d3)

The production `MACRO_WORLD` carries no tier-4 `creatureSpawns` (placement is
WI-03d3), so the spot-check probe (`scratch/implementer/tier4-spot-check/`)
injects organisms into the live production simulation from the page:
`await import('/src/creatures/Creature.ts')` etc. — Vite serves the same module
URLs the app imports, so the real classes/defs are used — then
`g.sim.creatures.push(new Creature(def, pos, g.sim.signals, rng))` and
`g.sim.teleportTo(x, depth)` (depth positive, y = −depth). Creatures
self-activate within `CREATURE_AI_RANGE = 3000` (distance to focus, decided in
the creature's own controller). `g.sim.hasCleanFullBody(c)` is the sim's
visibility state for the no-full-view encounter.

Gotchas: Playwright `page.evaluate` takes ONE argument (bundle objects);
`window.__HADAL_GAME__` exists only under `?debug`; creature visuals build
lazily on the next rAF frame, so wait ≥1 frame before asserting; the sonar
registry (`g.sim.sonar.targets`) is built at Simulation construction —
injected creatures are not in it, so assert `bodyExtent/SONAR_MASSIVE_REF` on
the real def instead. The §34 scene-growth baseline must be taken after the
new visuals have built (one-time per-creature allocation, not per-frame).
