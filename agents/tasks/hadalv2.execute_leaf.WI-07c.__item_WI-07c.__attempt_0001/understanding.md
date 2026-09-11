# Understanding

This child implements one independently reviewed work item from C:\Temp\hadal-v2\agents\tasks\hadalv2.

---
id: WI-07c
kind: work_item
parent: ST-07
children: []
depends_on: ["WI-07a", "WI-07b"]
criteria:
  AC-bal-timing: "A debug-instrumented full playthrough records time to first upgrade, time to each depth band, deaths, resource shortages, time spent lost, repeated travel, and completion time, and is tuned so a blind first playthrough fits 90-120 minutes with an expert critical path of 55-75 minutes"
  AC-bal-flow: "The first 10 minutes follow the section 53 tutorial flow with the entire core loop understandable by minute 10, and the 3-6 minute pacing beat holds across all bands"
behavior: "Run at least two full instrumented playthroughs (a blind first run and an expert route), then tune oxygen, currents, pressure gates, content density, and the section 53 tutorial pacing - using WI-07a's telemetry and WI-07b's verified reachability - so a blind first playthrough fits 90-120 minutes and the expert critical path fits 55-75 minutes, without artificially slowing experts"
subsystems: ["balance tuning"]
verification: "Recorded telemetry exports from at least two full instrumented playthroughs (blind and expert) with the section 71 fields, showing blind completion inside 90-120 min and expert completion inside 55-75 min, with the section 3 beats (time to first upgrade, time to each depth band, deaths, resource shortages, time spent lost, repeated travel, completion time) readable in the export; a headless first-10-minutes scenario reproduces the section 53 tutorial flow and reaches 'entire core loop understood'; a pacing pass records a notable beat every 3-6 minutes across all bands; the 90-120 min claim is stated only from recorded playtest evidence, never from headless math alone; suite and build stay green"
---

# WI-07c — Numerical tuning toward the 90-120 / 55-75 target

## Goal

Make the game actually pace to the target once the numbers are observable
(WI-07a) and the path is provably winnable (WI-07b). This is the tuning
half of AC-bal-timing and all of AC-bal-flow. Concretely: run full
instrumented playthroughs, then adjust the difficulty curve (oxygen, currents,
pressure gates - request §39), content density and travel times (request §49),
and the section 53 tutorial pacing, so a blind first playthrough lands in
90-120 minutes and an expert critical path lands in 55-75 minutes - and the
first ten minutes teach the whole core loop. This is the named final proof
owner of AC-bal-timing: the criterion only closes when the metrics are
recorded (WI-07a) AND the numbers are tuned to target (this leaf).

## Deliverables (checkable)

- At least two recorded full instrumented playthroughs (blind and expert),
  each exporting the section 71 fields from WI-07a, with the AC-bal-timing
  beats: time to first upgrade, time to each depth band, deaths, resource
  shortages, time spent lost, repeated travel, completion time.
- Difficulty-curve tuning (§39): early predators telegraph clearly and oxygen
  is forgiving / death unlikely; mid-game oxygen becomes a route-planning
  constraint and encounters can force retreat; deep tension comes from ecology
  and navigation, not a tiny O2 bar; the finale is altered context/rules, not
  maxed numerical damage. Tuned via config (oxygen rates, current field
  strengths in `WORLD_CURRENT_FIELDS`, pressure/gate thresholds), not by
  redesigning encounters.
- Density and travel tuning (§49): 20-60 s between meaningful points,
  long dramatic transit (1-2 min) sparing, shorter return trips via
  upgrades/shortcuts, no three-minute empty corridor.
- Tutorial pacing (§53): minute 0-2 / 2-5 / 5-8 / 8-10 beats land so the
  entire core loop is understandable by minute 10, and the section 3 3-6
  minute "something notable" beat holds across all bands.
- A recorded tuning report: what was changed, the before/after telemetry
  numbers, and the blind + expert completion times.

## Tests

- Playtest evidence (final proof owner of AC-bal-timing, tuning clause): the
  two recorded playthrough exports show blind completion in 90-120 min and
  expert completion in 55-75 min, with the seven beats readable. The claim is
  stated from these recordings only - never from headless math alone (ST-07
  boundary).
- Headless (AC-bal-flow): a fresh-save first-10-minutes scenario reproduces
  the §53 flow (movement shown, first salvage, forgiving O2, harmless animal
  reacts, one-click first craft, objective update, felt range increase) and
  reaches the "core loop understood" state; assert no explanatory lore dump.
- Headless (pacing beat): a scenario walk records the timestamp of each
  notable beat (new creature / behavior / sound / resource / discovery) and
  asserts the gaps stay within the 3-6 min rule (§3) across all bands; flag
  any gap that would be a three-minute empty corridor (§49).
- Node: suite and build stay green; the tuning changes are config/data only
  (no new simulation rules).

## Constraints, assumptions, non-goals

- This story tunes, it does not redesign: any finding that needs a gameplay
  or content change is filed as a defect / fresh work item through the normal
  fix-planning route - do not implement it here (ST-07 boundary).
- Do not artificially slow experts (§3 pacing rule): expert tuning must come
  from the same honest numbers, not from gating the fast route.
- No new content beyond small resource/cache adjustments; if balance says
  content is missing, file a defect.
- Depends on WI-07a (telemetry to measure the runs) and WI-07b (the path must
  be provably reachable and material-complete before timing is trusted).
- Spoiler rules (§§0, 12, 68): the tuning report uses internal ids / band
  names only; late-game encounters are referenced without names.

## Fresh-session handoff

Read ST-07/plan.md (this is the final proof owner of AC-bal-timing and
AC-bal-flow), request sections 3, 39, 40, 49, 53, 71; WI-07a (the telemetry
fields and export you will read) and WI-07b (the verified critical path and
material placement you are tuning on top of). Inspect `src/game/constants.ts`
(oxygen / damage / control tuning constants), `src/world/worldData.ts`
(`WORLD_CURRENT_FIELDS`, node placement, chunk travel distances), the recipe
data in `src/content/recipes.ts`, and the §53 first-10-minutes beats. Record
every run with the shared telemetry so the 90-120 / 55-75 numbers are auditable.

