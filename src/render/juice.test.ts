import { describe, expect, it } from 'vitest';
import { juiceBubblesProfile, juiceSiltProfile } from './juice';

describe('juiceBubblesProfile (section 48 juice particles, per-band emission table)', () => {
  it('returns fewer, smaller, less opaque bubbles at greater depth', () => {
    const surface = juiceBubblesProfile(0);
    const deep = juiceBubblesProfile(12000);
    expect(surface.count).toBeGreaterThan(deep.count);
    expect(surface.size).toBeGreaterThan(deep.size);
    expect(surface.opacity).toBeGreaterThan(deep.opacity);
    expect(surface.riseSpeed).toBeGreaterThan(deep.riseSpeed);
  });

  it('interpolates smoothly between band stops', () => {
    const a = juiceBubblesProfile(4000);
    const b = juiceBubblesProfile(4001);
    // Adjacent depths produce slightly different but smooth values
    expect(b.count).toBeLessThanOrEqual(a.count);
    expect(b.size).toBeLessThanOrEqual(a.size);
  });

  it('matches the authored stop exactly at a band boundary', () => {
    const surface = juiceBubblesProfile(0);
    expect(surface.count).toBe(80);
    expect(surface.size).toBe(1.5);
    expect(surface.opacity).toBe(0.6);
    expect(surface.riseSpeed).toBe(1.0);

    const coast = juiceBubblesProfile(1600);
    expect(coast.count).toBe(50);
    expect(coast.size).toBe(1.2);
    expect(coast.opacity).toBe(0.5);
    expect(coast.riseSpeed).toBe(0.8);
  });

  it('stays within section 34 budget envelope (count, size, opacity)', () => {
    for (const d of [0, 1600, 4000, 7000, 10000, 12000]) {
      const p = juiceBubblesProfile(d);
      expect(p.count).toBeGreaterThanOrEqual(0);
      expect(p.count).toBeLessThanOrEqual(200);
      expect(p.size).toBeGreaterThanOrEqual(0.1);
      expect(p.size).toBeLessThanOrEqual(5.0);
      expect(p.opacity).toBeGreaterThanOrEqual(0);
      expect(p.opacity).toBeLessThanOrEqual(1.0);
      expect(p.riseSpeed).toBeGreaterThanOrEqual(0);
      expect(p.riseSpeed).toBeLessThanOrEqual(2.0);
    }
  });
});

describe('juiceSiltProfile (section 48 juice particles, per-band emission table)', () => {
  it('returns more, larger, more opaque silt particles at greater depth', () => {
    const surface = juiceSiltProfile(0);
    const deep = juiceSiltProfile(12000);
    expect(surface.count).toBeLessThan(deep.count);
    expect(surface.size).toBeLessThan(deep.size);
    expect(surface.opacity).toBeLessThan(deep.opacity);
  });

  it('interpolates smoothly between band stops', () => {
    const a = juiceSiltProfile(7000);
    const b = juiceSiltProfile(7001);
    expect(b.count).toBeGreaterThanOrEqual(a.count);
    expect(b.size).toBeGreaterThanOrEqual(a.size);
  });

  it('matches the authored stop exactly at a band boundary', () => {
    const surface = juiceSiltProfile(0);
    expect(surface.count).toBe(30);
    expect(surface.size).toBe(0.8);
    expect(surface.opacity).toBe(0.4);

    const deep = juiceSiltProfile(12000);
    expect(deep.count).toBe(180);
    expect(deep.size).toBe(1.3);
    expect(deep.opacity).toBe(0.65);
  });

  it('stays within section 34 budget envelope (count, size, opacity)', () => {
    for (const d of [0, 1600, 4000, 7000, 10000, 12000]) {
      const p = juiceSiltProfile(d);
      expect(p.count).toBeGreaterThanOrEqual(0);
      expect(p.count).toBeLessThanOrEqual(300);
      expect(p.size).toBeGreaterThanOrEqual(0.1);
      expect(p.size).toBeLessThanOrEqual(5.0);
      expect(p.opacity).toBeGreaterThanOrEqual(0);
      expect(p.opacity).toBeLessThanOrEqual(1.0);
    }
  });
});