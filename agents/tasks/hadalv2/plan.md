# Plan: hadalv2 — finish HADAL from the WI-07 baseline

## Vision

Complete the remaining half of the game on top of the committed baseline
`01066db` (WI-01..WI-07: headless simulation, scenario harness, five-band macro
world, visual language, audio, HUD/crafting/debug/save). The player can already
dive, harvest, craft, and traverse all bands; there is no fauna, no story
payload, and no win condition. This plan delivers:

1. the private section 12 creative pass (hidden world, roster, reveals,
   MacGuffin, endings) inside the repository, spoiler-contained;
2. the creature framework (steering, senses, states, spine renderer, schools)
   attached to the existing `WorldSignalBus` seam;
3. the secret roster implementation;
4. authored encounters, the environmental story sequence, and the MacGuffin
   endgame with at least two ending variants;
5. the full art/audio pass (including the section 26 map overlay and the
   section 43 accessibility controls), the 90-120 minute balance pass, and
   the spoiler-safe handoff.

Nothing in this plan or any descendant artifact names deep creatures, the
lore truth, the MacGuffin's nature, or the endings (request sections 0, 12, 68).

## Approach

- Continue from the baseline; do not rebuild WI-01..WI-07.
- Every gameplay behavior lands in the headless simulation
  (`src/sim/Simulation.ts`, `createSimulation`/`step`) and is evidenced first
  by Node unit tests and headless scenarios (`src/sim/scenario.ts`,
  `src/sim/scenarios.test.ts`). Three.js and DOM stay adapters
  (request section 30).
- The creative pass (ST-01) and the creature framework (ST-02) are independent
  and run first; the roster (ST-03) needs both. Everything downstream is
  linear: encounters -> endgame -> art/audio -> balance -> final handoff.
- ST-07 is expanded (WI-07a, WI-07b, WI-07c, WI-07d). ST-08 is expanded
  (WI-08a, WI-08b, WI-08c).
- Scope discipline per the v2 contract: a work item is one independently
  testable behavior changing at most three named responsibilities.

## Story sequence and dependency order

| Story | Scope (spoiler-safe) | Depends on |
|-------|----------------------|------------|
| ST-01 | Private creative pass (section 12) — expanded: WI-01a, WI-01b, WI-01c | — |
| ST-02 | Creature framework (sections 13, 19, 63) — expanded: WI-02a, WI-02b, WI-02c | — |
| ST-03 | Secret roster implementation (sections 11, 47) — expanded: WI-03a, WI-03b, WI-03c, WI-03d | ST-01, ST-02 |
| ST-04 | Authored encounters + environmental story + world reactions (sections 36, 22, 38, 51, 60, 66) — expanded: WI-04a, WI-04b, WI-04c, WI-04d | ST-03 |
| ST-05 | MacGuffin + non-arena endgame + two endings (sections 23, 24) — expanded: WI-05a, WI-05b, WI-05c | ST-03, ST-04 |
| ST-06 | Full art/audio pass + section 26 map overlay + section 43 accessibility (phase 7, sections 14, 26, 27, 43, 48) — expanded: WI-06a, WI-06b, WI-06c, WI-06d, WI-06e, WI-06f, WI-06g | ST-04, ST-05 |
| ST-07 | Balance + telemetry + performance pass (phase 8, sections 32, 39, 40, 49, 53, 71) — expanded: WI-07a, WI-07b, WI-07c, WI-07d | ST-06 |
| ST-08 | Final verification + spoiler-safe handoff (phase 9, sections 45, 68, 69, 70) — expanded: WI-08a, WI-08b, WI-08c | ST-07 |

Execution order for leaves: WI-01a -> WI-01b -> WI-01c and WI-02a -> WI-02b ->
WI-02c (independent chains), then ST-03 (WI-03a and the WI-03b story,
WI-03b1 -> WI-03b2, in parallel, then the WI-03c story (the WI-03c1 story,
WI-03c1a -> WI-03c1b, then WI-03c2 after WI-03c1b), then the WI-03d story,
WI-03d1 -> WI-03d2 -> WI-03d3), then ST-04
(WI-04a, WI-04b and WI-04d in parallel, then WI-04c after WI-04a and
WI-04d), then ST-05 (WI-05a, then WI-05b, then WI-05c), then ST-06
(WI-06f after WI-04b in parallel; WI-06a, WI-06b and WI-06c in
parallel, then the WI-06d story (WI-06d-a, WI-06d-b and
WI-06d-c in parallel) and the WI-06e story (WI-06e-a and WI-06e-b in
parallel, then WI-06e-c, the final AC-art-sound proof), then WI-06g
after WI-04b and the WI-06d story), ST-07 (WI-07a and WI-07b in parallel,
then WI-07d after WI-07a, and WI-07c after WI-07a and WI-07b), then ST-08
(WI-08a first, then WI-08c after WI-08a, and WI-08b after WI-08a and WI-08c,
the final spoiler audit gate).
ST-01 and ST-02 chains are parallel; any interleaving that respects the
table is valid.

## Verification strategy (request section 70)

- Rules, reachability, persistence, triggers: headless Node evidence via the
  shared scenario harness; fresh-save scenarios only, no teleport/noclip as
  progression proof; `simulateCriticalPath()` paired with physical route
  scenarios for required gates.
