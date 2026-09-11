// WI-06g accessibility round-trip probe (independent reviewer verification)
// Verifies that the save schema correctly handles accessibility settings.

import {
  parseSave,
  serializeSave,
  freshSave,
  type SaveGameV2,
} from '../../../src/game/save';

test('fresh save has all 5 accessibility fields with defaults', () => {
  const fresh = freshSave();
  expect(fresh.version).toBe(2);
  expect(fresh.settings).toEqual({
    masterVolume: 1,
    screenShake: true,
    reducedFlashing: false,
    showSubtitles: true,
    hiContrastSonar: false,
  });
});

test('all 5 accessibility fields round-trip exactly', () => {
  const custom = freshSave();
  custom.settings.masterVolume = 0.5;
  custom.settings.screenShake = false;
  custom.settings.reducedFlashing = true;
  custom.settings.showSubtitles = false;
  custom.settings.hiContrastSonar = true;

  const restored = parseSave(serializeSave(custom)) as SaveGameV2;
  expect(restored.settings).toEqual({
    masterVolume: 0.5,
    screenShake: false,
    reducedFlashing: true,
    showSubtitles: false,
    hiContrastSonar: true,
  });
});

test('v1 save migrates to v2 with accessibility defaults', () => {
  const v1Save = {
    version: 1,
    playTimeSec: 100,
    player: {
      health: 80,
      oxygenUpgrade: 0,
      equipmentIds: ['tank-1'],
      inventory: { salvage: 3 },
      banked: { salvage: 0 },
    },
    world: {
      discoveredChunks: ['seabed'],
      openedShortcuts: [],
      collectedUniqueIds: [],
      storyFlags: [],
      maxDepth: 100,
    },
    settings: { masterVolume: 0.8 },
  };

  const migrated = parseSave(serializeSave(v1Save)) as SaveGameV2;
  expect(migrated.version).toBe(2);
  expect(migrated.settings.masterVolume).toBe(0.8);
  expect(migrated.settings.screenShake).toBe(true);
  expect(migrated.settings.reducedFlashing).toBe(false);
  expect(migrated.settings.showSubtitles).toBe(true);
  expect(migrated.settings.hiContrastSonar).toBe(false);
});

test('old v2 save (pre-accessibility) migrates with defaults', () => {
  const oldV2Save = {
    version: 2,
    playTimeSec: 200,
    player: {
      health: 70,
      oxygenUpgrade: 1,
      equipmentIds: ['fins-1'],
      inventory: { salvage: 2 },
      banked: { salvage: 1 },
    },
    world: {
      discoveredChunks: [],
      openedShortcuts: [],
      collectedUniqueIds: [],
      storyFlags: [],
      maxDepth: 50,
      endingTriggered: false,
      autosaveMilestones: [],
    },
    settings: { masterVolume: 0.5 },
  };

  const migrated = parseSave(serializeSave(oldV2Save)) as SaveGameV2;
  expect(migrated.settings.masterVolume).toBe(0.5);
  expect(migrated.settings.screenShake).toBe(true);
  expect(migrated.settings.reducedFlashing).toBe(false);
  expect(migrated.settings.showSubtitles).toBe(true);
  expect(migrated.settings.hiContrastSonar).toBe(false);
});

test('mixed save preserves some fields and fills defaults', () => {
  const mixedSave = {
    version: 2,
    playTimeSec: 100,
    player: {
      health: 50,
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
      maxDepth: 25,
      autosaveMilestones: [],
    },
    settings: {
      masterVolume: 0.7,
      screenShake: false,
    },
  };

  const migrated = parseSave(serializeSave(mixedSave)) as SaveGameV2;
  expect(migrated.settings.masterVolume).toBe(0.7);
  expect(migrated.settings.screenShake).toBe(false);
  expect(migrated.settings.reducedFlashing).toBe(false);
  expect(migrated.settings.showSubtitles).toBe(true);
  expect(migrated.settings.hiContrastSonar).toBe(false);
});