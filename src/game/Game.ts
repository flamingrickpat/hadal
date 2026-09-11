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
import { MapOverlay } from '../ui/mapOverlay';
import { buildMapViewModel } from '../ui/mapView';
import { createSimulation, makeSimWorld, type Simulation } from '../sim/Simulation';
import { loadFromStorage, resetSave, saveToStorage } from './save';
import { PLAYER_PLANE_Z } from './constants';
import { Lighting } from '../render/lighting';
import { CreatureRenderer } from '../render/creatureRender';
import { ForegroundPass } from '../render/foreground';
import { ParticleField } from '../render/particles';
import { PostFX } from '../render/postfx';
import { SonarVisuals } from '../render/sonar';
import { bandProfileAtDepth } from '../render/band';
import { AudioSystem } from '../systems/AudioSystem';
import type { Vec2 } from '../util/math';
import type { DebugPanelHost } from '../util/debug';

const GAME_SEED = 1;

export class Game implements DebugPanelHost {
  private readonly renderer: Renderer;
  private readonly sim: Simulation;
  private readonly hud: Hud;
  private readonly menu: CraftingMenu;
  private readonly map: MapOverlay;
  private readonly world: World;
  private readonly lighting: Lighting;
  private readonly creatureRenderer: CreatureRenderer;
  private readonly foreground: ForegroundPass;
  private readonly particles: ParticleField;
  private readonly postfx: PostFX;
  private readonly sonarVisuals: SonarVisuals;
  private readonly audio: AudioSystem;
  private readonly playerMesh: THREE.Group;
  private readonly radio: HTMLElement;
  private lastShownLine: string | null = null;
  private paused = false;
  private sonarHeld = false;

