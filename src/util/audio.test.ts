import { describe, expect, it } from 'vitest';
import { AUDIO_STOPS, audioProfileAtDepth, distanceGain, worldPan } from './audio';

describe('audioProfileAtDepth', () => {
  const depths = [0, 400, 800, 1600, 2400, 4000, 5500, 7000, 8500, 10000, 12000, 15000];

  it('reduces high frequencies and raises low rumble / reverb as depth increases', () => {
    let prevCutoff = Infinity;
    let prevRumble = -1;
    let prevReverb = -1;
    let prevDrone = Infinity;
    for (const d of depths) {
      const p = audioProfileAtDepth(d);
      expect(p.highCutoff).toBeLessThanOrEqual(prevCutoff);
      expect(p.lowRumble).toBeGreaterThanOrEqual(prevRumble);
      expect(p.reverb).toBeGreaterThanOrEqual(prevReverb);
      expect(p.drone).toBeLessThanOrEqual(prevDrone);
      prevCutoff = p.highCutoff;
      prevRumble = p.lowRumble;
      prevReverb = p.reverb;
      prevDrone = p.drone;
    }
  });

  it('mixing curve is strictly monotonic: highCutoff strictly falls, lowRumble and reverb strictly rise', () => {
    const stops = AUDIO_STOPS;
    for (let i = 1; i < stops.length; i += 1) {
      const prev = stops[i - 1]!;
      const curr = stops[i]!;
      expect(curr.highCutoff).toBeLessThan(prev.highCutoff);
      expect(curr.lowRumble).toBeGreaterThan(prev.lowRumble);
      expect(curr.reverb).toBeGreaterThan(prev.reverb);
    }
  });

  it('audioProfileAtDepth at each band stop resolves to the authored values', () => {
    for (const stop of AUDIO_STOPS) {
      const profile = audioProfileAtDepth(stop.depth);
      expect(profile.depth).toBe(stop.depth);
      expect(profile.highCutoff).toBe(stop.highCutoff);
      expect(profile.lowRumble).toBe(stop.lowRumble);
      expect(profile.reverb).toBe(stop.reverb);
      expect(profile.drone).toBe(stop.drone);
      expect(profile.oceanBed).toBe(stop.oceanBed);
      expect(profile.currentRumble).toBe(stop.currentRumble);
      expect(profile.hull).toBe(stop.hull);
      expect(profile.breathing).toBe(stop.breathing);
    }
  });

  it('is full-spectrum and light at the surface, muffled and deep at the floor', () => {
    const shallow = audioProfileAtDepth(0);
    const deep = audioProfileAtDepth(12000);
    // high frequencies are cut far below their surface level at depth
    expect(shallow.highCutoff).toBeGreaterThan(deep.highCutoff * 3);
    // the low pressure rumble and reverb character grow by a wide margin
    expect(deep.lowRumble).toBeGreaterThan(shallow.lowRumble + 0.5);
    expect(deep.reverb).toBeGreaterThan(shallow.reverb + 0.5);
    // the music/drone bed recedes so distant calls can lead instead
    expect(shallow.drone).toBeGreaterThan(deep.drone * 3);
  });

  it('is aurally distinct between two depth bands', () => {
    const a = audioProfileAtDepth(0);
    const b = audioProfileAtDepth(7000);
    const keys = [
      'highCutoff',
      'lowRumble',
      'oceanBed',
      'currentRumble',
      'hull',
      'reverb',
      'drone',
      'breathing',
    ] as const;
    let distinct = 0;
    for (const k of keys) if (Math.abs(a[k] - b[k]) > 1e-6) distinct += 1;
    expect(distinct).toBeGreaterThanOrEqual(4);
  });

  it('clamps to the first stop below the surface and the last stop past the floor', () => {
    expect(audioProfileAtDepth(-500)).toEqual(AUDIO_STOPS[0]);
    expect(audioProfileAtDepth(99999)).toEqual(AUDIO_STOPS[AUDIO_STOPS.length - 1]);
  });

  it('interpolates strictly between the bracketing stops', () => {
    const mid = audioProfileAtDepth(5000);
    const a = AUDIO_STOPS[2]!;
    const b = AUDIO_STOPS[3]!;
    expect(mid.highCutoff).toBeLessThan(a.highCutoff);
    expect(mid.highCutoff).toBeGreaterThan(b.highCutoff);
    expect(mid.lowRumble).toBeGreaterThan(a.lowRumble);
    expect(mid.lowRumble).toBeLessThan(b.lowRumble);
    expect(mid.depth).toBe(5000);
  });

  it('is deterministic in depth', () => {
    expect(audioProfileAtDepth(3333)).toEqual(audioProfileAtDepth(3333));
  });
});

describe('distanceGain', () => {
  it('is full at the listener and falls with distance', () => {
    expect(distanceGain(0)).toBeCloseTo(1);
    const mid = distanceGain(600);
    const far = distanceGain(6000);
    expect(mid).toBeLessThan(1);
    expect(far).toBeLessThan(mid);
  });

  it('is ~0.25 at the reference distance and bounded in [0, 1]', () => {
    const ref = 1200;
    expect(distanceGain(ref, ref, 2)).toBeCloseTo(0.25, 2);
    for (const d of [0, 100, 1200, 5000, 100000]) {
      const g = distanceGain(d);
      expect(g).toBeGreaterThanOrEqual(0);
      expect(g).toBeLessThanOrEqual(1);
    }
  });
});

describe('worldPan', () => {
  it('is centered at the listener and signed by world side', () => {
    expect(worldPan(0, 0)).toBeCloseTo(0);
    expect(worldPan(-1200, 0)).toBeLessThan(0);
    expect(worldPan(1200, 0)).toBeGreaterThan(0);
  });

  it('is symmetric and bounded in [-1, 1]', () => {
    expect(worldPan(-1200, 0)).toBeCloseTo(-worldPan(1200, 0), 5);
    for (const x of [-9999, -1200, 0, 1200, 9999]) {
      const p = worldPan(x, 0);
      expect(p).toBeGreaterThanOrEqual(-1);
      expect(p).toBeLessThanOrEqual(1);
    }
  });
});
