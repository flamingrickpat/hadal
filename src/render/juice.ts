/**
 * problem — the section 48 juice particle effects (bubbles, silt) need
 *   per-band tuning so each depth band has its own emission character;
 *   solution — a pure data table of per-band bubble/silt juice emission
 *   profiles that the particle field consumes, analogous to the band
 *   palette table in band.ts.
 *
 * archetype: information-holder (pure lookup + interpolation)
 * owns: the per-band bubble and silt juice emission profiles and the
 *   depth → profile mapping (`juiceBubblesProfile`, `juiceSiltProfile`).
 * not own: the actual particle buffers or the rendering pipeline; the
 *   particle field (particles.ts) consumes these profiles.
 * fails when: none — pure data lookup with interpolation; clamped to the
 *   first/last stop like band profiles.
 * invariant: emission counts and sizes are monotonically decreasing/increasing
 *   with depth in the expected direction (fewer, smaller bubbles deeper;
 *   more, larger silt particles deeper).
 */
import { clamp, type Vec2 } from '../util/math';

/** Per-band bubble juice emission profile (section 48). */
export interface BubbleProfile {
  /** Active bubble particle count (draw range). */
  count: number;
  /** Bubble point size in pixels (smaller at depth). */
  size: number;
  /** Upward rise factor (higher = faster rise; decreases with depth). */
  riseSpeed: number;
  /** Bubble opacity (higher = more visible; decreases with depth). */
  opacity: number;
}

/** Per-band silt juice emission profile (section 48). */
export interface SiltJuiceProfile {
  /** Active silt juice particle count (draw range). */
  count: number;
  /** Silt particle size in pixels (slightly larger at depth). */
  size: number;
  /** Silt particle opacity (higher = more visible; increases with depth). */
  opacity: number;
}

interface BubbleStop {
  depth: number;
  profile: BubbleProfile;
}

interface SiltStop {
  depth: number;
  profile: SiltJuiceProfile;
}

// Per-band bubble emission table (section 48 juice effects).
// Bubbles are more numerous and larger near the surface, decreasing with depth.
const BUBBLE_STOPS: readonly BubbleStop[] = [
  { depth: 0, profile: { count: 80, size: 1.5, riseSpeed: 1.0, opacity: 0.6 } },
  { depth: 1600, profile: { count: 50, size: 1.2, riseSpeed: 0.8, opacity: 0.5 } },
  { depth: 4000, profile: { count: 30, size: 1.0, riseSpeed: 0.6, opacity: 0.4 } },
  { depth: 7000, profile: { count: 15, size: 0.8, riseSpeed: 0.4, opacity: 0.3 } },
  { depth: 10000, profile: { count: 8, size: 0.6, riseSpeed: 0.3, opacity: 0.25 } },
  { depth: 12000, profile: { count: 4, size: 0.5, riseSpeed: 0.2, opacity: 0.2 } },
];

// Per-band silt juice emission table (section 48 juice effects).
// Silt is more active at greater depths where sediment is disturbed.
const SILT_STOPS: readonly SiltStop[] = [
  { depth: 0, profile: { count: 30, size: 0.8, opacity: 0.4 } },
  { depth: 1600, profile: { count: 60, size: 0.9, opacity: 0.45 } },
  { depth: 4000, profile: { count: 100, size: 1.0, opacity: 0.5 } },
  { depth: 7000, profile: { count: 140, size: 1.1, opacity: 0.55 } },
  { depth: 10000, profile: { count: 160, size: 1.2, opacity: 0.6 } },
  { depth: 12000, profile: { count: 180, size: 1.3, opacity: 0.65 } },
];

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

function interpolateStops<T>(
  stops: readonly { depth: number; profile: T }[],
  depth: number,
  fields: (keyof T)[],
): T {
  const first = stops[0]!;
  const last = stops[stops.length - 1]!;
  if (depth <= first.depth) {
    return { ...first.profile };
  }
  if (depth >= last.depth) {
    return { ...last.profile };
  }
  let i = 0;
  while (stops[i + 1]!.depth < depth) i += 1;
  const a = stops[i]!.profile;
  const b = stops[i + 1]!.profile;
  const t = (depth - stops[i]!.depth) / (stops[i + 1]!.depth - stops[i]!.depth);
  const result = { ...a };
  for (const field of fields) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (result as any)[field] = lerp((a as any)[field], (b as any)[field], t);
  }
  return result;
}

/**
 * Look up the bubble juice emission profile at a given depth.
 * Interpolates between the nearest stops.
 */
export function juiceBubblesProfile(depth: number): BubbleProfile {
  return interpolateStops(BUBBLE_STOPS, depth, ['count', 'size', 'riseSpeed', 'opacity']);
}

/**
 * Look up the silt juice emission profile at a given depth.
 * Interpolates between the nearest stops.
 */
export function juiceSiltProfile(depth: number): SiltJuiceProfile {
  return interpolateStops(SILT_STOPS, depth, ['count', 'size', 'opacity']);
}