/**
 * problem — the scene needs pooled, reused marine-snow / silt / mote particles
 *   that drift through the water, follow the local current, and change profile
 *   with depth, without allocating anything per frame (request §34/§35/§64);
 *   solution — a fixed-size particle buffer stepped in place by a pure
 *   function, drawn as a small set of pooled `THREE.Points` layers.
 *
 * archetype: service-provider (owns the particle pooling)
 * owns: the pooled particle buffers (a fixed `Float32Array` per type) and the
 *   in-place `stepParticleType` advance (drift + current, wrap around the
 *   moving view box). `ParticleField` draws those buffers as three
 *   non-reallocated `THREE.Points` layers whose draw-range tracks the
 *   per-band profile.
 * not own: the depth → profile mapping (`band`), the camera center the view
 *   box is anchored to (the `Renderer`), or the collision world.
 * fails when: none — the buffers are fixed-size and only ever rewritten;
 *   `drawRange` is clamped to the buffer length.
 * invariant: the three position buffers are allocated once in the
 *   constructor and never re-created; per frame only their contents and the
 *   draw-range change (no per-frame allocation, request §34).
 */
import * as THREE from 'three';
import { vec2, type Vec2 } from '../util/math';
import { createRng } from '../util/rng';
import type { BandProfile } from './band';
import { juiceBubblesProfile, juiceSiltProfile } from './juice';

/** A pure, pooled particle type: a fixed buffer plus per-type tuning. */
export interface ParticleType {
  name: 'snow' | 'silt' | 'motes' | 'bubbles' | 'siltJuice';
  /** Fixed interleaved x/y/z buffer (`count * 3`); stepped in place. */
  positions: Float32Array;
  /** Per-particle phase seed for the drift bob (no per-frame allocation). */
  seeds: Float32Array;
  /** Active particle count (draw-range); tracked to the per-band profile. */
  count: number;
  /** Base downward-drift factor for this type (snow sinks more than motes). */
  sink: number;
  /** Upward rise factor (bubbles rise instead of sink). */
  rise: number;
  /** Fixed z layer (visual only, request §13). */
  z: number;
}

/**
 * Advance one particle type in place (request §34): base downward drift plus
 * the local current, with a small per-particle bob, then wrap around the
 * (camera-anchored) view box so the field always fills the view. Pure — reads
 * `state`, writes `type.positions`, allocates nothing.
 *
 * The local current comes from `currentAt(pos, time)` when supplied (the
 * `CurrentSystem`'s `velocityAt`, request §64 — particles follow the same field
 * that moves the player); otherwise it falls back to the per-band profile
 * current (`profile.currentDir * currentSpeed`), the greybox behaviour.
 */
// Shared temp objects for the particle step loop (request §34: no per-frame allocation).
const tempPos = { x: 0, y: 0 };
const tempVel = { x: 0, y: 0 };

export function stepParticleType(
  type: ParticleType,
  state: { center: Vec2; half: Vec2; time: number },
  dt: number,
  profile: BandProfile,
  currentAt?: (pos: Vec2, time: number) => Vec2,
): void {
  const { center, half, time } = state;
  const useField = currentAt !== undefined;
  const profileCurX = profile.currentDir.x * profile.currentSpeed;
  const profileCurY = profile.currentDir.y * profile.currentSpeed;
  const pos = type.positions;
  const seeds = type.seeds;
  const n = type.count;
  const boxW = half.x * 2;
  const boxH = half.y * 2;
  const minX = center.x - half.x;
  const minY = center.y - half.y;
  const sinkAmp = type.sink;
  for (let i = 0; i < n; i += 1) {
    const s = seeds[i]!;
    const phase = time * 0.6 + s * 6.28318;
    const px0 = pos[i * 3]!;
    const py0 = pos[i * 3 + 1]!;
    let curX = profileCurX;
    let curY = profileCurY;
    if (useField) {
      tempPos.x = px0;
      tempPos.y = py0;
      currentAt!(tempPos, time, tempVel);
      curX = tempVel.x;
      curY = tempVel.y;
    }
    const vx = curX + Math.sin(phase) * sinkAmp * 0.25;
    const vy =
      -type.sink * profile.particleDrift * 0.4 +
      type.rise * profile.particleDrift * 0.5 +
      curY +
      Math.cos(phase) * sinkAmp * 0.15;
    let px = px0 + vx * dt;
    let py = py0 + vy * dt;
    px = minX + ((((px - minX) % boxW) + boxW) % boxW);
    py = minY + ((((py - minY) % boxH) + boxH) % boxH);
    pos[i * 3] = px;
    pos[i * 3 + 1] = py;
  }
}

// Fixed per-type buffer sizes (the max across all depth bands, request §34).
const MAX_SNOW = 240;
const MAX_SILT = 260;
const MAX_MOTES = 260;
// Juice particle buffer sizes (section 48).
const MAX_BUBBLES = 100;
const MAX_SILT_JUICE = 200;

