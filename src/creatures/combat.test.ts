/**
 * Tests — the section 10 damage model (WI-03c1a): the per-size-class table
 *   (small killable quickly, medium killable but costly, large deterable and
 *   not worth killing) and the per-hit resolution the simulation applies when
 *   the player's harpoon lands. Pure functions, no mocks: the table and the
 *   resolver are the real production code (`combat.ts`).
 */
import { describe, expect, it } from 'vitest';
import { DAMAGE_MODEL, DETER_HOLD_SECONDS, HARPOON_RANGE, resolveHarpoonHit } from './combat';

describe('section 10 damage model table', () => {
  it('small fauna are killable quickly: one harpoon hit kills', () => {
    expect(DAMAGE_MODEL.small.killShots).toBe(1);
    expect(resolveHarpoonHit('small', 0).outcome).toBe('kill');
    expect(resolveHarpoonHit('small', 0).hits).toBe(1);
  });

  it('medium predators are killable but costly: several hits, no quick kill', () => {
    const medium = DAMAGE_MODEL.medium.killShots;
    expect(medium).toBeGreaterThan(1); // costing more than a small-quick-kill
    expect(medium).toBeLessThanOrEqual(10); // still killable, not a leviathan
    for (let prior = 0; prior < medium - 1; prior += 1) {
      const res = resolveHarpoonHit('medium', prior);
      expect(res.outcome, `hit ${prior + 1} of ${medium} must hit, not kill`).toBe('hit');
      expect(res.hits).toBe(prior + 1);
    }
    expect(resolveHarpoonHit('medium', medium - 1).outcome).toBe('kill');
  });

  it('large predators are never killed: every hit resolves as a deter', () => {
    expect(DAMAGE_MODEL.large.killShots).toBe(Infinity);
    for (const prior of [0, 1, 5, 50]) {
      const res = resolveHarpoonHit('large', prior);
      expect(res.outcome, `a large predator must never die on hit ${prior + 1}`).toBe('deter');
    }
  });

  it('the model is a cost table, not an HP model: no hp field anywhere', () => {
    for (const cls of ['small', 'medium', 'large'] as const) {
      expect(Object.keys(DAMAGE_MODEL[cls])).toEqual(['killShots']);
    }
    // The deter hold and the lance range are the model's only other knobs.
    expect(DETER_HOLD_SECONDS).toBeGreaterThan(0);
    expect(HARPOON_RANGE).toBeGreaterThan(0);
  });
});
