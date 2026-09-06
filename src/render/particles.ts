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
import type { Vec2 } from '../util/math';
import { createRng } from '../util/rng';
import type { BandProfile } from './band';

/** A pure, pooled particle type: a fixed buffer plus per-type tuning. */
export interface ParticleType {
  name: 'snow' | 'silt' | 'motes';
  /** Fixed interleaved x/y/z buffer (`count * 3`); stepped in place. */
  positions: Float32Array;
  /** Per-particle phase seed for the drift bob (no per-frame allocation). */
  seeds: Float32Array;
  /** Active particle count (draw-range); tracked to the per-band profile. */
  count: number;
  /** Base downward-drift factor for this type (snow sinks more than motes). */
  sink: number;
  /** Fixed z layer (visual only, request §13). */
  z: number;
}

/**
 * Advance one particle type in place (request §34): base downward drift plus
 * the local current, with a small per-particle bob, then wrap around the
 * (camera-anchored) view box so the field always fills the view. Pure — reads
 * `state`, writes `type.positions`, allocates nothing.
 */
export function stepParticleType(
  type: ParticleType,
  state: { center: Vec2; half: Vec2; time: number },
  dt: number,
  profile: BandProfile,
): void {
  const { center, half, time } = state;
  const curX = profile.currentDir.x * profile.currentSpeed;
  const curY = profile.currentDir.y * profile.currentSpeed;
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
    const vx = curX + Math.sin(phase) * sinkAmp * 0.25;
    const vy = -type.sink * profile.particleDrift * 0.4 + curY + Math.cos(phase) * sinkAmp * 0.15;
    let px = pos[i * 3]! + vx * dt;
    let py = pos[i * 3 + 1]! + vy * dt;
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
  const type: ParticleType = { name: 'snow', positions, seeds, count: max, sink, z };
  return { type, points, mat, sizeFactor, tracksAccent };
}

/**
 * Pooled particle field: three fixed `THREE.Points` layers (marine snow, silt,
 * motes) stepped in place each frame (request §34). The draw-range and size
 * track the per-band profile (request §14.3); the buffers are never
 * re-allocated.
 */
export class ParticleField {
  private readonly layers: ParticleLayer[];
  private time = 0;

  constructor(scene: THREE.Scene) {
    const box = 1200; // half-extent of the initial placement / wrap box
    this.layers = [
      makeLayer(scene, 101, MAX_SNOW, 1.0, 4, 1.6, [0.85, 0.88, 0.9], false, box),
      makeLayer(scene, 202, MAX_SILT, 0.5, 5, 1.0, [0.55, 0.58, 0.62], false, box),
      makeLayer(scene, 303, MAX_MOTES, 0.3, 6, 0.9, [0.4, 0.6, 0.85], true, box),
    ];
  }

  update(dt: number, center: Vec2, half: Vec2, profile: BandProfile): void {
    this.time += dt;
    const state = { center, half, time: this.time };
    const counts = [profile.snowCount, profile.siltCount, profile.moteCount];
    for (let i = 0; i < this.layers.length; i += 1) {
      const layer = this.layers[i]!;
      layer.type.count = Math.max(0, Math.min(Math.round(counts[i]!), layer.type.positions.length / 3));
      stepParticleType(layer.type, state, dt, profile);
      const attr = layer.points.geometry.getAttribute('position') as THREE.BufferAttribute;
      attr.needsUpdate = true;
      layer.points.geometry.setDrawRange(0, layer.type.count);
      layer.mat.size = profile.particleSize * layer.sizeFactor;
      if (layer.tracksAccent) layer.mat.color.setRGB(profile.accent[0], profile.accent[1], profile.accent[2]);
    }
  }

  dispose(): void {
    for (const layer of this.layers) {
      layer.points.geometry.dispose();
      layer.mat.dispose();
    }
  }
}
