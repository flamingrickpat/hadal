# Understanding: hadal

## Request As Stated

Build HADAL — a complete, browser-playable 2D side-scrolling underwater
exploration game in HTML + TypeScript + Three.js (request §0, §28). A
contract salvage diver descends from a small surface platform through
five depth bands of a finite, authored world (~18,000–28,000 units
wide, deepest point ~-9,000 to -12,000, request §4.1) and retrieves a
high-value object from a lost deep installation. The hidden creative
content — lore, creature roster, MacGuffin, final reveal, endings — is
generated privately inside the repository and must never leak into chat,
commit summaries, screenshots, or progress reports (request §0, §12,
§68).

Explicit acceptance examples (request §45):

- new game to ending is playable without console commands;
- at least four meaningful depth transitions after the starting coast;
- crafting gates access to depth/capabilities (soft gates, request §4.3);
- at least 15 distinct creature types, at least 4 with materially
  different non-chase behaviors, at least 2 beneficial/friendly, at
  least 3 large-scale creature events;
- at least 5 authored "surprise" spectacle beats inside gameplay;
- the MacGuffin can be reached and retrieved, and retrieval changes the
  final sequence (request §23, §24);
- death and save/load work (versioned `localStorage`, request §25, §42);
- a near-blind playthrough finishes in under 2.5 hours, targeting
  90–120 minutes (request §3);
- performance stays smooth in the largest encounter (60 FPS at 1080p,
  request §34);
- the user is not spoiled by development chatter (request §68).

The task is decomposed into 17 work items (plan.md). The first two —
WI-01 (scaffold) and WI-02 (player/terrain/meters/HUD/debug) — are
implemented and reviewed, approved at 7aa2435.

## Product Area

The entire repository, now a from-scaffold extension rather than a
from-scratch build. The buildable game already boots
(`index.html` -> `src/main.ts`) and has the single simulation seam
`Game.update(FIXED_DT)` (`src/game/Game.ts:85`), an inertial player with
O2/HP/depth meters, 2D terrain collision against a small greybox world,
a minimal HUD, and a hidden debug teleport panel. Every remaining
requested behavior — save system, surface base + resource + crafting,
death/respawn, visual/audio language, sonar + world-signal bus, the full
5-band macro world, the creature framework and hidden roster, authored
encounters, the MacGuffin/endings, the balance pass, and the
spoiler-safe handoff — attaches to the existing seams (the `Game.update`
tick, `EquipmentDef`/`Capability`, `Cargo`, the request §17 chunk
model, the request §63 signal bus) rather than inventing parallel ones
(plan "Existing Seam And Data Origins").

## Current Behavior

At 7aa2435 the game boots and runs a fixed 1/60 s loop
(`requestAnimationFrame` -> accumulator -> `update(FIXED_DT)`); the
player swims inertially (WASD, Shift boost, mouse aim, request §6),
collides with the greybox world (`GREYBOX_WORLD`: seabed, west wall,
central wall, ridge) via circle-vs-segment resolution, and its O2/HP
meters drain below 100 m of depth and refill near the surface
(`PlayerController.updateMeters`, request §7). Depth is `max(0, -y)`;
y = 0 is the surface (request §4.1). A minimal HUD shows
O2/HP/depth/tool and fades full meters (request §26); Esc pauses. The
hidden debug panel (`?debug=1` / Backquote+F2) teleports the player and
shows a readout (request §33). Starter gear (tier 0: tank, work light,
salvage knife, harpoon) is applied at boot via `applyStarterGear`
(request §62/§9). Four Vitest suites (31 tests) pin the movement
integrator, meter math, terrain resolution, and seeded RNG; `npm run
build` exits 0. There is no save, no base, no resource, no crafting, no
audio, no sonar, no creatures, and no full world yet.

## Requested Behavior

Complete the remaining ~15 work items of plan.md in the nine phases of
request §44: (WI-03) surface base + one resource + crafting + versioned
`localStorage` save + death/respawn + the rest of the debug panel;
(WI-04) visual language (water, particles, flashlight, parallax,
grain); (WI-05) procedural WebAudio; (WI-06) sonar + the request §63
world-signal bus; (WI-07) the full macro world (5 depth bands, chunk
streaming, currents, interiors, triggers) as a preparatory refactor of
`GREYBOX_WORLD`; (WI-08) material families + upgrades + soft gates +
`validateWorld()`/`simulateCriticalPath()`; (WI-09) the private
creative design pass (`design_private/`); (WI-10/11) the creature
framework and the selected 18–24-organism hidden roster; (WI-12)
authored encounters + environmental story; (WI-13) the MacGuffin +
endgame + ending variants; (WI-14) camera scale-reveals + effects +
juice; (WI-15) UI/UX + accessibility; (WI-16) the balance pass toward
90–120 min blind; (WI-17) the spoiler-safe handoff + real-user-path
delivery verification.

