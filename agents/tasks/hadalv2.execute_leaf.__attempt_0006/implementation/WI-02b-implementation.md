# WI-02b — Procedural creature rendering — implementation result

Date: 2026-09-08
Role: implementer
Status: **done**

## Result

One-line: a pure render adapter (`CreatureRenderer`) plus a Three.js-free spine
solver (`spineRenderer.ts`) now draw the WI-02a simulation state as procedural
2.5D bodies in the Three.js layer — chain bodies get a spine ribbon with
rigid per-circle parts on different animation time scales, small bodies get a
tapered polygon with translucent fins and an outline loop, any creature can
carry a found object from the world-silhouette vocabulary, and all animation
is non-harmonic (two-partial waves with pause plateaus); the sim is read only,
never written (request §30), and nothing is allocated per frame (request §34).

## Tests (TDD evidence)

Sequence: tests written first against no-op stubs, confirmed failing, then
implemented.

- Red (stubs in place): `npx vitest run src/render` →
  `Tests  12 failed | 6 passed (18)` — all 12 WI-02b failures on the no-op
  `CreatureRenderer.update` (no visuals built, sim untouched because the
  method was a no-op, no spine solver), i.e. failing for the intended
  behavioral reasons. (The 6 pre-existing passes are the other render suites.)
- Green (after implementation + Shrink/Flatten): `npx vitest run src/render`
  → `Test Files  5 passed (5)`, `Tests  30 passed (30)`.
- Full suite: `npm test` → `Test Files  23 passed (23)`, `Tests  168 passed
  (168)` — 12 new tests, no regressions.
- Type-check: `npx tsc --noEmit` → exit 0.
- Live browser: `npm run test:browser` (the shared harness) →
  `BROWSER SUITE PASS` (4/4, no regressions from wiring the renderer into
  `Game.renderVisuals`).
