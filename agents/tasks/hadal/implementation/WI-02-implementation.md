# WI-02 Implementation Result — Player swim, 2D terrain collision, oxygen, and depth

Role: `item-implementer` — 2026-09-05.

## Codegraph Gate

First structural lookup this session: `codegraph_explore`
("Game Renderer update start src/game/Game.ts src/render/Renderer.ts",
projectPath `C:\Temp\hadal`) → located `Game` (the fixed-1/60-s frame
loop, `update`/`render`, the boot marker mesh) and `Renderer`
(`WebGLRenderer`, fixed-width ortho camera, `resize`/`render`) verbatim,
plus `src/main.ts` and `index.html`. A second query
("src/util/rng.ts src/game/constants.ts") located the remaining WI-01
scaffold symbols. The index was rebuilt in-session (`codegraph index .`,
11 files / 124 nodes) because the MCP query surfaced a pre-session
stale state.

## Red Phase (Tests Written And Confirmed Failing)

Tests written against minimal production-shaped skeletons
(`PlayerController.update` = frictionless `v += a·dt; p += v·dt`, no
meters, no facing; `buildTerrain.resolveCircle` = identity):

- `src/player/PlayerController.test.ts` — 10 tests: pinned
  recurrence for the drag integrator (v≈255.1, p≈169.65 after 1 s;
  v≈4.67, p≈292.79 after 3 s), terminal-speed bound, coast-drift,
  velocity decay, separate H/V acceleration, boost capability gate,
  three body-facing tests, tool-slot selection.
- `src/player/PlayerMeters.test.ts` — 10 tests: O2 drain 1/s, boost
  1.75×, injury 1.5× (health < 25), combined 2.625×, surface refill
  (and no refill below it), zero-O2 health drain 5/s and 7.5/s
  injured, surface healing, clamp at 0/100, depth = max(0, −y).
- `src/world/terrain.test.ts` — 7 tests: push-out to exactly one
  radius, no-op beyond radius, inward-velocity removal with
  tangential kept, outward velocity untouched, d=0 push out of the
  shape interior, multi-shape resolution, invalid-shape throw.

`npx vitest run` after skeletons: exit 1, `22 failed | 9 passed (31)` —
every failure is behavioral (velocity 6000 vs ≈300 bound; O2 stays
180; terrain pushes nothing), not a compile failure.

## Acceptance Evidence Table

| Criterion | Evidence | Status |
|---|---|---|
| WASD thrusts, mouse aims; §6 model `input → accel → v; v *= drag; p += v·dt`, separate H/V accel, clearly inertial | `PlayerController.update` (request §6 integrator, `PLAYER_ACCEL_H=600` / `PLAYER_ACCEL_V=560` / `PLAYER_DRAG_RATE=2` per-second exponential drag); pinned-recurrence tests in `PlayerController.test.ts`; probe: 3 s dive → depth 740.7, coast after release +179.9 (inertia), O2 178 s | passed (automated + browser probe; reviewer confirms model in `PlayerController.ts`) |
| Terrain collision: circle-vs-segment vs 2D polylines; cannot pass walls/seabed | `terrain.ts` `resolveCircle` (closest-point projection, push-out, inward-velocity removal; d=0 interior push via shape centroid); `CollisionSystem.update` runs it after the controller each step; probe: seabed saturates at 1396.9 (floor −1416, radius 30), wall top at 490 (top −520), east flat floor at 1420 (−1450); 7 terrain unit tests | passed |
| Small greybox world (seabed + one wall) renders, swimmable end to end | `worldData.ts` `GREYBOX_WORLD`: seabed + central wall (x 2350–2650, top −520) + east shelf chunks; `World.ts` renders silhouette fill + bright edges; probe swims west floor → over the wall top (x 2887.7) → east floor; screenshot `output/G-east-floor.png` | passed |
| O2 depletes, faster when boosting/injured, zero → health-drain state; health 0–100 | `PlayerController.updateMeters` (1/s base ×1.75 boost ×1.5 injured; zero-O2 drains 5/s, 7.5/s injured; surface refill zone); 10 deterministic tests in `PlayerMeters.test.ts`; probe: O2 178 after 3 s, 154 at end of dive | passed |
| Depth shown on descent; minimal HUD: O2/health/depth/tool, fades when full | `hud.ts` (few fixed DOM nodes, in-place updates; O2/HP rows fade to 0.25 opacity at full); probe asserts `DEPTH`/`TOOL`/O2 readouts; screenshot shows HUD | passed |
| §6 keyboard mapping (WASD, mouse aim, LMB/RMB, E, Q, 1–4, Esc pause) + body rotates slightly toward velocity/aim | `bindToWindow` tracks the full mapping (LMB/RMB/E/Q tracked as input state; behaviors land in later WIs); Esc pause in `Game.togglePause`; probe: tool select (Digit1/2), Esc overlay + frozen sim, mouse-aim facing 2.33 → 0.39; facing unit tests (aim-only, slight-velocity-blend cap 0.65, tracks velocity when fast) | passed |
| Debug teleport (`?debug=1` or backtick+F2) to arbitrary position/depth | `debug.ts` panel (x/depth inputs + apply, 4 Hz readout); `Game.debugTeleport` sets position and zeros velocity; probe: `?debug=1` panel visible, teleport (2000, 150) exact, used to run the wall/east-floor phases | passed |

