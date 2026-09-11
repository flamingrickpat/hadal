/**
 * holds — widescreen layout params (aspect breakpoints, view-width modifiers)
 *   for the orthographic camera (request §16).
 *
 * archetype: information-holder
 * owns: the breakpoint at which widescreen kicks in and the view-width
 *   modifier function that widens the camera's view on ultrawide
 *   monitors; Node-testable pure data without a browser.
 * not own: the camera, the renderer, or any frame-by-frame state.
 * invariant: the baseline aspect (16:9) returns a modifier of exactly 1.0
 *   (no change); wider aspects return a modifier >= 1.0.
 * fails when: the baseline aspect ratio in the data is changed without
 *   updating the renderer's CAMERA_VIEW_WIDTH to match.
 */

import { CAMERA_VIEW_WIDTH } from '../game/constants';

/** The baseline aspect ratio (request §16: design 16:9, tolerate 21:9). */
export const BASELINE_ASPECT = 16 / 9; // 1.777...

/**
 * Widescreen layout params.
 * - baselineAspect: aspect ratio at which the baseline view width applies.
 * - maxWidescreenModifier: cap on how much wider the view can get (avoid
 *   absurdly wide views on 32:9+ monitors).
 */
export const WIDESCREEN_PARAMS = {
  baselineAspect: BASELINE_ASPECT,
  maxWidescreenModifier: 1.5,
} as const;

/**
 * Compute the view-width modifier for a given aspect ratio.
 *
 * On or below the baseline aspect (16:9), returns 1.0 — the camera keeps
 * its standard view width. On wider aspects (ultrawide), the modifier grows
 * proportionally so the camera shows more world horizontally. This is the
 * "widen, not stretch" strategy (request §16).
 *
 * The modifier is capped at maxWidescreenModifier to avoid an absurdly wide
 * view on very wide monitors.
 *
 * @returns the view-width modifier (>= 1.0)
 */
export function viewWidthModifier(aspectRatio: number): number {
  if (aspectRatio <= WIDESCREEN_PARAMS.baselineAspect) {
    return 1.0;
  }
  // Proportional widening: at 21:9 the view is 30% wider than at 16:9.
  const ratio = aspectRatio / WIDESCREEN_PARAMS.baselineAspect;
  return Math.min(ratio, WIDESCREEN_PARAMS.maxWidescreenModifier);
}

/**
 * Compute the actual view width for a given aspect ratio.
 *
 * @returns view width in world units
 */
export function effectiveViewWidth(aspectRatio: number): number {
  return CAMERA_VIEW_WIDTH * viewWidthModifier(aspectRatio);
}