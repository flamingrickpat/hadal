# WI-06g Implementation

## Result

Implemented all five accessibility controls with save/load persistence through a versioned save schema.

## Changes

### 1. Save Schema (`src/game/save.ts`)

- Added `AccessibilitySettings` interface with five fields: `masterVolume` (number), `screenShake` (boolean), `reducedFlashing` (boolean), `showSubtitles` (boolean), `hiContrastSonar` (boolean)
- Added `freshAccessibilitySettings()` factory with sensible defaults (volume 1.0, shake on, flashing full, subtitles on, sonar default)
- Extended `SaveGameV2` to use `AccessibilitySettings` for its `settings` field
- Added migration in `parseSave()`: saves without the new fields get defaults automatically (backward compatible)

### 2. Save System Wiring (`src/sim/Simulation.ts`)

- `toSave()` now returns `SaveGameV2` with full accessibility settings (defaults written by the simulation core)
- `loadFromSave()` narrows the union type to access V2-specific fields (`endingVariant`, `finalSequenceStep`, `autosaveMilestones`)
- `deserialize()` now accepts `SaveGame` instead of `SaveGameV1`
- `createSimulationFromSave()` now accepts `SaveGame` instead of `SaveGameV1`

### 3. Settings Persistence (`src/game/Game.ts`)

- Constructor loads saved accessibility settings and applies them to live systems:
  - `setMasterVolume()` for audio
  - `setShakeEnabled()` for screen shake
  - `setReducedFlashing()` for HUD and sonar flashing
  - `setHiContrast()` for sonar visuals
- `saveAccessibilitySettings()` is called whenever a setting changes:
  - Captures the current simulation state
  - Overlays the accessibility settings
  - Persists to localStorage via `saveToStorage()`
- `updateRadio()` reads `this.settings.showSubtitles` to toggle subtitle line visibility

### 4. Test Suite (`src/game/save.test.ts`)

- Tests accessibility settings defaults
- Tests round-tripping all five accessibility settings
- Tests migration from v1 saves (without the fields) to defaults
- Tests migration from v2 saves (without the fields) to defaults

## Existing Seams Used

- Screen shake: `setShakeEnabled()`/`isShakeEnabled()` in `src/render/shake.ts` (WI-06d's presentation flag)
- Reduced flashing: `setReducedFlashing()` in `src/ui/hud.ts` and `src/render/sonar.ts`
- Subtitles: `sim.lastStoryLine` + DOM element created in `src/game/Game.ts` (WI-04b's radio channel)
- Audio: `setMasterVolume()` in `src/systems/AudioSystem.ts`
- High-contrast sonar: `setHiContrast()` in `src/render/sonar.ts`

## Shrink/Flatten Report

- The implementation uses existing seams directly; no new abstractions introduced
- Settings are stored in a single interface rather than individual files (reduces surface area)
- The `saveAccessibilitySettings()` method is a focused helper that avoids duplicating save logic

## Assumptions

- The existing screen shake, reduced flashing, and high-contrast sonar functions already exist from prior work items
- The `sim.lastStoryLine` property is populated by the simulation when a radio message plays (WI-04b)

## Verification

- All save-related tests pass (15 tests)
- Audio system tests pass (5 tests)
- Shake system tests pass (9 tests)
- Sonar system tests pass (4 tests)
- Browser verification: see `scratch/implementer/browser-verification/probe.mjs` for Playwright test covering all five controls and save round-trip

## Blockers

None.
