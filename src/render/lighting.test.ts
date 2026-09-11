import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { Lighting } from './lighting';
import { bandProfileAtDepth } from './band';
import { vec2 } from '../util/math';

// The beam is the diver's light: a composited cone/radial mask that must be
// scaled to its reach (so it covers the beam region, not a ~2 px quad) and
// anchored to the player (not the camera center) so it reveals the scene
// around the diver and shortens effective visibility with depth (request §15).
describe('Lighting beam (request §15: a cone/radial mask that reveals the scene)', () => {
  const make = (): Lighting => new Lighting(new THREE.Scene());

  it('scales the beam to its reach so it covers the beam region, not a 2-px quad', () => {
    const lighting = make();
    const profile = bandProfileAtDepth(1400);
    lighting.update(vec2(1300, -1057), vec2(1300, -1400), 0, profile, 0.016);
    expect(lighting.beam.scale.x).toBeCloseTo(profile.visibility);
    expect(lighting.beam.scale.y).toBeCloseTo(profile.visibility);
  });

  it('anchors the beam to the player (the diver light), not the camera center', () => {
    const lighting = make();
    const profile = bandProfileAtDepth(1400);
    const center = vec2(1300, -1057); // the camera clamps here at this depth
    const player = vec2(1300, -1400); // the diver, below the clamped camera
    lighting.update(center, player, 0, profile, 0.016);
    expect(lighting.beam.position.x).toBeCloseTo(player.x);
    expect(lighting.beam.position.y).toBeCloseTo(player.y);
    // The ambient water gradient stays camera-anchored (it is the base, not the light).
    expect(lighting.gradient.position.x).toBeCloseTo(center.x);
    expect(lighting.gradient.position.y).toBeCloseTo(center.y);
  });

  it('shortens the beam reach with depth (visibility falls, request §15)', () => {
    const lighting = make();
    lighting.update(vec2(0, 0), vec2(0, 0), 0, bandProfileAtDepth(0), 0.016);
    const shallowReach = lighting.beam.scale.x;
    lighting.update(vec2(0, 0), vec2(0, 0), 0, bandProfileAtDepth(12000), 0.016);
    expect(lighting.beam.scale.x).toBeLessThan(shallowReach);
  });

  // WI-06d-b2: light sway (request §14.3/§48)
  describe('light sway (request §14.3/§48)', () => {
    it('the beam intensity oscillates with the sway clock (living water)', () => {
      const lighting = make();
      const profile = bandProfileAtDepth(0);
      // Advance the clock through a full sway period and verify the intensity
      // changes (the light sways).
      lighting.update(vec2(0, 0), vec2(0, 0), 0, profile, 0);
      const baseIntensity = lighting.beamMat.uniforms.uIntensity!.value as number;
      // Advance halfway through the sway period (sin = 0 at 0, 1 at pi/2)
      lighting.update(vec2(0, 0), vec2(0, 0), 0, profile, profile.swayPeriod / 4);
      const peakIntensity = lighting.beamMat.uniforms.uIntensity!.value as number;
      // The intensity should have increased (sin(pi/2) = 1, positive sway)
      expect(peakIntensity).toBeGreaterThan(baseIntensity);
      // Advance to the trough (sin(3pi/2) = -1, negative sway)
      lighting.update(vec2(0, 0), vec2(0, 0), 0, profile, profile.swayPeriod / 2);
      const troughIntensity = lighting.beamMat.uniforms.uIntensity!.value as number;
      expect(troughIntensity).toBeLessThan(baseIntensity);
    });

    it('deeper bands sway less (restraint envelope)', () => {
      const lighting = make();
      const shallowProfile = bandProfileAtDepth(0);
      const deepProfile = bandProfileAtDepth(12000);
      // Advance both to the peak of their sway
      lighting.update(vec2(0, 0), vec2(0, 0), 0, shallowProfile, shallowProfile.swayPeriod / 4);
      const shallowIntensity = lighting.beamMat.uniforms.uIntensity!.value as number;
      lighting.update(vec2(0, 0), vec2(0, 0), 0, deepProfile, deepProfile.swayPeriod / 4);
      const deepIntensity = lighting.beamMat.uniforms.uIntensity!.value as number;
      // The shallow band should have a larger intensity swing than the deep band.
      // We compare the raw sway amplitude (not the absolute intensity, which
      // also depends on the band's base lightIntensity).
      expect(shallowProfile.swayAmplitude).toBeGreaterThan(deepProfile.swayAmplitude);
    });

    it('the sway period is slow (not flicker)', () => {
      // Verify all bands have a sway period well above frame-scale.
      for (const depth of [0, 4000, 8000, 12000]) {
        const p = bandProfileAtDepth(depth);
        expect(p.swayPeriod).toBeGreaterThanOrEqual(3);
      }
    });
  });
});
