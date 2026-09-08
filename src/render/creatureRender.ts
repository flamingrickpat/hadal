/**
 * problem — creatures are sprites at best, but the request wants cheap
 *   procedural 2.5D bodies (request §13) that stay readable in and out
 *   of the player beam (request §15); solution — a pure render adapter
 *   that draws the simulation's `Creature` list into the Three.js scene:
 *   chain bodies get a spine ribbon with rigid per-circle parts on
 *   different animation time scales, small bodies get a tapered polygon
 *   body with translucent fins and an outline, and any creature can
 *   carry a found object from the world's wreckage vocabulary
 *   (request §13.4).
 *
 * archetype: service-provider
 * owns: one `CreatureVisual` per live creature (a group at the player
 *   plane, `z = PLAYER_PLANE_Z`) — the pre-allocated body ribbon, the
 *   rigid part meshes, the fin meshes, the outline, and the carried
 *   found objects — updated each frame from sim state only.
 * not own: the simulation (read-only; request §30), the camera, the
 *   depth-band profile mapping (`band`), the player beam (`lighting`),
 *   or audio (request §19 audio is data, consumed elsewhere).
 * fails when: a creature visual is requested for a creature with no
 *   def body radius — the meshes collapse to zero size rather than
 *   throwing; nothing in this module throws at runtime.
 * invariant: the render loop allocates nothing per frame (geometries,
 *   materials, buffers, and phases are built once per creature);
 *   deactivated creatures (`active = false`) are hidden, not stepped.
 */
import * as THREE from 'three';
import type { Creature } from '../creatures/Creature';
import type { BandProfile } from './band';
import { PLAYER_PLANE_Z } from '../game/constants';
import { buildSpineDef, makeSpineFrame, solveSpine, type SpineDef, type SpineFrame } from './spineRenderer';
import { createRng } from '../util/rng';

/** Which visual style a creature gets: spine ribbon (chain body) or small polygon body. */
export type CreatureVisualKind = 'spine' | 'small';

/** Where a carried found object attaches on the spine. */
export interface FoundAttachment {
  /** Spine node index to ride. */
  node: number;
  /** Which side of the body axis: 1 left, -1 right. */
  side: 1 | -1;
  /** Extra offset from the node along the body normal (world units). */
  distance: number;
}

/** One creature's render objects — read-only surface for tests and the sim's debug views. */
export interface CreatureVisual {
  kind: CreatureVisualKind;
  /** The creature's scene group, at the creature's position, `z = PLAYER_PLANE_Z`. */
  group: THREE.Group;
  /** Rigid per-circle part meshes (semi-rigid hierarchy; empty for small bodies). */
  partMeshes: THREE.Mesh[];
  /** The animated fin meshes. */
  finMeshes: THREE.Mesh[];
  /** Carried found objects and their attachments. */
  foundObjects: { object: THREE.Object3D; attachment: FoundAttachment }[];
}

// Neutral greybox palette (request §14.1; the real depth-band palette is
// ST-06's job) — deliberately in the world-silhouette family so creatures
// read as silhouettes out of the beam and the beam's additive overlay
// (z = 12, in front of the player plane) is what illuminates them (request §15).
const BODY_BASE: [number, number, number] = [0.38, 0.44, 0.5];
const EDGE_COLOR = 0x2f4a66; // the same accent edge `World` uses on silhouettes

// The fin's soft-alpha mask: one CanvasTexture shared by every fin (built
// once, only where a canvas exists — the node test environment has none).
let finAlpha: THREE.CanvasTexture | null = null;
function getFinAlpha(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  if (finAlpha !== null) return finAlpha;
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(16, 16, 2, 16, 16, 16);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 32, 32);
  finAlpha = new THREE.CanvasTexture(canvas);
  return finAlpha;
}

