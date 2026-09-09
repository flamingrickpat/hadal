/**
 * holds — the full authored macro world (request §4.1/§4.2/§17): the starting
 *   coast band plus four deeper bands as a wide descending network, each band a
 *   set of `WorldChunkDef` entries (terrain, exits, props, interiors, triggers),
 *   the surface base, the player start, and the authored current fields.
 *
 * archetype: information-holder
 * owns: the authored chunk *instances* of the §17 `WorldChunkDef` family
 *   (`GREYBOX_WORLD` — the coast band — and `MACRO_WORLD` — all five depth
 *   bands), the `BASE` (the tiny surface platform, request §5), `PLAYER_START`,
 *   the derived `worldBounds`, and the authored `WORLD_CURRENT_FIELDS`
 *   (request §64). The chunk *shapes* live in `chunks.ts`; the current-field
 *   constructors live in `systems/CurrentSystem.ts`.
 * not own: the collision terrain (`terrain.ts`), the trigger evaluation
 *   (`triggers.ts`), or the current-field computation (`CurrentSystem`) — the
 *   data references them.
 * invariant: the map is one connected descending network — the coast is
 *   reachable from the start, the base is reachable from the start, the first
 *   `salvage` nodes are reachable by normal swimming, and the `seal` pocket is
 *   sealed (its node unreachable from the start, request §32). The world spans
 *   ~5 depth bands, ~24,000 wide, surface at y = 0, deepest ~-10,000
 *   (request §4.1). The coast band keeps the WI-02/03 greybox geometry so the
 *   core-loop and §70 scenarios still hold (preparatory refactor, request §4.2).
 * fails when: an edit strands the player inside a solid or breaks the
 *   start→deepest connectivity — verified by the core-loop scenario and
 *   `validateWorldChunks` (request §32), not by data checks.
 */
import { vec2, type Rect, type Vec2 } from '../util/math';
import type { TerrainShapeDef } from './terrain';
import type {
  WorldChunkDef,
  ResourceNodeDef,
  ExitDef,
  PropDef,
  TriggerDef,
} from './chunks';
import {
  driftField,
  ventField,
  pulsingCurrentField,
  eddyField,
  type CurrentField,
} from '../systems/CurrentSystem';

// Re-export the §17 data shapes for existing imports (Simulation, World, tests).
export type { WorldChunkDef, ResourceNodeDef, ExitDef, PropDef, TriggerDef };
export type { CurrentField };

export type StationId = 'workbench' | 'storage' | 'dive-terminal' | 'radio' | 'launch-edge';

export interface BaseDef {
  id: string;
  position: Vec2;
  radius: number;
  stations: readonly StationId[];
}

/** A closed rectangular slab (a world chunk's wall / floor / structure). */
function slab(id: string, x: number, y: number, w: number, h: number): TerrainShapeDef {
  return {
    id,
    closed: true,
    points: [vec2(x, y), vec2(x + w, y), vec2(x + w, y + h), vec2(x, y + h)],
  };
}

/** The starting coast band (request §5/§8) — the WI-02/03 greybox, refactored
 *  into the §17 chunk model (preparatory refactor, request §4.2). */
