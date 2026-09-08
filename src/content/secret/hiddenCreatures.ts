/**
 * problem — the private roster's tier-1 ambient/schooling organisms (request
 *   §11.1) must become real `CreatureDef` data on the ST-02 framework,
 *   spoiler-contained; solution — six data-driven defs in a `secret` content
 *   directory (request §0, §12, §68), each parameterized on the generic
 *   state machine plus the framework's school / filter-feeder ecology, with
 *   one small bespoke controller (T-13) for the roster's flee-signature
 *   marker (request §19 allows bespoke controllers).
 *
 * archetype: information-holder
 * owns: the six tier-1 `CreatureDef`s, the `HIDDEN_CREATURES` list, the
 *   `TIER1_IDS` roster check, and `TIER1_BANDS` (the depth bands the private
 *   roster designed each organism for — the data the world-data band check
 *   in the scenario tests asserts against).
 * not own: the registry (fixtures.ts merges these into `CREATURE_BY_ID`),
 *   the spawn positions (worldData.ts authors them), rendering (the WI-02b
 *   renderer reads `def.body`), or any later roster tier.
 * invariant: every def is neutral (no `combat`); ids are internal codes
 *   only — no creature names or secret descriptions live in this file's
 *   exported data, and this file is the only non-design place they may be
 *   referenced.
 * fails when: a world chunk spawns an id this file does not define — the
 *   `Simulation` constructor throws on registry resolution (request §32).
 */
import { vec2 } from '../../util/math';
import type { CreatureController, CreatureDef } from '../../creatures/CreatureDef';

// T-01 — the dense school (bands: shelf). Its signature: the school parts
// around the moving player (request §48) and a player inside the flock
// radius feels a dense medium (speed damped) — the sim owns the medium
// factor, this def carries the density.
export const T01: CreatureDef = {
  id: 'T-01',
  body: { radius: 14 },
  movement: { maxSpeed: 120, accel: 350, dragRate: 3 },
  senses: { noise: 0.2 },
  behavior: { startState: 'wander', wanderRadius: 300 },
  ecology: { school: true, density: 0.7 },
  audio: { investigate: 't01-attention', flee: 't01-scatter' },
};

// T-02 — the descending filter feeder (bands: shelf, twilight). Its
// signature: it orients to and rides the local current (request §20, §64)
// and keeps sinking with it — a filterFeeder ecology with no signal senses,
// so the current is the only driver.
export const T02: CreatureDef = {
  id: 'T-02',
  body: {
    radius: 22,
    chainCircles: [
      { offset: vec2(-30, 0), radius: 14 },
      { offset: vec2(0, -6), radius: 17 },
      { offset: vec2(30, 4), radius: 13 },
    ],
  },
  movement: { maxSpeed: 60, accel: 180, dragRate: 2 },
  senses: {},
  behavior: { startState: 'forage', wanderRadius: 200 },
  ecology: { school: false, filterFeeder: true },
  audio: { investigate: 't02-drift' },
};

// T-03 — the loose congregation (bands: shelf, twilight, abyss). Its
// signature: a loose, wide-keeping school that parts around the player and
// reforms (request §48) — the framework school behavior with a wide wander
// patch so the congregation stays visibly loose next to T-01's tight school.
export const T03: CreatureDef = {
  id: 'T-03',
  body: { radius: 10 },
  movement: { maxSpeed: 100, accel: 300, dragRate: 3 },
  senses: { noise: 0.15 },
  behavior: { startState: 'wander', wanderRadius: 400 },
  ecology: { school: true },
  audio: { investigate: 't03-attention' },
};

// T-05 — the overhang feeder (band: twilight). Its signature: it hangs in
// place, swaying with the vent current that rises past its overhang
// (request §20) — a filterFeeder with a tiny wander patch, so the vent
// field is what moves it.
export const T05: CreatureDef = {
  id: 'T-05',
  body: {
    radius: 28,
    chainCircles: [
      { offset: vec2(-36, -8), radius: 18 },
      { offset: vec2(-12, 4), radius: 21 },
      { offset: vec2(14, -4), radius: 19 },
      { offset: vec2(36, 6), radius: 16 },
    ],
  },
  movement: { maxSpeed: 30, accel: 100, dragRate: 4 },
  senses: {},
  behavior: { startState: 'forage', wanderRadius: 80 },
  ecology: { school: false, filterFeeder: true },
  audio: {},
};

// T-06 — the everywhere drifter (bands: twilight, abyss, hadal — below band
// 2). Its signature: it rides whatever drift field is around (request §20,
// §64) — a filterFeeder with a small wander patch, so the drift is the
// only driver and it is the ambient presence of the deep bands.
export const T06: CreatureDef = {
  id: 'T-06',
  body: { radius: 8 },
  movement: { maxSpeed: 50, accel: 150, dragRate: 2 },
  senses: {},
  behavior: { startState: 'forage', wanderRadius: 150 },
  ecology: { school: false, filterFeeder: true },
  audio: {},
};

// T-13 — the silent marker (bands: shelf, twilight, abyss). Its signature
// (request §19): it senses approach by noise only, has no combat, and runs
// from it — the generic engine would `investigate` the noise instead, so
// this is the tier's one bespoke controller (well under the ~120-line
// rubric allowance). It flees straight away from the loudest noise while it
// is perceived, and returns to foraging once the noise fades.
const t13Controller: CreatureController = (creature, percept) => {
  // The tool's noise strength is 0.5; the 0.1 trigger sits at half the
  // reference, so the marker runs while the signal is recent and near
  // (distance + temporal decay decide), and forages once it fades.
  if (percept.noise > 0.1) {
    if (creature.state !== 'flee') {
      const source = creature.strongestPos('noise') ?? creature.position;
      creature.fleeFrom(source);
    }
  } else if (creature.state === 'flee') {
    creature.setState('forage');
  }
};

export const T13: CreatureDef = {
  id: 'T-13',
  body: { radius: 12 },
  movement: { maxSpeed: 110, accel: 320, dragRate: 3 },
  senses: { noise: 0.1, range: 2000 },
  behavior: { startState: 'forage', wanderRadius: 200, controller: t13Controller },
  ecology: { school: false },
  audio: { flee: 't13-flee' },
};

/** The tier-1 roster: every organism this work item lands (request §11.1). */
export const HIDDEN_CREATURES: readonly CreatureDef[] = [T01, T02, T03, T05, T06, T13];

/** The tier-1 ids, for registry / world-data checks. */
export const TIER1_IDS: readonly string[] = HIDDEN_CREATURES.map((d) => d.id);

/**
 * The depth bands (1 = surface … 5 = hadal) each tier-1 organism was
 * designed for by the private roster — the world data must spawn each id
 * only inside one of these bands.
 */
export const TIER1_BANDS: Record<string, ReadonlySet<number>> = {
  'T-01': new Set([2]),
  'T-02': new Set([2, 3]),
  'T-03': new Set([2, 3, 4]),
  'T-05': new Set([3]),
  'T-06': new Set([3, 4, 5]),
  'T-13': new Set([2, 3, 4]),
};
