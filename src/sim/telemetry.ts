/**
 * problem — balance tuning needs to measure full playthrough metrics (request
 *   §71: time to first upgrade, time to each depth band, deaths, resource
 *   shortages, time spent lost, repeated travel, completion time); solution
 *   — a shared telemetry collector driven by the production Simulation that
 *   accumulates every section 71 field plus per-frame/FPS data, exposed
 *   identically from the browser debug panel and headless scenario export.
 *
 * archetype: service-provider
 * owns: the balance-telemetry accumulator — play time, current zone, max
 *   depth, deaths, crafted upgrades, resources collected/spent, time since
 *   last progression unlock, oxygen on surfacing, encounter trigger
 *   timestamps, and per-frame/FPS data.
 * not own: gameplay behavior or rules (it reads existing sim state), the
 *   debug panel UI (it feeds it), or the scenario harness (it feeds it).
 * invariant: the collector never throws and never blocks the game loop —
 *   it is an observer of the simulation, not a participant.
 * fails when: none — it reads live state and never throws on missing data.
 */

/** A balance-tuning telemetry snapshot (request §71, §33). */
export interface TelemetrySnapshot {
  /** Total simulated play time in seconds. */
  playTimeSec: number;
  /** Current active chunk/zone id (internal id, not name). */
  zone: string;
  /** Max depth reached in this run. */
  maxDepth: number;
  /** Number of player deaths. */
  deaths: number;
  /** Cumulative resources collected (by material id). */
  resourcesCollected: Record<string, number>;
  /** Cumulative resources spent (by material id). */
  resourcesSpent: Record<string, number>;
  /** Upgrades crafted (by recipe id). */
  upgradesCrafted: string[];
  /** Seconds since the last progression unlock. */
  timeSinceLastUnlockSec: number;
  /** Oxygen remaining when the player last surfaced (0 = never). */
  oxygenOnLastSurface: number;
  /** Encounter trigger fire timestamps (by trigger id). */
  triggerTimestamps: Record<string, number>;
  /** Total frames advanced. */
  frames: number;
  /** Current measured FPS. */
  fps: number;
}

/**
 * The shared balance-telemetry collector, driven by the production
 * Simulation (request §71). It accumulates every section 71 field and
 * exposes a plain-object snapshot for both the browser debug panel and
 * the headless scenario export.
 */
export class TelemetryCollector {
  /** The accumulated telemetry state. */
  private state: TelemetrySnapshot;
  /** Snapshot of player inventory at the start of this step (for delta tracking). */
  private prevInventory: Record<string, number>;
  /** Snapshot of player banked at the start of this step (for delta tracking). */
  private prevBanked: Record<string, number>;
  /** Timestamp of the last progression unlock (for time-since-last-unlock). */
  private lastUnlockAt = 0;
  /** Number of story flags at the start of this step (for unlock delta tracking). */
  private prevFlagCount = 0;
  /** Whether the player was at the base (surfaces) last step. */
  private prevAtBase = false;
  /** Time accumulator for FPS measurement. */
  private fpsWindowStart = 0;
  /** Frame count in the current FPS window. */
  private fpsWindowFrames = 0;

  constructor() {
    this.state = this.empty();
    this.prevInventory = {};
    this.prevBanked = {};
  }

  private empty(): TelemetrySnapshot {
    return {
      playTimeSec: 0,
      zone: '',
      maxDepth: 0,
      deaths: 0,
      resourcesCollected: {},
      resourcesSpent: {},
      upgradesCrafted: [],
      timeSinceLastUnlockSec: 0,
      oxygenOnLastSurface: 0,
      triggerTimestamps: {},
      frames: 0,
      fps: 0,
    };
  }

  /**
   * Record the start of a simulation step.
   * Called before the simulation step; snapshots inventory/banked for
   * delta tracking and resets the FPS window timer if needed.
   */
  onStepStart(
    timeSec: number,
    inventory: Record<string, number>,
    banked: Record<string, number>,
    atBase: boolean,
    storyFlagCount: number,
  ): void {
    this.prevInventory = { ...inventory };
    this.prevBanked = { ...banked };
    this.prevAtBase = atBase;
    this.prevFlagCount = storyFlagCount;
    if (this.fpsWindowStart === 0) this.fpsWindowStart = timeSec;
  }

