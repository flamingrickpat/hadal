# Review: WI-02-player-swim-terrain-oxygen

Status: pass

Reviewed commit: `6a218443fd3115ae6884a9fb494fa795333853ac`
(`[game][player] add inertial swim, terrain collision, meters, HUD, and debug
teleport`), the single commit between the WI-01 accepted state `1d1b154` and
the current HEAD. 36 files, +2189/−33. No `state.md` staged (verified with
`git show 6a21844 --name-only | Select-String state.md` → empty).

The first structural lookup of this session was
`codegraph_explore("PlayerController update drag player terrain resolveCircle
CollisionSystem Game.update hud debugTeleport")` against `C:\Temp\hadal`.
The index predated commit `6a21844` (db 18:40 vs commit 19:48), so I rebuilt
it (`codegraph index .` → 26 files, 352 nodes, 819 edges) before re-running
explore queries on the new modules. All blast-radius/caller data below comes
from the refreshed index.

## Acceptance Criteria

| # | Criterion | Verdict | Evidence checked |
|---|---|---|---|
| 1 | WASD thrust + §6 inertial model, separate H/V acceleration | **passed** | `src/player/PlayerController.test.ts` (10 tests): the pinned recurrence values were independently re-derived from `v' = (v + a·dt)·e^(−k·dt)` with a_h=600, a_v=560, k=2, dt=1/60 → v(1s)=255.10, p(1s)=169.65, v(3s)=4.67, p(3s)=292.79, v*(≈5s)=295.03, all match. Separate-axis ratio test (a_v/a_h). Browser probe phase B: 3 s dive → depth 645; release → 185.3 units of coast over a 5 s O2-clock window, decaying 175.7 → 9.6 across the two halves (not frictionless: terminal speed bounded at a/k≈295–300). |
| 2 | Terrain collision, circle-vs-segment, no pass-through | **passed** | `src/world/terrain.test.ts` (7 tests): push-out to exactly one radius, no-op beyond radius, inward velocity removed / tangential kept, outward untouched, on-segment centers pushed out of closed shape, multi-shape independence, <2-point shape throws. Browser probe: seabed saturation at exactly one radius above the local floor (depth 1405.9 at x 1161.9 vs expected 1405.8), stable over 1 s; central wall x saturates exactly at 2340 = 2370−30; west wall exactly at −2466 = −2496+30; east end exactly at 5570 = 5600−30; all stable over 1 s of continued thrust. |
| 3 | Small greybox world (seabed + walls) renders, swimmable end to end | **passed** | Screenshots `A-boot-reviewer.png`, `C-seabed-reviewer.png`, `F-east-reviewer.png` (this review's probe output): terrain silhouettes with edge lines, player capsule, water-surface gradient at start, HUD and debug panel all visible. Probe phase F swam from x −2950 to the east end (x 5570 saturation) through the whole map. `src/world/worldData.ts` defines seabed, west wall, central wall, east ridge, closed water column. |
| 4 | O2 depletes, faster when boosting/injured, zero → health drain; HP 0–100 | **passed** | `src/player/PlayerMeters.test.ts` (10 tests): 1/s baseline, 1.75× boost only with the `boost` capability, 1.5× injured (hp < 25), multiplicative boost×injury, surface refill 12/s (only within 100 of y=0), zero-O2 → HP 5/s (7.5/s injured), heal 8/s near surface, clamped to [0,100]. Browser probe phase G: at rest at depth 150, O2 hit 0 with HP still 100, then HP fell 100 → 50 over the next 10 s (exactly 5/s), O2 stayed 0. |
| 5 | Depth shown as player descends; HUD shows O2, health, depth, tool | **passed** | `src/ui/hud.ts`: fixed 4-node HUD (bar+value ×2, depth text, tool text), rows fade to opacity 0.25 when full, 1 otherwise. Probe: boot HUD reads O2 180s / HP 100 / DEPTH 100m / TOOL Salvage Knife with both meter rows at opacity 0.25; after depletion the O2 row opacity is 1; exact rest check DEPTH 700m === readout 700.0; HUD text matches the 4 Hz debug readout in all phases. |
| 6 | Keyboard mapping per §6 + body rotation toward velocity/aim | **passed** | Probe: S-dive and A/D wall tests exercise WASD through the real window listener; Digit2 → "Work Light", Digit3 → "Simple Harpoon", Digit4 (empty slot) leaves selection unchanged; Esc shows the pause overlay and freezes the sim (identical readout over 2.1 s), second Esc resumes (overlay `none`, O2 advanced +28); mouse aim top-left → facing −3.08 vs expected −3.081, bottom-right → −0.83 vs −0.826. `bindToWindow` (PlayerController.ts lines 163–188) wires LMB→useTool, RMB→altTool, E→interact, Q→sonar into the input state — behaviors intentionally deferred to later WIs (WI scope). Unit tests cover the facing blend (idle→aim, opposite-aim keeps body forward, fast movement tracks velocity). |
| 7 | Debug teleport via `?debug=1` or backtick+F2 | **passed** | Probe: `?debug=1` shows the panel (`display: block`) on a fresh context; Apply sets the player to exact values (2200/700, −2300/1000, 1300/150, 1300/50 — readout matches to 0.1); backtick+F2 hides the panel (`none`) and again shows it (`block`); the 4 Hz readout reports x/depth/o2/hp/facing/aim. |

Also checked (required evidence + request §70):

- `npx vitest run` → 4 files, **31/31 pass** (terrain 7, PlayerController 10,
  PlayerMeters 10, rng 4). `npm run build` → exit 0 (only the expected
  >500 kB three.js chunk warning).
- No page exceptions and no console errors across the full ~5 minute probe
  run (probe phase J; the implementer's own probe and the WI-01 reviewer's
  boot probe agree).
- Simulation still runs through the single `Game.update(FIXED_DT)` seam
  (`Game.frame` → `update` → controller → collision → mesh/HUD sync); no
  second tick was added. `main.ts` remains the only `Game`/`Renderer`
  construction site.
- Forbidden substitutes: frictionless movement is disproven (criterion 1),
  the world has walls and an east ridge, not one flat floor (criterion 2/3),
  and oxygen is not a no-op — zero O2 measurably drains HP (criterion 4).

## Findings

None. Two non-defect observations, recorded so a later implementer does not
mistake them for bugs:

1. **Pre-input aim default.** Before the first mouse event, `aimPoint` is the
   world origin (0,0) while the player starts at (1300,−100), so the body
   rotates toward the far southwest on boot (facing 3.06 in the probe). The
   first `mousemove` — which occurs immediately in a real session — fixes it.
   Cosmetic only, not a §6 violation.
2. **Debug teleport into a solid.** `debugTeleport` sets position without
   resolving against terrain, so teleporting into the interior of a wall slab
   (e.g. x 2402, depth 600) leaves the player inside the solid until they
   swim out. Normal play cannot tunnel (max step ≈ 5 units ≪ 2×radius), and
   the criterion only requires moving the player to an arbitrary
   position/depth, which works exactly. Debug-only edge case.

## Impact Check

Blast radius and caller queries (post-rebuild index) on the changed symbols:

- `Game` (constructor, `update`, `frame`, `togglePause`, `debugTeleport`,
  `debugReadout`, mesh helpers) — only external caller is `main.ts`
  (construction + start + debug-panel callbacks). No other consumer.
- `Renderer` (new `follow`, `screenToWorld`, `setWorldBounds`) — callers:
  `Game` and `main.ts`; `PlayerController` imports the type only.
- `constants.ts` — appended `PLAYER_*`, `O2_*`, `HP_*`, `SURFACE_*` blocks;
  consumers are the new player/world/UI modules plus existing
  `Renderer`/`Game` (camera constants). No renamed or removed existing
  constant, so the WI-01 surface is untouched.
- New modules (`Player`, `PlayerController`, `equipment`, `inventory`,
  `terrain`, `worldData`, `World`, `CollisionSystem`, `hud`, `debug`,
  `math`) — each has exactly its expected 1–2 callers (mostly `Game`) plus
  tests; no unexpected external callers, no second simulation entry point,
  no parallel input/state path.
- Product-code diff (18 files) matches the implementer's recorded "Files
  changed" list exactly; no scope drift into later-WI systems (no creatures,
  resources, crafting, or save code — only the declared files and the WI-03
  handoff append in `workitems/`).

