/**
 * problem — the bathymetry map (request §26) must show only explored space and
 *   key navigation points, never creature locations; solution — a Node test
 *   that builds the read-only map view model from a fixture simulation state
 *   and asserts the exposed fields match the spec exactly.
 */
import { describe, expect, it } from 'vitest';
import { Scenario } from '../sim/scenario';
import { buildMapViewModel, type MapViewModel } from './mapView';

describe('map view model (request §26 bathymetry map)', () => {
  it('exposes player position', () => {
    const s = new Scenario(1);
    s.stepFor(1);
    const model = buildMapViewModel(s.sim);
    expect(model.playerPosition).toBeDefined();
    expect(typeof model.playerPosition.x).toBe('number');
    expect(typeof model.playerPosition.y).toBe('number');
  });

  it('exposes explored chunk silhouettes', () => {
    const s = new Scenario(2);
    s.stepFor(2);
    const model = buildMapViewModel(s.sim);
    expect(Array.isArray(model.exploredChunks)).toBe(true);
    // After stepping, at least the starting chunk is discovered
    expect(model.exploredChunks.length).toBeGreaterThan(0);
    for (const chunk of model.exploredChunks) {
      expect(typeof chunk.id).toBe('string');
      expect(typeof chunk.bounds.x).toBe('number');
      expect(typeof chunk.bounds.y).toBe('number');
      expect(typeof chunk.bounds.w).toBe('number');
      expect(typeof chunk.bounds.h).toBe('number');
    }
  });

  it('exposes the base', () => {
    const s = new Scenario(3);
    const model = buildMapViewModel(s.sim);
    expect(model.base).toBeDefined();
    expect(typeof model.base.position.x).toBe('number');
    expect(typeof model.base.position.y).toBe('number');
  });

  it('exposes discovered landmarks only', () => {
    const s = new Scenario(4);
    // Step enough to discover the first chunk
    s.stepFor(2);
    const model = buildMapViewModel(s.sim);
    expect(Array.isArray(model.landmarks)).toBe(true);
    // Each landmark should have an id and position, not creature data
    for (const lm of model.landmarks) {
      expect(typeof lm.id).toBe('string');
      expect(typeof lm.position.x).toBe('number');
      expect(typeof lm.position.y).toBe('number');
      // Landmarks should not carry creature-type info
      expect(lm).not.toHaveProperty('creature');
      expect(lm).not.toHaveProperty('def');
    }
  });

  it('does not expose creature data (structural)', () => {
    const s = new Scenario(5);
    s.stepFor(3);
    const model = buildMapViewModel(s.sim);

    // The view model should not have a creatures field at all
    expect(model).not.toHaveProperty('creatures');
    expect(model).not.toHaveProperty('creaturePositions');
    expect(model).not.toHaveProperty('spawns');

    // Serialize and check for creature position leakage
    const json = JSON.stringify(model);
    expect(json).not.toContain('"creature"');
    expect(json).not.toContain('"creatureSpawns"');
    expect(json).not.toContain('"def"');
  });

  it('death beacon is absent without beacon state', () => {
    const s = new Scenario(6);
    s.stepFor(1);
    const model = buildMapViewModel(s.sim);
    // No beacon state exists in the base simulation, so beacon should be null
    expect(model.beacon).toBeNull();
  });
});
