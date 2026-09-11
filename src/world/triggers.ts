/**
 * problem — authored set pieces must fire data-driven conditions (region,
 *   depth, upgrade, ...) into actions on the fixed step (request §36);
 *   solution — a small `TriggerSystem` controller that evaluates each
 *   `EncounterTrigger`'s `TriggerCondition` against a player context and
 *   applies its `TriggerAction`s to a mutable world state, once or per step.
 *
 * archetype: controller
 * trigger: the simulation calls `update(context)` each fixed step (request §30).
 * owns: the set of authored `EncounterTrigger`s and the mutable `TriggerState`
 *   the actions write (story flags, active entities, locked paths, ambient,
 *   radio/camera/timed events, and the authored background-creature moves the
 *   simulation consumes), plus the `fired` set that keeps a `once` trigger
 *   from re-firing (request §36, §70 "cannot fire twice").
 * coordinates: the player context (`TriggerContext`) the simulation builds each
 *   step — position, depth, capabilities, collected/scanned ids, the region
 *   queries (entered / time-in / returned-through), and the roster-creature
 *   queries (state and distance, for the approach/creatureState conditions).
 * not own: the player or the simulation; it reads a context and writes a state
 *   the simulation owns.
 * invariant: a `once` trigger fires at most once across all steps; a non-`once`
 *   trigger fires at most once per step; `update` is deterministic in
 *   (context, prior state, fired set).
 * fails when: a `once` trigger's condition is re-satisfied — it does not re-fire.
 */
import type { Capability } from '../player/equipment';
import { vec2, type Vec2 } from '../util/math';

/** A trigger condition the player's state can satisfy (request §36). */
export type TriggerCondition =
  | { type: 'enterRegion'; region: string }
  | { type: 'reachDepth'; depth: number }
  | { type: 'possessUpgrade'; capability: Capability }
  | { type: 'scanObject'; objectId: string }
  | { type: 'collectItem'; itemId: string }
  | { type: 'creatureState'; creatureId: string; state: string }
  | { type: 'timeInRegion'; region: string; seconds: number }
  | { type: 'returnThrough'; region: string }
  | { type: 'approachCreature'; creatureId: string; radius: number }
  | { type: 'storyFlag'; flag: string }
  | { type: 'reachPoint'; x: number; y: number; radius: number };

/** A trigger action applied to the world state (request §36). */
export type TriggerAction =
  | { type: 'spawnEntity'; entityId: string }
  | { type: 'despawnEntity'; entityId: string }
  | { type: 'playAudio'; cueId: string }
  | { type: 'alterAmbient'; params: Record<string, number> }
  | { type: 'moveBackgroundCreature'; creatureId: string; to: Vec2 }
  | { type: 'lockPath'; pathId: string; locked: boolean }
  | { type: 'showRadio'; textId: string }
  | { type: 'camera'; modifier: string }
  | { type: 'timedEvent'; event: string; seconds: number }
  | { type: 'setStoryFlag'; flag: string };

/** The §36 authored encounter trigger. */
export interface EncounterTrigger {
  id: string;
  once: boolean;
  condition: TriggerCondition;
  actions: TriggerAction[];
}

/** The player state a trigger condition is evaluated against. */
export interface TriggerContext {
  position: Vec2;
  depth: number;
  time: number;
  capabilities: ReadonlySet<Capability>;
  collectedItemIds: ReadonlySet<string>;
  scannedObjectIds: ReadonlySet<string>;
  storyFlags: ReadonlySet<string>;
  hasEnteredRegion: (region: string) => boolean;
  regionTimeSeconds: (region: string) => number;
  hasReturnedThrough: (region: string) => boolean;
  creatureState: (creatureId: string) => string | null;
  /** The player-to-creature distance for a roster id, or null when absent. */
  creatureDistance: (creatureId: string) => number | null;
}

/** The mutable world state trigger actions write. */
export interface TriggerState {
  storyFlags: string[];
  activeEntities: Set<string>;
  lockedPaths: Set<string>;
  ambient: Record<string, number>;
  radioText: string | null;
  cameraModifier: string | null;
  audioCues: string[];
  timedEvents: Map<string, number>;
  /** Authored background-creature moves awaiting consumption by the simulation. */
  movedCreatures: { creatureId: string; to: Vec2 }[];
}

