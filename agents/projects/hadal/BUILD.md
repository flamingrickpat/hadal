# Build And Runtime

## Prerequisites

- Node.js + npm. Minimum version: unknown — nothing in this revision
  pins it; the only evidence is request §69, which assumes plain
  `npm install` on a normal setup.
- A real desktop browser with WebGL, 1080p, 16:9 (request §16, §34).
  Headless contexts cannot substitute for visual verification.

## Install

```bash
npm install       # package.json + committed package-lock.json
```

## Build

```bash
npm run build      # tsc --noEmit && vite build (type-check, then bundle)
npm run preview    # serve the production build locally
```

## Run

```bash
npm run dev        # Vite dev server; open the printed localhost URL
```

## Service Start, Restart, And Health

- Public start command(s): `npm run dev` (dev) or `npm run build` +
  `npm run preview` (production).
- Readiness condition and command: the browser page boots the game with
  no console exceptions; audio unlocks after the first user input
  (request §70).
- Public stop command and ownership/PID rule: Ctrl+C in the terminal
  that owns the Vite process.
- Restart command and expected persisted state: re-run the same command;
  game state persists in `localStorage` (request §25), so restarting the
  server or browser resumes the last save.

## Common Failures

- `npm run build` = `tsc --noEmit && vite build`; the `>500 kB chunk`
  Vite warning is the three.js bundle (informational, not an error).
  Verified exit 0 at 7aa2435 (dist asset ~556 kB).
- `WebGLRenderer` (three 0.185) requires WebGL2; verify in a real
  browser (headless SwiftShader also works).
- TypeScript 7 native `tsc` as-is (`tsconfig.json`: `moduleResolution:
  bundler`, `noEmit`, `strict`, `noUncheckedIndexedAccess`); `vite build`
  alone does not type-check.
- Audio is silent until first input (by design, request §27).

## Delivery Verification Capabilities

- Installed MCPs/tools that can operate real API, browser, desktop,
  database, device, or host-application boundaries: none as an MCP. This
  checkout configures only the codegraph MCP (`.mcp.json`);
  `.pi/search.json` configures a web-search backend (duckduckgo,
  marginalia), unrelated to the game.
- Local browser engine for headless probes: the ms-playwright Chromium
  binary (`C:/Users/rick/AppData/Local/ms-playwright/chromium-*/chrome-
  win64/chrome.exe`) drives a real `WebGLRenderer` at 1920×1080 via
  `playwright-core` (SwiftShader software GL). Implementer/reviewer
  scratch probes under `agents/tasks/hadal/scratch/` use it to verify
  boot and movement in a real page. GPU/aesthetic and 60 FPS
  observations remain manual (see TEST.md).
- Required manual observation: the whole request §70 checklist (boot,
  core loop, progression, creatures, save, ending) and the §34/§14.3
  visual + performance assertions are verified in a real desktop browser.
  In-engine debug panel (request §33) and telemetry (request §71) are
  the development-only measurement channels.

## Toolchain Resolved (WI-01, 2026-09-05)

The target commands above are now real, verified with exit 0:

- Node: 24 "Krypton" is the current LTS line (confirmed via
  nodejs.org/dist/index.json); verification runtime on this machine:
  Node v24.15.0 / npm 11.12.1 (Windows).
- Locked by `package.json` + committed `package-lock.json`:
  `three` 0.185.1, `vite` 8.2.2, `typescript` 7.0.2, `vitest` 5.0.0,
  `@types/three` 0.185.4.
- `npm run build` = `tsc --noEmit && vite build` (type-check, then
  bundle); dev server on port 5173 by default, accepts `--port`.
- Three.js 0.185 `WebGLRenderer` uses WebGL2 by default; a headless
  Chromium with software GL (SwiftShader) boots and renders it, so the
  WI-01 boot probe ran without a GPU.
- TypeScript 7.0 (the native compiler) is the current stable `tsc` on
  the registry and is used as-is; `tsconfig.json` is a standard Vite TS
  config (`moduleResolution: bundler`, `noEmit`). The 514 kB bundle
  chunk-size notice from Vite is informational (three.js), not an
  error.
