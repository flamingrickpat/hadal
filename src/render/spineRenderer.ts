/**
 * problem — long-bodied creatures simulate as a root circle plus chain
 *   circles, but a sprite cannot read as a body; solution — a pure (no
 *   Three.js) spine solver that pins the trunk node at the simulated
 *   position and relaxes the other nodes into fixed-segment-distance
 *   constraint (request §13.2), so the render layer draws creature state
 *   without owning any gameplay rule.
 *
 * archetype: service-provider
 * owns: the spine rest-pose build (`buildSpineDef`), the reusable
 *   per-creature frame buffers (`makeSpineFrame`), and the constraint
 *   relaxation (`solveSpine`) that fills node positions, tangents, and
 *   left/right normals each frame with zero allocation.
 * not own: simulation state (`Creature`), the Three.js meshes (that is
 *   `creatureRender`), and any write back into the sim (request §30 —
 *   the frame is the only output).
 * fails when: a def's chain circles are degenerate (all nodes at one
 *   point) — segment distances come out ~0 and the solver falls back to
 *   the rest-pose direction, so the body collapses instead of throwing.
 * invariant: node `pinned` always sits exactly at the simulated head
 *   position, and consecutive nodes always hold the fixed segment
 *   distances from the authored body axis — the renderer may modulate
 *   widths and appendages, never the solved skeleton.
 */
import type { CreatureDef } from '../creatures/CreatureDef';

/** A 2D point in world units. */
export interface SpinePoint {
  x: number;
  y: number;
}

/**
 * The solved, authored body of one creature, fixed for its lifetime.
 * `rest`, `segDist`, and `widths` describe the body in world units;
 * `restRot` / `dirRot` pre-rotate them so `solveSpine` needs no trig of
 * its own for the rest pose (per-frame allocation stays zero).
 */
export interface SpineDef {
  /** Node rest offsets relative to the trunk, ordered along the body axis. */
  readonly rest: readonly SpinePoint[];
  /** Fixed distance between node `i` and `i + 1` (length `rest.length - 1`). */
  readonly segDist: readonly number[];
  /** Each node's body half-width (its collision circle's radius). */
  readonly widths: readonly number[];
  /** The node pinned to the simulated position (the trunk). */
  readonly pinned: number;
  /** Number of segments (`rest.length - 1`). */
  readonly segments: number;
  /** `rest[i] - rest[pinned]`, pre-rotated by the frame heading. */
  readonly restRot: readonly SpinePoint[];
  /** Unit direction from node `i` to `i + 1`, pre-rotated by the heading. */
  readonly dirRot: readonly SpinePoint[];
}

/** Reusable per-frame buffers — mutated in place, never re-allocated. */
export interface SpineFrame {
  /** Solved node positions in world units. */
  points: SpinePoint[];
  /** Per-node tangent angle (radians). */
  angles: number[];
  /** Per-node base width for this frame (renderer-modulatable). */
  widths: number[];
  /** Per-node left-normal x / y (unit, perpendicular to the tangent). */
  normalX: number[];
  normalY: number[];
}

/**
 * Build the spine from a def's body: the trunk (root circle) plus any
 * chain circles, ordered along the authored body axis (offset.x). A body
 * with no chain circles gets a synthetic 4-segment tapered trail so small
 * creatures can share the same spine path (request §13.1: 3-8 segments).
 */
