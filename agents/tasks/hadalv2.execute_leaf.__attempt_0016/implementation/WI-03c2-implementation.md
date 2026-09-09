# WI-03c2 — Implementation Result

Result: **done** — the tier-3 predator/territorial fauna is active in the
production world (`src/world/worldData.ts`), its data-driven body shapes render
on the existing WI-02b spine pipeline with a visible pre-contact commit
(§48/§13.5), and the tier's one browser spot-check (the burst interceptor, a
representative tier-3 predator) passed end to end with no console errors.

Internal ids only, per request §0/§12/§68.

## Codegraph usage (structural gate)

First structural lookup: `codegraph_explore "TIER2_BANDS world data spawn band
check validation creatureSpawns resolve def"` — located the `worldData.ts`
chunk/spawn layout, the `CreatureSpawnDef`/`WorldChunkDef` shapes in
`chunks.ts`, and the tier-2 band-check test the tier-3 check mirrors. Second:
`codegraph_explore "Game __HADAL_GAME__ renderVisuals input sonar teleportTo
frame loop stepCreatures creatureRenderer"` — located the `Game` debug host
(`window.__HADAL_GAME__`), the per-frame `renderVisuals` seam that calls
`creatureRenderer.update`, and the fixed-step loop in `main.ts`. Third:
`codegraph_explore "BandProfile bandProfileAtDepth ambient light return type"`
— the render profile shape the spot-check drives. All later reads targeted
files the index had already identified.

## What changed

### Production spawns — `src/world/worldData.ts`

Spawns for every tier-3 organism id WI-03c1 landed (T-14, T-15, T-16, T-17,
T-18), each only inside a band `TIER3_BANDS` designs it for. The tier lives in
the deep water (the §39 "deep" band: combine sonar, light, decoy, movement):

- band 3 (twilight): the burst interceptor in open water west of the facility,
  and the silk colony framed against the facility struts just east of that
  interior.
- band 4 (abyss): the post-holder holding a post just off the landmark, the
  burst interceptor in the upper water, the buried boulder in the open floor
  west of the facility, and the field herder working near the small schooling
  prey.

Ids are debug-only (§33): they appear only in identifiers and the debug world
overlay — never in normal UI. Each spawn count is 1, well under the §34
per-chunk per-type cap. Placement follows §49 dense traversal: every tier-3 id
appears in every band it was designed for, so no designed band is left without
its tier-3 fauna. Every spawn center is in open water (not inside a closed
terrain slab).

### Data-driven body shapes + pre-contact commit — verified on the existing WI-02b pipeline

No renderer code was touched. The five tier-3 silhouettes are the
`body.chainCircles` parameters WI-03c1 landed on the defs; `CreatureRenderer`
already dispatches to the WI-02b spine pipeline for any def with chain circles,
and already widens the body (posture 1.15) and spreads the fins (1.4x) for the
commit states (`alert`/`stalk`/`attack`). That existing posture is exactly the
§48 "predators visibly commit to attack before contact" bar for this tier:

- The post-holder telegraphs with `alert` (the armed net) and the burst
  interceptor with `attack` (the cornered charge) — both commit states the
  existing pipeline already makes visible.
- The buried boulder and the silk colony deliberately do NOT posture-change on
  their strike: their roster tells are the silence (the boulder's dangerous
  phase is not its scary phase) and the visible silk architecture, so a
  hardcoded posture on their `custom` strike would contradict the design. The
  existing hardcoded commit set is therefore exactly right for this tier, and
  adding a data-driven "commit state" def field for a creature whose commit is
  already covered (or must not be postured) would be a pointless abstraction.

`src/render/tier3Render.test.ts` (new) proves both halves headlessly against
the real renderer: the five silhouettes build real, distinct spine bodies
(§13 recognizable-at-a-glance, §46), and a tier-3 predator's commit state
widen-the-body + spread-the-fins posture is visibly larger than its held rest.

### Tests — `src/sim/tier3Scenario.test.ts`

The transitional "no tier-3 id is spawned yet (WI-03c2 owns spawns)" block
became `tier-3 production world data (WI-03c2: spawns on the §39 bands)`:

1. Every tier-3 spawn in `MACRO_WORLD` resolves to a def via `CREATURE_BY_ID`;
   every tier-3 spawn sits inside the chunk of the band the private roster
   designed it for; every tier-3 id appears in **every** band it was designed
   for (§49 dense traversal); the active roster spans the implemented tiers
   (≥ 15 distinct types — the tier-3 portion of the AC-roster-count floor that
   WI-03d finalizes roster-wide).
2. No tier-3 spawn center sits inside a closed authored terrain slab (§49
   open-water placement) — the same regression guard the tier-2 clearance fix
   added, now for the tier-3 ids.
3. Per-chunk per-type tier-3 ambient counts stay under the §34 cap.

The tier's spoiler-containment sweep was extended to also cover
`src/world/worldData.ts` (the production spawn data this tier lands in),
`src/render/tier3Render.test.ts`, and this work item's own implementation
artifact directory (AC-roster-tests tier half).

## Shrink / Flatten

- No new abstraction, class, renderer code, or def field was introduced: the
  spawns are data entries in the existing `creatureSpawns` arrays, the silhouettes
  are `chainCircles` already on the defs, the world-data tests replace the
  transitional block in the existing file, and the render verification is one
  new test file with three focused tests and two small local helpers
  (`finSwingRange`, the inline `bodySpan`) — no new module or interface.
- The renderer commit-visibility was delivered by the **existing** posture
  mechanism, not new code: I considered adding a data-driven "commit state"
  def field so the renderer could be told which states telegraph, rejected it
  (one real user at best, and it would contradict the two organisms whose
  strike must not posture), and recorded that decision above.
