/**
 * drives — player inertial swim from input to velocity/position.
 *
 * archetype: service-provider
 * owns: the request §6 movement integrator — input -> desired
 *   acceleration -> velocity; velocity *= drag; position += velocity *
 *   dt — with separate horizontal/vertical acceleration, plus the
 *   oxygen/health/depth meter model (request §7) and the body facing
 *   blend toward velocity/aim (request §6). `bindToWindow` owns the
 *   keyboard/mouse input state (WASD, Shift boost, mouse aim,
 *   left/right mouse, E, Q, 1–4).
 * not own: the player state itself (`Player`), terrain resolution
 *   (`CollisionSystem`), rendering, the pause key (Game owns Esc).
 * invariant: `update(dt)` is called once per simulation step with
 *   `FIXED_DT` (the `Game.update` seam, request §30); the math is
 *   deterministic in (state, input, dt).
 * fails when: `update` is called with a dt other than `FIXED_DT` — the
 *   pinned test values drift.
 */
import {
  BOOST_ACCEL_MULT,
  BOOST_DRAG_MULT,
  FACING_MAX_WEIGHT,
  FACING_ROT_RATE,
  FACING_SPEED_SCALE,
  HP_MAX,
  HP_REGEN_PER_SEC,
  O2_BOOST_MULT,
  O2_DRAIN_PER_SEC,
  O2_INJURY_MULT,
  O2_INJURY_THRESHOLD,
  O2_REGEN_PER_SEC,
  O2_ZERO_HP_DRAIN_PER_SEC,
  PLAYER_ACCEL_H,
  PLAYER_ACCEL_V,
  PLAYER_DRAG_RATE,
  SURFACE_REFILL_DEPTH,
} from '../game/constants';
import { lerpAngle, vec2, type Vec2 } from '../util/math';
import type { Renderer } from '../render/Renderer';
import type { Player } from './Player';

export interface PlayerInput {
  thrustX: number;
  thrustY: number;
  boost: boolean;
  aimPoint: Vec2;
  useTool: boolean;
  altTool: boolean;
  interact: boolean;
  sonar: boolean;
}

export class PlayerController {
  readonly input: PlayerInput = {
    thrustX: 0,
    thrustY: 0,
    boost: false,
    aimPoint: vec2(0, 0),
    useTool: false,
    altTool: false,
    interact: false,
    sonar: false,
  };

  constructor(private readonly player: Player) {}

  update(dt: number): void {
    const p = this.player;
    const inp = this.input;
    const boosting = inp.boost && p.capabilities.has('boost');
    const accelMult = boosting ? BOOST_ACCEL_MULT : 1;
    const dragRate = PLAYER_DRAG_RATE * (boosting ? BOOST_DRAG_MULT : 1);
    p.velocity.x += PLAYER_ACCEL_H * accelMult * inp.thrustX * dt;
    p.velocity.y += PLAYER_ACCEL_V * accelMult * inp.thrustY * dt;
    // `velocity *= drag` as an exponential so the feel is identical at
    // any step size; at FIXED_DT it is the per-step constant.
    const drag = Math.exp(-dragRate * dt);
    p.velocity.x *= drag;
    p.velocity.y *= drag;
    p.position.x += p.velocity.x * dt;
    p.position.y += p.velocity.y * dt;
    this.updateMeters(dt, boosting);
    this.updateFacing(dt);
  }

  private updateMeters(dt: number, boosting: boolean): void {
    const p = this.player;
    if (p.position.y >= -SURFACE_REFILL_DEPTH) {
      p.o2 = Math.min(p.o2Max, p.o2 + O2_REGEN_PER_SEC * dt);
      p.health = Math.min(HP_MAX, p.health + HP_REGEN_PER_SEC * dt);
    } else {
      let drain = O2_DRAIN_PER_SEC;
      if (boosting) drain *= O2_BOOST_MULT;
      if (p.health < O2_INJURY_THRESHOLD) drain *= O2_INJURY_MULT;
      p.o2 = Math.max(0, p.o2 - drain * dt);
      if (p.o2 <= 0) {
        let hpDrain = O2_ZERO_HP_DRAIN_PER_SEC;
        if (p.health < O2_INJURY_THRESHOLD) hpDrain *= O2_INJURY_MULT;
        p.health = Math.max(0, p.health - hpDrain * dt);
      }
    }
    p.depth = Math.max(0, -p.position.y);
  }

  private updateFacing(dt: number): void {
    const p = this.player;
    const inp = this.input;
    const speed = Math.hypot(p.velocity.x, p.velocity.y);
    const aimDx = inp.aimPoint.x - p.position.x;
    const aimDy = inp.aimPoint.y - p.position.y;
    const aimLen = Math.hypot(aimDx, aimDy);
    let ax: number;
    let ay: number;
    if (aimLen > 1) {
      ax = aimDx / aimLen;
      ay = aimDy / aimLen;
    } else {
      ax = Math.cos(p.facing);
      ay = Math.sin(p.facing);
    }
    let target = Math.atan2(ay, ax);
    if (speed > 1) {
      // Blend only slightly toward velocity so aim still reads; the
      // weight saturates at FACING_MAX_WEIGHT.
      const w = Math.min(speed / FACING_SPEED_SCALE, FACING_MAX_WEIGHT);
      const bx = ax * (1 - w) + (p.velocity.x / speed) * w;
      const by = ay * (1 - w) + (p.velocity.y / speed) * w;
      if (bx * bx + by * by > 1e-9) target = Math.atan2(by, bx);
    }
    p.facing = lerpAngle(p.facing, target, 1 - Math.exp(-FACING_ROT_RATE * dt));
  }

  setToolIndex(index: number): void {
    if (Number.isInteger(index) && index >= 0 && index < this.player.tools.length) {
      this.player.toolIndex = index;
    }
  }

  bindToWindow(renderer: Renderer): void {
    const keys = new Set<string>();
    const recomputeThrust = (): void => {
      this.input.thrustX = (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0);
      // +y is toward the surface (y = 0), so W is up and S is down.
      this.input.thrustY = (keys.has('KeyW') ? 1 : 0) - (keys.has('KeyS') ? 1 : 0);
    };
    const onKeyDown = (e: KeyboardEvent): void => {
      keys.add(e.code);
      recomputeThrust();
      this.input.boost = keys.has('ShiftLeft') || keys.has('ShiftRight');
      this.input.interact = keys.has('KeyE');
      this.input.sonar = keys.has('KeyQ');
      if (!e.repeat) {
        if (e.code === 'Digit1') this.setToolIndex(0);
        else if (e.code === 'Digit2') this.setToolIndex(1);
        else if (e.code === 'Digit3') this.setToolIndex(2);
        else if (e.code === 'Digit4') this.setToolIndex(3);
      }
    };
    const onKeyUp = (e: KeyboardEvent): void => {
      keys.delete(e.code);
      recomputeThrust();
      this.input.boost = keys.has('ShiftLeft') || keys.has('ShiftRight');
      this.input.interact = keys.has('KeyE');
      this.input.sonar = keys.has('KeyQ');
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousemove', (e) => {
      this.input.aimPoint = renderer.screenToWorld(e.clientX, e.clientY);
    });
    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.input.useTool = true;
      else if (e.button === 2) this.input.altTool = true;
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.input.useTool = false;
      else if (e.button === 2) this.input.altTool = false;
    });
    // Right mouse is the alternate tool function (request §6), not a menu.
    window.addEventListener('contextmenu', (e) => e.preventDefault());
  }
}
