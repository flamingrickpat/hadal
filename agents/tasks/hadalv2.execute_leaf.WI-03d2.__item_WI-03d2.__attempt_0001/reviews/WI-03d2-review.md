# Review: WI-03d2 — Tier 4: section 52 rendering passes + browser spot-checks

Status: pass

Reviewed commit: `3aeadd7` ("[render] add the large-creature presentation
passes"), child of the accepted revision `ee59c748`. Product files touched:
`src/game/Game.ts`, `src/render/creatureRender.ts`, `src/render/foreground.ts`
(new), `src/render/tier4Render.test.ts` (new) — all inside the declared
subsystem (procedural creature rendering + its Game wiring). No simulation
rule changes, no new renderer architecture, `state.md` untouched.

Structural lookups went through codegraph first (session gate): the first
query was `codegraph_codegraph_explore` ("World background parallax layers
z positions CAMERA_VIEW_WIDTH PLAYER_PLANE_Z SONAR_MASSIVE_REF
FULL_BODY_VIEW_RANGE", projectPath `C:\Temp\hadal-v2`), which located the
`World` parallax layers (`src/world/World.ts`, z = -25 and -40, factors
0.65/0.4 — the crossing layer at z = -20 sits behind the terrain at 0 and in
front of both), `src/game/constants.ts` (`CAMERA_VIEW_WIDTH = 2000`,
`PLAYER_PLANE_Z = 10`), `Renderer.cameraCenter/cameraHalf`
(`src/render/Renderer.ts`), and `Game.renderVisuals` / `main.ts`'s
player-only camera follow. A second query covered
`CreatureRenderer.update` / `ForegroundPass` / `RenderView` blast radius.

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| Very-long bodies: moderate spine segments, pooled, no per-frame allocation in the large-creature hot paths (§34) | passed | Node test asserts every tier-4 spine is 3–12 nodes (T-23: 9, T-19: 4 observed in the browser). 600-frame node perf test keeps body buffers byte-stable and scene children frozen; my independent probe ran 120 `ForegroundPass` + repeated `update` frames with zero scene growth. Browser re-run (mine): 150 rAF frames, scene children 229 → 229, median 6.9 ms, no first/second-half degradation. |
| Technique A — partial anatomy | passed | Node sweep: the crossing flank is never fully presented at any of 33 crossing offsets and the mechanism actually unrealizes nodes (`sawUnrealized`); a large organism that fits the view (T-19) is fully realized, so the cull is not over-eager. My probe: T-23 far outside the projected view → 0/9 nodes realized; at view center → 3/9; with no view (default path) → 9/9 (legacy behavior preserved for all pre-existing callers). |
| Technique B — parallax crossing, never centered | passed | Crossing presence is on `CROSSING_PRESENCE_Z = -20` (behind terrain at 0, in front of the -25/-40 world parallax) at renderOrder -2; apparent position `center + 0.35·(pos − center)` verified to 1e-9 by my probe; non-crossing large organisms stay on the player plane at their true position (node test + browser z=10). |
| Technique C — foreground occluder pass | passed | `ForegroundPass`: fixed pool of 10 slabs at z=14 (in front of player 10 / beam 12), world-silhouette vocabulary (same fill/edge as `World`). My probe: screen offset moves at exactly 1.4× camera motion, slab at view center when the camera is at its reference, clears the view 5600 units out (occlusion is temporary by construction), no per-frame scene growth. Browser: 10 slabs live at z=14; a slab is visible in the committed screenshots. One reference is staged on the hadal crossing lane. |
| Technique E — sonar-scale readout | passed | Node test runs the real `SonarSystem` + `SonarVisuals` with the colossal size (`bodyExtent/SONAR_MASSIVE_REF` = 21.5 for the T-23 def) and asserts the rendered echo/tag scale at impossible size (> 4× a normal echo). The live-page echo of a *placed* creature is not asserted because the spot-check stand-ins are not in the construction-time sonar registry — production placement is WI-03d3's, and the deviation is recorded in the implementation note. Sim-side registration of the massive objects was proven headless in WI-03d1 (accepted). |
| Technique G — no center framing | passed | Camera target is the player only (`main.ts`: `renderer.follow(game.player.position)`; nothing in this commit adds a frame-target, letterbox, or cutscene seam). Node test through a real seeded crossing (seed 441): sim `hasCleanFullBody` never true across the whole crossing, rendered body never fully presented, flank traverses the view (offset range > 400), presence stays on its background layer for the whole encounter. Browser: 16/16 samples `cleanSim=false`. The no-clean-view floor is also geometric: the crossing body spans 6441 units vs a 2000-unit view (recomputed by my probe). |
| AC-roster-large (presentation half — final proof owner here) | passed | Browser spot-checks (implementer's committed run **and** my independent re-run): one large (T-19, span 474–475, player plane) and one colossal (T-23, background layer, partial anatomy 3/9, never clean full-body) render and animate with zero console errors / page exceptions. The colossal reads through its techniques, not a centered boss intro. The "≥ 3 large-scale creatures" roster floor and the fauna-first announcement are simulation facts owned by WI-03d1 (accepted: 5 tier-4 species + crossing fauna reaction, headless). |
| AC-roster-tests (this item's half: spoiler containment of this item's artifacts) | passed | Node test scans `src/render/*`, `src/game/Game.ts`, `src/content/secret/hiddenCreatures.ts`, and this item's implementation folder against `design_private/_spoiler_tokens.txt` — passed in the suite. My independent scan of all 31 name/lore tokens (word-boundary, case-insensitive) over every file in this task folder, all four product files, the new project note, and the commit message: zero hits. T-IDs appear only in identifiers/tests/commits, as the spoiler rules allow. |
| §34 performance guard (focused inspection) | passed | My browser re-run: largest tier-4 scene (all 5 species + foreground pool, 11 active creatures) — no per-frame scene growth, median frame 6.9 ms under SwiftShader, no degradation across the window. The definitive 60 FPS check remains ST-07's per the work item; the soft SwiftShader threshold is deliberately not claimed as the §34/§14.3 visual assertion. |
| Constraints: no new renderer architecture, no sim rule changes | passed | Diff reviewed hunk by hunk: `creatureRender.ts` extended in place (`RenderView` input, crossing layer, partial anatomy), `foreground.ts` is a pooled pass in the existing layer family, `Game.ts` only wires the two new inputs. Falsification condition ("a technique needs gameplay rules in the renderer") did not fire — every pass reads sim state + camera view only; my probe confirmed the renderer does not mutate `creature.position` across frames. |

## Findings

No blocking findings.

Non-blocking observations (recorded, not routed back):

1. **Mojibake in `src/render/tier4Render.test.ts`** (lines 424–425 comment and
   the line-471 `describe` label): double-encoded UTF-8 — `Â§` for `§` and
   `â€”` for the em dash. Confirmed at the byte level. Cosmetic only (comments
   + a test display name); no behavioral, contractual, or spoiler effect. A
   later item (e.g. WI-03d3's implementer) can clean it up in passing.
2. **Parallax is applied to the group center, not the body's local shape**:
   the crossing flank's apparent motion is 0.35× world motion while its
   apparent size stays 1× (a strict projection of a far plane would shrink
   both by 0.35). The work item only requires "behind the playable layer,
   moving slower than expected, never centered" — which holds — and the
   unshrunk body keeps the flank spanning ~3.2 view-widths on screen, which
   serves the scale read. Noted as a design nuance, not a defect.
3. **Technique E's live-page half is formula-level** (see criteria table):
   the injected spot-check stand-ins are not in the sonar registry; the
   readout rendering is asserted in the node suite with the real
   `SonarSystem`/`SonarVisuals`. Acceptable because WI-03d3's production
   placement re-exposes this end-to-end; recorded so WI-03d3's reviewer
   knows to re-verify the live echo.

## Impact Check

- `CreatureRenderer.update` (signature gained an optional 4th parameter
  `view: RenderView | null = null`): codegraph blast radius + repo grep show
  the only production caller is `Game.renderVisuals` (now passing the
  camera center/half); the other callers are `creatureRender.test.ts` and
  `tier3Render.test.ts`, which omit the parameter and passed unchanged in
  the full suite — legacy behavior (full realization, true position) is
  preserved, which my probe also confirmed directly.
- New exports `RenderView`, `CROSSING_PRESENCE_Z`,
  `CROSSING_PRESENCE_PARALLAX`, `isCrossingPresence`, `ForegroundPass`,
  `FOREGROUND_OCCLUDER_Z`, `FOREGROUND_OCCLUDER_DEPTH`: used only by
  `Game.ts` and tests; no other module references them.
- `Game` gained one field (`foreground`) and two call sites inside
  `renderVisuals`; no other `Game` member changed. `main.ts`'s camera
  follow is untouched (player-anchored).
- No changes to `src/sim/*`, creature defs, or content data — WI-03d1's
  surface is exactly as that item's accepted review recorded it.

## Independent Adversarial Probes

All run from this session; scratch under
`scratch/reviewer/` (indexed by `scratch/reviewer/AGENTS.md`).

1. **Full suite + type check (re-runs of the claimed evidence):**
   - `npx vitest run src/render/tier4Render.test.ts` → 14/14 passed (157 ms).
   - `npx vitest run` → 267/267 passed (14.1 s).
   - `npx tsc --noEmit` → exit 0.
   These reproduce the implementer's claimed commands exactly.
2. **Logic probe (`scratch/reviewer/tier4-logic/probe.ts`, `npx vite-node`,
   27 checks, exit 0)** — designed to falsify the implementation's
   interpretation rather than re-assert its tests:
   - no-view default keeps full realization (9/9) — could have caught a
     partial-anatomy regression that also broke pre-existing creatures;
   - T-23 placed far outside the *projected* view realizes 0/9 nodes with
     the head hidden; at view center 3/9 — my first attempt used a world
     position that projected *inside* the view margin (4/9 realized) and
     failed my own expectation; after correcting for the 0.35 parallax the
     product behaved exactly as claimed (the probe error was mine, not the
     code's);
   - apparent position recomputed independently: `center + 0.35·(pos −
     center)` to 1e-9;
   - renderer wrote nothing back to `creature.position` across frames (§30
     read-only contract);
   - crossing classification recomputed from the defs: T-19 1152 / T-20 1400
     / T-22 2260 / T-25 880 (all < 4000 threshold) vs T-23 6441 — exactly
     one colossal, and the no-clean-view floor is geometric;
   - foreground slab offset delta exactly -140 for a 100-unit camera move
     (1.4×), at-reference centering, 5600-unit clearance, 120 updates with
     zero scene growth.
3. **Browser spot-check re-run (`scratch/reviewer/tier4-browser/probe.mjs`,
   a copy of the implementer's probe at the same tree depth so its
   `repoRoot` resolution holds, on port 54323 to avoid any collision):**
   15/15 checks, exit 0 — spine visuals for both organisms, moderate
   segments (4 / 9), z=10 vs z=-20 (order -2), 16 samples `cleanSim=false`,
   realized 3..3 of 9, 10 slabs at z=14, sonar size 21.5, scene children
   229→229 over 150 rAF frames, median 6.9 ms, no console errors or page
   exceptions. Numbers match the committed `out/result.json` run to within
   animation noise (body span 474 vs 475) — the live evidence is real and
   reproducible, not a one-off.
4. **Screenshot inspection** (read as images): `t19-large.png` shows the
   large body as a big silhouette left of the player plus a dark foreground
   slab at the top of the frame; `tier4-scene.png` shows the full tier-4
   roster around the player with a large occluder slab bottom-center;
   `t23-colossal.png` shows the hadal lane scene (the flank reads subtle in
   the still — the layering and partial anatomy are the numeric evidence).
   Screenshots contain no creature names or secret text.
5. **Spoiler scan (mine, broader than the node test):** all 31 name/lore
   tokens from `design_private/_spoiler_tokens.txt` scanned
   word-boundary/case-insensitively over every `.md`/`.mjs`/`.json` in this
   task folder, the four product files, the new project note, and the
   commit message — zero hits.

## What I Could Not Verify

- **Definitive 60 FPS at 1080p on real hardware** — explicitly out of this
  item's scope (ST-07's job); the §34 focused-inspection guard passed under
  SwiftShader only, whose throughput understates a real GPU. The
  work item does not claim the definitive check, so this is a scope
  boundary, not a gap.
- **The live sonar echo of a production-placed colossal creature** — the
  production placement does not exist yet (WI-03d3). What I could verify
  was the readout rendering at the colossal scale (node suite, real
  `SonarSystem`/`SonarVisuals`) and the sim-side registration (WI-03d1,
  accepted). WI-03d3's review should close this end-to-end (observation 3).
- **Aesthetic "reads as large" judgment at full quality** — per §70/§14.3
  the visual/atmosphere pass is manual inspection in a real desktop
  browser; the spot-checks prove the mechanisms are live and error-free,
  not that the art is finished.
- **The t23 screenshot's flank legibility** — in the single still the
  crossing flank is a subtle dark shape; the mechanism-level evidence
  (background layer, 3/9 realization, never-centered traversal) is what the
  work item actually requires, and the node-side real-crossing test covers
  the full encounter arc, not one frame.