Ambiguities and their resolution (see Assumptions): creative content is
delegated to the implementer (request §75); the working title stays
`HADAL`; numeric tuning values are defaults, not sacred (request §4.1);
the simulation-boundary and headless-scenario-harness requirements
(request §30, §70) govern how every gameplay feature is verified.

## Code Located

- symbol: Game @ src/game/Game.ts:36 — the coordinator; owns the `requestAnimationFrame` loop, the single `update(FIXED_DT)` simulation seam, Esc pause, and the debug teleport/readout hooks every later system plugs into
- symbol: Game.update @ src/game/Game.ts:85 — the single fixed-step tick (state -> controller -> collision -> mesh sync -> hud); the seam all remaining work items attach to
- symbol: PlayerController @ src/player/PlayerController.ts:54 — request §6 inertial swim integrator, §7 O2/HP/depth meters, and §6 WASD/Shift/mouse/E/Q/1-4 input
- symbol: buildTerrain @ src/world/terrain.ts:44 — request §31 circle-vs-segment collision core (`resolveCircle`); survives the WI-07 world refactor
- symbol: GREYBOX_WORLD @ src/world/worldData.ts:32 — the current greybox map (seabed/west wall/central wall/ridge) + `PLAYER_START`/`worldBounds`; the WI-07 refactor target for the request §17 authored chunk model
- symbol: EquipmentDef @ src/player/equipment.ts:28 — request §62 `EquipmentDef`/`Capability` shapes + tier-0 `STARTER_GEAR`/`applyStarterGear`; the type the crafting system (WI-03/08) consumes
- symbol: createRng @ src/util/rng.ts:16 — request §61 seeded PRNG; the only source of randomness (never for gates/resources/reveals)
- symbol: enableDebugPanel @ src/util/debug.ts:21 — request §33 hidden debug panel (teleport + readout); the rest of §33 grows in this file
- symbol: Renderer @ src/render/Renderer.ts:23 — request §16 `WebGLRenderer` + fixed-width orthographic camera follow + `screenToWorld` mouse aim

Nearest existing seams for behaviors with no file yet: persistence has no
`src/game/save.ts` (a new module; `GameState` deliberately does not own
it); the world/chunk layer has no `src/world/chunks.ts`/`gates.ts`/
`triggers.ts` (the request §17 model grows `worldData.ts`); there is no
`src/creatures/`, no `src/systems/` beyond `CollisionSystem`, no
`src/content/secret/`, and no `design_private/` (all target per plan).

## Project Knowledge Consulted

- project-doc: agents/projects/hadal/ARCHITECTURE.md — established the current component map (built vs. target per request §29), the single `Game.update(FIXED_DT)` seam, and the request §63 signal-bus / §62 capability / §42 save seams the remaining work items attach to
- project-doc: agents/projects/hadal/PROJECT.md — established `project_id` "hadal", the skeleton + player-core maturity at 7aa2435 (WI-01/WI-02 approved), the entry points, and the request §73/§28 non-goals
- project-doc: agents/projects/hadal/BUILD.md — established the resolved toolchain (three 0.185 / vite 8.2 / typescript 7 / vitest 5; `npm run build` = `tsc --noEmit && vite build`), and the headless Playwright-Chromium browser-probe capability
- project-doc: agents/projects/hadal/TEST.md — established the 4-file / 31-test Vitest suite, the request §70 integration checklist, and the in-engine `validateWorld()`/`simulateCriticalPath()` validators
- repo-doc: agents/tasks/hadal/request.md — the authoritative 75-section handoff: §45 MVP criteria, §44 phases, §30/§70 simulation + headless-scenario-harness verification, §72 scope-cut order, §73 non-goals
- repo-doc: agents/tasks/hadal/plan.md — the 17-work-item decomposition (WI-01..17) with dependencies, the "Existing Seam And Data Origins" map, and the assumption ledger
- repo-doc: agents/projects/hadal/notes/20260905-implementer-wi02-world-seams.md — the exact current code seams (simulation order, movement model, meters, terrain, greybox, camera, HUD, debug) and the test/build commands
- repo-doc: src/game/Game.ts — confirmed by direct read: the single `update(FIXED_DT)` seam and frame accumulator (the codegraph index is stale for product symbols)

## Knowledge Cross-Check

