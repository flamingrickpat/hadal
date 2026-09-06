import { describe, expect, it } from 'vitest';
import { bandProfileAtDepth } from './band';

const lum = (c: [number, number, number]): number => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];

describe('bandProfileAtDepth (request §14.3 per-band palette + particle profile)', () => {
  it('returns a brighter, clearer palette at the surface than at depth', () => {
    const shallow = bandProfileAtDepth(0);
    const deep = bandProfileAtDepth(9000);
    expect(lum(shallow.waterTop)).toBeGreaterThan(lum(deep.waterTop));
    expect(shallow.visibility).toBeGreaterThan(deep.visibility);
  });

  it('shortens effective visibility monotonically with depth (request §15)', () => {
    let prev = Infinity;
    for (const d of [0, 400, 1600, 3000, 5000, 7000, 9000, 12000]) {
      const v = bandProfileAtDepth(d).visibility;
      expect(v).toBeLessThanOrEqual(prev);
      prev = v;
    }
  });

  it('never returns a pure-black ambient (the scene stays navigable, request §15)', () => {
    for (const d of [0, 1600, 4000, 7000, 12000]) {
      expect(bandProfileAtDepth(d).ambient).toBeGreaterThan(0.03);
    }
    expect(bandProfileAtDepth(12000).ambient).toBeGreaterThan(0);
  });

  it('uses a distinct palette family per depth band (request §14.3)', () => {
    const a = bandProfileAtDepth(0);
    const b = bandProfileAtDepth(9000);
    const diff =
      Math.abs(a.waterTop[0] - b.waterTop[0]) +
      Math.abs(a.waterTop[1] - b.waterTop[1]) +
      Math.abs(a.waterTop[2] - b.waterTop[2]);
    expect(diff).toBeGreaterThan(0.05);
    expect(a.accent).not.toEqual(b.accent);
  });

  it('changes the particle profile with depth (size and dominant type, request §14.3)', () => {
    const shallow = bandProfileAtDepth(0);
    const deep = bandProfileAtDepth(9000);
    expect(shallow.particleSize).toBeGreaterThan(deep.particleSize);
    expect(shallow.snowCount).toBeGreaterThan(deep.snowCount);
    expect(deep.moteCount).toBeGreaterThan(shallow.moteCount);
  });

  it('strengthens the current with depth (a per-band parameter, request §14.3/§64)', () => {
    expect(bandProfileAtDepth(0).currentSpeed).toBeLessThan(bandProfileAtDepth(9000).currentSpeed);
    const dir = bandProfileAtDepth(4000).currentDir;
    expect(Math.hypot(dir.x, dir.y)).toBeGreaterThan(0.5);
  });

  it('matches the authored stop exactly at a band boundary', () => {
    const p = bandProfileAtDepth(4000);
    expect(p.visibility).toBeCloseTo(560, 0);
    expect(p.particleDrift).toBeCloseTo(40, 0);
  });
});