## Independent Adversarial Probes

`scratch/work-item-reviewer/WI-02/probe.mjs` — an original probe (not a rerun
of the implementer's), driving the real `npm run dev` server on port 5196
with local ms-playwright Chromium (SwiftShader WebGL2) in a fresh 1920×1080
context at `?debug=1`, using real keyboard/mouse events. 26 checks, **all
green** (`output/result.json`, `node probe.mjs` exit 0):

- **Inertia (could falsify a frictionless model):** dive 3 s on S → depth
  645; release; coast measured over a 5 s window clocked by the O2 meter
  (drains exactly 1/s, immune to rAF cadence): 185.3 units total, with the
  second half (9.6) ~18× smaller than the first (175.7). A frictionless model
  would coast ~1,400 units.
- **Terrain (could falsify a fake floor):** each saturation point was
  asserted against the independent expected value (face ±30), and re-checked
  stable after 1 s of continued thrust; the seabed case was asserted against
  the local floor height at the player's x, which also exposed (correct)
  tangential sliding west along the east-rising slope — depth 1405.9 at
  x 1161.9 exactly matches floor(x)−30.
- **O2/HP (could falsify a no-op bar):** at rest at depth 150 the probe
  polled the O2 clock to 0, then measured HP 100 → 50 over 10 s (5/s), O2
  staying 0; at depth 50 the O2 refill rate measured exactly 12/s and HP
  healed to 100.
- **HUD (could falsify a stub DOM):** exact text at rest (DEPTH 700m ===
  readout), fade opacity 0.25 → 1 on the O2 row, tool name changes with
  Digit2/3 and holds on out-of-range Digit4.
- **Pause/aim/toggle (could falsify missing handlers):** Esc froze the
  sim (identical 4 Hz readouts over 2.1 s) and froze the HUD; resume
  continued O2 regen; facing matched the aim-point-derived target within
  0.005 rad in both screen corners; backtick+F2 toggled the panel both ways.

First probe run had 8 failures; all 8 were traced to the probe's own
wall-clock assumptions (headless rAF cadence varies, so sim time is measured
through the O2 meter instead; the O2/HP meters carry over across
teleports; the sloped floor slides the player tangentially; the pause-check
sampled state before the second Escape). After correcting the probe, the
final run is fully green — no implementation defect surfaced.

## What I Could Not Verify

- **Subjective "feel"** of the movement (request §6 "deliberate, slightly
  heavy"). The integrator's numbers are verified deterministic and bounded;
  the feel itself is a human judgment the workflow cannot make. The inertial
  coast (185 units after release) is comfortably non-frictionless.
- **E / Q / LMB / RMB behavior** — the input state is wired
  (`bindToWindow`) but the behaviors intentionally do not exist yet in this
  work item (they arrive with later WIs). Only the tracking is verifiable
  here, and it is verified by code inspection.
- **Live browser on the implementer's machine** — I could not sit in front
  of a display; the headless-Chromium probe is the closest available
  substitute and exercises the real page, real input events, and real
  WebGL2 rendering (screenshots attached to the probe output).

## Assumptions

- **Depth semantics.** Request §7 lists "current depth" as a HUD meter
  without a sign convention; the implementer chose `depth = max(0, −y)` in
  world units. I accepted that reading: it matches the §26 "depth
  increases as you descend" intent and the §4 scale numbers (~9,000–12,000
  deep). A meters-conversion would be a later tuning concern, not a WI-02
  defect.
- **"Swimmable end to end"** for criterion 3 was read as "the whole greybox
  map can be traversed by swimming without being blocked except by its own
  boundary walls", verified by the west-end → east-end traversal.
- The 4 Hz debug readout lag (≤250 ms) was treated as probe noise, not as
  sim behavior, since the readout is a debug facility outside the work
  item's contract.
