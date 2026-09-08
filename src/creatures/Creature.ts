/**
 * problem — a creature needs to sense the world, decide what to do, and move
 *   on the fixed timestep without ever referencing the player (request §19,
 *   §63, §30); solution — a small class + state machine (`Creature`) that
 *   subscribes to the `WorldSignalBus`, runs a legal-transition state machine
 *   (or a bespoke per-species controller), steers with the shared model, and
 *   self-deactivates beyond a world distance (request §34).
 *
 * archetype: controller
 * trigger: `Simulation.step` calls `update(dt, time, focus)` once per fixed
 *   step for every creature, with the focus position (the player) only as a
 *   throttling distance — the creature never reads player state.
 * owns: one creature instance's state machine (`state`, `stateTime`), its
 *   perception of the bus (`percept`), its steering `target`, the flee
 *   reference point, and its active/deactivated flag (request §34).
 * coordinates: `WorldSignalBus` (senses, request §63), `steering.ts`
 *   (motion, request §6), the simulation (collision via
 *   `Terrain.resolveCircle`, request §31, and audio event collection,
 *   request §19 audio-as-data).
 * invariant: the generic engine only ever takes a `canTransition`-legal step
 *   (bespoke controllers are exempt — the hook is trusted, request §19); a
 *   deactivated creature does not tick at all (its state and position are
 *   frozen).
 * fails when: a bespoke controller writes an inconsistent state — there is
 *   no validation by design; the simulation throws only for unknown authored
 *   spawn ids.
 */
import { vec2, type Vec2 } from '../util/math';
import { FLEE_THRESHOLD, SCAVENGE_THRESHOLD, fleeSignalStrength, quietStrength, scavengeSignalStrength } from './ecology';
import { SIGNAL_RANGE_REF, WorldSignalBus, type Percept, type SignalType, type WorldSignal } from './senses';
import { CREATURE_STATES, type CreatureDef, type CreatureState } from './CreatureDef';
import { settle, steerAway, steerToward } from './steering';
import { CREATURE_AI_RANGE } from '../game/constants';

export interface CreatureAudioEvent {
  creatureId: string;
  state: CreatureState;
  call: string;
  time: number;
}

/** The default legal transitions between the generic states (request §19). */
export const DEFAULT_TRANSITIONS: Record<CreatureState, readonly CreatureState[]> = {
  idle: ['idle', 'forage', 'wander', 'investigate', 'alert', 'flee', 'interact', 'custom'],
  forage: ['idle', 'wander', 'investigate', 'alert', 'flee', 'interact', 'custom'],
  wander: ['idle', 'forage', 'investigate', 'alert', 'flee', 'interact', 'custom'],
  investigate: ['idle', 'wander', 'forage', 'alert', 'stalk', 'flee', 'attack', 'return', 'custom'],
  alert: ['investigate', 'stalk', 'attack', 'flee', 'return', 'custom'],
  stalk: ['investigate', 'alert', 'attack', 'flee', 'return', 'custom'],
  attack: ['stalk', 'flee', 'return', 'investigate', 'custom'],
  flee: ['return', 'custom'],
  return: ['idle', 'wander', 'forage', 'investigate', 'custom'],
  interact: ['idle', 'wander', 'forage', 'investigate', 'alert', 'flee', 'custom'],
  custom: CREATURE_STATES,
};

/** Whether the generic engine may move `from` → `to` (bespoke hooks may do any). */
export function canTransition(from: CreatureState, to: CreatureState): boolean {
  if (from === 'custom' || to === 'custom') return true;
  return DEFAULT_TRANSITIONS[from].includes(to);
}

// Behavior tuning (seconds / world units), shared by all generic creatures.
const INVESTIGATE_HOLD = 10; // dwell where the signal was before heading home
const WANDER_RETARGET_TIME = 8;
const REACH_DIST = 50;
const FLEE_SETTLE_TIME = 2; // a fled threat must stay quiet this long before returning
const FLEE_FADE_EPS = 0.1;
const PREDATOR_ALERT_TO_STALK = 1.5;
const STALK_GIVE_UP_TIME = 15;
const ATTACK_TIME = 2;

