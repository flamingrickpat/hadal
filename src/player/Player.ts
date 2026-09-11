/**
 * holds — player state (position, velocity, O2, health, depth, equipped tool,
 *   cargo, carried/banked materials, permanent equipment).
 *
 * archetype: information-holder
 * owns: the live diver state: world position/velocity (surface at
 *   y = 0, negative is deeper — request §4.1), the oxygen and health
 *   meters (request §7), the derived depth, the equipped tool slot,
 *   the active capabilities (request §62), the cargo (request §7),
 *   the body facing for visual rotation (request §6), the carried and
 *   banked material counts (request §8), the movement speed multiplier
 *   (request §9 propulsion), the permanent equipment IDs, and the
 *   max depth reached (request §25/§42).
 * not own: how the state changes — `PlayerController` integrates
 *   motion and meters, `CollisionSystem` corrects position, and the
 *   simulation (WI-03) drives harvesting/crafting/death.
 * invariant: `health` stays within 0..HP_MAX, `o2` within 0..o2Max,
 *   `toolIndex` within 0..tools.length, `depth >= 0`, and
 *   `cargo.used <= cargo.capacity`.
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
  speedMult = 1;
  inventory: Record<string, number> = {};
  banked: Record<string, number> = {};
  equipmentIds: string[] = [];
  maxDepth = 0;
  newDepthRecord = false;

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
