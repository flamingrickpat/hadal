# WI-06g — Section 43 accessibility controls

## Status: Implemented

## Acceptance Evidence Table

| Criterion | Artifact | Status |
|---|---|---|
| Settings UI entries for all five controls | `src/ui/settings.ts` — `SettingsOverlay` class with Volume slider, Screen shake, Reduced flashing, Radio subtitles, High-contrast sonar | done |
| Screen shake toggle | `src/game/Game.ts` — wired to `Renderer.setShakeEnabled()` | done |
| Reduced flashing toggle | `src/game/Game.ts` — wired to `Hud.setReducedFlashing()` and `SonarVisuals.setReducedFlashing()` | done |
| Radio-message subtitles | `src/game/Game.ts` — wired to existing radio element with show/hide toggle | done |
| Master volume slider | `src/game/Game.ts` — wired to `AudioSystem.setMasterVolume()` | done |
| High-contrast sonar option | `src/render/sonar.ts` — `SonarVisuals.setHiContrast()` switches to bright yellow | done |
| Save settings schema extension | `src/game/save.ts` — `AccessibilitySettings` interface, migration from v1 and missing v2 fields | done |
| Node tests for schema | `src/game/save.test.ts` — 4 new tests for defaults, round-trip, and migration | done |
| Browser verification | `application_verification.md` | done |

## Files Touched

- `src/game/save.ts` — Added `AccessibilitySettings` interface, `freshAccessibilitySettings()`, migration logic
- `src/game/save.test.ts` — Added 4 accessibility settings tests
- `src/game/Game.ts` — Integrated settings overlay, wired all 5 controls to systems
- `src/ui/settings.ts` — New settings overlay component (209 lines)
- `src/ui/hud.ts` — Added `setReducedFlashing()` method
- `src/render/sonar.ts` — Added `setHiContrast()` and `setReducedFlashing()` methods

## Notes for Reviewer

- The master volume slider already existed in `AudioSystem` (`buildVolumeSlider`). It's now also included in the settings overlay for consistent access.
- The high-contrast sonar option switches the sonar accent color from light blue (0x9fd8e8) to bright yellow (RGB 1, 1, 0.2) for maximum contrast against dark water.
- Reduced flashing disables the depth tick flash (HUD) and the sonar ring opacity fade (sonar visuals).
- The settings overlay is toggled with the 'I' key (for 'info/settings').
- All settings are persisted through the existing save/load cycle using the versioned save system.

## Shrink/Flatten Report

- No pass-through wrappers to remove.
- No one-use interfaces or factories.
- The `applyState` and `readState` methods in SettingsOverlay are retained for future use.
- No defensive branches for impossible internal states.

## Knowledge Notes

None consulted or written.