export const GREYBOX_WORLD: readonly WorldChunkDef[] = [
  {
    id: 'seabed',
    band: 1,
    bounds: { x: -3000, y: -2400, w: 9400, h: 2400 },
    terrain: [
      {
        id: 'seabed-floor',
        closed: true,
        // Collision shape: the coast seabed floor, open-ended on the east (the
        // east edge would seal the descent, since the shelf band's open water
        // continues past x = 6400, request §4.2). The top is a surface line,
        // the bottom is the floor; a notch at x 5000..6400 (down to y = -2400)
        // opens the descent into the shelf band (request §4.2 main route).
        // Open polyline (not closed): only the floor and the notch sides collide.
        points: [
          vec2(-3000, -1400),
          vec2(5000, -1400),
          vec2(5000, -2400),
          vec2(6400, -2400),
        ],
        // Rendered band: the floor silhouette (not the open water above it).
        visual: [
          vec2(-3000, -1620),
          vec2(-3000, -1400),
          vec2(5000, -1400),
          vec2(5000, -2400),
          vec2(6400, -2400),
          vec2(6400, -1620),
        ],
      },
    ],
    exits: [{ id: 'seabed-shelf', to: 'shelf', position: vec2(5600, -2200) }],
    resourceNodes: [
      // First `salvage` nodes (request §8): reachable by normal swimming from
      // the start; enough for the first upgrades (request §40).
      { id: 'salvage-1', material: 'salvage', position: vec2(1600, -900), amount: 4 },
      { id: 'salvage-2', material: 'salvage', position: vec2(1300, -1300), amount: 4 },
      { id: 'salvage-3', material: 'salvage', position: vec2(1900, -1300), amount: 4 },
      { id: 'salvage-4', material: 'salvage', position: vec2(700, -1300), amount: 4 },
      { id: 'salvage-5', material: 'salvage', position: vec2(300, -1200), amount: 4 },
    ],
    // A shallow-depth set piece: the first radio line as the player descends
    // (request §36); fires once, wired into the simulation (request §36/§60).
    triggers: [
      {
        id: 'coast-descent-line',
        once: true,
        condition: { type: 'reachDepth', depth: 300 },
        actions: [{ type: 'setStoryFlag', flag: 'descended' }, { type: 'showRadio', textId: 'radio-descent-1' }],
      },
    ],
    // Tier-2 useful fauna (ids debug-only, request §33): the drifter's
    // schooling stage patrols the shallow band — the east drift keeps it in
    // open water for a long time before it reaches the west wall.
    creatureSpawns: [{ id: 't31-coast', creature: 'T-31', position: vec2(5500, -600), count: 1 }],
    ambient: { particleDensity: 0.8, light: 0.8 },
  },
  {
    id: 'west-wall',
    band: 1,
    bounds: { x: -2650, y: -1313, w: 250, h: 413 },
    terrain: [
      {
        id: 'west-wall-slab',
        closed: true,
        points: [
          vec2(-2560, -1282),
          vec2(-2560, -900),
          vec2(-2496, -900),
          vec2(-2496, -1294),
        ],
        visual: [
          vec2(-2650, -1266),
          vec2(-2650, -900),
          vec2(-2400, -900),
          vec2(-2400, -1313),
        ],
      },
    ],
    exits: [],
  },
  {
    id: 'wall',
    band: 1,
    bounds: { x: 2350, y: -1000, w: 300, h: 1000 },
    terrain: [
      {
        id: 'wall-slab',
        closed: true,
        // A hanging pillar from the surface: the player swims under it at the
        // seabed level (request §4.2 — the coast feature the route threads past).
        points: [
          vec2(2370, 0),
          vec2(2370, -1000),
          vec2(2434, -1000),
          vec2(2434, 0),
        ],
        visual: [
          vec2(2350, 0),
          vec2(2350, -1000),
          vec2(2650, -1000),
          vec2(2650, 0),
        ],
      },
    ],
    exits: [],
  },
  {
    id: 'ridge',
    band: 1,
    bounds: { x: 4400, y: -1000, w: 700, h: 1000 },
    terrain: [
      {
        id: 'ridge-slab',
        closed: true,
        // A hanging pillar from the surface: the route threads under it at the
        // seabed level (request §4.2).
        points: [
          vec2(4700, 0),
          vec2(4700, -1000),
          vec2(4764, -1000),
          vec2(4764, 0),
        ],
        visual: [
          vec2(4400, 0),
          vec2(4400, -1000),
          vec2(5100, -1000),
          vec2(5100, 0),
          vec2(4800, -1400),
        ],
      },
    ],
    exits: [],
  },
  {
    id: 'seal',
    band: 1,
    bounds: { x: -1260, y: -1600, w: 120, h: 1600 },
    terrain: [
      {
        id: 'seal-slab',
        closed: true,
        // A full-column wall: the pocket west of it is sealed and its node is
        // unreachable from the start (request §32 blocked route). A sealed
        // pocket legitimately has no exits (request §4.2).
        points: [
          vec2(-1260, 0),
          vec2(-1260, -1600),
          vec2(-1140, -1600),
          vec2(-1140, 0),
        ],
      },
    ],
    exits: [],
    resourceNodes: [
      { id: 'salvage-sealed', material: 'salvage', position: vec2(-1500, -900), amount: 4 },
    ],
  },
];

