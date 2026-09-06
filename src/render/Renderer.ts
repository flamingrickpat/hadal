/**
 * renders — a Three.js scene onto a WebGL canvas, with a fixed-width ortho camera that follows a world target (request §16).
 *
 * archetype: service-provider
 * owns: the `WebGLRenderer`, the `Scene`, and the fixed-width
 *   orthographic camera (request §16) sized to the design view; window
 *   resize handling; the smooth camera follow (`follow`, ~0.15 s lag,
 *   clamped to the world bounds) and the screen-to-world projection
 *   used by mouse aim.
 * not own: what gets drawn — systems add their objects to `scene`;
 *   who the camera follows — `Game` passes the target each frame; the
 *   encounter zoom / aim lead (request §16) lands with WI-14.
 * fails when: WebGL2 is unavailable in the host browser — the
 *   constructor throws and boot fails visibly.
 * invariant: the view width stays fixed in world units, independent
 *   of window size; before the first `follow` call the camera is
 *   centered on the origin.
 */
import * as THREE from 'three';
import { CAMERA_LAG_SEC, CAMERA_VIEW_WIDTH } from '../game/constants';
import { clamp, vec2, type Rect, type Vec2 } from '../util/math';
import type { PostFX } from './postfx';

export class Renderer {
  readonly scene = new THREE.Scene();
  private readonly glRenderer: THREE.WebGLRenderer;
  private readonly camera: THREE.OrthographicCamera;
  private halfW = 0;
  private halfH = 0;
  private worldBounds: Rect | null = null;
  private readonly camOffset = { x: 0, y: 0 };
  private camInit = false;
  private lastFollowMs: number | null = null;
  private postfx: PostFX | null = null;
  private readonly buffer = new THREE.Vector2();

  get gl(): THREE.WebGLRenderer {
    return this.glRenderer;
  }

  constructor(container: HTMLElement) {
    this.glRenderer = new THREE.WebGLRenderer({ antialias: true });
    this.glRenderer.setPixelRatio(window.devicePixelRatio);
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100000);
    this.camera.position.set(0, 0, 1000);
    this.scene.background = new THREE.Color(0x03070a);
    container.appendChild(this.glRenderer.domElement);
    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  /** Attach the post pass (request §14.1); before this, `render` draws direct. */
  setPostFX(postfx: PostFX): void {
    this.postfx = postfx;
  }

  /** The camera's current world-space center (what the view is anchored to). */
  cameraCenter(): Vec2 {
    return vec2(this.camOffset.x, this.camOffset.y);
  }

  /** Half the current view extent in world units (for gradient / particle box). */
  cameraHalf(): Vec2 {
    return vec2(this.halfW, this.halfH);
  }

  resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.glRenderer.setSize(w, h);
    this.halfW = CAMERA_VIEW_WIDTH / 2;
    this.halfH = CAMERA_VIEW_WIDTH / (w / h) / 2;
    if (this.postfx !== null) {
      this.glRenderer.getDrawingBufferSize(this.buffer);
      this.postfx.resize(this.buffer.x, this.buffer.y);
    }
  }

  setWorldBounds(bounds: Rect): void {
    this.worldBounds = bounds;
  }

  follow(target: Vec2): void {
    const now = performance.now();
    if (!this.camInit) {
      this.camOffset.x = target.x;
      this.camOffset.y = target.y;
      this.camInit = true;
    }
    const dt = Math.max(0, (now - (this.lastFollowMs ?? now)) / 1000);
    this.lastFollowMs = now;
    const k = 1 - Math.exp(-dt / CAMERA_LAG_SEC);
    this.camOffset.x += (target.x - this.camOffset.x) * k;
    this.camOffset.y += (target.y - this.camOffset.y) * k;
    if (this.worldBounds !== null) {
      const b = this.worldBounds;
      // If the view is larger than the world along an axis, do not clamp that axis.
      const minX = b.x + Math.min(this.halfW, b.w / 2);
      const maxX = b.x + b.w - Math.min(this.halfW, b.w / 2);
      const minY = b.y + Math.min(this.halfH, b.h / 2);
      const maxY = b.y + b.h - Math.min(this.halfH, b.h / 2);
      if (minX < maxX) this.camOffset.x = clamp(this.camOffset.x, minX, maxX);
      if (minY < maxY) this.camOffset.y = clamp(this.camOffset.y, minY, maxY);
    }
  }

  screenToWorld(clientX: number, clientY: number): Vec2 {
    const rect = this.glRenderer.domElement.getBoundingClientRect();
    const nx = ((clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
    const ny = -(((clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1);
    return vec2(this.camOffset.x + nx * this.halfW, this.camOffset.y + ny * this.halfH);
  }

  render(): void {
    this.camera.left = -this.halfW + this.camOffset.x;
    this.camera.right = this.halfW + this.camOffset.x;
    this.camera.top = this.halfH + this.camOffset.y;
    this.camera.bottom = -this.halfH + this.camOffset.y;
    this.camera.updateProjectionMatrix();
    if (this.postfx !== null) {
      this.postfx.render(this.scene, this.camera);
    } else {
      this.glRenderer.render(this.scene, this.camera);
    }
  }
}
