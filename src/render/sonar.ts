/**
 * problem — the sonar system (`systems/SonarSystem`) owns the ring / echo-tag /
 *   echo-particle state but does no rendering (request §30); solution — a thin
 *   browser layer that draws that state: an expanding ring, the brief outline
 *   tags, and the short-lived echo particles, all as pooled, non-reallocated
 *   Three.js objects (request §34/§18). A massive object renders a larger echo
 *   and tag than a normal one via a per-vertex point size (request §18, §52E).
 *
 * archetype: service-provider (owns the sonar's rendered meshes)
 * owns: the sonar ring (`THREE.LineLoop`), the echo-tag layer, and the
 *   echo-particle layer — three fixed, reused objects read from the
 *   `SonarSystem` each frame; and the per-vertex point size that scales a tag /
 *   echo with the tagged object's size (the "larger pulse" half of §18).
 * not own: the sonar state or the world-signal bus — the `SonarSystem` owns
 *   those; this layer only draws them.
 * invariant: the ring and both point layers are allocated once and never
 *   re-created; per frame only their transform, draw contents, and the
 *   per-vertex size change (no per-frame allocation, request §34).
 * fails when: none — the buffers are fixed-size and only ever rewritten.
 */
import * as THREE from 'three';
import type { SonarSystem } from '../systems/SonarSystem';
import { MASSIVE_FLASH_SCALE } from '../game/constants';

const RING_SEGMENTS = 96;
const SONAR_Z = 8; // just behind the player (z = 10), in front of the terrain
const TAG_BASE_SIZE = 5; // px, a size-1 object's tag (request §18)
const ECHO_BASE_SIZE = 6; // px, a size-1 object's echo (request §18)

// A per-vertex-sized point (request §18: a massive object renders a larger
// echo / tag). `size` is a pixel size (no attenuation); `tint` carries the
// faded accent color with the alpha folded into the RGB, so a faded point
// sinks to black against the dark water.
const POINT_VERT = /* glsl */ `
  attribute float size;
  attribute vec3 tint;
  varying vec3 vTint;
  void main() {
    vTint = tint;
    gl_PointSize = size;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const POINT_FRAG = /* glsl */ `
  varying vec3 vTint;
  void main() {
    gl_FragColor = vec4(vTint, 1.0);
  }
`;

export class SonarVisuals {
  private readonly ring: THREE.LineLoop;
  private readonly ringMat: THREE.LineBasicMaterial;
  private readonly pointMat: THREE.ShaderMaterial;
  readonly tagPts: THREE.Points;
  readonly echoPts: THREE.Points;
  private readonly tagPos: Float32Array;
  private readonly tagCol: Float32Array;
  readonly tagSize: Float32Array;
  private readonly echoPos: Float32Array;
  private readonly echoCol: Float32Array;
  readonly echoSize: Float32Array;
  private readonly accent: THREE.Color;
  private hiContrast = false;
  private reducedFlashing = false;

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

    this.pointMat = new THREE.ShaderMaterial({
      vertexShader: POINT_VERT,
      fragmentShader: POINT_FRAG,
      transparent: true,
      depthWrite: false,
    });

    const nT = sonar.targets.length;
    this.tagPos = new Float32Array(nT * 3);
    this.tagCol = new Float32Array(nT * 3);
    this.tagSize = new Float32Array(nT);
    const tagGeo = new THREE.BufferGeometry();
    tagGeo.setAttribute('position', new THREE.BufferAttribute(this.tagPos, 3));
    tagGeo.setAttribute('tint', new THREE.BufferAttribute(this.tagCol, 3));
    tagGeo.setAttribute('size', new THREE.BufferAttribute(this.tagSize, 1));
    this.tagPts = new THREE.Points(tagGeo, this.pointMat);
    this.tagPts.frustumCulled = false;
    this.tagPts.position.z = SONAR_Z;
    this.tagPts.renderOrder = 4;
    scene.add(this.tagPts);

    const nE = sonar.echoes.length;
    this.echoPos = new Float32Array(nE * 3);
    this.echoCol = new Float32Array(nE * 3);
    this.echoSize = new Float32Array(nE);
    const echoGeo = new THREE.BufferGeometry();
    echoGeo.setAttribute('position', new THREE.BufferAttribute(this.echoPos, 3));
    echoGeo.setAttribute('tint', new THREE.BufferAttribute(this.echoCol, 3));
    echoGeo.setAttribute('size', new THREE.BufferAttribute(this.echoSize, 1));
    this.echoPts = new THREE.Points(echoGeo, this.pointMat);
    this.echoPts.frustumCulled = false;
    this.echoPts.position.z = SONAR_Z;
    this.echoPts.renderOrder = 4;
    scene.add(this.echoPts);

    this.accent = new THREE.Color(0x9fd8e8);
  }

  /** Enable high-contrast sonar rendering (request §43 accessibility). */
  setHiContrast(enabled: boolean): void {
    this.hiContrast = enabled;
    if (enabled) {
      // Bright yellow, maximum contrast against dark water
      this.accent.setRGB(1, 1, 0.2);
    } else {
      this.accent.setRGB(0.62, 0.85, 0.91);
    }
  }

  /** Enable reduced flashing: remove the ring's opacity fade. */
  setReducedFlashing(enabled: boolean): void {
    this.reducedFlashing = enabled;
  }

  /** Draw the current sonar state (request §18): ring, tags, and echoes. */
  update(time: number): void {
    if (this.sonar.ringActive) {
      this.ring.visible = true;
      this.ring.position.set(this.sonar.ringOrigin.x, this.sonar.ringOrigin.y, SONAR_Z);
      const r = Math.max(1, this.sonar.ringRadius);
      this.ring.scale.set(r, r, 1);
      if (this.reducedFlashing) {
        // Static visibility, no fade animation
        this.ringMat.opacity = 0.9;
      } else {
        const progress = this.sonar.ringRadius / this.sonar.ringMaxRadius;
        this.ringMat.opacity = Math.max(0, 1 - progress) * 0.9;
      }
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
      this.tagSize[i] = TAG_BASE_SIZE * (1 + (t.size - 1) * MASSIVE_FLASH_SCALE);
    }
    markDirty(this.tagPts);
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
      this.echoSize[i] = ECHO_BASE_SIZE * (1 + (e.size - 1) * MASSIVE_FLASH_SCALE);
    }
    markDirty(this.echoPts);
  }

  dispose(): void {
    this.ring.geometry.dispose();
    this.ringMat.dispose();
    this.tagPts.geometry.dispose();
    this.echoPts.geometry.dispose();
    this.pointMat.dispose();
  }
}

// Upload the rewritten point buffers (position + tint + per-vertex size).
function markDirty(points: THREE.Points): void {
  const g = points.geometry;
  (g.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
  (g.getAttribute('tint') as THREE.BufferAttribute).needsUpdate = true;
  (g.getAttribute('size') as THREE.BufferAttribute).needsUpdate = true;
}