## Live Or External Verification

**passed** — `node agents/tasks/hadal/scratch/item-implementer/WI-02/probe.mjs`
exit 0, all 25 checks green. The probe starts
`npm run dev --port 5197 --strictPort`, opens a fresh Chromium
(ms-playwright binary, `--use-angle=swiftshader`) at 1920×1080 with
`?debug=1`, and drives real keyboard/mouse events: 3 s S-dive (depth
740.7, O2 178), coast drift (+179.9), seabed saturation (1396.9),
teleport (2000, 150) exact, D-swim over the wall (x 2887.7), wall-top
saturation (490), east-floor saturation (1420, slid along the rising
slope to the flat floor at x 2630.1 — correct circle-vs-segment
physics), mouse-aim facing (2.33 upper-left → 0.39 right), tool
select, Esc pause overlay + frozen sim + resume, O2 fall across the
dive (178 → 154), zero page exceptions, zero console errors.
Artifacts: `output/result.json`, `output/trace.txt`,
`output/console.json`, `output/server.log`, screenshots
`A-boot.png` / `D-seabed.png` / `G-east-floor.png` / `Z-final.png`.

## Tests To Write First — Delivered

- `src/player/PlayerController.test.ts` — the movement/velocity-drag
  integrator (deterministic, pinned recurrence).
- `src/player/PlayerMeters.test.ts` — the oxygen/health drain math
  (deterministic).
- Plus `src/world/terrain.test.ts` — the circle-vs-segment resolution
  (deterministic), which the work item's evidence table names as a
  review target.

## Deviations From Plan

- `Renderer` gained `follow` / `screenToWorld` / `setWorldBounds`
  (smooth ~0.15 s-lag camera clamp to world bounds, request §16) —
  required for mouse aim to mean anything in a world wider than one
  screen; full aim-lead/encounter zoom stays with WI-14.
- Surface is rendered as a solid ceiling at y = 0 (the water column is
  a closed collision polygon), so "refill at the surface" has a
  definite place without the base existing yet; WI-03's platform
  replaces the ceiling locally.
- No other deviations. Assumption-ledger rows touched: none
  contradicted (A-C2 layout viable — every WI-02 path landed as
  specified; A-C7 single loop — all motion registers into
  `Game.update(FIXED_DT)`, no second tick).

## Files Touched

