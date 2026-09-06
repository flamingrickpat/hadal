/**
 * problem — the greybox scene reads as a flat unlit field (request §14.1);
 *   solution — a desaturated depth-tinted water gradient (the ambient base,
 *   never pure black) plus a composited flashlight beam mask that reveals the
 *   local area, shortens visibility with depth, and keeps the rest navigable
 *   (request §15).
 *
 * archetype: service-provider
 * owns: two compositing scene layers that carry the light: the camera-anchored
 *   vertical water-gradient quad (z = -50) and the additive cone/radial
 *   flashlight-beam quad (z = 12) that tracks the player position, aim, and
 *   the per-band profile (reach, intensity, ambient floor, accent color).
 * not own: the depth → profile mapping (`band`), the camera center it is
 *   anchored to (the `Renderer`), the particle field, or the terrain.
 * fails when: none — pure Three.js compositing; the shaders are fixed.
 * invariant: the beam is additive and never depth-tested, so it brightens
 *   (reveals) the terrain and particles beneath it rather than occluding them;
 *   the ambient floor keeps the frame above pure black at every depth.
 */
import * as THREE from 'three';
import type { Vec2 } from '../util/math';
import type { BandProfile } from './band';

const GRADIENT_Z = -50; // behind all terrain
const BEAM_Z = 12; // in front of the player (z = 10)
const CONE_HALF = 0.85; // radians; the starter work-light beam half-angle (request §15)

export class Lighting {
  readonly gradient: THREE.Mesh;
  private readonly gradientMat: THREE.ShaderMaterial;
  readonly beam: THREE.Mesh;
  private readonly beamMat: THREE.ShaderMaterial;

  constructor(scene: THREE.Scene) {
    this.gradientMat = new THREE.ShaderMaterial({
      uniforms: {
        uTop: { value: new THREE.Color(0.1, 0.22, 0.28) },
        uBottom: { value: new THREE.Color(0.04, 0.1, 0.15) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform vec3 uTop;
        uniform vec3 uBottom;
        varying vec2 vUv;
        void main() {
          // vUv.y: 1 at the top of the view, 0 at the bottom (request §14.1).
          vec3 c = mix(uBottom, uTop, vUv.y);
          gl_FragColor = vec4(c, 1.0);
        }`,
      depthWrite: false,
      depthTest: false,
    });
    this.gradient = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.gradientMat);
    this.gradient.position.z = GRADIENT_Z;
    this.gradient.renderOrder = -10;
    scene.add(this.gradient);

    this.beamMat = new THREE.ShaderMaterial({
      uniforms: {
        uReach: { value: 1600 },
        uIntensity: { value: 1.0 },
        uConeHalf: { value: CONE_HALF },
        uColor: { value: new THREE.Color(0.85, 0.9, 1.0) },
        uAmbient: { value: 0.1 },
      },
      vertexShader: `
        varying vec2 vLocal;
        uniform float uReach;
        void main() {
          // Scale the unit quad into world units so vLocal is the offset from
          // the beam origin in world units (request 15).
          vLocal = position.xy * uReach;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform float uReach;
        uniform float uIntensity;
        uniform float uConeHalf;
        uniform vec3 uColor;
        uniform float uAmbient;
        varying vec2 vLocal;
        void main() {
          float dist = length(vLocal);
          float radial = 1.0 - smoothstep(0.0, uReach, dist);
          float angle = atan(vLocal.y, vLocal.x);
          float cone = 1.0 - smoothstep(0.0, uConeHalf, abs(angle));
          float light = uAmbient + uIntensity * radial * (0.15 + 0.85 * cone);
          gl_FragColor = vec4(uColor * light, 1.0);
        }`,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    });
    this.beam = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.beamMat);
    this.beam.position.z = BEAM_Z;
    this.beam.renderOrder = 10;
    scene.add(this.beam);
  }

  /** Size the gradient to the camera view (call on resize). */
  setHalf(half: Vec2): void {
    this.gradient.scale.set(half.x, half.y, 1);
  }

  update(center: Vec2, player: Vec2, aim: number, profile: BandProfile): void {
    this.gradient.position.set(center.x, center.y, GRADIENT_Z);
    // Anchor to the diver, not the camera: at depth the camera clamps, so a
    // camera-anchored light would sit above the diver and stop tracking them.
    this.beam.position.set(player.x, player.y, BEAM_Z);
    this.beam.scale.set(profile.visibility, profile.visibility, 1);
    this.beam.rotation.z = aim;
    this.gradientMat.uniforms.uTop!.value.setRGB(profile.waterTop[0], profile.waterTop[1], profile.waterTop[2]);
    this.gradientMat.uniforms.uBottom!.value.setRGB(profile.waterBottom[0], profile.waterBottom[1], profile.waterBottom[2]);
    this.beamMat.uniforms.uReach!.value = profile.visibility;
    this.beamMat.uniforms.uIntensity!.value = profile.lightIntensity * 1.2;
    this.beamMat.uniforms.uAmbient!.value = profile.ambient * 0.4;
  }

  dispose(): void {
    this.gradient.geometry.dispose();
    this.gradientMat.dispose();
    this.beam.geometry.dispose();
    this.beamMat.dispose();
  }
}
