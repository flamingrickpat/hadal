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
  return { name: 'silt', positions, seeds, count, sink, rise: 0, z: 0 };
}

// Shared temp object for velocityAt calls (request §34: no per-frame allocation).
const temp = { x: 0, y: 0 };

/**
 * The current system (request §64): the four field types compute the local
 * velocity, the system sums the fields, the player is carried by the field,
 * the mid-game `boost` mobility upgrade reduces the drift, and the particles
 * follow the same field.
 */
describe('current fields (request §64)', () => {
  it('a horizontal drift field gives a constant velocity', () => {
    const field = driftField({ x: 0, y: -1000, w: 1000, h: 1000 }, vec2(1, 0), 40);
    field.velocityAt(vec2(500, -500), 0, temp);
    expect(temp.x).toBeCloseTo(40);
    expect(temp.y).toBeCloseTo(0);
  });

  it('a vertical vent rises, strongest at the centre', () => {
    const field = ventField({ x: 0, y: -1000, w: 1000, h: 1000 }, 30);
    field.velocityAt(vec2(500, -500), 0, temp);
    const centreY = temp.y;
    field.velocityAt(vec2(0, -500), 0, temp);
    const edgeY = temp.y;
    expect(centreY).toBeCloseTo(30);
    expect(centreY).toBeGreaterThan(edgeY);
  });

  it('a pulsing current oscillates over time', () => {
    const field = pulsingCurrentField({ x: 0, y: -1000, w: 1000, h: 1000 }, vec2(1, 0), 40, 4);
    field.velocityAt(vec2(500, -500), 1, temp); // peak (sin = +1)
    const vHighX = temp.x;
    field.velocityAt(vec2(500, -500), 3, temp); // trough (sin = -1)
    const vLowX = temp.x;
    expect(vHighX).toBeGreaterThan(vLowX);
    expect(vHighX).toBeCloseTo(40);
  });

  it('an eddy swirls around the centre with radial falloff', () => {
    const field = eddyField({ x: 0, y: -1000, w: 1000, h: 1000 }, 400, 20);
    field.velocityAt(vec2(800, -500), 0, temp); // 300 right of centre
    const nearY = temp.y;
    const nearMag = Math.hypot(temp.x, temp.y);
    field.velocityAt(vec2(980, -500), 0, temp); // 480 right of centre (near the edge)
    const farMag = Math.hypot(temp.x, temp.y);
    expect(Math.abs(nearY)).toBeGreaterThan(0); // the swirl has a vertical component
    expect(nearMag).toBeGreaterThan(farMag); // falloff with distance
  });

  it('the system sums the fields whose bounds contain the position', () => {
    const system = new CurrentSystem([
      driftField({ x: 0, y: -1000, w: 1000, h: 1000 }, vec2(1, 0), 30),
      ventField({ x: 0, y: -1000, w: 1000, h: 1000 }, 20),
    ]);
    system.velocityAt(vec2(500, -500), 0, temp);
    expect(temp.x).toBeCloseTo(30);
    expect(temp.y).toBeCloseTo(20);
    // Outside every field: no current.
    system.velocityAt(vec2(5000, -500), 0, temp);
    expect(temp).toEqual({ x: 0, y: 0 });
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
      stepParticleType(tField, stateField, 0.1, profile, (pos, time, out) => system.velocityAt(pos, time, out));
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