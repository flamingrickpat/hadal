# WI-03c1a — Implementation Result

Date: 2026-09-09
Role: item-implementer
Work item: `workitems/WI-03c1a.md` (parent story ST-WI-03c1, root task hadalv2)

## Result

Done. The five tier-3 predator/territorial `CreatureDef`s (internal ids T-14
through T-18, per the private roster) are in production content, the section
10 damage model is implemented in the simulation, and the
large-predator deterable-not-killable behavior is exercised headlessly
through the real `Simulation`. No per-predator controllers, no production
spawns, no renderer work — all deferred per the work item's non-goals.

Spoiler rules: internal T-ids only. During this session the spoiler sweep
caught one real leak (a roster name token in two content-file comments) and
it was fixed; the sweep now passes across `src/`.

## Acceptance Evidence Table

| Deliverable / criterion | Artifact | Status |
|---|---|---|
| One `CreatureDef` per selected tier-3 organism, with size class, signature rule categories, and the fields WI-03c1b's controllers read | `src/content/secret/hiddenCreatures.ts` (T-14…T-18; `sizeClass`, `rules`, `minimums` on every def) | done — `src/sim/tier3Scenario.test.ts` "tier-3 roster data" (5 tests) |
| Data-level section 11.1 minimums encoded (dangerous-phase-is-not-the-scary-phase; exploitable ecosystem relationship) | `minimums` fields on T-16 / T-18 (plus `non-chase-predator` on T-14, T-18) | done — "encodes the data-level section 11.1 minimums assigned to this tier" |
| Every tier-3 def resolves in the production world data (ids, size class, rule-category fields) | `src/sim/tier3Scenario.test.ts` | done — "production world constructs and every tier-3 id resolves through its registry" + roster-data tests assert `SIZE_CLASSES` membership and ≥1 `rules` entry per def |
| Section 10 damage-model table holds per size class (harpoon cost, deter success, no-kill for large, no HP bar), headless, no predator controller | `src/creatures/combat.ts` (`DAMAGE_MODEL`, `resolveHarpoonHit`) + `src/creatures/combat.test.ts` (4 pure tests) + `tier3Scenario.test.ts` "section 10 damage model in the production simulation" (5 tests through the real `Simulation`: small one-hit kill, medium 5-hit costly kill, large never dies, out-of-range/other-tool whiff, no `hp`/`health` property on any creature) | done |
| Large-predator deterable-not-killable exercised headlessly (deterrence interaction, not a kill) | `Simulation.fireHarpoon()` + `Creature.deterredUntil` / `genericReact` deter-hold gate | done — "a harpoon hit deters a hunting large predator: it withdraws, holds, and re-engages only after the deter expires" |
| Front-matter AC-roster-behavior (≥4 materially non-pursuit behaviors; ≥2 beneficial) | Data/behavior basis only: 2 of 5 defs are `non-chase-predator`, T-18 carries `exploitable-relationship`, large-deter behavior proven | **basis delivered — the roster-wide count and the per-predator non-pursuit controllers are WI-03c1b's**, per the work item's own boundary note |

Verification clause of the spec front matter: all three checks (defs resolve;
damage table holds; large deter headless) are covered by the rows above.

## Commands and Results (all from `C:\Temp\hadal-v2`)

- `npx tsc --noEmit` → EXIT 0 (after implementation, and again after the Shrink pass)
- `npx vitest run` → **223/223 passed (29 files)**, EXIT 0 (full suite, after implementation)
- `npx vitest run src/creatures/combat.test.ts src/sim/tier3Scenario.test.ts` → 17/17 passed (before Shrink); `tier3Scenario.test.ts` alone 13/13 (after Shrink)
- `npm run build` → EXIT 0 (bundle 640.70 kB; the >500 kB chunk notice is the pre-existing informational three.js warning)

Live verification: **not applicable** — this item is explicitly headless and
data-focused ("no renderer work in this item"); the spec's verification method
is the node scenario checks, which were run.

## Files Touched

New:

- `src/creatures/combat.ts` — `DAMAGE_MODEL` (small 1 / medium 5 / large
  Infinity `killShots`), `resolveHarpoonHit`, `HARPOON_RANGE` (600),
  `DETER_HOLD_SECONDS` (20)
