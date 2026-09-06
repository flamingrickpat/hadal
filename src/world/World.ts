/**
 * assembles — the greybox world chunks into scene meshes and collision terrain.
 *
 * archetype: service-provider
 * owns: the terrain silhouette meshes (near-black fill + accent edge + a sparse
 *   decorative rim, request §17) added to the scene at z = 0..1.05; two
 *   background parallax silhouette layers (z = -25 and -40) that are rendered
 *   but never collide and move at different rates (request §17); and the
 *   collision `Terrain` built from the same chunk data. Rendered geometry
 *   follows each shape's `visual` points (falling back to the collision
 *   points); collision never reads the visuals (request §31). `updatePalette`
 *   re-tints the silhouettes to the current depth band (request §14.3);
 *   `updateParallax` repositions the background layers each frame.
 * not own: the chunk data (`worldData`), the camera, the depth → profile
 *   mapping (`band`), or the collision resolution (`terrain`).
 * invariant: every terrain shape gets exactly one fill mesh, one accent edge
 *   loop, and one sparse decorative rim at z = 0..1.05, below the player
 *   (z = 10); the background parallax layers have no collision and move at
 *   rates distinct from the main terrain; fill and edge materials are shared
 *   across all shapes.
 * fails when: a shape has fewer than two points — `buildTerrain` throws for
 *   invalid authored data.
 */
import * as THREE from 'three';
import type { Rect, Vec2 } from '../util/math';
import { buildTerrain, type Terrain, type TerrainShapeDef } from './terrain';
import { worldBounds, type WorldChunkDef } from './worldData';
import type { BandProfile } from '../render/band';

interface ParallaxLayer {
  group: THREE.Group;
  factor: number;
  yOffset: number;
  z: number;
  fillMat: THREE.MeshBasicMaterial;
  edgeMat: THREE.LineBasicMaterial;
}

export class World {
  readonly terrain: Terrain;
  readonly bounds: Rect;

  private readonly mainFillMat = new THREE.MeshBasicMaterial({ color: 0x0a0e12 });
  private readonly mainEdgeMat = new THREE.LineBasicMaterial({ color: 0x2f4a66 });
  private readonly decoEdgeMat = new THREE.LineBasicMaterial({ color: 0x9fd8e8 });
  private readonly parallax: ParallaxLayer[] = [];

  constructor(scene: THREE.Scene, chunks: readonly WorldChunkDef[]) {
    const shapes = chunks.flatMap((c) => c.terrain);
    this.terrain = buildTerrain(shapes);
    this.bounds = worldBounds(chunks);
    for (const shape of shapes) {
      const pts = shape.visual ?? shape.points;
      const first = pts[0];
      if (first === undefined) throw new Error(`terrain shape ${shape.id} has no points`);
      const fill = new THREE.Mesh(this.makeFillGeometry(pts), this.mainFillMat);
      fill.position.z = 0;
      fill.renderOrder = 0;
      scene.add(fill);
      const edge = new THREE.LineLoop(this.makeEdgeGeometry(pts), this.mainEdgeMat);
      edge.position.z = 1;
      edge.renderOrder = 1;
      scene.add(edge);
      const deco = new THREE.LineSegments(this.makeSparseEdgeGeometry(pts), this.decoEdgeMat);
      deco.position.z = 1.05;
      deco.renderOrder = 2;
      scene.add(deco);
    }
    // Background parallax versions (no collision, request §17): a far layer
    // (z = -40, moves slowest) and a mid layer (z = -25), offset up into the
    // open water so they read as a distinct faint background behind the main
    // terrain (which sits at z = 0 in front of them).
    this.addParallax(scene, shapes, -40, 0.4, 280);
    this.addParallax(scene, shapes, -25, 0.65, 140);
  }

  /** Re-tint the silhouettes to the current depth band (request §14.3). */
  updatePalette(profile: BandProfile): void {
    this.mainFillMat.color.setRGB(
      0.015 + profile.ambient * 0.03,
      0.02 + profile.ambient * 0.03,
      0.035 + profile.ambient * 0.05,
    );
    this.mainEdgeMat.color.setRGB(profile.accent[0] * 0.8, profile.accent[1] * 0.8, profile.accent[2] * 0.8);
    this.decoEdgeMat.color.setRGB(profile.accent[0], profile.accent[1], profile.accent[2]);
    for (const layer of this.parallax) {
      const far = layer.z === -40;
      const k = far ? 0.5 : 0.72;
      layer.fillMat.color.setRGB(
        (0.01 + profile.ambient * 0.02) * k,
        (0.014 + profile.ambient * 0.02) * k,
        (0.026 + profile.ambient * 0.04) * k,
      );
      layer.edgeMat.color.setRGB(profile.accent[0] * k * 0.5, profile.accent[1] * k * 0.5, profile.accent[2] * k * 0.5);
    }
  }

  /** Reposition the background layers so each moves at its parallax rate. */
  updateParallax(center: Vec2): void {
    for (const layer of this.parallax) {
      layer.group.position.x = center.x * (1 - layer.factor);
      layer.group.position.y = center.y * (1 - layer.factor) + layer.yOffset;
    }
  }

  private addParallax(scene: THREE.Scene, shapes: readonly TerrainShapeDef[], z: number, factor: number, yOffset: number): void {
    const group = new THREE.Group();
    group.position.z = z;
    group.renderOrder = z === -40 ? -5 : -3;
    const fillMat = new THREE.MeshBasicMaterial({ color: 0x0c1016 });
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x1c2c40, transparent: true, opacity: 0.6 });
    for (const shape of shapes) {
      const pts = shape.visual ?? shape.points;
      group.add(new THREE.Mesh(this.makeFillGeometry(pts), fillMat));
      group.add(new THREE.LineLoop(this.makeEdgeGeometry(pts), edgeMat));
    }
    scene.add(group);
    this.parallax.push({ group, factor, yOffset, z, fillMat, edgeMat });
  }

  private makeFillGeometry(pts: readonly Vec2[]): THREE.ShapeGeometry {
    const form = new THREE.Shape();
    form.moveTo(pts[0]!.x, pts[0]!.y);
    for (let i = 1; i < pts.length; i += 1) {
      const p = pts[i]!;
      form.lineTo(p.x, p.y);
    }
    return new THREE.ShapeGeometry(form);
  }

  private makeEdgeGeometry(pts: readonly Vec2[]): THREE.BufferGeometry {
    return new THREE.BufferGeometry().setFromPoints(Array.from(pts, (p) => new THREE.Vector3(p.x, p.y, 0)));
  }

  private makeSparseEdgeGeometry(pts: readonly Vec2[]): THREE.BufferGeometry {
    // Sparse rim detail (request §14.1): draw only the even-started edge
    // segments, not the full outline, so the luminous accent reads as detail.
    const n = pts.length;
    const verts: THREE.Vector3[] = [];
    for (let i = 0; i < n; i += 2) {
      const a = pts[i]!;
      const b = pts[(i + 1) % n]!;
      verts.push(new THREE.Vector3(a.x, a.y, 0));
      verts.push(new THREE.Vector3(b.x, b.y, 0));
    }
    return new THREE.BufferGeometry().setFromPoints(verts);
  }
}
