import { describe, expect, it } from 'vitest';
import {
  TriggerSystem,
  emptyTriggerState,
  type EncounterTrigger,
  type TriggerContext,
} from './triggers';
import type { Vec2 } from '../util/math';

function ctx(overrides: Partial<TriggerContext> = {}): TriggerContext {
  return {
    position: { x: 0, y: 0 } as Vec2,
    depth: 0,
    time: 0,
    capabilities: new Set(),
    collectedItemIds: new Set<string>(),
    scannedObjectIds: new Set<string>(),
    storyFlags: new Set<string>(),
    hasEnteredRegion: () => false,
    regionTimeSeconds: () => 0,
    hasReturnedThrough: () => false,
    creatureState: () => null,
    ...overrides,
  };
}

/**
 * The encounter-trigger system (request §36): a region / depth / upgrade
 * condition fires the right action, a `once` trigger never re-fires (request
 * §70 "cannot fire twice"), and a non-`once` trigger re-fires while its
 * condition holds.
 */
describe('encounter-trigger system (request §36)', () => {
  it('a reachDepth condition fires the right action once the depth is met', () => {
    const trigger: EncounterTrigger = {
      id: 'deep',
      once: true,
      condition: { type: 'reachDepth', depth: 5000 },
      actions: [{ type: 'setStoryFlag', flag: 'deep-reached' }],
    };
    const state = emptyTriggerState();
    const system = new TriggerSystem([trigger], state);
    // Below the depth: no fire.
    expect(system.update(ctx({ depth: 4999 }))).toEqual([]);
    expect(state.storyFlags).toEqual([]);
    // At the depth: fires.
    expect(system.update(ctx({ depth: 5000 }))).toEqual(['deep']);
    expect(state.storyFlags).toEqual(['deep-reached']);
  });

  it('an enterRegion condition fires when the region is entered', () => {
    const trigger: EncounterTrigger = {
      id: 'enter-abyss',
      once: true,
      condition: { type: 'enterRegion', region: 'abyss' },
      actions: [{ type: 'showRadio', textId: 'radio-abyssal-1' }],
    };
    const state = emptyTriggerState();
    const system = new TriggerSystem([trigger], state);
    expect(system.update(ctx({ hasEnteredRegion: (r) => r === 'shelf' }))).toEqual([]);
    expect(state.radioText).toBeNull();
    expect(system.update(ctx({ hasEnteredRegion: (r) => r === 'abyss' }))).toEqual(['enter-abyss']);
    expect(state.radioText).toBe('radio-abyssal-1');
  });

  it('a possessUpgrade condition fires when the capability is held', () => {
    const trigger: EncounterTrigger = {
      id: 'boost-unlock',
      once: true,
      condition: { type: 'possessUpgrade', capability: 'boost' },
      actions: [{ type: 'spawnEntity', entityId: 'current-drift-marker' }],
    };
    const state = emptyTriggerState();
    const system = new TriggerSystem([trigger], state);
    expect(system.update(ctx({ capabilities: new Set() }))).toEqual([]);
    expect(state.activeEntities.has('current-drift-marker')).toBe(false);
    expect(system.update(ctx({ capabilities: new Set(['boost']) }))).toEqual(['boost-unlock']);
    expect(state.activeEntities.has('current-drift-marker')).toBe(true);
  });

  it('a once trigger fires at most once (request §70 — cannot fire twice)', () => {
    const trigger: EncounterTrigger = {
      id: 'macguffin',
      once: true,
      condition: { type: 'reachDepth', depth: 9600 },
      actions: [{ type: 'setStoryFlag', flag: 'hadal-reached' }],
    };
    const state = emptyTriggerState();
    const system = new TriggerSystem([trigger], state);
    expect(system.update(ctx({ depth: 9700 }))).toEqual(['macguffin']);
    expect(system.update(ctx({ depth: 9800 }))).toEqual([]); // does not re-fire
    expect(system.update(ctx({ depth: 9900 }))).toEqual([]);
    expect(state.storyFlags).toEqual(['hadal-reached']);
  });

  it('a non-once trigger re-fires while its condition holds', () => {
    const trigger: EncounterTrigger = {
      id: 'ambient',
      once: false,
      condition: { type: 'reachDepth', depth: 1000 },
      actions: [{ type: 'alterAmbient', params: { light: 0.2 } }],
    };
    const state = emptyTriggerState();
    const system = new TriggerSystem([trigger], state);
    expect(system.update(ctx({ depth: 1200 }))).toEqual(['ambient']);
    expect(state.ambient.light).toBe(0.2);
    expect(system.update(ctx({ depth: 1300 }))).toEqual(['ambient']); // re-fires
  });

  it('a timeInRegion condition requires the region and the elapsed time', () => {
    const trigger: EncounterTrigger = {
      id: 'linger',
      once: true,
      condition: { type: 'timeInRegion', region: 'twilight', seconds: 30 },
      actions: [{ type: 'setStoryFlag', flag: 'twilight-lingered' }],
    };
    const state = emptyTriggerState();
    const system = new TriggerSystem([trigger], state);
    expect(
      system.update(ctx({ hasEnteredRegion: (r) => r === 'twilight', regionTimeSeconds: () => 10 })),
    ).toEqual([]);
    expect(
      system.update(ctx({ hasEnteredRegion: (r) => r === 'twilight', regionTimeSeconds: () => 30 })),
    ).toEqual(['linger']);
    expect(state.storyFlags).toEqual(['twilight-lingered']);
  });

  it('applies multiple actions in order when the condition is met', () => {
    const trigger: EncounterTrigger = {
      id: 'multi',
      once: true,
      condition: { type: 'reachDepth', depth: 8500 },
      actions: [
        { type: 'setStoryFlag', flag: 'deep-reached' },
        { type: 'lockPath', pathId: 'hadal-approach', locked: true },
        { type: 'timedEvent', event: 'collapse', seconds: 20 },
      ],
    };
    const state = emptyTriggerState();
    const system = new TriggerSystem([trigger], state);
    system.update(ctx({ depth: 8500 }));
    expect(state.storyFlags).toEqual(['deep-reached']);
    expect(state.lockedPaths.has('hadal-approach')).toBe(true);
    expect(state.timedEvents.get('collapse')).toBe(20);
  });
});