- `src/creatures/combat.test.ts` — 4 pure tests on the table
- `src/sim/tier3Scenario.test.ts` — 13 tests: roster data, §11.1 minimums,
  production resolution, no-spawn-yet, damage model in the real simulation,
  large-predator deter scenario, spoiler sweep

Changed:

- `src/creatures/CreatureDef.ts` — `sizeClass` (required), `rules?`,
  `minimums?` on `CreatureDef`; `SIZE_CLASSES`, `SignatureRule` (11 values),
  `RosterMinimum` (4 values)
- `src/creatures/Creature.ts` — `harpoonHits`, `deterredUntil` fields;
  deter-hold early-return in `genericReact()`
- `src/creatures/fixtures.ts` — `sizeClass` on the 5 framework fixtures
- `src/content/secret/hiddenCreatures.ts` — `sizeClass` on all 12
  pre-existing defs; T-14…T-18; `TIER3_CREATURES` / `TIER3_IDS` /
  `TIER3_BANDS` exports; `HIDDEN_CREATURES` now 17
- `src/player/equipment.ts` — `HARPOON` export
- `src/sim/Simulation.ts` — tool rising-edge capture before
  `emitPlayerSignals`; `setToolIndex` moved before `stepCreatures`; new
  `fireHarpoon()` (nearest creature in range, size-class resolution, kill
  removal, deter window + mid-hunt withdraw)
- `src/sim/tier1Scenario.test.ts` — `HIDDEN_CREATURES` count 12 → 17
- `src/sim/creatureScenario.test.ts` — registry count 17 → 22 (dated revision
  note appended, history preserved)
- `src/sim/tier2Scenario.test.ts` — roster-floor test scoped to tier-1+tier-2
  ids (dated revision note; see Deviations 2)
- `src/render/creatureRender.test.ts` — `sizeClass: 'large'` on the inline
  leviathan def (compile requirement of the new required field)

## Revision 2026-09-09 (post-commit-prep): one pre-existing test repaired

- Symptom: after the Shrink pass, two consecutive full-suite runs failed on
  `src/sim/scenarios.test.ts` > "blocked route: the sealed node is
  unreachable from the start" — `Test timed out in 5000ms` (the test's
  6000-step `swimTo` loop runs ~5.6 s under current machine load).
- Isolation: with all my changes stashed (`git stash -u`, untracked
  included), the same single test on the clean base commit fails
  identically (5610 ms vs 5601 ms with my changes). **Not caused by this
  item** — a pre-existing borderline test tripping the default 5 s vitest
  timeout under load. Both runs recorded under
  `scratch/implementer/` (full-suite.log, scenarios-*.log).
- Repair: explicit per-test timeout of 15000 ms on that one test, exactly
  the remedy vitest's error message documents ("pass a timeout value as the
  last argument"). No assertion or logic change; dated revision comment in
  the test.
- Re-verified after the repair: `npx tsc --noEmit` EXIT 0; `npx vitest run`
  → **223/223 passed (29 files)**, EXIT 0 (full-suite-final.log).
- Files touched (additive): `src/sim/scenarios.test.ts`.

## Shrink / Flatten

- Removed: unused `selectHarpoon` helper in `tier3Scenario.test.ts` (defined,
  zero call sites — the tests select via `input.toolSelect` directly).
- Considered and kept: `DAMAGE_MODEL` as a plain module table rather than a
  class (data with no behavior is a table); no `Harpoon` class (one private
  method on `Simulation` is the whole action); no new states in the ST-02
  state machine (the existing vocabulary suffices for the foundation); no
  config file (the two tuning constants live with the table).
- No pass-through wrappers or one-use abstractions were introduced.

## Deviations

1. **`SignatureRule` vocabulary extended by two categories** — the request
   lists nine example categories and says "not a checklist; the private
   roster decides". The private roster's T-15 design (dangerous only when
   cornered) and T-18 design (herds prey into the harvestable field) need
   `cornered-charge` and `herds-prey`; they are documented in the type's
   contract as the roster's two additions beyond the request's list.
