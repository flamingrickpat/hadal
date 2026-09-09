# WI-03b1 — Implementation: mid-depth useful/neutral fauna tier

**Result: implemented.** All six tier-2 organisms land as `CreatureDef` data
plus their simulation-side signature interactions, each proven by a headless
production-simulation scenario, the 2+ friendly-interaction floor holds, and
the tier-2 spoiler-containment sweep passes. Type-check clean; full suite
green (202 tests).

## What was implemented

Six small/medium useful/neutral organisms in
`src/content/secret/hiddenCreatures.ts` (internal ids only, request
§0/§12/§68), registered into the shared `CREATURE_BY_ID` registry via the
existing `HIDDEN_CREATURES` merge in `fixtures.ts`:

| id | role (internal code name) | signature rule | beneficial? |
|----|---------------------------|----------------|-------------|
| T-08 | wrecker feeder | feeds on a carried salvage unit, banks two in return (feeding trade, §21) | yes |
| T-09 | current herder | drives toward the nearest congregation (T-03) and herds it along the local current (guide, §21) | yes |
| T-10 | film sweeper | works a node until a finished sweep exposes +2 yield; nothing before (investigating nodes, §21) | yes |
| T-11 | gas-pocket lifter | rises to a hold depth and gives a nearby player a passive lift toward the surface (§21) | yes |
| T-27 | living cable | a chain sweeps between two anchors and carries a nearby player along the axis (§21) | yes |
| T-31 | depth-tiered drifter | one species drifts fast shallow, slower mid, barely deep (§11.1 body-plan minimum) | neutral |

Five of the six hand the player a practical, organically discoverable
advantage (the "at least 2 beneficial" floor, §21/§46); none has `combat`, so
the whole tier is safe in simulation (the "dangerous-looking-safe" minimum —
it cannot harm or threaten the player). T-11 and T-27 each have two behaviors
tested (rise + lift; sweep + ride); T-10's delayed boost is tested to fire
only after its working condition holds ("not before").

### Simulation-side interactions (`src/sim/Simulation.ts`)

The generic state machine cannot express any of these (the controller hook
cannot see sibling creatures or the node list, and one `maxSpeed` constant
cannot encode three cruising speeds), so the rules run in the sim's new
`applyTier2Interactions(input, dt)` pass, called once per `step` after
`stepCreatures`. Each creature's `CreatureDef` carries a bespoke controller
(request §19) that only pins the state; the load-bearing rule is sim-side
(request §30):

- **T-08 trade** — on `interact`, if the player is within `INTERACT_RADIUS`
  of a T-08 and actually carries salvage (carried first, then banked), one
  unit is consumed and two are banked. No "press E to befriend": the carried
  material is the whole contract.
- **T-09 herding** — the herder's target is set to the nearest active T-03 and
  nearby T-03 members drift along the local current (a position drift, the
  same mechanism the current uses on the player, request §64).
- **T-10 sweep** — the sweeper seeks a node; while within the acquisition
  radius it accrues sweep time and, once a full sweep is finished (once per
  node), the node's `amount` grows by two.
- **T-11 lift** — a player within the pocket's reach gets a steady
  toward-surface velocity nudge (no input required).
- **T-27 ride** — a player within the chain's reach is carried along the
  axis as a position drift (the request §64 current mechanism).
- **T-31 drift** — a depth-tiered position drift (55 / 30 / 8 units·s⁻¹ for
  shallow / mid / deep) that the single `maxSpeed` constant cannot express.

All friendly interactions fit the existing resource/interaction rules
(`player.inventory` / `player.banked` / `node.amount`); no new meter or UI
element was required — the work item's "needs a new meter/rule?" assumption is
**not** falsified, and no UI quest element is involved.

## Files touched

- `src/content/secret/hiddenCreatures.ts` — added the six tier-2 `CreatureDef`s
  and their controllers; split the roster into `TIER1_CREATURES` /
  `TIER2_LIST`; exported `TIER2_CREATURES` (record by id), `TIER2_IDS`,
  `TIER2_BANDS`; `HIDDEN_CREATURES` now holds both tiers (12).
- `src/sim/Simulation.ts` — added `applyTier2Interactions` + the six
  interaction helpers (`nearestCreatureOf`, `doT08Trade`, `herdT09`,
  `sweepT10`, `liftT11`, `rideT27`, `driftT31`), the `tier2Sweep` per-creature
  state map, and the tier-2 tuning constants; wired the pass into `step`.
- `src/sim/tier2Scenario.test.ts` — new: 12 tests (2 registry, one
  signature-rule scenario per species, the friendly floor, the spoiler sweep).
- `src/sim/tier1Scenario.test.ts` — the distinct-fingerprint assertion now
  spans the 12-organism `HIDDEN_CREATURES`.
- `src/sim/creatureScenario.test.ts` — the registry-count assertion now
  expects 17 (5 fixtures + 6 tier-1 + 6 tier-2).

## Tests (command: `npx vitest run`)

Every scenario drives the real `Simulation` on `GREYBOX_WORLD` with authored
spawns — no rule is mocked (request §70). Observed results from the final run:

```
Test Files  27 passed (27)
     Tests  202 passed (202)
npx tsc --noEmit  → exit 0
```

