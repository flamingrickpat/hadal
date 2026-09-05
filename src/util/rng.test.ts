import { describe, expect, it } from 'vitest';
import { createRng } from './rng';

describe('createRng', () => {
  it('gives identical sequences for identical seeds', () => {
    const a = createRng(0xdeadbeef);
    const b = createRng(0xdeadbeef);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('gives different sequences for different seeds', () => {
    expect(createRng(1)()).not.toBe(createRng(2)());
  });

  it('pins the sequence as a known vector (seed 0xdeadbeef)', () => {
    const rng = createRng(0xdeadbeef);
    expect([rng(), rng(), rng()]).toEqual([
      0.9413696140982211,
      0.26719574979506433,
      0.772033357527107,
    ]);
  });

  it('stays in [0, 1) across a long run', () => {
    const rng = createRng(42);
    for (let i = 0; i < 10000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});
