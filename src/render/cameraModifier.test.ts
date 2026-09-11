import { describe, expect, it } from 'vitest';
import { viewWidthForModifier, type CameraModifier } from './Renderer';
import { CAMERA_VIEW_WIDTH } from '../game/constants';

describe('camera modifier view width (request §16 scale-reveal)', () => {
  it('wide modifier increases the view width (scale-reveal)', () => {
    expect(viewWidthForModifier('wide')).toBe(CAMERA_VIEW_WIDTH * 1.5);
  });

  it('tight modifier decreases the view width (close-up)', () => {
    expect(viewWidthForModifier('tight')).toBe(CAMERA_VIEW_WIDTH * 0.5);
  });

  it('pullback modifier increases the view width the most (post-encounter)', () => {
    expect(viewWidthForModifier('pullback')).toBe(CAMERA_VIEW_WIDTH * 1.75);
  });

  it('null modifier returns the base view width', () => {
    expect(viewWidthForModifier(null)).toBe(CAMERA_VIEW_WIDTH);
  });
});
