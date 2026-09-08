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
  BOOST_NOISE_STRENGTH,
  BOOST_SIGNAL_INTERVAL,
  CURRENT_CONTROL_BASE,
  CURRENT_CONTROL_WITH_PROPULSION,
  DEATH_RESOURCE_LOSS_FRACTION,
  HP_MAX,
  INTERACT_RADIUS,
  PLAYER_RADIUS,
  TOOL_NOISE_STRENGTH,
} from '../game/constants';
import { GameState } from '../game/GameState';
import type { SaveGameV1 } from '../game/save';
import { findItem } from '../content/items';
import { RECIPE_BY_ID } from '../content/recipes';
import { BASE_RETURN_LINES, TRIGGER_RADIO_LINES } from '../content/dialogue';
import { applyStarterGear } from '../player/equipment';
import { Player } from '../player/Player';
import { PlayerController, type PlayerInput } from '../player/PlayerController';
import { createCargo } from '../player/inventory';
import { canCraft, applyEquipment, type CraftResult } from '../systems/CraftingSystem';
import { WorldSignalBus, type WorldSignal } from '../creatures/senses';
import { Creature, type CreatureAudioEvent } from '../creatures/Creature';
import { CREATURE_BY_ID } from '../creatures/fixtures';
import {
  FLEE_RADIUS,
  FLEE_THRESHOLD,
  KILL_TAG,
  PREDATOR_ATTACK_RANGE,
  PREDATOR_KILL_DIST,
  PREDATOR_SIGNAL_STRENGTH,
  PREDATOR_TAG,
  PART_RADIUS,
  SCAVENGE_RADIUS,
  SCAVENGE_THRESHOLD,
  fleeSignalStrength,
  flockForce,
  quietStrength,
  scavengeSignalStrength,
  strongestTaggedPos,
} from '../creatures/ecology';
import { settle, steerAway, steerToward, steerVelocity } from '../creatures/steering';
import { createRng } from '../util/rng';
import { SonarSystem, type SonarObject } from '../systems/SonarSystem';
import { vec2, type Vec2 } from '../util/math';
import { buildTerrain, type Terrain } from '../world/terrain';
import {
  BASE,
  MACRO_WORLD,
  PLAYER_START,
  WORLD_CURRENT_FIELDS,
  type BaseDef,
  type ResourceNodeDef,
  type WorldChunkDef,
} from '../world/worldData';
import { computeActiveChunkIds, chunkContaining } from '../world/chunks';
import { TriggerSystem, emptyTriggerState, type TriggerContext, type TriggerState } from '../world/triggers';
import { CurrentSystem } from '../systems/CurrentSystem';

export interface SimWorld {
  chunks: readonly WorldChunkDef[];
  base: BaseDef;
  /** Authored current fields (request §64); absent worlds are current-free. */
  currentFields?: readonly import('../systems/CurrentSystem').CurrentField[];
}

export interface ResourceNode extends ResourceNodeDef {
  harvested: boolean;
}

export const DEFAULT_SEED = 0;

