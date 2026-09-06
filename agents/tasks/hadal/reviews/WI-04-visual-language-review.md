# Review: WI-04-visual-language

Status: findings

## Contract Established (before looking at the diff)

"Done" for this work item (per the spec + request §13–§17, §34, §35, §64) means:

- A deep desaturated **water gradient** with black/near-black **silhouette
  terrain** and restrained luminous accents, at 1920×1080 (§14.1).
- **Pooled, reused particles** (marine snow / silt / motes) with no per-frame
  allocation that follow the current field, and a **per-band particle profile**
  that changes with depth (§34, §35, §64, §14.3).
- A **flashlight cone/radial light mask** (shader or composited) that makes
  particles visible inside the beam, lets silhouettes cross at the edge of
  illumination, and shortens effective visibility with depth **without going
  pure black** (§15).
- **Terrain** as silhouette meshes with separate decorative edge geometry and
  background parallax versions with no collision; parallax layers move at
  different rates (§17).
- At least one **genuinely atmospheric** on-screen moment (light cone, grain,
  silhouettes, particles) verified in a real browser (§44 phase 2).
- The scene stays **smooth (~60 FPS at 1080p)** with the particle/parallax load
  (§34).

The forbidden substitute successes are: a flat unlit color field called
"atmospheric"; particles that allocate new objects every frame; and a
flashlight that is a static sprite rather than a mask that reveals geometry.

The acceptance table assigns all six criteria to **manual (browser)** evidence,
so the browser game must actually render the scene.

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| Water gradient + silhouettes + accents at 1080p (§14.1) | **pass** | `Lighting` renders a camera-anchored depth-tinted gradient (z = −50) that is scaled to the view (`setHalf`); the screenshots (`depth-100/700/1400.png`) show a desaturated water field, a near-black seabed silhouette, and a faint accent edge. Palette brightens toward the surface (depth 100 teal → depth 1394 dark navy), consistent with §59. |
| Pooled particles, no per-frame alloc, follow current, per-band profile (§34/§35/§64/§14.3) | **pass** | `ParticleField` allocates each `Float32Array` once; `stepParticleType` (pure) mutates in place and wraps into a camera box; `update` sets `setDrawRange` per band without reallocating. `particles.test.ts` asserts the same buffer reference across 600 frames and net current-field drift; `band.test.ts` asserts the profile (size/snow/mote count) changes with depth. Screenshots show drifting particles with the per-band density change. |
| Flashlight cone/radial mask reveals the scene; visibility shortens with depth; not pure black (§15) | **fail** | The beam is a composited additive mask (not a static sprite), and the ambient floor (the gradient + `profile.ambient * 0.4`) keeps the frame above pure black. **But the beam quad is a 2-world-unit `PlaneGeometry(2,2)` that is never scaled**, so it covers only ~2 px and does not reveal the scene (Finding 1). Visibility does not visibly shorten with depth. |
| Terrain silhouette + decorative edge + background parallax (no collision) at different rates (§17) | **pass** (code) / partial (visual prominence) | `World` renders a near-black silhouette fill (z = 0) + accent edge (z = 1) + sparse luminous rim (z = 1.05); two background layers (z = −40 factor 0.4, z = −25 factor 0.65) are `Group`s **not** fed to `buildTerrain` (no collision), and `updateParallax` offsets each by `center * (1 − factor)`, so they lag at distinct rates. The parallax is faint in the screenshots (see minor observation below). |
| Genuinely atmospheric moment in a real browser (§44 phase 2) | **pass** | The real dev page (SwiftShader, 1920×1080) renders the gradient + silhouettes + particles + chromatic aberration + grain with no console/page errors. Independent probe measured a luminance stddev of ~69 across the canvas (a flat field would be ≲ a few units), and the screenshots are clearly atmospheric, not a flat color field. |
| Smooth ~60 FPS at 1080p with the load (§34) | **pass** (caveat) | The scene load is modest (a few silhouette meshes, ~500 pooled particles, two parallax layers, one grain/chromatic pass) and the implementer's probe holds a stable ~28–29 FPS across the depth range. 28 FPS is the **SwiftShader software** rate; ~60 FPS is only verifiable on a real GPU (the work item's own evidence table concedes this is manual). No FPS collapse with the particle/parallax load. |

## Findings

### Finding 1 (major): the flashlight beam is a ~2 px region — it does not reveal the scene

`src/render/lighting.ts:100` builds the beam as
`new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.beamMat)` and **never
scales it** (`update` at lines 111–120 sets only `position`, `rotation.z`, and
the `uReach`/`uIntensity`/`uAmbient` uniforms). The vertex shader (line 77,
`vLocal = position.xy * uReach`) intends to map the quad's unit range to a
`visibility`-sized beam, but the geometry is only ±1 world unit, so the whole
radial/cone falloff is compressed into a ~2 px quad around the beam origin.
Contrast the gradient (line 58), which *is* scaled to the view by `setHalf`
(lines 107–109) and therefore covers the screen — the beam has no equivalent
scale.

