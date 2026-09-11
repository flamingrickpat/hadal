/**
 * problem — each depth band needs a distinct, desaturated palette and particle
 *   profile (request §14.3), and the scene must shorten visibility with depth
 *   without ever going pure black (request §15); solution — one pure,
 *   Node-testable function that maps a world depth to a `BandProfile` by
 *   interpolating across a small table of authored band stops.
 *
 * archetype: information-holder (pure lookup + interpolation)
 * owns: the depth → palette/visibility/particle-profile mapping: the authored
 *   band stops (`BAND_STOPS`) and `bandProfileAtDepth`, which returns a fresh
 *   interpolated `BandProfile`. The stops are the per-band placeholder
 *   families finalized in WI-07/WI-15; the shape and mechanism are final.
 * not own: the rendered meshes (gradient, beam, particles, postfx) that
 *   consume a profile — those are the render service-providers; the sim
 *   (`Simulation`) that owns the player's depth.
 * fails when: none — pure; the stops table is always bracketed by the first
 *   and last stop, so any depth resolves.
 * invariant: `visibility` and `ambient` are non-increasing with depth and
 *   `ambient` is never 0 (never pure black); the profile is deterministic in
 *   depth.
 */
import { clamp, type Vec2 } from '../util/math';

/** A depth band's rendered look (request §14.3). All values are pure data. */
export interface BandProfile {
  /** Desaturated water color at the top of the view (0..1 RGB). */
  waterTop: [number, number, number];
  /** Darker water color at the bottom of the view (0..1 RGB). */
  waterBottom: [number, number, number];
  /** Ambient floor brightness (0..1); never 0 so the scene is never pure black. */
  ambient: number;
  /** Flashlight reach in world units; shorter with depth (request §15). */
  visibility: number;
  /** Flashlight beam intensity. */
  lightIntensity: number;
  /** Restrained luminous accent (edge glow, bioluminescent motes, request §14.1). */
  accent: [number, number, number];
  /** Base particle point size; smaller with depth (request §14.3). */
  particleSize: number;
  /** Active marine-snow particle count (large, sinking, sparse). */
  snowCount: number;
  /** Active silt particle count (small, dense, follows the current). */
  siltCount: number;
  /** Active drifting-mote count (tiny, bioluminescent, sparse). */
  moteCount: number;
  /** Base particle drift speed (world units / second). */
  particleDrift: number;
  /** Dominant current direction (a unit-ish vector, request §64/§14.3). */
  currentDir: Vec2;
  /** Current strength (world units / second); stronger with depth. */
  currentSpeed: number;
  /** Chromatic-split amount (0..1, restrained, request §14.1/§35). */
  chromatic: number;
  /** Screen-space grain amount (0..1, restrained, request §14.1/§35). */
  grain: number;
}

interface BandStop extends BandProfile {
  depth: number;
}

/**
 * Authored band stops (placeholder families, request §14.3) across the full
 * 0..12000 depth range (request §4.1). The greybox world only reaches ~1620;
 * the stops below it are what the scene looks like as the macro world (WI-07)
 * and the depth range open up. Palettes darken and shift hue; visibility
 * shortens; large marine snow gives way to fine silt and motes; the current
 * strengthens. Final themes are chosen in WI-07/WI-15.
 */
