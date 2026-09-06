# Reviewer scratch — WI-03 (browser boot probe)

Independent adversarial browser probe written fresh for the WI-03 review
(2026-09-06). Drives the real `npm run dev` server (port 5311) with the local
ms-playwright Chromium (SwiftShader, real WebGL2) in a fresh 1920×1080 context
at `?debug=1`.

Purpose: verify whether the browser game actually **boots** — the work item's
stated goal ("the player can dive, gather, surface, craft, and go farther") and
all "manual (browser)" acceptance criteria depend on it. The implementer's
`npm run test:browser` is a plain `vite build` and never loads a page, so it
cannot catch a boot crash.

- `probe.mjs` — launches the dev server, loads `?debug=1`, captures page +
  console errors, and checks for the renderer canvas, `#hud-root`, and
  `#debug-panel`. Exits non-zero when any check fails.
- `package.json` — pins playwright-core 1.63.0 (installed locally; `node_modules/`
  is not committed).
- `output/` — `result.json`, `server.log`, `console.json` from the probe run.

Finding: the probe FAILS — the page throws
`TypeError: Cannot read properties of null (reading 'appendChild')` because
`src/main.ts` reads `document.getElementById('app')` while `index.html` only
defines `<div id="game">`. No canvas/HUD/debug panel render. See
`../../../reviews/WI-03-base-resource-crafting-save-review.md` (Finding 1).

Run: `npm install` then `node probe.mjs` from this directory (exits 0 only if
the game boots with a canvas + HUD + debug panel and no page error).

## Re-review probe (attempt 3, 2026-09-06)

- `probe2.mjs` — independent re-verification after the browser-fix commit
  `d611344`. Boot: (A) a normal page (no `?debug=1`) boots with a canvas and no
  page exception; (B/C) the `.debug-panel` is hidden in normal mode; (D) the
  normal UI text contains no hidden-lore / creature / secret tokens; (E) in
  `?debug=1`, giving resources + one-click crafting `tank-1` raises the player's
  oxygen capacity (readout o2Max 180 → 245) and the craft label flips to
  "Crafted". Uses port 5312 (`PROBE_PORT`), resolves the newest installed
  ms-playwright Chromium (`PROBE_BROWSER` overrides). Result: all required checks
  green (PASS); the `.debug-readout` is visible in normal mode (noted as a
  minor observation, not a failure). See
  `../../../reviews/WI-03-base-resource-crafting-save-review.md` (Re-review,
  attempt 3) — verdict **pass**.
