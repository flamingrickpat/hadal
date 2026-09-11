# HADAL

A 2D side-scrolling underwater exploration game in the browser, built
with TypeScript, Vite, and Three.js.

> Spoiler note: this README deliberately avoids describing the deeper zones,
> the creatures, or what you will find at the bottom. Play first, read the
> repository design docs afterward.

## Install and run

```bash
npm install
npm run dev
```

Open the printed localhost URL in a desktop browser.

## Production build

```bash
npm run build
npm run preview
```

## Controls

| Input | Action |
|---|---|
| WASD | Swim / thrust |
| Mouse | Aim light / tool |
| Left mouse | Use equipped tool |
| Right mouse | Alternate tool function / focus light |
| E | Interact / collect / open |
| Q | Sonar pulse |
| 1–4 | Quick-select tools |
| Tab | Map overlay (pauses game) |
| Shift | Boost (once unlocked) |
| Esc | Pause |

## Browser requirements

- Modern browser with WebGL (Chrome, Firefox, Edge)
- Desktop resolution recommended (1080p or higher)
- Sound for audio cues and ambient soundscape

## Expected playtime

A blind first playthrough takes approximately 90–120 minutes. A skilled player
familiar with the route can finish in under 75 minutes.

## Save location

The game saves automatically to your browser's `localStorage`. Your dive
platform, equipment, upgrades, and progression are all persisted there. To
start a fresh game, clear the `hadal.save.v2` key or use the debug panel's
reset-save option.

## Developer / debug section

- **Debug panel:** Press `F12` or open your browser's developer console. A
  debug overlay is available through the in-game debug panel for testing.
- **Tests:** `npx vitest run` runs the headless simulation test suite.
- **Browser tests:** `npm run test:browser` runs the Playwright-based browser
  harness.
- **World validation:** The simulation includes a `simulateCriticalPath()`
  function that validates the full progression chain without human intervention.