/** The production world: the full macro world (all five depth bands) plus the surface base. */
export function makeSimWorld(): SimWorld {
  return { chunks: MACRO_WORLD, base: BASE, currentFields: WORLD_CURRENT_FIELDS };
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
  readonly signals: WorldSignalBus;
  readonly sonar: SonarSystem;
  /** The live creatures, advanced on the same fixed step as the player (request §30, §19). */
  readonly creatures: Creature[] = [];
  /**
   * The dense-medium factor for the player this step (request §48): 1 in open
   * water, or the densest `ecology.density` of a dense school with an active
   * member within the parting radius — applied as extra drag on the player's
   * velocity. Read by the browser HUD/debug, asserted headlessly.
   */
  denseMediumFactor = 1;
  /**
   * The audio events emitted by creature state transitions this step
   * (request §19 audio is data): the browser audio adapter consumes these;
   * the sim never synthesizes sound.
   */
  readonly creatureAudioEvents: CreatureAudioEvent[] = [];
  readonly triggers: TriggerSystem;
  readonly triggerState: TriggerState;
  readonly currents: CurrentSystem;
  discoveredChunks = new Set<string>();
  activeChunks = new Set<string>();
  /**
   * Per-chunk ambient work budget (request §17): only the ACTIVE chunks carry a
   * budget (their authored ambient intensity — the expensive per-chunk work:
   * ambient particles now, creature AI in WI-10). A far chunk is absent, so its
   * work is disabled. Consumed by the render (`Game`) to size the ambient
   * particle field, and asserted headlessly (`ambient.test.ts`) — the
   * "far chunks have expensive AI/particles disabled" half of §17.
   */
  readonly ambientWork = new Map<string, number>();
  storyFlags: string[] = [];
  collectedUniqueIds = new Set<string>();
  lastStoryLine: string | null = null;
  lastRadioText: string | null = null;
  autosaveRequested = false;
  noclip = false;
  private wasAtBase: boolean;
  private wasSonar = false;
  private wasTool = false;
  private lastBoostSignal = -1;
  private regionVisited = new Set<string>();
  private regionReentered = new Set<string>();
  private regionEntryTimes = new Map<string, number>();
  private prevRegion: string | null = null;
  // The ecology illusion layer (request §20, §63): bus signals are the only
  // cross-species channel — predators/kill/quiet are tagged `noise` signals
  // on the world-signal bus, and no creature reads global state or the player
  // directly. The school member list is fixed after construction (creatures
  // are immutable after spawn); the scratch slots are reused every frame
  // (request §34).
  private scheduledSignals: { time: number; signal: WorldSignal }[] = [];
  /** Sim time of the last PREDATOR_TAG emission (the tag refreshes at 1 Hz while hunting). */
  private lastPredatorSignal = -Infinity;
  private readonly schoolMembers: Creature[] = [];
  private lastKill: { prey: Creature; time: number } | null = null;
  private readonly ecologyScratch: WorldSignal[] = [];
  private readonly ecologyTarget = vec2(0, 0);
  private readonly flockOut = vec2(0, 0);
  private readonly desiredOut = vec2(0, 0);

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
    // The world-signal bus (the §63 perception seam) and the sonar system
    // (request §18), both owned by the simulation core (request §30).
    this.signals = new WorldSignalBus();
    const terrainPoints = world.chunks.flatMap((c) => c.terrain).flatMap((s) => s.points);
    const objects: SonarObject[] = this.nodes.map((n) => ({
      x: n.position.x,
      y: n.position.y,
      size: 1,
      resource: true,
    }));
    this.sonar = new SonarSystem(this.signals, terrainPoints, objects);
    // The encounter-trigger system (request §36): one state the sim owns (the
    // `storyFlags` array is shared so fired flags persist in the save), and the
    // current system (request §64) built from the world's authored fields.
    this.triggerState = emptyTriggerState();
    this.triggerState.storyFlags = this.storyFlags;
    this.triggers = new TriggerSystem(this.collectTriggers(), this.triggerState);
    this.currents = new CurrentSystem(world.currentFields ?? []);
    // The creatures (request §19, §30): authored per chunk (`creatureSpawns`),
    // resolved against the creature registry — an unknown id is an authored
    // world error and fails loudly (request §32 "all creature IDs resolve").
    const creatureRng = createRng((this.seed ^ 0x5eed) >>> 0);
    for (const chunk of this.chunks) {
      for (const spawn of chunk.creatureSpawns ?? []) {
        const def = CREATURE_BY_ID[spawn.creature];
        if (def === undefined) throw new Error(`unknown creature id: ${spawn.creature}`);
        const count = spawn.count ?? 1;
        for (let i = 0; i < count; i += 1) {
          this.creatures.push(new Creature(def, spawn.position, this.signals, creatureRng));
        }
      }
    }
    for (const c of this.creatures) {
      if (c.def.ecology?.school) this.schoolMembers.push(c);
    }
    this.wasAtBase = this.isAtBase(this.player.position);
    this.discoverChunksAt(this.player.position);
    this.activeChunks = computeActiveChunkIds(this.chunks, this.player.position);
    this.updateAmbientWork();
    this.prevRegion = chunkContaining(this.chunks, this.player.position)?.id ?? null;
  }

  /** Flatten every authored chunk trigger into one trigger set (request §36). */
  private collectTriggers(): import('../world/triggers').EncounterTrigger[] {
    return this.chunks.flatMap((c) => c.triggers ?? []);
  }

  /**
   * Emit a world-signal on the bus at a future sim time (request §20, §63):
   * the scheduling seam for event-driven signals the simulation itself
   * produces — a zone quiets before a scheduled major event (a `QUIET_TAG`
   * noise at the zone), a colossal event lands (a loud noise), and so on.
   * Emissions drain in time order during the creature step, so reactions
   * keyed to them fire the same step the signal lands.
   */
  scheduleSignal(time: number, signal: WorldSignal): void {
    this.scheduledSignals.push({ time, signal });
    this.scheduledSignals.sort((a, b) => a.time - b.time);
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
    this.applyCurrent(dt);
    this.emitPlayerSignals(input);
    if (input.sonar && !this.wasSonar && this.player.capabilities.has('sonar')) {
      this.sonar.fire(this.player.position, this.state.timeSec);
    }
    this.wasSonar = input.sonar;
    this.sonar.update(dt, this.state.timeSec);
    this.stepCreatures(dt);
    if (input.toolSelect !== null) this.controller.setToolIndex(input.toolSelect);
    if (!this.noclip) this.terrain.resolveCircle(this.player.position, PLAYER_RADIUS, this.player.velocity);
    this.handleHarvest(input);
    this.handleCraft(input);
    this.handleBaseReturn();
    this.handleDeath();
    this.updateProgression();
    this.updateActiveChunks();
    const fired = this.triggers.update(this.buildTriggerContext());
    if (fired.length > 0 && this.triggerState.radioText !== null) {
      this.lastRadioText = TRIGGER_RADIO_LINES[this.triggerState.radioText] ?? this.triggerState.radioText;
      this.lastStoryLine = this.lastRadioText;
    }
    // Consume one-shot actions so a reused input object does not re-apply them.
    input.craftRequest = null;
    input.toolSelect = null;
  }

  /**
   * The local current carries the player (request §64): a per-step position
   * offset of `current * (1 - control) * dt`. Without propulsion the player
   * resists little (a strong drift); with the mid-game `boost` mobility
   * upgrade they resist most of it, so the current is noticeably weaker.
   */
  private applyCurrent(dt: number): void {
    const cur = this.currents.velocityAt(this.player.position, this.state.timeSec);
    const speed = Math.hypot(cur.x, cur.y);
    if (speed < 1e-6) return;
    const control = this.player.capabilities.has('boost') ? CURRENT_CONTROL_WITH_PROPULSION : CURRENT_CONTROL_BASE;
    this.player.position.x += cur.x * (1 - control) * dt;
    this.player.position.y += cur.y * (1 - control) * dt;
  }

  /**
   * Advance every creature on the fixed step (request §30, §19): sense →
   * decide → steer, then resolve the creature's collision circles (the root
   * and its chain circles, request §31) against the real terrain. Creatures
   * deactivated by the offscreen cap (request §34) do nothing this step.
   * Audio transitions are collected as data for the browser adapter.
   *
   * The ecology illusion (request §20) runs alongside: scheduled bus signals
   * drain, hunting predators emit their tagged signals and register kills,
   * and after each update the data-driven reaction pass (`applyEcology`)
   * steers each ecology creature — flee, scavenge, quiet, school, current
   * orientation — purely from nearby bus signals and the current fields,
   * never from global state or the player (request §63).
   */
  private stepCreatures(dt: number): void {
    this.creatureAudioEvents.length = 0;
    const t = this.state.timeSec;
    this.drainScheduledSignals(t);
    this.emitPredatorSignals(t);
    for (const c of this.creatures) {
      c.update(dt, t, this.player.position);
      if (c.active && c.def.ecology !== undefined) this.applyEcology(c, dt, t);
      if (!this.noclip) {
        // The creature's collision circles (root + chain circles, request
        // §31) against the real terrain, like the player's.
        this.terrain.resolveCircle(c.position, c.def.body.radius, c.velocity);
        for (const chain of c.def.body.chainCircles ?? []) {
          const worldX = c.position.x + chain.offset.x;
          const worldY = c.position.y + chain.offset.y;
          const resolved = this.terrain.resolveCircle({ x: worldX, y: worldY }, chain.radius);
          c.position.x += resolved.x - worldX;
          c.position.y += resolved.y - worldY;
        }
      }
      if (c.lastTransition !== null) {
        const call = c.def.audio[c.lastTransition.to];
        if (call !== undefined) {
          this.creatureAudioEvents.push({ creatureId: c.def.id, state: c.lastTransition.to, call, time: t });
        }
        c.lastTransition = null;
      }
    }
    // The dense-medium drag (request §48): while the player is inside the
    // parting radius of a dense school's active member, the school damps the
    // player's speed by that species' `ecology.density` factor — swimming
    // through the school is harder than open water.
    const factor = this.denseMediumAt(this.player.position);
    this.denseMediumFactor = factor;
    if (factor < 1) {
      const drag = Math.exp(-Math.log(1 / factor) * dt);
      this.player.velocity.x *= drag;
      this.player.velocity.y *= drag;
    }
  }

  /** The densest `ecology.density` over active members within `PART_RADIUS` of `pos`, or 1. */
  private denseMediumAt(pos: Vec2): number {
    let factor = 1;
    for (const c of this.creatures) {
      const density = c.def.ecology?.density;
      if (c.active && density !== undefined && density < factor) {
        if (Math.hypot(c.position.x - pos.x, c.position.y - pos.y) < PART_RADIUS) factor = density;
      }
    }
    return factor;
  }

  /**
   * Emit the scheduled world signals whose sim time has come (request §20,
   * §63): event-driven signals the simulation itself produces (a zone quiets
   * before a scheduled major event, a colossal event lands) drain here in
   * time order and land on the bus, so reactions keyed to them fire the same
   * step the signal lands.
   */
  private drainScheduledSignals(t: number): void {
    while (this.scheduledSignals.length > 0 && this.scheduledSignals[0]!.time <= t) {
      const due = this.scheduledSignals.shift()!;
      this.signals.emit(due.signal, t);
    }
  }

  /**
   * The hunting side of the ecology (request §20): an active predator in a
   * hunting state (alert/stalk/attack) emits a tagged `PREDATOR_TAG` noise so
   * nearby schools and small fauna can flee it from the bus — no direct
   * references. Within kill distance of the nearest ambient prey the kill is
   * registered: a `KILL_TAG` noise lands at the prey (feeding scavenge) and
   * the prey is removed from the ambient pool, so a hunt is a bounded
   * event. Deterministic (request §61).
   */
  private emitPredatorSignals(t: number): void {
    let killed: Creature | null = null;
    for (const p of this.creatures) {
      if (!p.active || !p.def.combat || !this.isHuntingState(p.state)) continue;
      // Refresh the tag at most once a second: the 3 s signal lifetime keeps
      // it perceivable throughout a hunt without flooding the 64-slot pool.
      if (t - this.lastPredatorSignal >= 1.0) {
        this.lastPredatorSignal = t;
        this.signals.emit({ type: 'noise', pos: p.position, strength: PREDATOR_SIGNAL_STRENGTH, tag: PREDATOR_TAG }, t);
      }
      let nearest: Creature | null = null;
      let nearestDist = PREDATOR_ATTACK_RANGE;
      for (const o of this.creatures) {
        if (o === p || !o.active || o.dead || o.def.combat !== undefined) continue;
        const d = Math.hypot(o.position.x - p.position.x, o.position.y - p.position.y);
        if (d < nearestDist) {
          nearestDist = d;
          nearest = o;
        }
      }
      if (nearest !== null && nearestDist <= PREDATOR_KILL_DIST) {
        this.signals.emit({ type: 'noise', pos: nearest.position, strength: 1.0, tag: KILL_TAG }, t);
        nearest.dead = true;
        killed = nearest;
        this.lastKill = { prey: nearest, time: t };
      }
    }
    if (killed !== null) {
      const ci = this.creatures.indexOf(killed);
      if (ci >= 0) this.creatures.splice(ci, 1);
      const si = this.schoolMembers.indexOf(killed);
      if (si >= 0) this.schoolMembers.splice(si, 1);
    }
  }

  /** A predator's hunting states (combat §19): the signal side is on in any of them. */
  private isHuntingState(s: Creature['state']): boolean {
    return s === 'alert' || s === 'stalk' || s === 'attack';
  }

  /**
   * The per-creature data-driven reaction pass (request §20, §63): every
   * reaction is keyed to a nearby `WorldSignal` on the bus or an existing
   * field — no global state read, no direct player reference (the player
   * enters only through the school's own parting, §48). Priority is fixed:
   * flee beats scavenge, scavenge beats quiet, quiet beats schooling, and
   * the current orientation is the weakest nudge (filter feeder only). The
   * pass reuses scratch slots (request §34) and is cheap: bounded-radius bus
   * queries plus a local school scan (request §20 "cheap to run").
   */
  private applyEcology(c: Creature, dt: number, t: number): void {
    const eco = c.def.ecology;
    if (eco === undefined) return;
    const x = c.position.x;
    const y = c.position.y;
    const m = c.def.movement;
    const scratch = this.ecologyScratch;
    const out = this.ecologyTarget;

    // Flee the strongest nearby predator (small fauna, §20). A predator never
    // flees: the tag is emitted by predators (possibly itself), so the reaction
    // only applies to prey (no combat).
    if (
      c.def.combat === undefined &&
      fleeSignalStrength(this.signals, x, y, t, scratch) >= FLEE_THRESHOLD
    ) {
      if (strongestTaggedPos(this.signals, PREDATOR_TAG, x, y, t, FLEE_RADIUS, scratch, out)) {
        steerAway(c.position, c.velocity, out, m, dt);
      }
      return;
    }

    // Scavenge: approach the strongest recent kill (§20).
    if (eco.scavenge && scavengeSignalStrength(this.signals, x, y, t, scratch) >= SCAVENGE_THRESHOLD) {
      if (strongestTaggedPos(this.signals, KILL_TAG, x, y, t, SCAVENGE_RADIUS, scratch, out)) {
        steerToward(c.position, c.velocity, out, m, dt);
      }
      return;
    }

    // Quiet: hold before a scheduled major event (per-species tolerance).
    if (eco.quiet !== undefined && quietStrength(this.signals, x, y, t, scratch) >= eco.quiet) {
      settle(c.position, c.velocity, m, dt);
      return;
    }

    // Schooling: bounded-local flock with the player parting it (§20, §48).
    // The flock force is a normalized-ish direction; scaled to the
    // creature's max speed so the drag model in `steerVelocity` does the rest.
    if (eco.school && this.schoolMembers.length > 1) {
      flockForce(this.schoolMembers, c, this.player.position, this.flockOut);
      const fLen = Math.hypot(this.flockOut.x, this.flockOut.y);
      if (fLen > 1e-6) {
        const scale = m.maxSpeed / fLen;
        this.desiredOut.x = this.flockOut.x * scale;
        this.desiredOut.y = this.flockOut.y * scale;
        steerVelocity(c.position, c.velocity, this.desiredOut, m, dt);
      }
    }

    // Filter feeder: orient along the existing current field (§64) — the
    // weakest nudge, applied on top of anything above. Desired velocity
    // along the current, scaled to the creature's max speed.
    if (eco.filterFeeder) {
      const cur = this.currents.velocityAt(c.position, t);
      const speed = Math.hypot(cur.x, cur.y);
      if (speed > 4) {
        this.desiredOut.x = (cur.x / speed) * m.maxSpeed;
        this.desiredOut.y = (cur.y / speed) * m.maxSpeed;
        steerVelocity(c.position, c.velocity, this.desiredOut, m, dt);
      }
    }
  }

  /** The chunks fully active around the player (request §17 chunk streaming). */
  private updateActiveChunks(): void {
    this.activeChunks = computeActiveChunkIds(this.chunks, this.player.position);
    this.updateAmbientWork();
    const region = chunkContaining(this.chunks, this.player.position)?.id ?? null;
    const now = this.state.timeSec;
    if (region !== this.prevRegion) {
      if (region !== null && this.regionVisited.has(region)) this.regionReentered.add(region);
      if (region !== null) {
        this.regionVisited.add(region);
        if (!this.regionEntryTimes.has(region)) this.regionEntryTimes.set(region, now);
      }
      this.prevRegion = region;
    }
  }

  /**
   * Refresh the per-chunk ambient work budget from the active set (request
   * §17): each ACTIVE chunk allocates its authored ambient particle intensity
   * (the expensive per-chunk work — ambient particles now, creature AI in
   * WI-10); a far chunk is removed so that work is disabled. The render reads
   * `ambientIntensityAt` to size the ambient particle field, and the headless
   * activation test asserts far chunks carry no budget.
   */
  private updateAmbientWork(): void {
    for (const chunk of this.chunks) {
      if (this.activeChunks.has(chunk.id)) {
        this.ambientWork.set(chunk.id, chunk.ambient?.particleDensity ?? 0);
      } else {
        this.ambientWork.delete(chunk.id);
      }
    }
  }

  /**
   * The ambient work active near a point (request §17/§14.3): the sum of the
   * ambient budgets of the active chunks whose bounds come within a screen of
   * it. The render scales its ambient particle field by this, so a region with
   * no active chunk nearby carries no ambient work at all (the far-disabled
   * half of §17) and deeper bands (a sparser authored density) run fewer
   * particles.
   */
  ambientIntensityAt(pos: Vec2): number {
    let total = 0;
    for (const [id, intensity] of this.ambientWork) {
      const chunk = this.chunks.find((c) => c.id === id);
      if (chunk === undefined) continue;
      const b = chunk.bounds;
      const dx = Math.max(b.x - pos.x, 0, pos.x - (b.x + b.w));
      const dy = Math.max(b.y - pos.y, 0, pos.y - (b.y + b.h));
      if (Math.hypot(dx, dy) < 2000) total += intensity;
    }
    return total;
  }

  /** The player state the encounter-trigger conditions evaluate against (request §36). */
  private buildTriggerContext(): TriggerContext {
    return {
      position: this.player.position,
      depth: this.player.position.y < 0 ? -this.player.position.y : 0,
      time: this.state.timeSec,
      capabilities: this.player.capabilities,
      collectedItemIds: new Set(this.player.equipmentIds),
      // The scanner/codex (request §56) lands later; no objects are scanned yet.
      scannedObjectIds: new Set<string>(),
      storyFlags: new Set(this.storyFlags),
      hasEnteredRegion: (r) => this.regionVisited.has(r),
      regionTimeSeconds: (r) => (this.regionVisited.has(r) ? this.state.timeSec - (this.regionEntryTimes.get(r) ?? this.state.timeSec) : 0),
      hasReturnedThrough: (r) => this.regionReentered.has(r),
      creatureState: (creatureId) => this.creatures.find((c) => c.def.id === creatureId)?.state ?? null,
    };
  }

  /**
   * The player's noise signals onto the world-signal bus (request §63): a used
   * tool makes a noise blip, and a sustained boost makes a throttled noise
   * signal. Sonar emits its own sonar + noise signals (the `SonarSystem`).
   */
  private emitPlayerSignals(input: PlayerInput): void {
    const t = this.state.timeSec;
    const pos = this.player.position;
    if (input.useTool && !this.wasTool) {
      this.signals.emit({ type: 'noise', pos, strength: TOOL_NOISE_STRENGTH, tag: 'tool' }, t);
    }
    this.wasTool = input.useTool;
    if (
      input.boost &&
      this.player.capabilities.has('boost') &&
      t - this.lastBoostSignal >= BOOST_SIGNAL_INTERVAL
    ) {
      this.signals.emit({ type: 'noise', pos, strength: BOOST_NOISE_STRENGTH, tag: 'boost' }, t);
      this.lastBoostSignal = t;
    }
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
