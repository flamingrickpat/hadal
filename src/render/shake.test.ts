/**
 * Tests for the section 16 low-frequency shake path (request §16, §35).
 *
 * Verification:
 * - Presentation flag plumbing: flag off suppresses all shake from any source;
 *   flag on allows the gated path.
 * - Low-frequency gate: low-frequency oscillation passes through; high-frequency
 *   jitter is filtered out.
 * - Amplitude budget: no individual shake event or accumulated shake exceeds the
 *   section 16 limit.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  setShakeEnabled,
  isShakeEnabled,
  emitShake,
  updateShake,
  getShakeOffset,
  resetShake,
  SHAKE_AMPLITUDE_BUDGET,
  SHAKE_MAX_FREQ_HZ,
} from './shake';

describe('shake path', () => {
  beforeEach(() => {
    resetShake();
  });

  describe('presentation flag plumbing', () => {
    it('defaults to enabled', () => {
      expect(isShakeEnabled()).toBe(true);
    });

    it('flag off suppresses all shake from any source', () => {
      setShakeEnabled(false);
      emitShake(10, 2);
      const offset = getShakeOffset();
      expect(offset.x).toBe(0);
      expect(offset.y).toBe(0);
    });

    it('flag on allows the gated path', () => {
      setShakeEnabled(true);
      emitShake(10, 2);
      const offset = getShakeOffset();
      expect(Math.hypot(offset.x, offset.y)).toBeGreaterThan(0);
    });
  });

  describe('low-frequency gate', () => {
    it('passes low-frequency oscillation', () => {
      setShakeEnabled(true);
      // 2 Hz is below the low-frequency threshold (3 Hz)
      emitShake(10, 2);
      updateShake(0.05);
      const offset = getShakeOffset();
      expect(Math.hypot(offset.x, offset.y)).toBeGreaterThan(0);
    });

    it('filters high-frequency jitter', () => {
      setShakeEnabled(true);
      // 10 Hz is above the low-frequency threshold (3 Hz) — should be filtered
      emitShake(10, 10);
      updateShake(0.05);
      const offset = getShakeOffset();
      expect(Math.hypot(offset.x, offset.y)).toBeLessThan(0.1);
    });

    it('filters extreme high-frequency jitter', () => {
      setShakeEnabled(true);
      emitShake(10, 30);
      updateShake(0.05);
      const offset = getShakeOffset();
      expect(Math.hypot(offset.x, offset.y)).toBeLessThan(0.05);
    });
  });

  describe('amplitude budget', () => {
    it('caps per-event shake at the section 16 limit', () => {
      setShakeEnabled(true);
      // Try to emit 100x the budget
      emitShake(SHAKE_AMPLITUDE_BUDGET * 100, 2);
      updateShake(0.05);
      const offset = getShakeOffset();
      expect(Math.hypot(offset.x, offset.y)).toBeLessThanOrEqual(SHAKE_AMPLITUDE_BUDGET);
    });

    it('caps accumulated shake at the section 16 limit', () => {
      setShakeEnabled(true);
      // Multiple small shakes that together exceed the budget
      for (let i = 0; i < 10; i++) {
        emitShake(SHAKE_AMPLITUDE_BUDGET * 0.3, 2);
        updateShake(0.05);
      }
      const offset = getShakeOffset();
      expect(Math.hypot(offset.x, offset.y)).toBeLessThanOrEqual(SHAKE_AMPLITUDE_BUDGET);
    });
  });

  describe('decay', () => {
    it('shake decays to zero', () => {
      setShakeEnabled(true);
      emitShake(10, 2);
      // Advance time until shake decays
      for (let i = 0; i < 100; i++) {
        updateShake(0.05);
      }
      const offset = getShakeOffset();
      expect(Math.hypot(offset.x, offset.y)).toBeLessThan(0.1);
    });
  });
});