/** Band 2 (the shelf): a wide open band with a landmark, a pocket, and a
 *  cutaway interior; the main route descends east, a shortcut skips to the abyss. */
const shelf: WorldChunkDef = {
  id: 'shelf',
  band: 2,
  bounds: { x: 4600, y: -5200, w: 10300, h: 3200 },
  terrain: [
    slab('shelf-west-wall', 4600, -5200, 400, 3200),
    slab('shelf-east-wall', 14500, -5200, 400, 3200),
    // The shelf floor has a gap at x 9000..10000 (the descent corridor into the
    // twilight band, request §4.2). The player swims through the gap to descend.
    slab('shelf-floor-west', 5000, -5200, 4000, 300),
    slab('shelf-floor-east', 10000, -5200, 4000, 300),
    slab('shelf-landmark', 11500, -4000, 2000, 1000),
    slab('shelf-pocket-wall', 5000, -4500, 700, 300),
    // Cutaway interior (a wreck room) at x 10500..13000, y -4400..-3400, with
    // a gap in the west wall (the entrance, request §65 — swim through, no
    // door). Placed east of the main descent corridor (x ~9500) so the
    // descending route stays clear (request §4.2).
    slab('shelf-int-west-top', 10500, -4200, 200, 200),
    slab('shelf-int-west-bottom', 10500, -3800, 200, 200),
    slab('shelf-int-east', 12800, -4200, 200, 600),
    slab('shelf-int-ceiling', 10500, -4400, 2500, 200),
    slab('shelf-int-floor', 10500, -3600, 2500, 200),
  ],
  exits: [
    { id: 'shelf-seabed', to: 'seabed', position: vec2(5600, -2200) },
    { id: 'shelf-twilight', to: 'twilight', position: vec2(9500, -5000) },
    { id: 'shelf-abyss-shortcut', to: 'abyss', position: vec2(7000, -5000) },
  ],
  props: [
    { id: 'shelf-landmark', kind: 'landmark', position: vec2(12500, -3500) },
    { id: 'shelf-pocket', kind: 'pocket', position: vec2(5600, -4600) },
    { id: 'shelf-interior', kind: 'interior', position: vec2(11800, -3900), interior: true },
  ],
  // Tier-1 ambient/schooling fauna (internal ids only, request §33): dense
  // open-water schooling, clear of the landmark and the wreck interior.
  creatureSpawns: [
    { id: 't01-shelf', creature: 'T-01', position: vec2(7000, -3500), count: 6 },
    { id: 't02-shelf', creature: 'T-02', position: vec2(8000, -3000), count: 3 },
    { id: 't03-shelf', creature: 'T-03', position: vec2(9500, -3500), count: 3 },
    { id: 't13-shelf', creature: 'T-13', position: vec2(11000, -2500), count: 2 },
    // Tier-2 useful fauna (ids debug-only, request §33): the shelf is the
    // sweeper's salvage-rich band and the drifter's shallow stage — both in
    // open water, clear of the landmark and the wreck interior.
    { id: 't10-shelf', creature: 'T-10', position: vec2(7500, -3800), count: 2 },
    { id: 't31-shelf', creature: 'T-31', position: vec2(8500, -3000), count: 1 },
  ],
  ambient: { particleDensity: 0.6, light: 0.5 },
};

/** Band 3 (the twilight): a wide band with a landmark, a pocket, and a second
 *  cutaway interior; the main route descends east, a shortcut skips to the hadal. */
