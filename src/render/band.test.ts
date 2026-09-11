import { describe, expect, it } from 'vitest';
import { bandProfileAtDepth, type BandProfile } from './band';

const lum = (c: [number, number, number]): number => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];

// WI-06d-b2: light-sway juice effect (request §14.3/§48).
describe('light sway parameters (request §14.3/§48)', () => {
  it('every band has a finite, positive sway amplitude', () => {
    for (const depth of [0, 1600, 4000, 7000, 10000, 12000]) {
      const p = bandProfileAtDepth(depth);
      expect(p.swayAmplitude).toBeGreaterThan(0);
      expect(p.swayAmplitude).toBeLessThan(1);
    }
  });

  it('every band has a slow sway period (seconds-scale, not frame-scale)', () => {
    for (const depth of [0, 1600, 4000, 7000, 10000, 12000]) {
      const p = bandProfileAtDepth(depth);
      expect(p.swayPeriod).toBeGreaterThanOrEqual(3);
      expect(p.swayPeriod).toBeLessThanOrEqual(15);
    }
  });

  it('deeper bands sway less (restraint envelope, request §14.3)', () => {
    const shallow = bandProfileAtDepth(0);
    const deep = bandProfileAtDepth(12000);
    expect(deep.swayAmplitude).toBeLessThan(shallow.swayAmplitude);
  });

  it('deeper bands have a longer sway period (slower with depth)', () => {
    const shallow = bandProfileAtDepth(0);
    const deep = bandProfileAtDepth(12000);
    expect(deep.swayPeriod).toBeGreaterThanOrEqual(shallow.swayPeriod);
  });

  it('interpolated depths carry the sway parameters', () => {
    const p = bandProfileAtDepth(5000);
    expect(p.swayAmplitude).toBeGreaterThan(0);
    expect(p.swayPeriod).toBeGreaterThan(0);
    expect(p.swayPhase).toBeGreaterThanOrEqual(0);
  });

  it('sway amplitudes stay within the low-amplitude envelope', () => {
    // Low amplitude so the settled band palette stays recognizable in motion.
    for (const depth of [0, 2000, 5000, 8000, 11000]) {
      const p = bandProfileAtDepth(depth);
      // Amplitude modulates beam intensity; keep it low enough that the
      // light remains clearly visible (not flickering).
      expect(p.swayAmplitude).toBeLessThanOrEqual(0.15);
    }
  });
});

/**
 * Count how many identity factors distinguish two band profiles.
 * Factors: palette family, particle profile, visibility, ambient,
 * particle size, drift, current strength.
 */
function distinctFactorCount(a: BandProfile, b: BandProfile): number {
  let count = 0;
  // Palette family differs if the top water colors differ enough
  const palDiff =
    Math.abs(a.waterTop[0] - b.waterTop[0]) +
    Math.abs(a.waterTop[1] - b.waterTop[1]) +
    Math.abs(a.waterTop[2] - b.waterTop[2]);
  if (palDiff > 0.08) count++;
  // Visibility differs meaningfully
  if (Math.abs(a.visibility - b.visibility) > 150) count++;
  // Particle size differs meaningfully
  if (Math.abs(a.particleSize - b.particleSize) > 0.3) count++;
  // Particle count profile differs (snow vs silt vs motes)
  if (Math.abs(a.snowCount - b.snowCount) > 30 || Math.abs(a.moteCount - b.moteCount) > 30) count++;
  // Current strength differs
  if (Math.abs(a.currentSpeed - b.currentSpeed) > 10) count++;
  return count;
}