export class Creature {
  readonly def: CreatureDef;
  readonly home: Vec2;
  position: Vec2;
  velocity: Vec2 = vec2(0, 0);
  state: CreatureState;
  /** The current steering target (signal position, wander point, home, ...). */
  target: Vec2 | null = null;
  /** False while the AI is deactivated beyond the world distance cap (request §34). */
  active = true;
  /** True after a predator kill removes the creature from the ambient pool (§20). */
  dead = false;
  /**
   * The transition made this tick, so the simulation can emit the audio event
   * data (request §19); the simulation nulls it after consuming it.
   */
  lastTransition: { from: CreatureState; to: CreatureState; time: number } | null = null;
  /** The creature's current perception of the bus (request §63). */
  percept: Percept = { noise: 0, light: 0, sonar: 0, injury: 0 };
  private readonly bus: WorldSignalBus;
  private readonly rng: () => number;
  private stateTime = 0;
  private time = 0;
  private fleePoint: Vec2 | null = null;
  private readonly queryOut: WorldSignal[] = [];

  constructor(def: CreatureDef, spawn: Vec2, bus: WorldSignalBus, rng: () => number) {
    this.def = def;
    this.position = vec2(spawn.x, spawn.y);
    this.home = vec2(spawn.x, spawn.y);
    this.state = def.behavior.startState ?? 'wander';
    this.bus = bus;
    this.rng = rng;
  }

  /**
   * Enter `flee` steering away from `from` — the public seam bespoke
   * controllers (request §19) use to flee a sensed source the generic
   * engine would not (it `investigate`s plain noise).
   */
  fleeFrom(from: Vec2): void {
    this.fleePoint = from;
    this.setState('flee');
  }

  /** Set the state, recording the transition for audio emission (request §19). */
  setState(next: CreatureState): void {
    if (next === this.state) return;
    this.lastTransition = { from: this.state, to: next, time: this.time };
    this.state = next;
    this.stateTime = 0;
    if (next !== 'flee') this.fleePoint = null;
    if (next === 'idle' || next === 'wander' || next === 'forage') this.target = null;
  }

  /**
   * Advance one fixed step. `focus` is the AI-throttling center (the player's
   * position); it is used only for the deactivation distance (request §34,
   * §16 — a world distance, not a screen edge) — the creature reacts to
   * signals on the bus, never to the focus directly (request §63).
   */
  update(dt: number, time: number, focus: Vec2): void {
    const focusDist = Math.hypot(this.position.x - focus.x, this.position.y - focus.y);
    if (focusDist > CREATURE_AI_RANGE) {
      this.active = false;
      return;
    }
    this.active = true;
    this.time = time;
    this.stateTime += dt;
    this.bus.perceive(this.position.x, this.position.y, time, this.percept);
    const controller = this.def.behavior.controller;
    if (controller !== undefined) {
      // The bespoke per-species controller (request §19) owns the state
      // machine; it can set any state (including `custom`), the target, or
      // the velocity directly.
      controller(this, this.percept, dt);
    } else {
      this.genericReact();
      this.genericStateWork();
    }
    this.steer(dt);
  }

