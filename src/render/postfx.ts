/**
 * problem — the composited scene needs a restrained screen-space grain and a
 *   depth-dependent chromatic split to sell the cut-paper / scientific-sonar
 *   look without muddying it (request §14.1, §35, §72); solution — one cheap
 *   post pass that renders the scene to a render target, then samples it onto
 *   a full-screen quad applying animated grain and a subtle RGB split.
 *
 * archetype: service-provider
 * owns: the `WebGLRenderTarget` that holds the world and the full-screen
 *   grain/chromatic quad; `render` composites the world into the target and
 *   the quad onto the screen; `update` drives the animated grain clock and the
 *   per-band grain/chromatic amounts.
 * not own: the world scene and camera (passed to `render`), the depth →
 *   profile mapping (`band`), or the renderer's pixel ratio.
 * fails when: none — a single full-screen quad; the target is resized with the
 *   drawing buffer so the pass always covers the screen.
 * invariant: exactly one extra full-screen pass runs per frame (no heavy
 *   bloom, request §72); the target is disposed with the class.
 */
import * as THREE from 'three';
import type { BandProfile } from './band';

export class PostFX {
  private readonly target: THREE.WebGLRenderTarget;
  private readonly quadScene: THREE.Scene;
  private readonly quadCamera: THREE.OrthographicCamera;
  private readonly mat: THREE.ShaderMaterial;
  private readonly gl: THREE.WebGLRenderer;
  private time = 0;

  constructor(gl: THREE.WebGLRenderer, bufferWidth: number, bufferHeight: number) {
    this.target = new THREE.WebGLRenderTarget(Math.max(1, bufferWidth), Math.max(1, bufferHeight), {
      samples: 4,
    });
    this.mat = new THREE.ShaderMaterial({
      uniforms: {
        tWorld: { value: this.target.texture },
        uGrain: { value: 0.05 },
        uChromatic: { value: 0.002 },
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform sampler2D tWorld;
        uniform float uGrain;
        uniform float uChromatic;
        uniform float uTime;
        varying vec2 vUv;
        float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453123); }
        void main() {
          vec2 dir = vUv - 0.5;
          vec2 off = dir * uChromatic * 2.0;
          float r = texture2D(tWorld, vUv + off).r;
          float g = texture2D(tWorld, vUv).g;
          float b = texture2D(tWorld, vUv - off).b;
          vec3 col = vec3(r, g, b);
          col += (hash(vUv * 640.0 + uTime) - 0.5) * uGrain;
          gl_FragColor = vec4(col, 1.0);
        }`,
      depthWrite: false,
      depthTest: false,
    });
    this.quadScene = new THREE.Scene();
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.mat);
    this.quadScene.add(quad);
    this.quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.gl = gl;
  }

  resize(bufferWidth: number, bufferHeight: number): void {
    this.target.setSize(Math.max(1, bufferWidth), Math.max(1, bufferHeight));
  }

  update(profile: BandProfile, dt: number): void {
    this.time += dt;
    this.mat.uniforms.uGrain!.value = profile.grain;
    this.mat.uniforms.uChromatic!.value = profile.chromatic;
    this.mat.uniforms.uTime!.value = this.time;
  }

  /** Composite the world into the target, then the grain/chromatic quad to screen. */
  render(worldScene: THREE.Scene, worldCamera: THREE.Camera): void {
    const gl = this.gl;
    gl.setRenderTarget(this.target);
    gl.render(worldScene, worldCamera);
    gl.setRenderTarget(null);
    gl.render(this.quadScene, this.quadCamera);
  }

  dispose(): void {
    this.target.dispose();
    this.mat.dispose();
  }
}
