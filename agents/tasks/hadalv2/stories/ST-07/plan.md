---
id: ST-07
kind: story
parent: null
children: []
depends_on: ["ST-06"]
criteria:
  AC-bal-timing: "A debug-instrumented full playthrough records time to first upgrade, time to each depth band, deaths, resource shortages, time spent lost, repeated travel, and completion time, and is tuned so a blind first playthrough fits 90-120 minutes with an expert critical path of 55-75 minutes"
  AC-bal-perf: "The 60 FPS performance target holds at 1080p in the browser during the largest encounter and in every band's representative scene"
  AC-bal-flow: "The first 10 minutes follow the section 53 tutorial flow with the entire core loop understandable by minute 10, and the 3-6 minute pacing beat holds across all bands"
  AC-bal-scarcity: "Every required permanent upgrade has 130-170 percent of critical materials in its first relevant area across at least 2 locations, verified by the section 32 validators paired with headless route scenarios"
behavior: "Run the balance and telemetry pass (request phase 8, sections 39, 40, 49, 53, 71): instrument, play full runs, tune toward the 90-120 minute target, and verify performance and pacing"
subsystems: ["balance tuning", "debug telemetry", "headless scenario tests"]
verification: "Telemetry exports from at least two full instrumented playthroughs with the section 71 fields; the section 32 critical-path check plus physical route scenarios pass; browser performance observation in the largest encounter with recorded frame data"
---

# ST-07 — Balance, telemetry, performance pass (UNEXPANDED)

## Status

Explicit expansion task. Split in a future planning session; natural split:
(1) telemetry/debug instrumentation finishing (section 71); (2) full-run
playthroughs and numerical tuning (oxygen, currents, pressure gates,
scarcity); (3) performance verification and fix-forward in the largest
encounter.

## Scope inventory (honest)

- Telemetry per section 71 in the existing debug panel (`src/util/debug.ts`):
  play time, zone, max depth, deaths, crafted upgrades, resources
  collected/spent, time since last unlock, oxygen at surfacing, encounter
  timestamps.
- Difficulty curve per section 39: telegraphed early predators, oxygen as
  route planning mid-game, ecology-and-navigation tension deep, altered
  context in the finale (never just maxed damage).
- Scarcity rules per section 40 verified with `simulateCriticalPath()`
  paired with headless movement scenarios against production collision
  geometry (section 32: adjacency is not reachability).
- Density rules per section 49: 20-60 seconds between meaningful points,
  shorter return trips via upgrades/shortcuts, no three-minute empty
  corridors.
- Performance per section 34 in the largest encounter; stutter is a hard
  defect because it destroys large-creature reveals.

## Dependencies and boundaries

- Depends on ST-06 (content and presentation stable before numbers are
  trusted).
- Findings that require gameplay changes go through the normal
  fix-planning route as fresh work items; this story tunes, it does not
  redesign.
- The final 90-120 minute claim is a playtest result, not a configuration:
  record the evidence, do not assert it from headless math alone.

## Constraints and non-goals

- Do not artificially slow experts (section 3 pacing rule).
- No new content additions beyond small resource/cache adjustments; if
  balance says content is missing, file a defect.
- No spoiler content in tuning reports (section 68).

## Fresh-session handoff for the expander

Read request sections 3, 32, 34, 39, 40, 49, 53, 71; the existing debug
panel and scenario harness. Instrumentation must run headlessly so scenario
runs emit the same telemetry fields.