const twilight: WorldChunkDef = {
  id: 'twilight',
  band: 3,
  bounds: { x: 8600, y: -8000, w: 10400, h: 3200 },
  terrain: [
    slab('twilight-west-wall', 8600, -8000, 400, 3200),
    // The twilight east wall has a gap at y -7800..-7600 (the descent corridor
    // to the abyss, request §4.2). The player swims east through the gap to
    // the abyss band, then descends to the abyss floor.
    slab('twilight-east-wall-top', 18600, -7600, 400, 2800),
    slab('twilight-east-wall-bottom', 18600, -8000, 400, 200),
    // The twilight floor has a gap at x 14000..19000 (the descent corridor
    // into the abyss, request §4.2). The player swims through the gap to
    // descend to the abyss floor.
    slab('twilight-floor-west', 9000, -8000, 5000, 300),
    slab('twilight-landmark', 15500, -6800, 2200, 1200),
    slab('twilight-pocket-wall', 9000, -7200, 800, 300),
    // Cutaway interior (a facility room) at x 10500..13000, y -7000..-6000,
    // with a gap in the west wall (the entrance, request §65 — swim through,
    // no door). Placed west of the main descent corridor (x ~14500..19000)
    // so the descending route stays clear (request §4.2).
    slab('twilight-int-west-top', 10500, -6800, 200, 200),
    slab('twilight-int-west-bottom', 10500, -6400, 200, 200),
    slab('twilight-int-east', 12800, -6800, 200, 600),
    slab('twilight-int-ceiling', 10500, -7000, 2500, 200),
    slab('twilight-int-floor', 10500, -6200, 2500, 200),
  ],
  exits: [
    { id: 'twilight-shelf', to: 'shelf', position: vec2(9500, -5000) },
    { id: 'twilight-abyss', to: 'abyss', position: vec2(17500, -7800) },
    { id: 'twilight-hadal-shortcut', to: 'hadal', position: vec2(10500, -7800) },
  ],
  props: [
    { id: 'twilight-landmark', kind: 'landmark', position: vec2(16600, -6200) },
    { id: 'twilight-pocket', kind: 'pocket', position: vec2(9800, -7300) },
    { id: 'twilight-interior', kind: 'interior', position: vec2(11800, -6500), interior: true },
  ],
  triggers: [
    {
      id: 'twilight-abyssal-line',
      once: true,
      condition: { type: 'reachDepth', depth: 6000 },
      actions: [{ type: 'setStoryFlag', flag: 'abyssal-reached' }, { type: 'showRadio', textId: 'radio-abyssal-1' }],
    },
  ],
  // Tier-1 ambient fauna (internal ids only, request §33): the hanging feeder
  // hovers just above the facility interior, near the vent field; the rest ride
  // open water.
  creatureSpawns: [
    { id: 't02-twilight', creature: 'T-02', position: vec2(10000, -5500), count: 3 },
    { id: 't03-twilight', creature: 'T-03', position: vec2(11000, -5000), count: 3 },
    { id: 't05-twilight', creature: 'T-05', position: vec2(12500, -5800), count: 3 },
    { id: 't06-twilight', creature: 'T-06', position: vec2(14000, -5500), count: 3 },
    { id: 't13-twilight', creature: 'T-13', position: vec2(16000, -5000), count: 2 },
    // Tier-2 useful fauna (ids debug-only, request §33): the mid-depth band
    // the roster centers this tier on — the feeder and the lifter hold open
    // water, the herder works the congregation lane, the sweeper the facility
    // wreck, and the living cable spans wreck to landmark.
    { id: 't08-twilight', creature: 'T-08', position: vec2(15600, -7700), count: 1 },
    { id: 't09-twilight', creature: 'T-09', position: vec2(11000, -5300), count: 2 },
    { id: 't10-twilight', creature: 'T-10', position: vec2(13900, -6850), count: 2 },
    { id: 't11-twilight', creature: 'T-11', position: vec2(14500, -5900), count: 1 },
    { id: 't27-twilight', creature: 'T-27', position: vec2(13400, -5600), count: 1 },
    // The drifter's mid stage: placed above the landmark (which caps the band's
    // upper water) so its westward drift traverses open twilight, not a solid.
    { id: 't31-twilight', creature: 'T-31', position: vec2(18200, -5300), count: 1 },
  ],
  ambient: { particleDensity: 0.5, light: 0.35 },
};

