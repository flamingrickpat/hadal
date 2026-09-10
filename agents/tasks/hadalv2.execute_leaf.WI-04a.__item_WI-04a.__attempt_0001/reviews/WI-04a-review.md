# Review: WI-04a — Authored spectacle beats

Status: findings

Reviewer session: fresh `work_item_reviewer` dispatch for
`hadalv2.execute_leaf.WI-04a.__item_WI-04a.__attempt_0001`. Reviewed commit
`0df131a` ("[world][triggers] author five encounter beats") against the work
item `workitems/WI-04a.md`, the ST-04 story plan, and the original request
(sections 3, 11.4, 36, 61, 67, 68, 70). The private reveal map from WI-01c
(`design_private/encounter_beats.md`, gitignored) was read to verify slot
assignment; per the ST-03/WI-01c audit rules it is referenced here by slot id
(S1..S5) and internal roster id (T-NN) only, never quoted.

## Contract before the diff (Phase 0)

Done for this item means: 5+ data-driven `EncounterTrigger` beats in the
production world data, staged at the reveal map's spectacle slots around the
stable ST-03 roster ids, each with (a) authored timing, (b) an entrance,
(c) an environmental reaction, (d) an available escape path; each beat sets
one completion story flag that the WI-04c reactions gate on; player control
preserved, no long cutscenes (§67); no new trigger vocabulary unless a beat is
impossible with the §36 set (any addition minimal, unit-tested, noted).
Verification: one headless scenario per beat from a fresh save (timing window,
entrance, reaction in sim, physical escape without noclip), `once` semantics,
same-seed determinism, plus a browser check that the beats fire in sequence
in the live game (the cross-child proof of "inside live gameplay").

