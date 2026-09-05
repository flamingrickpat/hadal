/**
 * assembles — the greybox world chunks into scene meshes and collision terrain.
 *
 * archetype: service-provider
 * owns: the terrain silhouette meshes (dark fill + brighter edge,
 *   request §17 "rendered silhouette meshes") added to the scene, and
 *   the collision `Terrain` built from the same chunk data. Rendered
 *   geometry follows each shape's `visual` points (falling back to the
 *   collision points); collision never reads the visuals (request §31).
 * not own: the chunk data (`worldData`), the camera, or per-band
 *   decorative geometry (WI-04).
 * invariant: every terrain shape gets exactly one fill mesh and one
 *   edge loop at z = 0, below the player (z = 10); fill and edge
 *   materials are shared across all shapes.
 * fails when: a shape has fewer than two points — `buildTerrain`
 *   throws for invalid authored data.
 */
import * as THREE from 'three';
import type { Rect } from '../util/math';
import { buildTerrain, type Terrain } from './terrain';
import { worldBounds, type WorldChunkDef } from './worldData';

export class World {
  readonly terrain: Terrain;
  readonly bounds: Rect;

  constructor(scene: THREE.Scene, chunks: readonly WorldChunkDef[]) {
    const shapes = chunks.flatMap((c) => c.terrain);
    this.terrain = buildTerrain(shapes);
    this.bounds = worldBounds(chunks);
    const fill = new THREE.MeshBasicMaterial({ color: 0x141d29 });
    const edge = new THREE.LineBasicMaterial({ color: 0x2f4a66 });
    for (const shape of shapes) {
      const pts = shape.visual ?? shape.points;
      const first = pts[0];
      if (first === undefined) throw new Error(`terrain shape ${shape.id} has no points`);
      const form = new THREE.Shape();
      form.moveTo(first.x, first.y);
      for (let i = 1; i < pts.length; i++) {
        const p = pts[i];
        if (p === undefined) continue;
        form.lineTo(p.x, p.y);
      }
      const mesh = new THREE.Mesh(new THREE.ShapeGeometry(form), fill);
      mesh.position.z = 0;
      scene.add(mesh);
      const loop = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(
          Array.from(pts, (p) => new THREE.Vector3(p.x, p.y, 0)),
        ),
        edge,
      );
      loop.position.z = 0;
      scene.add(loop);
    }
  }
}
