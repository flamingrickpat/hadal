/**
 * renders — a Three.js scene onto a WebGL canvas.
 *
 * archetype: service-provider
 * owns: the `WebGLRenderer`, the `Scene`, and the fixed-width
 *   orthographic camera (request §16) sized to the design view; window
 *   resize handling.
 * not own: what gets drawn — systems add their objects to `scene` and
 *   call `render()` once per frame.
 * fails when: WebGL2 is unavailable in the host browser — the
 *   constructor throws and boot fails visibly.
 * invariant: the camera stays centered on the origin with a fixed view
 *   width in world units, independent of window size, until a camera
 *   rig takes over (request §16).
 */
import * as THREE from 'three';
import { CAMERA_VIEW_WIDTH } from '../game/constants';

export class Renderer {
  readonly scene = new THREE.Scene();
  private readonly gl: THREE.WebGLRenderer;
  private readonly camera: THREE.OrthographicCamera;

  constructor(container: HTMLElement) {
    this.gl = new THREE.WebGLRenderer({ antialias: true });
    this.gl.setPixelRatio(window.devicePixelRatio);
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100000);
    this.camera.position.set(0, 0, 1000);
    this.scene.background = new THREE.Color(0x03070a);
    container.appendChild(this.gl.domElement);
    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.gl.setSize(w, h);
    const halfW = CAMERA_VIEW_WIDTH / 2;
    const halfH = CAMERA_VIEW_WIDTH / (w / h) / 2;
    this.camera.left = -halfW;
    this.camera.right = halfW;
    this.camera.top = halfH;
    this.camera.bottom = -halfH;
    this.camera.updateProjectionMatrix();
  }

  render(): void {
    this.gl.render(this.scene, this.camera);
  }
}
