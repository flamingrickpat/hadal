# WI-04a — Implementation

**Status: implemented.** Five authored spectacle beats land as data-driven
`EncounterTrigger`s in the production world data, each firing through the real
trigger system inside live (headless) gameplay, with authored timing, entrance,
environmental reaction, and a physically traversable escape path. No creature
controller or AI changes.

## What changed

- `src/world/worldData.ts` — five authored beats (internal ids `enc-beat-s1`…
  `enc-beat-s5`, request §0/§68), each `once: true`, each setting one completion
  story flag (`beat-s1`…`beat-s5`) that the reaction layer (WI-04c) gates on:
  - **s1** (shelf, `enterRegion 'shelf'`): the light school (T-03) and driver
    (T-09) reposition via `moveBackgroundCreature`; `playAudio` + `alterAmbient`
    reaction. Staged at the shelf band.
  - **s2** (abyss, `reachDepth 9300`): the structure-bound organism (T-22)
    shifts west, against the east drift, via `moveBackgroundCreature`; creak
    audio + dim reaction.
  - **s3** (hadal strip, `reachDepth 9550`): `camera 'wide'` framing + pulse
    audio + surge ambient.
  - **s4** (hadal strip, `reachDepth 9640`): `camera 'tight'` framing + heartbeat
    audio + dim ambient.
  - **s5** (hadal strip east end, `approachCreature T-25 radius 1200`): the
    plate cluster (T-25) crosses west via `moveBackgroundCreature`; `camera
    'pullback'` + clink audio + surge ambient.
- `src/world/triggers.ts` — one minimal new condition, `approachCreature`
  (player-within-radius of a roster organism), plus the `creatureDistance`
  context field it reads. Added because the east-end beat (s5) is not expressible
  with the §36 timing set: `enterRegion`/`reachDepth`/`timeInRegion` cannot key
  to "the player reached this organism's approach radius" — the deep strip is a
  single region and its depth line is shared by the s3/s4 beats. A unit test for
  the condition lives in `triggers.test.ts`.
- `src/sim/Simulation.ts` — consumes the authored `moveBackgroundCreature` moves
  the trigger writes to `TriggerState.movedCreatures`, repositioning the live
  organism each step. This is the seam that makes the `moveBackgroundCreature`
  action have a visible effect in the sim (no new creature behavior — it
  repositions an existing organism, which then runs its normal state).
- `src/sim/beatScenario.test.ts` (new) — the headless scenarios.

## Tests (node, real simulation, no mocks of the rules)

`src/sim/beatScenario.test.ts` — one scenario per beat from a fresh save, plus
the data-shape check and a determinism run. Each scenario drives the real
`Simulation` along the authored descent route (no noclip, no free resources —
the dive prep harvests salvage and banks at the base, request §53) and asserts
the trigger fires inside its authored timing window, the entrance ran, the
environmental reaction is present in the sim state, the completion flag is set,
and the escape path is physically traversable to a safe region.

- **data shape** — the world data carries exactly five `once` beats, each with an
  entrance action, an environmental-reaction action, a completion flag, and no
  `lockPath`.
- **s1** — fires on first shelf entry; the lights and driver repositioned to
  their authored spots (against the drift / from below); audio + ambient present;
  flag set; **`once` semantics** — re-entering the shelf does not re-fire.
- **s2** — fires at the 9300 depth line; the structure shifted west, against the
  current; creak + dim present; flag set; escape to the safe region.
- **s3** — fires at the 9550 depth line, after s2; `wide` camera + pulse + surge
  present; flag set; escape.
- **s4** — fires at the 9640 depth line, after s3; `tight` camera + heartbeat +
  dim present; flag set; escape.
- **s5** — fires inside the approach radius (not before); the cluster crossed
  west; `pullback` camera + clink + surge present; flag set; escape.
- **determinism** — same seed, full route, run twice: identical beat order
  (s1→s2→s3→s4→s5) and timing.

## Acceptance evidence

| Criterion | Evidence | Status |
|---|---|---|
| 5+ beats fire through the trigger system inside live gameplay | `beatScenario.test.ts`: one headless scenario per beat drives the real `Simulation`; each asserts `triggers.firedIds.has('enc-beat-sN')` | passed |
| each with authored timing | each scenario asserts the beat did **not** fire before its depth/region/approach line and **did** fire at it; s3/s4 assert authored order | passed |
| entrance | s1/s2/s5 assert the organism repositioned to its authored spot; s3/s4 assert the camera modifier is in the sim | passed |
| environmental reaction | each scenario asserts the audio cue and the ambient param are present in the sim state | passed |
| available escape path (no noclip) | each scenario physically swims the escape to a safe region (coast for s1, twilight floor gap for s2-s5) and asserts the player arrived alive | passed |
| `once` semantics | s1 re-enters the shelf and asserts the cue/flag do not re-fire | passed |
| determinism | same seed, full route, run twice → identical beat order and timing | passed |

**Live verification: not run** (headless sim is the proof owner for the sim
criteria; the browser check is the presentation proof and is not run in this
headless session — no substitute was counted).

## Files touched

- `src/world/worldData.ts` (5 beats added)
- `src/world/triggers.ts` (`approachCreature` condition, `creatureDistance` ctx, L2 contract line)
- `src/world/triggers.test.ts` (2 tests: `approachCreature`, structured move)
- `src/sim/Simulation.ts` (consume `movedCreatures`)
- `src/sim/beatScenario.test.ts` (new, 7 tests)

## Shrink / Flatten

- No unused extension points, pass-through wrappers, or one-use abstractions
  introduced. The only added surface is the single `approachCreature` condition
  (justified above) and its one context field.
- The five beats are pure data; no helper, factory, or manager was added.
- No defensive branches for impossible internal states; no silent catches.
- No comments removed (the beat comments carry the request-section citations the
  reviewer audits; the route comments name the non-obvious terrain the descent
  threads, which is not obvious from the coordinates).

## Notes for reviewer

- **Route geometry (the load-bearing detail):** the hadal strip is a thin
  channel (depth 9600-9700) with a pocket ledge overhanging its west end
  (x 18550-19000) and the hadal west wall (x 18100-18500, depth 9600-10000).
  The authored descent therefore travels east to x≈19200 *above* the wall
  (depth 9500) before dropping into the strip — descending at x<18500 strands the
  player west of the wall. This is why the s3/s4 beats key to depth lines the
  player crosses on that single clear drop.
- **s4 depth line (9640, not 9650):** set 10 units shallower than the strip
  bottom so the steering tolerance (40) and the local current cannot leave the
  player just above the line; the hadal floor (9700) caps the drop.
- **s3/s4 camera interaction:** the two depth lines are close enough that a full
  drop fires both; the s3 scenario stops between the lines (depth 9600) so its
  `wide` camera is asserted before s4's `tight` overwrites it.
- **No creature behavior change:** the beats reposition roster organisms via the
  existing `moveBackgroundCreature` action; each organism then runs its normal
  state. Nothing in the creature controllers was touched.
