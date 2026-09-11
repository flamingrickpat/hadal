/**
 * problem — the bathymetry map overlay (request §26) needs a read-only
 *   presentation view of explored space; solution — build a view model
 *   from the live simulation state that exposes only the allowed map
 *   fields: player position, explored chunk silhouettes, base, discovered
 *   landmarks, and an optional death beacon. Creature positions are
 *   structurally excluded.
 *
 * archetype: interfacer
 * A side: the live `Simulation` state (chunks, player, discoveredChunks,
 *   base, storyFlags)
 * B side: a serializable, read-only `MapViewModel` that the map overlay
 *   renders without any knowledge of the simulation internals
 * invariant: the view model never carries creature positions or
 *   simulation-internal state; it is built fresh each frame from the
 *   current simulation
 * fails when: the simulation state is missing expected fields — the
 *   builder throws (an internal invariant violation, not expected)
 */
import type { Simulation } from '../sim/Simulation';
import type { Vec2 } from '../util/math';

export interface MapExplodedChunk {
  id: string;
  bounds: { x: number; y: number; w: number; h: number };
}

export interface MapLandmark {
  id: string;
  position: Vec2;
}

export interface MapViewModel {
  playerPosition: Vec2;
  exploredChunks: MapExplodedChunk[];
  base: { position: Vec2 };
  landmarks: MapLandmark[];
  beacon: Vec2 | null;
}

const BEACON_FLAG = 'death-beacon';

export function buildMapViewModel(sim: Simulation): MapViewModel {
  const discoveredIds = new Set(sim.discoveredChunks);

  // Explored chunk silhouettes (bounds of discovered chunks)
  const exploredChunks: MapExplodedChunk[] = [];
  for (const chunk of sim.chunks) {
    if (discoveredIds.has(chunk.id)) {
      exploredChunks.push({
        id: chunk.id,
        bounds: {
          x: chunk.bounds.x,
          y: chunk.bounds.y,
          w: chunk.bounds.w,
          h: chunk.bounds.h,
        },
      });
    }
  }

  // Discovered landmarks: props with kind='landmark' in discovered chunks
  const landmarks: MapLandmark[] = [];
  for (const chunk of sim.chunks) {
    if (!discoveredIds.has(chunk.id)) continue;
    if (chunk.props === undefined) continue;
    for (const prop of chunk.props) {
      if (prop.kind === 'landmark') {
        landmarks.push({
          id: prop.id,
          position: { x: prop.position.x, y: prop.position.y },
        });
      }
    }
  }

  // Death beacon: present only if the story flag is set
  const beacon = sim.storyFlags.includes(BEACON_FLAG)
    ? { x: sim.player.position.x, y: sim.player.position.y }
    : null;

  return {
    playerPosition: { x: sim.player.position.x, y: sim.player.position.y },
    exploredChunks,
    base: { position: { x: sim.base.position.x, y: sim.base.position.y } },
    landmarks,
    beacon,
  };
}
