/**
 * problem — a colossal presence crossing the background layer only reads as
 *   larger than the scene when something close also passes between the
 *   camera and the player (request §52 technique C, §35 "foreground
 *   occluder pass"); solution — a pooled render pass that holds a few large
 *   dark structures on a layer in front of the playable plane. Each
 *   occluder has a fixed reference position in the deep water; the pass
 *   places it with a >1 depth factor (the same position-transform trick
 *   `World` uses for its background layers, inverted), so as the player
 *   swims the structure crosses the view faster than the world and then
 *   clears it again — a temporary occlusion that reads as physically
 *   close and huge.
 *
 * archetype: service-provider
 * owns: the fixed pool of occluder slabs — the world-silhouette vocabulary
 *   (near-black fill + accent edge, the same family `World` uses for
 *   terrain) — their reference positions, and the per-frame depth-factor
 *   placement.
 * not own: the simulation (its camera center is a read-only input), the
 *   depth-band palette, or any creature visual.
 * fails when: none — a fixed pool with deterministic placement; nothing
 *   throws at runtime.
 * invariant: the pool size and geometries are built once in the
 *   constructor; per frame only the slabs' transforms change (request §34:
 *   no per-frame allocation in the hot path); an occluder is in the view
 *   only while the camera is near its reference position, so the
 *   occlusion is temporary by construction.
 */
import * as THREE from 'three';
import { createRng } from '../util/rng';
import type { Vec2 } from '../util/math';

/** In front of the player plane (10) and the beam (12): crosses the view. */
export const FOREGROUND_OCCLUDER_Z = 14;
/**
 * The pass's depth factor: 1 is the world plane, >1 is closer to the
 * camera. The occluder's screen offset moves at this multiple of the
 * camera's motion, faster than everything on the world plane.
 */
export const FOREGROUND_OCCLUDER_DEPTH = 1.4;

const SLAB_FILL = 0x0c1016; // the same near-black silhouette fill as `World` / `makeFoundPanel`
const SLAB_EDGE = 0x2f4a66; // the same accent edge the world silhouettes use

// Reference positions in the deep water column (bands 3-5), where the
// colossal presences cross: an occluder is in the view only while the
// camera is within roughly a view-width of its reference, so the pass
// gives occasional temporary occlusions, not a permanent smudge. One
// sits on the hadal crossing lane so the background flank is glimpsed
// through it (the crossing's private staging).
const SLAB_REFERENCES: [number, number][] = [
  [13500, -6400],
  [14900, -5200],
  [17400, -5900],
  [19800, -6800],
  [15900, -7600],
  [18500, -8400],
  [16600, -9100],
  [17000, -9300],
  [19600, -9700],
  [21000, -8500],
];

interface SlabRec {
  group: THREE.Group;
  qx: number;
  qy: number;
}

function hashSeed(i: number): number {
  let h = 2166136261 ^ (i * 0x9e3779b1);
  h = Math.imul(h ^ (h >>> 13), 16777619);
  return (h ^ (h >>> 16)) >>> 0;
}

export class ForegroundPass {
  /** The pooled occluder slabs (read-only surface for tests and debug views). */
  readonly slabs: THREE.Group[] = [];
  private readonly recs: SlabRec[] = [];
  private readonly fillMat: THREE.MeshBasicMaterial;
  private readonly edgeMat: THREE.LineBasicMaterial;

  constructor(scene: THREE.Scene) {
    this.fillMat = new THREE.MeshBasicMaterial({ color: SLAB_FILL });
    this.edgeMat = new THREE.LineBasicMaterial({ color: SLAB_EDGE });
    for (let i = 0; i < SLAB_REFERENCES.length; i += 1) {
      const [qx, qy] = SLAB_REFERENCES[i]!;
      const rng = createRng(hashSeed(i));
      const w = 300 + rng() * 300; // 300-600 world units wide
      const h = 180 + rng() * 200; // 180-380 tall
      const group = this.buildSlab(w, h, rng, scene);
      this.slabs.push(group);
      this.recs.push({ group, qx, qy });
    }
  }

  /**
   * Place every occluder for this frame: the reference position pulled
   * toward the camera by the depth factor, so its screen offset moves at
   * `FOREGROUND_OCCLUDER_DEPTH` times the camera's motion.
   */
  update(center: Vec2): void {
    const pull = 1 - FOREGROUND_OCCLUDER_DEPTH;
    for (const r of this.recs) {
      r.group.position.x = r.qx * FOREGROUND_OCCLUDER_DEPTH + center.x * pull;
      r.group.position.y = r.qy * FOREGROUND_OCCLUDER_DEPTH + center.y * pull;
    }
  }

  /** Remove the pool and free its geometries and materials. */
  dispose(): void {
    for (const r of this.recs) {
      for (const child of r.group.children) {
        const obj = child as THREE.Mesh;
        if (obj.geometry !== undefined) obj.geometry.dispose();
      }
      r.group.removeFromParent();
    }
    this.slabs.length = 0;
    this.recs.length = 0;
    this.fillMat.dispose();
    this.edgeMat.dispose();
  }

  /** One irregular dark slab (jittered hexagon) with the accent edge. */
  private buildSlab(w: number, h: number, rng: () => number, scene: THREE.Scene): THREE.Group {
    const hw = w / 2;
    const hh = h / 2;
    const pts: THREE.Vector3[] = [];
    const add = (x: number, y: number): void => {
      pts.push(new THREE.Vector3(x, y, 0));
    };
    add(-hw, -hh * (0.6 + 0.4 * rng()));
    add(-hw * (0.2 + 0.4 * rng()), -hh);
    add(hw * (0.2 + 0.5 * rng()), -hh);
    add(hw, -hh * (0.3 + 0.4 * rng()));
    add(hw * (0.4 + 0.4 * rng()), hh * (0.6 + 0.4 * rng()));
    add(-hw * (0.3 + 0.5 * rng()), hh * (0.7 + 0.3 * rng()));
    const group = new THREE.Group();
    group.position.z = FOREGROUND_OCCLUDER_Z;
    group.renderOrder = 8;
    const shape = new THREE.Shape(pts.map((p) => new THREE.Vector2(p.x, p.y)));
    const fill = new THREE.Mesh(new THREE.ShapeGeometry(shape), this.fillMat);
    group.add(fill);
    const edge = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), this.edgeMat);
    group.add(edge);
    scene.add(group);
    return group;
  }
}
