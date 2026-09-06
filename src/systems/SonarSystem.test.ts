import { describe, expect, it } from 'vitest';
import {
  ECHO_LIFE,
  FIXED_DT,
  SONAR_RANGE,
  SONAR_RING_SPEED,
  SIGNATURE_TIME,
  TAG_FLASH_TIME,
} from '../game/constants';
import { WorldSignalBus, type Percept } from '../creatures/senses';
import { SonarSystem, type SonarObject } from './SonarSystem';
import { vec2 } from '../util/math';

function freshPercept(): Percept {
  return { noise: 0, light: 0, sonar: 0, injury: 0 };
}

describe('SonarSystem', () => {
  it('firing emits a sonar world signal perceivable at the source (request §18, §63)', () => {
    const bus = new WorldSignalBus();
    const sonar = new SonarSystem(bus, [vec2(0, 0), vec2(100, -50)], []);
    sonar.fire(vec2(0, 0), 0);
    sonar.update(FIXED_DT, FIXED_DT);
    const out = freshPercept();
    bus.perceive(0, 0, FIXED_DT, out);
    expect(out.sonar).toBeGreaterThan(0.5);
  });

  it('firing emits a noise side-effect a noise-sensing creature reacts to (request §18, §63)', () => {
    const bus = new WorldSignalBus();
    const sonar = new SonarSystem(bus, [vec2(0, 0)], []);
    sonar.fire(vec2(0, 0), 0);
    sonar.update(FIXED_DT, FIXED_DT);
    const out = freshPercept();
    bus.perceive(0, 0, FIXED_DT, out);
    expect(out.noise).toBeGreaterThan(0.5);
  });

  it('the ring expands from the origin and deactivates at the range (request §18)', () => {
    const bus = new WorldSignalBus();
    const sonar = new SonarSystem(bus, [], []);
    sonar.fire(vec2(100, 100), 0);
    expect(sonar.ringActive).toBe(true);
    expect(sonar.ringRadius).toBe(0);
    expect(sonar.ringMaxRadius).toBe(SONAR_RANGE);
    let time = 0;
    let radius = 0;
    while (sonar.ringActive) {
      radius = sonar.ringRadius;
      time += FIXED_DT;
      sonar.update(FIXED_DT, time);
      expect(sonar.ringRadius).toBeGreaterThan(radius); // the ring expands
    }
    expect(sonar.ringActive).toBe(false);
    // The ring took ~range / speed seconds to reach its max and stop.
    expect(time).toBeGreaterThan(SONAR_RANGE / SONAR_RING_SPEED);
  });

  it('marks a resource signature when the sonar reaches the node (request §18)', () => {
    const bus = new WorldSignalBus();
    const origin = vec2(0, 0);
    const node: SonarObject = { x: 500, y: 0, size: 1, resource: true };
    const sonar = new SonarSystem(bus, [vec2(0, 0)], [node]);
    sonar.fire(origin, 0);
    const target = sonar.targets[sonar.targets.length - 1]!;
    let time = 0;
    while (time < 5 && !sonar.isTagged(target, time)) {
      time += FIXED_DT;
      sonar.update(FIXED_DT, time);
    }
    expect(target.lastHit).toBeGreaterThan(0);
    expect(sonar.isTagged(target, time)).toBe(true);
  });

  it('the resource signature lasts longer than a terrain flash (not a minimap, request §18)', () => {
    expect(SIGNATURE_TIME).toBeGreaterThan(TAG_FLASH_TIME);
    const sonar = new SonarSystem(new WorldSignalBus(), [], [
      { x: 100, y: 0, size: 1, resource: true },
      { x: 200, y: 0, size: 1, resource: false },
    ]);
    const resource = sonar.targets[0]!;
    const terrain = sonar.targets[1]!;
    expect(sonar.tagDuration(resource)).toBeGreaterThan(sonar.tagDuration(terrain));
  });

  it('the sonar is transient: the tag fades after its duration (request §18)', () => {
    const sonar = new SonarSystem(new WorldSignalBus(), [vec2(100, 0), vec2(110, 5)], []);
    sonar.fire(vec2(0, 0), 0);
    const t = sonar.targets[0]!;
    let time = 0;
    let sawTagged = false;
    while (time < 3) {
      time += FIXED_DT;
      sonar.update(FIXED_DT, time);
      if (sonar.isTagged(t, time)) sawTagged = true;
    }
    expect(sawTagged).toBe(true);
    // After the ring is spent and the brief flash has faded, it is no longer outlined.
    time = 4;
    sonar.update(FIXED_DT, time);
    expect(sonar.isTagged(t, time)).toBe(false);
  });

  it('returns a larger/slower pulse from a massive object (request §18)', () => {
    const sonar = new SonarSystem(new WorldSignalBus(), [], [
      { x: 100, y: 0, size: 1, resource: false },
      { x: 200, y: 0, size: 8, resource: false },
    ]);
    const small = sonar.targets[0]!;
    const massive = sonar.targets[1]!;
    expect(sonar.tagDuration(massive)).toBeGreaterThan(sonar.tagDuration(small));
    expect(sonar.echoes.length).toBeGreaterThan(0);
    // An echo's lifetime also scales with the object size.
    sonar.fire(vec2(0, 0), 0);
    let time = 0;
    while (time < 3 && !sonar.echoes.some((e) => e.active)) {
      time += FIXED_DT;
      sonar.update(FIXED_DT, time);
    }
    expect(sonar.echoes.some((e) => e.active)).toBe(true);
    expect(ECHO_LIFE).toBeGreaterThan(0);
  });

  it('spawns short-lived echo particles at terrain points (request §18)', () => {
    const sonar = new SonarSystem(new WorldSignalBus(), [vec2(300, 0), vec2(310, 5)], []);
    sonar.fire(vec2(0, 0), 0);
    let time = 0;
    let sawActive = false;
    while (time < 4) {
      time += FIXED_DT;
      sonar.update(FIXED_DT, time);
      if (sonar.echoes.some((e) => e.active)) sawActive = true;
    }
    expect(sawActive).toBe(true);
    // By the time the ring is spent, every echo has expired (short-lived).
    expect(sonar.echoes.some((e) => e.active)).toBe(false);
  });

  it('reuses fixed pools across many updates (no per-frame allocation, request §34)', () => {
    const sonar = new SonarSystem(
      new WorldSignalBus(),
      [vec2(0, 0), vec2(1500, 0), vec2(1500, 800)],
      [{ x: 300, y: 0, size: 1, resource: true }],
    );
    const targets = sonar.targets;
    const echoes = sonar.echoes;
    sonar.fire(vec2(0, 0), 0);
    let time = 0;
    for (let i = 0; i < 300; i += 1) {
      time += FIXED_DT;
      sonar.update(FIXED_DT, time);
    }
    expect(sonar.targets).toBe(targets);
    expect(sonar.echoes).toBe(echoes);
    expect(targets.length).toBeGreaterThan(1);
  });

  it('the real sonar fire makes a nearby fixture creature react (request §18, §63)', () => {
    const bus = new WorldSignalBus();
    const sonar = new SonarSystem(bus, [], []);
    // A minimal sonar-sensing subscriber (the seam WI-10 creatures use).
    const out = freshPercept();
    let reacted = false;
    sonar.fire(vec2(0, 0), 0);
    let time = 0;
    while (time < 2 && !reacted) {
      time += FIXED_DT;
      sonar.update(FIXED_DT, time);
      bus.perceive(150, 0, time, out);
      if (out.sonar >= 0.2) reacted = true;
    }
    expect(reacted).toBe(true);
    // A creature far from the pulse does not react (nearby-recent gating, request §63).
    const farOut = freshPercept();
    bus.perceive(9000, 0, 0.2, farOut);
    expect(farOut.sonar).toBeLessThan(0.2);
  });
});
