/**
 * Tests that the coast band (band 1) terrain uses organic slabs, not greybox
 * rectangles. This is part of WI-06d-a: replacing all obvious debug geometry
 * in critical-path areas with band-consistent real geometry.
 *
 * The coast band previously used manual polygon points (WI-02/03 greybox).
 * After WI-06d-a, it must use the same generateOrganicSlab approach as the
 * deeper bands, producing organic visual outlines with irregular edges.
 */
import { describe, expect, it } from 'vitest';
import { GREYBOX_WORLD } from './worldData';

describe('coast band organic terrain (WI-06d-a, request §14.3)', () => {
  it('coast band terrain shapes have organic visual outlines (>4 points)', () => {
    const coastChunk = GREYBOX_WORLD.find((c) => c.id === 'seabed');
    expect(coastChunk).toBeDefined();

    for (const shape of coastChunk!.terrain) {
      // Organic slabs have a rectangular collision outline (4 points) but an
      // organic visual outline with many more points (request §14.3).
      // Simple greybox polygons have equal points and visual arrays.
      if (shape.visual !== undefined) {
        expect(shape.visual.length).toBeGreaterThan(4);
      }
    }
  });

  it('coast band terrain shapes are closed organic slabs', () => {
    const coastChunk = GREYBOX_WORLD.find((c) => c.id === 'seabed');
    expect(coastChunk).toBeDefined();

    for (const shape of coastChunk!.terrain) {
      expect(shape.closed).toBe(true);
    }
  });

  it('all coast band chunks use organic terrain (no greybox polygons)', () => {
    for (const chunk of GREYBOX_WORLD) {
      for (const shape of chunk.terrain) {
        // Every terrain shape must have an organic visual outline
        expect(shape.visual).toBeDefined();
        expect(shape.visual!.length).toBeGreaterThan(4);
      }
    }
  });
});