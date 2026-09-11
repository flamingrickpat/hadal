# Review: WI-06g — Section 43 accessibility controls

Status: findings

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| Settings UI entries for all five controls | pass | `src/ui/settings.ts` — `SettingsOverlay` class with Volume slider, Screen shake, Reduced flashing, Radio subtitles, High-contrast sonar |
| Screen shake toggle | pass | `src/game/Game.ts` — wired to `Renderer.setShakeEnabled()`, which calls `setShakeEnabled` in `src/render/shake.ts` |
| Reduced flashing toggle | pass | `src/game/Game.ts` — wired to `Hud.setReducedFlashing()` and `SonarVisuals.setReducedFlashing()` |
| Radio-message subtitles | pass | `src/game/Game.ts` — wired to existing radio element via `showSubtitles` setting |
| Master volume slider | pass | `src/game/Game.ts` — wired to `AudioSystem.setMasterVolume()` |
| High-contrast sonar option | pass | `src/render/sonar.ts` — `SonarVisuals.setHiContrast()` switches to bright yellow |
| Save settings schema extension | partial | `src/game/save.ts` — interface, defaults, migration all present; but `Simulation.toSave()` omits the new fields |
| Node tests for schema | pass | `src/game/save.test.ts` — 4 new tests for defaults, round-trip, and migration |
| Browser verification | pass | `application_verification.md` + `scratch/implementer/browser-verification/probe.mjs` |

## Findings

1. **Build failure — `toSave()` returns incomplete settings object** (`src/sim/Simulation.ts:1671`): The implementer changed `SaveGameV2.settings` to the full `AccessibilitySettings` interface, but `Simulation.toSave()` still returns `settings: { masterVolume: 1 }`, which is missing the four new accessibility fields. This causes a build failure (`tsc --noEmit` reports `Type '{ masterVolume: number; }' is missing the following properties from type 'AccessibilitySettings': screenShake, reducedFlashing, showSubtitles, hiContrastSonar`). The work item specification requires "suite and build stay green". Fix: replace `{ masterVolume: 1 }` with `{ ...freshAccessibilitySettings() }` (or spread the current `this.settings` state if it's tracked on the Simulation).

2. **Build failure — migration test type annotations** (`src/game/save.test.ts:144,174`): The two migration tests pass objects with literal `version: 1` and `version: 2` to `serializeSave()`, which expects `SaveGame`. TypeScript infers `version: number` rather than the discriminant literal, causing a type error. This is a minor typing issue in the tests, not a runtime defect. Fix: either add `const` assertions to the version field or cast the test data.

Note: The baseline build (kernel commit 9b28981) also has pre-existing TypeScript errors (lighting, tier4, roster, scenario tests, and Simulation.ts imports) that are unrelated to this work item. This review treats only the 3 errors introduced by this task as findings.

## Impact Check

- `AccessibilitySettings` interface (`src/game/save.ts:22`) — defined here, consumed by `SaveGameV2` and the `SettingsOverlay`; callers: `src/game/Game.ts`, `src/ui/settings.ts`, `src/sim/Simulation.ts` (via type). No callers outside the accessibility subsystem affected.
- `SettingsOverlay` class (`src/ui/settings.ts:30`) — new component, called only from `Game.ts`. No blast radius.
- `setHiContrast` (`src/render/sonar.ts:119`) — new method, called only from `Game.ts`. No blast radius.
- `setReducedFlashing` (`src/render/sonar.ts:130`, `src/ui/hud.ts:106`) — new methods, called only from `Game.ts`. No blast radius.
- `setShakeEnabled` (`src/render/shake.ts:47`) — existing seam introduced by WI-06d; used correctly here.
- `parseSave` (`src/game/save.ts:124`) — migration logic modified to fill missing accessibility fields. All callers go through `loadFromStorage` or `Simulation.deserialize`; the added field-filling is safe for existing v1 and pre-a11y v2 saves.

## Independent Adversarial Probes

**Probe 1: Old v1 save loads with accessibility defaults**
- Command: Created a v1 save JSON without any accessibility fields, passed it to `parseSave`.
- Result: Successfully parsed to a v2 save with all accessibility fields at defaults (`screenShake: true`, `reducedFlashing: false`, `showSubtitles: true`, `hiContrastSonar: false`). Migration works.

**Probe 2: Full accessibility round-trip**
- Command: Modified all accessibility fields to non-default values, serialized, re-parsed.
- Result: All five fields round-tripped correctly.

**Probe 3: Verify `toSave()` defect**
- Command: Ran `npm run build` on the implementation commit.
- Result: Build fails with the `toSave()` type error described in Finding 1. Confirmed this is a real defect that would affect the production save flow (though the runtime JSON serialization would work, the TypeScript type contract is broken).

## What I Could Not Verify

- The live browser functionality (master volume scaling the audio mix, actual screen shake with a shake source active, actual flashing effects toggling) was verified by the implementer's Playwright probe but not re-run in this review session. The probe exists and the implementation verification document claims success; however, without re-running it, I'm relying on the implementer's evidence for these specific live behaviors. The settings persistence through save/reload was verified by both the implementer's probe and the Node-level save tests.
- The high-contrast sonar color change was not visually verified in a browser, only confirmed via code inspection.
