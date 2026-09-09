# Review: WI-03c1b

Status: findings

Reviewer: work-item-reviewer (fresh session; never saw the implementation
while it was built). Reviewed commit `0ed789a` (product: `src/content/secret/
hiddenCreatures.ts`, `src/sim/Simulation.ts`, `src/sim/tier3Scenario.test.ts`).

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| AC-roster-behavior: 4+ behaviors materially different from direct pursuit, 2+ beneficial, matching the private roster's anti-cliche / §47 principle coverage | **passed** | `FINAL PROOF: AC-roster-behavior` in `tier3Scenario.test.ts` (data half asserts every tier-3 rule category is a non-pursuit set; behavior half counts 5 non-pursuit probes — T-14 armed-without-pursuit, T-16 cover strike, T-17 noise trip, T-18 no-combat, T-13 flee-from-noise in the production world — and 3 beneficial probes — T-08 trade, T-11 lift, T-18 field harvest). I ran the file: **21/21 pass**. Confirmed the 5 organisms + rules match `design_private/creature_candidates.md` (T-14 Wardens territory/sonar, T-15 Hounds cornered-charge, T-16 Ambush attacks-from-cover, T-17 Snare-moths territory/noise, T-18 Flusher herds-prey). Count base spans 10+ implemented species. |
| AC-roster-tests: every implemented major species has a headless behavior test for its signature rule (trigger + must-not-trigger control) | **passed** | One headless scenario per tier-3 organism in `tier3Scenario.test.ts`, each with a trigger approach and a must-not-trigger control, through the `Scenario` harness over the production `Simulation` + `GREYBOX_WORLD` (no rule mocks). Non-chase signature paths (T-14, T-16, T-17) asserted to avoid `attack`/`stalk` from fully polled state traces. I re-ran the file (21/21) and independently re-verified T-14/T-15/T-18 in my own probes (see below). |
| AC-roster-tests (tier-3 half): no creature name or secret description outside debug internals and the private content files | **passed** | `spoiler containment` test scans `src/sim`, `src/creatures`, `src/player`, `hiddenCreatures.ts`, and the attempt-14/15 implementation `.md` artifacts, word-boundary matched against `design_private/_spoiler_tokens.txt` (T-IDs excluded). It passed in the run. I independently re-scanned all of `src/**` and the attempt-0015 task artifacts for every name token (case-insensitive) and found **zero** leaks in product source or implementation artifacts. The only match anywhere was the generic English noun "ambush" (lowercase) in the planner-authored spec/request/understanding example list — not the creature name, and outside the sweep's scan scope. |

Non-AC deliverables (also satisfied): per-predator controllers over the
WI-03c1a defs; ≥1 non-chase hunting strategy (T-14, T-16, T-17, T-18 all
non-chase; T-15 is the on-design cornered-charge); §11.1 minimums realized
(T-16 dangerous-phase-not-scary-phase, T-18 exploitable-relationship — both
data-asserted and behavior-tested); player-creature damage path added for the
tier-3 rules (clamped, `handleDeath` unchanged); no production spawns, no
renderer work.

## Verification I ran myself (commands + observed results)

- `npx vitest run src/sim/tier3Scenario.test.ts` → **21 passed (21)**.
- **RED confirmation** (non-vacuity): checked out the two product source files
  (`hiddenCreatures.ts`, `Simulation.ts`) from the pre-implementation commit
  `360ff1e`, kept the new test file, re-ran → **8 failed | 13 passed**; then
  restored both files from `0ed789a` (working tree clean after). This matches
  the implementer's recorded RED exactly and proves the tests are load-bearing,
  not stubs.
- `npx vitest run` (full suite) → **29 files, 231 passed (231)**.
- `npx tsc --noEmit` → **exit 0**.
- Independent adversarial probes (below) → 3/3 pass.

## Impact Check

- Ran codegraph callers on `Simulation` (11 callers: `Game.ts`, `scenario.ts`,
  `menu.ts`, tests) and on the tier-3 entry points (`applyTier3Interactions`,
  `t14Post`…`t18Herd`). The only new callers of the tier-3 rule methods are
  inside `applyTier3Interactions`; no other subsystem depends on them.
