/**
 * coordinates — game frame lifecycle across player/world/creatures/systems.
 *
 * archetype: coordinator
 * participants: `Renderer` (drawing), `GameState` (simulation clock),
 *   and the player/world/creature systems that later work items add
 *   (request §29).
 * ordering: per display frame, `update(FIXED_DT)` runs in fixed-step
 *   increments drained from an accumulator, then exactly one
 *   `render(alpha)` — the simulation cadence is independent of
 *   `requestAnimationFrame` timing (request §30).
 * owns: the `requestAnimationFrame` loop and its accumulator, plus the
 *   boot marker that stands in for the player until WI-02.
 * fails when: a frame gap exceeds `MAX_FRAME_DT` (tab stall) — the
 *   excess is discarded rather than simulated (no spiral of death).
 * invariant: `update` is always called with exactly `FIXED_DT`; a
 *   leftover frame fraction (< 1 step) is never simulated.
 */
import * as THREE from 'three';
import { Renderer } from '../render/Renderer';
import { FIXED_DT, MAX_FRAME_DT } from './constants';
import { GameState } from './GameState';

export class Game {
  readonly state = new GameState();

  private readonly renderer: Renderer;
  private readonly marker: THREE.Mesh;
  private accumulator = 0;
  private lastNow: number | null = null;
  private running = false;

  constructor(renderer: Renderer) {
    this.renderer = renderer;
    this.marker = new THREE.Mesh(
      new THREE.BoxGeometry(120, 80, 80),
      new THREE.MeshBasicMaterial({ color: 0x5b8aa6 }),
    );
    this.renderer.scene.add(this.marker);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastNow = null;
    requestAnimationFrame((now) => this.frame(now));
  }

  stop(): void {
    this.running = false;
  }

  // Single simulation seam (request §30): always called with FIXED_DT.
  update(dt: number): void {
    this.state.tick(dt);
    // The boot marker bobs on the simulation clock, not on frame time:
    // the same real seconds elapse move it identically at any refresh rate.
    this.marker.position.y = Math.sin(this.state.timeSec * 0.5) * 30;
  }

  render(alpha: number): void {
    // alpha is the leftover frame fraction (accumulator / FIXED_DT),
    // consumed once the camera rig (request §16) needs interpolation.
    this.renderer.render();
  }

  private frame(now: number): void {
    if (!this.running) return;
    if (this.lastNow !== null) {
      this.accumulator += Math.min((now - this.lastNow) / 1000, MAX_FRAME_DT);
    }
    this.lastNow = now;
    while (this.accumulator >= FIXED_DT) {
      this.update(FIXED_DT);
      this.accumulator -= FIXED_DT;
    }
    this.render(this.accumulator / FIXED_DT);
    requestAnimationFrame((n) => this.frame(n));
  }
}
