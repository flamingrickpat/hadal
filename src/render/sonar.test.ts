import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { SonarVisuals } from './sonar';
import { SonarSystem, type SonarObject } from '../systems/SonarSystem';
import { WorldSignalBus } from '../creatures/senses';
import { vec2 } from '../util/math';
import { FIXED_DT } from '../game/constants';

// The sonar render layer must express the "larger pulse from massive objects"
// half of request §18 (and §52 technique E, sonar scale): a sonar-tagged
// massive object renders a LARGER echo and tag than a normal one, driven by a
// per-vertex point size (not a fixed material size). The simulation already
// scales the echo life and tag duration by object size; this is the pixels.
describe('SonarVisuals (request §18: larger pulses from massive objects)', () => {
  function make(objects: SonarObject[]): { visuals: SonarVisuals; sonar: SonarSystem } {
    const sonar = new SonarSystem(new WorldSignalBus(), [], objects);
    const visuals = new SonarVisuals(new THREE.Scene(), sonar);
    return { visuals, sonar };
  }

  // Advance the sonar until a size-`size` object has an active echo, then draw.
  function drawWhenEchoActive(
    sonar: SonarSystem,
    visuals: SonarVisuals,
    size: number,
  ): number {
    sonar.fire(vec2(0, 0), 0);
    let time = 0;
    while (time < 3 && !sonar.echoes.some((e) => e.active && e.size === size)) {
      time += FIXED_DT;
      sonar.update(FIXED_DT, time);
    }
    visuals.update(time);
    return time;
  }

  it('a massive object renders a larger echo than a normal one (request §18, §52E)', () => {
    const { visuals, sonar } = make([
      { x: 100, y: 0, size: 1, resource: false },
      { x: 200, y: 0, size: 8, resource: false },
    ]);
    drawWhenEchoActive(sonar, visuals, 8);
    const idx8 = sonar.echoes.findIndex((e) => e.active && e.size === 8);
    const idx1 = sonar.echoes.findIndex((e) => e.active && e.size === 1);
    expect(idx8).toBeGreaterThanOrEqual(0);
    expect(idx1).toBeGreaterThanOrEqual(0);
    expect(visuals.echoSize[idx8]!).toBeGreaterThan(visuals.echoSize[idx1]!);
  });

  it('a massive object renders a larger tag than a normal one (request §18)', () => {
    const { visuals, sonar } = make([
      { x: 100, y: 0, size: 1, resource: false },
      { x: 200, y: 0, size: 8, resource: false },
    ]);
    sonar.fire(vec2(0, 0), 0);
    sonar.update(FIXED_DT, FIXED_DT);
    visuals.update(FIXED_DT);
    // The tag is targets[0] (size 1) and targets[1] (size 8); the size is
    // written for every target each draw, independent of the fade.
    expect(visuals.tagSize[1]!).toBeGreaterThan(visuals.tagSize[0]!);
  });

  it('drives the per-vertex size from the echo geometry attribute, not a fixed size', () => {
    const { visuals, sonar } = make([
      { x: 100, y: 0, size: 1, resource: false },
      { x: 200, y: 0, size: 8, resource: false },
    ]);
    drawWhenEchoActive(sonar, visuals, 8);
    const attr = visuals.echoPts.geometry.getAttribute('size') as THREE.BufferAttribute;
    expect(attr).toBeDefined();
    expect(attr.array).toBe(visuals.echoSize);
    // A size-1 object renders at the base echo size; a massive one larger.
    const idx1 = sonar.echoes.findIndex((e) => e.active && e.size === 1);
    const idx8 = sonar.echoes.findIndex((e) => e.active && e.size === 8);
    expect(visuals.echoSize[idx1]!).toBeGreaterThan(0);
    expect(visuals.echoSize[idx8]!).toBeGreaterThan(visuals.echoSize[idx1]!);
  });

  it('keeps a size-1 object at the base echo size (no visual change to the common case)', () => {
    const { visuals, sonar } = make([{ x: 100, y: 0, size: 1, resource: false }]);
    drawWhenEchoActive(sonar, visuals, 1);
    const idx1 = sonar.echoes.findIndex((e) => e.active && e.size === 1);
    expect(visuals.echoSize[idx1]!).toBeCloseTo(6);
  });
});
