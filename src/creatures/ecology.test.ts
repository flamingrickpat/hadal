/**
 * Tests — the ecology illusion layer (request §20, §48, WI-02c): the
 *   reaction predicates that key cross-species behavior to `WorldSignal`
 *   channels/tags, and the bounded local flocking force for schools. Pure
 *   functions over a real `WorldSignalBus` and real fixture defs — the node
 *   scenario in `src/sim/ecologyScenario.test.ts` proves them through the
 *   production simulation.
 */
import { describe, expect, it } from 'vitest';
import { vec2, type Vec2 } from '../util/math';
import { WorldSignalBus, type WorldSignal } from './senses';
import { createRng } from '../util/rng';
import { Creature } from './Creature';
import { SCAVENGER, PREDATOR, SCHOOLER, FEEDER } from './fixtures';
import { PREDATOR_TAG, KILL_TAG, QUIET_TAG } from './ecology';
import {
  FLEE_THRESHOLD,
  SCAVENGE_THRESHOLD,
  fleeSignalStrength,
  scavengeSignalStrength,
  quietStrength,
  strongestTaggedPos,
  flockForce,
} from './ecology';

/** A real `Creature` on a shared bus and fixed rng (deterministic per §61). */
function makeCreature(def: typeof SCHOOLER, pos: Vec2, bus: WorldSignalBus): Creature {
  return new Creature(def, pos, bus, createRng(1));
}

const scratch: WorldSignal[] = [];

describe('reaction predicates (distance/strength thresholds)', () => {
  it('flee: a predator-tagged noise signal is perceived near, not far', () => {
    const bus = new WorldSignalBus();
    bus.emit({ type: 'noise', pos: vec2(0, 0), strength: 1.0, tag: PREDATOR_TAG }, 1);
    expect(fleeSignalStrength(bus, 100, 0, 1, scratch)).toBeGreaterThan(0.05);
    expect(fleeSignalStrength(bus, 1000, 0, 1, scratch)).toBeLessThan(0.05);
  });

  it('flee: a non-predator tag at the same strength never triggers flee', () => {
    const bus = new WorldSignalBus();
    bus.emit({ type: 'noise', pos: vec2(0, 0), strength: 1.0, tag: 'tool' }, 1);
    expect(fleeSignalStrength(bus, 100, 0, 1, scratch)).toBe(0);
  });

  it('scavenge: a kill-tagged signal is perceived near, not far', () => {
    const bus = new WorldSignalBus();
    bus.emit({ type: 'noise', pos: vec2(0, 0), strength: 1.0, tag: KILL_TAG }, 1);
    expect(scavengeSignalStrength(bus, 400, 0, 1, scratch)).toBeGreaterThan(0.05);
    expect(scavengeSignalStrength(bus, 1200, 0, 1, scratch)).toBeLessThan(0.05);
  });

  it('quiet: a quiet-tagged signal is perceived near, not far', () => {
    const bus = new WorldSignalBus();
    bus.emit({ type: 'noise', pos: vec2(0, 0), strength: 1.0, tag: QUIET_TAG }, 1);
    expect(quietStrength(bus, 500, 0, 1, scratch)).toBeGreaterThan(0.1);
    expect(quietStrength(bus, 1500, 0, 1, scratch)).toBeLessThan(0.1);
  });

  it('flock force: separation, cohesion and alignment are bounded-local', () => {
    const bus = new WorldSignalBus();
    // One close neighbor ahead (separation zone), one behind at mid range;
    // all share a heading so alignment is a no-op and separation wins.
    const a = makeCreature(SCHOOLER, vec2(0, 0), bus);
    const b = makeCreature(SCHOOLER, vec2(40, 0), bus);
    const c = makeCreature(SCHOOLER, vec2(-120, 0), bus);
    a.velocity = vec2(50, 0);
    b.velocity = vec2(50, 0);
    c.velocity = vec2(50, 0);
    const f = flockForce([a, b, c], a, vec2(10000, 10000), vec2(0, 0));
    expect(Number.isFinite(f.x)).toBe(true);
    expect(Number.isFinite(f.y)).toBe(true);
    expect(Math.abs(f.x) + Math.abs(f.y)).toBeGreaterThan(0);
    expect(f.x).toBeLessThan(0); // the close neighbor pushes back

    // A "neighbor" 1000 units away must not count: the flock force is
    // unchanged with or without it (bounded local perception).
    const far = makeCreature(SCHOOLER, vec2(1000, 0), bus);
    const fFar = flockForce([a, b, c, far], a, vec2(10000, 10000), vec2(0, 0));
    expect(fFar.x).toBe(f.x);
    expect(fFar.y).toBe(f.y);

    // The player (focus) within the parting radius repels the member (§48).
    const fNear = flockForce([a, b, c], a, vec2(120, 0), vec2(0, 0));
    expect(fNear.x).toBeLessThan(f.x); // extra push away from the focus at +x
  });

  it('strongestTaggedPos: finds the strongest matching source, ignores other tags and radius', () => {
    const bus = new WorldSignalBus();
    bus.emit({ type: 'noise', pos: vec2(100, 0), strength: 0.5, tag: KILL_TAG }, 1);
    bus.emit({ type: 'noise', pos: vec2(200, 0), strength: 1.0, tag: KILL_TAG }, 1);
    bus.emit({ type: 'noise', pos: vec2(50, 0), strength: 1.0, tag: PREDATOR_TAG }, 1);
    const out = vec2(-1, -1);
    // The strongest kill signal is at (200, 0); the stronger predator tag is ignored.
    expect(strongestTaggedPos(bus, KILL_TAG, 0, 0, 1, 500, scratch, out)).toBe(true);
    expect(out.x).toBe(200);
    expect(out.y).toBe(0);
    // A radius that excludes both kills finds nothing (false, out untouched).
    out.x = -1;
    out.y = -1;
    expect(strongestTaggedPos(bus, KILL_TAG, 0, 0, 1, 60, scratch, out)).toBe(false);
    expect(out.x).toBe(-1);
    // An unknown tag finds nothing at any radius.
    expect(strongestTaggedPos(bus, 'nope', 0, 0, 1, 500, scratch, out)).toBe(false);
  });

  it('fixture defs opt in via ecology/combat only, no new mechanics', () => {
    expect(SCAVENGER.ecology?.scavenge).toBe(true);
    expect(PREDATOR.combat).toBeDefined();
    expect(PREDATOR.ecology?.quiet).toBeGreaterThan(0);
    expect(SCHOOLER.ecology?.school).toBe(true);
    expect(FEEDER.ecology?.filterFeeder).toBe(true);
  });
});
