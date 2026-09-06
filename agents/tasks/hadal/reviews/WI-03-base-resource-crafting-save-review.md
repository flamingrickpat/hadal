# Review: WI-03-base-resource-crafting-save

Status: findings

## Contract Established (before looking at the diff)

"Done" for this work item (per the spec + request) means:

- A tiny surface base with the §5 stations, one harvestable material, one
  craftable O2/propulsion upgrade (a real `EquipmentDef`), single-number cargo,
  death/respawn at the base, a versioned `SaveGameV1` `localStorage` save with
  graceful malformed-save handling, and an extended hidden debug panel — such
  that **the player can dive, gather, surface, craft, and go farther** in the
  browser.
- The §30/§70 verification core: a Node-importable `Simulation` shared by the
  browser and every headless scenario (no second sim/collision), a reusable
  `Scenario` harness with seed/time/position/input/assertion failure traces, the
  continuous 9-step core-loop scenario, separate death/insufficient/blocked
  scenarios, and a distinct headless (`npm test`) vs. browser command.

The work item's own acceptance table assigns several criteria to **manual
(browser)** evidence: base stations usable, harvest+craft+capability in the
browser, refill/save on return, death/respawn, and the debug panel. Those
require the browser game to actually boot.

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| Tiny surface base + §5 stations; no large hub | **partial** | Data is correct (`worldData.ts BASE`, radius 260, all 5 stations) and the sim uses it (core-loop returns to `BASE.position`). But the browser does not boot (Finding 1), so "stand on platform; all stations usable" cannot be observed. |
| One core material harvestable (swim + `E`); first O2/propulsion upgrade craftable, one click | **partial** | Headless passes (core-loop step 3/5; `CraftingSystem` tests; `salvage` nodes in `worldData`). The browser menu (`menu.ts`) submits a craft via `controller.input.craftRequest`. Browser unverifiable (Finding 1). |
| Return to base refills O2/health, saves, banks, updates 1–2 story lines; turnaround < 30 s | **partial** | Headless passes (`onBaseReturn` banks + `requestAutosave` + `pushNextStoryLine`; meters refill within `SURFACE_REFILL_DEPTH`). Browser autosave adapter (`Game.update` → `saveToStorage`) unverifiable (Finding 1). |
| Craftable upgrade changes a real capability and is a real `EquipmentDef` | **pass** (headless) | `content/recipes.ts` recipes are `EquipmentDef`s (reused, not cloned); `applyEquipment` mutates `o2Max`/`speedMult`/`capabilities`; `CraftingSystem.test.ts` + core-loop assert the change. |
| Single cargo capacity number; permanent key objects do not consume cargo | **pass** | `Player.cargo` is one `capacity` number; `updateCargo` counts carried resources, banked + equipment do not. Verified in `Simulation.ts`. |
| Death respawns at base, keeps upgrades + discoveries, loses a modest fraction of unbanked | **pass** (headless) | `Simulation.respawn` (base position, O2/health refill, keep equipment/banked, drop `DEATH_RESOURCE_LOSS_FRACTION` 0.3 of carried); `scenarios.test.ts` death scenario. |
| Versioned `SaveGameV1` in `localStorage`; autosaves on base return/unlock; malformed save resets or backs up | **pass** (headless) / **partial** (browser) | `save.ts` round-trips, `version: 1`, key `hadal.save.v1`, backup `hadal.save.v1.bak`, typed `SaveParseError`, `loadFromStorage` reset+backup; `save.test.ts` 11 tests. Browser autosave path unverifiable (Finding 1). |
| Debug panel (`?debug=1` / backtick+F2) exposes noclip, teleport-to-chunk, give resources, reset save; no creature names/secret text in normal UI | **partial** | `debug.ts` `DebugPanel` has all four (noclip, chunk teleport, give resources, reset save) + 4 Hz readout; toggle is backtick/F2/`?debug=1` (the request's suggested default). But the panel cannot be observed in the browser (Finding 1). |
| §30 simulation boundary: Node-importable; one sim used by browser + every headless scenario; player actions as data; no second sim/collision | **partial** | The sim core is genuinely Node-importable (verified, no browser globals) and shared; player actions are data (`toolSelect`/`craftRequest` one-shots); no second sim/collision path. **But** the browser frame loop no longer uses an accumulator (Finding 2) and the browser does not boot (Finding 1), so "used by the browser game" is not actually working. |
| §70 reusable scenario harness (fixed steps, input sequences, assertions, concise failure traces) | **pass** (headless) | `scenario.ts` `Scenario`; `swimTo`/`steerToward` select inputs only (no position assignment); `trace` = seed/time/pos/input/assertion; the failure-trace test asserts each field. |
| §70 9-step continuous core-loop as one scenario over the production world/spawn | **pass** (headless) | `coreLoop.test.ts` steps 1–9 with assertions at 3,5,6,7,9; no teleport/noclip/free materials. |
| Separate scenarios: death, depleted, insufficient, blocked route | **pass** (headless) | `scenarios.test.ts` (all four present and passing). |
| Separate documented commands: `npm test` headless once + status; browser a distinct command | **partial** | `npm test` = `vitest run` (headless, exit 0, verified). `test:browser` = `vite build` — a build, **not** a browser test (Finding 3). |

## Findings

### Finding 1 (critical): the browser does not boot — `#app` vs `#game` container mismatch

`src/main.ts:7` constructs the renderer from
`document.getElementById('app')!`, but `index.html:27` only defines
`<div id="game">`. There is no `#app` element, so `document.getElementById('app')`
returns `null`; the non-null `!` silences the TypeScript error and the build
passes, but at runtime `Renderer`'s constructor (`src/render/Renderer.ts:40`,
`container.appendChild(this.gl.domElement)`) throws
`TypeError: Cannot read properties of null (reading 'appendChild')`.

