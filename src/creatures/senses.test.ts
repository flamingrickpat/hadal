import { describe, expect, it } from 'vitest';
import {
  SIGNAL_LIFETIME,
  SIGNAL_RANGE_REF,
  WorldSignalBus,
  type Percept,
  type WorldSignal,
} from './senses';
import { vec2 } from '../util/math';

function freshPercept(): Percept {
  return { noise: 0, light: 0, sonar: 0, injury: 0 };
}

describe('WorldSignalBus', () => {
  it('perceives a freshly emitted noise signal at full strength at its source', () => {
    const bus = new WorldSignalBus();
    const pos = vec2(1000, -500);
    bus.emit({ type: 'noise', pos, strength: 1, tag: 'tool' }, 0);
    const out = freshPercept();
    bus.perceive(pos.x, pos.y, 0, out);
    expect(out.noise).toBeCloseTo(1);
    expect(out.sonar).toBe(0);
  });

  it('decays spatially with distance (request §63)', () => {
    const bus = new WorldSignalBus();
    const pos = vec2(0, 0);
    bus.emit({ type: 'noise', pos, strength: 1, tag: 'boost' }, 0);
    const atSource = freshPercept();
    const atHalf = freshPercept();
    const atFar = freshPercept();
    bus.perceive(0, 0, 0, atSource);
    bus.perceive(SIGNAL_RANGE_REF / 2, 0, 0, atHalf);
    bus.perceive(SIGNAL_RANGE_REF * 8, 0, 0, atFar);
    expect(atSource.noise).toBeCloseTo(1);
    expect(atHalf.noise).toBeGreaterThan(0);
    expect(atHalf.noise).toBeLessThan(atSource.noise);
    expect(atFar.noise).toBeLessThan(atHalf.noise);
    expect(atFar.noise).toBeLessThan(0.02);
  });

  it('decays temporally and expires after SIGNAL_LIFETIME (request §63)', () => {
    const bus = new WorldSignalBus();
    const pos = vec2(0, 0);
    bus.emit({ type: 'noise', pos, strength: 1, tag: 'tool' }, 0);
    const mid = freshPercept();
    bus.perceive(0, 0, SIGNAL_LIFETIME / 2, mid);
    expect(mid.noise).toBeCloseTo(0.5);
    bus.update(SIGNAL_LIFETIME + 0.1);
    const after = freshPercept();
    bus.perceive(0, 0, SIGNAL_LIFETIME + 0.1, after);
    expect(after.noise).toBe(0);
    expect(bus.size).toBe(0);
  });

  it('exposes all four signal types on their own channels (request §63)', () => {
    const bus = new WorldSignalBus();
    const pos = vec2(0, 0);
    bus.emit({ type: 'noise', pos, strength: 1, tag: 'tool' }, 0);
    bus.emit({ type: 'light', pos, strength: 1, tag: 'beam' }, 0);
    bus.emit({ type: 'sonar', pos, strength: 1 }, 0);
    bus.emit({ type: 'injury', pos, strength: 1 }, 0);
    const out = freshPercept();
    bus.perceive(0, 0, 0, out);
    expect(out.noise).toBeCloseTo(1);
    expect(out.light).toBeCloseTo(1);
    expect(out.sonar).toBeCloseTo(1);
    expect(out.injury).toBeCloseTo(1);
  });

  it('a signal is queryable nearby and gated by radius (request §63)', () => {
    const bus = new WorldSignalBus();
    const pos = vec2(0, 0);
    bus.emit({ type: 'noise', pos, strength: 1, tag: 'tool' }, 0);
    const results: WorldSignal[] = new Array(8).fill(undefined) as WorldSignal[];
    const near = bus.queryNear(0, 0, 500, 0, results);
    expect(near).toBe(1);
    expect(results[0]!.strength).toBeCloseTo(1);
    const far = bus.queryNear(9000, 500, 500, 0, results);
    expect(far).toBe(0);
  });

  it('sums nearby signals of the same channel and gates distant ones out', () => {
    const bus = new WorldSignalBus();
    bus.emit({ type: 'noise', pos: vec2(0, 0), strength: 1, tag: 'a' }, 0);
    bus.emit({ type: 'noise', pos: vec2(0, 0), strength: 1, tag: 'b' }, 0);
    bus.emit({ type: 'noise', pos: vec2(25000, 0), strength: 1, tag: 'far' }, 0);
    const out = freshPercept();
    bus.perceive(0, 0, 0, out);
    expect(out.noise).toBeGreaterThanOrEqual(2);
    expect(out.noise).toBeLessThan(2.01);
  });
});

describe('creature sense primitive (request §63, §19)', () => {
  // A minimal subscriber: it reacts when a sonar signal it can sense crosses a
  // threshold — the seam WI-10 creatures subscribe to instead of the player.
  class TestCreature {
    reacted = false;
    private readonly out = freshPercept();
    constructor(
      private readonly x: number,
      private readonly y: number,
      private readonly bus: WorldSignalBus,
      private readonly threshold: number,
    ) {}
    update(time: number): void {
      this.bus.perceive(this.x, this.y, time, this.out);
      if (this.out.sonar >= this.threshold) this.reacted = true;
    }
  }

  it('a nearby creature reacts to a sonar signal; a distant one does not', () => {
    const bus = new WorldSignalBus();
    const source = vec2(0, 0);
    bus.emit({ type: 'sonar', pos: source, strength: 1 }, 0);
    const near = new TestCreature(200, 0, bus, 0.2);
    const far = new TestCreature(9000, 0, bus, 0.2);
    near.update(0.1);
    far.update(0.1);
    expect(near.reacted).toBe(true);
    expect(far.reacted).toBe(false);
  });
});
