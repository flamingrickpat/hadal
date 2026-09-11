import { describe, expect, it } from 'vitest';
import { FIXED_DT, HP_MAX, O2_MAX } from '../game/constants';
import { vec2 } from '../util/math';
import { Player } from './Player';
import { PlayerController } from './PlayerController';

function makePlayer(y = -500): Player {
  const p = new Player(vec2(0, y));
  p.o2 = O2_MAX;
  p.health = HP_MAX;
  return p;
}

function step(controller: PlayerController, seconds: number): void {
  const n = Math.round(seconds / FIXED_DT);
  for (let i = 0; i < n; i++) controller.update(FIXED_DT);
}

describe('oxygen drain (request §7)', () => {
  it('depletes 1/s below the surface', () => {
    const p = makePlayer();
    const c = new PlayerController(p);
    step(c, 10);
    expect(p.o2).toBeCloseTo(O2_MAX - 10, 6);
  });

  it('drains 1.75x while boosting, only when the boost capability is present', () => {
    const p = makePlayer();
    p.capabilities.add('boost');
    const c = new PlayerController(p);
    c.input.boost = true;
    step(c, 10);
    expect(p.o2).toBeCloseTo(O2_MAX - 17.5, 6);
  });

  it('drains 1.5x when badly injured (health below the threshold)', () => {
    const p = makePlayer();
    p.health = 20;
    const c = new PlayerController(p);
    step(c, 10);
    expect(p.o2).toBeCloseTo(O2_MAX - 15, 6);
  });

  it('boost and injury multiply', () => {
    const p = makePlayer();
    p.health = 20;
    p.capabilities.add('boost');
    const c = new PlayerController(p);
    c.input.boost = true;
    step(c, 10);
    expect(p.o2).toBeCloseTo(O2_MAX - 26.25, 6);
  });

  it('refills near the surface, not below it', () => {
    const p = makePlayer(-50);
    p.o2 = 0;
    const c = new PlayerController(p);
    step(c, 10);
    expect(p.o2).toBeCloseTo(120, 6);
    const p2 = makePlayer(-200);
    p2.o2 = 0;
    step(new PlayerController(p2), 10);
    expect(p2.o2).toBe(0); // no refill below the surface — it only drains
  });
});

describe('health (request §7)', () => {
  it('zero oxygen enters a health-draining state at 5/s', () => {
    const p = makePlayer();
    p.o2 = 0;
    p.health = 50;
    const c = new PlayerController(p);
    step(c, 4);
    expect(p.o2).toBe(0);
    expect(p.health).toBeCloseTo(30, 6);
  });

  it('zero oxygen + injured drains at 7.5/s', () => {
    const p = makePlayer();
    p.o2 = 0;
    p.health = 24;
    const c = new PlayerController(p);
    step(c, 2);
    expect(p.health).toBeCloseTo(24 - 15, 6);
  });

  it('heals near the surface, not below it', () => {
    const p = makePlayer(-50);
    p.health = 50;
    const c = new PlayerController(p);
    step(c, 2);
    expect(p.health).toBeCloseTo(50 + 16, 6);
    const p2 = makePlayer(-200);
    p2.health = 50;
    step(new PlayerController(p2), 10);
    expect(p2.health).toBe(50);
  });

  it('never drains below zero or above the max', () => {
    const p = makePlayer();
    p.o2 = 0;
    p.health = 3;
    const c = new PlayerController(p);
    step(c, 10);
    expect(p.health).toBe(0);
    const p2 = makePlayer(-50);
    p2.health = 99;
    step(new PlayerController(p2), 10);
    expect(p2.health).toBe(HP_MAX);
  });
});

describe('depth (request §7, §26)', () => {
  it('tracks -y, clamped at zero at the surface', () => {
    const p = makePlayer(-1234.5);
    p.depth = 0;
    const c = new PlayerController(p);
    c.update(FIXED_DT);
    expect(p.depth).toBe(1234.5);
    const p2 = makePlayer(0);
    p2.depth = 500;
    const c2 = new PlayerController(p2);
    c2.update(FIXED_DT);
    expect(p2.depth).toBe(0);
  });
});
