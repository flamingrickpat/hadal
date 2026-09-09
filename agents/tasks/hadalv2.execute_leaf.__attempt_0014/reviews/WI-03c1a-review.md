# Review: WI-03c1a

Status: pass

Work item: `workitems/WI-03c1a.md` — Tier 3 foundation: CreatureDefs + section 10
damage model. Committed as `00e17c2` ("added the tier-3 creature definitions and
the section 10 damage model").

## Acceptance Criteria

The work item's own contract is the `behavior` field plus the three `verification`
checks (defs resolve; damage table holds; large deter exercised headlessly). The
front-matter `AC-roster-behavior` is a roster-wide criterion that this item provides
the data/behavior basis for and that the work item explicitly defers its final
count to WI-03c1b (see note below the table).

| Criterion | Verdict | Evidence checked |
|---|---|---|
| One `CreatureDef` per selected tier-3 organism in `src/content/secret/hiddenCreatures.ts`, carrying size class + signature rule categories + the fields WI-03c1b's controllers read | passed | `hiddenCreatures.ts` T-14…T-18 each carry `sizeClass`, `rules`, and (where the roster assigns) `minimums`; the five ids are exactly the private roster's 5 predator/territorial organisms (creature_candidates.md Part 2: "T-14, T-15, T-16, T-17, T-18"). `tier3Scenario.test.ts` "tier-3 roster data" (5 tests) asserts registry resolution, valid size class, ≥1 rule per def, 3 size classes present, ≥2 large predators. |
| Section 11.1 data-level minimums encoded for this tier | passed | T-16 `minimums` include `dangerous-phase-not-scary-phase` + `harmless-with-second-behavior` (P08 boulder); T-18 `minimums` include `exploitable-relationship` + `non-chase-predator`; T-14 `minimums` include `non-chase-predator`. `RosterMinimum` vocabulary (4 values) defined in `CreatureDef.ts`. |
| Every tier-3 `CreatureDef` resolves in the production world data (ids, size class, rule-category fields) | passed | `tier3Scenario.test.ts` "production world constructs and every tier-3 id resolves" — production `Simulation(makeSimWorld())` constructs (throws on unknown spawn id, §32), and each id resolves through `CREATURE_BY_ID` into a live creature. Also "no tier-3 id is spawned in the production world data yet" (respects the no-spawn non-goal). |
| Section 10 damage model per size class holds headlessly: harpoon cost scales (small quick kill, medium costly kill), deter success for large, no-kill for large | passed | `combat.ts` `DAMAGE_MODEL` = {small:1, medium:5, large:Infinity killShots}; `combat.test.ts` (4 pure tests) + `tier3Scenario.test.ts` "section 10 damage model in the production simulation" (5 tests through the real `Simulation`): small T-17 one-hit kill + pool removal; medium T-15 4 hits survive, 5th kills; large T-14 3 hits never die; out-of-range/other-tool whiff; no `hp`/`health`/`maxHp`/`hpMax` on any tier-3 instance. |
| No HP bar exposed for any tier-3 organism | passed | `DAMAGE_MODEL` entries carry only `killShots` (asserted key-exact in `combat.test.ts`); live `Creature` instances expose no hp/health property (asserted, and re-confirmed by reviewer probe); HUD (`src/ui/hud.ts`) renders only player O2/HP; no creature HP bar in the render layer. |
| Large-predator deterable-not-killable exercised headlessly (deterrence interaction, not a kill) | passed | `Simulation.fireHarpoon()` resolves `deter` for large; `tier3Scenario.test.ts` "large-predator deterable-not-killable" (T-14) shows: alert on noise → stalk → harpoon hit resolves deter (not kill, stays in pool) → withdraws to `return` → back to post `idle` → deter window suppresses re-hunt inside the window → re-engages only after `DETER_HOLD_SECONDS` lapse. |
| Anti-cliché (section 11.2) + section 46 shark test (data half) | passed | No giant shark / neon-blue / size-scaled-fish among T-14…T-18 (disc guardian, tail-less burst interceptor, boulder ambush, silk colony, filter-plane field herder); `tier3Scenario.test.ts` "keeps body and movement signatures unique across the whole roster" asserts no two defs share a body+movement fingerprint. |
| Spoiler rules (sections 0/12/68): internal ids only | passed | Commit message uses "tier-3 creature definitions" (no hidden proper nouns); `tier3Scenario.test.ts` "spoiler containment" sweeps `src/sim`, `src/creatures`, `src/player`, `hiddenCreatures.ts`, and this task's `implementation/*.md` against `design_private/_spoiler_tokens.txt` (T-ids excluded by design) and finds zero offenders. |
| **AC-roster-behavior** (≥4 materially non-pursuit behaviors; ≥2 beneficial/mutually useful; §47 coverage) | **basis delivered — final count deferred to WI-03c1b** | This item lands the tier-3 *data/behavior basis*: 2 of 5 defs are `non-chase-predator` (T-14, T-18), T-18 is `exploitable-relationship`, T-15's `cornered-charge` is not pursuit, and the large-deter (never-pursuit) behavior is proven headlessly. The roster-wide ≥4/≥2 count is not closable by this item alone (the genuinely *beneficial/helpful* species — T-08/T-09/T-10/etc. — are the tier-2 roster from the earlier WI-03b item). The work item's own boundary note assigns the roster-wide count and the per-predator non-pursuit controllers to WI-03c1b. This is a correct, documented split, not a gap. |

## Findings

None. No defect, missing required evidence, or contract violation was found.

Notes (non-blocking, for the WI-03c1b implementer — not findings against this item):

- The harpoon's own tool-noise signal (emitted in `emitPlayerSignals`, before
  `stepCreatures`) will itself alert a noise-sensing large predator (T-14) to
  `alert` on the same step, so a harpoon hit on a noise-sensing large predator
  in practice always resolves as *deter + withdraw* (`return`). Creatures with no
  senses (T-16) deter while idle. Both are correct; WI-03c1b's bespoke
  controllers bypass `genericReact` and must read `deterredUntil` themselves —
  the field's contract already says so.
