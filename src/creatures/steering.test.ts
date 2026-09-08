/**
 * Tests — creature steering (request §6, §31): the desired-velocity vs drag
 *   model, arrive behavior toward a target, flee-away steering, and boundary
 *   avoidance through the real terrain collision (no mocked rules).
 */
import { describe, expect, it } from 'vitest';
import { settle, steerAway, steerToward, steerVelocity } from './steering';
import type { MovementDef } from './CreatureDef';
import { vec2 } from '../util/math';
import { buildTerrain, type TerrainShapeDef } from '../world/terrain';

const DT = 1 / 60;

// accel = maxSpeed * dragRate makes the drag equilibrium equal `maxSpeed`
// (the same shape as the player's terminal speed, request §6).
const MOVE: MovementDef = { maxSpeed: 200, accel: 600, dragRate: 3 };

function run(pos: { x: number; y: number }, vel: { x: number; y: number }, steps: number, fn: () => void) {
  for (let i = 0; i < steps; i++) fn();
}

describe('steerVelocity (desired-velocity vs drag)', () => {
  it('accelerates toward the desired velocity and holds the maxSpeed cap', () => {
    const pos = vec2(0, 0);
    const vel = vec2(0, 0);
    run(pos, vel, 240, () => steerVelocity(pos, vel, vec2(200, 0), MOVE, DT));
    const speed = Math.hypot(vel.x, vel.y);
    expect(speed).toBeGreaterThan(150);
    expect(speed).toBeLessThanOrEqual(200);
    expect(pos.x).toBeGreaterThan(300);
    expect(pos.y).toBe(0);
  });

  it('drag decays velocity to a stop when the desired velocity is zero', () => {
    const pos = vec2(0, 0);
    const vel = vec2(200, 0);
    run(pos, vel, 60, () => steerVelocity(pos, vel, vec2(0, 0), MOVE, DT));
    expect(Math.hypot(vel.x, vel.y)).toBeLessThan(5);
    expect(pos.x).toBeGreaterThan(0); // still moved forward while decelerating
  });

  it('settle is the convenience for drag-to-stop', () => {
    const pos = vec2(0, 0);
    const vel = vec2(150, -150);
    run(pos, vel, 90, () => settle(pos, vel, MOVE, DT));
    expect(Math.hypot(vel.x, vel.y)).toBeLessThan(2);
  });
});

describe('steerToward (arrive)', () => {
  it('carries the creature to the target and stops nearby without overshoot', () => {
    const pos = vec2(0, 0);
    const vel = vec2(0, 0);
    const target = vec2(800, 600);
    run(pos, vel, 60 * 30, () => steerToward(pos, vel, target, MOVE, DT));
    const d = Math.hypot(pos.x - target.x, pos.y - target.y);
    expect(d).toBeLessThan(80);
    expect(Math.hypot(vel.x, vel.y)).toBeLessThan(60);
  });

  it('steers away from a point when fleeing', () => {
    const pos = vec2(0, 0);
    const vel = vec2(0, 0);
    const threat = vec2(-100, 0);
    run(pos, vel, 60 * 5, () => steerAway(pos, vel, threat, MOVE, DT));
    expect(pos.x).toBeGreaterThan(100);
    expect(vel.x).toBeGreaterThan(50);
  });
});

describe('terrain avoidance through the real collision (request §31)', () => {
  const FLOOR: TerrainShapeDef = {
    id: 'floor',
    points: [vec2(-5000, 0), vec2(5000, 0)],
  };
  const WALL: TerrainShapeDef = {
    id: 'wall',
    points: [vec2(500, -3000), vec2(500, 3000)],
  };

  it('a creature steered into the floor is resolved above it, never through it', () => {
    const terrain = buildTerrain([FLOOR]);
    const pos = vec2(0, -5); // just above the floor at y = 0 (negative is deeper)
    const vel = vec2(0, 0);
    run(pos, vel, 60 * 10, () => {
      steerToward(pos, vel, vec2(0, 1000), MOVE, DT); // desired: press into the floor
      terrain.resolveCircle(pos, 30, vel);
    });
    expect(pos.y).toBeLessThanOrEqual(-29.9); // circle top stays out of the floor
    expect(pos.y).toBeGreaterThan(-60); // but it actually pressed against it
  });

  it('a long body steered into a wall is resolved along its chain circles', () => {
    const terrain = buildTerrain([WALL]);
    const root = vec2(300, 0);
    const vel = vec2(0, 0);
    const chainOffset = 120; // tail segment well past the wall at x = 500
    run(root, vel, 60 * 10, () => {
      steerToward(root, vel, vec2(2000, 0), MOVE, DT);
      terrain.resolveCircle(root, 20, vel);
      const tail = vec2(root.x + chainOffset, root.y);
      const resolved = terrain.resolveCircle(tail, 20);
      root.x += resolved.x - (root.x + chainOffset);
      root.y += resolved.y - (root.y);
    });
    expect(root.x + chainOffset).toBeLessThan(480.5); // tail circle stays left of the wall (500 - radius 20)
    expect(root.x + chainOffset).toBeGreaterThan(300); // but it moved toward it
  });
});