/** Band 4 (the abyss): the deep band with a landmark, a pocket, and a cutaway
 *  interior; the main route descends east to the hadal pocket. */
const abyss: WorldChunkDef = {
  id: 'abyss',
  band: 4,
  bounds: { x: 13600, y: -10000, w: 10400, h: 2400 },
  terrain: [
    slab('abyss-west-wall', 13600, -10000, 400, 2400),
    slab('abyss-east-wall', 23600, -10000, 400, 2400),
    // The abyss floor has a gap at x 14500..20000 (the descent corridor into
    // the hadal band, request §4.2). The player swims through the gap to
    // descend to the hadal floor.
    slab('abyss-floor-west', 14000, -10000, 500, 300),
    slab('abyss-floor-east', 20000, -10000, 2000, 300),
    slab('abyss-landmark', 19500, -9000, 2400, 1400),
    slab('abyss-pocket-wall', 14000, -9400, 900, 300),
    // Cutaway interior (a deep facility) at x 16900..19500, y -9200..-8400.
    slab('abyss-int-west-top', 16900, -9000, 200, 200),
    slab('abyss-int-west-bottom', 16900, -8600, 200, 200),
    slab('abyss-int-east', 19500, -9000, 200, 600),
    slab('abyss-int-ceiling', 16900, -9200, 2600, 200),
    slab('abyss-int-floor', 16900, -8400, 2600, 200),
  ],
  exits: [
    { id: 'abyss-twilight', to: 'twilight', position: vec2(14500, -7800) },
    { id: 'abyss-hadal', to: 'hadal', position: vec2(20500, -9800) },
  ],
  props: [
    { id: 'abyss-landmark', kind: 'landmark', position: vec2(20700, -8300) },
    { id: 'abyss-pocket', kind: 'pocket', position: vec2(14800, -9500) },
    { id: 'abyss-interior', kind: 'interior', position: vec2(18300, -8700), interior: true },
  ],
  triggers: [
    {
      id: 'abyss-deep-line',
      once: true,
      condition: { type: 'reachDepth', depth: 8500 },
      actions: [{ type: 'setStoryFlag', flag: 'deep-reached' }, { type: 'showRadio', textId: 'radio-deep-1' }],
    },
  ],
  // Tier-1 ambient fauna (internal ids only, request §33), clear of the
  // landmark block and the facility interior.
  creatureSpawns: [
    { id: 't03-abyss', creature: 'T-03', position: vec2(15500, -8000), count: 3 },
    { id: 't06-abyss', creature: 'T-06', position: vec2(17000, -7800), count: 4 },
    { id: 't13-abyss', creature: 'T-13', position: vec2(22500, -8000), count: 2 },
    // Tier-2 useful fauna (ids debug-only, request §33): the deep band of the
    // feeder (it works the facility wreck) and the drifter's mid-water stage.
    { id: 't08-abyss', creature: 'T-08', position: vec2(18700, -8900), count: 1 },
    { id: 't09-abyss', creature: 'T-09', position: vec2(17200, -8200), count: 1 },
    { id: 't31-abyss', creature: 'T-31', position: vec2(15500, -8300), count: 1 },
  ],
  ambient: { particleDensity: 0.45, light: 0.25 },
};

/** Band 5 (the hadal): the deepest pocket — the lost installation. The deepest
 *  point of the world (request §4.1); the MacGuffin site is here (WI-08). */
