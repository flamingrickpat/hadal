/**
 * problem — the browser needs to run and render the headless game
 *   simulation on a fixed step (request §30); solution — a `Game` browser
 *   adapter that owns a `Simulation`, feeds it player actions from a thin
 *   input adapter, renders the resulting state with Three.js, and writes
 *   autosaves through the storage adapter.
 *
 * archetype: controller; also: browser adapter around the simulation core
 * owns: the browser glue — the `Simulation`, the Three.js scene/world/mesh,
 *   the HUD, the crafting menu, and the `localStorage` autosave adapter —
 *   driven on the fixed step.
 * coordinates: the `Simulation` (all gameplay rules live there), the
 *   `Renderer` (visuals), the `PlayerController.bindToWindow` (thin input
 *   adapter, request §30), and the `save` module (storage adapter).
 * invariant: `update(FIXED_DT)` delegates to `sim.step` so the browser runs
 *   the same simulation the headless scenarios do; no second movement or
 *   collision path exists here.
 * fails when: none — a malformed `localStorage` save resets gracefully
 *   (request §25) via the storage adapter before the simulation is built.
 */
import * as THREE from 'three';
import { Renderer } from '../render/Renderer';
import { World } from '../world/World';
import { Hud } from '../ui/hud';
import { CraftingMenu } from '../ui/menu';
import { createSimulation, makeSimWorld, type Simulation } from '../sim/Simulation';
import { loadFromStorage, resetSave, saveToStorage } from './save';
import type { Vec2 } from '../util/math';
import type { DebugPanelHost } from '../util/debug';

const GAME_SEED = 1;

export class Game implements DebugPanelHost {
  private readonly renderer: Renderer;
  private readonly sim: Simulation;
  private readonly hud: Hud;
  private readonly menu: CraftingMenu;
  private readonly world: World;
  private readonly playerMesh: THREE.Group;
  private readonly radio: HTMLElement;
  private lastShownLine: string | null = null;
  private paused = false;

  constructor(renderer: Renderer) {
    this.renderer = renderer;
    this.sim = createSimulation(makeSimWorld(), GAME_SEED);
    // Browser storage adapter: a malformed save resets gracefully (request §25).
    this.sim.loadFromSave(loadFromStorage(window.localStorage).save);
    this.world = new World(renderer.scene, this.sim.chunks);
    renderer.setWorldBounds(this.world.bounds);
    this.playerMesh = this.buildPlayerMesh();
    renderer.scene.add(this.playerMesh);
    this.hud = new Hud(document.body);
    this.menu = new CraftingMenu(document.body, this.sim);
    this.radio = document.createElement('div');
    this.radio.className = 'radio-message';
    document.body.appendChild(this.radio);
    this.sim.controller.bindToWindow(renderer);
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') this.togglePause();
    });
  }

  update(dt: number): void {
    if (this.paused) return;
    this.sim.step(this.sim.controller.input, dt);
    this.syncPlayerMesh();
    this.hud.update(this.sim.player);
    this.menu.update();
    this.updateRadio();
    if (this.sim.consumeAutosave()) saveToStorage(window.localStorage, this.sim.toSave());
  }

  private syncPlayerMesh(): void {
    const p = this.sim.player.position;
    this.playerMesh.position.set(p.x, p.y, 0);
    this.playerMesh.rotation.z = this.sim.player.facing;
  }

  private updateRadio(): void {
    if (this.sim.lastStoryLine !== this.lastShownLine) {
      this.lastShownLine = this.sim.lastStoryLine;
      this.radio.textContent = this.lastShownLine ?? '';
    }
  }

  private buildPlayerMesh(): THREE.Group {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(40, 30, 24), new THREE.MeshBasicMaterial({ color: 0x2f6d86 }));
    const visor = new THREE.Mesh(new THREE.BoxGeometry(18, 12, 6), new THREE.MeshBasicMaterial({ color: 0x9fd8e8 }));
    visor.position.set(16, 4, 0);
    group.add(body);
    group.add(visor);
    return group;
  }

  togglePause(): void {
    this.paused = !this.paused;
  }

  // Debug host (request §33): drive the simulation and storage from the panel.
  get player() {
    return this.sim.player;
  }
  get chunks() {
    return this.sim.chunks;
  }
  setNoclip(noclip: boolean): void {
    this.sim.noclip = noclip;
  }
  teleportTo(x: number, depth: number): void {
    this.sim.teleportTo(x, depth);
  }
  teleportToChunk(id: string): void {
    const chunk = this.sim.chunks.find((c) => c.id === id);
    if (chunk === undefined) return;
    const { x, y, w, h } = chunk.bounds;
    this.sim.teleportTo(x + w / 2, -(y + h / 2));
  }
  giveResources(): void {
    this.sim.giveResources('salvage', 4);
  }
  resetSave(): void {
    resetSave(window.localStorage);
    window.location.reload();
  }
}