Confirmed by evidence: the skeleton + player-core state — `git log`
shows WI-01 (184d348) and WI-02 (6a21844) implemented and reviewed
(7aa2435); direct reads of the 17 `src/` files confirm the boot loop,
`Game.update`, `PlayerController`, `buildTerrain`, `GREYBOX_WORLD`,
`EquipmentDef`, `createRng`, `enableDebugPanel`, and `Renderer`;
`npx vitest run` = 4 files / 31 tests (all passing) and `npm run build`
exits 0, matching the implementer/reviewer notes. Refined: the four
project files were stale (they described the 207a690 greenfield state as
"no product code exists / not runnable yet / not installed yet"); this
session updated them to document the 7aa2435 state, keeping the
request-sourced target facts. The codegraph index at `.codegraph/`
returns "No relevant code found" for product symbols (`Game`,
`PlayerController`, `createRng`, `buildTerrain`), confirming the WI-01
reviewer's finding that the index predates the product code — so
structural facts rest on direct file reads, not codegraph. Not covered:
the not-yet-built systems (save, base/crafting, audio, sonar, the full
world, creatures, MacGuffin) have no code to cite; their target homes
and the existing types they consume are recorded in plan.md and the
`20260905-understander-post-wi02-seam-map.md` note.

## Open Questions And Risks

- Verification boundary: headless Vitest covers deterministic rules
  (movement, collision, meters, RNG); request §70 gameplay/progression
  scenarios and the §34/§14.3 visual + performance assertions must be
  observed in a real browser (scratch Playwright probes), then manually
  for aesthetics/60 FPS (request §70). The request §30/§70
  simulation-boundary + reusable headless-scenario-harness requirement
  is not yet in the codebase — it lands with the first movement/resource
  scenario (WI-03) and gates how every later gameplay feature is
  verified.
- Spoiler containment is a cross-cutting risk for every later role and
  work item: artifacts, commit messages, screenshots, and progress
  reports must avoid hidden-content vocabulary (request §0, §68);
  `design_private/` is already gitignored.
- Scope risk: the request is large (75 sections). Request §72's cut
  order is the safety valve; creature roster quality, depth
  progression, sonar, atmosphere, the five spectacle beats, the final
  reveal, friendly fauna, and saves must not be cut.
- Determinism risk: `createRng` must never touch critical gates,
  critical resources, major reveals, or final-path viability (request
  §61, §4.4); critical resources are authored, not randomized.
- The save schema must be versioned from the start (`SaveGameV1`,
  request §42) so later migrations stay trivial; a malformed save must
  reset or back up gracefully (request §70).
- The greybox `GREYBOX_WORLD` is a preparatory-refactor target (WI-07),
  not a throwaway: the request §17 chunk model grows the same
  `worldData.ts` and `buildTerrain` core, preserving behavior (plan
  A-R8).

## Codegraph Queries Run

1. First (mandatory gate) query: `codegraph_explore` "Game update boot
   loop main entry point player controller terrain collision world
   renderer" (projectPath `C:\Temp\hadal`) — returned "No relevant code
   found". Retried with the single symbol `PlayerController` and with
   `resolveCircle createRng buildTerrain mulberry32` — all "No relevant
   code found". The index at `.codegraph/` (codegraph.db, mtime
   2026-09-05 10:49) contains no product symbols, matching the WI-01
   reviewer note that the index predates the product code.
2. Fallback (sanctioned by the WI-01 reviewer note for this small new
   tree): direct reads of the 17 `src/` files listed in "Code
   Located", plus the project notes under `agents/projects/hadal/
   notes/`, `package.json`, and the config files. Structural facts in
   this document rest on those reads and on the passing test/build runs,
   not on codegraph.

## Assumptions

- `request.md` is the sole, complete product specification; where it is
  silent, follow its own decision rules (request §75: decide
  independently, prefer the more memorable experience, prefer bespoke
  small solutions, prefer finishing the 2-hour arc). Rejected
  alternative: waiting on user choices — unavailable in this unattended
  workflow and explicitly forbidden for creative decisions.
- "Change no product code" for this role means touching only project
  knowledge and the task folder — no product files, no `package.json`
  or `src/` edits. Scaffolding and feature work are implementer work
  (WI-03+). This session updated the four project files because they
  were stale (they described the greenfield state) and the task is now
  about extending existing code; no product code was changed.
- In a repository that now has product code, `Code Located` cites real
  symbols/files that exist at 7aa2435 (the grounded-understanding gate
  rejects target-only citations); target paths for not-yet-built
  behaviors are named in prose and in the seam-map note instead.
- The working title stays `HADAL` (request §2 permits alternatives; no
  decision is required now).
- The four project files are updated to document the 7aa2435 state
  (what is built vs. target) while keeping the request-sourced target
  facts; they remain navigation maps, not a second copy of the code.
