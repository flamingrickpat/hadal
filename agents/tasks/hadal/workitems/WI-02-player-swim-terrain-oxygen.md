# WI-02: Player swim, 2D terrain collision, oxygen, and depth

## Identity

- Task: hadal
- Story: implicit
- Owner role: `item-implementer`
- Complexity: medium
- Dependencies: WI-01

## Goal

Make the player swim with an inertial model, collide with 2D terrain, and track oxygen and depth across a small greybox world, so the core movement loop feels underwater and responsive.

## Vision Link

Request §6 (controls + inertial movement feel), §7 (oxygen + simple health + depth), §17/§31 (terrain as 2D collision polylines; circle-vs-segment resolution), §26 (minimal HUD: oxygen, health, depth, tool). §45 core-loop criterion ("can dive … oxygen refills … death respawns") begins here.

## Acceptance Criteria

- [ ] `WASD` thrusts and the mouse aims light/tool; movement follows the `input -> desired acceleration -> velocity; velocity *= drag; position += velocity * dt` model with separate horizontal/vertical acceleration (request §6), clearly inertial, not frictionless.
- [ ] The player collides with terrain via circle-vs-segment resolution against 2D collision polylines (request §31); the player cannot pass through walls or the seabed.
- [ ] A small greybox world with a few terrain chunks (seabed + one wall) renders and is swimmable end to end (request §17).
- [ ] Oxygen depletes over time, drains faster when boosting/injured, and reaching zero causes a health-draining state (request §7); health is 0–100 (request §7).
- [ ] Depth is shown as the player descends (request §7, §26); a minimal HUD shows oxygen, health, depth, and the selected tool (request §26).
- [ ] Keyboard mapping matches request §6 (WASD, mouse aim, left/right mouse, `E` interact, `Q` sonar placeholder, `1–4` tool select, `Esc` pause); body rotates slightly toward velocity/aim for visual life (request §6).
- [ ] A debug teleport (`?debug=1` or backtick+`F2`) moves the player to an arbitrary position/depth (request §33).

## Required Evidence

| Criterion | Evidence type | Command or artifact |
|---|---|---|
| Inertial swim, not frictionless | manual (browser) | swim in `npm run dev`; feel and velocity decay match request §6; reviewer confirms the model in `PlayerController.ts` |
| Terrain collision | manual (browser) + workflow | swim into seabed/wall; player is blocked; circle-vs-segment resolution in `src/world/terrain.ts` |
| Oxygen + health + depth | manual (browser) + automated | dive and watch O2 fall and depth rise; a Vitest test asserts O2/health math and zero-O2 behavior |
| Minimal HUD | manual (browser) | oxygen/health/depth/tool visible; fades when full (request §26) |
| Debug teleport | manual (browser) | `?debug=1` panel moves player to a chosen depth |

## Tests To Write First

- A Vitest test for the movement/velocity-drag integrator (deterministic) and one for oxygen/health drain math (deterministic).

## Live Or External Verification

In `npm run dev`, swim around the greybox world: confirm inertial feel, terrain blocking, O2/depth HUD, and debug teleport.

## Infrastructure Required

- Start: `npm run dev`
- Restart: re-run `npm run dev`
- Health: greybox world swimmable, no console exceptions
- Timeout: n/a
- Endpoint or MCP: none

## File Pointers

- `src/player/Player.ts`, `src/player/PlayerController.ts`, `src/player/equipment.ts` (starter gear), `src/player/inventory.ts` (single cargo capacity, request §7)
- `src/world/terrain.ts` (2D polyline collision, request §17/§31), `src/world/World.ts`, `src/world/worldData.ts` (greybox chunks)
- `src/systems/CollisionSystem.ts` (request §31), `src/ui/hud.ts` (request §26), `src/util/math.ts`
- request §6, §7, §17, §26, §31, §33

## Architecture And Integration Constraints

New files, L1 + archetype:

- `src/player/PlayerController.ts` — `drives — player inertial swim from input to velocity/position`; service-provider (owns the §6 integrator).
- `src/player/Player.ts` — `holds — player state (position, velocity, O2, health, depth, equipped tool)`; information-holder.
- `src/world/terrain.ts` — `collides — 2D polylines; resolves circle-vs-segment`; service-provider.
- `src/systems/CollisionSystem.ts` — `resolves — player/prop/terrain overlaps into separations`; coordinator.
- `src/ui/hud.ts` — `renders — minimal oxygen/health/depth/tool readouts`; controller (DOM, few nodes, request §34).

Constraints: the player is the only thing moving here; no creature AI yet (WI-10). Reuse the §7 meters (no limb/hunger/thirst systems — request §73). Movement stays inertial even after propulsion upgrades (request §6).

## Forbidden Substitute Success

- Frictionless/ship-like movement presented as "underwater".
- A "world" that is one flat floor with no walls (no collision to test).
- Oxygen that is a no-op bar that never affects the player.

## Expected Project Knowledge Update

Note the movement model and the terrain collision approach in a project note if they are non-obvious; otherwise no note (the spec already documents them).

## Fresh-Session Handoff

Enter `item-implementer` mode for this exact work item. Read the task or story state from top to bottom, the project documentation, all passed gate artifacts, this work-item specification, and only then the listed source files.

## Implementer Handoff (from WI-01, 2026-09-05)

The scaffold is in place: `index.html` → `src/main.ts` → `Renderer`
(WebGLRenderer + Scene + fixed-width ortho camera, 2000 world units)
→ `Game.start()` running the fixed-1/60-s accumulator loop. Register
the player and all motion into `Game.update(FIXED_DT)` — it is the
single simulation seam; do not add a second tick. Replace the boot
marker box in `Game` when the player lands. Reuse
`src/game/constants.ts` for tuning numbers (import, never inline) and
`src/util/rng.ts` (mulberry32, known-vector pinned) for ambient
randomness only — never for critical gates, resources, or reveals
(request §61). Toolchain is locked (three 0.185, vite 8.2, TS 7,
vitest 5 — see BUILD.md); tests live under `src/**/*.test.ts` and run
with `npx vitest run`.
