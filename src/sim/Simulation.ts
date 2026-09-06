/**
 * problem — gameplay logic (movement, collision, oxygen, harvesting,
 *   crafting, death/respawn, save) must be Node-importable and shared by
 *   the browser and every headless scenario (request §30); solution — one
 *   `Simulation` core that the browser renders and the scenario harness
 *   advances, with player actions as data and no browser globals.
 *
 * archetype: service-provider; also: controller (orchestrates the step)
 * owns: the live simulation state — the `Player`, the movement
 *   `PlayerController`, the collision `Terrain`, the session `GameState`,
 *   the mutable resource nodes, the banked/progression state, the story
 *   flags, and the seeded RNG — plus the single `step(input, dt)` that
 *   advances the whole tick.
 * not own: rendering, DOM, audio, or `localStorage` — those are adapters
 *   around this core (request §30); the world *data* (`worldData`), the
 *   content (recipes/items/dialogue), and the save *format* (`save.ts`)
 *   are consumed, not owned here.
 * invariant: `step` advances by exactly the given `dt` and is
 *   deterministic in (state, input, seed); a fresh simulation from the
 *   production world starts at `PLAYER_START` with starter gear.
 * fails when: the world has no base or no resource nodes — the
 *   constructor throws for invalid authored data.
 */
import {
  BASE_RADIUS,
  DEATH_RESOURCE_LOSS_FRACTION,
  HP_MAX,
  INTERACT_RADIUS,
  PLAYER_RADIUS,
} from '../game/constants';
import { GameState } from '../game/GameState';
import type { SaveGameV1 } from '../game/save';
import { findItem } from '../content/items';
import { RECIPE_BY_ID } from '../content/recipes';
import { BASE_RETURN_LINES } from '../content/dialogue';
import { applyStarterGear } from '../player/equipment';
import { Player } from '../player/Player';
import { PlayerController, type PlayerInput } from '../player/PlayerController';
import { createCargo } from '../player/inventory';
import { canCraft, applyEquipment, type CraftResult } from '../systems/CraftingSystem';
import { vec2, type Vec2 } from '../util/math';
import { buildTerrain, type Terrain } from '../world/terrain';
import {
  BASE,
  GREYBOX_WORLD,
  PLAYER_START,
  type BaseDef,
  type ResourceNodeDef,
  type WorldChunkDef,
} from '../world/worldData';

export interface SimWorld {
  chunks: readonly WorldChunkDef[];
  base: BaseDef;
}

export interface ResourceNode extends ResourceNodeDef {
  harvested: boolean;
}

export const DEFAULT_SEED = 0;

/** The production world: the greybox chunks plus the surface base. */
export function makeSimWorld(): SimWorld {
  return { chunks: GREYBOX_WORLD, base: BASE };
}

export function emptyInput(): PlayerInput {
  return {
    thrustX: 0,
    thrustY: 0,
    boost: false,
    aimPoint: vec2(0, 0),
    useTool: false,
    altTool: false,
    interact: false,
    sonar: false,
    toolSelect: null,
    craftRequest: null,
  };
}

export class Simulation {
  readonly player: Player;
  readonly controller: PlayerController;
  readonly terrain: Terrain;
  readonly state: GameState;
  readonly base: BaseDef;
  readonly chunks: readonly WorldChunkDef[];
  readonly seed: number;
  readonly nodes: ResourceNode[];
  discoveredChunks = new Set<string>();
  storyFlags: string[] = [];
  collectedUniqueIds = new Set<string>();
  lastStoryLine: string | null = null;
  autosaveRequested = false;
  noclip = false;
  private wasAtBase: boolean;

  constructor(world: SimWorld, seed: number = DEFAULT_SEED) {
    this.chunks = world.chunks;
    this.base = world.base;
    this.seed = seed;
    this.terrain = buildTerrain(world.chunks.flatMap((c) => c.terrain));
    this.state = new GameState();
    this.nodes = world.chunks.flatMap((c) => c.resourceNodes ?? []).map((n) => ({ ...n, harvested: false }));
    this.player = new Player(PLAYER_START);
    applyStarterGear(this.player);
    this.controller = new PlayerController(this.player);
    this.wasAtBase = this.isAtBase(this.player.position);
    this.discoverChunksAt(this.player.position);
  }