export function emptyTriggerState(): TriggerState {
  return {
    storyFlags: [],
    activeEntities: new Set(),
    lockedPaths: new Set(),
    ambient: {},
    radioText: null,
    cameraModifier: null,
    audioCues: [],
    timedEvents: new Map(),
    movedCreatures: [],
  };
}

function conditionMet(c: TriggerCondition, ctx: TriggerContext): boolean {
  switch (c.type) {
    case 'enterRegion':
      return ctx.hasEnteredRegion(c.region);
    case 'reachDepth':
      return ctx.depth >= c.depth;
    case 'possessUpgrade':
      return ctx.capabilities.has(c.capability);
    case 'scanObject':
      return ctx.scannedObjectIds.has(c.objectId);
    case 'collectItem':
      return ctx.collectedItemIds.has(c.itemId);
    case 'creatureState':
      return ctx.creatureState(c.creatureId) === c.state;
    case 'timeInRegion':
      return ctx.hasEnteredRegion(c.region) && ctx.regionTimeSeconds(c.region) >= c.seconds;
    case 'returnThrough':
      return ctx.hasReturnedThrough(c.region);
    case 'approachCreature': {
      // The minimal addition for the east-end beat (WI-04a): the deep-strip
      // region is subsumed by the deeper band's region (first-match chunk
      // containment), and a roster organism's state is not position-gated, so
      // "the player reached this organism" is not expressible with the §36 set.
      const d = ctx.creatureDistance(c.creatureId);
      return d !== null && d <= c.radius;
    }
    case 'storyFlag':
      return ctx.storyFlags.has(c.flag);
    case 'reachPoint': {
      const d = Math.hypot(c.x - ctx.position.x, c.y - ctx.position.y);
      return d <= c.radius;
    }
  }
}

function applyAction(a: TriggerAction, state: TriggerState): void {
  switch (a.type) {
    case 'spawnEntity':
      state.activeEntities.add(a.entityId);
      break;
    case 'despawnEntity':
      state.activeEntities.delete(a.entityId);
      break;
    case 'playAudio':
      state.audioCues.push(a.cueId);
      break;
    case 'alterAmbient':
      for (const [k, v] of Object.entries(a.params)) state.ambient[k] = v;
      break;
    case 'moveBackgroundCreature':
      state.movedCreatures.push({ creatureId: a.creatureId, to: vec2(a.to.x, a.to.y) });
      break;
    case 'lockPath':
      if (a.locked) state.lockedPaths.add(a.pathId);
      else state.lockedPaths.delete(a.pathId);
      break;
    case 'showRadio':
      state.radioText = a.textId;
      break;
    case 'camera':
      state.cameraModifier = a.modifier;
      break;
    case 'timedEvent':
      state.timedEvents.set(a.event, a.seconds);
      break;
    case 'setStoryFlag':
      state.storyFlags.push(a.flag);
      break;
  }
}

/**
 * Evaluates the authored triggers against the player context each step and
 * fires the ones whose condition is met (request §36). A `once` trigger fires
 * at most once; a non-`once` trigger fires at most once per step.
 */
export class TriggerSystem {
  readonly state: TriggerState;
  private readonly fired = new Set<string>();

  constructor(
    private readonly triggers: readonly EncounterTrigger[],
    state?: TriggerState,
  ) {
    this.state = state ?? emptyTriggerState();
  }

  /** The trigger ids that have fired (for `once` dedup). */
  get firedIds(): ReadonlySet<string> {
    return this.fired;
  }

  /** Evaluate every trigger; fire the met ones. Returns the ids fired this step. */
  update(ctx: TriggerContext): string[] {
    const firedNow: string[] = [];
    for (const t of this.triggers) {
      if (t.once && this.fired.has(t.id)) continue;
      if (!conditionMet(t.condition, ctx)) continue;
      for (const a of t.actions) applyAction(a, this.state);
      this.fired.add(t.id);
      firedNow.push(t.id);
    }
    return firedNow;
  }
}