// Animation primitives (request §13.5): a non-harmonic two-partial wave
// (noise modulation — never a pure sine) and a flapping envelope with a
// held pause plateau. Both are deterministic in (t, phase).
function n1(t: number, phase: number): number {
  return 0.62 * Math.sin(t * 1.31 + phase) + 0.38 * Math.sin(t * 2.17 + phase * 1.7);
}
function flapEnvelope(t: number, phase: number): number {
  const c = ((t * 0.16 + phase) % 1 + 1) % 1;
  const e = c < 0.14 ? 0.22 : 1;
  return e;
}
interface PartRec {
  mesh: THREE.Mesh;
  node: number;
  radius: number;
  phase: number;
  /** This part's own animation time scale (request §13.3: parts on different scales). */
  rate: number;
}
interface FinRec {
  mesh: THREE.Mesh;
  node: number;
  side: 1 | -1;
  phase: number;
}
type VisualRec = CreatureVisual & {
  spine: SpineDef;
  frame: SpineFrame;
  bodyGeom: THREE.BufferGeometry;
  bodyMat: THREE.MeshBasicMaterial;
  headMesh: THREE.Mesh;
  headMat: THREE.MeshBasicMaterial;
  headRadius: number;
  frontIdx: number;
  parts: PartRec[];
  fins: FinRec[];
  bodyPos: Float32Array;
  n: number;
  heading: number;
  phase: number;
  bodyLen: number;
};

function hashId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i += 1) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function makeFinGeometry(length: number, width: number): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0, length, width, 0, length, -width, 0]), 3));
  return g;
}

function tint(mat: THREE.MeshBasicMaterial, base: [number, number, number], k: number): void {
  mat.color.setRGB(base[0] * k, base[1] * k, base[2] * k);
}

