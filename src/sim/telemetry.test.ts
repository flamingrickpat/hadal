import { describe, expect, it } from 'vitest';
import { Scenario } from './scenario';
import { emptyInput } from './Simulation';
import { BASE, PLAYER_START } from '../world/worldData';
import { O2_MAX } from '../game/constants';

/**
 * WI-07a: Section 71 balance telemetry collector.
 *
 * Tests that the headless scenario export captures every section 71 field:
 * play time, zone, max depth, deaths, crafted upgrades, resources
 * collected/spent, time since last unlock, oxygen on surfacing, encounter
 * trigger timestamps, and frame data.
 */
describe('WI-07a: section 71 balance telemetry', () => {
  it('captures play time and zone', () => {
    const s = new Scenario(1);
    s.stepFor(10);
    const t = s.telemetry();
    expect(t.playTimeSec).toBeGreaterThan(9);
    expect(t.playTimeSec).toBeLessThan(11);
    expect(typeof t.zone).toBe('string');
    expect(t.zone.length).toBeGreaterThan(0);
  });

  it('captures max depth', () => {
    const s = new Scenario(2);
    s.stepFor(5);
    const t = s.telemetry();
    expect(typeof t.maxDepth).toBe('number');
    expect(t.maxDepth).toBeGreaterThanOrEqual(0);
  });

  it('captures deaths', () => {
    const s = new Scenario(3);
    s.stepFor(10);
    const t = s.telemetry();
    expect(typeof t.deaths).toBe('number');
    expect(t.deaths).toBeGreaterThanOrEqual(0);
  });

  it('captures resources collected', () => {
    const s = new Scenario(4);
    const harvest = emptyInput();
    harvest.interact = true;
    s.stepFor(10, harvest);
    const t = s.telemetry();
    expect(typeof t.resourcesCollected).toBe('object');
    expect(t.resourcesCollected).not.toBeNull();
  });

  it('captures crafted upgrades', () => {
    const s = new Scenario(5);
    s.stepFor(10);
    const t = s.telemetry();
    expect(Array.isArray(t.upgradesCrafted)).toBe(true);
  });

  it('captures encounter trigger timestamps', () => {
    const s = new Scenario(6);
    s.stepFor(10);
    const t = s.telemetry();
    expect(typeof t.triggerTimestamps).toBe('object');
    expect(t.triggerTimestamps).not.toBeNull();
  });

  it('captures all required section 71 fields', () => {
    const s = new Scenario(7);
    s.stepFor(5);
    const t = s.telemetry();
    // Every section 71 field must be present and non-null
    expect(t.playTimeSec).not.toBeNull();
    expect(typeof t.playTimeSec).toBe('number');
    expect(t.zone).not.toBeNull();
    expect(typeof t.zone).toBe('string');
    expect(typeof t.maxDepth).toBe('number');
    expect(typeof t.deaths).toBe('number');
    expect(typeof t.resourcesCollected).toBe('object');
    expect(t.resourcesCollected).not.toBeNull();
    expect(typeof t.resourcesSpent).toBe('object');
    expect(t.resourcesSpent).not.toBeNull();
    expect(Array.isArray(t.upgradesCrafted)).toBe(true);
    expect(typeof t.timeSinceLastUnlockSec).toBe('number');
    expect(typeof t.oxygenOnLastSurface).toBe('number');
    expect(typeof t.triggerTimestamps).toBe('object');
    expect(t.triggerTimestamps).not.toBeNull();
    expect(typeof t.frames).toBe('number');
    expect(typeof t.fps).toBe('number');
  });

  it('telemetry keys match browser schema', () => {
    const s = new Scenario(8);
    s.stepFor(1);
    const headlessKeys = Object.keys(s.telemetry()).sort();

    // The browser debug panel schema (same object, no per-surface field list)
    const browserKeys = [
      'deaths',
      'fps',
      'frames',
      'maxDepth',
      'oxygenOnLastSurface',
      'playTimeSec',
      'resourcesCollected',
      'resourcesSpent',
      'timeSinceLastUnlockSec',
      'triggerTimestamps',
      'upgradesCrafted',
      'zone',
    ].sort();

    expect(headlessKeys).toEqual(browserKeys);
  });

  it('counters update as scenario acts', () => {
    const s = new Scenario(9);
    const t1 = s.telemetry();

    s.stepFor(5);
    const t2 = s.telemetry();

    expect(t2.playTimeSec).toBeGreaterThan(t1.playTimeSec);
    expect(t2.frames).toBeGreaterThan(t1.frames);
  });
});