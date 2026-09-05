/**
 * holds — player state (position, velocity, O2, health, depth, equipped tool).
 *
 * archetype: information-holder
 * owns: the live diver state: world position/velocity (surface at
 *   y = 0, negative is deeper — request §4.1), the oxygen and health
 *   meters (request §7), the derived depth, the equipped tool slot,
 *   the active capabilities (request §62), the cargo (request §7),
 *   and the body facing for visual rotation (request §6).
 * not own: how the state changes — `PlayerController` integrates
 *   motion and meters, `CollisionSystem` corrects position; this file
 *   is pure state.
 * invariant: `health` stays within 0..HP_MAX, `o2` within 0..o2Max,
 *   `toolIndex` within 0..tools.length, `depth >= 0`.
 * fails when: a caller mutates the meters outside the controller and
 *   breaks a meter invariant — no validation here by design.
 */
import { HP_MAX, O2_MAX } from '../game/constants';
import { vec2, type Vec2 } from '../util/math';
import type { Capability } from './equipment';
import type { Cargo } from './inventory';

export class Player {
  position: Vec2;
  velocity: Vec2 = vec2(0, 0);
  o2: number;
  o2Max: number;
  health: number;
  depth = 0;
  tools: string[] = [];
  toolIndex = 0;
  capabilities = new Set<Capability>();
  cargo: Cargo;
  facing = 0;

  constructor(start: Vec2) {
    this.position = vec2(start.x, start.y);
    this.o2 = O2_MAX;
    this.o2Max = O2_MAX;
    this.health = HP_MAX;
    this.cargo = { capacity: 0, used: 0 };
  }

  get selectedTool(): string | null {
    const tool = this.tools[this.toolIndex];
    return tool !== undefined ? tool : null;
  }
}
