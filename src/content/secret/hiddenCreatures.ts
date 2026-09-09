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

// ---- Tier 2 — the mid-depth useful/neutral fauna (request §11.1, §21) ----
//
// Six small/medium organisms: five of them hand the player a practical
// advantage (feeding trade, herding guide, node sweep, passive lift, chain
// ride) and one changes its whole body plan with depth. None is hostile.
// Their signature rules are simulation-side (request §30): the `Simulation`
// resolves the interactions against the player's real input and inventory
// each step — these defs carry only bodies, movement, and the bespoke
// controllers (request §19) the generic machine cannot express.

// T-08 — the wrecker feeder (bands: mid 3,4). Signature: it feeds on what
// the player feeds it — trading one carried salvage unit for two salvaged
// units banked (request §21 feeding trade). The player discovers the trade
// by carrying material near it; there is no dialogue or prompt.
const t08Controller: CreatureController = (creature, percept, dt) => {
  void percept;
  void dt;
  // Hold at home so it waits at its feeding spot (the generic engine would
  // wander away); the sim's trade rule is what makes it useful.
  creature.state = 'forage';
  creature.target = vec2(creature.home.x, creature.home.y);
};

export const T08: CreatureDef = {
  id: 'T-08',
  body: { radius: 26, chainCircles: [{ offset: vec2(0, 18), radius: 12 }] },
  movement: { maxSpeed: 80, accel: 240, dragRate: 2.5 },
  senses: {},
  behavior: { startState: 'forage', controller: t08Controller },
  ecology: { school: false },
  audio: {},
};

// T-09 — the current herder (bands: mid 3,4). Signature (request §21 guide
// behavior): it rides the local current and drives toward the nearest
// congregation (T-03) ahead in the lane, never away from it — following it
// leads a player down the lane. The controller only holds the forage state;
// the drive and the herding itself are simulation-side (request §30) because
// the hook cannot see sibling creatures.
const t09Controller: CreatureController = (creature, percept, dt) => {
  void percept;
  void dt;
  creature.state = 'forage';
};

export const T09: CreatureDef = {
  id: 'T-09',
  body: {
    radius: 30,
    chainCircles: [
      { offset: vec2(-28, -6), radius: 16 },
      { offset: vec2(28, 8), radius: 14 },
    ],
  },
  movement: { maxSpeed: 80, accel: 240, dragRate: 2.2 },
  senses: {},
  behavior: { startState: 'forage', controller: t09Controller },
  ecology: { school: false },
  audio: {},
};

// T-10 — the film sweeper (bands: mid 2,3). Signature (request §21
// investigating resource nodes): it works a resource node until it has
// finished a full sweep, and a finished sweep exposes a larger yield — the
// node amount grows by two. The node selection, work timer, and the boost are
// simulation-side (request §30); the controller only holds the forage state so
// the generic engine does not wander it off its node (the sim sets the target).
const t10Controller: CreatureController = (creature, percept, dt) => {
  void percept;
  void dt;
  creature.state = 'forage';
};

export const T10: CreatureDef = {
  id: 'T-10',
  body: {
    radius: 22,
    chainCircles: [
      { offset: vec2(-20, 6), radius: 13 },
      { offset: vec2(20, -6), radius: 13 },
    ],
  },
  movement: { maxSpeed: 40, accel: 120, dragRate: 2 },
  senses: {},
  behavior: { startState: 'forage', controller: t10Controller },
  ecology: { school: false },
  audio: {},
};

// T-11 — the gas-pocket lifter (band: mid 3). Signature (request §21): it
// rises to a hold depth and hangs there; a player drifting inside its pocket
// gets a steady passive lift toward the surface. y = 0 is the surface and
// negative is deeper (request §4.1), so "rising" is y increasing — the hold
// sits 300 above its home depth. The lift nudge is simulation-side (request
// §30) so a headless player (no input) rises for free.
const T11_HOLD_ABOVE_HOME = 300;

const t11Controller: CreatureController = (creature, percept, dt) => {
  void percept;
  void dt;
  const holdY = creature.home.y + T11_HOLD_ABOVE_HOME;
  creature.state = 'forage';
  if (creature.position.y < holdY - 15) {
    // Still below the hold band: rise toward it.
    creature.target = vec2(creature.position.x, holdY);
  } else {
    // Settled: hover at the hold.
    creature.target = vec2(creature.home.x, holdY);
  }
};