- `combat.damage` was previously data-only; the tier-3 pass is the first place
  it applies to the player. I checked `handleDeath` (unchanged) and the generic
  `attack` state still does not damage the player — so the only player-damage
  sources are the new tier-3 rules. No other caller of `combat.damage` was
  introduced. `Creature`/`CreatureDef` public surface: only `behavior.controller`
  is newly set on four defs (a field that already existed per §19); no signature
  or field added to shared types. `emitPredatorSignals`/`isHuntingState` treat
  `attack` as a hunting state, so T-15's bounded charge can register a bounded
  prey kill on the ambient pool — this is on-design for T-15 (hunts the floc)
  and is a single bounded event, not an unbounded chase. No unintended callers.

## Independent Adversarial Probes

Committed under `scratch/reviewer/adversarial/` (`reviewer.test.ts` + its own
`vitest.config.ts`; run: `npx vitest run --config agents/tasks/hadalv2.execute_
leaf.__attempt_0015/scratch/reviewer/adversarial/vitest.config.ts`). All use the
production `Simulation` + `GREYBOX_WORLD` (no rule mocks) at seeds/positions
different from the implementer's scenarios.

1. **T-14 re-arm robustness** (seed 7001): three repeated loud-sonar encounters
   while the player is inside the 260u net, with 12s gaps to outlast the 10s
   snap reset. Asserts: the post arms (`alert`) at least once, the net snaps at
   least once, the player survives (health > 0, i.e. the snap is recoverable /
   not lethal per the private design), and the state path **never** enters
   `attack`/`stalk`. → **passed**. This is stronger than the implementer's
   single-encounter test: it confirms the non-chase signature and re-arming hold
   across several encounters ("learnable by observation within a couple of
   encounters").
2. **T-15 silent vs loud corner** (seed 7002): the player is 40u from the
   organism but silent for 15s → never charges (`attack` never seen, health
   100); then a loud tool use at the same proximity → one bounded charge
   (`attack` entered) and damage dealt. → **passed**. Confirms "dangerous only
   when cornered (and loud)."
3. **T-18 drive + non-hostile** (seed 7003): three T-03 schooling members are
   driven into the 150u field around the herder; the player's health stays 100
   (the herder never attacks); the herder's state path is `wander`-only; and the
   player collects a driven member for exactly +1 salvage. → **passed**.

Note on the probes: my first run of #1 and #2 failed because I passed the
post's *y* coordinate where `teleportTo(x, depth)` expects *depth* (`position =
(x, -depth)`). Correcting to `depth=300` made both pass. The implementer's own
tests use the correct convention, which is why they pass; this was a probe bug,
not an implementation bug.

## Findings

1. **Duplicated bespoke controller (T-16 / T-17) — violates the work item's
   anti-duplication assumption.** In `src/content/secret/hiddenCreatures.ts`,
   `t16Controller` (lines 401-406) and `t17Controller` (lines 409-414) have
   byte-identical bodies: both pin the state to `idle`/`target=null` unless the
   state is `custom`. The work item's stated assumption is explicit — "Falsified
   if two predators need the same bespoke controller - generalize it instead of
   duplicating" — and the boring-code rule of two independently says that two
   real users of identical logic should be a single parameterized controller,
   not two copies. The fix is a one-line factory, e.g.
   `const pinIdleExcept = (armed: CreatureState) => (creature) => { if
   (creature.state !== armed) { creature.state = 'idle'; creature.target = null; } }`,
   with `t14 = pinIdleExcept('alert')` and `t16 = t17 = pinIdleExcept('custom')`.
   **Why it matters / what would satisfy it:** the two controllers are
   duplicates of one controller, which the spec named as the condition that
   falsifies the design assumption. Separately, the implementer's Shrink/Flatten
   report states the T-14/T-16/T-17 pins are "3-line state pins with **different
   armed states**, not copies of one controller" — that is factually wrong for
   T-16/T-17 (both use `custom`), so the self-report understates the
   duplication. This is low severity (no acceptance criterion depends on it, all
   tests pass), but it is a real, actionable violation of the work item's own
   contract. Satisfying it means extracting one parameterized pin controller and
   correcting the Shrink/Flatten note.

### Non-blocking observations (not routed as findings)

- The implementation commit `0ed789a` also swept in
  `agents/tasks/hadalv2.execute_leaf.__attempt_0014/scratch/reviewer/
  wi03c1a-probe/AGENTS.md` — a directory-index file belonging to a different
  task folder and the reviewer role of the prior work item (WI-03c1a). It is a
  benign index (no other role's conclusions are altered) and not product code or
  `state.md`, but it is outside this implementer's scope. Flagging for the
  record; no action required for the acceptance criteria.

## What I Could Not Verify

- Live / browser behavior: the work item explicitly defers the tier's only
  browser spot-check to WI-03c2 and declares all evidence here headless
  (§70 layers). There is no live browser criterion for this item, so I did not
  run one; nothing is claimed about presentation or 60 FPS.
- The `design_private/` rubric "§47 principle coverage" and "§11.2 anti-cliche"
  judgments are design-level (whether each organism's mechanic is
  non-shark-substitutable, whether it reads as its intended archetype) and are
  recorded in `creature_candidates.md`; the simulation can only assert the
  data-level proxies (unique body/movement signatures, rule categories, size
  classes), which it does. The full roster-wide spoiler audit and the
  large/colossal staging are owned by WI-03d, not verified here.
- I could not re-run the implementer's `scratch/implementer/t*-probe/probe.mjs`
  files directly with plain `node` (they import extensionless TS through
  `Simulation.ts`), so I treated their reported numbers as implementer evidence
  and verified the underlying behavior through my own vitest probes instead.

---

# Review attempt 2 (2026-09-09) — re-review after the attempt-3 fix

Status: pass

Fresh reviewer session (never saw the implementation being built). Scope: the
attempt-3 fix commit `331ae76` ("de-duplicated the tier-3 rest-state pin
controllers"), which exists solely to resolve the single finding above, plus
regression re-runs. The base (`0ed789a`, the attempt-2 implementation) was
fully verified by the review above and is unchanged in the fix commit — the
product delta is `src/content/secret/hiddenCreatures.ts` only (27 changed
lines: the `pinRestExcept` factory, the three controller definitions, one
added type import, comments). `Simulation.ts` and `tier3Scenario.test.ts` are
byte-identical to `0ed789a`.

## Acceptance Criteria (re-verified)

| Criterion | Verdict | Evidence checked |
|---|---|---|
| AC-roster-behavior (4+ non-pursuit behaviors, 2+ beneficial, anti-cliche/§47 coverage) | **passed** | No product behavior changed in the fix commit; the FINAL PROOF test is unchanged and I re-ran it as part of `npx vitest run src/sim/tier3Scenario.test.ts` → **21 passed (21)** at `331ae76`. |
| AC-roster-tests (headless signature-rule test per species; spoiler containment) | **passed** | Same re-run (21/21, including the spoiler sweep). I additionally re-scanned all **added lines** of `331ae76` case-insensitively against all 62 name/story tokens in `design_private/_spoiler_tokens.txt`: zero name hits (only T-IDs, which the token file explicitly excludes from the scan). Commit message uses "buried/territorial mid-depth predator controllers" — no names. |
| Work-item contract: anti-duplication assumption ("falsified if two predators need the same bespoke controller") | **satisfied by `331ae76`** | The byte-identical `t16Controller`/`t17Controller` bodies are gone. One parameterized factory `pinRestExcept(armed: CreatureState): CreatureController` now owns the pin body; `t14Controller = pinRestExcept('alert')`, `t16Controller = pinRestExcept('custom')`, `t17Controller = pinRestExcept('custom')`. Source-level check: the exact pin body occurs exactly once in `hiddenCreatures.ts` (line 389) and no inline `creature.state !== 'custom'` comparison remains. The implementer also corrected its Shrink/Flatten self-report in the dated revision section of `implementation/WI-03c1b-implementation.md`, as the finding required. |

## Verification I ran myself (commands + observed results)

- `git show 331ae76` (full diff) → product change is `hiddenCreatures.ts` only; artifact changes are the dedup project note + its index entry + the implementation-note revision section. No `state.md`, no other task folders, no other product files.
- `npx vitest run src/sim/tier3Scenario.test.ts` → **21 passed (21)** (740 ms).
- `npx vitest run` (full suite) → **29 files, 231 passed (231)** (11.46 s).
- `npx tsc --noEmit` → **exit 0** (also proves the new `CreatureState` type import from `creatures/CreatureDef` resolves).
- Attempt-1 regression probes re-run: `npx vitest run --config agents/tasks/hadalv2.execute_leaf.__attempt_0015/scratch/reviewer/adversarial/vitest.config.ts` → **3 passed (3)** at `331ae76` — the fix is behavior-neutral end-to-end (T-14 re-arm/snap, T-15 cornered-charge, T-18 drive/harvest all hold).
- New attempt-2 probes (below) → **5 passed (5)**.

## Impact Check

- `pinRestExcept` has three real users (T-14, T-16, T-17) — a genuine
  generalization under the rule of two, not an abstraction for one user.
- `t14Controller`/`t16Controller`/`t17Controller` are module-private and read
  only through their respective `CreatureDef.behavior.controller` fields
  (wiring verified: T-14 line 431, T-16 line 485, T-17 line 511); the
  `Creature` step path is the only consumer. No signature changes anywhere;
  the only public-surface effect is the type-only import.
- No other controller in the file duplicates the pin: all tier-2 controllers
  pin `forage` (six `creature.state = 'forage'` sites — pre-existing tier-2
  data-driven pins, out of scope for this item and untouched here), T-13 has
  its own flee machine, T-15 is a distinct no-op stand-down, T-18 has no
  controller.

## Independent Adversarial Probes

New file `scratch/reviewer/adversarial/pin-probe.test.ts` (committed, indexed
in that folder's `AGENTS.md`), run with the same one-liner config:
`npx vitest run --config agents/tasks/hadalv2.execute_leaf.__attempt_0015/scratch/reviewer/adversarial/vitest.config.ts` → **8 passed (8)** (5 new + 3 regression).

1. **Pin behavior equivalence, per state, through the real defs** (T-14 armed
   `alert`; T-16 and T-17 armed `custom`): for every state in
   `CREATURE_STATES`, I set a real `Creature` to that state with a live
   target and invoked the def's real `behavior.controller`. Non-armed states
   must pin to `idle` with `target === null`; the armed state must be left
   untouched (state and target both preserved). This could falsify the fix if
   the factory were wired to the wrong armed state, inverted the comparison,
   or dropped the `target = null` — all would fail specific assertions.
   → **passed** for all three organisms.
2. **T-18 controller absence**: `T18.behavior.controller === undefined` —
   confirms the note's claim that generic wander is its whole motion (no
   controller smuggled in by the refactor). → **passed**.
3. **Deduplication is real, not cosmetic**: the exact pin body
   (`creature.state = 'idle';` + `creature.target = null;`) occurs exactly
   once in `hiddenCreatures.ts`, no inline `!== 'custom'` comparison
   remains, and the `pinRestExcept` factory is present. → **passed**.

## Findings

None. The single attempt-1 finding is resolved exactly as prescribed
(parameterized factory + corrected Shrink/Flatten self-report), the fix is
behavior-neutral (full suite + regression probes green), and the commit
contains nothing outside the finding's scope.

## What I Could Not Verify

Same exclusions as the attempt-1 review: no live/browser criterion exists for
this item (deferred to WI-03c2 per the work item); design-level §47/§11.2
judgments remain design-level; the roster-wide spoiler audit and
large/colossal staging are WI-03d's. Nothing new could not be verified: the
fix commit's complete product surface is 27 lines in one file, read in full.