export function buildSpineDef(def: CreatureDef): SpineDef {
  const trunk = { x: 0, y: 0 };
  const circles = def.body.chainCircles ?? [];
  type Node = { x: number; y: number; radius: number; trunk: boolean };
  const nodes: Node[] = circles.map((c) => ({ x: c.offset.x, y: c.offset.y, radius: c.radius, trunk: false }));
  nodes.push({ x: trunk.x, y: trunk.y, radius: def.body.radius, trunk: true });
  nodes.sort((a, b) => a.x - b.x);
  if (circles.length === 0) {
    // Small body: a tapered 4-segment trail behind the trunk.
    nodes.length = 0;
    for (let i = 4; i >= 1; i -= 1) {
      nodes.push({ x: -i * 0.75 * def.body.radius, y: 0, radius: def.body.radius * (0.8 - i * 0.12), trunk: false });
    }
    nodes.push({ x: 0, y: 0, radius: def.body.radius, trunk: true });
  }
  const pinned = nodes.findIndex((n) => n.trunk);
  const rest = nodes.map((n) => ({ x: n.x, y: n.y }));
  const widths = nodes.map((n) => n.radius);
  const segDist: number[] = [];
  const dirRot: SpinePoint[] = [];
  for (let i = 0; i + 1 < nodes.length; i += 1) {
    const dx = nodes[i + 1]!.x - nodes[i]!.x;
    const dy = nodes[i + 1]!.y - nodes[i]!.y;
    const d = Math.hypot(dx, dy);
    segDist.push(d);
    dirRot.push(d > 1e-6 ? { x: dx / d, y: dy / d } : { x: 1, y: 0 });
  }
  const restRot = nodes.map((n) => ({ x: n.x - trunk.x, y: n.y - trunk.y }));
  return { rest, segDist, widths, pinned, segments: nodes.length - 1, restRot, dirRot };
}

/** Allocate the reusable frame buffers for one creature. */
export function makeSpineFrame(spine: SpineDef): SpineFrame {
  const n = spine.rest.length;
  return {
    points: Array.from({ length: n }, () => ({ x: 0, y: 0 })),
    angles: new Array<number>(n).fill(0),
    widths: new Array<number>(n).fill(0),
    normalX: new Array<number>(n).fill(0),
    normalY: new Array<number>(n).fill(0),
  };
}

/**
 * Solve the constraint spine for one frame: the trunk node is pinned
 * exactly at the simulated position; every other node is placed along
 * the pre-rotated rest direction at its fixed segment distance. Two
 * relaxation passes (forward and backward from the pin) keep the chain
 * taut when the trunk jumps or turns. `heading` is the creature's
 * direction of travel in radians.
 */
export function solveSpine(spine: SpineDef, frame: SpineFrame, head: SpinePoint, heading: number): void {
  const c = Math.cos(heading);
  const s = Math.sin(heading);
  const n = spine.rest.length;
  const pin = spine.pinned;
  const pts = frame.points;
  for (let i = 0; i < n; i += 1) {
    // Rest pose, pre-rotated by the heading, trunk at the simulated position.
    const p = pts[i]!;
    const ox = spine.restRot[i]!.x;
    const oy = spine.restRot[i]!.y;
    p.x = head.x + ox * c - oy * s;
    p.y = head.y + ox * s + oy * c;
  }
  // Taut passes from the pin (request §13.2: constrained at fixed
  // segment distance): each node sits on the rest direction from its
  // neighbor at exactly the authored segment distance.
  for (let i = pin + 1; i < n; i += 1) {
    const a = pts[i - 1]!;
    const p = pts[i]!;
    const dx = spine.dirRot[i - 1]!.x;
    const dy = spine.dirRot[i - 1]!.y;
    const d = spine.segDist[i - 1]!;
    p.x = a.x + (dx * c - dy * s) * d;
    p.y = a.y + (dx * s + dy * c) * d;
  }
  for (let i = pin - 1; i >= 0; i -= 1) {
    const a = pts[i + 1]!;
    const p = pts[i]!;
    const dx = spine.dirRot[i]!.x;
    const dy = spine.dirRot[i]!.y;
    const d = spine.segDist[i]!;
    p.x = a.x - (dx * c - dy * s) * d;
    p.y = a.y - (dx * s + dy * c) * d;
  }
  for (let i = 0; i < n; i += 1) {
    frame.widths[i] = spine.widths[i]!;
  }
  for (let i = 0; i < n; i += 1) {
    const a = pts[i]!;
    const b = i + 1 < n ? pts[i + 1]! : null;
    const k = i - 1 >= 0 ? pts[i - 1]! : null;
    const dx = (b?.x ?? a.x) - (k?.x ?? a.x);
    const dy = (b?.y ?? a.y) - (k?.y ?? a.y);
    frame.angles[i] = Math.atan2(dy, dx);
    // Left normal: the tangent rotated +90°.
    frame.normalX[i] = -Math.sin(frame.angles[i]!);
    frame.normalY[i] = Math.cos(frame.angles[i]!);
  }
}