interface ParticleLayer {
  type: ParticleType;
  points: THREE.Points;
  mat: THREE.PointsMaterial;
  sizeFactor: number;
  tracksAccent: boolean;
}

function makeLayer(
  scene: THREE.Scene,
  seed: number,
  max: number,
  sink: number,
  rise: number,
  z: number,
  sizeFactor: number,
  color: [number, number, number],
  tracksAccent: boolean,
  box: number,
): ParticleLayer {
  const positions = new Float32Array(max * 3);
  const seeds = new Float32Array(max);
  const rng = createRng(seed);
  for (let i = 0; i < max; i += 1) {
    positions[i * 3] = (rng() * 2 - 1) * box;
    positions[i * 3 + 1] = (rng() * 2 - 1) * box;
    positions[i * 3 + 2] = z;
    seeds[i] = rng();
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: new THREE.Color(color[0], color[1], color[2]),
    size: 2,
    sizeAttenuation: false,
    transparent: true,
    depthWrite: false,
  });
  const points = new THREE.Points(geometry, mat);
  points.frustumCulled = false; // the buffer spans the whole view; do not cull it away
  scene.add(points);
  const type: ParticleType = { name: 'snow', positions, seeds, count: max, sink, rise, z };
  return { type, points, mat, sizeFactor, tracksAccent };
}

/**
 * Pooled particle field: five fixed `THREE.Points` layers (marine snow, silt,
 * motes, bubbles, silt juice) stepped in place each frame (request §34). The
 * draw-range and size track the per-band profile (request §14.3) and the juice
 * emission tables (section 48); the buffers are never re-allocated.
 */
export class ParticleField {
  private readonly layers: ParticleLayer[];
  private time = 0;

  constructor(scene: THREE.Scene) {
    const box = 1200; // half-extent of the initial placement / wrap box
    this.layers = [
      // Ambient layers (existing)
      makeLayer(scene, 101, MAX_SNOW, 1.0, 0, 4, 1.6, [0.85, 0.88, 0.9], false, box),
      makeLayer(scene, 202, MAX_SILT, 0.5, 0, 5, 1.0, [0.55, 0.58, 0.62], false, box),
      makeLayer(scene, 303, MAX_MOTES, 0.3, 0, 6, 0.9, [0.4, 0.6, 0.85], true, box),
      // Juice layers (section 48)
      makeLayer(scene, 404, MAX_BUBBLES, 0, 1.0, 7, 1.2, [0.9, 0.95, 1.0], false, box),
      makeLayer(scene, 505, MAX_SILT_JUICE, 0.8, 0, 3, 1.1, [0.7, 0.65, 0.55], false, box),
    ];
  }

  update(
    dt: number,
    center: Vec2,
    half: Vec2,
    profile: BandProfile,
    depth: number,
    currentAt?: (pos: Vec2, time: number) => Vec2,
    ambientScale: number = 1,
  ): void {
    this.time += dt;
    const state = { center, half, time: this.time };

    // Compute per-band juice emission profiles
    const bubbleProfile = juiceBubblesProfile(depth);
    const siltJuiceProfile = juiceSiltProfile(depth);

    // Per-type counts: ambient layers use band profile, juice layers use emission tables
    const ambientCounts = [profile.snowCount, profile.siltCount, profile.moteCount];
    const juiceCounts = [bubbleProfile.count, siltJuiceProfile.count];

    for (let i = 0; i < this.layers.length; i += 1) {
      const layer = this.layers[i]!;
      let target: number;

      if (ambientScale <= 0) {
        target = 0;
      } else if (i < 3) {
        // Ambient layers: use band profile counts
        target = Math.round(ambientCounts[i]! * ambientScale);
      } else {
        // Juice layers: use emission table counts, scaled by ambient
        const juiceIndex = i - 3;
        target = Math.round(juiceCounts[juiceIndex]! * ambientScale);
      }

      layer.type.count = Math.max(0, Math.min(target, layer.type.positions.length / 3));
      stepParticleType(layer.type, state, dt, profile, currentAt);
      const attr = layer.points.geometry.getAttribute('position') as THREE.BufferAttribute;
      attr.needsUpdate = true;
      layer.points.geometry.setDrawRange(0, layer.type.count);

      // Juice layers use their own size from the emission profile
      if (i === 3) {
        // Bubbles
        layer.mat.size = bubbleProfile.size;
        layer.mat.opacity = bubbleProfile.opacity;
      } else if (i === 4) {
        // Silt juice
        layer.mat.size = siltJuiceProfile.size;
        layer.mat.opacity = siltJuiceProfile.opacity;
      } else {
        // Ambient layers use band profile size
        layer.mat.size = profile.particleSize * layer.sizeFactor;
        if (layer.tracksAccent) layer.mat.color.setRGB(profile.accent[0], profile.accent[1], profile.accent[2]);
      }
    }
  }

  dispose(): void {
    for (const layer of this.layers) {
      layer.points.geometry.dispose();
      layer.mat.dispose();
    }
  }
}
