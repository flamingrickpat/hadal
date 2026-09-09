/**
 * problem — creature behavior is data-driven, so every species needs one
 *   authored definition (body, movement, senses, behavior, optional
 *   combat/ecology, audio) and a shared state vocabulary (request §19);
 *   solution — the `CreatureDef` schema the runtime (request §63 senses,
 *   §31 body) is built from, kept as plain data so defs stay inspectable and
 *   serializable.
 *
 * archetype: information-holder
 * owns: the creature definition schema (request §19 interface, verbatim
 *   shape) and the runtime-state vocabulary (`idle`, `forage`, `wander`,
 *   `investigate`, `alert`, `stalk`, `attack`, `flee`, `return`, `interact`,
 *   `custom`), the section 10 size-class and signature-rule vocabularies
 *   (request §10, carried by the def), plus the bespoke-controller hook type
 *   (request §19 "major organisms can have bespoke controllers").
 * not own: no runtime behavior — `Creature` advances instances,
 *   `steering.ts` moves them, `senses.ts` provides the channels.
 * invariant: defs are plain data (no methods, no hidden state); audio is a
 *   state → call-name mapping the sim emits and the browser adapter
 *   consumes, never synthesized here.
 * fails when: a def omits `audio` (required by request §19) — TypeScript,
 *   not this file, enforces it.
 */
import type { Vec2 } from '../util/math';
import type { Percept } from './senses';
import type { Creature } from './Creature';

/** The runtime states a generic creature controller can be in (request §19). */
export type CreatureState =
  | 'idle'
  | 'forage'
  | 'wander'
  | 'investigate'
  | 'alert'
  | 'stalk'
  | 'attack'
  | 'flee'
  | 'return'
  | 'interact'
  | 'custom';

export const CREATURE_STATES: readonly CreatureState[] = [
  'idle',
  'forage',
  'wander',
  'investigate',
  'alert',
  'stalk',
  'attack',
  'flee',
  'return',
  'interact',
  'custom',
];

/**
 * The section 10 damage-model size classes (request §10 "Damage model"):
 * small fauna kill quickly, medium predators kill at a cost, large predators
 * are detered rather than killed. Every def carries exactly one class — the
 * `DAMAGE_MODEL` table in `combat.ts` resolves a harpoon hit from it.
 */
export type CreatureSizeClass = 'small' | 'medium' | 'large';

export const SIZE_CLASSES: readonly CreatureSizeClass[] = ['small', 'medium', 'large'];

/**
 * The section 10 "predator fairness" signature-rule categories: the readable
 * rule a player learns by observation (request §10 — the list is examples,
 * "not exact secret species designs", so the private roster also contributes
 * the two categories it needs beyond the request's nine:
 * `cornered-charge` (dangerous only when cornered) and `herds-prey` (a
 * non-chase hunt that drives another species into a harvestable field).
 */
export type SignatureRule =
  | 'reacts-motion'
  | 'reacts-light'
  | 'reacts-sonar'
  | 'attacks-from-cover'
  | 'territory'
  | 'follows-blood'
  | 'attacks-noise'
  | 'mistakes-tool-signals'
  | 'dangerous-only-in-company'
  | 'cornered-charge'
  | 'herds-prey';

/**
 * The section 11.1 roster minimums an organism covers, as data (private
 * roster; request §11.1). The behavior these minimums describe is realized
 * by the per-predator controllers (WI-03c1b); this field is the data-level
 * encoding the roster checks read.
 */
export type RosterMinimum =
  | 'dangerous-phase-not-scary-phase'
  | 'harmless-with-second-behavior'
  | 'exploitable-relationship'
  | 'non-chase-predator';

/** A segment of a long body's collision chain (request §31 chain circles). */
export interface ChainCircle {
  /** Offset from the creature root position, in world units. */
  offset: Vec2;
  radius: number;
}

export interface CreatureBodyDef {
  /** The root hit circle (request §31). */
  radius: number;
  /** Chain circles for long bodies; the root plus these collide (request §31). */
  chainCircles?: readonly ChainCircle[];
}

export interface MovementDef {
  /** Terminal speed in world units/sec (request §6 motion feel). */
  maxSpeed: number;
  /** Thrust acceleration toward the desired velocity, units/sec². */
  accel: number;
  /** Exponential drag rate, 1/sec — the same model as the player (request §6). */
  dragRate: number;
}

/**
 * The sense channels a creature subscribes to, as reaction thresholds on the
 * perceived signal strength (request §19, §63). A channel with no threshold
 * is not subscribed; a creature only ever evaluates nearby recent signals via
 * the bus, never the player directly.
 */
export interface SenseDef {
  noise?: number;
  light?: number;
  sonar?: number;
  injury?: number;
  /** How far (world units) the creature queries the bus for signals. */
  range?: number;
}

/**
 * The bespoke per-species controller hook (request §19): when present it
 * replaces the generic sense-driven transitions — it reads the creature's
 * `percept`, and sets state (any state, including `custom`), `target`, or
 * `velocity`. A 120-line custom controller is clearer than forcing it through
 * the generic machine, so the hook is first-class.
 */
export type CreatureController = (creature: Creature, percept: Percept, dt: number) => void;

export interface BehaviorDef {
  /** The state the creature starts in (default `wander`). */
  startState?: CreatureState;
  /** Wander targets are picked within this radius of home (default 400). */
  wanderRadius?: number;
  /** Flee until this far from the threat (default 1200). */
  fleeRange?: number;
  /** The bespoke per-species controller (request §19). */
  controller?: CreatureController;
}

export interface CombatDef {
  /** Damage per attack; the presence of `combat` makes the creature a predator. */
  damage: number;
}

export interface EcologyDef {
  /** A schooling type reacts as a group member (request §20, §11). */
  school: boolean;
  /** Approaches recent kill signals tagged `KILL_TAG` (request §20 scavenge). */
  scavenge?: boolean;
  /**
   * Hides (holds) while a `QUIET_TAG` signal's perceived strength is at or
   * above this threshold (request §20: zones quiet before major events).
   */
  quiet?: number;
  /** Orients along the local current field while feeding (request §20, §64). */
  filterFeeder?: boolean;
  /**
   * A dense school: while the player is within the school's parting radius of
   * an active member, the player's speed is damped by this factor (request
   * §48: swimming through the school is harder than open water).
   */
  density?: number;
}

/**
 * Audio is data, not synthesis: a mapping of state → call name that the
 * simulation emits as an event when a creature enters that state; the browser
 * audio adapter consumes the events (request §19, §27).
 */
export type CreatureAudioDef = Partial<Record<CreatureState, string>>;

/** One authored creature species (request §19 `CreatureDef`, verbatim shape). */
export interface CreatureDef {
  id: string;
  body: CreatureBodyDef;
  movement: MovementDef;
  senses: SenseDef;
  behavior: BehaviorDef;
  combat?: CombatDef;
  ecology?: EcologyDef;
  audio: CreatureAudioDef;
  /** The section 10 size class: the `DAMAGE_MODEL` resolves a harpoon hit from it. */
  sizeClass: CreatureSizeClass;
  /**
   * The section 10 signature-rule categories this species carries (request
   * §10 "predator fairness": every predator needs at least one readable rule).
   * The per-predator controllers read these; neutral fauna carry none.
   */
  rules?: readonly SignatureRule[];
  /** The section 11.1 minimums the private roster assigns this organism (data only). */
  minimums?: readonly RosterMinimum[];
}
