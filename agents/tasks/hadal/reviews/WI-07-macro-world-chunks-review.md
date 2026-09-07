# Review — WI-07: Full macro world (depth bands, chunk streaming, currents, interiors, triggers)

- Task: hadal
- Work item: `agents/tasks/hadal/workitems/WI-07-macro-world-chunks.md`
- Role: work-item-reviewer (attempt 2)
- Revision reviewed: `fe82eb4` (implementer attempt 3; the fix diff under review is `721a63c..fe82eb4`, 8 files, +186/−12)
- Date: 2026-09-08

Status: pass

## Re-review scope

Attempt 1 (review artifact in dangling commit `8a9bb34`, discarded by the controller
reset) reported **findings** with three items. The implementer addressed all three
in `fe82eb4`. This review independently verifies each fix and re-confirms the rest
of the acceptance criteria (the underlying world, triggers, currents, and
interiors were not changed by the fix — the diff touches only the three flagged
areas plus their tests, the note, and the implementation record).

## Prior findings — verified fixed

| # | Prior finding (attempt 1) | Fix in `fe82eb4` | Independent verification |
|---|---|---|---|
| 1 | Band 5 (hadal terminus) had no pocket and no main route, so per-zone §4.2 parity held only for bands 2–4 | Added `hadal-pocket` prop + a `hadal-pocket-ledge` slab forming a swim-under alcove off the main line; main route intentionally absent (band 5 is the terminus, entered from band 4 — recorded in the implementation record and the world data comment) | Probe `probe.test.ts` §8: the `hadal-pocket` prop exists inside the alcove geometry (below the new ledge, above the floor). Probe §9: the live player, starting at the real spawn with no teleport/noclip, swims the full descent via 5 waypoints to the pocket (final pos 18811,−9643, 36 units from the marker) using normal steering + collision — 3,648 steps total. |
| 2 | `activeChunks` was maintained but never consumed by the render/creature systems, so "far chunks disabled" was unobservable | New `Simulation.ambientWork` per-chunk budget (active chunks allocate their authored `ambient.particleDensity`, far chunks are removed each step), `Simulation.ambientIntensityAt(pos)`, consumed by `Game.renderVisuals` which scales the ambient particle field; `ParticleField.update` gained a defaulted `ambientScale` argument | Probe §10: `ambientIntensityAt` = 0.80 at the player, 0.00 at a far point; `ParticleField.update` with scale 1 → 450 particles, scale 0 → 0 (real render class, not a stub). Code path: `Game.renderVisuals` (Game.ts:136–138) reads the sim and passes the scale — no second simulation path introduced. |
| 3 | The density assertion was upper-bound-only (`legTime < 120`) while the criterion cites ~20–60 s | The scenario now asserts `legTime <= 60` per leg with a comment explaining the authored gaps are denser than the rule of thumb (~11–19 s) | Probe §11: independent steering of the same waypoints measures legs 16/13/19/11 s — no leg is a long transit or an empty corridor. The 60 s upper bound is the load-bearing half of §49 (the criterion's concern is empty corridors); legs measuring *denser* than 20 s is a property of the authored gaps, not a defect. |

## Acceptance criteria

| Criterion | Verdict | Evidence |
|---|---|---|
| One connected authored map, ~5 bands, ~18,000–28,000 wide, surface y=0, deepest ~−9,000..−12,000 | ✓ | Probe §1: bands [1..5], bounds x −3000..24000 (w=27,000), surface 0, deepest −10,000. Scenario: start swims to every band. |
| Terrain as 2D collision polylines + silhouette meshes + decorative edge + no-collision parallax; player can traverse the whole map | ✓ (traversal); visual layers re-confirmed from code | All `TerrainShapeDef`s are closed/open polylines driving `buildTerrain` (collision) and `visual` silhouettes + parallax (WI-04/05 code, unchanged). Traversal: scenario end-to-end + probe §7/§9 (interior + pocket by real collision). |
| Per zone: main route, far-side shortcut, optional pocket, landmark, faster return; wide descending network, not a shaft | ✓ (terminus caveat is design-correct) | Probe §3: band centres shift x 1045→9750→13800→18800→20800; skip-band shortcuts `shelf->abyss`, `twilight->hadal`; band 5 now has pocket + landmark + interior + return. Band 5 has no deeper main route because it is the terminus — the network property (no straight shaft, return routes, shortcuts, pockets) is verified independently of that. |
| Data-driven `WorldChunkDef`; nearby chunks fully active, far chunks have expensive AI/particles disabled | ✓ | Probe §10 (budget gate + render consumption); implementer's `chunks.test.ts` activation tests (radius 3600, active/far sets); all definitions stay in memory — only activation streams. |
| `CurrentField` (drift/vent/pulsing/eddy) moves player **and** particles; a mobility upgrade changes handling | ✓ | Probe §5: local current (25.5,−5.1); stationary player carried +20.40 u/s without boost, +5.10 u/s with the `boost` capability (75% reduction). Particles: `Game.renderVisuals` feeds `sim.currents.velocityAt` into `ParticleField.update` (same field, code-verified; particle follow asserted in `CurrentSystem.test.ts`). |
| A few wreck/facility interiors as cutaway rooms with damaged gaps (identical swim controls, not a tile platformer) | ✓ | Probe §7: shelf interior reached by swimming (best distance 130 from the room point, real collision); hadal interior cutaway verified in the data (gap in the west wall); interior is pure geometry — no platformer mechanics added. |
| Encounter-trigger system wired and data-driven | ✓ | Probe §6: the **authored** triggers fire in the live sim — `hadal-reached` + radio line at depth 9700, once-dedup holds; abyss `deep-reached` fires at 8600, not at 8300 (threshold honoured). Condition/action vocabulary matches the §36 shape (8 conditions, 10 actions, `once` flag). |
| WI-02/03 greybox refactored into the chunk model, behaviour preserved | ✓ | Probe §4: greybox chunks are a strict id-preserving subset of `MACRO_WORLD`. The full pre-existing headless suite (core loop, §70 scenarios, save, crafting) passes unmodified. |
| Dense traversal: ~20–60 s between meaningful points, no 3-minute empty corridor | ✓ | Scenario asserts `legTime <= 60` per leg (green); probe §11 measures legs 11–19 s independently. |

## Independent probes (this review, scratch)

- `agents/tasks/hadal/scratch/work-item-reviewer/WI-07/probe.test.ts` — 14 tests,
  run with `npx vitest run --config agents/tasks/hadal/scratch/.../vitest.config.ts`:
  **14/14 pass** (442 ms). Re-derives scale, connectivity, wide-network, per-band
  topology, greybox subset, currents+boost, the authored triggers in the live sim,
  the shelf interior, the hadal pocket route (new), the ambient-work gate with the
  real `ParticleField` (new), and per-leg descent times (new).
- `agents/tasks/hadal/scratch/work-item-reviewer/WI-07/browser-probe.mjs` —
  `node .../browser-probe.mjs`: **PASS** (exit 0). Fresh Chromium profile,
  1920×1080: dev build boots a live WebGL2 canvas, zero console/page errors,
  keyboard input (S+D, 1.5 s) reaches the production simulation (HUD depth
  100m → 467m, O2 180s → 179s). Screenshot: `output/A-dev-boot-1920x1080.png`
  (surface/coast — spoiler-safe).

## Commands and results (this review)

| Command | Exit | Result |
|---|---|---|
| `npx vitest run` | 0 | 19 files, 135/135 tests pass (604 ms) |
| `npm run build` | 0 | production build succeeds (609 kB JS / 157 kB gzip; only the pre-existing chunk-size warning) |
| probe spec (config above) | 0 | 14/14 pass |
| browser probe | 0 | clean boot, input reaches sim, no console errors |

## Impact check

- `ParticleField.update` gained a defaulted 6th parameter; the only production
  caller is `Game.renderVisuals` (grep-verified) — no caller signature break.
- `Simulation.ambientWork` / `ambientIntensityAt` are new members, used by
  `Game` and tests only; no existing member changed semantics.
- `worldData.ts` adds one slab + one prop to the hadal chunk; the full headless
  suite (including the end-to-end scenario that swims past the new geometry) and
  the independent pocket-route probe both pass.
- No forbidden substitute success: the map is a wide network (probe §3), one
  connected graph (probe §2), currents move both player and particles (probe §5),
  and the triggers demonstrably fire (probe §6).

## Tests to write first (work item requirement)

Present and green (verified in attempt 1, unchanged by the fix): the world
connectivity test over `WorldChunkDef` data and the encounter-trigger
condition→action test (`chunks.test.ts`, `triggers.test.ts`).

## Project knowledge update

`agents/projects/hadal/notes/20260908-implementer-wi07-macro-world-chunks.md`
records the world scale constants, the chunk-activation threshold
(`CHUNK_ACTIVE_RADIUS = 3600`), the trigger condition/action vocabulary, and the
current-field constants — satisfying the work item's expected-knowledge note.

## Minor observations (not findings)

- The `Simulation.ambientWork` doc comment says the gate is "asserted headlessly
  (`ambient.test.ts`)"; the tests live in `chunks.test.ts`. The project note is
  correct; only the in-code comment name is stale.
- §49's "20–60 s" is a rule of thumb against *empty* corridors; the authored
  descent gaps measure 11–19 s (denser). This is the intended direction for a
  90–120-minute game, not a violation.
- `ambientIntensityAt` uses a fixed 2,000-unit "within a screen" proximity; the
  camera shows 1,800–2,300 units, so it is a reasonable constant approximation.

## What I could not verify

- The **visual** look of the deep bands (silhouette/parallax/cutaway composition)
  in a real browser: the boot probe covers the surface scene only, and §70 keeps
  long swim routes out of Chromium. Deep-zone presentation quality is Phase 7
  territory; the greybox geometry and render wiring are code-verified and the
  headless traversal is proven.
- Stutter-free performance specifically on a long in-browser swim: the fixed-step
  loop, chunk activation, and particle pooling are code-verified and the headless
  full-map traversal completes without timeout, but no 5-minute browser swim was
  re-run for this review.
