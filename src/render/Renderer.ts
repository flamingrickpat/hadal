/**
 * renders — a Three.js scene onto a WebGL canvas, with a fixed-width ortho camera that follows a world target (request §16).
 *
 * archetype: service-provider
 * owns: the `WebGLRenderer`, the `Scene`, and the fixed-width
 *   orthographic camera (request §16) sized to the design view; window
 *   resize handling; the smooth camera follow (`follow`, ~0.15 s lag,
 *   clamped to the world bounds) and the screen-to-world projection
 *   used by mouse aim; the widescreen composition modifier (request
 *   §16: widen horizontal visibility on ultrawide, not stretch UI).
 * not own: what gets drawn — systems add their objects to `scene`;
 *   who the camera follows — `Game` passes the target each frame; the
 *   encounter zoom / aim lead (request §16) lands with WI-14.
 * fails when: WebGL2 is unavailable in the host browser — the
 *   constructor throws and boot fails visibly.
 * invariant: the view width stays fixed in world units at the baseline
 *   aspect (16:9); on wider aspects the view widens proportionally up
 *   to a capped modifier; before the first `follow` call the camera is
 *   centered on the origin.
 */
import * as THREE from 'three';
import { CAMERA_LAG_SEC, CAMERA_VIEW_WIDTH } from '../game/constants';
import { clamp, vec2, type Rect, type Vec2 } from '../util/math';
import type { PostFX } from './postfx';
import { applyImpulseDecay, getImpulseOffset } from './impulseFlag';
import { viewWidthModifier } from './widescreen';

/** Camera modifiers (request §16 scale-reveal, §36 camera trigger actions). */
export type CameraModifier = 'wide' | 'tight' | 'pullback' | null;

/** View width for each camera modifier (request §16). */
export function viewWidthForModifier(mod: CameraModifier): number {
  switch (mod) {
    case 'wide':
      return CAMERA_VIEW_WIDTH * 1.5; // scale-reveal: show more of the environment
    case 'tight':
      return CAMERA_VIEW_WIDTH * 0.5; // close-up: show less
    case 'pullback':
      return CAMERA_VIEW_WIDTH * 1.75; // pull back after encounter
    default:
      return CAMERA_VIEW_WIDTH; // normal view
  }
}

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
  private viewWidth = CAMERA_VIEW_WIDTH;
  private lastRenderMs: number | null = null;

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

  /** Apply a camera modifier (request §16 scale-reveal, §36 camera trigger action). */
  setCameraModifier(mod: CameraModifier): void {
    const baseWidth = viewWidthForModifier(mod);
    // Stack the widescreen modifier on top of any camera modifier
    // (request §16: widen horizontal visibility on ultrawide).
    const w = window.innerWidth;
    const h = window.innerHeight;
    const aspect = w / h;
    this.viewWidth = baseWidth * viewWidthModifier(aspect);
    this.recomputeFraming();
  }

  resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.glRenderer.setSize(w, h);
    // Apply the widescreen modifier (request §16): on ultrawide
    // monitors widen horizontal visibility, don't stretch UI.
    const aspect = w / h;
    this.viewWidth = viewWidthForModifier(null) * viewWidthModifier(aspect);
    this.recomputeFraming();
    if (this.postfx !== null) {
      this.glRenderer.getDrawingBufferSize(this.buffer);
      this.postfx.resize(this.buffer.x, this.buffer.y);
    }
  }

  /** Compute half-width/height from the current view width and window aspect. */
  private recomputeFraming(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const aspect = w / h;
    this.halfW = this.viewWidth / 2;
    this.halfH = this.viewWidth / aspect / 2;
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
    // Decay the distant-motion impulse each frame (request §48).
    const now = performance.now();
    const rawDt = this.lastRenderMs === null ? 0 : (now - this.lastRenderMs) / 1000;
    this.lastRenderMs = now;
    applyImpulseDecay(Math.min(rawDt, 0.1));

    // Apply the distant-motion impulse nudge on top of the smooth follow
    // (request §48). The impulse is a separate, low-amplitude, short-decay
    // offset that does not touch the follow lag or bounds-clamping invariants.
    const impulse = getImpulseOffset();
    const ix = impulse ? impulse.x : 0;
    const iy = impulse ? impulse.y : 0;
    this.camera.left = -this.halfW + this.camOffset.x + ix;
    this.camera.right = this.halfW + this.camOffset.x + ix;
    this.camera.top = this.halfH + this.camOffset.y + iy;
    this.camera.bottom = -this.halfH + this.camOffset.y + iy;
    this.camera.updateProjectionMatrix();
    if (this.postfx !== null) {
      this.postfx.render(this.scene, this.camera);
    } else {
      this.glRenderer.render(this.scene, this.camera);
    }
  }
}
