---
tags: [creatures, tier-4, simulation, sonar, visibility, spoiler]
symbols: [nonTargetable, bodyExtent, FULL_BODY_VIEW_RANGE, SONAR_MASSIVE_REF, hasCleanFullBody, applyTier4Interactions, t19Plume, t20Pulse, t22Creak, t23Crossing, t25Reconfig, TIER4_CREATURES, TIER4_IDS, TIER4_BANDS, tier4Scenario]
---

# Tier-4 sim rules and colossal-presence seams (WI-03d1)

Where the section 52 simulation-side scale rules live, for WI-03d2 (renderer
presentation) and WI-03d3 (world-data placement).

- `src/sim/Simulation.ts` — `applyTier4Interactions(dt)` beside the existing
  tier-2/3 loops (called after `applyTier3Interactions`). One private rule per
  organism; per-creature working state in the `tier4` Map (same pattern as
  `tier3Driven`). Design constants sit with the other tier constants:
  `T19_AVOID_RADIUS`/`T19_RETURN_RADIUS`, `T20_PULSE_PERIOD`/`T20_RIDE_RADIUS`/
  `T20_PUSH_SPEED`, `T22_CREAK_PERIOD`/`T22_CREAK_STEP`, `T23_START_RANGE`/
  `T23_ANNOUNCE_RADIUS`/`T23_ANNOUNCE_REFRESH`/`T23_BEAT_PERIOD`,
  `T25_RECONFIG_PERIOD`.
- **Audio gotcha**: `stepCreatures` reads `c.lastTransition` to emit
  `creatureAudioEvents`, and `applyTier4Interactions` runs AFTER it — so a
  `c.setState('custom')` from a tier rule is drained on the NEXT step. This
  works because all tier-4 controllers assign `creature.state =` directly
  (bypassing `setState`, so they never clobber `lastTransition`) and
  `genericReact` never runs when a controller exists. If a future tier-4
  controller calls `setState`, its `custom` blips stop firing.
- **Non-targetable (§10)**: `CreatureDef.nonTargetable` guards
  `fireHarpoon` target selection and `emitPredatorSignals` prey selection
  (no HP bar, no kill path). `Creature.steer`'s flee hold ALSO exempts
  `nonTargetable` — T-23 announces with `PREDATOR_TAG`, and without the
  exemption it stands down inside its own announcement and never crosses.
- **Collision standoff vs trigger radius**: a huge body's own collision
  circles block the player before a small trigger radius can fire (T-19:
  ~390 standoff → `T19_AVOID_RADIUS` 440). When a scenario asserts "the
  player got close", measure against the trigger radius, not a point the
  body blocks.
- `hasCleanFullBody(c)` — sim visibility state: true only when the ENTIRE
  body (root + chain circles) is within `FULL_BODY_VIEW_RANGE` (1200,
  `src/game/constants.ts`). Pure geometry, no allocation. WI-03d2's
  no-clean-view presentation reads this; the T-23 scenario polls it every
  frame.
- Sonar-scale (technique E): non-targetable presences register as
  `SonarObject`s with `size = bodyExtent(def) / SONAR_MASSIVE_REF` (300 →
  size 4). Constructor builds creatures BEFORE the sonar system for this.
  `bodyExtent()` (in `CreatureDef.ts`) = 2 × farthest collision-circle reach.
- `src/content/secret/hiddenCreatures.ts` — T-19/T-20/T-22/T-23/T-25 defs +
  `TIER4_LIST`/`TIER4_CREATURES`/`TIER4_IDS`/`TIER4_BANDS`;
  `HIDDEN_CREATURES` is now all four tiers (22). No production spawns yet
  (WI-03d3) — `TIER4_BANDS` is the band contract for that placement.
- `src/sim/tier4Scenario.test.ts` — one headless signature scenario per
  organism (17 tests) + non-targetable + spoiler containment. `t23World()`
  helper authors a band-5 basin beside `GREYBOX_WORLD`; the fauna
  (T-03/T-06) sit inside T-23's collision span — that's fine, the ecology
  flee steering moves them and the scenario measures displacement (state
  stays `forage`).
- Roster count assertions in `creatureScenario.test.ts` (27) and
  `tier1Scenario.test.ts` (22) grow with the registry — update them when a
  tier lands.
- `scenarios.test.ts` long traversals need explicit `15000` timeouts on this
  hardware (both "blocked route" and "traverses the macro world" trip the
  default 5000ms; reproduced on clean base commits).
