# Application Verification — WI-06g

## Tested Commit
Current uncommitted changes: WI-06g accessibility controls implementation.

## Test Harness
Playwright Chromium (`ms-playwright`) driving a real `npm run dev` instance at `localhost:5500` with the `?debug=1` parameter. The probe is at `agents/tasks/hadalv2.execute_leaf.WI-06g.__item_WI-06g.__attempt_0001/scratch/implementer/browser-verification/probe.mjs`.

## Steps Performed
1. Started dev server: `npm run dev -- --port 5500 --strictPort`
2. Loaded game page with debug mode enabled
3. Pressed 'I' to open the settings overlay
4. Verified all five accessibility controls are present
5. Toggled each control to a non-default value:
   - Master volume: 1.0 → 0.5
   - Screen shake: true → false
   - Reduced flashing: false → true
   - Subtitles: true → false
   - High-contrast sonar: false → true
6. Triggered an autosave via game action
7. Reloaded the page
8. Opened settings overlay again and verified all values persisted

## Observed Results

| Control | Live Value | Saved | Persistent After Reload |
|---|---|---|---|
| Master volume slider | ✓ present | ✓ 0.5 | ✓ 0.5 |
| Screen shake toggle | ✓ present | ✓ false | ✓ false |
| Reduced flashing toggle | ✓ present | ✓ true | ✓ true |
| Radio subtitles toggle | ✓ present | ✓ false | ✓ false |
| High-contrast sonar toggle | ✓ present | ✓ true | ✓ true |

## Assertions
- All five accessibility controls render in the settings overlay
- Each control can be toggled to a non-default value
- Settings are saved to `localStorage` (key: `hadal.save.v2`) with correct values
- After page reload, all settings persist and are reflected in the UI

## Environment
- Browser: Playwright Chromium (ms-playwright)
- Viewport: 1920×1080
- WebGL: SwiftShader software renderer
