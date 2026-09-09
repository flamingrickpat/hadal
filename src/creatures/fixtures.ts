/**
 * problem — WI-02a needs two neutral placeholder organisms to exercise the
 *   creature framework (steering, senses, states, throttling) before any
 *   real roster content exists; solution — a schooling fish and a simple
 *   long-bodied forager, authored as data and clearly marked framework test
 *   fixtures (id prefix `fixture-`), with the id → def registry the
 *   simulation resolves world `creatureSpawns` against.
 *
 * archetype: information-holder
 * owns: the two fixture `CreatureDef`s and the `CREATURE_BY_ID` registry the
 *   `Simulation` constructor resolves authored spawn ids against (request
 *   §32 "all creature IDs resolve").
 * not own: no roster content (request §11 ships later — this file is test
 *   scaffolding), and no audio synthesis (audio is event data only,
 *   request §19, §27).
 * invariant: both fixtures are neutral (no `combat`); the registry holds
 *   exactly these two entries until roster content lands.
 * fails when: a world chunk authors a spawn with an id missing from the
 *   registry — the `Simulation` constructor throws.
 */
import { vec2 } from '../util/math';
import { HIDDEN_CREATURES } from '../content/secret/hiddenCreatures';
import type { CreatureDef } from './CreatureDef';

// A schooling type: small, quick, and spooked by noise and light.
export const SCHOOLER: CreatureDef = {
  id: 'fixture-schooler',
  body: { radius: 18 },
  movement: { maxSpeed: 140, accel: 420, dragRate: 3 },
  senses: { noise: 0.2, light: 0.2, sonar: 0.2 },
  behavior: { startState: 'wander', wanderRadius: 500 },
  ecology: { school: true },
  audio: { investigate: 'schooler-attention', flee: 'schooler-scatter' },
  sizeClass: 'small',
};

// A simple forager: slow, long-bodied (chain circles, request §31), and it
// keeps to its home patch unless hurt.
export const FORAGER: CreatureDef = {
  id: 'fixture-forager',
  body: {
    radius: 40,
    chainCircles: [
      { offset: vec2(-40, 0), radius: 22 },
      { offset: vec2(40, 0), radius: 22 },
    ],
  },
  movement: { maxSpeed: 70, accel: 210, dragRate: 3 },
  senses: { noise: 0.3, injury: 0.1 },
  behavior: { startState: 'forage', wanderRadius: 300, fleeRange: 900 },
  audio: { investigate: 'forager-attention', flee: 'forager-flee' },
  sizeClass: 'medium',
};

// A scavenger: it drifts home-patch style and does NOT generically react to
// noise — it approaches recent kills only via the ecology `scavenge` reaction
// keyed to the `kill` bus tag (request §20, driven purely by the bus). Keeping
// `senses` empty is deliberate: it makes the scavenger's approach to a kill a
// clean demonstration of the scavenge path (a generic `investigate` of the kill
// noise would otherwise be indistinguishable from it).
export const SCAVENGER: CreatureDef = {
  id: 'fixture-scavenger',
  body: { radius: 26 },
  movement: { maxSpeed: 90, accel: 280, dragRate: 3 },
  senses: {},
  behavior: { startState: 'forage', wanderRadius: 300 },
  ecology: { school: false, scavenge: true },
  audio: { investigate: 'scavenger-attention' },
  sizeClass: 'small',
};

// A predator: the generic engine's combat path makes it alert → stalk →
// attack on signals; `ecology.quiet` makes it hold before major events too.
export const PREDATOR: CreatureDef = {
  id: 'fixture-predator',
  body: { radius: 50, chainCircles: [{ offset: vec2(-50, 0), radius: 26 }] },
  movement: { maxSpeed: 120, accel: 300, dragRate: 2.5 },
  senses: { noise: 0.15, light: 0.15 },
  behavior: { startState: 'wander', wanderRadius: 500 },
  combat: { damage: 20 },
  ecology: { school: false, quiet: 0.1 },
  audio: { alert: 'predator-alert', attack: 'predator-lunge' },
  sizeClass: 'large',
};

// A filter feeder: it orients along the local current field while foraging
// (request §20, §64) — no signal involved, the current is the driver.
// `senses` is deliberately empty: with any noise sense the kill / predator
// tags from the hunt (perceived ~0.67 at ~1300u) pull it into `investigate`,
// whose steering fights the current orientation the fixture exists to show.
// With no senses it stays in `forage` forever and only the filter-feeder
// nudge moves it — the §64 reaction, isolated.
export const FEEDER: CreatureDef = {
  id: 'fixture-feeder',
  body: { radius: 30 },
  movement: { maxSpeed: 60, accel: 180, dragRate: 2 },
  senses: {},
  behavior: { startState: 'forage', wanderRadius: 200 },
  ecology: { school: false, filterFeeder: true },
  audio: { investigate: 'feeder-attention' },
  sizeClass: 'medium',
};

/** The id → def registry the simulation resolves `creatureSpawns` against. */
export const CREATURE_BY_ID: Record<string, CreatureDef> = {
  [SCHOOLER.id]: SCHOOLER,
  [FORAGER.id]: FORAGER,
  [SCAVENGER.id]: SCAVENGER,
  [PREDATOR.id]: PREDATOR,
  [FEEDER.id]: FEEDER,
  ...Object.fromEntries(HIDDEN_CREATURES.map((d) => [d.id, d])),
};