  /**
   * Record the end of a simulation step.
   * Called after the simulation step with the current state; computes
   * deltas, updates counters, and measures FPS.
   */
  onStepEnd(
    timeSec: number,
    zone: string,
    depth: number,
    maxDepth: number,
    deaths: number,
    inventory: Record<string, number>,
    banked: Record<string, number>,
    o2: number,
    o2Max: number,
    atBase: boolean,
    storyFlagCount: number,
    equipmentIds: string[],
    dt: number,
  ): void {
    this.state.playTimeSec = timeSec;
    this.state.zone = zone;
    if (maxDepth > this.state.maxDepth) this.state.maxDepth = maxDepth;
    if (deaths > this.state.deaths) this.state.deaths = deaths;

    // Track resource collection deltas (inventory increased)
    this.trackResourceDeltas(
      this.prevInventory,
      inventory,
      this.prevBanked,
      banked,
    );

    // Track crafted upgrades (equipment list grew)
    for (const eq of equipmentIds) {
      if (!this.state.upgradesCrafted.includes(eq)) {
        this.state.upgradesCrafted.push(eq);
      }
    }

    // Track progression unlocks (story flags grew)
    if (storyFlagCount > this.prevFlagCount) {
      this.lastUnlockAt = timeSec;
    }
    this.state.timeSinceLastUnlockSec = timeSec - this.lastUnlockAt;

    // Track oxygen on surfacing (player at base after being away)
    if (atBase && !this.prevAtBase) {
      this.state.oxygenOnLastSurface = o2;
    }

    // Track frame/FPS data (each step is one "frame" in headless)
    this.state.frames += 1;
    this.fpsWindowFrames += 1;
    const elapsed = timeSec - this.fpsWindowStart;
    if (elapsed >= 1) {
      this.state.fps = this.fpsWindowFrames / elapsed;
      this.fpsWindowStart = timeSec;
      this.fpsWindowFrames = 0;
    } else {
      this.state.fps = this.fpsWindowFrames / Math.max(elapsed, 0.001);
    }
  }

  /**
   * Record an encounter trigger firing.
   */
  onTriggerFired(timeSec: number, triggerId: string): void {
    this.state.triggerTimestamps[triggerId] = timeSec;
  }

  private trackResourceDeltas(
    prevInv: Record<string, number>,
    curInv: Record<string, number>,
    prevBanked: Record<string, number>,
    curBanked: Record<string, number>,
  ): void {
    const allKeys = new Set<string>();
    for (const k of Object.keys(prevInv)) allKeys.add(k);
    for (const k of Object.keys(curInv)) allKeys.add(k);
    for (const k of Object.keys(prevBanked)) allKeys.add(k);
    for (const k of Object.keys(curBanked)) allKeys.add(k);

    for (const k of allKeys) {
      const invDelta = (curInv[k] ?? 0) - (prevInv[k] ?? 0);
      if (invDelta > 0) {
        this.state.resourcesCollected[k] = (this.state.resourcesCollected[k] ?? 0) + invDelta;
      }
      if (invDelta < 0) {
        this.state.resourcesSpent[k] = (this.state.resourcesSpent[k] ?? 0) + (-invDelta);
      }

      const bankDelta = (curBanked[k] ?? 0) - (prevBanked[k] ?? 0);
      if (bankDelta < 0) {
        this.state.resourcesSpent[k] = (this.state.resourcesSpent[k] ?? 0) + (-bankDelta);
      }
    }
  }

  /** Return a deep copy of the accumulated telemetry snapshot. */
  snapshot(): TelemetrySnapshot {
    return {
      playTimeSec: this.state.playTimeSec,
      zone: this.state.zone,
      maxDepth: this.state.maxDepth,
      deaths: this.state.deaths,
      resourcesCollected: { ...this.state.resourcesCollected },
      resourcesSpent: { ...this.state.resourcesSpent },
      upgradesCrafted: [...this.state.upgradesCrafted],
      timeSinceLastUnlockSec: this.state.timeSinceLastUnlockSec,
      oxygenOnLastSurface: this.state.oxygenOnLastSurface,
      triggerTimestamps: { ...this.state.triggerTimestamps },
      frames: this.state.frames,
      fps: this.state.fps,
    };
  }
}