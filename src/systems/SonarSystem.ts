/**
 * emits — the sonar active-scan pulse: the expanding world ring, the brief
 *   outline tags it stamps on nearby terrain and major objects, the short-lived
 *   echo particles, the transient resource signatures, and the sonar + noise
 *   world signals creatures perceive (request §18, §63).
 *
 * archetype: service-provider
 * owns: the sonar ring state (origin + expanding radius), the pooled echo-tag /
 *   resource-signature targets (each records `lastHit` for the brief outline,
 *   request §18), the pooled short-lived echo particles, and the emission of
 *   the sonar + noise signals onto the world-signal bus.
 * not own: rendering the ring / echoes / tags (the browser render layer), the
 *   world-signal bus itself (`creatures/senses`), or the player — the
 *   simulation owns the bus and drives this system on the Q press.
 * invariant: the target and echo pools are fixed-capacity and reused (no
 *   per-frame allocation, request §34); the ring expands from the origin to
 *   `SONAR_RANGE` then deactivates; tags and echoes are transient (the sonar
 *   is never a permanent minimap, request §18); larger objects return
 *   larger/slower pulses (request §18).
 * fails when: none — the pools are fixed and only ever rewritten.
 */
import { vec2, type Vec2 } from '../util/math';
import {
  ECHO_LIFE,
  MASSIVE_FLASH_SCALE,
  SIGNATURE_TIME,
  SONAR_ECHO_BAND,
  SONAR_ECHO_STEP,
  SONAR_NOISE_STRENGTH,
  SONAR_RANGE,
  SONAR_RING_SPEED,
  SONAR_SIGNAL_STRENGTH,
  TAG_FLASH_TIME,
} from '../game/constants';
import type { WorldSignalBus } from '../creatures/senses';

/** A major object the sonar can tag: a resource node or (later) a creature. */
export interface SonarObject {
  x: number;
  y: number;
  /** 1 = a normal object; larger = massive (returns a larger/slower pulse). */
  size: number;
  /** true for a resource node (marked with a longer signature). */
  resource: boolean;
}

/** A sonar target: a terrain point or major object, with its last hit time. */
export interface SonarTarget {
  x: number;
  y: number;
  size: number;
  resource: boolean;
  /** Sim time of the last sonar hit; 0 = never hit. */
  lastHit: number;
}

/** A short-lived echo particle spawned where the ring passes a terrain point. */
export interface SonarEcho {
  x: number;
  y: number;
  size: number;
  born: number;
  life: number;
  active: boolean;
}

const ECHO_POOL = 96;

/**
 * Sample a closed terrain ring into dense points (request §18 echo tagging):
 * an intermediate point every ~`step` units along each segment, so the echo
 * traces the terrain contour instead of only its vertices.
 */
function sampleDense(points: readonly Vec2[], step: number): Vec2[] {
  const out: Vec2[] = [];
  const n = points.length;
  if (n < 2) return out;
  for (let i = 0; i < n; i += 1) {
    const a = points[i]!;
    const b = points[(i + 1) % n]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    const segs = Math.max(1, Math.round(len / step));
    for (let s = 0; s < segs; s += 1) {
      const t = s / segs;
      out.push(vec2(a.x + dx * t, a.y + dy * t));
    }
  }
  return out;
}

/**
 * The sonar system (request §18). `fire` starts the expanding ring and emits
 * the sonar + noise world signals; `update` expands the ring and stamps the
 * brief outline tags and echo particles as it passes terrain and major
 * objects, decaying them all so the sonar is never a permanent minimap.
 */
export class SonarSystem {
  readonly ringMaxRadius = SONAR_RANGE;
  ringActive = false;
  readonly ringOrigin: Vec2 = vec2(0, 0);
  ringRadius = 0;
  readonly targets: SonarTarget[];
  readonly echoes: SonarEcho[];

  constructor(
    private readonly signals: WorldSignalBus,
    terrainPoints: readonly Vec2[],
    objects: readonly SonarObject[],
  ) {
    const dense = sampleDense(terrainPoints, SONAR_ECHO_STEP);
    this.targets = [
      ...dense.map((p) => ({ x: p.x, y: p.y, size: 1, resource: false, lastHit: 0 })),
      ...objects.map((o) => ({ x: o.x, y: o.y, size: o.size, resource: o.resource, lastHit: 0 })),
    ];
    this.echoes = [];
    for (let i = 0; i < ECHO_POOL; i += 1) {
      this.echoes.push({ x: 0, y: 0, size: 1, born: 0, life: 0, active: false });
    }
  }

  /** Fire a sonar pulse from `origin` (request §18): the ring + both signals. */
  fire(origin: Vec2, time: number): void {
    this.ringOrigin.x = origin.x;
    this.ringOrigin.y = origin.y;
    this.ringRadius = 0;
    this.ringActive = true;
    const pos = vec2(origin.x, origin.y);
    this.signals.emit({ type: 'sonar', pos, strength: SONAR_SIGNAL_STRENGTH }, time);
    this.signals.emit({ type: 'noise', pos, strength: SONAR_NOISE_STRENGTH, tag: 'sonar' }, time);
  }

  /** Advance the ring and decay the tags / echoes (call once per sim step). */
  update(dt: number, time: number): void {
    this.signals.update(time);
    if (this.ringActive) {
      const prev = this.ringRadius;
      this.ringRadius += SONAR_RING_SPEED * dt;
      const ox = this.ringOrigin.x;
      const oy = this.ringOrigin.y;
      for (const t of this.targets) {
        const d = Math.hypot(t.x - ox, t.y - oy);
        // The ring has reached this target this step (within the echo band)
        // and its previous tag has faded (or it was never tagged): re-stamp it.
        if (
          d <= this.ringRadius &&
          d > prev - SONAR_ECHO_BAND &&
          (t.lastHit === 0 || time - t.lastHit >= this.tagDuration(t))
        ) {
          t.lastHit = time;
          if (!t.resource) this.spawnEcho(t, time);
        }
      }
      if (this.ringRadius >= this.ringMaxRadius) this.ringActive = false;
    }
    for (const e of this.echoes) {
      if (e.active && time - e.born >= e.life) e.active = false;
    }
  }

  /** A target's outline-flash duration: longer for massive objects (request §18). */
  tagDuration(t: SonarTarget): number {
    const base = t.resource ? SIGNATURE_TIME : TAG_FLASH_TIME;
    return base * (1 + (t.size - 1) * MASSIVE_FLASH_SCALE);
  }

  /** Whether a target is currently outlined (the brief echo-flash window). */
  isTagged(t: SonarTarget, time: number): boolean {
    return t.lastHit > 0 && time - t.lastHit < this.tagDuration(t);
  }

  private spawnEcho(t: SonarTarget, time: number): void {
    let slot: SonarEcho | undefined;
    for (const e of this.echoes) {
      if (!e.active) {
        slot = e;
        break;
      }
    }
    if (slot === undefined) {
      slot = this.echoes[0]!;
      for (const e of this.echoes) if (e.born < slot.born) slot = e;
    }
    slot.x = t.x;
    slot.y = t.y;
    slot.size = t.size;
    slot.born = time;
    slot.life = ECHO_LIFE * (1 + (t.size - 1) * 0.5);
    slot.active = true;
  }
}
