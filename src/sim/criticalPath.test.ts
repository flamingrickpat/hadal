import { describe, test, expect } from 'vitest';
import { makeSimWorld } from './Simulation';
import { validateWorld, simulateCriticalPath } from './criticalPath';
import { TRIGGER_RADIO_LINES } from '../content/dialogue';
import { RECIPES } from '../content/recipes';
import { MATERIAL_IDS } from '../content/resources';
import { CREATURE_BY_ID } from '../creatures/fixtures';

describe('validateWorld', () => {
  test('passes on the production world', () => {
    const world = makeSimWorld();
    const result = validateWorld(world);
    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
  });

  test('detects a recipe that references an unknown material', () => {
    const world = makeSimWorld();
    const broken = { ...RECIPES[0]!, cost: { nonexistent_material: 5 } };
    const fakeRecipes = [broken];
    const result = validateWorld(world, fakeRecipes, MATERIAL_IDS, TRIGGER_RADIO_LINES, CREATURE_BY_ID);
    expect(result.valid).toBe(false);
    expect(result.issues).toContain('recipe tank-1 requires material nonexistent_material which is not defined');
  });

  test('detects a story trigger that references an unknown radio text id', () => {
    const world = makeSimWorld();
    const brokenTrigger = {
      id: 'broken-trigger',
      once: true,
      condition: { type: 'enterRegion' as const, region: 'seabed' },
      actions: [{ type: 'showRadio' as const, textId: 'radio-broken-id' }],
    };
    const worldWithBroken = {
      ...world,
      chunks: world.chunks.map((c) =>
        c.id === 'seabed' ? { ...c, triggers: [brokenTrigger] } : c,
      ),
    };
    const result = validateWorld(worldWithBroken);
    expect(result.valid).toBe(false);
    expect(result.issues).toContain('story trigger broken-trigger references unknown radio text id radio-broken-id');
  });

  test('detects a creature spawn with an unknown creature id', () => {
    const world = makeSimWorld();
    const brokenSpawn = { id: 'broken-spawn', creature: 'unknown-creature', position: { x: 100, y: 100 } };
    const worldWithBroken = {
      ...world,
      chunks: world.chunks.map((c) =>
        c.id === 'seabed' ? { ...c, creatureSpawns: [brokenSpawn] } : c,
      ),
    };
    const result = validateWorld(worldWithBroken);
    expect(result.valid).toBe(false);
    expect(result.issues).toContain('chunk seabed creature spawn broken-spawn references unknown creature unknown-creature');
  });
});

describe('simulateCriticalPath', () => {
  test('the critical path is winnable on the production world', () => {
    const world = makeSimWorld();
    const result = simulateCriticalPath(world);
    expect(result.reachable).toBe(true);
    expect(result.issues).toEqual([]);
  });

  test('detects a deadlock when all gates require an unobtainable capability', () => {
    const world = makeSimWorld();
    // Block ALL paths to the hadal chunk by making every exit that leads to it
    // require an unobtainable capability
    const worldWithBlockedGate = {
      ...world,
      chunks: world.chunks.map((c) =>
        c.exits.some((e) => e.to === 'hadal')
          ? {
              ...c,
              exits: c.exits.map((e) =>
                e.to === 'hadal' ? { ...e, requiredCapability: 'unobtainable-ability' } : e,
              ),
            }
        : c,
      ),
    };
    const result = simulateCriticalPath(worldWithBlockedGate);
    expect(result.reachable).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });
});