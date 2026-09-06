/**
 * problem — the display refresh rate varies, but the simulation must
 *   advance at a fixed 1/60 s cadence independent of it (request §30);
 *   solution — drain a clamped real-time accumulator into fixed steps.
 *
 * archetype: service-provider
 * owns: the fixed-step accumulator drain from request §30's frame loop:
 *   how many `FIXED_DT` steps a slice of real time represents.
 * not own: the simulation itself — who runs each step, or what a step does.
 * fails when: none — pure arithmetic; a frame gap beyond `MAX_FRAME_DT`
 *   clamps the excess (no spiral of death) rather than throwing.
 * invariant: the returned leftover is always < `FIXED_DT`; the same
 *   elapsed real time yields the same step count at any refresh rate.
 */
import { FIXED_DT, MAX_FRAME_DT } from './constants';

/**
 * Drains `elapsed` real seconds (clamped to `MAX_FRAME_DT`) from
 * `accumulator` into whole `FIXED_DT` steps (request §30).
 *
 * @param elapsed real seconds since the previous frame
 * @param accumulator leftover fraction from the previous frame
 * @returns the number of steps to run and the new leftover
 */
export function stepCountSince(elapsed: number, accumulator: number): { steps: number; accumulator: number } {
  let acc = accumulator + Math.min(elapsed, MAX_FRAME_DT);
  let steps = 0;
  while (acc >= FIXED_DT) {
    acc -= FIXED_DT;
    steps += 1;
  }
  return { steps, accumulator: acc };
}