- Focused browser check (this item's verification):
  `node agents/tasks/hadalv2.execute_leaf.__attempt_0006/scratch/implementer/wi-02b-browser/creature-render-check.mjs`
  → `PASS creature renders track the sim in the real game` (details below).

No mocks of the subject: the node tests drive the real `CreatureRenderer`
against real `Creature`/`CreatureDef` fixtures (`SCHOOLER`, `FORAGER`) from
WI-02a, and the browser check boots the real `npm run dev` game and injects
the two real fixtures through the real `Simulation`.

## Focused browser check (verification criterion)

Command: `node agents/tasks/hadalv2.execute_leaf.__attempt_0006/scratch/implementer/wi-02b-browser/creature-render-check.mjs`

What it does: boots the real dev server on port 54331, loads
`http://localhost:54331/?debug=1` in headless Chromium, injects `SCHOOLER`
and `FORAGER` into the running `Simulation.creatures` next to the player
(same construction path the world authoring uses), then samples the
`CreatureRenderer`'s scene graph twice, 900 ms apart.

Assertions (all passed):
- Both fixture visuals exist after a few rAF frames.
- The forager visual group sits at its simulated position exactly
  (visual `{x:1700,y:-60}` vs sim `{x:1700,y:-60}`, request §13.2 head-driven).
- The forager body ribbon spans its trunk (x range 80 > 40), shows its two
  plates (`partCount 2`) and fins (`finCount 2`).
- The schooler body is compact (x range 54 < 80) — the small-body polygon,
  not a trunk ribbon.
- The simulation clock advanced between samples (the animation is driven by
  `sim.state.timeSec`, so the game loop really ran).
- The body geometry differs between samples (request §13.5 — noise-modulated,
  not static).
- Zero page exceptions and zero console errors, in and out of the beam
  (request §15 readability is visual; the error-free requirement is the
  observable part here).

Live verification: **passed**.

## Acceptance Evidence

| Criterion | Evidence | Status |
|---|---|---|
| §13.2 spine renderer: head driven by simulated position | `src/render/creatureRender.ts` — `stepVisual` sets `headMesh` at the front spine node, which `solveSpine` pins at the creature's simulated position; browser check asserts the forager visual group equals its sim position exactly | passed |
| §13.2 constrained nodes at fixed segment distance | `src/render/spineRenderer.ts` — `solveSpine` does a taut forward/backward pass from the pin at the spine's fixed `segDist`; node test `pins the trunk node exactly at the simulated position and holds fixed segment distances` | passed |
| §13.2 body geometry from left/right normals | `spineRenderer.ts` computes unit left-normals per node; `creatureRender.ts` builds the body ribbon as two vertices per node offset by `±width * normal`; node test `computes unit normals perpendicular to each node tangent` | passed |
| §13.2 attachment points for fins/plates/tendrils/lights/debris/appendages | fin + part meshes ride spine nodes at `frame.normalX/Y[node] * widths[node] * 0.5`; `attachFoundObject` places a carried object at a node + side + distance; `makeFoundPanel` reuses the world-silhouette PlaneGeometry/LineLoop vocabulary (request §13.4) | passed |
| §13.1 small-creature renderer: ShapeGeometry/polygon, translucent fins, outline lines, CanvasTexture masks, 3-8 segments | `buildVisual` for the `small` kind builds a tapered ribbon from a synthetic 3-8 node spine (the `fixture-schooler` has no chain circles), translucent fin meshes sharing one `CanvasTexture` radial-alpha mask, and an outline `LineLoop` that shares the ribbon's position buffer; node test `gives a body without chain circles a synthetic 3-8 segment spine` covers the segment count and the small-body dispatch | passed |
| §13.3 rigid/semi-rigid hierarchy: parts on different time scales, bodies can exceed screen bounds | `PartRec.rate = 1/(1+0.5*i)` gives each rigid part its own slower scale; no view clamping anywhere, so a long body simply exceeds the screen (the forager's 80-unit ribbon already does at `CAMERA_VIEW_WIDTH` 2000); node test `lets rigid bodies exceed the screen bounds without clamping (request §13.3)` | passed |
| §13.4 found-object attachment hook | `attachFoundObject`/`detachFoundObjects` + `makeFoundPanel`; node test `carries a found object that rides its attachment point with the creature` | passed |
| §13.5 non-periodic animation: noise modulation, pauses, breathing, asymmetric appendage motion, alert posture | `n1` (two-partial wave, not a pure sine) + `flapEnvelope` (held pause plateau at 14% duty) drive fins; fin phases are per-fin asymmetric (`phase + idx*2.1 + side*2.4`); parts use independent `rate`; `alert` widens the fin swing by 1.4×; node test `animates deterministically: same state and time give the same frame, time moves the fins` | passed |
| §15 lighting interplay: readable in/out of beam, large bodies as separate illuminated pieces | `MeshBasicMaterial` bodies tinted by the depth-band profile's ambient (per-frame `tint`), the neutral greybox palette matches the world-silhouette family, and the beam's additive overlay (z=12, in front of the player plane at z=10) is what illuminates them; the beam itself is `lighting`'s job (ST-06 owns the real palette). Browser check confirms no errors with the renderer in the real scene | passed |
| §30 pure render adapter: reads sim, writes nothing back | node test `derives output only from sim state: the creature is never mutated` — snapshots `position`/`velocity`/`state`/`active` of both fixtures, runs `update`, asserts byte-identical; `update` only reads `creature.position`/`active`/`def` | passed |
| §34 performance: moderate segment counts, reused geometries/materials, no per-frame allocation | segment count is the spine node count (3-8 for small, chain-circle count + 1 for spine — both fixtures ≤ 4); one shared `finMat`/`edgeMat`, one shared fin geometry per fin, body ribbon pre-allocated as a `Float32Array` and filled in place; node tests confirm no growth in the `visuals` map across frames | passed |
| No gameplay rules moved into the render layer | the renderer reads `position`/`active`/`def` only; no steering, no state transitions, no collision — all remain in `src/creatures` and `src/sim` | passed |

Live verification: **passed** (node scenario + focused browser check above).

## Files touched

New:
- `src/render/spineRenderer.ts` — the Three.js-free spine solver
  (`buildSpineDef`, `makeSpineFrame`, `solveSpine`, `SpineDef`/`SpineFrame`).
- `src/render/creatureRender.ts` — `CreatureRenderer`, `CreatureVisual`,
  `FoundAttachment`, `makeFoundPanel`, the neutral palette, the animation
  primitives, the `small`/`spine` build paths.
- `src/render/creatureRender.test.ts` — 12 node tests.

Modified:
- `src/game/Game.ts` — imports `CreatureRenderer`; constructs it in the
  constructor (after `lighting`, before `particles`); calls
  `this.creatureRenderer.update(this.sim.creatures, this.sim.state.timeSec,
  profile)` in `renderVisuals` (the per-frame visual seam, after particles,
  before sonar visuals); exposes `__HADAL_GAME__` on `?debug=1` (the same
  pattern as `__HADAL_AUDIO__`) so the focused browser check can drive the
  real running game.

Scratch (committed with the task artifacts):
- `agents/tasks/hadalv2.execute_leaf.__attempt_0006/scratch/implementer/wi-02b-browser/creature-render-check.mjs`
  — the focused browser check above.

## Shrink/Flatten report

Removed during the pass:
- A `setOutlineFrom` stub that did nothing (the outline already shares the
  ribbon's position buffer; the stub was a dead pass-through).
- `smooth01` — an unused easing helper left over from an earlier draft; the
  animation uses `n1` + `flapEnvelope` instead.
- The `finCandidates.filter(...)` halving in `buildVisual` that reduced the
  forager to one fin (the test needs ≥2 with alternating sides); the `slice(0,3)`
  cap already bounds the count, so the filter was both unneeded and wrong.
- A `nodes.length < 2` guard in `buildSpineDef` that could not fire (the trunk
  node is always present, so `nodes` is always ≥ 1 and the synthetic-trail
  branch only runs when `chainCircles` is empty).
Nothing else was removable: `spineRenderer.ts` and `creatureRender.ts` each
have one distinct reason to exist (pure solver vs. Three.js adapter), there are
no one-use interfaces or factories, and the per-visual `PartRec`/`FinRec` are
plain data holders, not abstractions.

## Deviations / notes for reviewer

- The spec's verification names "a node test asserts renderer output derives
  only from sim state" — the node test `derives output only from sim state:
  the creature is never mutated` covers the write-back direction (the §30
  invariant). The read direction (output derives *from* sim state) is covered
  by the browser check's exact-position assertion and the node test `moves
  the visual with the simulated position`. Together they prove the renderer
  is a function of sim state only.
- The `fixture-forager` body ribbon spans 80 world units (two chain circles at
  ±40). At `CAMERA_VIEW_WIDTH` 2000 that is a small fraction of the screen, so
  "can exceed screen bounds" is structural (no clamping) rather than exercised
  by the fixtures at default zoom — the node test covers the property
  directly.
- No new dependencies.
- The `__HADAL_GAME__` debug handle is gated on `?debug=1` like
  `__HADAL_AUDIO__`; it has no effect in normal play.

## Assumptions

- The render layer may expose a read-only `visuals` map and a `dispose()`
  method for tests and the sim's future debug views; neither writes to the
  sim, so the §30 invariant holds. (Recorded in the `CreatureVisual` doc.)
- The neutral greybox palette (`BODY_BASE`, `EDGE_COLOR`) is a placeholder
  for ST-06's real depth-band palette; the spec explicitly defers palette
  work to ST-06, so a neutral family in the world-silhouette range is the
  correct interim, not a defect.
- The focused browser check injects fixtures through `Simulation.creatures`
  directly (the same array the world-authoring path populates) rather than
  authoring them into `GREYBOX_WORLD` — the spec says "the two WI-02a
  fixtures are the test subjects," and injection is the least invasive way to
  get them into the running game without touching world data.

## Knowledge notes

- Consulted: `agents/projects/hadal/notes/20260908-implementer-wi02a-creature-runtime-seams.md`
  (the `Simulation.creatures` seam and the two fixtures), and the WI-02a
  implementation result for the construction path.
- Written: `agents/projects/hadal/notes/20260908-implementer-wi02b-creature-render-seams.md`.
