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
 *   production world starts at `PLAYER_START` with starter gear; non-
 *   targetable presences (request §10) are never selected as harpoon or
 *   predator-kill targets.
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
  FULL_BODY_VIEW_RANGE,
  HP_MAX,
  INTERACT_RADIUS,
  PLAYER_RADIUS,
  SONAR_MASSIVE_REF,
  TOOL_NOISE_STRENGTH,
} from '../game/constants';
import { GameState } from '../game/GameState';
import type { SaveGameV1 } from '../game/save';
import { findItem } from '../content/items';
import { RECIPE_BY_ID } from '../content/recipes';
import { BASE_RETURN_LINES, TRIGGER_RADIO_LINES } from '../content/dialogue';
import { applyStarterGear, HARPOON } from '../player/equipment';
import { Player } from '../player/Player';
import { PlayerController, type PlayerInput } from '../player/PlayerController';
import { createCargo } from '../player/inventory';
import { canCraft, applyEquipment, type CraftResult } from '../systems/CraftingSystem';
import { WorldSignalBus, type WorldSignal } from '../creatures/senses';
import { Creature, type CreatureAudioEvent } from '../creatures/Creature';
import { bodyExtent } from '../creatures/CreatureDef';
import { CREATURE_BY_ID } from '../creatures/fixtures';
import { DETER_HOLD_SECONDS, HARPOON_RANGE, resolveHarpoonHit } from '../creatures/combat';
import {
  FLEE_RADIUS,
  FLEE_THRESHOLD,
  KILL_TAG,
  PREDATOR_ATTACK_RANGE,
  PREDATOR_KILL_DIST,
  PREDATOR_SIGNAL_STRENGTH,
  PREDATOR_TAG,
  PART_RADIUS,
  QUIET_TAG,
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

// Tier-2 interaction tuning (request §21 — the mid-depth useful/neutral
// fauna; WI-03b1). Each value is the single number that makes one signature
// rule hold headlessly; the rules themselves live in `applyTier2Interactions`.
const T08_TRADE_MATERIAL = 'salvage';
const T08_TRADE_GIVE = 1; // carried units the player must hand over
const T08_TRADE_YIELD = 2; // banked units the player receives
const T09_HERD_RADIUS = 450; // how far the herder's herding reach extends
const T09_HERD_DRIFT = 0.6; // fraction of the local current a herded member rides
const T10_SEEK_RADIUS = 400; // how far a sweeper will seek a node to work
const T10_ACQ_RADIUS = 250; // within this the sweeper is "working" the node
const T10_WORK_SECONDS = 20; // a full sweep takes this long to expose yield
const T10_BOOST = 2; // a finished sweep exposes this much extra yield
const T11_LIFT_RADIUS = 250; // the pocket's lift reach
const T11_LIFT_ACCEL = 30; // upward (toward-surface) accel on a nearby player
const T27_RIDE_RADIUS = 150; // the chain's ride reach
const T27_RIDE_SPEED = 35; // westward position drift on a nearby player (units/s)
// T-31's depth-tiered drift speed (units/s along the lane axis): the one
// constant maxSpeed cannot express three cruising speeds, so the depth tier
// sets the drift directly (request §30).
const T31_SHALLOW_DRIFT = 55; // y > -500
const T31_MID_DRIFT = 30; // -500..-1500
const T31_DEEP_DRIFT = 8; // y < -1500

// ---- Tier-3 per-predator rules (WI-03c1b, request §10, §19) ----------------
// The controllers (hiddenCreatures.ts) pin the rest state; the signature
// rules resolve here against the player and the ambient pool — the same
// simulation-side pattern as the tier-2 interactions, because the controller
// hook cannot see either.
const T14_NET_RADIUS = 260; // the set net's reach from the post
const T14_ARM_TIME = 8; // a loud cue keeps the net set for this long (s)
const T14_SNAP_COOLDOWN = 10; // after a snap, the net reset before the next (s)
const T14_DRAG_DIST = 220; // the snap drags the intruder out this far
const T15_CORNERED_NOISE = 0.35; // perceived noise this loud = a loud corner
const T15_BURST_TIME = 1.2; // one visible burst (s)
const T15_REST_TIME = 1.6; // the rest between bursts (s)
const T15_CHARGE_TIME = 1.2; // the cornered charge is one bounded dash (s)
const T15_CHARGE_COOLDOWN = 6; // the stand-down after a charge (s)
const T15_CONTACT_RADIUS = 80; // the charge hits within this
const T16_WAKE_NOISE = 0.4; // perceived noise this loud = a loud pass close
const T16_STRIKE_TIME = 1.5; // the expanding net stays open (s)
const T16_NET_RADIUS = 110; // the expanding net's reach
const T16_STRIKE_COOLDOWN = 12; // the buried reset after a strike (s)
const T17_SILK_RADIUS = 150; // the silk's reach around the frame
const T17_SILK_TIME = 2.5; // the set silk stays live (s)
const T17_SILK_COOLDOWN = 8; // the re-set after the silk drops (s)
const T17_SILK_SLOW_RATE = 3; // per-second player velocity damping in silk
const T18_DRIVE_RADIUS = 600; // how far the herder drives schooling prey
const T18_DRIVE_SPEED = 45; // the drive toward the field (units/s, §64 drift)
const T18_FIELD_RADIUS = 150; // the harvestable field around the herder

// ---- Tier-4 colossal-presence rules (WI-03d1, request §52, §20, §10) ------
// The section 52 simulation-side half: speed mismatch (F) comes from the
// defs' data (large maxSpeed against a huge body span); the fauna-first
// environment reaction (D) and the sonar-scale signal (E) resolve here. Each
// value is the single number that makes one signature rule hold headlessly.
// The plume's own collision body keeps a diver at ~390 from its center on
// this approach path, so the disturbance radius must sit outside that.
const T19_AVOID_RADIUS = 440; // inside this, the plume closes (the player disturbs it)
const T19_RETURN_RADIUS = 620; // the plume unfurls again once the player is this far
const T20_PULSE_PERIOD = 6; // the fixed-point pulse period (s)
const T20_RIDE_RADIUS = 1200; // how far the pulse organ's current reaches
const T20_PUSH_SPEED = 90; // the pulsing current's peak carry (units/s)
const T22_CREAK_PERIOD = 8; // a creaking step every this long (s)
const T22_CREAK_STEP = 12; // each creaking step shifts the structure this far (units)
const T23_START_RANGE = 2500; // the crossing starts when a diver is this near (units)
// The fauna-announcement radius is the designed reaction range: twice the
// sight range, so local fauna are reacting well before the presence can be
// seen (section 20, technique D).
const T23_ANNOUNCE_RADIUS = 2400;
const T23_ANNOUNCE_REFRESH = 2.5; // the announcement signals refresh this often (s)
const T23_BEAT_PERIOD = 3; // the heartbeat inside the view, once per this long (s)
const T25_RECONFIG_PERIOD = 7; // the plate cluster reconfigures once per this long (s)

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
  /** The MacGuffin position in the hadal zone (found from world data). */
  macguffinPosition: import('../util/math').Vec2 | null = null;
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
  // Tier-2 per-creature working state (request §21): the film sweeper's
  // accumulated sweep time per node and the nodes it has already finished.
  // Creatures are stable objects, so keying by instance is safe.
  private readonly tier2Sweep = new Map<Creature, { work: number; finished: Set<string> }>();
  // Per-creature working state for the tier-3 signature rules (request §30):
  // the arm/strike window end, the next-trigger time (cooldown), the one-hit
  // flag per window, and the T-15 burst phase. Creature instances are stable,
  // so keying by instance is safe (same as `tier2Sweep`).
  private readonly tier3 = new Map<Creature, { until: number; ready: number; hit: boolean; burstUntil: number; resting: boolean; n: number }>();
  // The T-18 driven prey: small schooling members currently herded into its
  // field, so they can be collected there and released back to wander later.
  private readonly tier3Driven = new Set<Creature>();
  // Per-creature working state for the tier-4 signature rules (WI-03d1):
  // the next cycle time (`next` — creak/reconfig/announce refresh), the
  // next heartbeat (`beat`), and whether the crossing has been released
  // (`started`). Creature instances are stable, so keying by instance is
  // safe (same as `tier3`).
  private readonly tier4 = new Map<Creature, { next: number; beat: number; started: boolean }>();

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
    // The world-signal bus (the §63 perception seam), both owned by the
    // simulation core (request §30).
    this.signals = new WorldSignalBus();
    // The creatures (request §19, §30): authored per chunk (`creatureSpawns`),
    // resolved against the creature registry — an unknown id is an authored
    // world error and fails loudly (request §32 "all creature IDs resolve").
    // Built before the sonar system: the colossal presences register as
    // massive sonar objects (request §18, §52 technique E).
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
    // The sonar system (request §18): resource nodes plus every non-targetable
    // presence, whose sonar `size` scales with the body span — a huge body
    // returns a far larger, slower echo (WI-03d1, technique E).
    const terrainPoints = world.chunks.flatMap((c) => c.terrain).flatMap((s) => s.points);
    const objects: SonarObject[] = this.nodes.map((n) => ({
      x: n.position.x,
      y: n.position.y,
      size: 1,
      resource: true,
    }));
    for (const c of this.creatures) {
      if (c.def.nonTargetable !== true) continue;
      objects.push({
        x: c.position.x,
        y: c.position.y,
        size: Math.max(1, bodyExtent(c.def) / SONAR_MASSIVE_REF),
        resource: false,
      });
    }
    this.sonar = new SonarSystem(this.signals, terrainPoints, objects);
    // The encounter-trigger system (request §36): one state the sim owns (the
    // `storyFlags` array is shared so fired flags persist in the save), and the
    // current system (request §64) built from the world's authored fields.
    this.triggerState = emptyTriggerState();
    this.triggerState.storyFlags = this.storyFlags;
    this.triggers = new TriggerSystem(this.collectTriggers(), this.triggerState);
    this.currents = new CurrentSystem(world.currentFields ?? []);
    // Locate the MacGuffin prop in the world data (internal id only, request §0/§12/§68).
    for (const chunk of world.chunks) {
      for (const prop of chunk.props ?? []) {
        if (prop.id === 'macguffin') {
          this.macguffinPosition = vec2(prop.position.x, prop.position.y);
          break;
        }
      }
      if (this.macguffinPosition !== null) break;
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
   * The sim's visibility state for a colossal presence (WI-03d1, request §52):
   * true only when the player currently has a clean full-body view — the
   * ENTIRE body (root plus chain circles) is within `FULL_BODY_VIEW_RANGE`.
   * Headless stand-in for the no-clean-view floor; the renderer and the
   * crossing scenario read it. Pure geometry on the current state — no
   * allocation (request §34).
   */
  hasCleanFullBody(c: Creature): boolean {
    const p = this.player.position;
    let far = Math.hypot(c.position.x - p.x, c.position.y - p.y) + c.def.body.radius;
    for (const chain of c.def.body.chainCircles ?? []) {
      const cx = c.position.x + chain.offset.x;
      const cy = c.position.y + chain.offset.y;
      const d = Math.hypot(cx - p.x, cy - p.y) + chain.radius;
      if (d > far) far = d;
    }
    return far <= FULL_BODY_VIEW_RANGE;
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
    // The harpoon's rising edge must be captured before `emitPlayerSignals`
    // updates `wasTool` (the tool noise and the lance share the edge).
    const toolFired = input.useTool && !this.wasTool;
    this.emitPlayerSignals(input);
    if (input.sonar && !this.wasSonar && this.player.capabilities.has('sonar')) {
      this.sonar.fire(this.player.position, this.state.timeSec);
    }
    this.wasSonar = input.sonar;
    this.sonar.update(dt, this.state.timeSec);
    // One-shot actions resolve before the world steps, so a slot select in the
    // same step as a tool use aims the new tool.
    if (input.toolSelect !== null) this.controller.setToolIndex(input.toolSelect);
    this.stepCreatures(dt);
    if (toolFired) this.fireHarpoon();
    this.applyTier2Interactions(input, dt);
    this.applyTier3Interactions(input, dt);
    this.applyTier4Interactions(dt);
    if (!this.noclip) this.terrain.resolveCircle(this.player.position, PLAYER_RADIUS, this.player.velocity);
    this.handleHarvest(input);
    this.handleMacguffinRetrieval(input);
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
    // Authored background-creature moves (request §36): a fired beat's
    // `moveBackgroundCreature` action repositions the organism for its
    // entrance; the next creature step applies terrain + ecology from there.
    for (const move of this.triggerState.movedCreatures) {
      const c = this.creatures.find((x) => x.def.id === move.creatureId);
      if (c !== undefined) {
        c.position = vec2(move.to.x, move.to.y);
        c.velocity = vec2(0, 0);
      }
    }
    this.triggerState.movedCreatures.length = 0;
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
        // A non-targetable presence is never prey: no kill path (request §10,
        // WI-03d1).
        if (o === p || !o.active || o.dead || o.def.combat !== undefined || o.def.nonTargetable === true) continue;
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

  /**
   * The tier-2 signature interactions (request §21, WI-03b1), resolved
   * against the player's real input and inventory each step. These are the
   * useful/neutral fauna rules the generic state machine cannot express:
   * the feeding trade (T-08) fires on `interact`, the herder (T-09) drives
   * the nearest congregation along the local current, the film sweeper
   * (T-10) works a node until a finished sweep exposes more yield, the
   * gas-pocket (T-11) gives a nearby player a passive lift, and the living
   * cable (T-27) carries a nearby player along its axis. None is hostile and
   * none mocks a rule — every one runs through this production simulation.
   */
  private applyTier2Interactions(input: PlayerInput, dt: number): void {
    const p = this.player;
    const t = this.state.timeSec;
    if (input.interact) {
      const feeder = this.nearestCreatureOf('T-08', p.position, INTERACT_RADIUS);
      if (feeder !== null) this.doT08Trade();
    }
    for (const c of this.creatures) {
      if (!c.active) continue;
      const id = c.def.id;
      if (id === 'T-09') this.herdT09(c, dt, t);
      else if (id === 'T-10') this.sweepT10(c, dt);
      else if (id === 'T-11') this.liftT11(c, dt);
      else if (id === 'T-27') this.rideT27(c, dt);
      else if (id === 'T-31') this.driftT31(c, dt);
    }
  }

  /**
   * The depth-tiered drift (T-31, request §11.1): the same organism cruises
   * fastest near the surface, slower in mid-water, and barely at all in the
   * deep. Applied as a position drift along the lane axis (the sanctioned
   * mechanism for current/herd/ride motion, request §64) so a headless
   * observer measures three distinct straight-line speeds from one species.
   */
  private driftT31(c: Creature, dt: number): void {
    const y = c.position.y;
    const speed = y > -500 ? T31_SHALLOW_DRIFT : y > -1500 ? T31_MID_DRIFT : T31_DEEP_DRIFT;
    c.position.x -= speed * dt;
  }

  /** The tier-3 per-predator signature rules (WI-03c1b, request §10, §19). */
  private applyTier3Interactions(input: PlayerInput, dt: number): void {
    for (const c of this.creatures) {
      if (!c.active) continue;
      const id = c.def.id;
      if (id === 'T-14') this.t14Post(c);
      else if (id === 'T-15') this.t15Burst(c);
      else if (id === 'T-16') this.t16Boulder(c);
      else if (id === 'T-17') this.t17Silk(c, dt);
      else if (id === 'T-18') this.t18Herd(c, input, dt);
    }
  }

  /** The tier-3 per-creature working state (created on first use). */
  private tier3State(c: Creature): { until: number; ready: number; hit: boolean; burstUntil: number; resting: boolean; n: number } {
    let st = this.tier3.get(c);
    if (st === undefined) {
      st = { until: 0, ready: 0, hit: false, burstUntil: 0, resting: false, n: 0 };
      this.tier3.set(c, st);
    }
    return st;
  }

  /**
   * The territorial post (T-14, request §10: territory without long chase —
   * the non-chase signature): a loud cue at or above the def's sense
   * thresholds (sonar or tool noise) sets a silent capture net that holds
   * the post; an intruder in the net's reach is hit once and dragged out.
   * The drag is recoverable, not lethal — a large predator that is deterable
   * (the section 10 deter holds the whole rule, including the arming).
   */
  private t14Post(c: Creature): void {
    const t = this.state.timeSec;
    const st = this.tier3State(c);
    if (t < c.deterredUntil) {
      if (c.state !== 'idle') {
        c.setState('idle');
        c.target = null;
      }
      return;
    }
    if (c.state === 'alert') {
      if (t >= st.until) {
        c.setState('idle');
        c.target = null;
        return;
      }
      const p = this.player.position;
      const d = Math.hypot(p.x - c.position.x, p.y - c.position.y);
      if (t >= st.ready && d <= T14_NET_RADIUS) {
        const nx = d > 1e-6 ? (p.x - c.position.x) / d : 1;
        const ny = d > 1e-6 ? (p.y - c.position.y) / d : 0;
        p.x += nx * T14_DRAG_DIST;
        p.y += ny * T14_DRAG_DIST;
        this.player.health = Math.max(0, this.player.health - c.def.combat!.damage);
        c.setState('idle');
        c.target = null;
        st.until = 0;
        st.ready = t + T14_SNAP_COOLDOWN;
      }
      return;
    }
    const s = c.percept;
    const thr = c.def.senses;
    if (t >= st.ready && ((thr.sonar !== undefined && s.sonar >= thr.sonar) || (thr.noise !== undefined && s.noise >= thr.noise))) {
      c.setState('alert');
      st.until = t + T14_ARM_TIME;
    }
  }

  /**
   * The burst interceptor (T-15, request §10: cornered-charge): it cruises
   * in visible bursts (a dash, then a rest) hunting the ambient swarms, and
   * is dangerous to the player only in a loud corner — one bounded charge,
   * one hit, then a stand-down. It never chases: a corner that stays silent,
   * or stays at range, never triggers it.
   */
  private t15Burst(c: Creature): void {
    const t = this.state.timeSec;
    const st = this.tier3State(c);
    if (c.state === 'attack') {
      if (!st.hit && Math.hypot(c.position.x - this.player.position.x, c.position.y - this.player.position.y) <= T15_CONTACT_RADIUS) {
        this.player.health = Math.max(0, this.player.health - c.def.combat!.damage);
        st.hit = true;
      }
      if (t >= st.until) {
        c.setState('idle');
        c.target = null;
        st.resting = true;
        st.burstUntil = t + T15_CHARGE_COOLDOWN;
      }
      return;
    }
    if (t >= st.ready && c.percept.noise >= T15_CORNERED_NOISE) {
      c.setState('attack');
      c.target = c.strongestPos('noise') ?? vec2(c.position.x, c.position.y);
      st.until = t + T15_CHARGE_TIME;
      st.hit = false;
      st.resting = true;
      st.burstUntil = t + T15_CHARGE_TIME + T15_CHARGE_COOLDOWN;
      st.ready = t + T15_CHARGE_TIME + T15_CHARGE_COOLDOWN;
      return;
    }
    if (st.resting) {
      if (t >= st.burstUntil) {
        st.resting = false;
        st.n += 1;
        const ang = st.n * 2.4;
        c.setState('wander');
        // setState clears the target for the ambient states — the burst point
        // must be set after the transition, not before.
        c.target = vec2(c.home.x + Math.cos(ang) * 320, c.home.y + Math.sin(ang) * 220);
        st.burstUntil = t + T15_BURST_TIME;
      } else {
        c.setState('idle');
        c.target = null;
      }
    } else if (t >= st.burstUntil) {
      st.resting = true;
      st.burstUntil = t + T15_REST_TIME;
      c.setState('idle');
      c.target = null;
    }
  }

  /**
   * The buried boulder (T-16, request §10: attacks-from-cover — its
   * dangerous phase is not the phase it presents): it sits inert in the
   * floor and wakes on a loud pass close in; the strike is one expanding
   * net, one hit, then a long buried reset. Silence passes unharmed.
   */
  private t16Boulder(c: Creature): void {
    const t = this.state.timeSec;
    const st = this.tier3State(c);
    if (t < c.deterredUntil) {
      if (c.state !== 'idle') {
        c.setState('idle');
        c.target = null;
      }
      return;
    }
    if (c.state === 'custom') {
      if (!st.hit && Math.hypot(c.position.x - this.player.position.x, c.position.y - this.player.position.y) <= T16_NET_RADIUS) {
        this.player.health = Math.max(0, this.player.health - c.def.combat!.damage);
        st.hit = true;
      }
      if (t >= st.until) {
        c.setState('idle');
        st.ready = t + T16_STRIKE_COOLDOWN;
      }
      return;
    }
    if (t >= st.ready && c.percept.noise >= T16_WAKE_NOISE) {
      c.setState('custom');
      st.until = t + T16_STRIKE_TIME;
      st.hit = false;
    }
  }

  /**
   * The silk colony (T-17, request §10: territory + attacks-noise): a loud
   * pass at or above its def's noise sense trips the silk around its frame —
   * a slow plus one snag while it is set — and the silk re-sets after the
   * cooldown, so the same rule holds again.
   */
  private t17Silk(c: Creature, dt: number): void {
    const t = this.state.timeSec;
    const st = this.tier3State(c);
    if (c.state === 'custom') {
      const d = Math.hypot(c.position.x - this.player.position.x, c.position.y - this.player.position.y);
      if (d <= T17_SILK_RADIUS) {
        const damp = Math.exp(-T17_SILK_SLOW_RATE * dt);
        this.player.velocity.x *= damp;
        this.player.velocity.y *= damp;
        if (!st.hit) {
          this.player.health = Math.max(0, this.player.health - c.def.combat!.damage);
          st.hit = true;
        }
      }
      if (t >= st.until) {
        c.setState('idle');
        st.ready = t + T17_SILK_COOLDOWN;
      }
      return;
    }
    const thr = c.def.senses.noise;
    if (thr !== undefined && t >= st.ready && c.percept.noise >= thr) {
      c.setState('custom');
      st.until = t + T17_SILK_TIME;
      st.hit = false;
    }
  }

  /**
   * The field herder (T-18, request §11.1: herds-prey, exploitable
   * relationship): it drives nearby small schooling prey into a field around
   * itself and never attacks the player; a player at the field collects a
   * driven member for a salvage unit. Prey that drift out of the reach go
   * back to their own wandering.
   */
  private t18Herd(c: Creature, input: PlayerInput, dt: number): void {
    for (const o of this.creatures) {
      if (o === c || !o.active || o.dead || o.def.combat !== undefined) continue;
      if (o.def.ecology?.school !== true) continue;
      const d = Math.hypot(o.position.x - c.position.x, o.position.y - c.position.y);
      if (d <= T18_DRIVE_RADIUS) {
        this.tier3Driven.add(o);
        // A position drift toward the field, the sanctioned mechanism for
        // herd/ride motion (request §64): steering through the member's own
        // state machine would fight its schooling cohesion and stall.
        const inv = d > 1e-6 ? 1 / d : 0;
        o.position.x += (c.position.x - o.position.x) * inv * T18_DRIVE_SPEED * dt;
        o.position.y += (c.position.y - o.position.y) * inv * T18_DRIVE_SPEED * dt;
      } else if (this.tier3Driven.has(o)) {
        this.tier3Driven.delete(o);
      }
    }
    if (!input.interact) return;
    let best: Creature | null = null;
    let bestD = INTERACT_RADIUS;
    for (const o of this.creatures) {
      if (!this.tier3Driven.has(o) || !o.active || o.dead) continue;
      if (Math.hypot(o.position.x - c.position.x, o.position.y - c.position.y) > T18_FIELD_RADIUS) continue;
      const pd = Math.hypot(o.position.x - this.player.position.x, o.position.y - this.player.position.y);
      if (pd <= bestD) {
        bestD = pd;
        best = o;
      }
    }
    if (best === null) return;
    this.giveResources('salvage', 1);
    best.dead = true;
    const ci = this.creatures.indexOf(best);
    if (ci >= 0) this.creatures.splice(ci, 1);
    const si = this.schoolMembers.indexOf(best);
    if (si >= 0) this.schoolMembers.splice(si, 1);
    this.tier3Driven.delete(best);
  }

  /** The tier-4 colossal-presence signature rules (WI-03d1, request §52, §20, §10). */
  private applyTier4Interactions(dt: number): void {
    for (const c of this.creatures) {
      if (!c.active) continue;
      const id = c.def.id;
      if (id === 'T-19') this.t19Plume(c);
      else if (id === 'T-20') this.t20Pulse(c, dt);
      else if (id === 'T-22') this.t22Creak(c);
      else if (id === 'T-23') this.t23Crossing(c);
      else if (id === 'T-25') this.t25Reconfig(c);
    }
  }

  /** The tier-4 per-creature working state (created on first use). */
  private tier4State(c: Creature): { next: number; beat: number; started: boolean } {
    let st = this.tier4.get(c);
    if (st === undefined) {
      st = { next: 0, beat: 0, started: false };
      this.tier4.set(c, st);
    }
    return st;
  }

  /**
   * The plume organism (T-19, request §10 "dangerous-looking-but-safe"):
   * the player's suit close enough to disturb the plume closes it and the
   * organism drifts off — a non-lethal, non-combative response — and once
   * the player stands away it returns home and unfurls. The generic engine
   * would `investigate` the approach, so the whole rule lives here.
   */
  private t19Plume(c: Creature): void {
    const p = this.player.position;
    const d = Math.hypot(c.position.x - p.x, c.position.y - p.y);
    if (c.state === 'flee') {
      if (d > T19_RETURN_RADIUS) c.setState('return');
      return;
    }
    if (c.state === 'return') {
      c.target = vec2(c.home.x, c.home.y);
      if (Math.hypot(c.home.x - c.position.x, c.home.y - c.position.y) < 80) c.setState('forage');
      return;
    }
    if (d <= T19_AVOID_RADIUS) c.fleeFrom(p); // the plume closes; it drifts off
  }

  /**
   * The fixed-point pulse organ (T-20): on each pulse it stamps one `custom`
   * step (the sub-bass audio, drained next step) and emits a tagged bus
   * signal, so the pulse is audible from far beyond sight range; a player
   * inside the ride radius is carried away from the organ by the pulsing
   * current it drives (request §64 position drift, the sanctioned mechanism
   * for current/ride motion). The pulse phase is deterministic in the sim
   * time — no per-creature phase state.
   */
  private t20Pulse(c: Creature, dt: number): void {
    const t = this.state.timeSec;
    const p = this.player.position;
    const d = Math.hypot(c.position.x - p.x, c.position.y - p.y);
    if (d <= T20_RIDE_RADIUS && d > 1) {
      const nx = (p.x - c.position.x) / d;
      const ny = (p.y - c.position.y) / d;
      const pulse = (Math.sin((t / T20_PULSE_PERIOD) * Math.PI * 2) + 1) / 2;
      const control = this.player.capabilities.has('boost') ? CURRENT_CONTROL_WITH_PROPULSION : CURRENT_CONTROL_BASE;
      const push = T20_PUSH_SPEED * pulse * (1 - control);
      p.x += nx * push * dt;
      p.y += ny * push * dt;
    }
    if (t % T20_PULSE_PERIOD < dt) {
      c.setState('custom'); // the sub-bass pulse (audio, drained next step)
      this.signals.emit({ type: 'noise', pos: c.position, strength: 1.0, tag: 'pulse' }, t);
    }
  }

  /**
   * The living landmark (T-22, request §11.1 scale misread): the structure
   * is still except for slow creaking steps — a bounded position shift plus
   * one `custom` step (the creak audio) on a period. Terrain-read holds
   * because a creaking shift is a small fraction of the body span.
   */
  private t22Creak(c: Creature): void {
    const t = this.state.timeSec;
    const st = this.tier4State(c);
    if (t < st.next) return;
    st.next = t + T22_CREAK_PERIOD;
    c.position.x += T22_CREAK_STEP;
    c.setState('custom'); // the creak (audio, drained next step)
  }

  /**
   * The crossing presence (T-23, request §20, §52 technique D): the crossing
   * holds at the lane start until a diver is near, then runs its lane.
   * While it is inside the announcement window (far from the player but
   * approaching) it refreshes the environment-reaction signals at its own
   * position — the flee + quiet tags the local fauna react to — and emits
   * NOTHING of its own; its heartbeat (`custom` step, audio) starts only
   * inside the clean-view range. So in a headless trace the fauna reaction
   * strictly precedes any direct sight or sound evidence. Technique F
   * (speed mismatch) is the def's data: large world distance per second,
   * small body-lengths per second.
   */
  private t23Crossing(c: Creature): void {
    const t = this.state.timeSec;
    const st = this.tier4State(c);
    const p = this.player.position;
    const d = Math.hypot(c.position.x - p.x, c.position.y - p.y);
    if (!st.started) {
      if (d < T23_START_RANGE) {
        st.started = true;
        c.setState('forage'); // release the crossing (the controller takes the lane)
      }
      return;
    }
    if (d > FULL_BODY_VIEW_RANGE && d <= T23_ANNOUNCE_RADIUS) {
      if (t >= st.next) {
        st.next = t + T23_ANNOUNCE_REFRESH;
        // The environment reaction (D): local fauna flee and the zone quiets.
        this.signals.emit({ type: 'noise', pos: c.position, strength: PREDATOR_SIGNAL_STRENGTH, tag: PREDATOR_TAG }, t);
        this.signals.emit({ type: 'noise', pos: c.position, strength: 1.0, tag: QUIET_TAG }, t);
      }
    } else if (d <= FULL_BODY_VIEW_RANGE) {
      if (t >= st.beat) {
        st.beat = t + T23_BEAT_PERIOD;
        c.setState('custom'); // the heartbeat loudening (audio, drained next step)
      }
    }
  }

  /**
   * The headless plate cluster (T-25): it rides the local current via the
   * shared filter-feeder orientation (request §20, §64 — the sim's ecology
   * pass owns the drift), and reconfigures on a period — one `custom` step
   * (the clink audio, drained next step). The reconfigure is a brief settle,
   * so the cluster stalls for a beat before the current re-takes it.
   */
  private t25Reconfig(c: Creature): void {
    const t = this.state.timeSec;
    const st = this.tier4State(c);
    if (t >= st.next) {
      st.next = t + T25_RECONFIG_PERIOD;
      c.setState('custom'); // the clink (audio, drained next step)
    }
  }

  /** The nearest active creature of `id` within `radius` of `pos`, or null. */
  private nearestCreatureOf(id: string, pos: Vec2, radius: number): Creature | null {
    let best: Creature | null = null;
    let bestD = radius;
    for (const c of this.creatures) {
      if (!c.active || c.def.id !== id) continue;
      const d = Math.hypot(c.position.x - pos.x, c.position.y - pos.y);
      if (d <= bestD) {
        bestD = d;
        best = c;
      }
    }
    return best;
  }

  /**
   * The feeding trade (T-08, request §21): one carried salvage unit in, two
   * banked out. It fires only while the player actually carries a unit to
   * give (carried first, then banked), so there is nothing to "press E to
   * befriend" — the material is the whole contract.
   */
  private doT08Trade(): void {
    const p = this.player;
    const mat = T08_TRADE_MATERIAL;
    if ((p.inventory[mat] ?? 0) + (p.banked[mat] ?? 0) < T08_TRADE_GIVE) return;
    let left = T08_TRADE_GIVE;
    const fromCarried = Math.min(p.inventory[mat] ?? 0, left);
    p.inventory[mat] = (p.inventory[mat] ?? 0) - fromCarried;
    if (p.inventory[mat] <= 0) delete p.inventory[mat];
    left -= fromCarried;
    if (left > 0) {
      p.banked[mat] = (p.banked[mat] ?? 0) - left;
      if (p.banked[mat] <= 0) delete p.banked[mat];
    }
    p.banked[mat] = (p.banked[mat] ?? 0) + T08_TRADE_YIELD;
    this.updateCargo();
  }

  /**
   * The herder (T-09, request §21): it drives toward the nearest
   * congregation (T-03) and herds the members near it along the local
   * current. Following the herder leads a player down the lane — the
   * signature is a guide, not a predator.
   */
  private herdT09(herder: Creature, dt: number, t: number): void {
    let nearest: Creature | null = null;
    let nearestD = Infinity;
    for (const m of this.creatures) {
      if (!m.active || m.def.id !== 'T-03') continue;
      const d = Math.hypot(m.position.x - herder.position.x, m.position.y - herder.position.y);
      if (d < nearestD) {
        nearestD = d;
        nearest = m;
      }
    }
    if (nearest === null) return;
    herder.target = vec2(nearest.position.x, nearest.position.y);
    const cur = this.currents.velocityAt(herder.position, t);
    for (const m of this.creatures) {
      if (!m.active || m.def.id !== 'T-03') continue;
      const d = Math.hypot(m.position.x - herder.position.x, m.position.y - herder.position.y);
      if (d <= T09_HERD_RADIUS) {
        m.position.x += cur.x * T09_HERD_DRIFT * dt;
        m.position.y += cur.y * T09_HERD_DRIFT * dt;
      }
    }
  }

  /**
   * The film sweeper (T-10, request §21): it seeks a node and, once within
   * working range, accrues sweep time; a finished sweep (once per node)
   * exposes more yield on that node. The "not before" half holds because the
   * accrual starts only while it is actually at the node.
   */
  private sweepT10(c: Creature, dt: number): void {
    let node: ResourceNode | null = null;
    let nodeD = T10_SEEK_RADIUS;
    for (const n of this.nodes) {
      if (n.harvested) continue;
      const d = Math.hypot(n.position.x - c.position.x, n.position.y - c.position.y);
      if (d <= nodeD) {
        nodeD = d;
        node = n;
      }
    }
    if (node === null) {
      c.target = null;
      return;
    }
    c.target = vec2(node.position.x, node.position.y);
    if (nodeD > T10_ACQ_RADIUS) return; // seeking, not yet working
    let st = this.tier2Sweep.get(c);
    if (st === undefined) {
      st = { work: 0, finished: new Set() };
      this.tier2Sweep.set(c, st);
    }
    if (st.finished.has(node.id)) return;
    st.work += dt;
    if (st.work >= T10_WORK_SECONDS) {
      node.amount += T10_BOOST;
      st.finished.add(node.id);
      st.work = 0;
    }
  }

  /**
   * The gas-pocket lift (T-11, request §21): a player drifting inside the
   * pocket's reach gets a steady upward (toward-surface) nudge — a passive
   * lift that costs nothing and needs no input.
   */
  private liftT11(c: Creature, dt: number): void {
    const p = this.player;
    const d = Math.hypot(c.position.x - p.position.x, c.position.y - p.position.y);
    if (d <= T11_LIFT_RADIUS) p.velocity.y += T11_LIFT_ACCEL * dt;
  }

  /**
   * The living-cable ride (T-27, request §21): a player inside the chain's
   * reach is carried along its axis (west) as a position drift — the same
   * mechanism the local current uses on the player (request §64), so a
   * headless player moves with no input.
   */
  private rideT27(c: Creature, dt: number): void {
    const p = this.player;
    const d = Math.hypot(c.position.x - p.position.x, c.position.y - p.position.y);
    if (d <= T27_RIDE_RADIUS) p.position.x -= T27_RIDE_SPEED * dt;
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
      creatureDistance: (creatureId) => {
        const c = this.creatures.find((x) => x.def.id === creatureId);
        if (c === undefined) return null;
        return Math.hypot(c.position.x - this.player.position.x, c.position.y - this.player.position.y);
      },
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

  /**
   * The player's harpoon (request §10 "combat philosophy"): on a tool rising
   * edge with the harpoon selected, the shot lances the nearest active
   * creature within `HARPOON_RANGE` — the same radius-based interaction model
   * harvesting uses — and resolves the hit against the section 10 damage
   * model by the creature's size class: small fauna die on one hit, medium
   * predators on the last of the table's cost, and large predators never die
   * — the hit resolves as a deter (a bounded stand-down window plus a
   * withdraw for a creature mid-hunt). Nothing here is an HP model: the
   * table carries costs, and creatures expose no hp data (request §10 "never
   * put an HP bar over a leviathan").
   */
  private fireHarpoon(): void {
    if (this.player.selectedTool !== HARPOON.name) return;
    const t = this.state.timeSec;
    const pos = this.player.position;
    let target: Creature | null = null;
    let bestD = HARPOON_RANGE;
    for (const c of this.creatures) {
      // Non-targetable presences (request §10, WI-03d1) are never selected:
      // no hit, no deter, no kill path.
      if (!c.active || c.dead || c.def.nonTargetable === true) continue;
      const d = Math.hypot(c.position.x - pos.x, c.position.y - pos.y);
      if (d <= bestD) {
        bestD = d;
        target = c;
      }
    }
    if (target === null) return; // a whiff: the noise blip is the whole effect
    const res = resolveHarpoonHit(target.def.sizeClass, target.harpoonHits);
    target.harpoonHits = res.hits;
    if (res.outcome === 'kill') {
      // The same removal a predator kill performs (§20 ambient pool).
      target.dead = true;
      const ci = this.creatures.indexOf(target);
      if (ci >= 0) this.creatures.splice(ci, 1);
      const si = this.schoolMembers.indexOf(target);
      if (si >= 0) this.schoolMembers.splice(si, 1);
    } else if (res.outcome === 'deter') {
      target.deterredUntil = t + DETER_HOLD_SECONDS;
      if (this.isHuntingState(target.state)) {
        // A mid-hunt deter withdraws: clear the stale stalk target so the
        // `return` state heads for the creature's home, not the last signal.
        target.setState('return');
        target.target = null;
      }
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

  /**
   * The MacGuffin retrieval interaction rule (WI-05a): the player must swim to
   * the MacGuffin's location and press interact within the interaction radius.
   * The MacGuffin's true nature is private (internal id only, request §0/§12/§68).
   * Retrieval adds the MacGuffin item to the player's equipment, which triggers
   * the collectItem trigger for the post-retrieval environmental change (request §23/§45).
   */
  private handleMacguffinRetrieval(input: PlayerInput): void {
    if (this.macguffinPosition === null) return;
    if (!input.interact) return;
    // Check if already retrieved (the 'macguffin' equipment id is already in the list).
    if (this.player.equipmentIds.includes('macguffin')) return;
    // Distance check: must be within interact radius.
    const d = Math.hypot(
      this.macguffinPosition.x - this.player.position.x,
      this.macguffinPosition.y - this.player.position.y,
    );
    if (d > INTERACT_RADIUS) return;
    // Retrieved: add the MacGuffin item to the player's equipment.
    this.player.equipmentIds.push('macguffin');
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
    // Restore in place: the constructor shared this array with the trigger
    // state (triggerState.storyFlags = this.storyFlags) so fired flags persist
    // in the save; re-assigning here would orphan trigger-set flags on the
    // live load path (Game.ts constructs, then loads).
    this.storyFlags.length = 0;
    this.storyFlags.push(...save.world.storyFlags);
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
