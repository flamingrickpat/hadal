# WI-03d2 implementation — Tier 4: section 52 rendering passes + browser spot-checks

Status: **done** (all acceptance evidence below is real command output from this
session; no substitute success was counted).

## What was built

Extended the existing WI-02b spine renderer pipeline in place — no new renderer
architecture, no simulation rule changes. The renderer reads simulation state
only (request §13/§30); the camera's current view is passed in as a read-only
`RenderView` and only culls/parallaxes the drawing.

1. **Very-long bodies (§34)**: the spine already used moderate segment counts;
   the large-creature hot paths (body ribbon, parts, fins, foreground pass)
   pre-allocate all buffers/geometries at visual build and touch transforms
   only per frame. Proven in the §34 performance guard (node + browser).
2. **Technique A — partial anatomy** (`src/render/creatureRender.ts`): when a
   `RenderView` is supplied, a spine node beyond view+margin (150 units, covers
   the 0.15 s camera-lag pan) is not realized — its ribbon edge vertices
   collapse to the node center (zero area), and the head/parts/fins/found
   objects of unrealized nodes are hidden. A crossing flank is only ever
   partially there.
3. **Technique B — parallax crossing** (`creatureRender.ts`): `isCrossingPresence`
   (non-targetable and body span ≥ 2× the 2000-unit view width — the T-23
   class only) is drawn on a background layer (`CROSSING_PRESENCE_Z = -20`,
   behind the main terrain at z = 0) at parallax 0.35: its apparent position is
   `center + 0.35 × (pos − center)`, so it crosses behind the playable layer
   slower than expected and is never centered by the camera.
4. **Technique C — foreground occluder** (`src/render/foreground.ts`, new):
   a pooled pass of 10 large dark slabs (world-silhouette vocabulary, same
   fill/edge family as `World`) on a layer in front of the playable plane
   (z = 14, in front of the player at 10 and the beam at 12). Each slab has a
   fixed reference position in the deep water (one staged on the hadal
   crossing lane); placement pulls the reference toward the camera by a depth
   factor 1.4, so as the player swims the structure crosses the view faster
   than the world, occludes temporarily, and clears it again — the scene reads
   as larger than the view.
5. **Technique E — sonar scale**: the renderer's sonar readout already scales
   echo/tag with the sim's object size (WI-06); WI-03d1 registers the colossal
   presences as massive objects (`bodyExtent / SONAR_MASSIVE_REF`). Asserted
   here at 21.5× for the T-23 def.
6. **Technique G — no center framing**: the camera target is the player only
   (follow in `main.ts`/`Renderer`); nothing in this item adds a frame-target
   seam, boss intro, letterbox, or cutscene framing. The crossing encounter
   test asserts the sim never reports a clean full-body view through the whole
   crossing and the camera stays player-anchored.

Wired in `src/game/Game.ts`: the camera center/half from `Renderer` feeds both
the creature renderer and the foreground pass every frame.

## Acceptance evidence table

