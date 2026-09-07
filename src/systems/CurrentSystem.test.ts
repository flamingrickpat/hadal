import { describe, expect, it } from 'vitest';
import {
  driftField,
  ventField,
  pulsingCurrentField,
  eddyField,
  CurrentSystem,
} from './CurrentSystem';
import { vec2 } from '../util/math';
import { createSimulation, emptyInput, makeSimWorld } from '../sim/Simulation';
import { stepParticleType, type ParticleType } from '../render/particles';
import { bandProfileAtDepth } from '../render/band';

function makeType(count: number, sink: number, seed: number, start: { x: number; y: number }): ParticleType {
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = start.x;
    positions[i * 3 + 1] = start.y;
    positions[i * 3 + 2] = 0;
    seeds[i] = seed;
  }
  return { name: 'silt', positions, seeds, count, sink, z: 0 };
}

/**
 * The current system (request §64): the four field types compute the local
 * velocity, the system sums the fields, the player is carried by the field,
 * the mid-game `boost` mobility upgrade reduces the drift, and the particles
 * follow the same field.
 */
describe('current fields (request §64)', () => {
  it('a horizontal drift field gives a constant velocity', () => {
    const field = driftField({ x: 0, y: -1000, w: 1000, h: 1000 }, vec2(1, 0), 40);
    const v = field.velocityAt(vec2(500, -500), 0);
    expect(v.x).toBeCloseTo(40);
    expect(v.y).toBeCloseTo(0);
  });

  it('a vertical vent rises, strongest at the centre', () => {
    const field = ventField({ x: 0, y: -1000, w: 1000, h: 1000 }, 30);
    const centre = field.velocityAt(vec2(500, -500), 0);
    const edge = field.velocityAt(vec2(0, -500), 0);
    expect(centre.y).toBeCloseTo(30);
    expect(centre.y).toBeGreaterThan(edge.y);
  });

  it('a pulsing current oscillates over time', () => {
    const field = pulsingCurrentField({ x: 0, y: -1000, w: 1000, h: 1000 }, vec2(1, 0), 40, 4);
    const vHigh = field.velocityAt(vec2(500, -500), 1); // peak (sin = +1)
    const vLow = field.velocityAt(vec2(500, -500), 3); // trough (sin = -1)
    expect(vHigh.x).toBeGreaterThan(vLow.x);
    expect(vHigh.x).toBeCloseTo(40);
  });

  it('an eddy swirls around the centre with radial falloff', () => {
    const field = eddyField({ x: 0, y: -1000, w: 1000, h: 1000 }, 400, 20);
    const near = field.velocityAt(vec2(800, -500), 0); // 300 right of centre
    const far = field.velocityAt(vec2(980, -500), 0); // 480 right of centre (near the edge)
    expect(Math.abs(near.y)).toBeGreaterThan(0); // the swirl has a vertical component
    expect(Math.hypot(near.x, near.y)).toBeGreaterThan(Math.hypot(far.x, far.y)); // falloff with distance
  });

  it('the system sums the fields whose bounds contain the position', () => {
    const system = new CurrentSystem([
      driftField({ x: 0, y: -1000, w: 1000, h: 1000 }, vec2(1, 0), 30),
      ventField({ x: 0, y: -1000, w: 1000, h: 1000 }, 20),
    ]);
    const v = system.velocityAt(vec2(500, -500), 0);
    expect(v.x).toBeCloseTo(30);
    expect(v.y).toBeCloseTo(20);
    // Outside every field: no current.
    expect(system.velocityAt(vec2(5000, -500), 0)).toEqual({ x: 0, y: 0 });
  });
});

describe('currents move the player and the particles (request §64)', () => {
  it('a stationary player is carried by the local current', () => {
    const sim = createSimulation(makeSimWorld(), 0);
    sim.teleportTo(12000, 2500); // open water in the global drift field
    const before = { x: sim.player.position.x, y: sim.player.position.y };
    sim.step(emptyInput(), 1);
    expect(sim.player.position.x - before.x).toBeGreaterThan(5); // carried +x
  });

  it('the mid-game boost mobility upgrade noticeably reduces the current drift', () => {
    const sim = createSimulation(makeSimWorld(), 0);
    sim.teleportTo(12000, 2500);
    const before = { x: sim.player.position.x, y: sim.player.position.y };
    sim.step(emptyInput(), 1);
    const driftNoBoost = sim.player.position.x - before.x;
    sim.teleportTo(12000, 2500);
    sim.player.capabilities.add('boost');
    const before2 = { x: sim.player.position.x, y: sim.player.position.y };
    sim.step(emptyInput(), 1);
    const driftWithBoost = sim.player.position.x - before2.x;
    expect(driftWithBoost).toBeLessThan(driftNoBoost);
    expect(driftWithBoost).toBeGreaterThanOrEqual(0);
  });

  it('particles follow the same current field (request §64)', () => {
    const system = new CurrentSystem([driftField({ x: -1000, y: -1000, w: 2000, h: 2000 }, vec2(1, 0), 100)]);
    const profile = bandProfileAtDepth(0);
    const tField = makeType(1, 0, 0.5, { x: 0, y: 0 });
    const stateField = { center: { x: 0, y: 0 }, half: { x: 1000, y: 1000 }, time: 0 };
    for (let i = 0; i < 30; i += 1) {
      stepParticleType(tField, stateField, 0.1, profile, (pos, time) => system.velocityAt(pos, time));
      stateField.time += 0.1;
    }
    const driftWithField = tField.positions[0]!;
    // The profile-only particle (no field) drifts from the band's current dir.
    const tProfile = makeType(1, 0, 0.5, { x: 0, y: 0 });
    const stateProfile = { center: { x: 0, y: 0 }, half: { x: 1000, y: 1000 }, time: 0 };
    for (let i = 0; i < 30; i += 1) {
      stepParticleType(tProfile, stateProfile, 0.1, profile);
      stateProfile.time += 0.1;
    }
    const driftProfile = tProfile.positions[0]!;
    // The field particle is carried further +x than the profile-only particle.
    expect(driftWithField).toBeGreaterThan(driftProfile);
    expect(driftWithField).toBeGreaterThan(200); // net +x from the 100 u/s field
  });
});