Verified with an independent headless-Chromium probe
(`agents/tasks/hadal/scratch/work-item-reviewer/WI-03/probe.mjs` driving the
real `npm run dev` page): the page throws that exact error, and the canvas,
`#hud-root`, and `#debug-panel` are all absent. The game renders nothing and is
unplayable.

Consequence: every "manual (browser)" acceptance criterion (base stations
usable, harvest+craft in the browser, refill/save on return, death/respawn,
debug panel) is unverifiable, and the work item's stated Goal — "the player can
dive, gather, surface, craft, and go farther" — is **not** met in the browser.
The headless core is fine; the browser adapter is broken. The fix is a one-line
reconciliation (`main.ts` → `getElementById('game')`, or `index.html` →
`<div id="app">`), then re-verify in a real browser.

Note: the implementer's "Live Or External Verification" claims "no
headless-Chromium or Playwright harness is installed in this environment." That
is not accurate here: `BUILD.md` "Delivery Verification Capabilities" documents
the ms-playwright Chromium binary, and the WI-01/WI-02 scratch probes used
`playwright-core`. The boot break was catchable in this environment and was not
caught.

### Finding 2 (moderate): the fixed-step frame accumulator was removed; the browser now steps the simulation once per frame

The approved WI-02 `Game` (revision `8939cb7`) ran the simulation from an
accumulator in `Game.frame(now)`: `accumulator += min(elapsed, MAX_FRAME_DT);
while (accumulator >= FIXED_DT) { update(FIXED_DT); accumulator -= FIXED_DT; }`.
The WI-03 diff removed `start()`, `stop()`, and `frame()`, and moved the loop to
`src/main.ts`, which now calls `game.update(FIXED_DT)` **once per animation
frame** with no accumulator. The simulation cadence is therefore tied to the
display refresh rate: on a 120 Hz display the game (and O2/health drain) runs at
~2× speed, on 30 Hz at ~0.5×. This violates request §30 "Avoid tying movement to
frame rate" (whose pseudo-code shows exactly this accumulator pattern) and the
WI-03 §30 addendum "Advance simulation time through fixed steps without …
animation frames." It is a regression from the approved WI-02 behavior and is not
called out in the implementer's "Deviations From Plan." Headless scenarios are
unaffected (they step with explicit `FIXED_DT`), which is why the test suite
stayed green.

### Finding 3 (moderate): `test:browser` is a build, not a browser test — it cannot catch Finding 1

`package.json` sets `test:browser` to `vite build`. The implementer reports
"npm run test:browser … exit 0" as evidence of a "distinct browser-layer
command," but the command only compiles the bundle; it never loads a page, so it
cannot observe the boot crash in Finding 1. The work item's criterion is
"browser tests a separate command," and the request §44/§70 intent is a real
separate *browser* test. As written, `test:browser` is a substitute that reports
success without exercising the browser. (The focused Playwright browser tests
required by request §70 are deferred, which the implementer notes, but the
documented command should not be a plain build.)

## Impact Check

