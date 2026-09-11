import { describe, expect, it } from 'vitest';
import {
  freshSave,
  loadFromStorage,
  makeMemoryStorage,
  parseSave,
  saveToStorage,
  SAVE_KEY,
  SAVE_BACKUP_KEY,
  SAVE_VERSION,
  serializeSave,
  type SaveGameV2,
} from './save';

function populatedSave(): SaveGameV2 {
  const s = freshSave();
  s.playTimeSec = 1234.5;
  s.player.health = 42;
  s.player.oxygenUpgrade = 1;
  s.player.equipmentIds = ['tank-1', 'fins-1'];
  s.player.inventory = { salvage: 5 };
  s.player.banked = { salvage: 12 };
  s.world.discoveredChunks = ['seabed', 'wall'];
  s.world.storyFlags = ['base-line-0'];
  s.world.maxDepth = 875;
  s.settings.masterVolume = 0.6;
  return s;
}

describe('SaveGameV2 (request §42, §70, WI-05cb)', () => {
  it('has version 2', () => {
    expect(SAVE_VERSION).toBe(2);
    expect(freshSave().version).toBe(2);
  });

  it('serialize -> deserialize round-trips exactly', () => {
    const save = populatedSave();
    const restored = parseSave(serializeSave(save));
    expect(restored).toEqual(save);
  });

  it('round-trips a fresh save exactly', () => {
    expect(parseSave(serializeSave(freshSave()))).toEqual(freshSave());
  });

  it('preserves the version field through the round trip', () => {
    const save = populatedSave();
    const restored = parseSave(serializeSave(save));
    expect(restored.version).toBe(2);
    expect(restored.player.equipmentIds).toEqual(['tank-1', 'fins-1']);
    expect(restored.world.maxDepth).toBe(875);
  });

  it('throws a typed error on non-JSON', () => {
    expect(() => parseSave('not-json')).toThrow();
  });

  it('throws on a wrong version', () => {
    const s = freshSave();
    (s as unknown as { version: number }).version = 99;
    expect(() => parseSave(serializeSave(s))).toThrow(/version/);
  });

  it('throws when a required field is missing', () => {
    const s = freshSave();
    delete (s as unknown as { settings: unknown }).settings;
    expect(() => parseSave(serializeSave(s))).toThrow();
  });

  it('resets and backs up a malformed stored save gracefully', () => {
    const storage = makeMemoryStorage({ [SAVE_KEY]: '{ this is not valid' });
    const { save, reset, backedUp } = loadFromStorage(storage);
    expect(reset).toBe(true);
    expect(backedUp).toBe(true);
    expect(save.version).toBe(2);
    expect(storage.getItem(SAVE_KEY)).toBe(null);
    expect(storage.getItem(SAVE_BACKUP_KEY)).toBe('{ this is not valid');
  });

  it('resets to fresh when no save is present', () => {
    const storage = makeMemoryStorage();
    const { save, reset } = loadFromStorage(storage);
    expect(reset).toBe(true);
    expect(save.version).toBe(2);
  });

  it('loads a valid stored save without resetting', () => {
    const storage = makeMemoryStorage({ [SAVE_KEY]: serializeSave(populatedSave()) });
    const { save, reset, backedUp } = loadFromStorage(storage);
    expect(reset).toBe(false);
    expect(backedUp).toBe(false);
    expect(save.player.equipmentIds).toEqual(['tank-1', 'fins-1']);
  });

  it('round-trips through the storage adapter', () => {
    const storage = makeMemoryStorage();
    const save = populatedSave();
    saveToStorage(storage, save);
    expect(parseSave(storage.getItem(SAVE_KEY)!)).toEqual(save);
  });
});
