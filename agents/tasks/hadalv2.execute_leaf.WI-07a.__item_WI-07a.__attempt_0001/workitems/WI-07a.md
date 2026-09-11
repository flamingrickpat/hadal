---
id: WI-07a
kind: work_item
parent: ST-07
children: []
depends_on: []
criteria:
  AC-bal-timing: "A debug-instrumented full playthrough records time to first upgrade, time to each depth band, deaths, resource shortages, time spent lost, repeated travel, and completion time, and is tuned so a blind first playthrough fits 90-120 minutes with an expert critical path of 55-75 minutes"
behavior: "Build the section 71 balance-telemetry collector and expose it in both the browser debug panel and a headless scenario export, so a full run records every section 71 field (plus frame/FPS data) and headless runs emit the identical field set"
subsystems: ["debug telemetry", "headless scenario tests"]
verification: "A Node headless scenario run emits a telemetry export containing every section 71 field - play time, current zone, max depth, deaths, crafted upgrades, resources collected/spent, time since last progression unlock, oxygen remaining on surfacing, encounter trigger timestamps - plus per-frame/FPS data; the browser debug panel readout shows the same live fields; a Node test asserts the browser and headless exports share one field schema (identical keys); the headless suite and build stay green"
---

# WI-07a — Section 71 balance telemetry and headless export

## Goal

Land the section 71 development telemetry as a single shared collector that
runs in both layers. Today the debug panel (`src/util/debug.ts`) shows only a
4 Hz position / depth / O2 / HP readout (`DebugPanel.tick`); the section 71
fields (play time, zone, max depth, deaths, crafted upgrades, resources
collected/spent, time since last unlock, oxygen on surfacing, encounter
timestamps) and frame/FPS data are not captured. This leaf builds the
collector and its two surfaces so every later child can measure: WI-07b runs
headless route scenarios, WI-07c runs full instrumented playthroughs, and
WI-07d reads frame data. This is the recording half of AC-bal-timing; it does
not tune any number.

## Deliverables (checkable)

- A shared `Telemetry` collector (a new module under `src/sim/`, driven by the
  production `Simulation`) that accumulates every section 71 field from
  existing sim state/events: play time (`sim.state.timeSec`), current zone
  (active chunk / band), max depth (`sim.player.maxDepth`), deaths, crafted
  upgrades, resources collected/spent (inventory deltas), time since last
  progression unlock, oxygen remaining on surfacing, and encounter trigger
  timestamps (from the trigger/encounter fire path).
- A per-frame / FPS sampler (request §33 "display FPS / active entities")
  recording frame delta and active entity count, used by WI-07d.
- Browser surface: the debug panel (`src/util/debug.ts`, `DebugPanelHost` in
  `src/game/Game.ts`) readout is extended to show the live section 71 fields;
  internal ids only, no creature names or secret text (§33 rule).
- Headless surface: the scenario harness (`src/sim/scenario.ts`) gains an
  export (e.g. `scenario.telemetry()`) returning the same field set, so a
  headless run emits the same telemetry the browser collects.
- One typed field schema shared by both surfaces (no per-surface field lists).

## Tests

- Node: a headless scenario that advances a run (or the existing core-loop
  scenario) calls the export and asserts every section 71 key is present and
  non-null and that deaths/resources/unlock counters move as the scenario
  acts; the suite and build stay green.
- Node (schema parity): assert the headless export key set equals the browser
  collector key set (single shared schema), so a headless run and a browser
  run report the same fields.
- Browser (shared harness): boot with `?debug=1`, play a short stretch, and
  assert the readout shows the extended fields (play time, zone, max depth,
  deaths) updating.

## Constraints, assumptions, non-goals

- Extend, do not rebuild: the collector reads production sim state; it adds no
  gameplay behavior and no new rules.
- This leaf changes no balance numbers - the tuning is WI-07c; it only makes
  the numbers observable.
- No backend analytics (§71: local display / log only); internal ids are fine
  in debug, but no creature names or secret descriptions in the readout
  (§33, §68).
- Spoiler rules (§§0, 12, 68) do not constrain this telemetry, but evidence
  uses internal ids only.

## Fresh-session handoff

Read ST-07/plan.md (proof ownership, ordering), request sections 3, 71, 33;
`src/util/debug.ts` (`DebugPanel`, `DebugPanelHost`, `tick`), the debug host
in `src/game/Game.ts`, `src/sim/Simulation.ts` (`state.timeSec`, `player`,
active-chunk/zone access, trigger fire path), and `src/sim/scenario.ts`
(`Scenario`, `sim`, `step`/`stepFor`). The collector must be drivable purely
from `Simulation` so both the browser (via the game host) and the headless
scenario (via `Scenario.sim`) share it.
