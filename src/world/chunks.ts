/**
 * holds — the authored macro-world chunk data model and chunk activation
 *   (request §17): the `WorldChunkDef` family and the nearby-chunk
 *   activation rule the streaming pass reads each step.
 *
 * archetype: information-holder
 * owns: the §17 chunk data shapes (`WorldChunkDef` and its family: `ExitDef`,
 *   `ResourceNodeDef`, `CreatureSpawnDef`, `PropDef`, `TriggerDef`,
 *   `AmbientDef`) and the pure `computeActiveChunkIds` activation rule
 *   (chunks whose bounds are within `CHUNK_ACTIVE_RADIUS` of a position are
 *   "active"; farther chunks are "inactive" — their expensive AI/particles are
 *   disabled, request §17). The authored chunk *instances* live in
 *   `worldData.ts`; this file holds the shapes they are and the activation.
 * not own: the collision terrain (`terrain.ts`), the trigger evaluation
 *   (`triggers.ts`), or the current fields (`systems/CurrentSystem.ts`) — the
 *   shapes reference them; the instances and behavior live there.
 * invariant: every authored chunk carries a unique `id`, a `band` (one of the
 *   ~5 depth bands, request §4.1), and `exits` whose `to` references an
 *   existing chunk id; `computeActiveChunkIds` is deterministic in
 *   (chunks, position, radius) and always includes the chunk that contains the
 *   position.
 * fails when: an exit references an unknown chunk id — `validateWorldChunks`
 *   reports it as an issue (request §32).
 */
import { type Rect, type Vec2 } from '../util/math';
import type { TerrainShapeDef } from './terrain';
import type { EncounterTrigger } from './triggers';

/** A harvestable material node (request §8); the sim tracks `harvested`. */
export interface ResourceNodeDef {
  id: string;
  material: string;
  position: Vec2;
  amount: number;
}

/** A connection to another chunk (request §4.2/§4.3); wiring is WI-08. */
export interface ExitDef {
  id: string;
  to: string;
  position: Vec2;
  /** An optional soft equipment gate (request §4.3); data only here. */
  requiredCapability?: string;
}

/** A creature spawn (request §19); resolved against the creature registry by the simulation. */
export interface CreatureSpawnDef {
  id: string;
  creature: string;
  position: Vec2;
  count?: number;
}

/** A world prop: a landmark, pocket, wreck, or cutaway interior (request §65). */
export interface PropDef {
  id: string;
  kind: 'wreck' | 'facility' | 'landmark' | 'pocket' | 'interior' | 'debris';
  position: Vec2;
  /** An optional cutaway outline rendered as a faint silhouette (request §65). */
  points?: readonly Vec2[];
  /** Marks a cutaway interior room (request §65). */
  interior?: boolean;
}

/** The §36 encounter trigger placed in a chunk (`triggers.ts` owns the types). */
export type TriggerDef = EncounterTrigger;

/** Per-chunk ambient parameters (request §14.3). */
export interface AmbientDef {
  /** Relative particle density for this chunk (0..1). */
  particleDensity?: number;
  /** Ambient light floor (0..1). */
  light?: number;
}

/** The §17 authored chunk: terrain, exits, and the per-chunk content. */
export interface WorldChunkDef {
  id: string;
  /** Which of the ~5 depth bands this chunk belongs to (request §4.1). */
  band: number;
  bounds: Rect;
  terrain: readonly TerrainShapeDef[];
  exits: readonly ExitDef[];
  resourceNodes?: readonly ResourceNodeDef[];
  creatureSpawns?: readonly CreatureSpawnDef[];
  props?: readonly PropDef[];
  triggers?: readonly TriggerDef[];
  ambient?: AmbientDef;
}

/**
 * The chunk-activation threshold in world units (request §17): chunks whose
 * bounds are within this of the player stay fully active; farther chunks have
 * their expensive AI/particles disabled. All coarse chunk definitions stay in
 * memory — only activation is streamed (request §17).
 */
export const CHUNK_ACTIVE_RADIUS = 3600;

/**
 * The chunks fully active around a position (request §17): those whose bounds
 * are within `radius` of `pos` (distance from `pos` to the nearest point of
 * the bounds). Pure and deterministic.
 */
export function computeActiveChunkIds(
  chunks: readonly WorldChunkDef[],
  pos: Vec2,
  radius: number = CHUNK_ACTIVE_RADIUS,
): Set<string> {
  const active = new Set<string>();
  for (const c of chunks) {
    const b = c.bounds;
    const dx = Math.max(b.x - pos.x, 0, pos.x - (b.x + b.w));
    const dy = Math.max(b.y - pos.y, 0, pos.y - (b.y + b.h));
    if (dx * dx + dy * dy <= radius * radius) active.add(c.id);
  }
  return active;
}

/** The chunk whose bounds contain `pos`, or null. */
export function chunkContaining(chunks: readonly WorldChunkDef[], pos: Vec2): WorldChunkDef | null {
  for (const c of chunks) {
    const b = c.bounds;
    if (pos.x >= b.x && pos.x <= b.x + b.w && pos.y >= b.y && pos.y <= b.y + b.h) return c;
  }
  return null;
}

/** The chunk that reaches the deepest point (the smallest y, request §4.1). */
export function deepestChunk(chunks: readonly WorldChunkDef[]): WorldChunkDef | null {
  let best: WorldChunkDef | null = null;
  let bestTop = Infinity;
  for (const c of chunks) {
    if (c.bounds.y <= bestTop) {
      bestTop = c.bounds.y;
      best = c;
    }
  }
  return best;
}

/**
 * The §32 world validation over the authored chunk data: every chunk id is
 * unique, every exit references an existing chunk, and the chunk that contains
 * the start position reaches the deepest chunk over the exit graph (request
 * §4.2 — the world is one connected descending network, not a straight shaft).
 */
export interface WorldValidation {
  valid: boolean;
  issues: string[];
}

export function validateWorldChunks(chunks: readonly WorldChunkDef[], startPos: Vec2): WorldValidation {
  const issues: string[] = [];
  const byId = new Map<string, WorldChunkDef>();
  for (const c of chunks) {
    if (byId.has(c.id)) issues.push(`duplicate chunk id ${c.id}`);
    byId.set(c.id, c);
  }
  for (const c of chunks) {
    for (const e of c.exits) {
      if (!byId.has(e.to)) issues.push(`chunk ${c.id} exit ${e.id} references unknown chunk ${e.to}`);
    }
  }
  const start = chunkContaining(chunks, startPos);
  if (start === null) {
    issues.push(`no chunk contains the start position (${startPos.x}, ${startPos.y})`);
    return { valid: false, issues };
  }
  const deepest = deepestChunk(chunks);
  if (deepest === null) {
    issues.push('no chunks supplied');
    return { valid: false, issues };
  }
  const seen = new Set<string>([start.id]);
  const queue: string[] = [start.id];
  while (queue.length > 0) {
    const id = queue.shift()!;
    const chunk = byId.get(id);
    if (chunk === undefined) continue; // an exit target that is not a chunk (reported above)
    for (const e of chunk.exits) {
      if (!seen.has(e.to) && byId.has(e.to)) {
        seen.add(e.to);
        queue.push(e.to);
      }
    }
  }
  if (!seen.has(deepest.id)) {
    issues.push(`start ${start.id} does not reach the deepest chunk ${deepest.id}`);
  }
  return { valid: issues.length === 0, issues };
}
