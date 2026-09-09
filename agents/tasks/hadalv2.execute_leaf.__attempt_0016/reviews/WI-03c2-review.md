# Review: WI-03c2

Status: pass

Work item: `agents/tasks/hadalv2.execute_leaf.__attempt_0016/workitems/WI-03c2.md`
Commit under review: `70b1be0` (base `73ce783`). Product diff = `src/world/worldData.ts`
(spawns) + two test files (`src/render/tier3Render.test.ts` new,
`src/sim/tier3Scenario.test.ts` extended). No renderer or simulation source
changed — consistent with the "no new renderer architecture / no simulation rule
changes" constraint.

Codegraph: first structural lookup
`codegraph_explore "WorldChunkDef band field, depth to band mapping, difficulty
by band, chunk.band"` (projectPath `C:\Temp\hadal-v2`) located the `WorldChunkDef`
shape (`band` = the §4.1 depth-band field) and `bandProfileAtDepth`; a second
`codegraph_explore` on the renderer located `CreatureRenderer`/`buildSpineDef`.
Later reads targeted only files the index had already identified.

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| AC-roster-count (tier-3 portion: ≥15 distinct types active, meeting the private roster's distribution) | passed | Independent count of `creature:` ids in `src/world/worldData.ts` = **17 distinct** (≥15). All 5 tier-3 ids active (T-15×2 bands, others ×1). `tier3Scenario.test.ts` "every tier-3 spawn resolves, sits in a designed band …" passes and checks each id lands in a chunk whose `band` ∈ `TIER3_BANDS[id]` and every id appears in **every** band it was designed for. Full suite 236/236. |
| AC-roster-tests (headless behavior test per major species + no secret name/description outside debug internals & private content) | passed | Signature behavior tests present for all five (T-14/T-15/T-16/T-17/T-18 `describe` blocks in `tier3Scenario.test.ts`, landed by WI-03c1b, passing). Spoiler sweep in `tier3Scenario.test.ts` scans `src/sim|creatures|player/*.ts`, `hiddenCreatures.ts`, `worldData.ts`, `tier3Render.test.ts`, and the three impl notes for the `_spoiler_tokens.txt` names; passes. Independent re-grep of the secret names across the changed files + impl note: **zero** hits. |
| World-data band check (ids resolve, spawn in designed band on §39 curve) | passed | Verified by reading `TIER3_BANDS` (T-14[4], T-15[3,4], T-16[4], T-17[3], T-18[4]) against the actual spawn positions in `worldData.ts`; all in-bounds for their chunk's `band`. Test + build green. |
| §39 curve / §49 dense traversal / §34 cap / §33 debug-only ids | passed | band 3 (mid) = T-15, T-17; band 4 (deep) = T-14, T-15, T-16, T-18 — matches the private roster's band assignment, no designed tier-3 band left empty. Per-chunk per-type cap 16, each spawn count 1 (well under). Slab-clearance test (no spawn inside a closed terrain rectangle). ids are internal `T-14..T-18`, debug-only. |
| Data-driven body shapes on existing WI-02b pipeline (no new architecture) | passed | Silhouettes = `def.body.chainCircles` (from WI-03c1) consumed by `buildSpineDef`; no code added under `src/render/`. `tier3Render.test.ts` proves five **distinct** non-degenerate spines (≥4 nodes, max width >10). |
| Pre-contact telegraph/commit visibility (§48/§13.5) | passed | Renderer (`creatureRender.ts:375-424`) widens body (posture 1.15) + spreads fins (1.4×) for `alert`/`stalk`/`attack`. `tier3Render.test.ts` commit test (T-15 `attack` vs `wander`): commit span > rest span, commit fins > rest fins × 1.2 — would fail if the posture were removed. |
| One browser spot-check, no console errors | passed | `scratch/.../probe.mjs` drives the real `npm run dev` page (`?debug=1`) with headless Chromium; `out/result.json`: all 7 checks pass (T-15 present at (9500,-6100), active/visible, `kind=spine nodes=4`, commit body widen + fin spread 0.63→0.89, no page exceptions, no console errors). `t15-rest.png`/`t15-commit.png` are real 1920×1080 shots; the commit shot shows a clean boot (HUD, debug panel, radio line). |

## Verification I ran

- `npm run build` (`tsc --noEmit && vite build`) → exit 0 (the >500 kB chunk
  notice is the three.js bundle, informational).
- `npx vitest run` → **30 files / 236 tests passed** (incl. `tier3Scenario.test.ts`
  23 tests, `tier3Render.test.ts` 3 tests).
- Independent id/distribution count, secret-name re-grep, commit-hygiene check
  (below).

## Findings

No blocking findings. The implementation meets every acceptance criterion and the
item's own "Tests and checks" / deliverables, with real evidence for each.

Two non-blocking observations (neither is a defect in this work item, neither
requires a re-pass):

1. **Stale comment in another work item's test file.**
   `src/sim/tier2Scenario.test.ts:124-126` still says "no tier-3 id is spawned
   yet (spawns are WI-03c2's)" inside its §11.1 roster-floor test. The comment is
   now factually stale, but the test logic only asserts the 12 tier-1+tier-2 ids
   are active and `active.size >= 12` (which holds at 17), so it still passes.
   The implementer correctly left it (file ownership belongs to WI-03b2) and
   flagged it in the implementation note. A WI-03d roster-wide pass is the
   natural place to clean it up; it does not affect this item's correctness.
2. **The "commit widens the body" browser signal is small** (rest=58.5,
   commit=58.6 ≈ +0.2 %). That measurement is the max body-vertex radius, which
   is dominated by the body length, so the 1.15× width posture barely moves it.
   The unambiguous pre-contact telegraph is the **fin spread** (0.63 → 0.89,
   1.41×), which is the value the headless test's strict `>` assertions and the
   probe both rely on. Not a defect: the §48 "visibly commit before contact"
   bar is carried by the visible fin spread, and the body widen is secondary.

## Design decisions I accepted (documented by the implementer, consistent with
the private roster)

- **No renderer code change / no data-driven "commit state" def field.** The
  §48 telegraph for the tier is delivered by the existing `alert`/`stalk`/
  `attack` posture (body widen + fin spread). Adding a per-def "commit state"
  field would have a single real user and would contradict the two organisms
  whose strike must *not* posture — so rejecting it is the boring-code-correct
  call.
- **T-16 (buried) and T-17 (silk) do not posture-change on their `custom`
  strike.** Per the private roster, T-16's danger is sudden (silence is the tell;
  §11.1 "dangerous-phase-not-scary-phase") and T-17 trips on noise via its silk —
  so a pre-contact posture telegraph on those two would contradict the design.
  The §48 commit is demonstrated on the representative (T-15) and on T-14's
  `alert`. This is a content decision, not a rendering gap this item must close
  (no new renderer work is in scope).