  /** Advance the whole tick by `dt`, reading player actions from `input`. */
  step(input: PlayerInput, dt: number): void {
    const c = this.controller;
    c.input.thrustX = input.thrustX;
    c.input.thrustY = input.thrustY;
    c.input.boost = input.boost;
    c.input.aimPoint = input.aimPoint;
    c.input.interact = input.interact;
    c.input.sonar = input.sonar;
    c.input.useTool = input.useTool;
    c.input.altTool = input.altTool;
    this.state.tick(dt);
    c.update(dt);
    if (input.toolSelect !== null) this.controller.setToolIndex(input.toolSelect);
    if (!this.noclip) this.terrain.resolveCircle(this.player.position, PLAYER_RADIUS, this.player.velocity);
    this.handleHarvest(input);
    this.handleCraft(input);
    this.handleBaseReturn();
    this.handleDeath();
    this.updateProgression();
    // Consume one-shot actions so a reused input object does not re-apply them.
    input.craftRequest = null;
    input.toolSelect = null;
  }

  private handleHarvest(input: PlayerInput): void {
    if (!input.interact) return;
    const node = this.nearestNode(this.player.position);
    if (node === null) return;
    const room = this.player.cargo.capacity - this.player.cargo.used;
    const add = Math.min(node.amount, room);
    if (add <= 0) return;
    this.player.inventory[node.material] = (this.player.inventory[node.material] ?? 0) + add;
    node.amount -= add;
    if (node.amount <= 0) node.harvested = true;
    this.collectedUniqueIds.add(node.id);
    this.updateCargo();
  }

  handleCraft(input: PlayerInput): CraftResult {
    const recipeId = input.craftRequest;
    if (recipeId === null) return { crafted: false, reason: 'unknown' };
    // Crafting happens at the workbench, which is at the base (request §5).
    if (!this.isAtBase(this.player.position)) return { crafted: false, reason: 'notAtBase' };
    const def = RECIPE_BY_ID.get(recipeId);
    if (def === undefined) return { crafted: false, reason: 'unknown' };
    if (this.player.equipmentIds.includes(def.id)) return { crafted: false, reason: 'alreadyOwned' };
    if (!canCraft(this.combinedPool(), def)) return { crafted: false, reason: 'insufficient' };
    for (const [material, count] of Object.entries(def.cost)) {
      let remaining = count;
      const fromBanked = Math.min(this.player.banked[material] ?? 0, remaining);
      this.player.banked[material] = (this.player.banked[material] ?? 0) - fromBanked;
      if (this.player.banked[material] <= 0) delete this.player.banked[material];
      remaining -= fromBanked;
      if (remaining > 0) {
        this.player.inventory[material] = (this.player.inventory[material] ?? 0) - remaining;
        if (this.player.inventory[material] <= 0) delete this.player.inventory[material];
        this.updateCargo();
      }
    }
    applyEquipment(this.player, def);
    this.player.equipmentIds.push(def.id);
    this.requestAutosave();
    return { crafted: true, reason: 'ok' };
  }

  private handleBaseReturn(): void {
    const atBase = this.isAtBase(this.player.position);
    if (atBase && !this.wasAtBase) this.onBaseReturn();
    this.wasAtBase = atBase;
  }

  private onBaseReturn(): void {
    // Bank carried resources: they no longer consume cargo (request §5).
    for (const [material, count] of Object.entries(this.player.inventory)) {
      this.player.banked[material] = (this.player.banked[material] ?? 0) + count;
      delete this.player.inventory[material];
    }
    this.updateCargo();
    this.requestAutosave();
    this.pushNextStoryLine();
  }

  private pushNextStoryLine(): void {
    const line = BASE_RETURN_LINES[this.storyFlags.length];
    if (line === undefined) return;
    this.storyFlags.push(`base-line-${this.storyFlags.length}`);
    this.lastStoryLine = line;
  }

  private handleDeath(): void {
    if (this.player.health > 0) return;
    this.respawn();
  }

  respawn(): void {
    const p = this.player;
    p.position = vec2(this.base.position.x, this.base.position.y - 50);
    p.velocity = vec2(0, 0);
    p.o2 = p.o2Max;
    p.health = HP_MAX;
    // Lose at most a modest fraction of unbanked resources; keep the rest,
    // the banked resources, and the permanent upgrades (request §25).
    for (const material of Object.keys(p.inventory)) {
      const kept = Math.floor(p.inventory[material]! * (1 - DEATH_RESOURCE_LOSS_FRACTION));
      if (kept > 0) p.inventory[material] = kept;
      else delete p.inventory[material];
    }
    this.updateCargo();
    this.wasAtBase = true;
    this.requestAutosave();
  }