  /** The generic sense-driven transitions: the right state for the right signal. */
  private genericReact(): void {
    const s = this.percept;
    const thr = this.def.senses;
    const predator = this.def.combat !== undefined;
    const goNext = (to: CreatureState, pos: Vec2 | null): boolean => {
      if (!canTransition(this.state, to)) return false;
      this.setState(to);
      if (to === 'flee') this.fleePoint = pos ?? vec2(this.position.x, this.position.y);
      else this.target = pos ?? this.target;
      return true;
    };
    if (thr.injury !== undefined && s.injury >= thr.injury) {
      const pos = this.strongestPos('injury');
      if (predator) {
        if (this.state !== 'alert' && this.state !== 'stalk' && this.state !== 'attack') goNext('alert', pos);
      } else if (this.state !== 'flee') {
        goNext('flee', pos);
      }
      return;
    }
    const attention = Math.max(
      thr.noise !== undefined ? s.noise : 0,
      thr.light !== undefined ? s.light : 0,
      thr.sonar !== undefined ? s.sonar : 0,
    );
    const reacted =
      (thr.noise !== undefined && s.noise >= thr.noise) ||
      (thr.light !== undefined && s.light >= thr.light) ||
      (thr.sonar !== undefined && s.sonar >= thr.sonar);
    if (attention > 0 && reacted) {
      const pos =
        this.strongestPos('noise') ?? this.strongestPos('light') ?? this.strongestPos('sonar');
      if (predator) {
        if (this.state === 'idle' || this.state === 'forage' || this.state === 'wander' || this.state === 'investigate') {
          goNext('alert', pos);
        }
      } else {
        if (this.state === 'idle' || this.state === 'forage' || this.state === 'wander') {
          goNext('investigate', pos);
        } else if (this.state === 'investigate' && pos !== null) {
          this.target = pos; // a fresh signal re-targets the investigation
        }
      }
    }
  }

  /** The generic state behaviors: retargeting, escalation, fades, and returns. */
  private genericStateWork(): void {
    const home = this.home;
    switch (this.state) {
      case 'wander': {
        const wanderRadius = this.def.behavior.wanderRadius ?? 400;
        const reached = this.target !== null && Math.hypot(this.target.x - this.position.x, this.target.y - this.position.y) < REACH_DIST;
        if (this.target === null || reached || this.stateTime > WANDER_RETARGET_TIME) {
          this.target = vec2(home.x + (this.rng() - 0.5) * 2 * wanderRadius, home.y + (this.rng() - 0.5) * 2 * wanderRadius);
        }
        break;
      }
      case 'forage':
        if (this.target === null) this.target = vec2(home.x, home.y);
        break;
      case 'investigate':
        if (this.stateTime > INVESTIGATE_HOLD) this.setState('return');
        break;
      case 'alert':
        if (this.stateTime > PREDATOR_ALERT_TO_STALK) this.setState('stalk');
        break;
      case 'stalk':
        if (this.target !== null && Math.hypot(this.target.x - this.position.x, this.target.y - this.position.y) < REACH_DIST) {
          this.setState('attack');
        } else if (this.stateTime > STALK_GIVE_UP_TIME) {
          this.setState('return');
        }
        break;
      case 'attack':
        if (this.stateTime > ATTACK_TIME) this.setState('return');
        break;
      case 'flee': {
        const dist = this.fleePoint !== null ? Math.hypot(this.position.x - this.fleePoint.x, this.position.y - this.fleePoint.y) : 0;
        const range = this.def.behavior.fleeRange ?? 1200;
        if (dist > range || (this.stateTime > FLEE_SETTLE_TIME && this.threatFaded())) {
          this.setState('return');
        }
        break;
      }
      case 'return':
        if (this.target === null) this.target = vec2(home.x, home.y);
        if (Math.hypot(home.x - this.position.x, home.y - this.position.y) < REACH_DIST) {
          this.setState(this.def.behavior.startState ?? 'wander');
        }
        break;
      default:
        break; // idle / interact / custom: hold position (steer settles)
    }
  }

