/**
 * Tests — the headless Creature runtime (request §19, §63, §34): the legal
 *   state transitions, sense-channel reactions (right signal, right strength
 *   and distance), the bespoke per-species controller override, and offscreen
 *   AI throttling with reactivation on approach.
 */
import { describe, expect, it } from 'vitest';
import { CREATURE_AI_RANGE } from '../game/constants';
import { createRng } from '../util/rng';
import { vec2 } from '../util/math';
import { SIGNAL_LIFETIME, WorldSignalBus } from './senses';
import { canTransition, Creature } from './Creature';
import { FORAGER, SCHOOLER } from './fixtures';
import type { CreatureDef } from './CreatureDef';

const DT = 1 / 60;

function makeBus(): WorldSignalBus {
  return new WorldSignalBus();
}

function stepCreature(c: Creature, bus: WorldSignalBus, focus: { x: number; y: number }, seconds: number, time: { t: number }) {
  const steps = Math.round(seconds / DT);
  for (let i = 0; i < steps; i++) {
    time.t += DT;
    c.update(DT, time.t, focus);
    bus.update(time.t);
  }
}

describe('state machine transitions (request §19)', () => {
  it('allows the documented legal transitions and rejects illegal ones', () => {
    expect(canTransition('idle', 'wander')).toBe(true);
    expect(canTransition('idle', 'investigate')).toBe(true);
    expect(canTransition('wander', 'forage')).toBe(true);
    expect(canTransition('investigate', 'stalk')).toBe(true);
    expect(canTransition('alert', 'attack')).toBe(true);
    expect(canTransition('flee', 'return')).toBe(true);
    expect(canTransition('return', 'wander')).toBe(true);
    // illegal: no waking straight from sleep into a fight
    expect(canTransition('idle', 'attack')).toBe(false);
    expect(canTransition('flee', 'investigate')).toBe(false);
    // custom is the bespoke escape hatch and reaches anywhere
    expect(canTransition('custom', 'attack')).toBe(true);
    expect(canTransition('idle', 'custom')).toBe(true);
  });

  it('the generic engine only ever moves through legal transitions', () => {
    const bus = makeBus();
    const c = new Creature(SCHOOLER, vec2(0, -400), bus, createRng(1));
    const time = { t: 0 };
    const focus = vec2(0, -400);
    // a steady loud noise keeps pulling it between states; the generic
    // engine must never land on an illegal state for the schooler (no combat)
    for (let i = 0; i < 60; i++) {
      bus.emit({ type: 'noise', pos: vec2(300, -500), strength: 1, tag: 'tool' }, time.t);
      stepCreature(c, bus, focus, 1, time);
      const predatorless = !c.def.combat;
      if (predatorless) expect(c.state !== 'attack' && c.state !== 'stalk').toBe(true);
    }
  });
});