- Browser layer: the shared browser harness for boot, input, HUD, storage
  round-trip, resize, audio-after-input; focused checks, no long swim routes.
- Section 26 map overlay and section 43 accessibility controls are verified
  in the browser layer under ST-06 (AC-art-map, AC-art-a11y), including
  pause behavior, the absence of creature markers, and persistence through a
  save round-trip; ST-08 re-verifies both in the final pass.
- Visual/audio/performance claims: live browser inspection of representative
  scenes; the 60 FPS target is checked in the largest encounter (ST-07).
- Fixture-based evidence is labeled and never implies fresh-save
  reachability. Each work item assigns its criteria to a layer in its own
  body.

## Assumption ledger

- The run continues from baseline `01066db` with WI-01..WI-07 accepted;
  falsified if the controller rejects the continuation assumption recorded in
  `understanding.md`.
- "Depth transitions" in section 45 are satisfied by the existing five-band
  macro world once creatures and gates give the transitions meaning; ST-07
  verifies this rather than rebuilding bands.
- Two ending variants are the floor; more are optional and cuttable per
  section 72.
- `design_private/` is gitignored and its content is the only home of hidden
  lore; if ignored files prove inconvenient, the equivalent data moves to
  `src/content/secret/` under the same spoiler rules.
- Creature counts (15+ implemented, 18-24 rostered) assume the private roster
  holds up under the section 46 quality bar; a smaller but stronger roster is
  acceptable only if section 45 minimums still hold.
- The section 26 map overlay and section 43 accessibility controls are
  presentation work owned by ST-06 (AC-art-map, AC-art-a11y): the baseline
  already tracks `discoveredChunks` in the simulation and `masterVolume` in
  the save settings, so the overlay reads existing state and the toggles
  extend the versioned settings. Falsified if the map needs new gameplay
  rules (e.g. mandatory beacon mechanics); a death beacon is displayed only
  if a story adds section 25 beacon tracking, since section 25 makes it
  optional.

## Layout

- `plan.md` — this overview (no frontmatter; not a planning node).
- `stories/ST-01/plan.md` + `stories/ST-01/workitems/WI-01a.md`, `WI-01b.md`,
  `WI-01c.md` — creative pass, expanded.
- `stories/ST-02/plan.md` + `stories/ST-02/workitems/WI-02a.md`, `WI-02b.md`,
  `WI-02c.md` — creature framework, expanded.
- `stories/ST-03/plan.md` + `stories/ST-03/workitems/WI-03a.md` — secret
  roster by size tier, expanded; WI-03b promoted to `stories/ST-WI-03b/`
  (`plan.md` + `workitems/WI-03b1.md`, `WI-03b2.md`), WI-03c promoted to
  `stories/ST-WI-03c/` (`plan.md` + `workitems/WI-03c2.md`) with WI-03c1
  further promoted to `stories/ST-WI-03c1/` (`plan.md` +
  `workitems/WI-03c1a.md`, `WI-03c1b.md`), and WI-03d promoted to
  `stories/ST-WI-03d/` (`plan.md` +
  `workitems/WI-03d1.md`, `WI-03d2.md`, `WI-03d3.md`).
- `stories/ST-04/plan.md` + `stories/ST-04/workitems/WI-04a.md`, `WI-04b.md`,
  `WI-04c.md`, `WI-04d.md` — authored encounters and story layer, expanded.
- `stories/ST-05/plan.md` + `stories/ST-05/workitems/WI-05a.md`,
  `WI-05b.md` — MacGuffin and endgame, expanded; WI-05c promoted to
  `stories/ST-WI-05c/` (`plan.md` + `workitems/WI-05ca.md`, `WI-05cb.md`).
- `stories/ST-06/plan.md` + `stories/ST-06/workitems/WI-06a.md` (surface
  + coast band art pass), `WI-06b.md` (mid bands art pass),
  `WI-06c.md` (deep bands + final zone art pass), `WI-06f.md`
  (section 26 bathymetry map overlay) and `WI-06g.md` (section 43
  accessibility controls) — full art/audio pass, expanded; WI-06d
  promoted to `stories/ST-WI-06d/` (`plan.md` + `workitems/WI-06d-a.md`,
  `WI-06d-b.md`, `WI-06d-c.md`) and WI-06e promoted to
  `stories/ST-WI-06e/` (`plan.md` + `workitems/WI-06e-a.md`,
  `WI-06e-b.md`, `WI-06e-c.md`).
- `stories/ST-07/plan.md` + `stories/ST-07/workitems/WI-07a.md` (section 71
  telemetry and headless export), `WI-07b.md` (section 32 reachability
  validator and section 40 scarcity), `WI-07c.md` (numerical tuning toward
  the 90-120 / 55-75 target) and `WI-07d.md` (60 FPS verification and
  fix-forward) — balance, telemetry, and performance pass, expanded;
  `stories/ST-08/plan.md` + `stories/ST-08/workitems/WI-08a.md` (section 70
  fresh-save end-to-end verification and final coverage checklist),
  `WI-08b.md` (spoiler audit, final gate) and `WI-08c.md` (section 69
  README finish and section 68 handoff message) — final verification and
  spoiler-safe handoff, expanded.
- `planning/` — created by the review role for receipts; not created here.
