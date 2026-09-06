---
tags: [hadal, wi-03, browser-harness, save, debug, playwright]
---

# Browser harness, save schema, and the §30 frame loop (WI-03 re-pass)

## Summary

WI-03's re-pass fixed the three browser-adapter findings from the review and
left a reusable browser harness. Reusable facts for later work items:

- **Save schema version and key (request §42/§25):** version `1`; the
  `localStorage` key is `hadal.save.v1` and the malformed-save backup key is
  `hadal.save.v1.bak` (defined in `src/game/save.ts`: `SAVE_KEY` /
  `SAVE_BACKUP_KEY`). `SaveGameV1` is the versioned shape; a malformed or
  version-mismatched save resets to a fresh save and backs the bad value up
  (it never crashes).
- **Debug-panel toggle (request §33):** backtick, `F2`, or the `?debug=1`
  query param (the request's suggested defaults — no deviation).
- **The §30 frame loop:** the browser `main.ts` drains a clamped real-time
  accumulator into whole `FIXED_DT` (1/60 s) steps via
  `src/game/frame.ts` `stepCountSince(elapsed, accumulator)`; exactly one
  render runs per display frame. `frame.test.ts` pins the cadence
  independence from refresh rate. Do not reduce the loop back to one
  `update(FIXED_DT)` per `requestAnimationFrame` (that regresses to
  refresh-rate-tied time — the reviewer's Finding 2).
- **The shared browser harness (§70):** `tests/browser/boot.test.mjs`,
  run by `npm run test:browser` (a distinct command; it is NOT picked up by
  the headless `npm test`, which is Vitest over `src/**/*.test.ts`). It boots
  the real `npm run dev` page in headless Chromium and runs the §70
  Boot + Save checklist items.

## File / command references

- `src/main.ts` — the browser entry: `getElementById('game')` + the §30
  fixed-step frame loop (accumulator → `N` steps, one render).
- `src/game/frame.ts` — `stepCountSince`, the §30 accumulator drain
  (imports `FIXED_DT` / `MAX_FRAME_DT` from `src/game/constants.ts`).
- `tests/browser/boot.test.mjs` — the browser harness. Commands:
  `npm run test:browser`. Env overrides: `HADAL_BROWSER` (Chromium binary),
  `HADAL_BROWSER_PORT` (dev-server port, default 54321).
- `src/game/save.ts` — `SaveGameV1` + `saveToStorage` /
  `loadFromStorage` / `resetSave`; the `localStorage` key and backup key.
- `src/util/debug.ts` — `DebugPanel` (noclip, teleport, give resources,
  reset save; 4 Hz readout; DOM classes `debug-panel` / `debug-readout`,
  `debug-teleport` / `debug-teleport-x` / `debug-teleport-depth`).

## Gotchas and failure symptoms

- `index.html` defines `<div id="game">`, **not** `#app`. The renderer
  appends into `getElementById('game')`. A `#app` reference throws
  `TypeError: Cannot read properties of null (reading 'appendChild')` before
  the canvas appears (the browser-boot crash).
- The ms-playwright Chromium on this host is `chromium-1234`, but
  `playwright-core` 1.63.0's default `chromium.executablePath()` returns
  `chromium-1243` (not installed). The harness therefore resolves the newest
  present `chromium-*/chrome-win64/chrome.exe` rather than trusting
  `executablePath()`. If you pin a different `playwright-core`, the
  revision may shift — override with `HADAL_BROWSER`.
- `npm run build` prints a three.js chunk-size warning (~565 kB) to stderr;
  it is informational and pre-dates WI-03. The build still exits 0.
- The debug panel's `?debug=1` shows the panel (`display: block`); without it
  the panel is in the DOM but hidden. The `debug-readout` updates at 4 Hz
  regardless of `?debug=1`.

## Architecture / workflow facts

- Headless (`npm test`, Vitest) and browser (`npm run test:browser`) are
  separate commands by design (request §44 phase 1, §70). Keep the browser
  harness out of the Vitest `include` (`src/**/*.test.ts`) so `npm test`
  stays a pure headless suite.
