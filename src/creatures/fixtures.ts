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
};

/** The id → def registry the simulation resolves `creatureSpawns` against. */
export const CREATURE_BY_ID: Record<string, CreatureDef> = {
  [SCHOOLER.id]: SCHOOLER,
  [FORAGER.id]: FORAGER,
};
