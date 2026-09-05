---
title: Browser verification recipe and codegraph staleness after WI-01
role: work-item-reviewer
created: 2026-09-05
tags: [browser, playwright, headless, swiftshader, verification, codegraph, fixed-step, cadence]
symbols: [Game, Game.frame, sampleMarkerY, probe.mjs]
files: [agents/tasks/hadal/scratch/work-item-reviewer/WI-01/probe.mjs, agents/tasks/hadal/reviews/WI-01-scaffold-project-review.md, .codegraph/codegraph.db, .mcp.json]
---

# Browser Verification Recipe And Codegraph Staleness (After WI-01)

## Summary

The only browser engine in this checkout is the local ms-playwright
Chromium binary (headless, SwiftShader software GL). It drives a real
`WebGLRenderer` at 1920×1080, so boot-level criteria (frame renders,
clean console, production build boots) are verifiable here; GPU/aesthetic
and 60 FPS observations remain manual (deferred to WI-17). The reviewer's
WI-01 probe is the reusable recipe. Also: the codegraph index was stale
at the WI-01 review — it predates the first product code.

## Key Facts

- Engine path:
  `C:/Users/rick/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe`
  (chromium-1223 and headless shells also present). Drive it with
  `playwright-core` (`^1.63.0`), launch args
  `--no-sandbox --use-gl=angle --use-angle=swiftshader`.
- Cadence check without a game handle: the boot marker's position is a
  function of the simulation clock (`Game.update` →
  `GameState.timeSec`), so its screen displacement over a wall-clock
  window is a proxy for simulation time. Install a vsync pump via
  `addInitScript` that delivers the page's rAF callbacks on 1 of 4
  vsyncs (queue + pump; do NOT drop scheduled callbacks — the game loop
  dies), assert the throttle was effective (delivered count < 60% of
  unthrottled), then compare marker displacement (within ~35%). A
  frame-tied simulation moves ~4× slower under throttle.
- Fresh-profile check: `browser.newContext()` (no persistent state);
  assert `window.localStorage.length === 0` before the game writes.
- Headless rAF is NOT vsync-capped: the unthrottled probe saw ~120–135
  delivered frames/s, so cadence tests must measure, not assume 60 Hz.
- "No console exceptions" = zero `pageerror` + zero console messages of
  type `error`. Same-frame `readPixels` under SwiftShader emits a
  "GPU stall due to ReadPixels" **warning** — probe-induced, not a page
  defect.

## Navigation

- Reviewer probe: `agents/tasks/hadal/scratch/work-item-reviewer/WI-01/`
  (`probe.mjs`, `output/result.json`, screenshots A/B/C).
- Implementer probe (earlier evidence):
  `agents/tasks/hadal/scratch/item-implementer/WI-01/`.
- Review report: `agents/tasks/hadal/reviews/WI-01-scaffold-project-review.md`.

## Gotchas

- The codegraph MCP index (`.codegraph/codegraph.db`) was built before
  the WI-01 product code landed (db 17:40 vs commit 18:23); queries for
  product symbols (`Game`, `createRng`, boot loop) return "No relevant
  code found". Rebuild the index before relying on codegraph for
  structural queries; substitute repo-wide import grep for a small new
  tree.
- Spawn npm scripts for a specific port as
  `cmd /c npm run <script> -- --port N --strictPort` — the `--`
  separator is required or npm swallows the flags as its own config and
  Vite picks its default port (5173).
- Orphaned Vite dev servers survive a crashed probe (the `taskkill` in
  the finally block never ran); check `netstat` for 5173/4173 and kill
  the exact PID before re-running probes.

## Commands

- Reviewer probe:
  `node agents/tasks/hadal/scratch/work-item-reviewer/WI-01/probe.mjs`
  (exits 0 when dev + preview boot at 1920×1080 with clean consoles and
  cadence is frame-rate independent).
