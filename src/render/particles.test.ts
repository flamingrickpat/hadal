import { describe, expect, it } from 'vitest';
import { stepParticleType, type ParticleType } from './particles';
import { bandProfileAtDepth, type BandProfile } from './band';
import type { Vec2 } from '../util/math';

function makeType(
  count: number,
  sink: number,
  seed: number,
  start: Vec2 = { x: 0, y: 0 },
  rise = 0,
  name: 'snow' | 'silt' | 'motes' | 'bubbles' | 'siltJuice' = 'snow',
): ParticleType {
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = start.x;
    positions[i * 3 + 1] = start.y;
    positions[i * 3 + 2] = 0;
    seeds[i] = seed;
  }
  return { name, positions, seeds, count, sink, rise, z: 0 };
}

function profile(drift: number, curSpeed: number, curX = 1, curY = 0): BandProfile {
  return {
    ...bandProfileAtDepth(0),
    particleDrift: drift,
    currentSpeed: curSpeed,
    currentDir: { x: curX, y: curY },
  };
}

const state = (center: Vec2, half: Vec2): { center: Vec2; half: Vec2; time: number } => ({
  center,
  half,
  time: 0,
});

describe('stepParticleType (request §34/§35 pooled particles follow the current field)', () => {
  it('reuses the same buffer across many frames (no per-frame allocation, request §34)', () => {
    const t = makeType(200, 1, 0.5);
    const buffer = t.positions;
    const s = state({ x: 0, y: 0 }, { x: 1000, y: 1000 });
    for (let i = 0; i < 600; i += 1) stepParticleType(t, s, 1 / 60, bandProfileAtDepth(0));
    expect(t.positions).toBe(buffer); // same Float32Array reference, not a fresh one
    expect(t.positions.length).toBe(600); // and the same length
  });

  it('moves particles with the base drift (marine snow sinks)', () => {
    const t = makeType(10, 1, 0.5);
    const s = state({ x: 0, y: 0 }, { x: 2000, y: 2000 });
    stepParticleType(t, s, 1, profile(60, 0)); // strong downward drift, no current
    expect(t.positions[1]!).toBeLessThan(0); // moved down
  });

  it('follows the current field where one exists (request §64)', () => {
    const t = makeType(1, 0, 0.5);
    const s = state({ x: 0, y: 0 }, { x: 1000, y: 1000 });
    for (let i = 0; i < 30; i += 1) stepParticleType(t, s, 0.1, profile(0, 100, 1, 0));
    expect(t.positions[0]!).toBeGreaterThanOrEqual(250); // net +x from the current

    const t2 = makeType(1, 0, 0.5);
    const s2 = state({ x: 0, y: 0 }, { x: 1000, y: 1000 });
    for (let i = 0; i < 30; i += 1) stepParticleType(t2, s2, 0.1, profile(0, 0));
    expect(Math.abs(t2.positions[0]!)).toBeLessThan(1e-6); // no current -> no net drift
  });

  it('wraps particles around the moving box instead of dropping them', () => {
    const t = makeType(1, 1, 0.5, { x: 990, y: 0 }); // just inside the +x edge (box half 1000)
    const s = state({ x: 0, y: 0 }, { x: 1000, y: 1000 });
    stepParticleType(t, s, 1, profile(0, 20, 1, 0)); // push past the edge
    const px = t.positions[0]!;
    expect(px).toBeGreaterThanOrEqual(-1000);
    expect(px).toBeLessThan(1000);
    expect(px).toBeLessThan(990); // wrapped to the far side, not kept past the edge
  });
});

describe('section 48 juice particle layers (bubbles and silt juice)', () => {
  it('bubbles rise instead of sink (rise factor inverts the drift direction)', () => {
    const t = makeType(10, 0, 0.5, { x: 0, y: 0 }, 1.0, 'bubbles');
    const s = state({ x: 0, y: 0 }, { x: 2000, y: 2000 });
    stepParticleType(t, s, 1, profile(60, 0)); // strong drift, no current
    expect(t.positions[1]!).toBeGreaterThan(0); // moved UP (positive y)
  });

  it('silt juice particles settle faster than ambient silt (higher sink factor)', () => {
    const t = makeType(10, 0.8, 0.5, { x: 0, y: 0 }, 0, 'siltJuice');
    const s = state({ x: 0, y: 0 }, { x: 2000, y: 2000 });
    stepParticleType(t, s, 1, profile(60, 0));
    expect(t.positions[1]!).toBeLessThan(0); // moved down (sinks)
  });

  it('bubble layer maintains no-allocation invariant (same buffer across frames)', () => {
    const t = makeType(50, 0, 0.3, { x: 0, y: 0 }, 1.0, 'bubbles');
    const buffer = t.positions;
    const s = state({ x: 0, y: 0 }, { x: 1000, y: 1000 });
    for (let i = 0; i < 100; i += 1) stepParticleType(t, s, 1 / 60, bandProfileAtDepth(0));
    expect(t.positions).toBe(buffer);
    expect(t.positions.length).toBe(150);
  });

  it('silt juice layer maintains no-allocation invariant (same buffer across frames)', () => {
    const t = makeType(80, 0.8, 0.7, { x: 0, y: 0 }, 0, 'siltJuice');
    const buffer = t.positions;
    const s = state({ x: 0, y: 0 }, { x: 1000, y: 1000 });
    for (let i = 0; i < 100; i += 1) stepParticleType(t, s, 1 / 60, bandProfileAtDepth(0));
    expect(t.positions).toBe(buffer);
    expect(t.positions.length).toBe(240);
  });
});
