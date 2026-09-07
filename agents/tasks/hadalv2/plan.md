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
5. the full art/audio pass, the 90-120 minute balance pass, and the
   spoiler-safe handoff.

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
- Stories ST-03..ST-08 are deliberately left with `children: []` as explicit
  expansion tasks for the next planning sessions. Each carries enough criteria
  and scope to be split alone; do not implement them before they are split.
- Scope discipline per the v2 contract: a work item is one independently
  testable behavior changing at most three named responsibilities.

## Story sequence and dependency order

| Story | Scope (spoiler-safe) | Depends on |
|-------|----------------------|------------|
| ST-01 | Private creative pass (section 12) — expanded: WI-01a, WI-01b, WI-01c | — |
| ST-02 | Creature framework (sections 13, 19, 63) — expanded: WI-02a, WI-02b, WI-02c | — |
| ST-03 | Secret roster implementation (sections 11, 47) | ST-01, ST-02 |
| ST-04 | Authored encounters + environmental story + world reactions (sections 36, 22, 38, 51, 60, 66) | ST-03 |
| ST-05 | MacGuffin + non-arena endgame + two endings (sections 23, 24) | ST-03, ST-04 |
| ST-06 | Full art/audio pass (phase 7, sections 14, 27, 48) | ST-04, ST-05 |
| ST-07 | Balance + telemetry pass (phase 8, sections 53, 71) | ST-06 |
| ST-08 | Final verification + spoiler-safe handoff (phase 9, sections 45, 69, 70) | ST-07 |

Execution order for leaves: WI-01a -> WI-01b -> WI-01c and WI-02a -> WI-02b ->
WI-02c (independent chains), then ST-03, ST-04, ST-05, ST-06, ST-07, ST-08.
ST-01 and ST-02 chains are parallel; any interleaving that respects the table
is valid.

## Verification strategy (request section 70)

- Rules, reachability, persistence, triggers: headless Node evidence via the
  shared scenario harness; fresh-save scenarios only, no teleport/noclip as
  progression proof; `simulateCriticalPath()` paired with physical route
  scenarios for required gates.
- Browser layer: the shared browser harness for boot, input, HUD, storage
  round-trip, resize, audio-after-input; focused checks, no long swim routes.
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

## Layout

- `plan.md` — this overview (no frontmatter; not a planning node).
- `stories/ST-01/plan.md` + `stories/ST-01/workitems/WI-01a.md`, `WI-01b.md`,
  `WI-01c.md` — creative pass, expanded.
- `stories/ST-02/plan.md` + `stories/ST-02/workitems/WI-02a.md`, `WI-02b.md`,
  `WI-02c.md` — creature framework, expanded.
- `stories/ST-03/plan.md` .. `stories/ST-08/plan.md` — unexpanded expansion
  tasks with acceptance criteria and split hints.
- `planning/` — created by the review role for receipts; not created here.