- `AC-roster-behavior` is a roster-wide criterion. Confirm in WI-03c1b that the
  final roster-wide tally (≥4 non-pursuit, ≥2 beneficial) is actually asserted
  against the full 22-organism roster, not just the tier-3 slice.

## Impact Check

Ran the blast-radius check (codegraph) plus targeted caller greps on every changed
production symbol:

- `setToolIndex` (`PlayerController.ts:141`) — single production call site,
  `Simulation.step` line 310 (moved before `stepCreatures` this item; deviation #3,
  recorded). `PlayerController.test.ts` still exercises the index bounds; full suite
  green. No other caller depends on the old ordering.
- `fireHarpoon` / `isHuntingState` / `resolveHarpoonHit` — new; only called from
  `Simulation.step` (harpoon path) and `combat.ts` (pure resolver). No pre-existing
  callers disturbed.
- `HIDDEN_CREATURES` / `TIER3_*` — `HIDDEN_CREATURES` merges into the
  `CREATURE_BY_ID` registry (`fixtures.ts`); the two count assertions
  (`tier1Scenario` 12→17, `creatureScenario` 17→22) were updated to match and pass.
- `Creature` (`harpoonHits`, `deterredUntil`, the `genericReact` deter gate) — the
  gate is an early-return that only suppresses re-engage while `time < deterredUntil`
  (0 by default = no effect), so pre-existing tier-1/tier-2 creatures are
  behaviorally unchanged; the whole 29-file / 223-test suite is green.
- `CreatureDef.sizeClass` (now required) — `tsc --noEmit` exit 0 confirms every
  existing def (6 tier-1, 6 tier-2, 5 framework fixtures, the render test's inline
  leviathan) was given a `sizeClass`; no def is left without one.
- `scenarios.test.ts` — one pre-existing borderline test got an explicit 15000 ms
  timeout after the implementer reproduced the identical 5 s timeout failure on the
  clean base commit (evidence in `scratch/implementer/` logs). No assertion or logic
  change; the remedy is the one vitest's own error message documents.

## Independent Adversarial Probes

Scratch probe committed at
`agents/tasks/hadalv2.execute_leaf.__attempt_0014/scratch/reviewer/wi03c1a-probe/probe.test.ts`
(5 tests, driven through the real production `Simulation` — no mocks). All 5 pass.
Each was chosen to distinguish the literal request from a narrower interpretation:

1. **Damage model keyed by size class, not the combat flag.** The implementer's
   medium test uses T-15 (which *has* `combat`). This probe uses **T-18** (a
   medium with **no** `combat` — the never-attacks field herder) and asserts it
   still dies on exactly the 5th hit. If the model secretly keyed on `combat` or on
   a specific id, this would fail. It does not — the table is size-class driven.
2. **Large deter on a different large organism.** The implementer's large test uses
   T-14. This probe uses **T-16** (the other large, no-senses boulder) and asserts
   three hits never kill and `deterredUntil` is (re)asserted/refreshed forward each
   time. Confirms deter is size-class behavior, not T-14-specific.
3. **Nearest-creature targeting.** Spawned two T-17s (one ~134 u, one ~561 u, both
   in range). One shot kills only the nearer; the farther survives and is the
   remaining pool entry. Confirms the "nearest creature in range" claim with an
   unambiguous two-target case.
4. **Whiff is a no-op.** A single T-17 placed just beyond `HARPOON_RANGE` survives
   a shot. Confirms out-of-range resolution.
5. **No HP bar on any live tier-3 instance.** Instantiated all five (T-14…T-18) in
   one sim and asserted none exposes `hp`/`maxHp`/`health`/`hpMax`.

Commands run (all from `C:\Temp\hadal-v2`):
- `npx tsc --noEmit` → EXIT 0.
- `npx vitest run` (full suite) → **223/223 passed (29 files)**, EXIT 0.
- `npx vitest run src/creatures/combat.test.ts src/sim/tier3Scenario.test.ts` →
  17/17 passed.
- Reviewer probe (config `.../scratch/reviewer/wi03c1a-probe/vitest.config.ts`) →
  5/5 passed.

Player start verified against `worldData.ts` (`PLAYER_START = vec2(1300, -100)`),
so all probe distance math is anchored to the real spawn, not a test comment.

## What I Could Not Verify

- **Live/browser behavior** — intentionally out of scope: the work item is
  headless and data-focused ("no renderer work in this item"); there is no
  renderer change to boot-verify, and the spec's verification method is the node
  scenario checks, which were run. (The one render-layer touch is a
  `sizeClass: 'large'` field added to an inline test def to satisfy the new
  required field — a compile necessity, not a feature.)
- **AC-roster-behavior's roster-wide count** — cannot be closed by this item;
  it spans tiers 1–3 and the beneficial/helpful species live in the earlier
  tier-2 item. Verified only the tier-3 data/behavior basis this item owns.
  The final ≥4/≥2 assertion is WI-03c1b's to make (see note above).
- **Per-predator non-pursuit controllers and their headless signature
  scenarios** — explicitly deferred to WI-03c1b by the work item's non-goals;
  not present (and not required) in this item. Confirmed no tier-3 def carries a
  bespoke controller, so all five use the generic engine where the deter gate
  applies.