export const T11: CreatureDef = {
  id: 'T-11',
  body: {
    radius: 34,
    chainCircles: [
      { offset: vec2(0, -26), radius: 18 },
      { offset: vec2(-16, 14), radius: 16 },
      { offset: vec2(16, 14), radius: 16 },
    ],
  },
  movement: { maxSpeed: 40, accel: 120, dragRate: 2 },
  senses: {},
  behavior: { startState: 'forage', controller: t11Controller },
  ecology: { school: false },
  audio: {},
};

// T-27 — the living cable (bands: mid 3). Signature (request §21): a
// segmented chain that sweeps between its two anchor ends; a player inside
// its ride radius is carried along the chain axis — the ride nudge is
// simulation-side (the def owns the sweep only, via its controller).
const t27Controller: CreatureController = (creature, percept, dt) => {
  void percept;
  void dt;
  // The two anchors: home ± 100 on the lane axis.
  const left = vec2(creature.home.x - 100, creature.home.y);
  const right = vec2(creature.home.x + 100, creature.home.y);
  const current = creature.target ?? left;
  const target = current === left ? right : left;
  if (creature.target === null || Math.hypot(creature.position.x - current.x, creature.position.y - current.y) < 60) {
    creature.target = target;
  }
  creature.state = 'forage';
};

export const T27: CreatureDef = {
  id: 'T-27',
  body: {
    radius: 18,
    chainCircles: [
      { offset: vec2(-40, 0), radius: 14 },
      { offset: vec2(-20, 2), radius: 14 },
      { offset: vec2(20, -2), radius: 14 },
      { offset: vec2(40, 0), radius: 14 },
    ],
  },
  movement: { maxSpeed: 60, accel: 180, dragRate: 2 },
  senses: {},
  behavior: { startState: 'forage', controller: t27Controller },
  ecology: { school: false },
  audio: {},
};

// T-31 — the depth-tiered drifter (bands: 1-5). Its signature (request
// §11.1 body-plan minimum): the same organism changes its whole behavior with
// depth — a fast drift near the surface, a slower mid-water drift, and a bare
// crawl in the deep. The three distinct cruising speeds cannot come from the
// def (maxSpeed is one constant), so the sim applies a depth-scaled drift
// (request §30); the controller only holds the state so the generic engine
// does not wander it on top of that drift.
const t31Controller: CreatureController = (creature, percept, dt) => {
  void percept;
  void dt;
  creature.state = 'forage';
  creature.target = null;
};

export const T31: CreatureDef = {
  id: 'T-31',
  body: { radius: 12 },
  movement: { maxSpeed: 100, accel: 300, dragRate: 2.5 },
  senses: {},
  behavior: { startState: 'custom', controller: t31Controller },
  ecology: { school: false },
  audio: {},
};

/** The tier-1 roster: the ambient/schooling organisms (request §11.1). */
export const TIER1_CREATURES: readonly CreatureDef[] = [T01, T02, T03, T05, T06, T13];

const TIER2_LIST: readonly CreatureDef[] = [T08, T09, T10, T11, T27, T31];

/** The tier-2 roster keyed by id (request §11.1, §21) — for registry lookups. */
export const TIER2_CREATURES: Record<string, CreatureDef> = Object.fromEntries(
  TIER2_LIST.map((d) => [d.id, d]),
);

/** Every hidden organism, both tiers — this is what `fixtures` merges into the registry. */
export const HIDDEN_CREATURES: readonly CreatureDef[] = [...TIER1_CREATURES, ...TIER2_LIST];

/** The tier-1 ids, for registry / world-data checks. */
export const TIER1_IDS: readonly string[] = TIER1_CREATURES.map((d) => d.id);

/** The tier-2 ids, for registry / band checks (WI-03b1). */
export const TIER2_IDS: readonly string[] = TIER2_LIST.map((d) => d.id);

/**
 * The depth bands (1 = surface … 5 = hadal) each tier-2 organism was designed
 * for by the private roster (request §11.1) — the mid-depth useful/neutral
 * tier, so the roster centers on bands 2-4 with the depth-tiered drifter
 * (T-31) spanning the whole column.
 */
export const TIER2_BANDS: Record<string, ReadonlySet<number>> = {
  'T-08': new Set([3, 4]),
  'T-09': new Set([3, 4]),
  'T-10': new Set([2, 3]),
  'T-11': new Set([3]),
  'T-27': new Set([3]),
  'T-31': new Set([1, 2, 3, 4, 5]),
};

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