  constructor(renderer: Renderer) {
    this.renderer = renderer;
    this.sim = createSimulation(makeSimWorld(), GAME_SEED);
    // Browser storage adapter: a malformed save resets gracefully (request §25).
    this.sim.loadFromSave(loadFromStorage(window.localStorage).save);
    this.world = new World(renderer.scene, this.sim.chunks);
    renderer.setWorldBounds(this.world.bounds);
    this.lighting = new Lighting(renderer.scene);
    this.creatureRenderer = new CreatureRenderer(renderer.scene);
    this.foreground = new ForegroundPass(renderer.scene);
    this.particles = new ParticleField(renderer.scene);
    this.sonarVisuals = new SonarVisuals(renderer.scene, this.sim.sonar);
    const buffer = new THREE.Vector2();
    renderer.gl.getDrawingBufferSize(buffer);
    this.postfx = new PostFX(renderer.gl, Math.max(1, buffer.x), Math.max(1, buffer.y));
    renderer.setPostFX(this.postfx);
    this.lighting.setHalf(renderer.cameraHalf());
    this.playerMesh = this.buildPlayerMesh();
    renderer.scene.add(this.playerMesh);
    this.hud = new Hud(document.body);
    this.menu = new CraftingMenu(document.body, this.sim);
    this.map = new MapOverlay(document.body, this.sim.chunks);
    this.audio = new AudioSystem();
    // Audio unlocks on the first user gesture so the browser autoplay rules are
    // respected (request §27, §70); the AudioContext is created only here.
    const unlockAudio = (): void => {
      this.audio.unlock();
    };
    window.addEventListener('pointerdown', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });
    window.addEventListener('touchstart', unlockAudio, { once: true });
    if (new URLSearchParams(window.location.search).has('debug')) {
      (window as unknown as Record<string, unknown>).__HADAL_AUDIO__ = this.audio;
      (window as unknown as Record<string, unknown>).__HADAL_GAME__ = this;
    }
    this.radio = document.createElement('div');
    this.radio.className = 'radio-message';
    document.body.appendChild(this.radio);
    this.sim.controller.bindToWindow(renderer);
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') this.togglePause();
      if (e.code === 'Tab') {
        e.preventDefault();
        this.toggleMap();
      }
    });
  }

  update(dt: number): void {
    // Pause simulation while the map is open, but still update the map display.
    const mapOpen = this.map.isOpen;
    if (!mapOpen && this.paused) return;

    if (!mapOpen) {
      this.sim.step(this.sim.controller.input, dt);
      // Apply camera modifier from trigger actions (request §16 scale-reveal, §36 camera action).
      const mod = this.sim.triggerState.cameraModifier;
      if (mod !== null) {
        // Validate the modifier value against the known set.
        if (mod === 'wide' || mod === 'tight' || mod === 'pullback') {
          this.renderer.setCameraModifier(mod);
        }
        // Reset after applying — the modifier is a one-shot trigger action.
        this.sim.triggerState.cameraModifier = null;
      }
    }
    this.syncPlayerMesh();
    this.hud.update(this.sim.player);
    this.menu.update();
    // Update the map overlay with current state when open.
    if (mapOpen) {
      const mapViewModel = buildMapViewModel(this.sim);
      this.map.update(mapViewModel);
    }
    // Fire the sonar ping once per Q press (request §6, §27), matching the
    // sonar fire in the simulation (which also requires the sonar capability).
    const sonar = this.sim.controller.input.sonar;
    if (sonar && !this.sonarHeld && this.sim.player.capabilities.has('sonar')) this.audio.playSonarPing();
    this.sonarHeld = sonar;
    this.updateRadio();
    if (this.sim.consumeAutosave()) saveToStorage(window.localStorage, this.sim.toSave());
  }

  private syncPlayerMesh(): void {
    const p = this.sim.player.position;
    this.playerMesh.position.set(p.x, p.y, PLAYER_PLANE_Z);
    this.playerMesh.rotation.z = this.sim.player.facing;
  }

  /**
   * Per-frame visual update (request §14.3/§15): the depth-band palette and
   * parallax, the flashlight/water gradient, the pooled particle field, and the
   * restrained post pass — all driven by the player's current depth band.
   */
  renderVisuals(frameDt: number): void {
    const center = this.renderer.cameraCenter();
    const half = this.renderer.cameraHalf();
    const profile = bandProfileAtDepth(this.sim.player.depth);
    this.world.updatePalette(profile);
    this.world.updateParallax(center);
    this.lighting.setHalf(half);
    this.lighting.update(center, this.sim.player.position, this.sim.player.facing, profile);
    // The ambient particle field is driven by the ACTIVE chunks' ambient budget
    // (request §17/§14.3): the local ambient intensity scales the band's
    // particle counts (deeper bands run sparser), and a region with no active
    // chunk nearby carries no ambient work at all — the far-disabled half of the
    // §17 streaming criterion, consumed here rather than left unobserved.
    const ambient = this.sim.ambientIntensityAt(center);
    const ambientScale = ambient > 0 ? Math.min(1, 0.35 + ambient) : 0;
    this.particles.update(frameDt, center, half, profile, this.sim.player.depth, (pos, time) => this.sim.currents.velocityAt(pos, time), ambientScale);
    // Creatures are a pure render view of the sim state (request §30): the
    // procedural bodies (request §13) are redrawn from the creature list
    // every frame, driven by the simulation clock. The camera's current view
    // (center + half extents) is passed in so the colossal crossing presence
    // can be parallaxed onto its background layer and realized only where
    // the screen can show it (request §52 A/B/G — the renderer never moves
    // the simulated creature).
    this.creatureRenderer.update(this.sim.creatures, this.sim.state.timeSec, profile, { center, half });
    // The foreground occluder pass (request §52 C): a few close structures
    // cross between the camera and the player, so the scene they cross
    // reads as larger than the view.
    this.foreground.update(center);
    this.sonarVisuals.update(this.sim.state.timeSec);
    this.postfx.update(profile, frameDt);
    this.audio.update(this.sim.player);
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

  private toggleMap(): void {
    const wasOpen = this.map.toggle();
    // Pause the game while the map is open
    this.hud.setPaused(wasOpen || this.paused);
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
