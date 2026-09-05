# Build And Runtime

## Prerequisites

- Node.js + npm. Minimum version: unknown — nothing in this revision
  pins it; the only evidence is request §69, which assumes plain
  `npm install` on a normal setup.
- A real desktop browser with WebGL, 1080p, 16:9 (request §16, §34).
  Headless contexts cannot substitute for visual verification.

## Install

Target commands (request §69). Not runnable yet: no `package.json`
exists in this revision.

```bash
npm install
```

## Build

```bash
npm run build      # production bundle (Vite)
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

None observed — no build exists yet. Expected once scaffolding lands:
missing `package.json`/lockfile; TypeScript errors in the Vite/tsc
pipeline; WebGL unavailable in headless environments (verify in a real
browser); audio silent until first input (by design, request §27).

## Delivery Verification Capabilities

- Installed MCPs/tools that can operate real API, browser, desktop,
  database, device, or host-application boundaries: none. This checkout
  configures only the codegraph MCP (`.mcp.json`); `.pi/search.json`
  configures a web-search backend (duckduckgo, marginalia), unrelated to
  the game. No browser-automation tool exists here.
- Required manual observation, if no automation capability exists: the
  whole request §70 checklist (boot, core loop, progression, creatures,
  save, ending) must be verified manually in a real desktop browser.
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
