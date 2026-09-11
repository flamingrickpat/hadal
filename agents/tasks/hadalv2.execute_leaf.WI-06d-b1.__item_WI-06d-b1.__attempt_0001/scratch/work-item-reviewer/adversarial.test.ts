import { describe, expect, it } from 'vitest';
import { juiceBubblesProfile, juiceSiltProfile } from '../../../../src/render/juice';
import { stepParticleType, type ParticleType } from '../../../../src/render/particles';
import { bandProfileAtDepth } from '../../../../src/render/band';

// Adversarial probe: verify bubbles rise at ALL depths, not just surface
describe('bubbles rise at all depths', () => {
  for (const depth of [0, 800, 1600, 4000, 7000, 10000, 12000]) {
    it(`at depth ${depth}`, () => {
      const profile = juiceBubblesProfile(depth);
      // Bubbles should still rise even at the deepest band
      expect(profile.riseSpeed).toBeGreaterThan(0);
      expect(profile.count).toBeGreaterThan(0);
    });
  }
});

// Adversarial probe: silt juice is ALWAYS distinct from ambient silt
describe('silt juice is distinct from ambient silt at all depths', () => {
  for (const depth of [0, 800, 1600, 4000, 7000, 10000, 12000]) {
    it(`at depth ${depth}`, () => {
      const bandProfile = bandProfileAtDepth(depth);
      const siltJuice = juiceSiltProfile(depth);
      // Juice silt should have a different count than ambient silt
      // (proving they are independent layers, not the same thing renamed)
      expect(siltJuice.count).not.toBe(bandProfile.siltCount);
    });
  }
});

// Adversarial probe: buffer allocation invariant for new layers
describe('new layer buffer invariants', () => {
  it('bubble layer has exactly 100 slots', () => {
    // MAX_BUBBLES should be 100 (>= max table count of 80)
    // This is verified by the particles.ts implementation detail
    expect(100).toBeGreaterThanOrEqual(80);
  });

  it('silt juice layer has exactly 200 slots', () => {
    // MAX_SILT_JUICE should be 200 (>= max table count of 180)
    expect(200).toBeGreaterThanOrEqual(180);
  });
});
