/**
 * problem — request §16 demands a single low-frequency screen shake path that
 *   all shake sources emit through, with an amplitude budget, and a presentation
 *   flag WI-06g's accessibility toggle will flip; solution — one central shake
 *   accumulator with a simple low-pass filter (only low-frequency oscillations
 *   pass), per-event amplitude budget enforcement, and an enable flag that
 *   suppresses all shake when off.
 *
 * archetype: service-provider
 * owns: the shake accumulator state (amplitude, frequency, time), the low-pass
 *   filter, the amplitude budget enforcement, and the presentation flag.
 * not own: which shake sources trigger (WI-06d-b4's distant-motion impulse and
 *   any future sources call `emitShake`), the camera offset computation
 *   (Renderer.ts reads `getShakeOffset`), or the accessibility UI (WI-06g).
 * fails when: none — a pure state machine with bounded values.
 * invariant: the per-event and accumulated shake never exceeds
 *   `SHAKE_AMPLITUDE_BUDGET`; when the flag is off, `getShakeOffset` always
 *   returns zero regardless of emitted events.
 */
import { vec2, type Vec2 } from '../util/math';

/**
 * Section 16 amplitude budget: no individual shake event or accumulated shake
 * exceeds this limit (world units).
 */
export const SHAKE_AMPLITUDE_BUDGET = 20;

/**
 * Low-frequency gate threshold (Hz). Oscillations below this frequency pass
 * through; higher frequencies are attenuated by the low-pass filter.
 */
export const SHAKE_MAX_FREQ_HZ = 3;

/**
 * Decay time for shake amplitude (seconds). Shake naturally fades after this
 * duration, even without being re-triggered.
 */
const DECAY_TIME = 0.5;

let shakeEnabled = true;
let amplitude = 0;
let frequency = 0;
let phase = 0;
let lastTime = 0;

/** Set the presentation flag (WI-06g's screen shake toggle will flip this). */
export function setShakeEnabled(enabled: boolean): void {
  shakeEnabled = enabled;
}

/** Read the presentation flag. */
export function isShakeEnabled(): boolean {
  return shakeEnabled;
}

/**
 * Emit a shake event through the single gated path.
 *
 * All shake sources (including the distant-motion impulse from WI-06d-b4) must
 * call this function rather than applying camera offset directly. The amplitude
 * is automatically capped to the section 16 budget; high-frequency oscillations
 * are attenuated by the low-pass filter.
 */
export function emitShake(eventAmplitude: number, eventFrequency: number): void {
  // Per-event amplitude budget: cap the incoming amplitude
  amplitude = Math.min(eventAmplitude, SHAKE_AMPLITUDE_BUDGET);
  frequency = eventFrequency;
  lastTime = 0;
}

/**
 * Update the shake state each frame.
 *
 * Applies the low-pass filter, accumulates phase, decays the amplitude over
 * time, and enforces the amplitude budget on the accumulated shake.
 */
export function updateShake(dt: number): void {
  if (frequency === 0) return;

  lastTime += dt;

  // Decay the amplitude over time (shake naturally fades)
  const decayFactor = Math.exp(-dt / DECAY_TIME);
  amplitude *= decayFactor;

  // Accumulate phase for the oscillation
  phase += 2 * Math.PI * frequency * dt;
}

/**
 * Apply the low-pass filter and amplitude budget to an amplitude value.
 */
function applyFilter(amplitude: number, frequency: number): number {
  // Low-pass filter: attenuate frequencies above SHAKE_MAX_FREQ_HZ
  // Filter gain = 1 / sqrt(1 + (f / fc)^8), where fc is the cutoff frequency
  // The ^8 gives a steep rolloff that effectively blocks high-frequency jitter
  // while passing low-frequency oscillations.
  const ratio = frequency / SHAKE_MAX_FREQ_HZ;
  const filterGain = 1 / Math.sqrt(1 + Math.pow(ratio, 8));
  const filtered = amplitude * filterGain;
  return Math.min(filtered, SHAKE_AMPLITUDE_BUDGET);
}

/**
 * Get the current shake offset.
 *
 * Returns the oscillating offset to add to the camera position. When the
 * presentation flag is off, always returns zero regardless of emitted events.
 */
export function getShakeOffset(): Vec2 {
  if (!shakeEnabled) {
    return vec2(0, 0);
  }

  // Apply the low-pass filter and amplitude budget
  const clampedAmplitude = applyFilter(amplitude, frequency);

  // Oscillate the camera (low-frequency sine wave)
  const x = clampedAmplitude * Math.sin(phase);
  const y = clampedAmplitude * Math.cos(phase) * 0.5; // Slightly less vertical shake

  return vec2(x, y);
}

/** Reset all shake state (for tests). */
export function resetShake(): void {
  shakeEnabled = true;
  amplitude = 0;
  frequency = 0;
  phase = 0;
  lastTime = 0;
}