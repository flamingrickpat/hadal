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
