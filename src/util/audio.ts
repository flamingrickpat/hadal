/**
 * problem — the ambient soundscape must change with depth (high frequencies
 *   fall off, low pressure rumble rises, reverb/delay character shifts, the
 *   music recedes) and event sounds must be placed by world position
 *   (request §27, §14.3); solution — a pure, Node-testable depth -> audio
 *   mapping (mirroring the visual band stops) plus pure distance/pan mappings,
 *   so the WebAudio service-provider (`AudioSystem`) is driven by
 *   deterministic data, not inline WebAudio guesses.
 *
 * archetype: information-holder (pure lookup + interpolation)
 * owns: the depth -> `AudioProfile` mapping (the authored `AUDIO_STOPS` and
 *   `audioProfileAtDepth`) and the pure event-sound mappings
 *   (`distanceGain`, `worldPan`).
 * not own: the `AudioContext` or any WebAudio node — those are the
 *   `AudioSystem` service-provider's; the *visual* band stops (`band.ts`).
 * fails when: none — pure; the stops are bracketed by the first and last so
 *   any depth resolves.
 * invariant: `AUDIO_STOPS` depth positions mirror `band.ts` `BAND_STOPS`
 *   depths (0/1600/4000/7000/10000/12000); `highCutoff`, `lowRumble`, and
 *   `reverb` are monotonic in depth and `drone` is anti-monotonic; `gain`
 *   and `pan` are bounded.
 */
import { clamp } from './math';

/** A depth band's rendered-soundscape parameters (request §27, §58). Pure data. */
export interface AudioProfile {
  /** The world depth this profile applies to. */
  depth: number;
  /** Global high-frequency roll-off in Hz; falls with depth (the water muffs). */
  highCutoff: number;
  /** Low-frequency pressure-rumble level (0..1); rises with depth. */
  lowRumble: number;
  /** Deep filtered ocean-bed level (0..1); deepens with depth. */
  oceanBed: number;
  /** Current-rumble level (0..1); grows with depth. */
  currentRumble: number;
  /** Subtle hull/equipment level (0..1); fades with depth (further from base). */
  hull: number;
  /** Reverb/delay character (0..1); more distant and spaced with depth. */
  reverb: number;
  /** Sparse procedural drone/music-bed level (0..1); recedes with depth. */
  drone: number;
  /** Breathing level (0..1). */
  breathing: number;
}

/**
 * Authored audio band stops across the full 0..12000 range (request §4.1).
 * The depth positions mirror `band.ts` `BAND_STOPS` so the audio bands line up
 * with the visual bands (request §14.3); the levels are the placeholder family
 * finalized in WI-15.
 */
export const AUDIO_STOPS: readonly AudioProfile[] = [
  { depth: 0, highCutoff: 16000, lowRumble: 0.15, oceanBed: 0.35, currentRumble: 0.3, hull: 0.4, reverb: 0.15, drone: 0.45, breathing: 0.5 },
  { depth: 1600, highCutoff: 11000, lowRumble: 0.35, oceanBed: 0.45, currentRumble: 0.5, hull: 0.28, reverb: 0.35, drone: 0.34, breathing: 0.55 },
  { depth: 4000, highCutoff: 6500, lowRumble: 0.6, oceanBed: 0.55, currentRumble: 0.7, hull: 0.18, reverb: 0.55, drone: 0.22, breathing: 0.6 },
  { depth: 7000, highCutoff: 4000, lowRumble: 0.8, oceanBed: 0.6, currentRumble: 0.85, hull: 0.12, reverb: 0.75, drone: 0.13, breathing: 0.65 },
  { depth: 10000, highCutoff: 2600, lowRumble: 0.92, oceanBed: 0.65, currentRumble: 0.95, hull: 0.08, reverb: 0.88, drone: 0.07, breathing: 0.7 },
  { depth: 12000, highCutoff: 1900, lowRumble: 1.0, oceanBed: 0.7, currentRumble: 1.0, hull: 0.06, reverb: 1.0, drone: 0.04, breathing: 0.75 },
];

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/**
 * Map a world depth to a fresh interpolated `AudioProfile` (request §27).
 * Depths before the first stop clamp to it; after the last, clamp to it.
 */
export function audioProfileAtDepth(depth: number): AudioProfile {
  const stops = AUDIO_STOPS;
  const first = stops[0]!;
  const last = stops[stops.length - 1]!;
  if (depth <= first.depth) return { ...first };
  if (depth >= last.depth) return { ...last };
  let i = 0;
  while (stops[i + 1]!.depth < depth) i += 1;
  const a = stops[i]!;
  const b = stops[i + 1]!;
  const t = (depth - a.depth) / (b.depth - a.depth);
  return {
    depth,
    highCutoff: lerp(a.highCutoff, b.highCutoff, t),
    lowRumble: lerp(a.lowRumble, b.lowRumble, t),
    oceanBed: lerp(a.oceanBed, b.oceanBed, t),
    currentRumble: lerp(a.currentRumble, b.currentRumble, t),
    hull: lerp(a.hull, b.hull, t),
    reverb: lerp(a.reverb, b.reverb, t),
    drone: lerp(a.drone, b.drone, t),
    breathing: lerp(a.breathing, b.breathing, t),
  };
}

/**
 * A distant event's gain by its world distance (request §27). 1 at the
 * listener, ~0.25 at `refDistance`, -> 0 as the distance grows. Bounded [0, 1].
 */
export function distanceGain(distance: number, refDistance = 1200, falloff = 2): number {
  const d = Math.max(0, distance);
  return clamp(Math.pow(refDistance / (refDistance + d), falloff), 0, 1);
}

/**
 * An event's stereo pan from its world `x` relative to the listener
 * (request §27). 0 at the listener, negative to the left, positive to the
 * right; `spread` is the world distance for a full (-1..1) pan. Bounded
 * [-1, 1].
 */
export function worldPan(worldX: number, listenerX: number, spread = 1200): number {
  return clamp((worldX - listenerX) / spread, -1, 1);
}
