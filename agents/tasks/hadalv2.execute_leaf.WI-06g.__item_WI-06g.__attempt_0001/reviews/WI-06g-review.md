# Review: WI-06g — Section 43 accessibility controls

Status: pass

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| Settings UI entries for all five controls | pass | `src/ui/settings.ts` — `SettingsOverlay` class with Volume slider, Screen shake, Reduced flashing, Radio subtitles, High-contrast sonar toggles |
| Screen shake toggle | pass | `src/game/Game.ts` wired to `Renderer.setShakeEnabled()` → `src/render/shake.ts` `setShakeEnabled()` (the WI-06d presentation flag) |
| Reduced flashing toggle | pass | `src/game/Game.ts` wired to `Hud.setReducedFlashing()` (gates `fireDepthTick()`) and `SonarVisuals.setReducedFlashing()` (removes ring opacity fade) |
| Radio-message subtitles | pass | `src/game/Game.ts` `updateRadio()` reads `sim.lastStoryLine`, writes to `this.radio` DOM element, toggles visibility via `settings.showSubtitles` |
| Master volume slider | pass | `src/game/Game.ts` wired to `AudioSystem.setMasterVolume()` |
| High-contrast sonar option | pass | `src/render/sonar.ts` `setHiContrast()` switches accent color to bright yellow (1, 1, 0.2) |
| Save settings schema extension | pass | `src/game/save.ts` — `AccessibilitySettings` interface, `freshAccessibilitySettings()` factory, `SaveGameV2.settings` uses the interface, migration in `parseSave()` fills missing fields with defaults |
| Node tests for schema | pass | `src/game/save.test.ts` — 4 new tests: defaults, round-trip, v1 migration, v2 migration |
| Browser verification | pass | `application_verification.md` documents Playwright probe results; probe at `scratch/implementer/browser-verification/probe.mjs` |
| Suite and build stay green | pass | All 15 save tests pass; 33 WI-06g-related tests (save, audio, shake, sonar) pass; build errors are pre-existing (lighting, tier4, roster) |

## Findings

None.

The two findings from the first review attempt (commit 0d94438) have been addressed in commit 29201ac:
1. `Simulation.toSave()` now returns the full `SaveGameV2` with all accessibility settings (previously returned only `masterVolume`)
2. Migration test type annotations are correct (`SaveGameV1` and `SaveGame` imports used properly)

## Impact Check

- `AccessibilitySettings` interface (`src/game/save.ts:22`) — defined here, consumed by `SaveGameV2` and `SettingsOverlay`; callers: `src/game/Game.ts`, `src/ui/settings.ts`, `src/sim/Simulation.ts`. No callers outside the accessibility subsystem affected.
- `SettingsOverlay` class (`src/ui/settings.ts:30`) — new component, called only from `Game.ts` constructor. No blast radius.
- `setHiContrast` (`src/render/sonar.ts:119`) — new method, called only from `Game.ts`. No blast radius.
- `setReducedFlashing` (`src/render/sonar.ts:130`, `src/ui/hud.ts:106`) — new methods, called only from `Game.ts`. No blast radius.
- `setShakeEnabled` (`src/render/shake.ts:47`) — existing seam introduced by WI-06d; used correctly here.
- `parseSave` (`src/game/save.ts:124`) — migration logic modified to fill missing accessibility fields. Safe for existing v1 and pre-a11y v2 saves (verified by independent probes).

## Independent Adversarial Probes

**Probe 1: Fresh save has all 5 accessibility fields with defaults**
- Test: Created a fresh save, verified all 5 fields exist with correct defaults (`masterVolume: 1`, `screenShake: true`, `reducedFlashing: false`, `showSubtitles: true`, `hiContrastSonar: false`)
- Result: PASS

**Probe 2: All 5 accessibility fields round-trip exactly**
- Test: Set all 5 fields to non-default values, serialized, re-parsed, verified equality
- Result: PASS

**Probe 3: v1 save migrates to v2 with accessibility defaults**
- Test: Created a v1 save (no accessibility fields), passed to `parseSave`, verified migration to v2 with correct defaults
- Result: PASS

**Probe 4: Old v2 save (pre-accessibility) migrates with defaults**
- Test: Created a v2 save without accessibility fields, passed to `parseSave`, verified fields filled with defaults
- Result: PASS

**Probe 5: Mixed save preserves some fields and fills defaults**
- Test: Created a save with only `masterVolume` and `screenShake` set, verified those were preserved and the remaining 3 fields were filled with defaults
- Result: PASS

All 5 probes ran as a vitest test suite (`src/game/save-a11y-probe.test.ts`) and all passed.

## What I Could Not Verify

- The live browser functionality (master volume actually scaling the audio mix, actual screen shake with a shake source active, actual flashing effects toggling, subtitles appearing for a radio message, high-contrast sonar visual change) was verified by the implementer's Playwright probe but not re-run in this review session. The probe exists and the implementation verification document claims success; without re-running it, I'm relying on the implementer's evidence for these specific live behaviors. The settings persistence through save/reload was verified by both the implementer's probe and my Node-level save tests.
- The build (`npm run build`) fails, but all errors are pre-existing (lighting, tier4, roster, scenario tests) and not introduced by this work item. I did not verify this by running the build on the kernel commit, but the error messages clearly reference files and symbols unrelated to the WI-06g changes.