# Review Reports

One report per reviewed work item, written by the `work-item-reviewer`
role:

- `WI-01-scaffold-project-review.md` — review of the Vite+TS+Three.js
  scaffold and fixed-step boot loop (pass, 2026-09-05; re-verified at the
  accepted revision, 2026-09-06).
- `WI-02-player-swim-terrain-oxygen-review.md` — review of inertial swim,
  terrain collision, meters, HUD, and debug teleport (pass, 2026-09-05;
  re-verified at the accepted revision `81eb9fa`, 2026 re-dispatch).
- `WI-03-base-resource-crafting-save-review.md` — review of the headless
  simulation core, versioned save, crafting, base, debug panel, and the
  §30/§70 verification harness (findings, 2026-09-06: headless core passes,
  but the browser does not boot — `main.ts` reads `#app` while `index.html`
  has `#game`; the frame accumulator was removed; `test:browser` is a build). Re-reviewed at HEAD `d611344` (attempt 3,
2026-09-06): **pass** — the browser-boot, frame-cadence, and `test:browser`
findings are all resolved by the browser-fix commit; headless (9 files / 61
tests), build, and the real browser harness all verified green; the
`.debug-readout` showing in normal mode is a minor (non-blocking) observation
for WI-15.
- `WI-04-visual-language-review.md` — review of the visual-language render
  stack (water gradient, pooled particles, flashlight, parallax terrain,
  post-fx; commit `fc7770f`, 2026-09-06): **findings** — the water gradient,
  pooled/no-alloc particles + per-band profile, terrain silhouette/parallax
  (no collision, distinct rates), atmospheric scene (luminance stddev ~69),
  build (exit 0), and headless suite (11 files / 72 tests) all pass, but the
  **flashlight beam is a ~2 px `PlaneGeometry(2,2)` that is never scaled** and
  is anchored to the camera center, so it does not reveal the scene (criterion
  3 / request §15 fails; the implementer's note overstates it).
   **Re-reviewed at HEAD `07b68fb` (attempt 2, 2026-09-06): pass** — the
   flashlight beam is now scaled to its reach and anchored to the player, so it
   reveals the scene; independently verified in a real browser (player-anchored
   cone, visibility shortens with depth, never pure black) and by a genuine
   `lighting.test.ts` (confirmed failing pre-fix in a worktree). Headless suite
   12 files / 75 tests, build exit 0. ~60 FPS on a real GPU and the
   parallax-layer distinctness remain non-blocking observations.
- `WI-05-audio-system-review.md` — review of the procedural WebAudio system
  (depth soundscape, §27 helpers, master volume slider; commit `58536b7`,
  2026-09-07): **pass** — all five acceptance criteria met with real unit
  evidence (`audio.test.ts`, 10 tests; full suite 13 files / 85 tests), a
  green build (exit 0), and an independent reviewer browser probe (12/12)
  that hooks the `AudioContext` constructor and reads the live node values:
  no `AudioContext` before the first gesture (acCount 0 → 1), the ambient
  graph is built after input, no long looping music track (max looping
  buffer 2.00 s, drone bed oscillator-based), the high-cut/reverb/hull node
  parameters change with depth, and the volume slider changes the actual
  `masterGain` node. One minor non-blocking observation: the `Game` L2
  `owns` list does not name the newly-owned `AudioSystem`.
- `WI-06-sonar-signal-bus-review.md` — review of the `Q` sonar (expanding
  ring, echo tagging, echo particles, resource signatures, larger/slower
  pulses, noise side-effect) and the §63 world-signal bus (`noise`/`light`/
  `sonar`/`injury`); commit `9e62246`, 2026-09-07: **findings** — all six
  acceptance criteria met with real evidence (full suite 15 files / 103
  tests, build exit 0, and an independent browser probe that crafts `sonar-1`
  and fires `Q` with no runtime exception, screenshots showing the expanding
  ring + echo particles); the signal bus is a genuine, allocation-free,
  queryable perception seam (decay hand-checked). One low-severity render gap:
  the echo/tag `PointsMaterial` size is fixed, so the "larger pulse from
  massive objects" is only half rendered (the *slower* half via the scaled
  echo life; the *larger* half — `SonarEcho.size` — is never expressed in the
  pixels).

Whole-task review (`task-review.md`) and independent testing
(`../testing/task-test.md`) arrive with their respective roles.