| Criterion | Evidence | Status |
|---|---|---|
| Spine renderer extension: moderate segments, pooled, no per-frame allocation | `src/render/tier4Render.test.ts` "§34 performance guard" (600 frames of all 5 tier-4 creatures + foreground < 1500 ms — actual ~10 ms; body buffers byte-identical in count before/after; zero scene children added) and the browser probe perf checks (children 229→229 over 150 rAF frames; median frame 6.9 ms, no first/second-half degradation) | passed |
| Technique A (partial anatomy) | node test "the crossing flank never presents its full body at any crossing position" + a large organism that fits the view IS fully realized; browser: T-23 realized 3..3 of 9 spine nodes across 16 samples | passed |
| Technique B (parallax crossing) | node tests: crossing on background layer behind playable plane (z −20 < 0 < 10), apparent motion at 0.35× world motion, non-crossing large organisms unaffected; browser: T-23 visual group z=−20, renderOrder −2 | passed |
| Technique C (foreground occluder) | node tests: pooled slabs in front of playable plane, one staged on the hadal crossing lane, >1 parallax (screen offset moves at 1.4× camera), temporary occlusion (inside then outside the view), fixed pool; browser: 10 slabs live at z=14 | passed |
| Technique E (sonar scale) | node test: rendered echo/tag for the colossal presence > 4× a normal echo; browser: real def scale `bodyExtent/SONAR_MASSIVE_REF` = 21.5 (injected stand-ins are not in the construction-time sonar registry — production placement is WI-03d3 — so the browser asserts the sim's scale formula on the real def; the readout rendering is the node-suite assertion) | passed |
| Technique G (no center framing) | node test "through a real crossing": seed 441, the sim's `hasCleanFullBody` is never true across the whole crossing, the rendered body is never fully presented, the flank traverses the view (offset range > 400), camera stays player-anchored, presence stays on its background layer | passed |
| AC-roster-large (presentation half, final proof owner) | browser spot-checks: one large (T-19) and one colossal (T-23) organism render, animate, and read as large with zero console errors/page exceptions; the colossal reads through its techniques (background layer + partial anatomy + foreground pass), not through a centered boss intro; the no-full-view encounter never presents a clean full-body view (16/16 samples). The "≥ 3 large-scale creatures" roster floor and the fauna-first announcement are simulation facts owned and proven headless in WI-03d1 (5 tier-4 species + crossing fauna reaction); the roster-wide finalization is WI-03d3 | passed |
| AC-roster-tests (this item's half) | headless behavior tests for the signature rules are WI-03d1's (landed: `src/sim/tier4scenario.test.ts`); spoiler containment for this item's artifacts is enforced by the node test "no creature name or secret description appears outside the private content" (scans `src/render/*`, `src/game/Game.ts`, `src/content/secret/hiddenCreatures.ts`, and this implementation folder against `design_private/_spoiler_tokens.txt`) — passed | passed |
| Live verification (browser spot-checks + §34 guard) | `scratch/implementer/tier4-spot-check/probe.mjs` — 15/15 checks passed, `out/result.json`, screenshots `out/t19-large.png`, `out/t23-colossal.png`, `out/tier4-scene.png` | passed |

## Commands and observed results

- `npx vitest run src/render/tier4Render.test.ts` → 14/14 passed (confirmed
  failing first with `Cannot find module './foreground'` — the right reason).
- `npx vitest run` → 32 files, 267/267 passed.
- `npx tsc --noEmit` → exit 0.
- `node agents/tasks/.../scratch/implementer/tier4-spot-check/probe.mjs` →
  ALL CHECKS PASSED (exit 0); the dev server (vite, port 54322, started and
  killed by the probe) and headless Chromium (SwiftShader, 1920×1080) are the
  real load-bearing dependencies.

## Files touched

- `src/render/foreground.ts` — new (pooled foreground occluder pass).
- `src/render/creatureRender.ts` — extended in place: `RenderView` seam,
  `isCrossingPresence`, background crossing layer, partial anatomy.
- `src/render/tier4Render.test.ts` — new (14 tests).
- `src/game/Game.ts` — wires `RenderView` + `ForegroundPass` into the frame.
- This task folder: `implementation/`, `scratch/implementer/tier4-spot-check/`.

## Deviations from plan

- **Production world placement is absent by design (WI-03d3's job).** The
  browser spot-check therefore injects the two spot-checked organisms through
  the real `Creature` class and real content defs (dynamic import from the
  dev server's own module graph) into the live production `Simulation` via the
  §33 debug seam, at open-water positions in the hadal lane and abyss.
  Everything observed — sim stepping, renderer, foreground pass, page — is the
  production pipeline; only the spawn placement is a stand-in.
- Technique E's browser check asserts the sim's scale formula on the real def
  (see evidence table); the rendering of that readout is the node-suite half.

## Shrink/Flatten

- Removed the unused `_half` parameter from `ForegroundPass.update` (occluder
  placement depends only on the camera center); call sites updated, tests
  re-run green.
- Kept `ForegroundPass.dispose()` — it mirrors the existing
  `CreatureRenderer.dispose()` cleanup contract of the WI-02b renderer family.
- No wrappers, interfaces, factories, or extension points introduced; no
  defensive branches for impossible states; nothing else removable found.

## Assumptions

- The "≥ 3 large-scale creatures or creature events" floor of AC-roster-large
  is a simulation/roster fact (WI-03d1's 5 tier-4 species, proven headless);
  this item's presentation floor is the two browser spot-checks, which passed.
  If the reviewer reads this item as owning the roster count itself, the
  WI-03d1 test `src/sim/tier4scenario.test.ts` is the evidence to read.
- The browser perf guard's smoothness threshold (median frame < 100 ms, no
  half-window degradation) is deliberately soft because SwiftShader software
  GL under-states real-GPU headroom; the definitive 60 FPS check is ST-07's
  job per the work item. The allocation guard (no scene growth, stable
  buffers) is the hard §34 assertion and passed.

## Knowledge notes

- Consulted: `20260910-implementer-wi03d1-tier4-sim-rules.md`,
  `20260908-implementer-wi02b-creature-render-seams.md`,
  `20260907-implementer-wi06-sonar-render-size.md`.
- Written: `20260914-implementer-wi03d2-tier4-render-passes.md`.