  private updateProgression(): void {
    this.player.maxDepth = Math.max(this.player.maxDepth, this.player.depth);
    this.discoverChunksAt(this.player.position);
  }

  private discoverChunksAt(pos: Vec2): void {
    for (const chunk of this.chunks) {
      const b = chunk.bounds;
      if (pos.x >= b.x && pos.x <= b.x + b.w && pos.y >= b.y && pos.y <= b.y + b.h) {
        this.discoveredChunks.add(chunk.id);
      }
    }
  }

  isAtBase(pos: Vec2): boolean {
    return Math.hypot(pos.x - this.base.position.x, pos.y - this.base.position.y) <= BASE_RADIUS;
  }

  nearestNode(pos: Vec2): ResourceNode | null {
    let best: ResourceNode | null = null;
    let bestDist = INTERACT_RADIUS;
    for (const node of this.nodes) {
      if (node.harvested) continue;
      const d = Math.hypot(node.position.x - pos.x, node.position.y - pos.y);
      if (d <= bestDist) {
        best = node;
        bestDist = d;
      }
    }
    return best;
  }

  combinedPool(): Record<string, number> {
    const pool: Record<string, number> = {};
    for (const [material, count] of Object.entries(this.player.inventory)) pool[material] = count;
    for (const [material, count] of Object.entries(this.player.banked)) {
      pool[material] = (pool[material] ?? 0) + count;
    }
    return pool;
  }

  available(material: string): number {
    return this.combinedPool()[material] ?? 0;
  }

  private updateCargo(): void {
    let used = 0;
    for (const count of Object.values(this.player.inventory)) used += count;
    this.player.cargo.used = Math.min(used, this.player.cargo.capacity);
  }

  requestAutosave(): void {
    this.autosaveRequested = true;
  }

  consumeAutosave(): boolean {
    const pending = this.autosaveRequested;
    this.autosaveRequested = false;
    return pending;
  }

  // Debug / developer hooks (request §33).
  giveResources(material: string, amount: number): void {
    this.player.banked[material] = (this.player.banked[material] ?? 0) + amount;
  }
  teleportTo(x: number, depth: number): void {
    this.player.position = vec2(x, -depth);
    this.player.velocity = vec2(0, 0);
  }

  toSave(): SaveGameV1 {
    const p = this.player;
    return {
      version: 1,
      playTimeSec: this.state.timeSec,
      player: {
        health: p.health,
        oxygenUpgrade: p.equipmentIds.includes('tank-1') ? 1 : 0,
        equipmentIds: [...p.equipmentIds],
        inventory: { ...p.inventory },
        banked: { ...p.banked },
      },
      world: {
        discoveredChunks: [...this.discoveredChunks],
        openedShortcuts: [],
        collectedUniqueIds: [...this.collectedUniqueIds],
        storyFlags: [...this.storyFlags],
        maxDepth: p.maxDepth,
      },
      settings: { masterVolume: 1 },
    };
  }

  /** Restore from a save into this simulation (the player is at the base). */
  loadFromSave(save: SaveGameV1): void {
    const p = this.player;
    this.state.timeSec = save.playTimeSec;
    p.equipmentIds = [...save.player.equipmentIds];
    p.capabilities.clear();
    p.speedMult = 1;
    applyStarterGear(p);
    for (const id of p.equipmentIds) {
      const item = findItem(id);
      if (item) applyEquipment(p, item);
    }
    p.health = save.player.health;
    p.o2 = p.o2Max;
    p.inventory = { ...save.player.inventory };
    p.banked = { ...save.player.banked };
    p.maxDepth = save.world.maxDepth;
    this.discoveredChunks = new Set(save.world.discoveredChunks);
    this.collectedUniqueIds = new Set(save.world.collectedUniqueIds);
    this.storyFlags = [...save.world.storyFlags];
    this.updateCargo();
    this.wasAtBase = true;
  }
}

export function createSimulation(world: SimWorld, seed: number = DEFAULT_SEED): Simulation {
  return new Simulation(world, seed);
}

/** A fresh simulation from the production world and a save (request §70 step 8). */
export function createSimulationFromSave(save: SaveGameV1, seed: number = DEFAULT_SEED): Simulation {
  const sim = createSimulation(makeSimWorld(), seed);
  sim.loadFromSave(save);
  return sim;
}
