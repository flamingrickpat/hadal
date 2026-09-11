/**
 * holds — the distant-motion impulse presentation flag (request §48).
 *
 * archetype: information-holder
 * owns: the impulse trigger evaluation (motion + distance → should trigger?),
 *   the active impulse offset with exponential decay, and the trigger duration
 *   flag WI-06d-c's low-frequency shake path will gate on.
 * not own: the camera follow path (Renderer.ts applies the offset), the
 *   trigger source (the simulation reports distant large motion), or the
 *   a11y reduced-flashing toggle (a single boolean suppresses the nudge).
 * invariant: the impulse offset decays to zero within IMPULSE_DECAY_TIME
 *   seconds; the flag is set for the trigger duration and cleared when the
 *   decay completes.
 * fails when: none — a single decaying value with no allocation.
 */
import { vec2, type Vec2 } from '../util/math';
import { IMPULSE_DECAY_TIME, IMPULSE_MOTION_THRESHOLD, IMPULSE_NUDGE_AMPLITUDE, IMPULSE_TRIGGER_DISTANCE } from './impulseParams';

let active = false;
let elapsed = 0;

/**
 * Evaluate whether distant large motion should trigger an impulse.
 *
 * @param motion The motion metric: velocity * bodyExtent. Above the
 *   threshold, the motion is large enough.
 * @param distance The distance from the camera. Beyond the trigger
 *   distance, the motion is distant enough.
 * @returns true if this motion triggers an impulse.
 */
export function shouldTriggerImpulse(motion: number, distance: number): boolean {
  if (motion >= IMPULSE_MOTION_THRESHOLD && distance >= IMPULSE_TRIGGER_DISTANCE) {
    active = true;
    elapsed = 0;
    return true;
  }
  return false;
}

/**
 * Decay the impulse over time.
 *
 * @param dt Time step in seconds.
 */
export function applyImpulseDecay(dt: number): void {
  if (!active) return;
  elapsed += dt;
  if (elapsed >= IMPULSE_DECAY_TIME) {
    active = false;
    elapsed = 0;
  }
}

/**
 * Get the current impulse offset.
 *
 * @returns The offset Vec2 to add to the camera position, or null if
 *   the impulse is not active.
 */
export function getImpulseOffset(): Vec2 | null {
  if (!active) return null;
  // Exponential decay: starts at full amplitude, fades to zero
  const factor = Math.max(0, 1 - elapsed / IMPULSE_DECAY_TIME);
  // Apply a small random direction on first trigger (for variety)
  // but keep it deterministic per trigger (use elapsed as seed)
  const angle = Math.sin(elapsed * 1000) * Math.PI; // deterministic per trigger
  return vec2(
    IMPULSE_NUDGE_AMPLITUDE * Math.cos(angle) * factor,
    IMPULSE_NUDGE_AMPLITUDE * Math.sin(angle) * factor,
  );
}

/**
 * Check if the impulse is currently active (for WI-06d-c's shake gate).
 *
 * @returns true if the impulse flag is set.
 */
export function isImpulseActive(): boolean {
  return active;
}

/**
 * Reset the impulse state (for tests).
 */
export function resetImpulse(): void {
  active = false;
  elapsed = 0;
}
