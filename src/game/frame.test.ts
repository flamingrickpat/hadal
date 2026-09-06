import { describe, expect, it } from 'vitest';
import { stepCountSince } from './frame';
import { FIXED_DT, MAX_FRAME_DT } from './constants';

describe('stepCountSince — fixed-step cadence (request §30)', () => {
  it('advances one step per FIXED_DT of real time', () => {
    expect(stepCountSince(FIXED_DT, 0)).toEqual({ steps: 1, accumulator: 0 });
  });

  it('advances zero steps for a sub-step frame and keeps the leftover', () => {
    const { steps, accumulator } = stepCountSince(FIXED_DT / 2, 0);
    expect(steps).toBe(0);
    expect(accumulator).toBeCloseTo(FIXED_DT / 2);
  });

  it('carries the leftover fraction forward across frames', () => {
    const a = stepCountSince(FIXED_DT / 2, 0);
    const b = stepCountSince(FIXED_DT / 2, a.accumulator);
    expect(a.steps).toBe(0);
    expect(b.steps).toBe(1);
    expect(b.accumulator).toBeCloseTo(0);
  });

  it('is independent of refresh rate: 0.5 s of real time is 30 steps at any fps (request §30 "avoid tying movement to frame rate")', () => {
    const total = (frames: number, frameSec: number): number => {
      let acc = 0;
      let steps = 0;
      for (let i = 0; i < frames; i += 1) {
        const r = stepCountSince(frameSec, acc);
        steps += r.steps;
        acc = r.accumulator;
      }
      return steps;
    };
    expect(total(30, FIXED_DT)).toBe(30); // 60 Hz
    expect(total(60, FIXED_DT / 2)).toBe(30); // 120 Hz
    expect(total(6, 1 / 12)).toBe(30); // 12 Hz
  });

  it('clamps a tab-stall gap to MAX_FRAME_DT so it cannot spiral (request §30)', () => {
    const { steps } = stepCountSince(5, 0); // a 5 s stall
    expect(steps).toBe(Math.round(MAX_FRAME_DT / FIXED_DT)); // 0.1 s / 1/60 = 6
    expect(steps).toBe(6);
  });
});
