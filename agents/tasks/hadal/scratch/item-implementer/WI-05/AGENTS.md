# WI-05 implementer scratch

Implementer probes for WI-05 (the procedural WebAudio system: ambient layers,
depth-driven soundscape, event sounds, and the master volume slider).

## `audio-probe.mjs`

Boots the real `npm run dev` page in headless Chromium (SwiftShader WebGL,
`--autoplay-policy=no-user-gesture-required`), 1920x1080, `?debug=1`. Reads the
debug `window.__HADAL_AUDIO__` snapshot handle (the `AudioSystem.snapshot()`)
and verifies the §27/§43/§58/§14.3 acceptance criteria:

1. audio is locked before any input (no `AudioContext` created) —
   `unlocked=false`, `state=not-created`;
2. a mouse click (a real user gesture) unlocks the `AudioContext` and it is
   `running`;
3. the master volume slider is present in the DOM (`.audio-volume-slider`);
4. descending changes the soundscape: `highCutoff` falls (16000 → 4000),
   `lowRumble` rises (0.15 → 0.8), reverb grows and the drone bed recedes
   (0.45 → 0.13) between depth 0 and 7000;
5. moving the slider lowers the master gain (1 → 0.3).

The probe is the durable browser evidence because headless audio output is
silent: it asserts on the live audio-graph parameters, not on audible output.

- run: `node agents/tasks/hadal/scratch/item-implementer/WI-05/audio-probe.mjs`
  from the repo root (resolves `playwright-core` from the root `node_modules`).
- result: printed PASS/FAIL lines + `AUDIO PROBE PASS` / `AUDIO PROBE FAIL`.

## Gotcha (why a mouse click, not a key press, unlocks audio)

The `?debug=1` panel toggles on *any* keydown (see `src/util/debug.ts`
`panelToggle`), so a `page.keyboard.down('d')` used to unlock audio also closed
the panel and made `.debug-teleport-x` invisible. The probe therefore unlocks
with `page.mouse.click(30, 30)` (a `pointerdown` gesture that does not toggle
the panel), then drives depth with the debug teleport.