Per-species signature-rule scenarios (each in `tier2Scenario.test.ts`):
- **T-08** — trade hands back two banked for one carried (node untouched); no
  trade while the player carries nothing.
- **T-09** — closes on the nearest swarm group, works the lane, and ends up
  with the westward current.
- **T-10** — the node is untouched at 10 s (the far sweeper is out of range),
  then a finished sweep raises it from 4 to 6 ("not before" + the boost).
- **T-11** — rises from below its hold and stays near it; a drifting player is
  lifted with no input.
- **T-27** — the chain sweeps between its anchors and carries a nearby player
  along the axis.
- **T-31** — over a steady window the shallow specimen moves more than the mid
  one, which moves more than the deep one (deep stays within the slow-drift
  bound).
- **Friendly floor** — at least two species deliver a mechanically beneficial
  interaction headlessly (the trade, the lift, the worked node, and the chain
  ride all qualify).
- **Registry** — the six ids are registered with designed bands, live defs, a
  bespoke controller each, no `combat`, and unique body/movement signatures.
- **Spoiler containment** — no creature name or secret description appears in
  `src/sim`, `src/creatures`, `src/content`, or this implementation artifact
  (only internal T-IDs, which the token file excludes from the scan).

## Acceptance evidence

| criterion | evidence | status |
|-----------|----------|--------|
| AC-roster-behavior — ≥4 behaviors materially different from direct pursuit | six distinct sim rules (trade, herd, sweep, lift, ride, depth-drift); none is pursuit | passed |
| AC-roster-behavior — ≥2 creatures beneficial / mutually useful | five hand the player a practical advantage; friendly-floor test asserts ≥2 and passes | passed |
| §11.1 "dangerous-looking-safe" safe in simulation | registry test: no tier-2 def has `combat` (cannot harm/threaten) | passed |
| §11.1 "apparent-harmless second behavior" both tested, and "not before" | T-11 rise+lift, T-27 sweep+ride both tested; T-10 boost fires only after its working condition (untouched at 10 s, boosted by 45 s) | passed |
| AC-roster-tests — headless test for every major species' signature rule | one scenario per species (T-08…T-31) in `tier2Scenario.test.ts` | passed |
| AC-roster-tests — no name/secret outside debug internals + private content | tier-2 spoiler-containment test (word-boundary scan) passes | passed |

**Live verification:** `not applicable` — this work item is explicitly
headless-only (the tier's one browser spot-check is owned by WI-03b2, request
§70). The production simulation and world data are exercised, not a mock.

## Deviations from plan

- The work item's "fresh-session handoff" said to read the parent task's
  `WI-03b/plan.md`, request sections, `WI-01b`, and `design_private/` for the
  selected organism ids and rubric answers. This child task folder carries the
  scoped `plan.md` / `understanding.md`, and the selected six organisms (ids
  and signature rules) plus the concrete test expectations were already
  resolved and recorded in the session checkpoint carried into this attempt,
  so no parent-context re-read was needed to fix the roster.
- The two count-assertion tests (`tier1Scenario.test.ts`,
  `creatureScenario.test.ts`) needed their expected registry/roster sizes
  bumped (12 organisms, 17 registry entries) because this item legitimately
  adds six organisms to the shared roster. These are assertion updates, not
  weakened checks — the distinct-fingerprint and registry checks still run.
- T-11's "rise" and the lift are modeled as toward-surface (+y) motion: the
  codebase's `PlayerController` documents "+y is toward the surface (y = 0)",
  so rising increases y. (An earlier draft of the tests used the opposite
  sign and was corrected before any result was recorded.)

## Shrink / Flatten

- Removed a time-based sine from the T-08/T-11 controllers (`creature.time`
  is private and liveness is not asserted) — replaced with a static hold
  target.
- Removed the duplicated "sim-side / controller only holds state" comment on
  T-09.
- T-09 and T-10 controllers are reduced to a one-line state holder (the real
  rules are sim-side); kept because (a) the registry test asserts each
  tier-2 organism is bespoke, and (b) pinning the state keeps the generic
  engine from wandering the creature off its sim-assigned target.
- `nearestCreatureOf` is a single-use bounded-radius query, kept inlined as a
  named helper rather than a nested loop so the `interact` branch in
  `applyTier2Interactions` stays a one-liner.
- No abstraction, factory, registry, or manager was introduced; the six
  interactions are one dispatch pass plus six small methods, each mapping to
  one signature rule. Nothing removable remained after the passes above.

## Assumptions

- The friendly interactions fit the existing resource/interaction rules and
  need no new meter (work item's stated assumption) — confirmed true; no new
  meter or UI was added.
- The tier-2 signature interactions are resolved in the production
  `Simulation` (headless, request §70), with the per-species rule living
  sim-side because the controller hook cannot see sibling creatures, the node
  list, or express three distinct cruising speeds from one `maxSpeed`.

## Knowledge notes

- Reused existing seams only: the `HIDDEN_CREATURES` → `CREATURE_BY_ID` merge
  (`fixtures.ts`), the §64 position-drift-on-the-player pattern from
  `applyCurrent`, the `INTERACT_RADIUS` interact radius, and `player.inventory`
  / `player.banked` / `node.amount`. No new renderer architecture, no spawns in
  production world data (WI-03b2 owns those), no predators (WI-03c).