- Ran `codegraph_explore` (mandatory gate, first structural lookup) for
  `Simulation / createSimulation / save / SaveGameV1 / parseSave / CraftingSystem
  / Scenario`. It returned current source for `Game`, `equipment`, `GameState`,
  `createRng`, but the `Game` symbol list was **stale** (it listed `start()` /
  `stop()` that no longer exist on disk) — consistent with the known-stale index
  noted in the project docs. I therefore verified the changed seams by direct
  file reads and by the git diff `8939cb7 → 877ecd9`.
- `Game.update` → `sim.step`: confirmed the browser now delegates to the sim
  (no second controller/collision path). Callers of `Game.update`: only
  `main.ts` (`animate`). Callers of `sim.step`: `Game.update` and
  `Scenario.step` — the single intended seam.
- `loadFromStorage` / `resetSave` / `saveToStorage`: callers are `Game`
  (constructor + `update` + debug `resetSave`). No other persistence path.
- `applyEquipment` / `canCraft` / `craft`: callers are `Simulation.handleCraft`,
  `CraftingSystem.test.ts`. `applyStarterGear`: `Simulation` constructor and
  `loadFromSave`. No cloned equipment path.
- No other product callers were affected; the change set is self-contained
  (new `src/sim/`, `src/game/save.ts`, `src/systems/CraftingSystem.ts`,
  `src/content/*`, `src/ui/menu.ts` + modifications to `Game`/`main`/`Player`/
  `PlayerController`/`worldData`/`debug`/`constants`).

## Independent Adversarial Probes