export class CreatureRenderer {
  /** One visual per live creature (readers see the `CreatureVisual` surface). */
  readonly visuals: Map<Creature, VisualRec> = new Map();
  private readonly scene: THREE.Scene;
  private readonly finMat: THREE.MeshBasicMaterial;
  private readonly edgeMat: THREE.LineBasicMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    const finAlphaMap = getFinAlpha();
    this.finMat = new THREE.MeshBasicMaterial({
      color: 0x55636f,
      transparent: true,
      opacity: finAlphaMap !== null ? 0.8 : 0.5,
      alphaMap: finAlphaMap ?? undefined,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.edgeMat = new THREE.LineBasicMaterial({ color: EDGE_COLOR });
  }

  /**
   * Draw the whole creature list for one frame. Reads sim state only;
   * writes nothing back (request §30).
   */
  update(creatures: readonly Creature[], time: number, profile: BandProfile): void {
    for (const creature of creatures) {
      let visual = this.visuals.get(creature);
      if (visual === undefined) {
        visual = this.buildVisual(creature);
        this.visuals.set(creature, visual);
      }
      if (!creature.active) {
        // The sim freezes deactivated creatures; the render hides them.
        visual.group.visible = false;
        continue;
      }
      visual.group.visible = true;
      this.stepVisual(visual, creature, time, profile);
    }
  }

  /** Attach a found object (e.g. `makeFoundPanel`) so it rides a spine node. */
  attachFoundObject(creature: Creature, object: THREE.Object3D, attachment?: FoundAttachment): void {
    let visual = this.visuals.get(creature);
    if (visual === undefined) {
      visual = this.buildVisual(creature);
      this.visuals.set(creature, visual);
    }
    visual.group.add(object);
    visual.foundObjects.push({ object, attachment: attachment ?? { node: visual.spine.pinned, side: 1, distance: 0 } });
  }

  /** Remove every carried found object from a creature. */
  detachFoundObjects(creature: Creature): void {
    const visual = this.visuals.get(creature);
    if (visual === undefined) return;
    for (const entry of visual.foundObjects) visual.group.remove(entry.object);
    visual.foundObjects.length = 0;
  }

  /** Remove every visual and free its geometries and materials. */
  dispose(): void {
    for (const visual of this.visuals.values()) {
      this.scene.remove(visual.group);
      visual.bodyGeom.dispose();
      visual.bodyMat.dispose();
      visual.headMesh.geometry.dispose();
      visual.headMat.dispose();
      for (const part of visual.parts) part.mesh.geometry.dispose();
      for (const fin of visual.fins) fin.mesh.geometry.dispose();
    }
    this.visuals.clear();
    this.finMat.dispose();
    this.edgeMat.dispose();
    if (finAlpha !== null) {
      finAlpha.dispose();
      finAlpha = null;
    }
  }

  private buildVisual(creature: Creature): VisualRec {
    const def = creature.def;
    const spine = buildSpineDef(def);
    const frame = makeSpineFrame(spine);
    const rng = createRng(hashId(def.id));
    const phase = rng() * Math.PI * 2;
    const kind: CreatureVisualKind = def.body.chainCircles && def.body.chainCircles.length > 0 ? 'spine' : 'small';
    const n = spine.rest.length;
    const group = new THREE.Group();
    group.position.z = PLAYER_PLANE_Z;
    group.renderOrder = 5;
    this.scene.add(group);

    // Body ribbon: two vertices per spine node, filled each frame.
    const bodyPos = new Float32Array(n * 2 * 3);
    const bodyGeom = new THREE.BufferGeometry();
    bodyGeom.setAttribute('position', new THREE.BufferAttribute(bodyPos, 3));
    if (n >= 2) {
      const indices: number[] = [];
      for (let i = 0; i + 1 < n; i += 1) {
        const l0 = 2 * i;
        const r0 = 2 * i + 1;
        indices.push(l0, r0, r0 + 2, l0, r0 + 2, l0 + 2);
      }
      bodyGeom.setIndex(indices);
    }
    const bodyMat = new THREE.MeshBasicMaterial({ color: BODY_BASE[1], side: THREE.DoubleSide });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.frustumCulled = false;
    group.add(body);

    const headRadius = Math.max(...spine.widths) * 0.7;
    const headMat = new THREE.MeshBasicMaterial({ color: BODY_BASE[1] });
    const headMesh = new THREE.Mesh(new THREE.CircleGeometry(headRadius, 20), headMat);
    headMesh.frustumCulled = false;
    group.add(headMesh);

    // Rigid per-circle parts: the semi-rigid hierarchy (request §13.3).
    // Each part animates on its own slower time scale so a long body reads
    // as separately driven pieces, and nothing here clamps to the view, so
    // a body can exceed the screen bounds.
    const parts: PartRec[] = [];
    const partMeshes: THREE.Mesh[] = [];
    if (kind === 'spine') {
      for (let i = 0; i < n; i += 1) {
        if (i === spine.pinned) continue;
        const mat = new THREE.MeshBasicMaterial({ color: BODY_BASE[1] });
        const mesh = new THREE.Mesh(new THREE.CircleGeometry(spine.widths[i]!, 18), mat);
        mesh.frustumCulled = false;
        group.add(mesh);
        const rec: PartRec = {
          mesh,
          node: i,
          radius: spine.widths[i]!,
          phase: rng() * Math.PI * 2,
          rate: 1 / (1 + 0.5 * i),
        };
        parts.push(rec);
        partMeshes.push(mesh);
      }
    }

    // Fins at the attachment points along the spine (request §13.2):
    // alternating sides, asymmetric phases (request §13.5).
    const fins: FinRec[] = [];
    const finMeshes: THREE.Mesh[] = [];
    const finCandidates: number[] = [];
    for (let i = 0; i < n; i += 1) {
      if (i !== spine.pinned) finCandidates.push(i);
    }
    const finNodes = finCandidates.slice(0, 3);
    finNodes.forEach((node, idx) => {
      const side: 1 | -1 = idx % 2 === 0 ? 1 : -1;
      const len = spine.widths[node]! * 1.6 + 12;
      const mesh = new THREE.Mesh(makeFinGeometry(len, len * 0.4), this.finMat);
      mesh.frustumCulled = false;
      group.add(mesh);
      fins.push({ mesh, node, side, phase: phase + idx * 2.1 + (side === 1 ? 0 : 2.4) });
      finMeshes.push(mesh);
    });
    if (kind === 'small') {
      // A translucent tail fan and an outline loop (request §13.1).
      const tailNode = n - 1;
      const tail = new THREE.Mesh(makeFinGeometry(spine.widths[0]! * 2 + 16, spine.widths[0]! + 8), this.finMat);
      tail.frustumCulled = false;
      group.add(tail);
      fins.push({ mesh: tail, node: tailNode, side: 1, phase: phase + 4.2 });
      finMeshes.push(tail);
      // Shares the ribbon's position attribute, so the outline tracks the
      // body boundary exactly with no second buffer (request §13.1 outline):
      // the index walks the left edge, then the right edge in reverse.
      const outlineGeom = new THREE.BufferGeometry();
      outlineGeom.setAttribute('position', bodyGeom.attributes.position as THREE.BufferAttribute);
      const outlineIdx: number[] = [];
      for (let i = 0; i < n; i += 1) outlineIdx.push(2 * i);
      for (let i = n - 1; i >= 0; i -= 1) outlineIdx.push(2 * i + 1);
      outlineGeom.setIndex(outlineIdx);
      const outline = new THREE.LineLoop(outlineGeom, this.edgeMat);
      outline.frustumCulled = false;
      group.add(outline);
    }

    let bodyLen = 0;
    for (const d of spine.segDist) bodyLen += d;
    const visual: VisualRec = {
      kind,
      group,
      partMeshes,
      finMeshes,
      foundObjects: [],
      spine,
      frame,
      bodyGeom,
      bodyMat,
      headMesh,
      headMat,
      headRadius,
      frontIdx: 0,
      parts,
      fins,
      bodyPos,
      n,
      heading: 0,
      phase,
      bodyLen,
    };
    return visual;
  }

  private stepVisual(visual: VisualRec, creature: Creature, time: number, profile: BandProfile): void {
    const { spine, frame, n } = visual;
    const pos = creature.position;
    // Heading comes from sim motion only (velocity, then steering target);
    // a stationary creature keeps its last heading.
    const speed = Math.hypot(creature.velocity.x, creature.velocity.y);
    if (speed > 4) {
      visual.heading = Math.atan2(creature.velocity.y, creature.velocity.x);
    } else if (creature.target !== null) {
      visual.heading = Math.atan2(creature.target.y - pos.y, creature.target.x - pos.x);
    }
    solveSpine(spine, frame, pos, visual.heading);

    // Animation (request §13.5): a breathing width cycle, a speed-scaled
    // undulation traveling down the body, held flapping pauses, and an
    // alert posture that widens the body and spreads the fins.
    const state = creature.state;
    const alert = state === 'alert' || state === 'stalk' || state === 'attack';
    const fleeing = state === 'flee';
    const posture = alert ? 1.15 : fleeing ? 1.05 : 1;
    const breathe = 0.92 + 0.08 * (0.5 + 0.5 * n1(time * 0.45, visual.phase));
    const undAmp = Math.min(0.5 * visual.bodyLen, 6 + speed * 0.16);
    const undFreq = n >= 2 ? (Math.PI * 2) / visual.bodyLen : 0;
    const env = flapEnvelope(time, visual.phase * 0.13);
    const flapSpeed = (1.6 + speed * 0.03) * (fleeing ? 1.6 : 1) * env;
    visual.group.position.x = pos.x;
    visual.group.position.y = pos.y;
    visual.frontIdx = this.frontNode(visual);

    // Body ribbon: left/right boundary from the per-node normals.
    const bodyPos = visual.bodyPos;
    for (let i = 0; i < n; i += 1) {
      const p = frame.points[i]!;
      const w = frame.widths[i]! * breathe * posture;
      const off = undAmp * n1(time * undFreq * (i - spine.pinned) + time * 0.55, visual.phase) * 0.6;
      const lx = p.x - pos.x + frame.normalX[i]! * (w + off);
      const ly = p.y - pos.y + frame.normalY[i]! * (w + off);
      bodyPos[i * 6] = lx;
      bodyPos[i * 6 + 1] = ly;
      bodyPos[i * 6 + 2] = 0;
      bodyPos[i * 6 + 3] = p.x - pos.x - frame.normalX[i]! * (w + off);
      bodyPos[i * 6 + 4] = p.y - pos.y - frame.normalY[i]! * (w + off);
      bodyPos[i * 6 + 5] = 0;
    }
    (visual.bodyGeom.attributes.position as THREE.BufferAttribute).needsUpdate = true;

    // Head follows the simulated position via the front node (request §13.2).
    const hp = frame.points[visual.frontIdx]!;
    visual.headMesh.position.set(hp.x - pos.x, hp.y - pos.y, 0);

    // Rigid parts: each on its own time scale, separately illuminated.
    const ambient = 0.35 + 0.65 * profile.ambient;
    tint(visual.bodyMat, BODY_BASE, ambient);
    tint(visual.headMat, BODY_BASE, ambient * 1.05);
    for (const part of visual.parts) {
      const p = frame.points[part.node]!;
      const wob = n1(time * part.rate * 0.8, part.phase);
      part.mesh.position.set(p.x - pos.x + frame.normalX[part.node]! * wob * part.radius * 0.08, p.y - pos.y + frame.normalY[part.node]! * wob * part.radius * 0.08, 0);
      tint(part.mesh.material as THREE.MeshBasicMaterial, BODY_BASE, ambient * (0.9 + 0.1 * (0.5 + 0.5 * wob)));
    }

    // Fins flap on the envelope; left and right run on different phases.
    for (const fin of visual.fins) {
      const p = frame.points[fin.node]!;
      const a = frame.angles[fin.node]!;
      fin.mesh.position.set(p.x - pos.x + frame.normalX[fin.node]! * fin.side * frame.widths[fin.node]! * 0.5, p.y - pos.y + frame.normalY[fin.node]! * fin.side * frame.widths[fin.node]! * 0.5, 0);
      fin.mesh.rotation.z = a + (fin.side === 1 ? Math.PI / 2 : -Math.PI / 2) + fin.side * (0.35 + 1.05 * n1(time * flapSpeed, fin.phase)) * (alert ? 1.4 : 1);
    }

    // Carried found objects ride their attachment point (request §13.4).
    for (const entry of visual.foundObjects) {
      const att = entry.attachment;
      const p = frame.points[att.node]!;
      const sway = 0.5 * n1(time * 0.6, visual.phase + att.node);
      entry.object.position.set(p.x - pos.x + frame.normalX[att.node]! * att.side * (att.distance + frame.widths[att.node]! * 0.5), p.y - pos.y + frame.normalY[att.node]! * att.side * (att.distance + frame.widths[att.node]! * 0.5), 0);
      entry.object.rotation.z = frame.angles[att.node]! + sway * 0.2;
    }
  }

  /** The node farthest along the heading — the visual head of the body. */
  private frontNode(visual: VisualRec): number {
    const { spine, frame, n } = visual;
    const hx = Math.cos(visual.heading);
    const hy = Math.sin(visual.heading);
    const pin = frame.points[spine.pinned]!;
    let best = 0;
    let bestD = -Infinity;
    for (let i = 0; i < n; i += 1) {
      const p = frame.points[i]!;
      const d = (p.x - pin.x) * hx + (p.y - pin.y) * hy;
      if (d > bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  }
}

/**
 * A found panel — the world's wreckage vocabulary (near-black polygon
 * fill + accent edge, the same style `World` uses for silhouettes), so
 * carried debris reads as world wreckage (request §13.4).
 */
export function makeFoundPanel(width: number, height: number): THREE.Group {
  const group = new THREE.Group();
  const fill = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ color: 0x0c1016 }),
  );
  const edge = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-width / 2, -height / 2, 0),
      new THREE.Vector3(width / 2, -height / 2, 0),
      new THREE.Vector3(width / 2, height / 2, 0),
      new THREE.Vector3(-width / 2, height / 2, 0),
    ]),
    new THREE.LineBasicMaterial({ color: EDGE_COLOR }),
  );
  group.add(fill);
  group.add(edge);
  return group;
}
