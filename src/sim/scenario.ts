/**
 * problem — headless gameplay scenarios need to advance the production
 *   simulation with normal player actions (request §30, §70); solution — a
 *   small reusable `Scenario` harness that steps a production `Simulation`
 *   with fixed steps and input sequences, with waypoint movement and
 *   concise seed/time/position/input/assertion failure traces.
 *
 * archetype: service-provider
 * owns: the reusable Node scenario harness — a `Simulation` advanced on a
 *   fixed step, waypoint steering that selects movement inputs (never
 *   assigns positions or bypasses collision, request §70), state
 *   assertions, and the failure-trace format shared by implementer and
 *   reviewer sessions.
 * not own: the production simulation or world data (it wraps them) or the
 *   specific scenario logic (the tests compose these helpers).
 * invariant: a scenario is deterministic in its seed; a failed assertion
 *   throws `ScenarioFailure` whose message carries the seed, simulated
 *   time, position, last input, and the failed assertion.
 * fails when: a scenario exceeds its step budget without reaching a goal
 *   — the next assertion fails with the state trace (a gameplay failure).
 */
import { FIXED_DT } from '../game/constants';
import { emptyInput, makeSimWorld, Simulation, type SimWorld } from './Simulation';
import type { PlayerInput } from '../player/PlayerController';
import type { Vec2 } from '../util/math';

export class ScenarioFailure extends Error {}

export class Scenario {
  readonly sim: Simulation;
  readonly seed: number;
  time = 0;
  lastInput: PlayerInput = emptyInput();

  constructor(seed: number, world: SimWorld = makeSimWorld()) {
    this.seed = seed;
    this.sim = new Simulation(world, seed);
  }

  step(input: PlayerInput, dt: number = FIXED_DT): void {
    this.sim.step(input, dt);
    this.time += dt;
    this.lastInput = input;
  }

  /** Advance the simulation for `seconds` with a (reused) input. */
  stepFor(seconds: number, input: PlayerInput = emptyInput(), dt: number = FIXED_DT): void {
    const steps = Math.round(seconds / dt);
    for (let i = 0; i < steps; i++) this.step(input, dt);
  }

  /**
   * Swim the player toward `target` using normal movement and collision.
   * Selects movement inputs only (request §70): it never assigns a
   * position or bypasses collision. Returns the number of steps taken.
   */
  swimTo(target: Vec2, tolerance: number = 50, maxSteps: number = 40000): number {
    let steps = 0;
    while (steps < maxSteps) {
      this.step(this.steerToward(target, tolerance));
      steps++;
      if (this.distanceTo(target) <= tolerance) return steps;
    }
    return steps; // not reached; a later assert fails with the trace
  }

  /** Select the movement input that heads toward `target` this step. */
  steerToward(target: Vec2, tolerance: number = 50): PlayerInput {
    const p = this.sim.player.position;
    const dx = target.x - p.x;
    const dy = target.y - p.y;
    const dist = Math.hypot(dx, dy);
    const input = emptyInput();
    if (dist <= tolerance) return input;
    // Full thrust when far, a creeping thrust when close, to avoid
    // overshooting the inertial player past the target.
    const full = dist > tolerance * 2;
    input.thrustX = dx === 0 ? 0 : (full ? Math.sign(dx) : Math.sign(dx) * 0.5);
    input.thrustY = dy === 0 ? 0 : (full ? Math.sign(dy) : Math.sign(dy) * 0.5);
    return input;
  }

  distanceTo(target: Vec2): number {
    const p = this.sim.player.position;
    return Math.hypot(p.x - target.x, p.y - target.y);
  }

  /** The position of a world resource node by ID, or null if absent. */
  findNodePosition(id: string): Vec2 | null {
    const node = this.sim.nodes.find((n) => n.id === id);
    return node ? node.position : null;
  }

  assert(condition: boolean, description: string): void {
    if (!condition) throw new ScenarioFailure(this.trace(description));
  }

  assertNear(pos: Vec2, target: Vec2, tol: number, description: string): void {
    const d = Math.hypot(pos.x - target.x, pos.y - target.y);
    this.assert(d <= tol, `${description} (pos=(${pos.x.toFixed(1)},${pos.y.toFixed(1)}) target=(${target.x.toFixed(1)},${target.y.toFixed(1)}) d=${d.toFixed(1)} tol=${tol})`);
  }

  /** The concise failure trace: seed, simulated time, position, input, assertion. */
  trace(failedAssertion: string): string {
    const p = this.sim.player.position;
    const i = this.lastInput;
    return (
      `seed=${this.seed} t=${this.time.toFixed(3)}s ` +
      `pos=(${p.x.toFixed(1)},${p.y.toFixed(1)}) ` +
      `input={thrustX:${i.thrustX},thrustY:${i.thrustY},boost:${i.boost},interact:${i.interact},` +
      `craftRequest:${i.craftRequest ?? 'null'},toolSelect:${i.toolSelect ?? 'null'}} | ` +
      `assertion failed: ${failedAssertion}`
    );
  }

  /** WI-07a: section 71 balance telemetry — the same field set the browser debug panel exposes. */
  telemetry(): import('./telemetry').TelemetrySnapshot {
    return this.sim.telemetry.snapshot();
  }
}