/**
 * coordinates — game frame lifecycle across player/world/creatures/systems.
 *
 * archetype: coordinator
 * participants: `Renderer` (drawing), `GameState` (simulation clock),
 *   `PlayerController` (motion + meters, request §6/§7),
 *   `CollisionSystem` (terrain resolution, request §31), `Hud`
 *   (readouts, request §26), and the `World` scene content (request §29).
 * ordering: per display frame, `update(FIXED_DT)` runs in fixed-step
 *   increments drained from an accumulator, then exactly one
 *   `render(alpha)` — the simulation cadence is independent of
 *   `requestAnimationFrame` timing (request §30). Inside a step:
 *   state → controller → collision → mesh sync → hud.
 * owns: the `requestAnimationFrame` loop and its accumulator, the
 *   player mesh (replacing the WI-01 boot marker), the Esc pause
 *   toggle (request §6), and the debug teleport/readout hooks
 *   (request §33).
 * fails when: a frame gap exceeds `MAX_FRAME_DT` (tab stall) — the
 *   excess is discarded rather than simulated (no spiral of death).
 * invariant: `update` is always called with exactly `FIXED_DT`; a
 *   leftover frame fraction (< 1 step) is never simulated; while
 *   paused no simulation step runs at all.
 */
import * as THREE from 'three';
import { Renderer } from '../render/Renderer';
import { Player } from '../player/Player';
import { PlayerController } from '../player/PlayerController';
import { applyStarterGear } from '../player/equipment';
import { CollisionSystem } from '../systems/CollisionSystem';
import { World } from '../world/World';
import { GREYBOX_WORLD, PLAYER_START } from '../world/worldData';
import { Hud } from '../ui/hud';
import { FIXED_DT, MAX_FRAME_DT } from './constants';
import { GameState } from './GameState';

export class Game {
  readonly state = new GameState();
  readonly player: Player;

  private readonly renderer: Renderer;
  private readonly world: World;
  private readonly controller: PlayerController;
  private readonly collision: CollisionSystem;
  private readonly hud: Hud;
  private readonly playerMesh: THREE.Group;
  private accumulator = 0;
  private lastNow: number | null = null;
  private running = false;
  private paused = false;

  constructor(renderer: Renderer) {
    this.renderer = renderer;
    this.world = new World(renderer.scene, GREYBOX_WORLD);
    renderer.setWorldBounds(this.world.bounds);
    this.player = new Player(PLAYER_START);
    applyStarterGear(this.player);
    this.controller = new PlayerController(this.player);
    this.collision = new CollisionSystem(this.player, this.world.terrain);
    this.hud = new Hud(document.body);
    this.playerMesh = this.buildPlayerMesh();
    renderer.scene.add(this.playerMesh);
    this.controller.bindToWindow(renderer);
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') this.togglePause();
    });
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

  togglePause(): void {
    this.paused = !this.paused;
    this.hud.setPaused(this.paused);
  }

  // Single simulation seam (request §30): always called with FIXED_DT.
  update(dt: number): void {
    if (this.paused) return;
    this.state.tick(dt);
    this.controller.update(dt);
    this.collision.update();
    this.syncPlayerMesh();
    this.hud.update(this.player);
  }

  render(alpha: number): void {
    // alpha is the leftover frame fraction (accumulator / FIXED_DT),
    // consumed once the camera rig (request §16) needs interpolation.
    this.renderer.follow(this.player.position);
    this.renderer.render();
  }

  debugTeleport(x: number, depth: number): void {
    this.player.position.x = x;
    this.player.position.y = -depth;
    this.player.velocity.x = 0;
    this.player.velocity.y = 0;
    this.hud.update(this.player);
  }

  debugReadout(): string {
    const p = this.player;
    const a = this.controller.input.aimPoint;
    let f = (p.facing + Math.PI) % (2 * Math.PI);
    if (f < 0) f += 2 * Math.PI;
    f -= Math.PI;
    return `x ${p.position.x.toFixed(1)}  depth ${p.depth.toFixed(1)}  o2 ${Math.ceil(p.o2)}s  hp ${Math.ceil(p.health)}  facing ${f.toFixed(2)}  aim ${a.x.toFixed(1)} ${a.y.toFixed(1)}`;
  }

  private buildPlayerMesh(): THREE.Group {
    const group = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(14, 22, 6, 12),
      new THREE.MeshBasicMaterial({ color: 0xcfd8e3 }),
    );
    body.rotation.z = Math.PI / 2; // capsule axis along x: facing 0 points right
    group.add(body);
    const aim = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(20, 0, 0),
        new THREE.Vector3(130, 0, 0),
      ]),
      new THREE.LineBasicMaterial({ color: 0x7fb2d9, transparent: true, opacity: 0.6 }),
    );
    group.add(aim);
    group.position.set(PLAYER_START.x, PLAYER_START.y, 10);
    return group;
  }

  private syncPlayerMesh(): void {
    const p = this.player;
    this.playerMesh.position.set(p.position.x, p.position.y, 10);
    this.playerMesh.rotation.z = p.facing;
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