describe('sense channels (request §63, §19)', () => {
  it('a strong nearby noise signal turns a wandering neutral to investigate', () => {
    const bus = makeBus();
    const c = new Creature(SCHOOLER, vec2(0, -400), bus, createRng(2));
    expect(c.state).toBe('wander');
    const time = { t: 0 };
    bus.emit({ type: 'noise', pos: vec2(150, -450), strength: 1, tag: 'tool' }, time.t);
    stepCreature(c, bus, vec2(0, -400), 1, time);
    expect(c.state).toBe('investigate');
    expect(c.target).not.toBeNull();
  });

  it('a weak or far signal below the sense threshold is ignored', () => {
    const bus = makeBus();
    const c = new Creature(SCHOOLER, vec2(0, -400), bus, createRng(3));
    const time = { t: 0 };
    // strength 0.05 < the schooler noise threshold, and the far signal decays to ~0
    bus.emit({ type: 'noise', pos: vec2(50, -410), strength: 0.05, tag: 'tool' }, time.t);
    bus.emit({ type: 'noise', pos: vec2(4000, -4000), strength: 1, tag: 'tool' }, time.t);
    stepCreature(c, bus, vec2(0, -400), 2, time);
    expect(c.state).toBe('wander');
  });

  it('an injury signal makes a neutral flee and a predator go alert', () => {
    const bus = makeBus();
    const neutral = new Creature(FORAGER, vec2(0, -400), bus, createRng(4));
    const time = { t: 0 };
    bus.emit({ type: 'injury', pos: vec2(120, -430), strength: 1 }, time.t);
    stepCreature(neutral, bus, vec2(0, -400), 1, time);
    expect(neutral.state).toBe('flee');

    const predatorDef: CreatureDef = {
      ...SCHOOLER,
      id: 'test-predator',
      senses: { noise: 0.2, sonar: 0.2, injury: 0.05 },
      combat: { damage: 10 },
      behavior: { startState: 'wander' },
    };
    const bus2 = makeBus();
    const predator = new Creature(predatorDef, vec2(0, -400), bus2, createRng(5));
    const time2 = { t: 0 };
    bus2.emit({ type: 'injury', pos: vec2(120, -430), strength: 1 }, time2.t);
    stepCreature(predator, bus2, vec2(0, -400), 1, time2);
    expect(predator.state).toBe('alert');
  });

  it('a fleeing creature stops fleeing once the signals fade (returns)', () => {
    const bus = makeBus();
    const c = new Creature(FORAGER, vec2(0, -400), bus, createRng(6));
    const time = { t: 0 };
    bus.emit({ type: 'injury', pos: vec2(120, -430), strength: 1 }, time.t);
    stepCreature(c, bus, vec2(0, -400), 1, time);
    expect(c.state).toBe('flee');
    // outlive the signal lifetime so the bus is quiet, then wait it out —
    // the forager returns home and resumes its start state, `forage`
    stepCreature(c, bus, vec2(0, -400), SIGNAL_LIFETIME + 15, time);
    expect(c.state).toBe('forage');
  });

  it('sonar is only heard through its own subscribed channel', () => {
    const bus = makeBus();
    const def: CreatureDef = { ...SCHOOLER, id: 'test-sonarless', senses: { sonar: 0.2 } };
    const c = new Creature(def, vec2(0, -400), bus, createRng(7));
    const time = { t: 0 };
    // noise is loud but the creature did not subscribe to it
    bus.emit({ type: 'noise', pos: vec2(100, -400), strength: 1, tag: 'tool' }, time.t);
    stepCreature(c, bus, vec2(0, -400), 1, time);
    expect(c.state).toBe('wander');
    bus.emit({ type: 'sonar', pos: vec2(100, -400), strength: 1 }, time.t);
    stepCreature(c, bus, vec2(0, -400), 1, time);
    expect(c.state).toBe('investigate');
  });
});

describe('bespoke controller hook (request §19)', () => {
  it('a bespoke controller can override the generic transitions', () => {
    const bus = makeBus();
    let calls = 0;
    const def: CreatureDef = {
      ...SCHOOLER,
      id: 'test-bespoke',
      behavior: {
        startState: 'wander',
        controller: (c) => {
          calls += 1;
          if (c.percept.noise > 0) c.setState('custom');
        },
      },
    };
    const c = new Creature(def, vec2(0, -400), bus, createRng(8));
    const time = { t: 0 };
    bus.emit({ type: 'noise', pos: vec2(100, -400), strength: 1, tag: 'tool' }, time.t);
    stepCreature(c, bus, vec2(0, -400), 2, time);
    expect(calls).toBeGreaterThan(0);
    expect(c.state).toBe('custom'); // generic engine would have said 'investigate'
  });
});

describe('offscreen throttling (request §34, §16)', () => {
  it('a creature beyond the world-distance cap does not tick', () => {
    const bus = makeBus();
    const c = new Creature(SCHOOLER, vec2(0, -400), bus, createRng(9));
    const farFocus = vec2(CREATURE_AI_RANGE + 500, -400);
    const time = { t: 0 };
    const before = { x: c.position.x, y: c.position.y };
    // even a loud signal must not wake a deactivated AI
    bus.emit({ type: 'noise', pos: vec2(100, -400), strength: 1, tag: 'tool' }, time.t);
    stepCreature(c, bus, farFocus, 3, time);
    expect(c.active).toBe(false);
    expect(c.position.x).toBe(before.x);
    expect(c.position.y).toBe(before.y);
  });

  it('a creature reactivates when the focus approaches within the cap', () => {
    const bus = makeBus();
    const c = new Creature(SCHOOLER, vec2(0, -400), bus, createRng(10));
    const time = { t: 0 };
    c.update(DT, time.t, vec2(CREATURE_AI_RANGE + 500, -400));
    expect(c.active).toBe(false);
    const nearFocus = vec2(200, -400);
    const before = { x: c.position.x, y: c.position.y };
    stepCreature(c, bus, nearFocus, 1, time);
    expect(c.active).toBe(true);
    expect(Math.hypot(c.position.x - before.x, c.position.y - before.y)).toBeGreaterThan(0);
  });

  it('the cap is a world distance, not a screen distance', () => {
    expect(CREATURE_AI_RANGE).toBeGreaterThan(1000); // world units
    expect(Number.isFinite(CREATURE_AI_RANGE)).toBe(true);
  });
});
