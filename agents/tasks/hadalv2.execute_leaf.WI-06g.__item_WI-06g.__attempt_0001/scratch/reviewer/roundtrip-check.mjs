// WI-06g accessibility round-trip probe (Node, no browser)
// Verifies that the save schema correctly handles accessibility settings:
// 1. New save has all 5 fields with defaults
// 2. All 5 fields round-trip exactly
// 3. Old v1 save migrates to v2 with defaults
// 4. Old v2 save (pre-accessibility) migrates with defaults
// 5. Mixed save (some accessibility fields) preserves those and fills defaults

import {
  parseSave,
  serializeSave,
  freshSave,
} from '../../src/game/save.ts';

let failures = [];
let passCount = 0;

function check(name, condition) {
  if (condition) {
    passCount++;
    console.log(`PASS: ${name}`);
  } else {
    failures.push(name);
    console.log(`FAIL: ${name}`);
  }
}

// Test 1: Fresh save has all 5 accessibility fields with defaults
const fresh = freshSave();
check('fresh save has version 2', fresh.version === 2);
check('fresh save has masterVolume', typeof fresh.settings.masterVolume === 'number');
check('fresh save has screenShake', typeof fresh.settings.screenShake === 'boolean');
check('fresh save has reducedFlashing', typeof fresh.settings.reducedFlashing === 'boolean');
check('fresh save has showSubtitles', typeof fresh.settings.showSubtitles === 'boolean');
check('fresh save has hiContrastSonar', typeof fresh.settings.hiContrastSonar === 'boolean');

// Test 2: All 5 fields round-trip exactly
const custom = freshSave();
custom.settings.masterVolume = 0.5;
custom.settings.screenShake = false;
custom.settings.reducedFlashing = true;
custom.settings.showSubtitles = false;
custom.settings.hiContrastSonar = true;
const restored = parseSave(serializeSave(custom));
check('masterVolume round-trips', restored.settings.masterVolume === 0.5);
check('screenShake round-trips', restored.settings.screenShake === false);
check('reducedFlashing round-trips', restored.settings.reducedFlashing === true);
check('showSubtitles round-trips', restored.settings.showSubtitles === false);
check('hiContrastSonar round-trips', restored.settings.hiContrastSonar === true);

// Test 3: Old v1 save migrates to v2 with defaults
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
const migrated = parseSave(serializeSave(v1Save));
check('v1 save migrates to v2', migrated.version === 2);
check('v1 save masterVolume preserved', migrated.settings.masterVolume === 0.8);
check('v1 save gets screenShake default', migrated.settings.screenShake === true);
check('v1 save gets reducedFlashing default', migrated.settings.reducedFlashing === false);
check('v1 save gets showSubtitles default', migrated.settings.showSubtitles === true);
check('v1 save gets hiContrastSonar default', migrated.settings.hiContrastSonar === false);

// Test 4: Old v2 save (pre-accessibility) migrates with defaults
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
const migratedOldV2 = parseSave(serializeSave(oldV2Save));
check('old v2 save gets screenShake default', migratedOldV2.settings.screenShake === true);
check('old v2 save gets reducedFlashing default', migratedOldV2.settings.reducedFlashing === false);
check('old v2 save gets showSubtitles default', migratedOldV2.settings.showSubtitles === true);
check('old v2 save gets hiContrastSonar default', migratedOldV2.settings.hiContrastSonar === false);

// Test 5: Mixed save (some accessibility fields) preserves those and fills defaults
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
    screenShake: false,  // custom
  },
};
const migratedMixed = parseSave(serializeSave(mixedSave));
check('mixed save preserves masterVolume', migratedMixed.settings.masterVolume === 0.7);
check('mixed save preserves screenShake', migratedMixed.settings.screenShake === false);
check('mixed save gets reducedFlashing default', migratedMixed.settings.reducedFlashing === false);
check('mixed save gets showSubtitles default', migratedMixed.settings.showSubtitles === true);
check('mixed save gets hiContrastSonar default', migratedMixed.settings.hiContrastSonar === false);

console.log(`\nTotal: ${passCount} passed, ${failures.length} failed`);
if (failures.length > 0) {
  console.log('Failed:', failures.join(', '));
}