// Reviewer scratch probe (WI-02a). Questions:
//  1. Does WorldSignalBus.perceive actually decay with distance AND age, and
//     expire after SIGNAL_LIFETIME? (a flat within-range percept would make
//     the "nearby recent signals" contract false)
//  2. Can a bespoke controller force an ILLEGAL transition, and is it
//     recorded for audio?
//  3. Does a creature beyond CREATURE_AI_RANGE never perceive (not even a
//     signal at its own position)?
import { describe, expect, it } from 'vitest';
import { SIGNAL_LIFETIME, WorldSignalBus, type Percept } from '../../../../../../src/creatures/senses';
import { Creature, canTransition } from '../../../../../../src/creatures/Creature';
import { SCHOOLER } from '../../../../../../src/creatures/fixtures';
import { vec2 } from '../../../../../../src/util/math';
import { CREATURE_AI_RANGE } from '../../../../../../src/game/constants';

describe('reviewer probes', () => {
  it('bus decays with distance, age, and expires', () => {
    const bus = new WorldSignalBus();
    const p = (x: number, y: number, t: number): Percept => {
      const out: Percept = { noise: 0, light: 0, sonar: 0, injury: 0 };
      bus.perceive(x, y, t, out);
      return out;
    };
    bus.emit({ type: 'noise', pos: vec2(0, 0), strength: 1, tag: 't' }, 0);
    const near = p(100, 0, 0);
    const mid = p(750, 0, 0);
    const far = p(3000, 0, 0);
    expect(near.noise).toBeGreaterThan(mid.noise);
    expect(mid.noise).toBeGreaterThan(far.noise);
    // The bus (pre-existing) uses a soft distanceGain falloff, not a hard
    // cutoff: at 2*REF (3000) a strength-1 signal is heard at ~0.11.
    expect(far.noise).toBeGreaterThan(0);
    expect(far.noise).toBeLessThan(0.12);
    const aged = p(100, 0, 2.5);
    expect(aged.noise).toBeLessThan(near.noise);
    expect(p(100, 0, SIGNAL_LIFETIME + 0.5).noise).toBe(0);
  });

  it('a bespoke controller can force an illegal transition, recorded for audio', () => {
    const bus = new WorldSignalBus();
    const def = {
      ...SCHOOLER,
      behavior: { ...SCHOOLER.behavior!, controller: (c: Creature) => c.setState('attack') },
    };
    const c = new Creature(def, vec2(0, 0), bus, () => 0.5);
    expect(canTransition('wander', 'attack')).toBe(false); // illegal in the generic table
    c.update(0.016, 0, vec2(100, 0));
    expect(c.state).toBe('attack');
    expect(c.lastTransition?.to).toBe('attack');
  });

  it('a creature beyond the cap does not perceive even an adjacent signal', () => {
    const bus = new WorldSignalBus();
    const c = new Creature(SCHOOLER, vec2(10000, 0), bus, () => 0.5);
    bus.emit({ type: 'noise', pos: vec2(10000, 0), strength: 1, tag: 't' }, 0);
    expect(CREATURE_AI_RANGE).toBe(3000);
    c.update(0.016, 0, vec2(0, 0));
    expect(c.active).toBe(false);
    expect(c.percept.noise).toBe(0);
    expect(c.state).toBe(SCHOOLER.behavior!.startState ?? 'wander');
  });
});