const hadal: WorldChunkDef = {
  id: 'hadal',
  band: 5,
  bounds: { x: 18100, y: -10000, w: 5400, h: 400 },
  terrain: [
    slab('hadal-west-wall', 18100, -10000, 400, 400),
    slab('hadal-east-wall', 23100, -10000, 400, 400),
    slab('hadal-floor', 18500, -10000, 4600, 300),
    // The optional pocket (request §4.2): a small overhang in the west section
    // forming a nook with a salvage cache; the player swims under the ledge
    // (y -9700..-9590) to reach it — off the main return line.
    slab('hadal-pocket-ledge', 18550, -9590, 450, 30),
    // The lost-installation interior (a cutaway facility, request §65): a room
    // at x 20300..22700, y -9800..-9400, with a gap in the west wall.
    slab('hadal-int-west-top', 20100, -9800, 200, 100),
    slab('hadal-int-west-bottom', 20100, -9600, 200, 200),
    slab('hadal-int-east', 22500, -9800, 200, 400),
    slab('hadal-int-ceiling', 20100, -9900, 2600, 100),
    slab('hadal-int-floor', 20100, -9400, 2600, 200),
  ],
  exits: [{ id: 'hadal-abyss', to: 'abyss', position: vec2(19000, -9700) }],
  props: [
    { id: 'hadal-landmark', kind: 'facility', position: vec2(21400, -9500) },
    { id: 'hadal-interior', kind: 'interior', position: vec2(21400, -9600), interior: true },
    // The optional pocket (request §4.2): the terminus zone still carries its
    // own optional alcove, so the per-zone §4.2 parity (pocket + landmark +
    // interior + return) holds end to end. As with the other bands' pockets it
    // is an alcove, not a critical-path node; its harvest material / lore lands
    // with the progression pass (WI-08).
    { id: 'hadal-pocket', kind: 'pocket', position: vec2(18775, -9640) },
  ],
  triggers: [
    {
      id: 'hadal-floor-line',
      once: true,
      condition: { type: 'reachDepth', depth: 9600 },
      actions: [{ type: 'setStoryFlag', flag: 'hadal-reached' }, { type: 'showRadio', textId: 'radio-hadal-1' }],
    },
  ],
  // Tier-1 ambient fauna (internal ids only, request §33): a sparse drifter
  // ribbon in the deepest band, west of the installation.
  // + the drifter's hadal stage (ids debug-only, request §33): the deepest
  // band still carries the tier's drifting-seed form, west of the installation.
  creatureSpawns: [
    { id: 't06-hadal', creature: 'T-06', position: vec2(19500, -9650), count: 2 },
    { id: 't31-hadal', creature: 'T-31', position: vec2(19800, -9650), count: 1 },
  ],
  ambient: { particleDensity: 0.4, light: 0.15 },
};

/** The full macro world: the coast band plus the four deeper bands. */
export const MACRO_WORLD: readonly WorldChunkDef[] = [
  ...GREYBOX_WORLD,
  shelf,
  twilight,
  abyss,
  hadal,
];

/** The player start (the surface base edge, request §5). */
export const PLAYER_START: Vec2 = vec2(1300, -100);

export const BASE: BaseDef = {
  id: 'surface-base',
  position: vec2(1300, 0),
  radius: 260,
  stations: ['workbench', 'storage', 'dive-terminal', 'radio', 'launch-edge'],
};

/**
 * The authored current fields (request §64): a global horizontal drift that
 * strengthens with depth, a vertical vent, a pulsing current, and an eddy — all
 * in the deeper bands (the coast band is current-free so the §70 scenarios are
 * stable). Particles follow the same field (request §64).
 */
export const WORLD_CURRENT_FIELDS: readonly CurrentField[] = [
  // A global drift across the deep water column (the band's dominant current).
  driftField({ x: 4600, y: -10000, w: 20000, h: 8600 }, vec2(1, -0.2), 26),
  // A vertical vent in the twilight band (an upwelling).
  ventField({ x: 13000, y: -7600, w: 3000, h: 2800 }, 40),
  // A pulsing current in the abyss band.
  pulsingCurrentField({ x: 16000, y: -9600, w: 5000, h: 1800 }, vec2(1, 0), 55, 6),
  // A slow circular eddy in the hadal band.
  eddyField({ x: 19000, y: -9800, w: 4000, h: 400 }, 3200, 30),
];

export function worldBounds(chunks: readonly WorldChunkDef[]): Rect {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const c of chunks) {
    minX = Math.min(minX, c.bounds.x);
    minY = Math.min(minY, c.bounds.y);
    maxX = Math.max(maxX, c.bounds.x + c.bounds.w);
    maxY = Math.max(maxY, c.bounds.y + c.bounds.h);
  }
  if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
    throw new Error('worldBounds: no chunks supplied');
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}