Consequences, all verified:

- The beam covers ~2 px, so it does not "make particles visible inside the
  beam," does not "let silhouettes cross at the edge of illumination," and does
  not "shorten effective visibility with depth" (§15). The three sub-goals of
  the criterion are not met.
- The beam is anchored to the **camera center** (line 113, `center.x/center.y`
  from `renderer.cameraCenter()`), not the player. When the camera is clamped
  (deep, `Renderer.follow` clamps y to −1057.5), the beam sits above the
  diver, so it does not track the diver's light even before the size bug.
- The implementer's project note (`20260906-implementer-wi04-…md`, lines
  33–43) claims the beam "brightens (reveals) the terrain/particles beneath it
  so silhouettes cross at the illumination edge" and that "the lit radius
  shortens" with depth. The rendered output does not support this: no beam is
  visible at any of the three depths, and the measured brightness is flat
  across the scene.

To satisfy the criterion: scale the beam mesh by its reach each update
(e.g. `this.beam.scale.set(reach, reach, 1)` so the unit quad spans
±`reach` world units, matching the shader's `vLocal`), and anchor the beam to
the **player** position (not the camera center) so it reads as the diver's
light. Then re-verify in a real browser that particles/silhouettes are revealed
inside the beam and the lit radius shortens with depth.

## Impact Check

- Ran `codegraph_explore` (mandatory gate, first structural lookup) for
  `renderVisuals / Lighting / ParticleField / PostFX / bandProfileAtDepth /
  World / Renderer`. It returned current source for `Game`, `Renderer`,
  `lighting`, `particles`, `postfx`, `band`, and `World`; the `Game` symbol
  list was **stale** (it listed a `render` method at line 94 that no longer
  exists — the real seam is `Game.renderVisuals` called from `main.ts`),
  consistent with the known-stale index the project note and prior reviewers
  flag. I therefore verified the changed seams by direct file reads.
- Changed symbols and their only callers: `Game.renderVisuals` (new) is called
  only by `main.ts` (one call per display frame, before `renderer.render`);
  `Renderer.setPostFX`/`cameraCenter`/`cameraHalf`/`gl` are called only by
  `Game`; `World.updatePalette`/`updateParallax` are called only by
  `Game.renderVisuals`. `Renderer.render` (now post-fx-aware) and `Renderer.resize`
  are called only by `main.ts`. `PLAYER_PLANE_Z` is consumed only by `Game`
  (player mesh). No other product callers were affected.
- Collision is unchanged: the parallax layers are added to the scene as `Group`s
  but are **not** fed to `World.buildTerrain`, so `buildTerrain` and the
  simulation's collision geometry are untouched. `World`'s public surface grew
  two methods (`updatePalette`, `updateParallax`), matching the L2 contract.
- The commit `fc7770f` touches 11 product files (`band.ts`/`lighting.ts`/
  `particles.ts`/`postfx.ts` + their two test files, and modifications to
  `Game.ts`/`constants.ts`/`main.ts`/`Renderer.ts`/`World.ts`) plus the
  implementer's note/implementation/scratch artifacts. All product files are in
  scope; the spec's `materials.ts`/`terrain.ts` pointers were reasonably routed
  to the existing `World.ts` seam and the new pure `band.ts` (not a scope
  drift). `state.md` is not staged.

## Independent Adversarial Probes

1. **Flashlight reach probe** (decisive for Finding 1). Wrote
   `agents/tasks/hadal/scratch/work-item-reviewer/WI-04/probe.mjs`, which boots
   the real `npm run dev` page in SwiftShader Chromium (1920×1080, `?debug=1`),
   teleports to depth 1400 (camera clamped, so the beam origin is at the screen
   center), captures the screenshot, and decodes the PNG in-node to sample
   luminance. Results:
   - A (not a flat field): luminance stddev **69.1** (a flat fill would be ≲ a
     few units) — **PASS**, the scene is genuinely textured, not a flat color
     field.
   - B3 (radial profile from the beam origin): brightness is flat across 0→900
     world units (`wu0` 115, `wu200` 122, `wu400` 118, `wu600` 122, `wu900`
     118) — **no bright peak and no falloff**. A working beam (reach ~955 at
     this depth) would hold bright out to several hundred px then fall; the
     profile is the particle-noise floor everywhere.
   - B4 (background floor, min luminance in a 40×40 box): at the beam origin
     `centerMin=0`, 600 px away `awayMin=0`, diff **0.0** — the background is
     black at the beam origin just as far from it, so the beam is not lifting
     the floor over any region.
   - No page errors, no console errors, canvas present.
   Re-run: `cd agents/tasks/hadal/scratch/work-item-reviewer/WI-04 && npm
   install && node probe.mjs` (resolves `playwright-core` from the repo root).
2. **Implementer's probe re-run.** `node
   agents/tasks/hadal/scratch/item-implementer/WI-04/probe.mjs` reproduced the
   reported result: FPS {depth-100: 28, depth-700: 29, depth-1400: 29}, no
   page errors, no console errors, canvas present. The browser evidence is real
   and reproducible; the three depth screenshots show the palette/particle
   progression but **no visible flashlight beam at any depth**.
3. **Headless suite.** `npx vitest run` → **11 files / 72 tests, exit 0**
   (includes `band.test.ts` 7 and `particles.test.ts` 4). The new tests are
   genuine: `particles.test.ts` asserts the same `Float32Array` reference across
   600 frames (no per-frame alloc) and net current-field drift; `band.test.ts`
   asserts visibility is monotonic in depth, the ambient floor never hits zero,
   distinct palettes per band, the particle profile changes with depth, and an
   exact authored-stop match at a band boundary.
4. **Build.** `npm run build` → **exit 0** (type-check + bundle; the >500 kB
   chunk notice is the three.js bundle, informational per `BUILD.md`).

## What I Could Not Verify

- **~60 FPS on a real GPU.** The probe runs on SwiftShader (software WebGL2)
  and reports ~28–29 FPS; that is a software rate, not the real-GPU rate the
  criterion targets. I verified the load is modest and does not collapse the
  frame rate across depths, but I could not observe ~60 FPS on a real desktop
  GPU. The work item's own evidence table concedes this is manual.
- **The parallax's visual prominence.** The parallax mechanism is correct in
  code (two layers, distinct factors, no collision), but in the depth-1400
  screenshot the background layers are very faint relative to the main
  silhouette and are hard to distinguish by eye. I did not measure the two
  layers' rates independently from a single screenshot (they are too faint and
  co-located); the "different rates" claim rests on the code
  (`updateParallax` offsets each layer by `center * (1 − factor)`).

## Minor observations (non-blocking, not raised as findings)

- The parallax layers are offset such that at deep depths they sit just below
  the main terrain fill (in the dark region over the gradient), which makes
  them read as a faint secondary silhouette rather than a clearly separated
  "background" layer. The implementer's note claims they appear "above the main
  seabed edge," which does not match the actual geometry (`center.y * (1 −
  factor)` pulls them down as `center.y` goes more negative). The criterion
  (parallax versions that move at different rates) is still met; consider a
  stronger tint/offset in the art pass (WI-07/WI-15) if they should read more
  distinctly.
- The beam is anchored to the camera center rather than the player
  (see Finding 1). Fixing the size bug alone will still leave the beam
  mis-anchored at depth once the camera clamps; anchor it to the player.

## Assumptions

- "Change no product code" for this role: I touched no product file and no
  `state.md`; my only additions are the reviewer scratch probe
  (`agents/tasks/hadal/scratch/work-item-reviewer/WI-04/`) and this report.
- I read the "smooth ~60 FPS at 1080p" criterion as targeting a real desktop
  GPU browser (per the work item's "In a real desktop browser" line and
  request §34), not the SwiftShader software rate. The ~28 FPS software
  reading is therefore recorded as a caveat, not a failure, since the scene
  load is modest and stable across the depth range.
- I treated the flashlight as a load-bearing element of this work item (it is
  in the title — "water, particles, **flashlight**, parallax" — and is
  criterion 3). Its non-function is therefore a major finding rather than a
  polish item, even though the rest of the visual language renders well.

## Re-review (2026-09-06) — after the flashlight fix (commit 07b68fb)

Status: pass

(This is the current, final status for this work item; it supersedes the
attempt-1 `findings` status recorded above, which is retained for the
record.)

The single major finding from the first review (Finding 1: the flashlight beam
was a ~2 px unscaled quad anchored to the camera center, so it did not reveal
the scene) has been fixed by commit `07b68fb` and independently verified. This
re-review confirms criterion 3 now passes and that the fix broke nothing else;
all other criteria that passed in the first review are unchanged, because the
fix touched only `src/render/lighting.ts` and the one `lighting.update` call in
`src/game/Game.ts`.

### Updated acceptance criteria

| Criterion | Verdict | Evidence |
|---|---|---|
| Water gradient + silhouettes + accents at 1080p (§14.1) | **pass** | unchanged; the fix did not touch the gradient. Re-confirmed by the depth-300/1400 screenshots: desaturated water field, near-black seabed silhouette, faint accent edge, brighter toward the surface. |
| Pooled particles, no per-frame alloc, follow current, per-band profile (§34/§35/§64/§14.3) | **pass** | unchanged; `particles.test.ts` (4) + `band.test.ts` (7) pass in the 75-test headless suite; screenshots show particles revealed inside the beam and dimmer outside, with the per-band density change. |
| Flashlight cone/radial mask reveals the scene; visibility shortens with depth; not pure black (§15) | **pass** | the beam is now a wide composited cone/radial mask scaled to `profile.visibility` and anchored to the player; verified in a real browser (probes below) — it reveals particles/terrain, is anchored to the diver (not the clamped camera center), its illuminated area shortens with depth, and the open water stays above pure black. |
| Terrain silhouette + decorative edge + background parallax (no collision) at different rates (§17) | **pass** (code) / partial (visual prominence) | unchanged; the first review's code analysis and minor-observation notes still apply. |
| Genuinely atmospheric moment in a real browser (§44 phase 2) | **pass** | unchanged and strengthened: the depth-1400 screenshot now shows the flashlight cone, drifting particles, grain, and chromatic split together — clearly atmospheric, not a flat field (luminance stddev 41.7). |
| Smooth ~60 FPS at 1080p (§34) | **pass** (caveat) | unchanged; the independent probe holds ~27 FPS on SwiftShader (software); ~60 FPS is only verifiable on a real GPU; the scene load is modest and stable across depths. |

### What the fix changed

- `src/render/lighting.ts`: `Lighting.update` gained a `player: Vec2`
  parameter; `beam.position` is now set to the player (was the camera center)
  and `beam.scale` is set to `profile.visibility` (was never scaled, staying a
  ~2 px `PlaneGeometry(2,2)`). The vertex shader's `vLocal = position.xy *
  uReach` stays consistent with the mesh scale (no double-scaling): the unit
  quad now spans ±`visibility` world units and the radial falloff runs across
  it. The ambient water gradient stays camera-anchored. `beam`/`gradient` are
  now `readonly` public so the render test can assert their scale/position (no
  behavior change).
- `src/game/Game.ts`: the one `lighting.update` call in `renderVisuals` now
  passes `this.sim.player.position`.
- New `src/render/lighting.test.ts` (3 tests): beam scaled to reach; beam
  anchored to the player while the gradient stays camera-anchored; reach
  shortens with depth.

### Verified

- Headless suite: `npx vitest run` → **12 files / 75 tests, exit 0** (was 11 /
  72; +3 from `lighting.test.ts`).
- Build: `npm run build` → **exit 0** (type-check + bundle; the >500 kB chunk
  notice is the three.js bundle, informational per `BUILD.md`).
- Tests are genuine regression tests: in a detached `git worktree` at the
  pre-fix commit `7b48043` with the new test added, all 3 `lighting.test.ts`
  tests **FAIL** (the pre-fix `update` takes 3 args, not 4, and never scales or
  player-anchors the beam), so the "confirmed red then green" claim in the
  implementation note holds. Worktree removed after the check; the product
  working tree was not modified.
- Independent browser probe
  (`agents/tasks/hadal/scratch/work-item-reviewer/WI-04/probe-reverify.mjs`;
  real dev page, SwiftShader Chromium, 1920×1080, corrected PNG decoder) — all
  checks pass:
  - not a flat color field (luminance stddev **41.7**);
  - the bright cone base (coneBaseY=1052, centroidY=625) sits at the diver's
    height (playerY=869) and is far closer to the diver than the clamped screen
    center (camY=540; dPlayer=183 vs dCam=512) — **player-anchored**, resolving
    Finding 1 and the first review's "beam mis-anchored once the camera clamps"
    minor observation;
  - the beam reveals a bright core (**253**) far above surrounding water
    (**45**);
  - the illuminated area shortens with depth (**63007** px at depth 300 →
    **14417** px at depth 1400);
  - the open water is never pure black (min luminance **18.7**);
  - ~27 FPS, no page or console exceptions.
  - Screenshots: `output/reverify-depth1400.png` (cone rising from the diver on
    the seabed, revealing drifting particles) and `output/reverify-depth300.png`
    (wide shallow beam). Both clearly show particles visible inside the beam and
    dimmer outside.

### Finding 1 — resolved

The beam is now scaled to its reach and anchored to the player (the diver), so
it reveals the scene, and the first review's minor observation (the beam
mis-anchored once the camera clamped) is resolved by the same change. The
implementer's `Attempt 2` note and the `20260906-implementer-wi04` project note
describe the fix accurately (no over-claim).

### Remaining non-blocking notes (carried from the first review)

- ~60 FPS on a real GPU remains a manual observation (the probe runs on
  SwiftShader software WebGL2).
- The two background parallax layers are faint and co-located in the depth-1400
  screenshot; the distinct-rates claim rests on the code (`updateParallax` sets
  `center * (1 - factor)` at 0.4 and 0.65, verified in the first review). A
  stronger tint/offset in the art pass (WI-07/WI-15) would make the layers read
  more distinctly.
