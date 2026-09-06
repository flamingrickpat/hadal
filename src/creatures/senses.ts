/**
 * carries — the world-signal bus and the sense primitives creatures subscribe
 *   to (request §63, §19); solution — a pooled bus of short-lived
 *   environmental signals (`noise` / `light` / `sonar` / `injury`) that decay
 *   in time and distance, so a creature evaluates only nearby recent signals
 *   instead of referencing the player directly.
 *
 * archetype: information-holder (the §63 bus)
 * owns: the §63 `WorldSignal` type (reused verbatim, never cloned), the
 *   pooled active-signal list, and the spatial + temporal decay a creature
 *   perceives. `WorldSignalBus` is the single perception seam
 *   (ARCHITECTURE.md "Perception"): the player emits signals from tools,
 *   boost, and sonar; creatures (WI-10) subscribe by calling `perceive` /
 *   `queryNear`.
 * not own: rendering, the player state, or creature behavior — the
 *   simulation core emits the player signals, and creatures react in their
 *   own controllers (WI-10).
 * invariant: the signal pool is fixed-capacity and reused (no per-frame
 *   allocation, request §34); a signal is active only within
 *   `SIGNAL_LIFETIME` of its emission (request §63 "nearby recent signals"),
 *   and its perceived strength falls with both distance and age.
 * fails when: none — pure; an empty pool perceives all-zero channels.
 */
import { vec2, type Vec2 } from '../util/math';
import { distanceGain } from '../util/audio';

/** A sensory channel a creature may subscribe to (request §63, §19). */
export type SignalType = 'noise' | 'light' | 'sonar' | 'injury';

// The request §63 world-signal union, reused verbatim (never cloned).
export type WorldSignal =
  | { type: 'noise'; pos: Vec2; strength: number; tag: string }
  | { type: 'light'; pos: Vec2; strength: number; tag: string }
  | { type: 'sonar'; pos: Vec2; strength: number }
  | { type: 'injury'; pos: Vec2; strength: number };

/** A creature's aggregated perception of the bus at one position (request §63). */
export interface Percept {
  noise: number;
  light: number;
  sonar: number;
  injury: number;
}

// A signal's active lifetime (request §63 "nearby recent signals") and the
// reference distance at which a strength-1 signal is heard at ~0.25
// (reused from the audio distance mapping, request §27).
export const SIGNAL_LIFETIME = 3.0;
export const SIGNAL_RANGE_REF = 1500;

interface SignalSlot {
  type: SignalType;
  x: number;
  y: number;
  strength: number;
  tag: string;
  born: number;
  active: boolean;
}

/**
 * The §63 world-signal bus. Signals are pooled, expire after
 * `SIGNAL_LIFETIME`, and are perceived with spatial + temporal decay so a
 * creature near one reacts while a distant or stale one does not.
 */
export class WorldSignalBus {
  private readonly pool: SignalSlot[];
  private cursor = 0;

  constructor(capacity = 64) {
    this.pool = [];
    for (let i = 0; i < capacity; i += 1) {
      this.pool.push({ type: 'noise', x: 0, y: 0, strength: 0, tag: '', born: 0, active: false });
    }
  }

  /** Emit a signal onto the bus at sim `time` (writes a reused pooled slot). */
  emit(signal: WorldSignal, time: number): void {
    const slot = this.pool[this.cursor]!;
    slot.type = signal.type;
    slot.x = signal.pos.x;
    slot.y = signal.pos.y;
    slot.strength = signal.strength;
    slot.tag = signal.type === 'noise' || signal.type === 'light' ? signal.tag : '';
    slot.born = time;
    slot.active = true;
    this.cursor = (this.cursor + 1) % this.pool.length;
  }

  /** Expire signals older than `SIGNAL_LIFETIME` (call once per sim step). */
  update(time: number): void {
    for (const slot of this.pool) {
      if (slot.active && time - slot.born >= SIGNAL_LIFETIME) slot.active = false;
    }
  }

  /** A signal's perceived strength at `(x, y)`: spatial + temporal decay. */
  private perceived(slot: SignalSlot, x: number, y: number, time: number): number {
    const age = time - slot.born;
    if (age < 0 || age >= SIGNAL_LIFETIME) return 0;
    const temporal = 1 - age / SIGNAL_LIFETIME;
    const spatial = distanceGain(Math.hypot(slot.x - x, slot.y - y), SIGNAL_RANGE_REF);
    return slot.strength * temporal * spatial;
  }

  /**
   * A creature's perception at `(x, y)`: the summed perceived strength of the
   * nearby recent signals by channel (request §63, §19). Allocation-free —
   * fills the caller-provided `out`.
   */
  perceive(x: number, y: number, time: number, out: Percept): void {
    out.noise = 0;
    out.light = 0;
    out.sonar = 0;
    out.injury = 0;
    for (const slot of this.pool) {
      if (!slot.active) continue;
      const s = this.perceived(slot, x, y, time);
      if (s <= 0) continue;
      if (slot.type === 'noise') out.noise += s;
      else if (slot.type === 'light') out.light += s;
      else if (slot.type === 'sonar') out.sonar += s;
      else out.injury += s;
    }
  }

  /**
   * The nearby recent signals within `radius` of `(x, y)` (request §63): each
   * returned signal's `strength` is its perceived value at the query position.
   * Fills the caller-provided `out`; returns the count.
   */
  queryNear(x: number, y: number, radius: number, time: number, out: WorldSignal[]): number {
    let n = 0;
    for (const slot of this.pool) {
      if (!slot.active) continue;
      const d = Math.hypot(slot.x - x, slot.y - y);
      if (d > radius) continue;
      const s = this.perceived(slot, x, y, time);
      if (s <= 0) continue;
      out[n] = this.reconstruct(slot, s);
      n += 1;
    }
    return n;
  }

  private reconstruct(slot: SignalSlot, strength: number): WorldSignal {
    const pos = vec2(slot.x, slot.y);
    if (slot.type === 'noise' || slot.type === 'light') {
      return { type: slot.type, pos, strength, tag: slot.tag };
    }
    return { type: slot.type, pos, strength };
  }

  /** The number of currently active signals. */
  get size(): number {
    let n = 0;
    for (const slot of this.pool) if (slot.active) n += 1;
    return n;
  }
}
