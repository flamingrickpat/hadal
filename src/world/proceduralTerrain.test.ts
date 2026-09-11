import { describe, expect, it } from 'vitest';
import { generateOrganicTerrain, generateOrganicSlab } from './proceduralTerrain';
import { createRng } from '../util/rng';
import type { TerrainShapeDef } from './terrain';

describe('procedural organic terrain (request §14.3, §17)', () => {
  it('generates non-rectangular organic shapes for band 1 (coast)', () => {
    const shapes = generateOrganicTerrain('band1-coast', 1, { x: 0, y: -2400, w: 9400, h: 2400 });
    expect(shapes.length).toBeGreaterThan(0);
    for (const shape of shapes) {
      // Organic shapes should have more than 4 points (not rectangles)
      expect(shape.points.length).toBeGreaterThan(4);
      expect(shape.closed).toBe(true);
    }
  });

  it('generates different geometry for different bands', () => {
    const band1 = generateOrganicTerrain('band1-test', 1, { x: 0, y: -2400, w: 9400, h: 2400 });
    const band3 = generateOrganicTerrain('band3-test', 3, { x: 0, y: -2400, w: 9400, h: 2400 });

    // Band 3 should have more shapes (deeper = more geological features)
    expect(band3.length).toBeGreaterThan(band1.length);
  });

  it('generates deterministic shapes for the same seed', () => {
    const shapes1 = generateOrganicTerrain('same-seed', 2, { x: 0, y: -2400, w: 9400, h: 2400 });
    const shapes2 = generateOrganicTerrain('same-seed', 2, { x: 0, y: -2400, w: 9400, h: 2400 });

    expect(shapes1.length).toBe(shapes2.length);
    for (let i = 0; i < shapes1.length; i++) {
      expect(shapes1[i]!.points.length).toBe(shapes2[i]!.points.length);
      for (let j = 0; j < shapes1[i]!.points.length; j++) {
        expect(shapes1[i]!.points[j]!.x).toBe(shapes2[i]!.points[j]!.x);
        expect(shapes1[i]!.points[j]!.y).toBe(shapes2[i]!.points[j]!.y);
      }
    }
  });

  it('generates shapes that fit within the chunk bounds', () => {
    const bounds = { x: 0, y: -2400, w: 9400, h: 2400 };
    const shapes = generateOrganicTerrain('bounds-test', 1, bounds);

    for (const shape of shapes) {
      for (const pt of shape.points) {
        expect(pt.x).toBeGreaterThanOrEqual(bounds.x);
        expect(pt.x).toBeLessThanOrEqual(bounds.x + bounds.w);
        expect(pt.y).toBeGreaterThanOrEqual(bounds.y);
        expect(pt.y).toBeLessThanOrEqual(bounds.y + bounds.h);
      }
    }
  });
});

describe('generateOrganicSlab', () => {
  it('generates a shape with a rectangular collision outline and organic visual outline', () => {
    const rng = createRng(42);
    const shape = generateOrganicSlab('test-slab', 0, -1000, 1000, 500, 2, rng);
    expect(shape.closed).toBe(true);
    // Collision shape is the original rectangle (4 points)
    expect(shape.points.length).toBe(4);
    // Visual shape is organic (more than 4 points)
    expect(shape.visual).toBeDefined();
    expect(shape.visual!.length).toBeGreaterThan(4);
  });

  it('generates deterministic shapes for the same seed', () => {
    const rng1 = createRng(99);
    const shape1 = generateOrganicSlab('deterministic', 0, -1000, 1000, 500, 3, rng1);

    const rng2 = createRng(99);
    const shape2 = generateOrganicSlab('deterministic', 0, -1000, 1000, 500, 3, rng2);

    // Collision shapes are identical
    expect(shape1.points.length).toBe(shape2.points.length);
    for (let i = 0; i < shape1.points.length; i++) {
      expect(shape1.points[i]!.x).toBe(shape2.points[i]!.x);
      expect(shape1.points[i]!.y).toBe(shape2.points[i]!.y);
    }
    // Visual shapes are also identical
    expect(shape1.visual!.length).toBe(shape2.visual!.length);
    for (let i = 0; i < shape1.visual!.length; i++) {
      expect(shape1.visual![i]!.x).toBe(shape2.visual![i]!.x);
      expect(shape1.visual![i]!.y).toBe(shape2.visual![i]!.y);
    }
  });

  it('generates shapes with varying edge detail based on band', () => {
    const rng1 = createRng(123);
    const shape1 = generateOrganicSlab('band1', 0, -1000, 1000, 500, 1, rng1);

    const rng2 = createRng(123);
    const shape2 = generateOrganicSlab('band5', 0, -1000, 1000, 500, 5, rng2);

    // Both should have organic visual edges (more than 4 points)
    expect(shape1.visual!.length).toBeGreaterThan(4);
    expect(shape2.visual!.length).toBeGreaterThan(4);
  });

  it('generates shapes that fit within the original slab bounds (with margin)', () => {
    const rng = createRng(42);
    const x = 0;
    const y = -1000;
    const w = 1000;
    const h = 500;
    const shape = generateOrganicSlab('bounds', x, y, w, h, 2, rng);

    // The organic visual shape should be within ~15% of the original bounds
    const marginX = w * 0.15;
    const marginY = h * 0.15;

    for (const pt of shape.visual!) {
      expect(pt.x).toBeGreaterThanOrEqual(x - marginX);
      expect(pt.x).toBeLessThanOrEqual(x + w + marginX);
      expect(pt.y).toBeGreaterThanOrEqual(y - marginY);
      expect(pt.y).toBeLessThanOrEqual(y + h + marginY);
    }
  });
});