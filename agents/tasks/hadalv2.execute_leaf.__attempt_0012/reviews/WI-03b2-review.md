# Review: WI-03b2 — Tier 2: production spawns + data-driven rendering

Status: findings

Reviewed commit: `e78a1f8` (base `f4aeed3` = "Prepare execution of WI-03b2").
Product diff is exactly three files: `src/world/worldData.ts`,
`src/content/secret/hiddenCreatures.ts`, `src/sim/tier2Scenario.test.ts`.
No `state.md`, no `src/render/` change. Working tree clean at HEAD.

I established "done" for this item **before** reading the diff, from
`request.md` and the spec:
- every tier-2 organism id WI-03b1 lands is spawned in `worldData.ts`, in the
  band the private roster designed it for, at band density (§49, no empty
  corridors) with the §34 ambient caps, ids debug-only (§33);
- the tier's small/medium body shapes are data-driven on the existing WI-02b
  spine pipeline (no new renderer architecture);
- the tier's one browser spot-check (a friendly tier-2 organism) renders,
  animates, and shows its interaction readably, with no console errors.

I re-derived the "done" bar against the literal request and it matches the
work item (no semantic narrowing found): the 15+ roster-wide floor is
explicitly deferred to WI-03d; this item owns the tier-2 portion.

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| AC-roster-count (tier-2 portion: ids resolve, spawns in the designed band) | pass | `src/sim/tier2Scenario.test.ts` block `tier-2 production world data (WI-03b2)`: test 1 (every production spawn resolves via `CREATURE_BY_ID`, every tier-2 spawn's chunk `band` ∈ `TIER2_BANDS[id]`, every tier-2 id present in **every** designed band), test 3 (all 12 hidden types active). Ran `npx vitest run` → 205/205. I independently re-derived `TIER2_BANDS` vs the `worldData.ts` spawns (see Impact Check) and every band matches. |
| AC-roster-count (15+ roster-wide floor) | n/a (WI-03d) | Deferred per spec; only 12 creatures are implemented at this tier. The item's third test asserts `active.size >= 12` (the tier-2 portion), which is the correct scope here. See Finding 2 on a comment that overstates this. |
| §34 ambient caps | pass | test 2: per-chunk per-type counts ≤ 16 for all tier-1 + tier-2 roster ids. I verified the actual max is 6 (T-01 in shelf); every tier-2 spawn is 1–2. |
| AC-roster-tests (headless signature-rule tests) | pass | The tier-2 signature tests (T-08 trade, T-09 herd, T-10 sweep, T-11 lift, T-27 ride, T-31 drift) were landed by WI-03b1 and still run green in the 205/205 suite; this item adds the production world-data block. No new signature tests are required by this item. |
| AC-roster-tests (tier-2 spoiler containment) | pass | The sweep was extended to `src/world` + this item's `implementation/` dir. Ran the full suite (green): no token from `design_private/_spoiler_tokens.txt` is found. The `worldData.ts` comments use functional descriptors (drifter, sweeper, lifter, feeder, herder, cable) — none match the secret name tokens (Sweepers, Tenders, Lantern-herds, Cistern-keepers, …), consistent with the approved tier-1 comment style. |
| Browser spot-check (one friendly tier-2 organism) | pass | Implementer's `probe.mjs` is a genuine end-to-end Playwright probe: it starts the real `npm run dev -- --strictPort`, drives the real `?debug=1` page, and reads real `window.__HADAL_GAME__.sim` state. `out/result.json`: 9/9 checks pass (T-11 present at 14500,-5900; reactivates on AI range; rises to its +300 hold; `kind=spine nodes=4`; sim clock advances; moves 26.2u/2.5s; player lifted 99u/6s; no page exceptions; no console errors). `out/t11-settled.png` shows the balloon/bubble silhouette rendering readably, distinct from the player. |

## Findings

1. **`t31-twilight` spawns inside a solid landmark and box-walks there (defect).**
   - Where: `src/world/worldData.ts:346` —
     `{ id: 't31-twilight', creature: 'T-31', position: vec2(17000, -5700), count: 1 }`.
   - What is wrong: (17000, -5700) is inside the `twilight-landmark` closed
     terrain slab, `slab('twilight-landmark', 15500, -6800, 2200, 1200)` at
     line 298 (x ∈ [15500,17700], y ∈ [-6800,-5600]). The T-31 body radius is 12
     (`hiddenCreatures.ts:334`) with no chainCircles, and its nearest slab edge
     is ~100 below the top edge — far beyond the radius — so `Terrain.resolveCircle`
     does not push it out. In the live sim the creature drifts west (deep-tier
     `T31_DEEP_DRIFT = 8`, `Simulation.driftT31`), reaches the interior left wall
     at x≈15512, and box-walks there; it can never leave the closed slab.
   - Why it matters: a spawn trapped inside a solid is not in open water, so this
     instance does not contribute to the twilight band's §49 "dense traversal"
     and is not encounterable by the player (it renders behind/inside the
     landmark silhouette). This is the *same* failure mode the implementer already
     diagnosed and fixed for T-11 in this very commit ("its rise met a solid
     ceiling … box-walked into it and froze" → relocated); the T-31 twilight
     instance was not given the same clearance. The literal band-coverage test
     still passes (T-31 is in band 3), but the item's stated intent — "spawns at
     band density (section 49: dense traversal, no empty corridors)" — is undercut
     for this instance.
   - What would satisfy it: relocate the `t31-twilight` spawn to an open-water
     position inside band 3 (as done for T-11) so the drift actually traverses the
     band; band containment in the world-data test is unaffected because it stays
     in band 3.

2. **Roster-floor test comment overstates what the test proves (minor, non-blocking).**
   - Where: `src/sim/tier2Scenario.test.ts`, the third test of the `tier-2
     production world data (WI-03b2)` block (the comment beginning "The tier-2
     portion of the roster-wide AC-roster-count check WI-03d finalizes…").
   - What is wrong: the comment says the five framework fixtures "carry the
     tier-0 greybox, which clears the 15+ floor on its own." But `active` is
     built only from production `creatureSpawns`, and the fixtures
     (`fixture-*`) are not spawned in `MACRO_WORLD`, so `active.size` is 12,
     not 17, and the test only asserts `active.size >= 12`. The 15+ floor is
     WI-03d's to finalize.
   - Why it matters: it can mislead the WI-03d reviewer into believing the 15+
     floor is already proven here.
   - What would satisfy it: correct the comment to state that only the 12
     implemented hidden types are asserted active here and that the 15+ floor is
     finalized in WI-03d.

## Impact Check

Changed symbols and what I checked on each:

- `worldData.ts` `creatureSpawns` (data). Consumers: the `Simulation`
  constructor (`src/sim/Simulation.ts:246-254`, resolves each spawn id against
  `CREATURE_BY_ID`) and `makeSimWorld()` (returns `MACRO_WORLD` as the sim
  chunks). I verified every tier-2 spawn id resolves and re-derived
  `TIER2_BANDS` against the actual spawn positions:
  - T-08 {3,4} → twilight (15600,-7700) + abyss (18700,-8900) ✓
  - T-09 {3,4} → twilight (11000,-5300) + abyss (17200,-8200) ✓
  - T-10 {2,3} → shelf (7500,-3800) + twilight (13900,-6850) ✓
  - T-11 {3} → twilight (14500,-5900) ✓ (the relocated spot)
  - T-27 {3} → twilight (13400,-5600) ✓
  - T-31 {1,2,3,4,5} → coast (5500,-600), shelf (8500,-3000), twilight
    (17000,-5700), abyss (15500,-8300), hadal (19800,-9650) ✓
  All in their chunk `bounds`; the only one inside a solid is the twilight T-31
  (Finding 1). `t09-abyss` (17200,-8200) sits exactly on the top edge of
  `abyss-int-floor` and resolves out to open water above it — marginal but not
  trapped (verified by reasoning through `resolveCircle`'s on-segment branch).
- `hiddenCreatures.ts` `body.chainCircles` for T-08/09/10/11/27 (data).
  Consumer: `CreatureRenderer.buildVisual` → `buildSpineDef` (
  `src/render/creatureRender.ts:231,235`), which dispatches to the spine
  pipeline for **any** def with `chainCircles.length > 0` and otherwise to the
  small-polygon path. I confirmed the dispatch is fully data-driven and that no
  `src/render/` file changed, so no new renderer architecture was introduced and
  the shape edits cannot create a new code path. The browser probe observed
  `kind=spine nodes=4` on the live T-11, and the 12-test
  `src/render/creatureRender.test.ts` suite is green.
- `tier2Scenario.test.ts` (test-only). No production impact.

Codegraph note: the structural gate was satisfied with
`codegraph_explore` (located `CreatureRenderer`/`buildVisual` in
`src/render/creatureRender.ts`, and the `Simulation.stepCreatures` +
`Terrain.resolveCircle` seam). The codegraph index is known to be thin on
product symbols (WI-01 reviewer note), so I confirmed the specific lines by
direct read of the returned files.

## Independent Adversarial Probes

Probes I designed independently (not the implementer's tests):

1. **Full suite** — `npx vitest run`: 27 files / **205/205 pass**. Confirms the
   implementer's 205/205 claim and that the shape edits did not break any
   existing behavior (tier-1/tier-2 scenarios, creature render, core loop).
2. **Type-check + bundle** — `npm run build` (`tsc --noEmit && vite build`):
   exit 0 (only the informational >500 kB three.js chunk notice).
3. **Spawn-clearance probe** (this is the one that found Finding 1) —
   `scratch/work-item-reviewer/clearance/probe.ts`, run with `npx tsx` against
   the **real** `buildTerrain` + `MACRO_WORLD` + `Simulation`:
   - `buildTerrain(...)` then `resolveCircle({x:17000,y:-5700}, 12)` → returned
     the same point (`moved=false`), proving the collision system considers the
     spawn a valid rest position *inside* the slab (it will not be pushed out).
   - Live `createSimulation(makeSimWorld(), 1)`, player teleported to the
     creature, stepped 220 s: T-31 twilight stays `insideLandmark=true` at
     t=0/51/111/161/220 s and settles at (15512, -5700) — box-walking at the
     interior left wall (15500 + radius 12). It never escapes.
   This probe could falsify the implementation's implicit assumption that all
   tier-2 spawns are in open water; it falsified it for exactly one instance.
   The other 14 tier-2 spawn positions I checked against their chunk slabs by
   direct geometry (all in open water or resolving out of an edge).

## What I Could Not Verify

- **Live browser rendering of the other four tier-2 silhouettes** (T-08, T-09,
  T-10, T-27). The item's verification requires only one representative
  organism's browser spot-check (T-11 — verified above via probe + screenshot).
  §13 "recognizable in two seconds" for the remaining shapes is a presentation
  judgment reserved to the §70 manual layer; I confirmed they are data-driven
  chain shapes on the existing pipeline but did not browser-render each.
- **I did not re-run the implementer's browser probe myself** (it starts a real
  dev server and takes ~2 min). I validated its authenticity instead: it drives
  the real page/sim, every `result.json` value is internally consistent with the
  world data (spawn 14500,-5900) and the def (`+300` hold → -5600), and the
  screenshot shows the expected balloon/bubble silhouette. The probe code and
  `result.json` are committed and reproducible.
- **The 15+ roster floor** is WI-03d's to verify; only 12 creatures exist here.

## Assumptions

- The "designed band" source of truth for spawn placement is `TIER2_BANDS`
  (`hiddenCreatures.ts`), which was landed and reviewed in WI-03b1; I verified
  the `worldData.ts` spawns match it and that it is a faithful mid-depth
  roster distribution (bands 2–4, with T-31 spanning 1–5), consistent with the
  `design_private/` roster. I did not re-derive the band assignment from
  `design_private/` line-by-line; that is WI-03b1's accepted contract.
- "Preferably a friendly one" for the spot-check was satisfied by T-11, the
  passive-lift species (no combat/threat surface) — a reasonable reading.
- §34 cap of 16/chunk/type matches the existing tier-1 cap-check helpers, so I
  treated it as the established value rather than re-deriving a number (the
  request gives "cap ambient creature counts" as a rule of thumb, not a fixed
  value); all tier-2 counts are far below it regardless.
