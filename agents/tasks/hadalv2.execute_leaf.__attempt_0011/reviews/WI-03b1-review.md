# Review: WI-03b1 — Tier 2: CreatureDefs + simulation interactions (incl. friendly)

Status: pass

Reviewed commit: `0361a41` (`[creatures][sim] implement the mid-depth useful
fauna tier`), base `ed512dd`.

This work item ships the six roster "Small/medium useful / neutral" organisms
(T-08, T-09, T-10, T-11, T-27, T-31) as `CreatureDef` data plus their
simulation-side signature interactions, each proven by a headless
production-simulation scenario, with the 2+ friendly-interaction floor and a
tier-2 spoiler-containment sweep.

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| AC-roster-behavior — ≥4 behaviors materially different from direct pursuit | passed | Six distinct sim rules (trade, herd, sweep, lift, ride, depth-drift); the registry test asserts none of the six defs has `combat` (so none can pursue), and each has its own non-pursuit scenario. Independently re-verified four of them (trade, lift, sweep "not before", ride) in my own probes. |
| AC-roster-behavior — ≥2 creatures beneficial / mutually useful | passed | Friendly-floor test asserts ≥2 and passes; my independent probes A1 (T-08 net salvage gain) and A2 (T-11 passive lift) confirm two are real mechanical benefits, and the sweep/ride also qualify. |
| §11.1 "dangerous-looking-safe" safe in simulation | passed | Registry test + my probe C1: no tier-2 def has `combat`, so nothing in the tier can harm/threaten the player. (See Assumptions — the roster assigns the *named* dangerous-looking-safe organism to a set piece owned by WI-03d; the tier-level safety check is the correct tier-2 reading.) |
| §11.1 "apparent-harmless second behavior" both tested, and "not before" | passed | T-11 (rise + lift) and T-27 (sweep + ride) each have both behaviors tested; T-10's delayed boost fires only after a full sweep — my probe B1 confirms the node is untouched at 12 s and boosted after the 20 s sweep. |
| AC-roster-tests — headless test for every major species' signature rule | passed | One scenario per species (T-08 ×2, T-09, T-10, T-11 ×2, T-27, T-31) in `tier2Scenario.test.ts`, all through the production `Simulation` on `GREYBOX_WORLD`. |
| AC-roster-tests — no creature name/secret outside debug internals + private content | passed | My own whole-tree scan (broader than the item's test, which only checks `src/sim`/`src/creatures`/`src/content` + the impl note) found **no** token from `design_private/_spoiler_tokens.txt` outside `design_private/`. T-IDs are the only identifiers used (the token file explicitly excludes them). |

## Findings

None blocking. Two non-blocking observations (neither is a work-item
defect; neither changes the verdict):

1. **`sweepT10` is per-creature, so two sweepers on the same node could each
   apply the +2 boost once (total +4).** `Simulation.ts:659` keys the work/
   finished state on the creature instance, not the node. The roster models T-10
   as one sweeper finishing one node before harvest (a single boost), so this is
   a latent edge case, not the designed behavior; it only manifests if WI-03b2
   authors two sweepers that resolve to the same nearest node. Noted for the
   spawning work item.
2. **The T-27 ride is correctly bounded but terrain-dependent.** When the chain
   sweeps, a player inside the 150-unit reach is carried west; terrain stops it
   (verified — see Probes). This is correct behavior (the player cannot pass a
   wall), but it means the "quick transit" value depends on there being clear
   water along the lane, which WI-03b2's spawn placement must ensure.

## Impact Check

- `applyTier2Interactions` and its six helpers (`doT08Trade`, `herdT09`,
  `sweepT10`, `liftT11`, `rideT27`, `driftT31`) are private to `Simulation` and
  called only from `step` (`Simulation.ts:305`); they branch on the six tier-2
  ids only, so they cannot affect tier-1 or fixture creatures. No external
  callers.
- `HIDDEN_CREATURES` now carries 12 defs; its only consumers are
  `fixtures.ts:106` (the `CREATURE_BY_ID` merge) and `tier1Scenario.test.ts`
  (the distinct-fingerprint check, which now asserts 12 — a **strengthened**
  check, not a weakening). No other production caller.
- `creatureScenario.test.ts` bumped the registry expectation to 17 (5 fixtures
  + 6 tier-1 + 6 tier-2); `tier1Scenario.test.ts` fingerprint check bumped to
  12. Both are assertion updates that track the legitimately larger roster.
- Full suite re-run by me: **27 files / 202 tests passed**; `npx tsc --noEmit`
  exit 0. The commit stages no `state.md`.

## Independent Adversarial Probes

Scratch: `scratch/work_item_reviewer/probe/` (`probe.test.ts` + a scoped
`vitest.probe.config.ts`; run `npx vitest run -c …/probe/vitest.probe.config.ts`).
All five drive the production `Simulation` via the `Scenario` harness (no rule
mocks) with spawn positions/nodes/timings **different** from
`tier2Scenario.test.ts`, so each could distinguish the literal request from the
implementation's interpretation:

- **A1 — T-08 trade net gain.** Spawn at (1500,−850) (not the item's 1850,−800),
  give the player 2 carried salvage, interact. Result: net salvage (carried+banked)
  ≥ +1 and ≥2 banked. Confirms the "1 in / 2 out" contract is real and is a net
  gain, not just a bank delta.
- **A2 — T-11 passive lift.** Spawn at (2200,−1100), settle, teleport the player
  180 u below the settled pocket, no input. Result: player rose > 50 u. Confirms
  the lift is a real, input-free benefit.
- **B1 — T-10 "not before".** One sweeper 120 u from `salvage-3` (inside the 250
  acquisition radius). Result: node still 4 at 12 s, boosted after the 20 s sweep.
  Confirms the second behavior is conditional and does not fire early — the
  literal "triggers under the designed condition and not before."
- **C1 — dangerous-looking-safe.** Every tier-2 def has `combat === undefined`.
  Confirms the whole tier cannot harm/threaten the player.
- **D1 — T-27 ride, near vs far.** Below the coast wall (y<−1000): a player 40 u
  from the chain is carried west (>100 u), a player 250 u out is not (<20 u).
  Confirms the ride is real and bounded to the 150 u reach.

**Probe discrepancy I chased and resolved (not an implementer defect):** my first
D1 run (chain 2500, player 2460, y=−850) showed the player *not* carried
(`nearMoved = −4`). A per-step trace showed the player pinned at x=2464 while the
chain-to-player distance stayed 36–82 (< 150): the ride *was* firing, but the
`wall-slab` pillar at x 2370–2434 (`worldData.ts`, the same feature the tier-1
tests comment on) pins the player at wall-edge 2434 + player radius 30 = 2464.
Moving the probe below the wall (y=−1200) made D1 pass. This confirms the ride
works and that the player correctly cannot be carried through terrain — it is a
spawn-placement consideration for WI-03b2, not a rule bug.

## What I Could Not Verify

- **No browser/presentation verification** — this work item is explicitly
  headless-only (the tier's one browser spot-check is owned by WI-03b2, request
  §70). I verified the rules headlessly through the production simulation; the
  visual read of these creatures is out of scope here.
- **The roster-wide spoiler audit** — the item's containment check is
  tier-2-scoped; the full-roster audit finalizes in WI-03d. My whole-tree scan
  is stronger than the item's test but still scoped to the token file as written.
- **The two §11.1 minimum organisms the roster names (T-19 dangerous-looking-
  safe, T-16 second-behavior)** — see Assumptions; those belong to WI-03d and
  WI-03c respectively, so I could not (and should not have expected) verify
  them here.

## Assumptions

- **Which organisms fill the §11.1 minimums.** The item's Deliverables list
  "(e.g. the looks-dangerous-but-safe organism, the apparently-harmless
  organism with a surprising second behavior, the wreck-incorporating organism)"
  as "assigned to this tier." The private roster (`creature_candidates.md`,
  section 11.1) assigns the dangerous-looking-but-safe role to **T-19** (a "Huge
  ecological set piece") and the harmless-with-a-second-behavior role to
  **T-16** (a "Predator"); the item's own constraints exclude both ("No predators
  (WI-03c), no large/colossal staging (WI-03d)"). Only the wreck-repurposer
  (T-08) genuinely lands in the useful/neutral tier, alongside the two-helpful
  (T-08/T-09/T-10), exploitable-relationship (T-10/T-27), and uncategorizable
  (T-31) minimums. I read the item as: implement the tier-2 minimums that the
  roster actually assigns to this tier, and satisfy the item's *test* requirements
  with the closest tier-2 behavior. The implementer did exactly that (whole-tier
  no-`combat` for "safe in simulation"; T-10 delayed boost + T-11/T-27 two
  behaviors for "second behavior tested / not before"). Reading the item the other
  way — force a T-19/T-16 into tier 2 — would violate its own constraints, so this
  is the reading a careful colleague would take. This means the *named*
  dangerous-looking-safe and second-behavior organisms are deliberately deferred
  to WI-03d/WI-03c, which is consistent with the roster.
- **"No press-E to befriend."** The T-08 trade fires on the `interact` input.
  I read the item's ban as targeting a quest/dialog befriend mechanic, not a
  mechanical resource exchange that requires the player to carry material — which
  is precisely the roster's T-08 signature ("if fed shed material it will clear a
  passage"). No dialogue, no quest flag, no persistent "friendly" state is
  created; the carried material is the entire contract. I did not flag this as a
  defect on that basis.
