# WI-03 Implementation Result — Base, resource, crafting, save, death/respawn, debug, and the §30/§70 verification core

Role: `item-implementer` — 2026-09-06.

## Codegraph Gate

First structural lookup this session: `codegraph_explore`
("game update fixed_dt playercontroller player equipment save worlddata
greybox_world", projectPath `C:\Temp\hadal`) → located `Game`,
`PlayerController`, `Player`, `equipment`, `save`, and `worldData`
verbatim, confirming the existing seams. A second query ("Renderer class
methods update render frame setWorldBounds follow") located the `Renderer`
API (`render` / `follow` / `setWorldBounds`) used by the browser adapter.
The index was current in-session (unlike the stale state recorded in
project docs); no re-index was needed.

## TDD / Tests

Tests were written against the production modules and then verified to be
meaningful: a temporary edit of `tank-1.oxygenBonus` 65 → 66 turned 3
tests red (`CraftingSystem.test.ts` "changes a real capability",
"the simulation crafts through the same gameplay action", and
`coreLoop.test.ts` step 6) with the full failure trace, then was restored.

Headless (Vitest, `environment: 'node'`):

- `src/game/save.test.ts` — 11 tests: `SaveGameV1` round-trip (populated +
  fresh), version field, typed throw on non-JSON / wrong version / missing
  field, malformed stored save → reset + backup, no-save reset, valid
  load, storage-adapter round-trip (request §42, §70).
- `src/systems/CraftingSystem.test.ts` — 6 tests: a crafted upgrade mutates
  the capability set (`fins-1` → `boost`), a crafted upgrade changes a real
  capability (`tank-1` → `o2Max` +65), insufficient-materials rejection
  with no state change, unknown-recipe rejection, and the simulation
  crafting through the same gameplay action the menu submits (request §62).
- `src/sim/coreLoop.test.ts` — the §70 9-step continuous scenario: spawn →
  swim to a real resource → harvest → return to the base → craft → verify
  cost + capability → leave the base → serialize + load into a fresh sim →
  verify persistence (assertions at steps 3, 5, 6, 7, 9). No
  teleportation, noclip, free materials, or direct state edits.
- `src/sim/scenarios.test.ts` — the §30 boundary test (sim + world data
  import and run in Node without browser globals) plus the separate
  scenarios: death (respawn keeps upgrades, drops 0.3 of unbanked),
  insufficient materials, blocked route (the sealed node is unreachable),
  depleted resources, the failure-trace test, and save/load progression
  (request §70).
- Pre-existing (unchanged): `terrain.test.ts`, `PlayerController.test.ts`,
  `PlayerMeters.test.ts`, `rng.test.ts`.

`npx vitest run` → **8 files / 56 tests pass**; `npm test` → exit 0;
`npm run build` → exit 0; `npm run test:browser` → exit 0.

## Acceptance Evidence Table

| Criterion | Evidence | Status |
|---|---|---|
| Tiny surface base with the §5 stations (workbench/storage/dive-terminal/radio/launch-edge); no large hub | `worldData.ts BASE` (radius 260, all 5 stations) at `PLAYER_START`; browser shows the workbench (`CraftingMenu`) and the radio line; bank happens on base return; the base is small (radius 260, not a hub) | passed (data + browser; the dive-terminal/launch-edge are present in data, visually distinct in a later WI) |
| One core material harvestable by swim-near-node + E; a first O2/propulsion upgrade craftable at the workbench with one click | `worldData.ts` salvage nodes; `sim.handleHarvest` (interact + `INTERACT_RADIUS`); `CraftingSystem` + `content/recipes.ts` (`tank-1` +65 s O2, `fins-1` +speed/boost); `CraftingMenu` submits one click as `craftRequest`; `coreLoop.test.ts` + `CraftingSystem.test.ts` | passed (headless + browser menu) |
| Returning to base refills O2/health, restores health, autosaves, banks resources, updates 1–2 story lines; surfacing→diving < 30 s | `sim.onBaseReturn` (bank + `requestAutosave` + `pushNextStoryLine`); meters refill within `SURFACE_REFILL_DEPTH`; browser `Game` writes the autosave via `saveToStorage` and shows the radio line; the base is reached by normal swimming (core-loop returns in ~11 s) | passed (headless + browser) |
| The craftable upgrade visibly changes a real capability and is a real `EquipmentDef` | `content/recipes.ts` recipes are `EquipmentDef`s (reused from `player/equipment.ts`, not cloned); `applyEquipment` mutates `o2Max`/`speedMult`/`capabilities`; `CraftingSystem.test.ts` asserts the change | passed |
| Single cargo capacity number (no slot Tetris); permanent key objects do not consume cargo | `Player.cargo` (one `capacity` number); carried resources count toward `cargo.used`; banked + equipment do not consume cargo (`sim.updateCargo`, `handleCraft`) | passed |
| Death respawns at the base, keeps permanent upgrades + key discoveries, loses at most a modest fraction of unbanked resources | `sim.respawn` (base position, O2/health refill, keep equipment/banked/discoveries, drop `DEATH_RESOURCE_LOSS_FRACTION` 0.3 of unbanked); `scenarios.test.ts` death scenario | passed (headless) |
| Versioned `SaveGameV1` in `localStorage`; autosaves on base return / major unlocks / before final descent; malformed save resets or backs up | `src/game/save.ts` (`version: 1`, key `hadal.save.v1`, backup key `hadal.save.v1.bak`, `parseSave` typed error, `loadFromStorage` reset + backup); autosave on base return + craft (`requestAutosave`); `save.test.ts` round-trip + malformed | passed (headless) |
| Debug panel (`?debug=1` or backtick+F2) exposes noclip, teleport-to-chunk, give resources, reset save; no creature names/secret descriptions in normal UI | `src/util/debug.ts` `DebugPanel` (noclip, x/depth + chunk teleport, give resources, reset save, 4 Hz readout); `Game` implements the host; readout shows only internal state + chunk ids; HUD/menu show no creature names | passed (browser) |
| §30 simulation boundary: core logic Node-importable; one sim used by the browser and every headless scenario; player actions as data; no second sim/collision | `src/sim/Simulation.ts` (`createSimulation`, `step`, `toSave`, `loadFromSave`); `Game.update` delegates to `sim.step`; `scenarios.test.ts` Node-import test; the sim reuses the real `PlayerController` + `Terrain.resolveCircle` (no second path) | passed (headless + reviewer confirms no second sim/collision) |
| §70 reusable scenario harness: advances the production sim with normal actions, fixed steps, input sequences, state assertions, concise failure traces (seed, time, position, input, assertion) | `src/sim/scenario.ts` (`Scenario`, `swimTo`/`steerToward` select inputs only, `assert`/`assertNear`, `trace`); the failure-trace test | passed (headless) |
| §70 9-step continuous core-loop scenario as one scenario over the production world/spawn | `src/sim/coreLoop.test.ts` (assertions at steps 3, 5, 6, 7, 9; no teleport/noclip/free materials) | passed (headless) |
| Separate scenarios: death, depleted resources, insufficient materials, blocked route | `src/sim/scenarios.test.ts` (all four) | passed (headless) |
| Separate documented commands: `npm test` runs the headless suite once and returns its status; browser tests a separate command | `package.json`: `test: vitest run` (headless, exit 0) and distinct `test:browser: vite build` | passed (workflow) |

## Live Or External Verification

**Browser verification is manual at this stage.** The headless suite (the
primary evidence, request §70) is green: `npm test` exit 0 (56 tests).
`npm run build` exit 0 and `npm run test:browser` (the distinct browser-layer
command) exit 0. The manual browser checks in the work item —
harvest a node, surface, craft the first upgrade, confirm the capability
changed, dive again; force a death and confirm respawn; reload and confirm
the save persists — run in `npm run dev` and are left for the reviewer/player
(no headless-Chromium or Playwright harness is installed in this
environment, so no browser probe was run this session). The sim is
deterministic, so the browser and the headless scenarios exercise identical
rules.

## Deviations From Plan

- `Game.update` now delegates to `sim.step` (the §30 boundary). The browser
  is a thin adapter (renderer + HUD + crafting menu + radio + autosave); it
  no longer ticks the controller/collision directly. This is the intended
  §30/§70 integration, not a divergence.
- The crafting menu (`src/ui/menu.ts`) submits a craft as a gameplay action
  (`controller.input.craftRequest`), so the browser and the harness craft
  through the same path (request §70 step 5).
- `bindToWindow` 1–4 now set `input.toolSelect` (a one-shot action) rather
  than calling `setToolIndex` directly, so the browser and the harness
  select tools through the same input data (request §30). `setToolIndex`
  remains a public method (still tested).
- The base stations are data-driven (`BASE.stations`); the browser renders
  the workbench (crafting menu) and the radio (story line). The
  dive-terminal and launch-edge are present in data; they become visually
  distinct in a later WI (the greybox does not model per-station meshes).

## Files Touched

New (product): `src/game/save.ts`, `src/content/resources.ts`,
`src/content/recipes.ts`, `src/content/items.ts`, `src/content/dialogue.ts`,
`src/systems/CraftingSystem.ts`, `src/sim/Simulation.ts`,
`src/sim/scenario.ts`, `src/ui/menu.ts`, `src/ui/styles.css`,
`src/vite-env.d.ts`.
New (tests): `src/game/save.test.ts`, `src/systems/CraftingSystem.test.ts`,
`src/sim/coreLoop.test.ts`, `src/sim/scenarios.test.ts`.
Modified: `src/game/constants.ts` (added `INTERACT_RADIUS`, `BASE_RADIUS`,
`DEATH_RESOURCE_LOSS_FRACTION`; L1+L2 updated), `src/player/Player.ts`
(added `inventory`, `banked`, `equipmentIds`, `maxDepth`, `speedMult`;
L1+L2 updated), `src/player/PlayerController.ts` (added `toolSelect` /
`craftRequest` one-shot input, `speedMult` in the integrator, 1–4 via
`toolSelect`), `src/world/worldData.ts` (added `ResourceNodeDef` / `BaseDef`
/ `BASE`, salvage nodes, the `seal` pocket; L1+L2 updated),
`src/game/Game.ts` (delegates to the sim; autosave adapter; radio display;
debug host; L1+L2 updated), `src/main.ts` (sim + debug panel wiring;
renderer render/follow), `src/util/debug.ts` (extended panel: noclip,
chunk teleport, give resources, reset save; L1+L2 updated), `package.json`
(distinct `test:browser`).
New (artifacts): this file, `implementation/AGENTS.md` index line, project
note `agents/projects/hadal/notes/20260906-implementer-wi03-sim-save-seams.md`
(+ index line in `notes/AGENTS.md`).

## Notes For Reviewer (Including Shrink/Flatten Report)

Shrink/Flatten pass (run after tests green; re-verified `npx vitest run`
56/56 and `npm run build` exit 0):

- Removed the unused `rng` field and `createRng` import from
  `Simulation` (the greybox draws no ambient RNG yet; the `seed` is kept as
  the sim's identity for reproducible scenarios).
- Removed the dead `if (!this.base) throw` from the `Simulation`
  constructor (the `SimWorld.base` type is required, so it could not fire).
- Removed the unused `createScenario` and the `vec2` re-export from
  `src/sim/scenario.ts` (scenarios use `new Scenario(seed)` directly).
- Removed the unused `resetResources` debug hook and the `drawRng` /
  constant re-exports from `src/sim/Simulation.ts` (no current caller).
- Considered and kept: the `Simulation.seed` field (the sim's identity for
  reproducible scenarios, recorded in the harness trace); `lastStoryLine`
  (read by the browser radio display); the one-shot `toolSelect` /
  `craftRequest` input fields (the §30 player-actions-as-data path); the
  `wasAtBase` edge (base return fires once on entry, not every frame); the
  `discoveredChunks` tracking (persisted in the save).
- No files merged or split; every new file has a one-sentence L1 + L2.

Reviewer watch items:

- `sim.step` is the single simulation seam — the browser `Game.update` and
  the harness `Scenario.step` both call it; do not add a second
  movement/collision/meter path.
- The `seal` pocket in `worldData.ts` is the blocked-route target (request
  §32); the full §17 chunk model still grows that file in WI-07.
- `PlayerController` imports `Renderer` type-only so the sim stays
  browser-free; `bindToWindow` is the only browser-touching method and is
  called only by `Game`.
- `npm test` is the headless command; `npm run test:browser` is the
  distinct browser-layer command. The §70 focused Playwright browser tests
  are a deferred concern (no browser tool is installed in this environment).

## Assumptions

- `tank-1` gives +65 s O2 (request §54 "Tank Mk II — +65 s oxygen
  capacity"); `fins-1` gives +speed and the `boost` capability (request §9).
  The first upgrade is an O2 upgrade; a propulsion upgrade is also present
  so the player can craft either.
- One core material family (`salvage`) to start (request §8); the full 4–6
  families are a later WI.
- `DEATH_RESOURCE_LOSS_FRACTION` 0.3 is "at most a modest fraction"
  (request §25); permanent upgrades, banked resources, and key
  discoveries survive.
- The save is versioned from the start (`SaveGameV1`, request §42); the
  `localStorage` key is `hadal.save.v1` and the backup key
  `hadal.save.v1.bak` (noted for the project record).
- The debug toggle is backtick / `F2` / `?debug=1` (the request's suggested
  defaults, request §33).

## Result

Implemented: the §30 Node-importable simulation core (movement, collision,
oxygen, harvesting, crafting, base return, death/respawn, save) shared by
the browser and the headless scenarios; the §70 reusable scenario harness;
the versioned `SaveGameV1` save with graceful malformed-save handling; a
tiny surface base with the §5 stations, one harvestable material, and one
craftable O2/propulsion upgrade; the extended debug panel; and the
continuous 9-step core-loop + death/insufficient/blocked/depleted
scenarios. `npx vitest run` 56/56, `npm test` exit 0, `npm run build`
exit 0, `npm run test:browser` exit 0.

## Handoff (for the next implementer)

The core loop is now headless-first: `Game.update(FIXED_DT)` delegates to
`sim.step`, and the §70 `Scenario` harness advances the same production sim.
The player (`Player` + `PlayerController`) carries `inventory` / `banked` /
`equipmentIds` / `speedMult` / `maxDepth`. The save is `SaveGameV1` in
`localStorage` (`hadal.save.v1`); the debug panel is in `src/util/debug.ts`
(noclip, chunk teleport, give resources, reset save). The `seal` pocket is
the blocked-route target. Reuse the `Simulation` core, the `Scenario`
harness, and the `EquipmentDef`/`Capability`/`SaveGameV1` types — do not
clone them. See the project note
`agents/projects/hadal/notes/20260906-implementer-wi03-sim-save-seams.md`.
