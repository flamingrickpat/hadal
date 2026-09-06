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
    lighting.update(vec2(1300, -1057), vec2(1300, -1400), 0, profile);
    expect(lighting.beam.scale.x).toBeCloseTo(profile.visibility);
    expect(lighting.beam.scale.y).toBeCloseTo(profile.visibility);
  });

  it('anchors the beam to the player (the diver light), not the camera center', () => {
    const lighting = make();
    const profile = bandProfileAtDepth(1400);
    const center = vec2(1300, -1057); // the camera clamps here at this depth
    const player = vec2(1300, -1400); // the diver, below the clamped camera
    lighting.update(center, player, 0, profile);
    expect(lighting.beam.position.x).toBeCloseTo(player.x);
    expect(lighting.beam.position.y).toBeCloseTo(player.y);
    // The ambient water gradient stays camera-anchored (it is the base, not the light).
    expect(lighting.gradient.position.x).toBeCloseTo(center.x);
    expect(lighting.gradient.position.y).toBeCloseTo(center.y);
  });

  it('shortens the beam reach with depth (visibility falls, request §15)', () => {
    const lighting = make();
    lighting.update(vec2(0, 0), vec2(0, 0), 0, bandProfileAtDepth(0));
    const shallowReach = lighting.beam.scale.x;
    lighting.update(vec2(0, 0), vec2(0, 0), 0, bandProfileAtDepth(12000));
    expect(lighting.beam.scale.x).toBeLessThan(shallowReach);
  });
});
