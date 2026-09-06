/**
 * problem — the sonar system (`systems/SonarSystem`) owns the ring / echo-tag /
 *   echo-particle state but does no rendering (request §30); solution — a thin
 *   browser layer that draws that state: an expanding ring, the brief outline
 *   tags, and the short-lived echo particles, all as pooled, non-reallocated
 *   Three.js objects (request §34/§18).
 *
 * archetype: service-provider (owns the sonar's rendered meshes)
 * owns: the sonar ring (`THREE.LineLoop`), the echo-tag layer, and the
 *   echo-particle layer — three fixed, reused objects read from the
 *   `SonarSystem` each frame.
 * not own: the sonar state or the world-signal bus — the `SonarSystem` owns
 *   those; this layer only draws them.
 * invariant: the ring and both point layers are allocated once and never
 *   re-created; per frame only their transform, draw contents, and opacity
 *   change (no per-frame allocation, request §34).
 * fails when: none — the buffers are fixed-size and only ever rewritten.
 */
import * as THREE from 'three';
import type { SonarSystem } from '../systems/SonarSystem';

const RING_SEGMENTS = 96;
const SONAR_Z = 8; // just behind the player (z = 10), in front of the terrain

export class SonarVisuals {
  private readonly ring: THREE.LineLoop;
  private readonly ringMat: THREE.LineBasicMaterial;
  private readonly tagPts: THREE.Points;
  private readonly tagPos: Float32Array;
  private readonly tagCol: Float32Array;
  private readonly echoPts: THREE.Points;
  private readonly echoPos: Float32Array;
  private readonly echoCol: Float32Array;
  private readonly accent: THREE.Color;

  constructor(scene: THREE.Scene, private readonly sonar: SonarSystem) {
    const ringPts: THREE.Vector3[] = [];
    for (let i = 0; i < RING_SEGMENTS; i += 1) {
      const a = (i / RING_SEGMENTS) * Math.PI * 2;
      ringPts.push(new THREE.Vector3(Math.cos(a), Math.sin(a), 0));
    }
    this.ringMat = new THREE.LineBasicMaterial({ color: 0x9fd8e8, transparent: true, opacity: 0, depthWrite: false });
    this.ring = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(ringPts), this.ringMat);
    this.ring.position.z = SONAR_Z;
    this.ring.renderOrder = 4;
    this.ring.visible = false;
    scene.add(this.ring);

    const nT = sonar.targets.length;
    this.tagPos = new Float32Array(nT * 3);
    this.tagCol = new Float32Array(nT * 3);
    const tagGeo = new THREE.BufferGeometry();
    tagGeo.setAttribute('position', new THREE.BufferAttribute(this.tagPos, 3));
    tagGeo.setAttribute('color', new THREE.BufferAttribute(this.tagCol, 3));
    this.tagPts = new THREE.Points(
      tagGeo,
      new THREE.PointsMaterial({ size: 5, vertexColors: true, transparent: true, depthWrite: false, sizeAttenuation: false }),
    );
    this.tagPts.frustumCulled = false;
    this.tagPts.position.z = SONAR_Z;
    this.tagPts.renderOrder = 4;
    scene.add(this.tagPts);

    const nE = sonar.echoes.length;
    this.echoPos = new Float32Array(nE * 3);
    this.echoCol = new Float32Array(nE * 3);
    const echoGeo = new THREE.BufferGeometry();
    echoGeo.setAttribute('position', new THREE.BufferAttribute(this.echoPos, 3));
    echoGeo.setAttribute('color', new THREE.BufferAttribute(this.echoCol, 3));
    this.echoPts = new THREE.Points(
      echoGeo,
      new THREE.PointsMaterial({ size: 6, vertexColors: true, transparent: true, depthWrite: false, sizeAttenuation: false }),
    );
    this.echoPts.frustumCulled = false;
    this.echoPts.position.z = SONAR_Z;
    this.echoPts.renderOrder = 4;
    scene.add(this.echoPts);

    this.accent = new THREE.Color(0x9fd8e8);
  }

  /** Draw the current sonar state (request §18): ring, tags, and echoes. */
  update(time: number): void {
    if (this.sonar.ringActive) {
      this.ring.visible = true;
      this.ring.position.set(this.sonar.ringOrigin.x, this.sonar.ringOrigin.y, SONAR_Z);
      const r = Math.max(1, this.sonar.ringRadius);
      this.ring.scale.set(r, r, 1);
      const progress = this.sonar.ringRadius / this.sonar.ringMaxRadius;
      this.ringMat.opacity = Math.max(0, 1 - progress) * 0.9;
    } else {
      this.ring.visible = false;
    }
    const c = this.accent;
    for (let i = 0; i < this.sonar.targets.length; i += 1) {
      const t = this.sonar.targets[i]!;
      const dur = this.sonar.tagDuration(t);
      const rem = t.lastHit > 0 ? t.lastHit + dur - time : -1;
      const fade = rem >= 0 ? Math.max(0, Math.min(1, rem / dur)) : 0;
      this.tagPos[i * 3] = t.x;
      this.tagPos[i * 3 + 1] = t.y;
      this.tagPos[i * 3 + 2] = SONAR_Z;
      this.tagCol[i * 3] = c.r * fade;
      this.tagCol[i * 3 + 1] = c.g * fade;
      this.tagCol[i * 3 + 2] = c.b * fade;
    }
    (this.tagPts.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    (this.tagPts.geometry.getAttribute('color') as THREE.BufferAttribute).needsUpdate = true;
    for (let i = 0; i < this.sonar.echoes.length; i += 1) {
      const e = this.sonar.echoes[i]!;
      const rem = e.active ? e.born + e.life - time : -1;
      const fade = rem >= 0 ? Math.max(0, Math.min(1, rem / e.life)) * 0.9 : 0;
      this.echoPos[i * 3] = e.x;
      this.echoPos[i * 3 + 1] = e.y;
      this.echoPos[i * 3 + 2] = SONAR_Z;
      this.echoCol[i * 3] = c.r * fade;
      this.echoCol[i * 3 + 1] = c.g * fade;
      this.echoCol[i * 3 + 2] = c.b * fade;
    }
    (this.echoPts.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    (this.echoPts.geometry.getAttribute('color') as THREE.BufferAttribute).needsUpdate = true;
  }

  dispose(): void {
    this.ring.geometry.dispose();
    this.ringMat.dispose();
    this.tagPts.geometry.dispose();
    (this.tagPts.material as THREE.Material).dispose();
    this.echoPts.geometry.dispose();
    (this.echoPts.material as THREE.Material).dispose();
  }
}