## Impact Check

- `TIER3_BANDS` (`src/content/secret/hiddenCreatures.ts:609`) — read directly;
  it is consumed only by the tier-3 world-data test, so the band assertions are
  against the same table the roster declares.
- `worldData.ts` spawn additions — pure data appended to the `twilight` and
  `abyss` chunks' `creatureSpawns`. These arrays feed `makeSimWorld()` → the
  `Simulation` constructor, which resolves every `creature` id against
  `CREATURE_BY_ID` and throws on an unknown one (verified: the production
  constructor test passes). No other caller reads the spawn arrays by band, so
  the new entries only add five active organisms.
- `creatureRender.ts` / `spineRenderer.ts` — read to confirm the commit posture
  is state-driven and `buildSpineDef` is `chainCircles`-driven; **not modified**
  in this commit, so no renderer caller is affected.
- `tier3Scenario.test.ts` transition block replaced — the removed
  "no tier-3 id is spawned yet (WI-03c2 owns spawns)" assertion is exactly what
  this item falsifies; the positive band check replaces it (implementer recorded
  it was confirmed red before the spawns landed). No other test depends on that
  removed block.

## Independent Adversarial Probes

- **Band/distribution re-count (independent of the test).** Parsed
  `creature:` ids straight out of `worldData.ts`: 17 distinct types; T-14×1,
  T-15×2, T-16×1, T-17×1, T-18×1. Cross-checked each spawn's x/y against its
  chunk's `bounds` rect and `band` (twilight band 3: x 8600..19000, y -8000..
  -4800; abyss band 4: x 13600..24000, y -10000..-7600). Every tier-3 spawn is
  in-bounds for its chunk's `band`, and that `band` ∈ `TIER3_BANDS[id]`. This
  distinguishes "chunk is labeled band 3" from "spawn actually sits in band 3".
- **Secret-name leak re-grep (independent of the sweep).** Searched the protected
  tokens (Wardens, Hounds, Ambush, Snare-moths, Flusher, Mace-bearers, Wound,
  Underside, Metamorphs, "quiet horror", "relieved grief") across the three
  product files and the implementation note: zero hits. The descriptive role
  labels the note uses ("burst interceptor", "silk colony", "post-holder",
  "buried boulder", "field herder") are the internal debug vocabulary, not the
  roster's secret names, so their presence is allowed.
- **Commit hygiene.** `git show --name-only 70b1be0` — no `state.md` staged;
  3 product files + artifact/scratch files only. The scratch probe is bounded
  (per-wait timeouts, kills its own dev server by PID) and its `out/` evidence
  (result.json + two real PNGs) is committed.
- **Render test not vacuous.** Read the posture path (`creatureRender.ts:375-424`):
  the body width and fin swing are scaled only inside the `alert`/`stalk`/
  `attack` branch, so the test's `commit > rest` assertions would fail if that
  branch were removed — the test cannot pass against a renderer that lacks the
  commit posture.

## What I Could Not Verify

- **Aesthetic "recognizable in two seconds" of each silhouette in a real
  desktop browser at 1080p.** §13's two-second-recognition bar is a subjective
  visual judgment reserved for the §70 manual layer; the headless test proves the
  silhouettes are distinct and non-degenerate, and the spot-check proves one
  renders on the spine pipeline, but I did not (and this unattended role cannot)
  do a timed human glance at all five. The roster-wide visual pass is WI-03d /
  §70's.
- **Live T-16/T-17 commit rendering in the browser.** The spot-check covered the
  representative T-15 only (the item specifies one browser spot-check). I verified
  T-16/T-17's *intent* (no posture on `custom` strike) against the private roster
  and the renderer code, but did not drive a live page for their `custom` strike
  visuals; those are not in this item's rendering scope.
- **The full §70 checklist** (boot→core loop→progression→save→ending) is out of
  scope for this presentation-only tier; I only confirmed the page boots clean
  with no console errors, which is the §70 layer this item claims.
