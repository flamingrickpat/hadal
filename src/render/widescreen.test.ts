import {
  BASELINE_ASPECT,
  WIDESCREEN_PARAMS,
  effectiveViewWidth,
  viewWidthModifier,
} from './widescreen';
import { CAMERA_VIEW_WIDTH } from '../game/constants';
import { describe, expect, test } from 'vitest';

describe('widescreen layout params', () => {
  test('baseline aspect is 16:9', () => {
    expect(BASELINE_ASPECT).toBeCloseTo(16 / 9, 10);
  });

  test('baseline aspect returns modifier of 1.0', () => {
    expect(viewWidthModifier(BASELINE_ASPECT)).toBe(1.0);
  });

  test('standard 16:9 returns modifier of 1.0', () => {
    expect(viewWidthModifier(1.777)).toBe(1.0);
  });

  test('narrower than baseline returns modifier of 1.0', () => {
    expect(viewWidthModifier(1.6)).toBe(1.0);
  });

  test('wider than baseline returns modifier > 1.0', () => {
    // 21:9 aspect
    expect(viewWidthModifier(21 / 9)).toBeGreaterThan(1.0);
  });

  test('21:9 widescreen widens the view proportionally', () => {
    // At 21:9, the view should be wider than at 16:9
    const modifier = viewWidthModifier(21 / 9);
    // 21/9 divided by 16/9 = 21/16 = 1.3125
    expect(modifier).toBeCloseTo(1.3125, 4);
  });

  test('32:9 ultra-wide is capped at maxWidescreenModifier', () => {
    const modifier = viewWidthModifier(32 / 9);
    expect(modifier).toBe(WIDESCREEN_PARAMS.maxWidescreenModifier);
  });

  test('view width at baseline equals CAMERA_VIEW_WIDTH', () => {
    expect(effectiveViewWidth(BASELINE_ASPECT)).toBe(CAMERA_VIEW_WIDTH);
  });

  test('view width at 21:9 is wider than baseline', () => {
    expect(effectiveViewWidth(21 / 9)).toBeGreaterThan(CAMERA_VIEW_WIDTH);
  });
});