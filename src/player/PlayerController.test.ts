import { describe, expect, it } from 'vitest';
import { FIXED_DT, PLAYER_ACCEL_H, PLAYER_ACCEL_V } from '../game/constants';
import { vec2 } from '../util/math';
import { Player } from './Player';
import { PlayerController } from './PlayerController';

// Pinned values are computed from the request §6 parameters
// (a_h = 600, a_v = 560, drag rate = 2/s, dt = 1/60) with the
// per-step recurrence v' = (v + a*dt) * e^(-k*dt); p' = p + v'*dt:
// after 60 steps v = 255.10, p = 169.65; after 180 steps total
// v = 4.67, p = 292.79.
const V_AFTER_1S = 255.1;
const P_AFTER_1S = 169.65;
const V_AFTER_3S = 4.67;
const P_AFTER_3S = 292.79;
const V_AFTER_5S = 295.02; // near-terminal: 295.03 * (1 - e^-10)

function makePlayer(): Player {
  return new Player(vec2(0, 0));
}

function step(controller: PlayerController, n: number): void {
  for (let i = 0; i < n; i++) controller.update(FIXED_DT);
}

describe('inertial swim integrator (request §6)', () => {
  it('thrust builds velocity toward a bounded terminal speed, not a frictionless one', () => {
    const p = makePlayer();
    const c = new PlayerController(p);
    c.input.thrustX = 1;
    step(c, 600); // 10 s of full thrust
    // a_h / drag_rate = 600 / 2 = 300; a frictionless model would sit at 6000
    expect(p.velocity.x).toBeGreaterThan(PLAYER_ACCEL_H / 2 - 10);
    expect(p.velocity.x).toBeLessThan(PLAYER_ACCEL_H / 2 + 10);
  });

  it('matches the pinned recurrence after 1 s of full thrust', () => {
    const p = makePlayer();
    const c = new PlayerController(p);
    c.input.thrustX = 1;
    step(c, 60);
    expect(p.velocity.x).toBeCloseTo(V_AFTER_1S, 1);
    expect(p.position.x).toBeCloseTo(P_AFTER_1S, 0);
    expect(p.velocity.y).toBe(0);
    expect(p.position.y).toBe(0);
  });

  it('coasts after release: velocity decays but the player keeps drifting', () => {
    const p = makePlayer();
    const c = new PlayerController(p);
    c.input.thrustX = 1;
    step(c, 60);
    c.input.thrustX = 0;
    step(c, 120); // 2 s of coasting, 3 s total
    expect(p.velocity.x).toBeCloseTo(V_AFTER_3S, 1);
    expect(p.position.x).toBeCloseTo(P_AFTER_3S, 0);
    // clearly inertial: more than 100 units of drift after release
    expect(p.position.x - P_AFTER_1S).toBeGreaterThan(100);
  });

  it('velocity decays to ~0 within ~3 s of no input', () => {
    const p = makePlayer();
    const c = new PlayerController(p);
    p.velocity.x = 200;
    step(c, 180);
    expect(p.velocity.x).toBeLessThan(1.2);
  });

  it('uses separate horizontal and vertical acceleration for the same input', () => {
    const p = makePlayer();
    const c = new PlayerController(p);
    c.input.thrustX = 1;
    c.input.thrustY = 1;
    step(c, 300);
    const ratio = p.velocity.y / p.velocity.x;
    expect(ratio).toBeCloseTo(PLAYER_ACCEL_V / PLAYER_ACCEL_H, 1);
  });

  it('boosting raises max speed only when the boost capability is present', () => {
    const p = makePlayer();
    const c = new PlayerController(p);
    c.input.thrustX = 1;
    c.input.boost = true;
    step(c, 300);
    expect(p.velocity.x).toBeCloseTo(V_AFTER_5S, 0); // unboosted 5 s value
    const p2 = makePlayer();
    p2.capabilities.add('boost');
    const c2 = new PlayerController(p2);
    c2.input.thrustX = 1;
    c2.input.boost = true;
    step(c2, 300);
    expect(p2.velocity.x).toBeGreaterThan(1100);
    expect(p2.velocity.x).toBeLessThan(1250);
  });
});

describe('body facing toward velocity/aim (request §6)', () => {
  it('rotates toward the aim point while idle', () => {
    const p = makePlayer();
    const c = new PlayerController(p);
    c.input.aimPoint = vec2(200, -100);
    step(c, 120);
    const target = Math.atan2(-100, 200);
    expect(p.facing).toBeCloseTo(target, 1);
  });

  it('blends only slightly toward velocity: opposite aim keeps the body roughly forward', () => {
    const p = makePlayer();
    const c = new PlayerController(p);
    c.input.thrustX = 1;
    c.input.aimPoint = vec2(-500, 0); // aim dead behind
    step(c, 180);
    expect(p.facing).toBeGreaterThan(-0.3);
    expect(p.facing).toBeLessThan(0.3);
  });

  it('tracks the velocity direction when moving fast', () => {
    const p = makePlayer();
    const c = new PlayerController(p);
    c.input.thrustY = 1; // dive straight down
    step(c, 180);
    expect(p.facing).toBeCloseTo(Math.PI / 2, 1);
  });
});

describe('tool selection (request §6)', () => {
  it('selects a slot within the equipped tools and ignores out-of-range slots', () => {
    const p = makePlayer();
    p.tools = ['knife', 'light', 'harpoon'];
    const c = new PlayerController(p);
    c.setToolIndex(1);
    expect(p.selectedTool).toBe('light');
    c.setToolIndex(3);
    expect(p.selectedTool).toBe('light');
    c.setToolIndex(-1);
    expect(p.selectedTool).toBe('light');
  });
});