New (product): `src/util/math.ts`, `src/player/Player.ts`,
`src/player/PlayerController.ts`, `src/player/equipment.ts`,
`src/player/inventory.ts`, `src/world/terrain.ts`,
`src/world/worldData.ts`, `src/world/World.ts`,
`src/systems/CollisionSystem.ts`, `src/ui/hud.ts`, `src/util/debug.ts`.
New (tests): `src/player/PlayerController.test.ts`,
`src/player/PlayerMeters.test.ts`, `src/world/terrain.test.ts`.
Modified: `src/game/constants.ts` (appended player/meter/camera
tuning; L2 `owns` extended), `src/game/Game.ts` (boot marker
replaced by player/world/collision/HUD wiring, Esc pause, debug
teleport/readout; L1+L2 updated), `src/render/Renderer.ts` (camera
follow + screen→world; L1+L2 updated), `src/main.ts` (debug panel
wiring).
New (artifacts): this file, `implementation/AGENTS.md` index line,
scratch probe `agents/tasks/hadal/scratch/item-implementer/WI-02/`
(`AGENTS.md`, `package.json`, `package-lock.json`, `probe.mjs`,
`run.ps1`, `output/`), project note
`agents/projects/hadal/notes/20260905-implementer-wi02-world-seams.md`
(+ index line in `notes/AGENTS.md`), WI-03 implementer handoff
section appended to its specification.

## Notes For Reviewer (Including Shrink/Flatten Report)

Shrink/Flatten pass (run after tests green; re-verified
`npx vitest run` 31/31 and `npm run build` exit 0):

- Removed `len`, `norm`, `lerp` from `src/util/math.ts` — no current
  user (hot paths inline `Math.hypot`); math.ts now holds exactly
  what the movement/collision/camera/debug code reads.
- Removed `shapes` from the `Terrain` interface — no current user
  (`World` iterates the chunk data directly).
- Removed a draft `debugHost.ts` split that never materialized —
  `DebugHost` lives beside `enableDebugPanel` in `src/util/debug.ts`.
- Considered and kept: the full `PlayerInput` mapping fields
  (`useTool`/`altTool`/`interact`/`sonar` are tracked input state
  required by §6's keyboard mapping; their *behaviors* land in later
  WIs); `Player.cargo` (spec-named in this work item, consumed by
  WI-03); `render(alpha)` (spec signature from request §30);
  `Game.stop()` (pause is a core §6 control); spec-section comments
  in `constants.ts` (they record the tuning source); the `visual`
  override on terrain shapes (collision polylines and rendered
  silhouettes differ by design — request §31).
- No files merged or split; every new file has a one-sentence L1.

Reviewer watch items:

- `Game.update` remains the single simulation seam — the controller,
  collision, and HUD all run inside it; do not add a second tick.
- The greybox chunk data in `worldData.ts` is the refactor target for
  WI-07 (full §17 `WorldChunkDef` fields); extend the shape in place.
- Sloped terrain + held thrust slides the player tangentially
  (inward velocity removed, tangential kept) — seen in the probe
  (east slope funnels to the flat floor). This is intended physics.
- TS 7 native `tsc` is the build's type-checker; `vite build` alone
  does not type-check. `npm run build` prints a >500 kB chunk
  warning (three.js bundle) — expected at this stage.

## Assumptions

- O2 baseline 180 s with +65 s per tank tier (request §54 shows
  "Tank Mk II — +65 s oxygen capacity"); 180 s comfortably covers the
  greybox dive loop (request §7: not brutally short).
- "Injured" = health below 25 (1.5× O2 drain); zero-O2 health drain
  is 5/s, also 1.5× when injured. Death/respawn itself is WI-03.
- Starter tools are knife / light / harpoon (request §9 tier 0);
  slot 4 stays empty until later equipment.
- The headless-Chromium probe (SwiftShader, same engine, real dev
  server, real input events) satisfies live verification at this
  stage; full §70/§34 observation in a GPU browser defers to WI-17
  (matches WI-01's recorded convention).

## Result

Implemented: inertial player swim with §6 integrator + meters,
circle-vs-segment terrain collision over a swimmable greybox
(seabed + wall + shelf), minimal HUD, §6 input mapping with pause,
and the `?debug=1`/backtick+F2 teleport; `npx vitest run` 31/31,
`npm run build` exit 0, 25/25 browser probe checks green with a clean
console.