The work item's `moveBackgroundCreature`-driven entrances, the `camera`
entrance option, and the "flag the reactions gate on" handoff are the
contract's load-bearing points — the implementer's own tests all run on the
`Scenario` construction path, so the live `Game` construction path was the
primary substitution risk to probe (it was).

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| AC-enc-beats: 5+ authored beats fire through the trigger system inside live gameplay | passed | Re-ran `npx vitest run src/sim/beatScenario.test.ts` (7/7, real `Simulation`, ~200 s) and the full suite `npx vitest run` (282/282). Independently ran a live-page browser probe (below): all five beats fire through the real `TriggerSystem` in the actual game page, in sequence (first-fire sim times 1.9 < 3.9 < 5.8 < 6.9 < 8.9), no console errors. |
| …each with authored timing | passed | Each scenario asserts the beat did not fire before its depth/region/approach line and did fire at it (s3/s4 also assert authored order). Live probe: s1 not fired before shelf entry; s2 not fired above its line; s3 fires without pulling s4. |
| …entrance | passed | s1/s2/s5 assert the roster organism repositioned to its authored spot; s3/s4/s5 assert the camera modifier is in the sim. Live probe observed the repositionings on screen: T-03 at (8524,-3484), T-09 at (11000,-4800), T-22 x 22882→21220, T-25 x 22985→22079 (screenshots `s1-shelf.png`, `s5-strip.png`). |
| …environmental reaction present in the sim | passed (sim state) | Each scenario asserts the audio cue + ambient param in `triggerState`; live probe re-asserted all five. Note: in the current build the camera/ambient/audio params have no render/audio consumers yet — their visual/audio realization is the ST-06 art/audio pass (root plan: ST-06 depends on ST-04; this work item's subsystem list has no rendering ownership). The reaction currently visible in the live game is the organism repositioning. Recorded as an assumption, not a finding. |
| …available escape path (no noclip) | passed | Every scenario physically swims the escape to a safe region (coast for s1; twilight floor gap for s2–s5) with pure steering + collision, asserting the player arrived alive. |
| `once` semantics | passed | s1 scenario re-enters the shelf; cue and flag do not re-fire. |
| Determinism | passed | Same seed, full route, run twice → identical beat order and timing (re-ran; green). |
| Deliverable: each beat sets one completion story flag the WI-04c reactions gate on | **failed in the live game** | Finding 1. The flag is set, but on the live construction path it lands in an orphaned array that neither the save nor the trigger context reads; the headless scenarios (and the implementer's evidence table) only cover the other path. |
| §67 compliance | passed | All beats are `once` data triggers with scripted timing/entrance/reaction; no beat locks a path (data-shape test); player control verified live (1 s of thrust moved the player after the beats); no cutscene machinery — beats fire mid-gameplay. |
| No new trigger vocabulary without justification | passed | One addition: `approachCreature` + `creatureDistance` ctx field. Justified — the region the player occupies in the deep strip resolves to the shallower band's region (first-match chunk containment, `chunkContaining` in `src/world/chunks.ts:120`; abyss bounds y -10000..-7600 contain the hadal strip y -10000..-9600 and the abyss chunk comes first in array order), so `enterRegion`/`timeInRegion` cannot key to the east-end beat, and a `reachDepth` line would fire at strip entry, not at the approach. Unit-tested with boundary semantics (901 no-fire / 900 fire) in `triggers.test.ts`; noted in the implementation artifact and a code comment. |
| Spoiler rules (§0/§68) | passed | Scanned all 66 tokens in `design_private/_spoiler_tokens.txt` against the commit diff: only internal T-NN ids match, which the token file's own header excludes from the whole-tree scan ("T-IDs are tracked here but excluded from the whole-tree scan"); no creature-name or lore tokens. Beat ids (`enc-beat-s1..s5`), flags (`beat-s1..s5`), and cue ids are internal only; commit message is spoiler-safe. |

## Findings

### 1. Beat completion story flags are orphaned on the live game's load path

**Location:** `src/sim/Simulation.ts:341` (constructor wires
`this.triggerState.storyFlags = this.storyFlags`), `src/sim/Simulation.ts:1570`
(`loadFromSave` re-assigns `this.storyFlags = [...save.world.storyFlags]`),
`src/game/Game.ts:65` (the live game always calls `loadFromSave` at boot).

**What is wrong:** after `loadFromSave`, `sim.storyFlags` and
`sim.triggerState.storyFlags` are two different arrays. Every
`setStoryFlag` action (triggers.ts:167) pushes to `triggerState.storyFlags` —
the constructor's array — while the live game's `sim.storyFlags` is the
re-assigned save array. Consequences, verified in the real page:

- `toSave()` (`src/sim/Simulation.ts:1544`) serializes `this.storyFlags`, so
  the beat completion flags are **not persisted in the save**.
- `TriggerContext.storyFlags` (`src/sim/Simulation.ts:1286`) is built from
  `this.storyFlags`, so the reaction layer (WI-04c, which per the ST-04 plan
  "reads the completion story flags their triggers set") **cannot see the beat
  flags** through either natural seam.
- The divergence is pre-existing code (this commit does not touch either
  line), but WI-04a is the first work that makes these flags load-bearing, and
  the constructor comment at :338 documents the intended sharing
  ("the `storyFlags` array is shared so fired flags persist in the save") that
  the load path breaks. The same split also makes the base-return radio line
  index (:1429, `BASE_RETURN_LINES[this.storyFlags.length]`) diverge between
  the live game and the scenario path.

**Why the implementer's tests missed it:** every scenario constructs the
`Simulation` directly (`new Simulation(world, seed)` via `Scenario`), where
the shared-reference invariant holds. The live `Game` path (construct +
`loadFromSave`) is never exercised for trigger flags — `coreLoop.test.ts`
uses `createSimulationFromSave` but asserts nothing about story flags.

**Evidence (mine, reproducible):**

- Live-page browser probe (below), after firing all five beats:
  `sim.storyFlags = ["base-line-0","base-line-1","base-line-2"]` vs
  `triggerState.storyFlags = ["descended","beat-s1","abyssal-reached","deep-reached","beat-s2","beat-s3","hadal-reached","beat-s4","beat-s5"]`.
- Deterministic headless repro (red until fixed):
  `npx vitest run --config agents/tasks/hadalv2.execute_leaf.WI-04a.__item_WI-04a.__attempt_0001/scratch/work-item-reviewer/wi04a-flag-repro/vitest.config.ts`
  — test 1 (fresh construction, the scenario path) passes; test 2 (the live
  `createSimulationFromSave` path) asserts the split and the missing flag.

**What would satisfy the contract:** in `loadFromSave`, preserve the array's
identity (mutate `this.storyFlags` in place instead of re-assigning) or
re-point `this.triggerState.storyFlags` after the re-assignment; and add a
regression test that fires a `setStoryFlag` trigger through the live path
(`createSimulationFromSave`) and asserts the flag is visible in
`sim.storyFlags` and in `toSave().world.storyFlags`. The repro test above is
written against the product API and is directly reusable.

## Impact Check

- codegraph `codegraph_explore` (projectPath `C:\Temp\hadal-v2`):
  `TriggerState` — 6 callers in `src/sim/Simulation.ts` + `triggers.ts`;
  `TriggerSystem` — 4 callers in `Simulation.ts`, covered by `triggers.test.ts`;
  `applyAction`/`conditionMet` — module-private, single caller each.
- `movedCreatures` shape change (`string[]` → `{creatureId, to}[]`): rg across
  the repo shows exactly three consumers — written in `triggers.ts:151`,
  consumed/cleared in `Simulation.ts:435-442`, asserted in
  `triggers.test.ts:180`. No save field, no renderer, no other reader — the
  shape change is safe.
- `creatureDistance` context field: only producer is `Simulation.ts:1288-1292`
  (live distance to the roster organism); only consumer is the new
  `approachCreature` condition. No other caller affected.
- World data change is additive: five `EncounterTrigger`s appended to the
  shelf/abyss/hadal chunk `triggers` arrays; no existing trigger, spawn, or
  terrain touched. Roster ids referenced (T-03, T-09, T-22, T-25, plus T-20
  and T-23 in comments only) all exist as production `creatureSpawns`
  (`worldData.ts:288,360,459,566,564,565`).
- Slot assignment vs the private reveal map: S1 (shelf band) stages the
  light-school + driver pair; S2 (mid-depth of the abyss band, depth 9300)
  stages the structure-bound organism; S3 (strip entry, 9550) stages the
  sonar-arc framing beside the fixed-point organism at (19100,-9650); S4
  (strip entry line, 9640) stages the colossal-crossing framing — its
  "presence through fauna" element interlocks with the T-23 ST-03 crossing
  behavior, which starts when a diver is within 2500 units
  (`Simulation.ts:188`, player is ~2200 west of T-23 at strip entry, so the
  fauna-announcement signals fire as the beat lands); S5 (strip east end)
  stages the plate-cluster crossing via the approach radius. All five slots
  carry the organisms the reveal map assigned. No creature controller or AI
  code was changed (constraint honored).
- Re-runs performed by the reviewer: `npx vitest run` (34 files, 282 tests,
  all green), `npx vitest run src/sim/beatScenario.test.ts --reporter=verbose`
  (7/7), `npm run build` (exit 0; the >500 kB chunk notice is informational
  per BUILD.md).

## Independent Adversarial Probes

Both probes are committed under
`agents/tasks/hadalv2.execute_leaf.WI-04a.__item_WI-04a.__attempt_0001/scratch/work-item-reviewer/`
and were designed independently of the implementer's tests.

1. **`wi04a-beats-live/` — live-page browser probe** (the browser check the
   implementer did not run). Node + `playwright-core`, real
   `npm run dev` page at 1920×1080 in a fresh browser profile (fresh save),
   SwiftShader GL. Boots `http://localhost:5223/?debug=1`, then positions the
   player with the request §33 debug teleport (a development measurement
   channel; the physical no-noclip route is the headless scenarios' job) and
   lets each beat fire through the live simulation, reading live sim state via
   `window.__HADAL_GAME__.sim`. 36 checks: 31 pass — boots clean, s1 fires on
   shelf entry (not before), s2 at its depth line, s3 at its line without
   pulling s4, s4 at its line, s5 inside its approach radius; every beat's
   audio cue + ambient params present in the live sim; camera modifiers
   wide/tight/pullback in the live sim; the authored organisms repositioned on
   screen; the five first-fire sim times strictly increase s1→s5; player
   control preserved (1 s of thrust moved the player after the beats); zero
   console errors and zero page exceptions. The 5 failing checks are all
   "completion flag set in `sim.storyFlags`" — Finding 1.
   Command (from the repo root, after `npm install` in the probe folder):
   `node agents/tasks/hadalv2.execute_leaf.WI-04a.__item_WI-04a.__attempt_0001/scratch/work-item-reviewer/wi04a-beats-live/probe.mjs`
   (installs its own `playwright-core`; watchdog 240 s). Result artifacts in
   `wi04a-beats-live/output/` (`result.json`, `console.json`, `server.log`,
   screenshots `s1-shelf.png`/`s2-abyss.png`/`s4-strip.png`/`s5-strip.png`).
   This probe could falsify "the beats fire inside live gameplay": it drives
   the real page, not the harness.
2. **`wi04a-flag-repro/flagRepro.test.ts`** — two-test headless repro through
   the product API: fresh-construction path (flag visible in
   `sim.storyFlags`, same reference) vs live load path (`createSimulationFromSave`;
   arrays split at boot, flag only in the orphaned array, absent from
   `toSave()`). Both tests currently pass, i.e. the split is confirmed and
   red-stable for the fix. Command in the Finding 1 block above.

## What I Could Not Verify

- The aesthetic judgment that the beats "read as authored moments" beyond the
  state-level evidence — the §70/§14.3 visual pass is manual in a real desktop
  browser; the SwiftShader screenshots are mechanical evidence (real scene
  rendered, creatures at their authored spots), not a taste check.
- Actual audible output of the beat audio cues and visible camera zoom:
  `AudioSystem`/`Renderer` do not consume `triggerState.audioCues` /
  `cameraModifier` / `ambient` yet (rg-verified: no consumers outside the
  trigger state). That realization belongs to the ST-06 art/audio pass per
  the root plan; no ST-04 child owns it, so it is not charged against this
  item.
- The 90–120 minute playthrough pacing that places each beat at its timeline
  minute slot — the beats sit at the bands the reveal map assigns; minute
  placement is an emergent property of a full blind playthrough (ST-08 phase).
- The WI-04c reaction gates themselves — not implemented yet; Finding 1 is
  exactly the handoff condition they depend on.

## Assumptions

1. **Debug-teleport placement in the browser probe.** The work item's browser
   check asks that the beats "fire in sequence in the live game"; it does not
   require a full physical swim in the browser (that is proven headlessly,
   no noclip). The §33 debug panel exists precisely as a development
   measurement channel, and prior reviewer browser probes in this project are
   short and targeted rather than swim routes. If the controller reads the
   browser check as requiring a live physical swim, the probe must be
   re-scoped — I judged that reading unlikely given §33 and the project's
   established probe convention.
2. **Presentation realization is ST-06's, not this item's.** Rationale: root
   plan ordering (ST-06 "full art/audio pass" depends on ST-04), the work
   item's subsystem list (trigger system / world content data / headless
   scenario tests — no rendering), and rg evidence that no render/audio
   consumer for the presentation params exists anywhere in the current
   product code. What would have to be true for this to be wrong: an ST-04
   child or this work item explicitly owning camera/audio wiring — none does.
3. **S4 staging interlocks with ST-03 behavior rather than re-implementing
   it.** The reveal map's S4 staging intent ("presence through fauna") needs
   local fauna to change behavior at once; the work item forbids creature
   controller changes and instructs that a beat needing new creature behavior
   be reported as a defect. The implemented beat instead keys its authored
   framing/reaction to the strip-entry depth line, where T-23's existing
   crossing behavior (start range 2500 > the ~2200 unit player distance) is
   already announcing itself through the fauna signals — so the staging intent
   is met by interlock, not by new creature behavior. I judged this an
   acceptable reading of "staged around stable ST-03 roster ids and state";
   the rejected alternative (bulk `moveBackgroundCreature` repositioning of
   all local fauna) would fake a behavior change with a teleport, which the
   grammar does not ask for.
4. **Reveal-map verification by id only.** The private file was read (reviewers
   are permitted by the ST-03 plan) and its slot assignments were checked,
   but per the WI-01c/ST-03 audit rules this report and the project note
   reference only slot ids (S1..S5) and internal roster ids (T-NN), never the
   private names or descriptions.

## Revision — Review attempt 2 (2026-09-10, fresh `work_item_reviewer` session)

Status: pass

Reviewed the implementer's fix commit `c443d54` ("[sim][save] keep beat story
flags on the live load path") against Finding 1 of this report. Everything the
attempt-1 review verified and passed (five authored beats, timing windows,
entrances, reactions, no-noclip escapes, `once` semantics, determinism, §67
compliance, the justified `approachCreature` addition, slot assignment,
spoiler containment) stands — the fix commit changes no world data, no trigger
vocabulary, and no creature code. This revision re-verified the load-bearing
claims by running them, and re-ran the browser proof owner of AC-enc-beats
post-fix.

### Fix verified

- **Code** (`src/sim/Simulation.ts:1574-1575`): `loadFromSave` now restores the
  save's flags in place (`this.storyFlags.length = 0; push(...)`) instead of
  re-assigning, preserving the identity the constructor shared with
  `triggerState.storyFlags` (wired at `:341`). The comment documents the
  invariant. This is the fix suggested by Finding 1, option one, and it is the
  minimal change.
- **New product regression test** `src/sim/storyFlagLoadPath.test.ts` (2
  tests): run by the reviewer — **2/2 green in 21 ms**. Test 1 mirrors the
  live `Game` boot exactly (`createSimulationFromSave` = `createSimulation`
  + `loadFromSave`, verified against `Game.ts:63-65`), asserts array identity
  and that a live-fired `enc-beat-s2` flag reaches both `sim.storyFlags` and
  `toSave().world.storyFlags`; test 2 round-trips a saved flag plus a newly
  fired flag.
- **Independent falsification of the fix (my own probe from attempt 1):**
  re-ran the attempt-1 defect-asserting repro
  (`scratch/work-item-reviewer/wi04a-flag-repro/`, command in Finding 1).
  Post-fix: test 1 (fresh path) still green; test 2 (which asserts the split
  existed) now **fails exactly at the identity assertion**
  (`flagRepro.test.ts:33`, "expected [] not to be []") — the two arrays are
  once again the same object. This confirms the fix changed live-path
  behavior, not just the test file.
- **Regression scope:** `npx vitest run src/sim/beatScenario.test.ts` —
  **7/7 green** (reviewer re-run, ~199 s); `npx vitest run` — **35 files /
  284 tests, all green** (reviewer re-run, ~202 s); `npm run build` —
  **exit 0** (>500 kB chunk notice informational per BUILD.md).
- **Browser check post-fix (final proof owner of AC-enc-beats):** re-ran my
  own attempt-1 live-page probe
  (`scratch/work-item-reviewer/wi04a-beats-live/probe.mjs`, same command as in
  the attempt-1 section; real `npm run dev` page, 1920×1080, fresh browser
  profile, SwiftShader GL, watchdog 240 s): **all 36 checks green** (attempt
  1: 31/36). The five previously-failing "completion flag set in the live
  sim" checks now pass — they read `sim.storyFlags`, the array `toSave()`
  persists and the `TriggerContext` is built from. The probe's evidence line
  now shows `sim.storyFlags` and `triggerState.storyFlags` identical in the
  live game: both
  `["descended","beat-s1","base-line-2","abyssal-reached","deep-reached","beat-s2","beat-s3","hadal-reached","beat-s4","beat-s5"]`
  (the pre-fix split — three base lines vs nine trigger-state flags — is
  gone). Beats still fire in the authored sequence s1..s5 (first-fire sim
  times 1.9 < 3.8 < 5.7 < 6.9 < 8.7), player control preserved, zero console
  errors, zero page exceptions. Fresh `output/` artifacts committed with this
  revision (the attempt-1 outputs remain in git history at `b538e3d`).

### Updated acceptance verdicts

| Criterion | Verdict | Evidence checked |
|---|---|---|
| Each beat sets one completion story flag (`setStoryFlag`) the WI-04c reactions gate on and the scenario assertions record | **passed** (was: failed in the live game) | The flag is now visible on the live path in `sim.storyFlags` (the `TriggerContext` source at `Simulation.ts:1286`) and in `toSave().world.storyFlags` (persistence at `:1544`) — proven headlessly by the new product regression test (reviewer re-run, 2/2) and in the live game by the reviewer's re-run browser probe (36/36). The WI-04c gating seam (the `TriggerContext.storyFlags` set) now contains the beat flags on both construction paths. |
| AC-enc-beats (all other lines) | passed | Unchanged by the fix; re-verified by the reviewer's own re-runs listed above (scenarios 7/7, suite 284/284, build exit 0, live probe 36/36). |

### Impact check (attempt-2 delta)

- `loadFromSave` callers (codegraph + rg): `Game.ts` (boot, the live path)
  and `createSimulationFromSave` (the test mirror of that boot). Both are
  exactly the paths the regression test drives. No other caller.
- `storyFlags` consumers in product code: `src/game/save.ts` (save-format
  type), `src/sim/Simulation.ts` (context build `:1286`, base-return radio
  `:1429-1431`, `toSave` `:1544`, the fix `:1574-1575`),
  `src/world/triggers.ts` (`setStoryFlag` push at `:167`). No code holds a
  pre-load reference to the array, so the in-place restore changes no other
  behavior.
- `pushNextStoryLine` (`:1428-1433`): the base-return radio index
  `BASE_RETURN_LINES[this.storyFlags.length]` now counts beat flags in the
  live game — this **matches the scenario path, where sharing always held**
  (the attempt-1 finding called out exactly this divergence). The line is
  guarded (`if (line === undefined) return;`), so table exhaustion cannot
  throw.
- Attempt-2 product diff is exactly `src/sim/Simulation.ts` (the 5-line
  fix + comment) and the new `src/sim/storyFlagLoadPath.test.ts`; no
  `state.md`, no world data, no creature/controller/AI code, no new trigger
  vocabulary.

### Spoiler containment (attempt-2 delta)

Scanned the `c443d54` diff against `design_private/_spoiler_tokens.txt`
(62 non-comment tokens): the only matches are internal roster ids T-03,
T-22, T-25, which the token file's own header excludes from whole-tree
scans. Commit message is spoiler-safe. The five beat/flag ids remain
internal-only.

### What I could not verify (unchanged from attempt 1)

- The aesthetic judgment that the beats "read as authored moments" beyond
  state-level evidence (manual visual pass in a real desktop browser).
- Visual/audio realization of the camera/audio/ambient params (the ST-06
  art/audio pass; no consumer exists yet — recorded as assumption 2, not a
  finding).
- The 90–120 minute playthrough pacing that places each beat at its timeline
  minute slot (emergent, ST-08 phase).
- The WI-04c reactions themselves (not implemented); the handoff condition
  they depend on — beat flags visible through the trigger context on both
  construction paths — is now satisfied and proven.

### Assumptions (attempt 2)

None new. Attempt-1 assumptions 1–4 carry over unchanged.