2. **Pre-existing tier-2 roster-floor test re-scoped.** It asserted every
   member of `HIDDEN_CREATURES` has a production spawn — true while that list
   held 12 spawned types. This item adds 5 tier-3 types that are
   deliberately unspawned (spawns are WI-03c2's, asserted absent by the new
   `tier3Scenario.test.ts`), so the test now iterates
   `[...TIER1_IDS, ...TIER2_IDS]`; the ≥12 floor is unchanged. A dated
   revision note records the change in place.
3. **`setToolIndex` moved before `stepCreatures` in `Simulation.step`.**
   Without the move, a same-step slot select + tool fire would whiff against
   the previous tool. No existing test depended on the old order (full suite
   green); `input.toolSelect` is still consumed exactly once per step.

## Assumptions

- **Organism selection (T-14…T-18)**: `design_private/creature_candidates.md`
  is the source of truth (per the handoff); these are the private roster's
  five band 3-4 predator/territorial organisms, within the "4-6" range.
- **Size classes by body extent**: T-14 large, T-15 medium, T-16 large,
  T-17 small, T-18 medium — all three classes must be present for the damage
  table to hold, and the assignments match the roster's body designs.
- **Tuning values**: `HARPOON_RANGE` 600 (comparable to the sim's existing
  interaction radii); medium `killShots` 5 ("costly" = several lances);
  `DETER_HOLD_SECONDS` 20 (a full withdraw cycle is observable inside the
  window; headless tests stay fast).
- **Deter semantics**: a bounded hold window that suppresses the generic
  re-engage, plus a withdraw (`return`, target cleared) if the creature was
  mid-hunt. No damage or knockback — section 10 models kill cost, not
  collision physics.
- **Whiff = the existing tool noise blip only**; no lance projectile entity
  in this item (no renderer work; a visible lance is WI-03c2's concern if
  wanted).
- **No state-machine changes**: WI-03c1b's controllers can attach via the
  existing `behavior.controller` hook or the `custom` state without schema
  changes — the fields they read (`sizeClass`, `rules`, `minimums`,
  `deterredUntil`, `harpoonHits`) are all in place.

## Notes for Reviewer

- The deter hold lives in `Creature.genericReact()` as a one-line gate;
  bespoke controllers (WI-03c1b) must read `deterredUntil` if they bypass
  the generic engine — the field's contract says so.
- The spoiler sweep (`tier3Scenario.test.ts`) reads
  `design_private/_spoiler_tokens.txt` and scans `src/` plus this task
  folder's artifacts; T-ids are excluded by design. It caught a real leak
  once during this session, so it is exercising real content.
- The `fireHarpoon` kill path reuses the §20 ambient-pool removal
  (`dead` flag + splice from `creatures` and `schoolMembers`).
- Build warning (>500 kB chunk) is pre-existing and informational.

## Knowledge Notes

Consulted: `20260907-implementer-wi01b-creature-roster.md`,
`20260908-implementer-wi02a-creature-runtime-seams.md`,
`20260907-implementer-wi03a-tier1-fauna.md`,
`20260909-implementer-wi03b1-tier2-interaction-seams.md`.
Written: `20260909-implementer-wi03c1a-tier3-foundation-seams.md`.

## Handoff for WI-03c1b (implementer context)

- Fields your controllers read: `def.sizeClass`, `def.rules`,
  `def.minimums`, `creature.deterredUntil`, `creature.harpoonHits`.
- Deter window: 20 s; the generic engine will not re-engage while
  `time < deterredUntil`, but a `behavior.controller` overrides
  `genericReact` entirely — if your controller hunts, honor the window
  yourself (the contract on `deterredUntil` says to read it).
- Large predators (T-14, T-16) are deter-only: never award a kill against
  them; the damage table returns `deter` forever.
- No production spawns yet: your headless scenarios must author spawns
  themselves (see `greyboxWorld()` in `src/sim/tier3Scenario.test.ts`) or
  wait for WI-03c2's world-data spawns.
- The roster-wide count for AC-roster-behavior (≥4 non-pursuit, ≥2
  beneficial) is your item's to prove; the data basis is encoded
  (`non-chase-predator` ×2, `exploitable-relationship` ×1, plus T-15's
  cornered-charge which is not pursuit).
