import { describe, expect, it } from 'vitest';
import { vec2 } from '../util/math';
import { buildTerrain } from './terrain';

const FLOOR = {
  id: 'floor',
  points: [vec2(0, -100), vec2(100, -100)],
  closed: false,
} as const;

describe('circle-vs-segment terrain resolution (request §31)', () => {
  it('pushes a circle out to exactly one radius from the segment', () => {
    const t = buildTerrain([FLOOR]);
    const p = vec2(50, -95);
    t.resolveCircle(p, 10);
    expect(p.x).toBeCloseTo(50, 9);
    expect(p.y).toBeCloseTo(-90, 9);
  });

  it('leaves a circle already at or beyond the radius untouched', () => {
    const t = buildTerrain([FLOOR]);
    const p = vec2(50, -89);
    t.resolveCircle(p, 10);
    expect(p.x).toBe(50);
    expect(p.y).toBe(-89);
  });

  it('removes the inward velocity component and keeps the tangential one', () => {
    const t = buildTerrain([FLOOR]);
    const p = vec2(50, -95);
    const v = vec2(30, -50); // moving down into the floor
    t.resolveCircle(p, 10, v);
    expect(p.y).toBeCloseTo(-90, 9);
    expect(v.x).toBeCloseTo(30, 9);
    expect(v.y).toBeCloseTo(0, 9);
  });

  it('keeps outward velocity untouched', () => {
    const t = buildTerrain([FLOOR]);
    const p = vec2(50, -95);
    const v = vec2(0, 20); // moving up, away from the floor
    t.resolveCircle(p, 10, v);
    expect(v.x).toBe(0);
    expect(v.y).toBe(20);
  });

  it('pushes a circle centered exactly on a segment out of the shape interior', () => {
    const t = buildTerrain([
      {
        id: 'slab',
        closed: true,
        points: [vec2(0, 0), vec2(100, 0), vec2(100, -100), vec2(0, -100)],
      },
    ]);
    const p = vec2(50, 0); // dead center of the top edge
    t.resolveCircle(p, 10);
    expect(p.x).toBeCloseTo(50, 9);
    expect(p.y).toBeCloseTo(10, 9);
  });

  it('resolves against multiple shapes without affecting distant ones', () => {
    const t = buildTerrain([
      FLOOR,
      { id: 'far', points: [vec2(0, 500), vec2(100, 500)], closed: false },
    ]);
    const p = vec2(50, -95);
    t.resolveCircle(p, 10);
    expect(p.y).toBeCloseTo(-90, 9);
    expect(p.x).toBeCloseTo(50, 9);
  });

  it('throws for a shape with fewer than two points', () => {
    expect(() => buildTerrain([{ id: 'bad', points: [vec2(0, 0)] }])).toThrow();
  });
});