describe('bandProfileAtDepth (request §14.3 per-band palette + particle profile)', () => {
  it('returns a brighter, clearer palette at the surface than at depth', () => {
    const shallow = bandProfileAtDepth(0);
    const deep = bandProfileAtDepth(9000);
    expect(lum(shallow.waterTop)).toBeGreaterThan(lum(deep.waterTop));
    expect(shallow.visibility).toBeGreaterThan(deep.visibility);
  });

  it('surface band is distinctly brighter and warmer than the coast band (request §59 cozy baseline)', () => {
    const surface = bandProfileAtDepth(0);
    const coast = bandProfileAtDepth(1600);
    // Surface must be noticeably brighter in ambient floor
    expect(surface.ambient).toBeGreaterThan(coast.ambient + 0.1);
    // Surface waterTop must be visibly brighter
    expect(lum(surface.waterTop)).toBeGreaterThan(lum(coast.waterTop) + 0.05);
    // Surface has clearer visibility
    expect(surface.visibility).toBeGreaterThan(coast.visibility + 500);
  });

  it('coast band is distinct from the shelf band in at least two identity factors (request §14.3)', () => {
    const coast = bandProfileAtDepth(1600);
    const shelf = bandProfileAtDepth(4000);
    // Coast must have higher ambient than shelf
    expect(coast.ambient).toBeGreaterThan(shelf.ambient + 0.05);
    // Coast must have higher visibility than shelf
    expect(coast.visibility).toBeGreaterThan(shelf.visibility + 300);
  });

  it('surface and coast bands are distinct from each other in at least two identity factors', () => {
    const surface = bandProfileAtDepth(0);
    const coast = bandProfileAtDepth(1600);
    let distinct = 0;
    // Check palette
    if (lum(surface.waterTop) > lum(coast.waterTop) + 0.05) distinct++;
    // Check ambient
    if (surface.ambient > coast.ambient + 0.1) distinct++;
    // Check visibility
    if (surface.visibility > coast.visibility + 500) distinct++;
    // Check particle profile
    if (Math.abs(surface.snowCount - coast.snowCount) > 20) distinct++;
    expect(distinct).toBeGreaterThanOrEqual(2);
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
    expect(p.visibility).toBeCloseTo(650, 0);
    expect(p.particleDrift).toBeCloseTo(35, 0);
  });

  // WI-06b: mid bands must each be distinct from adjacent bands in at least
  // two identity factors (request §14.3).

  it('mid band at 4000 differs from coast (1600) and mid band at 7000 in ≥2 identity factors', () => {
    const coast = bandProfileAtDepth(1600);
    const mid1 = bandProfileAtDepth(4000);
    const mid2 = bandProfileAtDepth(7000);
    expect(distinctFactorCount(coast, mid1)).toBeGreaterThanOrEqual(2);
    expect(distinctFactorCount(mid1, mid2)).toBeGreaterThanOrEqual(2);
  });

  it('mid band at 7000 differs from mid band at 4000 and mid band at 10000 in ≥2 identity factors', () => {
    const mid1 = bandProfileAtDepth(4000);
    const mid2 = bandProfileAtDepth(7000);
    const mid3 = bandProfileAtDepth(10000);
    expect(distinctFactorCount(mid1, mid2)).toBeGreaterThanOrEqual(2);
    expect(distinctFactorCount(mid2, mid3)).toBeGreaterThanOrEqual(2);
  });

  it('mid band at 10000 differs from mid band at 7000 and deep (12000) in ≥2 identity factors', () => {
    const mid2 = bandProfileAtDepth(7000);
    const mid3 = bandProfileAtDepth(10000);
    const deep = bandProfileAtDepth(12000);
    expect(distinctFactorCount(mid2, mid3)).toBeGreaterThanOrEqual(2);
    expect(distinctFactorCount(mid3, deep)).toBeGreaterThanOrEqual(2);
  });

  it('all three mid bands use distinct palette families (not just darker)', () => {
    const mid1 = bandProfileAtDepth(4000);
    const mid2 = bandProfileAtDepth(7000);
    const mid3 = bandProfileAtDepth(10000);
    // Each adjacent pair must have a clearly different water color
    const d12 =
      Math.abs(mid1.waterTop[0] - mid2.waterTop[0]) +
      Math.abs(mid1.waterTop[1] - mid2.waterTop[1]) +
      Math.abs(mid1.waterTop[2] - mid2.waterTop[2]);
    const d23 =
      Math.abs(mid2.waterTop[0] - mid3.waterTop[0]) +
      Math.abs(mid2.waterTop[1] - mid3.waterTop[1]) +
      Math.abs(mid2.waterTop[2] - mid3.waterTop[2]);
    expect(d12).toBeGreaterThan(0.1);
    expect(d23).toBeGreaterThan(0.1);
  });

  // WI-06c: the two deepest bands and the final zone each differ from their
  // adjacent bands in at least two identity factors (request §14.3).

  it('the deepest band at 10000 differs from the band above (7000) in ≥2 identity factors', () => {
    const mid2 = bandProfileAtDepth(7000);
    const mid3 = bandProfileAtDepth(10000);
    expect(distinctFactorCount(mid2, mid3)).toBeGreaterThanOrEqual(2);
  });

  it('the final zone at 12000 differs from the band above (10000) in ≥2 identity factors', () => {
    const mid3 = bandProfileAtDepth(10000);
    const deep = bandProfileAtDepth(12000);
    expect(distinctFactorCount(mid3, deep)).toBeGreaterThanOrEqual(2);
  });
});