export const BAND_STOPS: readonly BandStop[] = [
  {
    depth: 0,
    // Surface: the cozy baseline (request §59) — bright, clear, warm.
    // Sky gradient visible above; warm work lights at the base; simple ambient fauna.
    // This is the "relief" the player returns to after a deep dive.
    waterTop: [0.22, 0.4, 0.46],
    waterBottom: [0.1, 0.2, 0.26],
    ambient: 0.45,
    visibility: 2500,
    lightIntensity: 1.0,
    accent: [0.6, 0.88, 0.96],
    particleSize: 2.6,
    snowCount: 220,
    siltCount: 100,
    moteCount: 60,
    particleDrift: 22,
    currentDir: { x: 0.5, y: -0.2 },
    currentSpeed: 10,
    chromatic: 0.0008,
    grain: 0.04,
  },
  {
    depth: 1600,
    // Coast: transitional zone — noticeably darker than the surface but still
    // with life and clarity. The shift from bright surface to deeper darkness.
    waterTop: [0.12, 0.25, 0.32],
    waterBottom: [0.06, 0.14, 0.2],
    ambient: 0.3,
    visibility: 1200,
    lightIntensity: 1.0,
    accent: [0.55, 0.8, 0.9],
    particleSize: 2.4,
    snowCount: 190,
    siltCount: 160,
    moteCount: 90,
    particleDrift: 28,
    currentDir: { x: 0.65, y: -0.22 },
    currentSpeed: 16,
    chromatic: 0.0014,
    grain: 0.05,
  },
  {
    depth: 4000,
    waterTop: [0.03, 0.06, 0.12],
    waterBottom: [0.01, 0.02, 0.06],
    ambient: 0.14,
    visibility: 560,
    lightIntensity: 1.05,
    accent: [0.4, 0.6, 0.85],
    particleSize: 1.8,
    snowCount: 120,
    siltCount: 220,
    moteCount: 150,
    particleDrift: 40,
    currentDir: { x: 0.75, y: -0.2 },
    currentSpeed: 34,
    chromatic: 0.0022,
    grain: 0.06,
  },
  {
    depth: 7000,
    waterTop: [0.02, 0.035, 0.08],
    waterBottom: [0.005, 0.01, 0.04],
    ambient: 0.1,
    visibility: 450,
    lightIntensity: 1.1,
    accent: [0.35, 0.55, 0.8],
    particleSize: 1.5,
    snowCount: 70,
    siltCount: 240,
    moteCount: 190,
    particleDrift: 46,
    currentDir: { x: 0.8, y: -0.2 },
    currentSpeed: 48,
    chromatic: 0.003,
    grain: 0.065,
  },
  {
    depth: 10000,
    waterTop: [0.012, 0.02, 0.05],
    waterBottom: [0.002, 0.004, 0.02],
    ambient: 0.08,
    visibility: 370,
    lightIntensity: 1.15,
    accent: [0.3, 0.5, 0.75],
    particleSize: 1.2,
    snowCount: 40,
    siltCount: 200,
    moteCount: 220,
    particleDrift: 50,
    currentDir: { x: 0.85, y: -0.2 },
    currentSpeed: 58,
    chromatic: 0.0038,
    grain: 0.07,
  },
  {
    depth: 12000,
    waterTop: [0.008, 0.014, 0.038],
    waterBottom: [0.001, 0.002, 0.012],
    ambient: 0.07,
    visibility: 310,
    lightIntensity: 1.2,
    accent: [0.28, 0.45, 0.7],
    particleSize: 1.0,
    snowCount: 24,
    siltCount: 160,
    moteCount: 240,
    particleDrift: 52,
    currentDir: { x: 0.9, y: -0.2 },
    currentSpeed: 64,
    chromatic: 0.0045,
    grain: 0.075,
  },
];

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const lerp3 = (
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

/**
 * Map a world depth to a fresh interpolated `BandProfile` (request §14.3).
 * Depths before the first stop clamp to it; after the last, clamp to it.
 */
export function bandProfileAtDepth(depth: number): BandProfile {
  const stops = BAND_STOPS;
  const first = stops[0]!;
  const last = stops[stops.length - 1]!;
  if (depth <= first.depth) {
    const { depth: _d, ...profile } = first;
    return { ...profile, currentDir: { ...first.currentDir } };
  }
  if (depth >= last.depth) {
    const { depth: _d, ...profile } = last;
    return { ...profile, currentDir: { ...last.currentDir } };
  }
  let i = 0;
  while (stops[i + 1]!.depth < depth) i += 1;
  const a = stops[i]!;
  const b = stops[i + 1]!;
  const t = (depth - a.depth) / (b.depth - a.depth);
  const dirX = lerp(a.currentDir.x, b.currentDir.x, t);
  const dirY = lerp(a.currentDir.y, b.currentDir.y, t);
  const dirLen = Math.hypot(dirX, dirY);
  const norm = dirLen > 1e-9 ? 1 / dirLen : 0;
  return {
    waterTop: lerp3(a.waterTop, b.waterTop, t),
    waterBottom: lerp3(a.waterBottom, b.waterBottom, t),
    ambient: lerp(a.ambient, b.ambient, t),
    visibility: lerp(a.visibility, b.visibility, t),
    lightIntensity: lerp(a.lightIntensity, b.lightIntensity, t),
    accent: lerp3(a.accent, b.accent, t),
    particleSize: lerp(a.particleSize, b.particleSize, t),
    snowCount: lerp(a.snowCount, b.snowCount, t),
    siltCount: lerp(a.siltCount, b.siltCount, t),
    moteCount: lerp(a.moteCount, b.moteCount, t),
    particleDrift: lerp(a.particleDrift, b.particleDrift, t),
    currentDir: { x: clamp(dirX, -1, 1) * norm, y: clamp(dirY, -1, 1) * norm },
    currentSpeed: lerp(a.currentSpeed, b.currentSpeed, t),
    chromatic: lerp(a.chromatic, b.chromatic, t),
    grain: lerp(a.grain, b.grain, t),
  };
}
