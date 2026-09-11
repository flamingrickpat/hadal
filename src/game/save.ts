/**
 * persists — the versioned `SaveGameV1` save (request §42) to/from a
 *   storage-backed string, with graceful malformed-save handling (request §25, §70).
 *
 * archetype: interfacer
 * A side: the on-disk format — a versioned JSON string under `SAVE_KEY`
 *   (in `localStorage` in the browser), plus the `freshSave()` default.
 * B side: the in-memory `SaveGameV1` object the simulation restores from
 *   and serializes back.
 * lossy ops: none — a valid save round-trips exactly.
 * invariant: serialization, parsing, and version handling are
 *   storage-independent (request §30); this module never reads a browser
 *   global at load time.
 * fails when: the stored value is not valid JSON, has the wrong version, or
 *   is missing required fields — `parseSave` throws `SaveParseError` and
 *   `loadFromStorage` backs up the bad value and resets instead of crashing.
 */
export const SAVE_VERSION = 2;
export const SAVE_KEY = 'hadal.save.v2';
export const SAVE_BACKUP_KEY = 'hadal.save.v2.bak';

export interface SaveGameV1 {
  version: 1;
  playTimeSec: number;
  player: {
    health: number;
    oxygenUpgrade: number;
    equipmentIds: string[];
    inventory: Record<string, number>;
    banked: Record<string, number>;
  };
  world: {
    discoveredChunks: string[];
    openedShortcuts: string[];
    collectedUniqueIds: string[];
    storyFlags: string[];
    maxDepth: number;
    endingTriggered?: boolean;
  };
  settings: {
    masterVolume: number;
  };
}

export interface SaveGameV2 {
  version: 2;
  playTimeSec: number;
  player: {
    health: number;
    oxygenUpgrade: number;
    equipmentIds: string[];
    inventory: Record<string, number>;
    banked: Record<string, number>;
  };
  world: {
    discoveredChunks: string[];
    openedShortcuts: string[];
    collectedUniqueIds: string[];
    storyFlags: string[];
    maxDepth: number;
    endingTriggered?: boolean;
    // Endgame milestone fields (WI-05cb).
    endingVariant?: string;
    finalSequenceStep?: string;
    autosaveMilestones: string[];
  };
  settings: {
    masterVolume: number;
  };
}

export type SaveGame = SaveGameV1 | SaveGameV2;

export class SaveParseError extends Error {}

export function freshSave(): SaveGameV2 {
  return {
    version: SAVE_VERSION,
    playTimeSec: 0,
    player: {
      health: 100,
      oxygenUpgrade: 0,
      equipmentIds: [],
      inventory: {},
      banked: {},
    },
    world: {
      discoveredChunks: [],
      openedShortcuts: [],
      collectedUniqueIds: [],
      storyFlags: [],
      maxDepth: 0,
      autosaveMilestones: [],
    },
    settings: {
      masterVolume: 1,
    },
  };
}

export function serializeSave(save: SaveGame): string {
  return JSON.stringify(save);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseSave(raw: string): SaveGame {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    // Invalid JSON: a malformed stored value, not an internal error.
    throw new SaveParseError('save is not valid JSON');
  }
  if (!isRecord(data)) throw new SaveParseError('save is not an object');

  // Validate version and migrate.
  let saveVersion = data.version;
  if (saveVersion === 1) {
    // Trivial migration: add defaults for new endgame fields.
    data.version = 2;
    if (!isRecord(data.world)) throw new SaveParseError('save.world is missing');
    const w = data.world;
    if (!Array.isArray(w.autosaveMilestones)) w.autosaveMilestones = [];
    saveVersion = 2;
  }

  if (saveVersion !== SAVE_VERSION) {
    throw new SaveParseError(`unsupported save version: ${String(saveVersion)}`);
  }

  const p = data.player;
  if (!isRecord(p)) throw new SaveParseError('save.player is missing');
  if (typeof p.health !== 'number') throw new SaveParseError('save.player.health is not a number');
  if (typeof p.oxygenUpgrade !== 'number') throw new SaveParseError('save.player.oxygenUpgrade is not a number');
  if (!Array.isArray(p.equipmentIds)) throw new SaveParseError('save.player.equipmentIds is not an array');
  if (!isRecord(p.inventory)) throw new SaveParseError('save.player.inventory is missing');
  if (!isRecord(p.banked)) throw new SaveParseError('save.player.banked is missing');
  const w = data.world;
  if (!isRecord(w)) throw new SaveParseError('save.world is missing');
  if (!Array.isArray(w.discoveredChunks)) throw new SaveParseError('save.world.discoveredChunks is not an array');
  if (!Array.isArray(w.storyFlags)) throw new SaveParseError('save.world.storyFlags is not an array');
  if (typeof w.maxDepth !== 'number') throw new SaveParseError('save.world.maxDepth is not a number');
  const s = data.settings;
  if (!isRecord(s)) throw new SaveParseError('save.settings is missing');
  if (typeof s.masterVolume !== 'number') throw new SaveParseError('save.settings.masterVolume is not a number');
  return data as unknown as SaveGame;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface LoadedSave {
  save: SaveGame;
  reset: boolean;
  backedUp: boolean;
}

export function loadFromStorage(storage: StorageLike): LoadedSave {
  const raw = storage.getItem(SAVE_KEY);
  if (raw === null) return { save: freshSave(), reset: true, backedUp: false };
  try {
    return { save: parseSave(raw), reset: false, backedUp: false };
  } catch {
    // Malformed save: back the bad value up, clear the main key, reset to
    // fresh. The player starts a new game rather than the page crashing.
    storage.setItem(SAVE_BACKUP_KEY, raw);
    storage.removeItem(SAVE_KEY);
    return { save: freshSave(), reset: true, backedUp: true };
  }
}

export function saveToStorage(storage: StorageLike, save: SaveGame): void {
  storage.setItem(SAVE_KEY, serializeSave(save));
}

export function resetSave(storage: StorageLike): void {
  storage.removeItem(SAVE_KEY);
  storage.removeItem(SAVE_BACKUP_KEY);
}

export function makeMemoryStorage(initial?: Record<string, string>): StorageLike {
  const map: Record<string, string> = { ...initial };
  return {
    getItem: (key) => (key in map ? map[key] ?? null : null),
    setItem: (key, value) => {
      map[key] = value;
    },
    removeItem: (key) => {
      delete map[key];
    },
  };
}
