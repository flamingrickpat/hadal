---
id: ST-07
kind: story
parent: null
children: ["WI-07a", "WI-07b", "WI-07c", "WI-07d"]
depends_on: ["ST-06"]
criteria:
  AC-bal-timing: "A debug-instrumented full playthrough records time to first upgrade, time to each depth band, deaths, resource shortages, time spent lost, repeated travel, and completion time, and is tuned so a blind first playthrough fits 90-120 minutes with an expert critical path of 55-75 minutes"
  AC-bal-perf: "The 60 FPS performance target holds at 1080p in the browser during the largest encounter and in every band's representative scene"
  AC-bal-flow: "The first 10 minutes follow the section 53 tutorial flow with the entire core loop understandable by minute 10, and the 3-6 minute pacing beat holds across all bands"
  AC-bal-scarcity: "Every required permanent upgrade has 130-170 percent of critical materials in its first relevant area across at least 2 locations, verified by the section 32 validators paired with headless route scenarios"
behavior: "Run the balance and telemetry pass (request phase 8, sections 32, 39, 40, 49, 53, 71): instrument the runs, prove the critical path is winnable and material-complete, tune toward the 90-120 minute target, and verify performance and pacing"
subsystems: ["balance tuning", "debug telemetry", "headless scenario tests", "rendering and materials"]
verification: "Telemetry exports from at least two full instrumented playthroughs with the section 71 fields (WI-07c's final AC-bal-timing proof); the section 32 `simulateCriticalPath()` check plus physical route scenarios pass and the section 40 scarcity walk holds (WI-07b); browser performance observation with recorded frame data in the largest encounter and each band's representative scene (WI-07d)"
---

# ST-07 — Balance, telemetry, and performance pass

## Goal

Run the balance, telemetry, and performance pass (request phase 8) on the
stable ST-06 content: make the numbers observable, prove the critical path is
physically and numerically winnable, tune toward the 90-120 minute blind /
55-75 minute expert target, and verify 60 FPS where it matters. This story
tunes, it does not redesign - anything needing a gameplay or content change is
filed as a defect / fresh work item through the normal fix-planning route.

## Why this shape (review split)

The review split this empty story and named the boundaries: section 71
telemetry, full-run playthroughs plus numerical tuning (including scarcity),
and performance verification. That boundary is refined into four leaves here
for two reasons the review itself flagged. First, the review's finding (3)
counts five work areas (telemetry §71, difficulty curve §39, scarcity §40,
density §49, performance §34) that exceed any single leaf, so each is given
its own leaf. Second, source inspection confirms the section 32 validator
`simulateCriticalPath()` that the AC-bal-scarcity proof requires does not
exist in `src/` yet (`understanding.md` flags it as a gap a later work item
must build); building it plus verifying scarcity is a self-contained,
independently testable responsibility, so it is separated from the pacing
tuning rather than bundled into one oversized leaf. Every leaf carries
strictly fewer than the parent's four criteria (and, where it fits, a strict
subset of the parent's subsystems):

- WI-07a: section 71 telemetry/debug instrumentation with a headless-compatible
  export (the recording half of AC-bal-timing).
- WI-07b: section 32 `simulateCriticalPath()` + `validateWorld()` + physical
  route scenarios, and the section 40 scarcity placement (AC-bal-scarcity).
- WI-07c: full instrumented playthroughs plus numerical tuning - oxygen,
  currents, pressure gates (§39), density/travel (§49), tutorial pacing (§53) -
  owning the AC-bal-timing tuning proof and AC-bal-flow.
- WI-07d: 60 FPS at 1080p verification and fix-forward in the largest
  encounter and each band's representative scene (AC-bal-perf).

## Criteria assignment and proof ownership

Children carry parent criteria verbatim; the union covers all four.

- AC-bal-timing: WI-07a (records every section 71 field, headless and
  in-browser) and WI-07c (tunes to the target). Final proof owner: WI-07c -
  the criterion only closes once the metrics are recorded (WI-07a) AND the
  blind run fits 90-120 min and the expert run fits 55-75 min, stated from
  recorded playtest evidence, never from headless math alone. No other child
  re-asserts the tuning.
- AC-bal-scarcity: WI-07b alone. Final proof owner: WI-07b.
- AC-bal-flow: WI-07c alone. Final proof owner: WI-07c.
- AC-bal-perf: WI-07d alone. Final proof owner: WI-07d.

## Dependencies and execution order

- The story depends on ST-06 (content and presentation are stable before
  numbers are trusted); all leaves inherit it.
- WI-07a (telemetry) and WI-07b (reachability/scarcity) are independent of
  each other and run first, in parallel.
- WI-07d (performance) depends on WI-07a (the frame/FPS telemetry it reads);
  it is independent of WI-07c's tuning and runs in parallel with it.
- WI-07c (numerical tuning) depends on WI-07a (to measure the full runs) and
  WI-07b (the path must be provably reachable and material-complete before
  timing is trusted); it finishes the tuning leaves.
- Feeds ST-08: this story owns the balance/perf evidence; ST-08 re-verifies in
  the final spoiler-safe pass.

## Scope inventory (honest, carried into the children)

- Telemetry per section 71 in the existing debug panel (`src/util/debug.ts`):
  play time, zone, max depth, deaths, crafted upgrades, resources
  collected/spent, time since last unlock, oxygen at surfacing, encounter
  timestamps, plus frame/FPS data - shared between the browser and a headless
  scenario export.
- Difficulty curve per section 39: telegraphed early predators, oxygen as
  route planning mid-game, ecology-and-navigation tension deep, altered
  context in the finale (never just maxed damage).
- Scarcity rules per section 40 verified with `simulateCriticalPath()` and the
  full `validateWorld()` (section 32) paired with headless movement scenarios
  against production collision geometry (adjacency is not reachability). Note
  the section 32 validator does not exist yet; WI-07b builds it.
- Density rules per section 49: 20-60 seconds between meaningful points,
  shorter return trips via upgrades/shortcuts, no three-minute empty corridors.
- Performance per section 34 in the largest encounter; stutter is a hard
  defect because it destroys large-creature reveals.

## Constraints and non-goals

- Do not artificially slow experts (section 3 pacing rule).
- No new content additions beyond small resource/cache adjustments; if balance
  says content is missing, file a defect.
- No spoiler content in tuning or performance reports (section 68); internal
  ids and band names only.
- This story tunes, it does not redesign: gameplay/content findings go through
  the normal fix-planning route as fresh work items.

## Fresh-session handoff (for reviewers of the children)

Each child stands alone with its frontmatter plus this story. Read request
sections 3, 32, 34, 39, 40, 49, 53, 71; the existing debug panel
(`src/util/debug.ts`) and scenario harness (`src/sim/scenario.ts`);
`understanding.md` for the `simulateCriticalPath` gap note. Instrumentation
must run headlessly so scenario runs emit the same telemetry fields as the
browser.