  /** Steer per the current state; `steer` is the single owner of motion. */
  private steer(dt: number): void {
    const pos = this.position;
    const vel = this.velocity;
    const m = this.def.movement;
    // Hold before a major event (request §20, §63): when a quiet-tagged
    // signal on the bus reaches this species' `ecology.quiet` tolerance,
    // state-driven steering is suppressed this step and the animal stays
    // put — even mid-stalk. Motion reactions (flee/scavenge) are layered on
    // by the sim's ecology pass after this, preserving their priority over
    // the hold.
    const eco = this.def.ecology;
    if (
      eco !== undefined &&
      eco.quiet !== undefined &&
      quietStrength(this.bus, pos.x, pos.y, this.time, this.queryOut) >= eco.quiet
    ) {
      return;
    }
    // Flee hold (request §20, §63): when a predator-tagged signal on the bus
    // is loud enough for the ecology flee reaction, state-driven steering is
    // suppressed this step so it cannot steer the prey back toward the
    // predator while the sim's ecology pass steers it away (same pattern as
    // the quiet hold). Predators (combat) never hold for their own tag.
    if (
      this.def.combat === undefined &&
      fleeSignalStrength(this.bus, pos.x, pos.y, this.time, this.queryOut) >= FLEE_THRESHOLD
    ) {
      return;
    }
    // Scavenge hold (request §20, §63): when a scavenger has a loud kill-tagged
    // signal nearby, state-driven steering — its generic `investigate` of the
    // loudest noise, which often points at the predator that made the kill —
    // is suppressed this step so the sim's ecology pass steers it toward the
    // kill unopposed (same pattern as the flee hold).
    if (
      eco !== undefined &&
      eco.scavenge === true &&
      scavengeSignalStrength(this.bus, pos.x, pos.y, this.time, this.queryOut) >= SCAVENGE_THRESHOLD
    ) {
      return;
    }
    // Filter-feeder hold (request §20, §64): a filter feeder's motion is owned
    // by the sim's ecology pass, which orients it along the local current
    // field. Its generic forage/wander steering settles velocity toward home
    // every step and would undo that nudge, so it is suppressed entirely —
    // the feeder drifts wherever the current carries it (same pattern as the
    // other ecology holds).
    if (eco !== undefined && eco.filterFeeder === true) {
      return;
    }
    switch (this.state) {
      case 'wander':
      case 'forage':
      case 'investigate':
      case 'alert':
      case 'stalk':
      case 'attack':
      case 'return':
        if (this.target !== null) steerToward(pos, vel, this.target, m, dt);
        else settle(pos, vel, m, dt);
        break;
      case 'flee':
        if (this.fleePoint !== null) steerAway(pos, vel, this.fleePoint, m, dt);
        else settle(pos, vel, m, dt);
        break;
      default:
        settle(pos, vel, m, dt);
    }
  }

  /** True when every subscribed channel reads below the fade threshold. */
  private threatFaded(): boolean {
    const s = this.percept;
    const thr = this.def.senses;
    if (thr.noise !== undefined && s.noise >= FLEE_FADE_EPS) return false;
    if (thr.light !== undefined && s.light >= FLEE_FADE_EPS) return false;
    if (thr.sonar !== undefined && s.sonar >= FLEE_FADE_EPS) return false;
    if (thr.injury !== undefined && s.injury >= FLEE_FADE_EPS) return false;
    return true;
  }

  /**
   * The strongest signal of one channel within the sense range, or null —
   * queried on transitions by the generic engine, and per-frame by bespoke
   * controllers (request §19) to find a source; the per-signal allocation in
   * `queryNear` stays off the hot path (request §34).
   */
  strongestPos(type: SignalType): Vec2 | null {
    const range = this.def.senses.range ?? SIGNAL_RANGE_REF;
    const n = this.bus.queryNear(this.position.x, this.position.y, range, this.time, this.queryOut);
    let best = -1;
    let bestPos: WorldSignal | null = null;
    for (let i = 0; i < n; i++) {
      const sig = this.queryOut[i];
      if (sig !== undefined && sig.type === type && sig.strength > best) {
        best = sig.strength;
        bestPos = sig;
      }
    }
    return bestPos === null ? null : vec2(bestPos.pos.x, bestPos.pos.y);
  }
}