1. **Browser boot probe** (the decisive one). Wrote
   `agents/tasks/hadal/scratch/work-item-reviewer/WI-03/probe.mjs`, launched the
   real `npm run dev` page in SwiftShader Chromium (1920×1080, fresh context,
   `?debug=1`), captured page errors + console, and checked for the canvas,
   `#hud-root`, and `#debug-panel`. Result: `PROBE FAIL` — page error
   `TypeError: Cannot read properties of null (reading 'appendChild')`; no
   canvas, HUD, or debug panel. This directly distinguishes the request ("a
   browser-playable game the player can dive in") from the implementation
   (the browser crashes on boot). Re-run:
   `cd agents/tasks/hadal/scratch/work-item-reviewer/WI-03 && node probe.mjs`.
2. **`npm test` headless suite.** Ran `npx vitest run` and `npm test`:
   **8 files / 56 tests pass, exit 0** (`save.test.ts` 11, `terrain` 7,
   `PlayerController` 10, `PlayerMeters` 10, `CraftingSystem` 6, `rng` 4,
   `coreLoop` 1, `scenarios` 7). The headless verification core is genuinely
   green.
3. **`npm run build`.** Ran it: **exit 0** (the >500 kB chunk notice is the
   three.js bundle, informational). Note the `!` in `main.ts:7` is what lets the
   broken `getElementById('app')!` pass the type-check.
4. **Node-import boundary.** Grep of the sim core (`src/sim/*`, `terrain.ts`,
   `math.ts`, `GameState.ts`, `constants.ts`, `inventory.ts`) finds no
   `window`/`document`/`localStorage` usage (only a comment in `Simulation.ts`);
   `scenarios.test.ts` "import and run in Node without browser globals" passes.
   The §30 Node-import half is real.
5. **Frame-loop regression.** `git diff 8939cb7 877ecd9 -- src/game/Game.ts
   src/main.ts` shows the `frame()`/`accumulator`/`MAX_FRAME_DT` machinery
   removed and `main.ts` stepping `game.update(FIXED_DT)` once per frame.
6. **`test:browser` command.** Read `package.json`: `test` = `vitest run`,
   `test:browser` = `vite build` (a build, not a browser run).

## What I Could Not Verify

- Any manual (browser) behavior — base stations usable, harvest+craft in the
  UI, O2/health refill on surfacing in the UI, death/respawn in the UI, the
  debug panel, autosave writing to a real `localStorage` — because the browser
  does not boot (Finding 1). These are not "verified manually"; they are
  **unverifiable** until Finding 1 is fixed.
- Visual/audio/performance quality (request §34/§14.3): out of scope for this
  work item and not observable while the game crashes on boot.
- The `tank-1`/`fins-1` tuning choices (+65 s O2, +1.3× speed/boost) are the
  implementer's assumption (request §54/§9); they are reasonable and match the
  request's example, but I did not independently tune them.

## Assumptions

- "Change no product code" for this role: I touched no product file and no
  `state.md`; my only additions are the reviewer scratch probe
  (`agents/tasks/hadal/scratch/work-item-reviewer/WI-03/`) and this report.
- I read the `test:browser` command as required to be an actual browser test by
  the request §44/§70 intent, not merely a separately-named build. Rejected
  alternative: accepting a plain `vite build` as satisfying "browser tests a
  separate command" — that would let Finding 1 pass silently, which the
  criterion exists to prevent.
- The death scenario's use of `sim.teleportTo` + a direct `o2` edit is
  acceptable: it is a death/respawn-mechanic test, not a reachability claim
  (the core-loop reachability scenario does not use teleport). Request §70
  forbids teleport as *reachability* evidence, which this does not.

## Re-verification (2026-09-06, reviewer attempt 2)

This report was re-verified independently in a fresh session (retry attempt 2)
after the prior attempt's result JSON was rejected for a missing `blocker`
field. The verdict and all three findings are re-confirmed; nothing in this
section changes a prior verdict.

- **Finding 1 re-confirmed from source and live.** `src/main.ts:7` reads
  `document.getElementById('app')!`; `index.html:27` defines only
  `<div id="game">`; `Renderer`'s constructor (`src/render/Renderer.ts:40`)
  calls `container.appendChild(...)`. Re-ran the independent headless-Chromium
  probe (`scratch/work-item-reviewer/WI-03/probe.mjs`, real `npm run dev`,
  SwiftShader, 1920×1080, `?debug=1`): all four checks fail and the page error
  is exactly `TypeError: Cannot read properties of null (reading 'appendChild')`;
  no canvas, `#hud-root`, or `#debug-panel`. `BUILD.md` "Delivery Verification
  Capabilities" documents the ms-playwright Chromium binary that makes this boot
  break catchable in this environment (the implementer's "no Playwright
  harness installed" claim is inaccurate).
- **Finding 2 re-confirmed from git.** `git diff 8939cb7 877ecd9` shows
  `Game.start()/stop()/frame(now)` and the `accumulator`/`MAX_FRAME_DT`
  machinery removed; `src/main.ts` now calls `game.update(FIXED_DT)` once per
  `requestAnimationFrame`, tying sim cadence to display refresh. Not called out
  in the implementer's "Deviations From Plan".
- **Finding 3 re-confirmed from `package.json`.** `test` = `vitest run`;
  `test:browser` = `vite build` (a build, not a page load).
- **Headless evidence re-confirmed.** `npm test` = 8 files / 56 tests, exit 0
  (`save` 11, `terrain` 7, `PlayerController` 10, `PlayerMeters` 10,
  `CraftingSystem` 6, `coreLoop` 1, `rng` 4, `scenarios` 7). `coreLoop.test.ts`
  is a genuine continuous 9-step scenario (no teleport/noclip); `scenario.ts`
  `swimTo`/`steerToward` select inputs only and `trace` carries
  seed/time/position/input/assertion.

Verdict unchanged: **findings**. The headless verification core is solid and
green, but the browser adapter crashes on boot (Finding 1), so the work item's
stated Goal — "the player can dive, gather, surface, craft, and go farther" in
the browser — is not met, and two moderate regressions (Findings 2 and 3) are
present.

## Re-review (attempt 3, 2026-09-06) — supersedes the verdicts above

Status: pass

The three findings above (attempts 1–2) are all resolved by the implementer's
browser-fix commit `d611344` ("[game][browser] fix browser boot, restore
fixed-step cadence, add browser harness"). This re-review re-verified the whole
work item against the current state (HEAD `d611344`, clean tree) and ran the
headless, build, and browser evidence independently. This section supersedes the
"findings" verdict at the top of this file.

### Prior findings — resolution

- **Finding 1 (browser boot) — RESOLVED.** `src/main.ts:8` now reads
  `document.getElementById('game')!`; `index.html:27` defines
  `<div id="game">`. The browser boots: canvas + `#hud-root` + `.debug-panel`
  present, no page exception (the implementer's `tests/browser/boot.test.mjs` and
  my independent `probe2.mjs` both confirm).
- **Finding 2 (frame cadence) — RESOLVED.** `src/game/frame.ts`
  `stepCountSince` restores the §30 fixed-step accumulator; `main.ts` drains
  real time into whole `FIXED_DT` steps. `frame.test.ts` (5 tests) pins
  refresh-rate independence (30 steps for 0.5 s at 60 / 120 / 12 Hz).
- **Finding 3 (`test:browser` is a build) — RESOLVED.** `test:browser` is now
  `node tests/browser/boot.test.mjs`, a real headless-Chromium harness (4 tests:
  boot + HUD + panel, keyboard moves the player, resize, save persists across a
  reload), distinct from the headless `npm test` (Vitest).

### Acceptance criteria (current state)

| Criterion | Verdict | Evidence |
|---|---|---|
| Tiny surface base + §5 stations, no large hub | pass | `worldData.ts BASE` (1300,0) radius 260 with all 5 stations; player spawns at (1300,-100) inside the base radius; the workbench is shown in the browser. |
| Harvest (swim + `E`) + craft + capability change | pass | `coreLoop.test.ts` steps 2–3; `probe2.mjs` gives resources + one-click craft raises o2Max 180→245 in the browser. |
| Return to base refills O2/health, saves, banks, story lines | pass | Headless `onBaseReturn` banks + autosave + story line; `tests/browser/boot.test.mjs` confirms the save persists across a real reload (`hadal.save.v1`, version 1, storyFlags). |
| Craftable upgrade is a real `EquipmentDef` | pass | `content/recipes.ts` reuses `EquipmentDef` from `equipment.ts` (not cloned); `tank-1` `oxygenBonus` 65. |
| Single cargo capacity; key objects do not consume cargo | pass | `CARGO_BASE_CAPACITY` 10; `Player.cargo.capacity`; banked + equipment excluded from cargo. |
| Death respawns at base, keeps upgrades, loses a modest fraction | pass | `scenarios.test.ts` death scenario; `DEATH_RESOURCE_LOSS_FRACTION` 0.3. |
| Versioned `SaveGameV1`; autosave; malformed save resets/backs up | pass | `save.test.ts` (11 tests); `SAVE_VERSION` 1, `SAVE_KEY` `hadal.save.v1`, backup `hadal.save.v1.bak`; `loadFromStorage` reset + backup on a malformed value. |
| Debug panel (noclip / teleport-chunk / give resources / reset save); no secret text in normal UI | pass | `debug.ts` `DebugPanel` exposes all four + readout; `probe2.mjs` confirms the panel is hidden in normal mode and no secret/creature tokens appear in the normal UI. |
| §30 simulation boundary (Node-importable, one sim, actions as data) | pass | `scenarios.test.ts` Node import; `Game.update` → `sim.step` (single seam, no second controller/collision); frame loop restored. |
| §70 reusable scenario harness (steps / inputs / assertions / trace) | pass | `scenario.ts` input-only steering (no position assignment); `trace` carries seed / time / position / input / assertion. |
| §70 9-step continuous core-loop | pass | `coreLoop.test.ts` steps 1–9 as one scenario; no teleport / noclip / free materials. |
| Separate scenarios (death / insufficient / blocked) | pass | `scenarios.test.ts` (death, insufficient, blocked, depleted, failure-trace). |
| Separate headless vs browser commands | pass | `npm test` = Vitest (9 files / 61 tests); `test:browser` = the real harness. |

### Evidence I ran (this attempt)

- `npx vitest run` → 9 files / 61 tests, exit 0 (includes the 5 new `frame` tests).
- `npm run build` → exit 0 (type-check + bundle; the >500 kB chunk notice is three.js, informational).
- `npm run test:browser` → BROWSER SUITE PASS (4/4 tests, exit 0).
- Independent `probe2.mjs` → normal page boots, panel hidden in normal mode, no secret tokens; debug page gives resources + one-click craft raises o2Max 180→245; no page exception.
- `codegraph_explore` (structural gate): confirmed `Game.update` → `sim.step` (no second sim/collision) and that `stepCountSince` is called only by `main.ts` and `frame.test.ts`.

### Minor observation (non-blocking)

The `.debug-readout` (x / depth / o2 / hp) is visible in normal (non-`?debug=1`)
mode — `debug.ts` `tick()` shows it at 4 Hz regardless of the panel toggle
(`readout_visible_in_normal: true` in `probe2.mjs`). It shows only internal
state, so it does not violate any acceptance criterion, and the implementer's
note documents this deliberately. Worth gating behind the debug toggle in the
later UI pass (WI-15) for a cleaner normal-mode HUD. Not raised as a finding.

### Verdict

**pass.** The work item's goal — the player can dive, gather, surface, craft,
and go farther, in the browser — is met; all acceptance criteria and the §30/§70
addendum criteria pass; the three prior findings are resolved.