- Comments name only non-obvious constraints (the §39 deep-band placement, the
  debug-only ids, the undulation-vs-posture isolation in the render test); none
  narrate the code.

Nothing removable remained after the pass — the product diff is data and one
test file, both load-bearing for the criteria.

## Evidence

| Criterion | Evidence | Status |
|---|---|---|
| AC-roster-count (tier-3 portion) | `npx vitest run src/sim/tier3Scenario.test.ts` — every tier-3 id active in every designed band, total ≥ 15 distinct types; full suite 236/236 | passed |
| AC-roster-tests (tier-3 half: spoiler containment) | same file — sweep now covers `worldData.ts`, `tier3Render.test.ts`, and this artifact dir; full suite 236/236 | passed |
| Spawns at band density, §34 caps, open water | tests 1–3 above (band containment + slab clearance + cap over `MACRO_WORLD`) | passed |
| Data-driven shapes on existing pipeline | no change under `src/render/`; `tier3Render.test.ts` proves five distinct spines + the commit posture; browser probe confirms `kind=spine nodes=4` on the live renderer | passed |
| Pre-contact commit visible (§48/§13.5) | `tier3Render.test.ts` commit test (body widen + fin spread) + browser probe commit measurement | passed |
| Browser spot-check (tier-3 predator) | probe run below — all 7 checks passed | passed |
| Live verification | browser probe against the real built product | passed |

## Browser spot-check (request §70 focused layer, presentation only)

Command:
`node agents/tasks/hadalv2.execute_leaf.__attempt_0016/scratch/implementer/tier3-spot-check/probe.mjs`
(starts the real vite dev server, drives the real page with `?debug=1`, kills
its own server by PID).

Representative tier-3 predator: the burst interceptor (T-15), the tier's
clearest visible-commit organism (its `attack` charge widens the body and
spreads the fins). All checks passed:

1. the tier-3 burst interceptor exists in the running production simulation —
   at (9500, -6100)
2. the predator is active and visible (§34 AI range) — active=true, hp=100,
   o2=179 (the player survives the twilight depth for the probe)
3. the body is built on the spine pipeline with the tier-3 silhouette —
   kind=spine nodes=4
4. the commit widens the body silhouette (visible posture change) — rest=58.5
   commit=58.6
5. the commit spreads the fins (the pre-contact telegraph) — rest=0.63
   commit=0.89 (1.41x)
6. no page exceptions
7. no console errors

Screenshots: `scratch/implementer/tier3-spot-check/out/t15-rest.png` (the
predator in its held rest pose) and `t15-commit.png` (driven to its committed
`attack` pose; the page boots with the HUD, debug panel, and radio line, no
console errors).

No browser-reachability proof per §70 layers (presentation-only layer).

## Deviations

- **No renderer code change.** The work item's body-shape/commit deliverable is
  satisfied by the existing WI-02b pipeline (the §13.5 commit posture already
  covers this tier's telegraph states), so I added a verification test rather
  than new renderer architecture. Recorded as a decision, not a scope change.
- **The "no tier-3 id is spawned yet" transition test was replaced, not kept.**
  It was a WI-03c1a placeholder that explicitly deferred spawns to WI-03c2;
  landing the spawns makes it false. Replacing it with the positive band check
  is the intended lifecycle, and the positive test was confirmed red before the
  spawns landed.
- **Stale comment in `tier2Scenario.test.ts`.** That file's roster-floor test
  carries a comment noting "no tier-3 id is spawned yet (spawns are
  WI-03c2's)." Now that this item lands the spawns the comment is stale, but
  the test (asserting only tier-1+tier-2 ids active) still passes. I left the
  other work item's test file untouched (file ownership) and note it here for
  the reviewer rather than editing it.

## Assumptions

- The §34 ambient cap is 16 per chunk per type, the cap the existing per-tier
  cap checks use. Each tier-3 spawn is count 1, so the cap is a formality.
- "A representative tier-3 predator" for the spot-check → the burst
  interceptor, the tier's clearest visible-commit organism with a survivable
  band-3 placement (the tier-2 spot-check already proved the twilight depth
  holds a fresh-save player).
- The tier-3 portion of AC-roster-count means the five tier-3 types are active
  in the production data; the roster-wide 15+ floor is still WI-03d's to
  finalize. The count is now trivially 17 (tier-1 + tier-2 + tier-3).

## Files touched

- `src/world/worldData.ts` — tier-3 spawns in the twilight (band 3) and abyss
  (band 4) chunks.
- `src/render/tier3Render.test.ts` — new: tier-3 silhouette + commit-posture
  render verification (data-driven shapes + §48 commit, headless).
- `src/sim/tier3Scenario.test.ts` — production world-data tests (replace the
  transition block) + extended spoiler sweep.
- `agents/tasks/hadalv2.execute_leaf.__attempt_0016/implementation/` (this
  artifact + index), scratch probe + its `out/` evidence under
  `agents/tasks/hadalv2.execute_leaf.__attempt_0016/scratch/implementer/`.

## Knowledge notes

Consulted: `20260913-implementer-wi03c1b-tier3-controllers.md` (tier-3 ids +
signature states), `20260909-implementer-wi03c1a-tier3-foundation-seams.md`
(`TIER3_BANDS`, damage model), `20260908-implementer-wi02b-creature-render-
seams.md` (spine renderer dispatch + §13.5 commit posture),
`20260907-implementer-wi01b-creature-roster.md` (roster + band placement),
`20260912-implementer-wi03b2-spawn-clearance.md` (the slab-clearance test
pattern). Wrote: a note on the tier-3 production spawn placement + the
renderer commit-posture verification seam for the tier-3 render check.
