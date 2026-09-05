# WI-01: Scaffold the HADAL project and boot loop

## Identity

- Task: hadal
- Story: implicit
- Owner role: `item-implementer`
- Complexity: low-medium
- Dependencies: none (first)

## Goal

Stand up a Vite + TypeScript + Three.js project that boots a minimal WebGL scene on a fixed 1/60 s timestep with an orthographic camera, giving the game a buildable, renderable foundation.

## Vision Link

Request §28 (stack), §29 (layout), §30 (main loop), §16 (ortho camera), §69 (dev/README commands). Foundation for every later work item; §45 boot criterion (fresh profile boots, no console exceptions) starts here.

## Acceptance Criteria

- [ ] `package.json`, `vite.config.ts`, `tsconfig.json`, and `index.html` exist; `npm install` and `npm run build` both succeed with no errors.
- [ ] `src/main.ts` boots the game: creates a `WebGLRenderer`, a minimal 3D scene, and an orthographic camera; a frame renders at 1920×1080 in a real browser with no console exceptions.
- [ ] The loop runs on a fixed 1/60 s timestep (accumulator pattern, request §30); simulation is not tied to frame rate.
- [ ] A `Game` orchestrator owns `update(FIXED_DT)` / `render` and the fixed-step frame loop (request §30; ARCHITECTURE.md "Simulation tick").
- [ ] `src/game/` core (`Game.ts`, `GameState.ts`, `constants.ts`) and `src/render/Renderer.ts` exist (request §29).
- [ ] `.gitignore` is extended to include `design_private/` and node build artifacts (request §12).
- [ ] Vitest is configured and at least one deterministic logic test passes via `npx vitest run`.
- [ ] `README.md` skeleton exists with install/build/run/dev commands, noting the full spoiler-safe README arrives in WI-17 (request §69).
- [ ] The chosen Node LTS version is recorded in `agents/projects/hadal/BUILD.md`.

## Required Evidence

| Criterion | Evidence type | Command or artifact |
|---|---|---|
| Build succeeds | automated | `npm install` && `npm run build` exit 0 |
| Scene boots, no console exceptions | manual (browser) | open `npm run dev` URL at 1080p; confirm a frame renders and console is clean |
| Fixed 1/60 s timestep, not frame-tied | workflow (code + review) | `src/game/Game.ts` accumulator loop; reviewer confirms simulation cadence is independent of `requestAnimationFrame` timing |
| Vitest passes | automated | `npx vitest run` exit 0 |
| design_private/ ignored | automated | `git check-ignore design_private/probe` returns the path |

## Tests To Write First

- One trivial deterministic logic test (e.g., a seeded-RNG or math util under `src/util/`) to prove the Vitest toolchain runs.

## Live Or External Verification

Open the dev-server URL in a real desktop browser at 1920×1080; confirm a frame renders and the console is clean.

## Infrastructure Required

- Start: `npm install` then `npm run dev`
- Restart: re-run `npm run dev`
- Health: browser page renders a frame with no console exceptions
- Timeout: n/a
- Endpoint or MCP: none (codegraph MCP only)

## File Pointers

- `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `README.md`, `.gitignore`
- `src/main.ts`, `src/game/Game.ts`, `src/game/GameState.ts`, `src/game/constants.ts`, `src/render/Renderer.ts`, `src/util/`
- `agents/projects/hadal/BUILD.md` (record Node version + working commands)
- request §28, §29, §30, §16, §69

## Architecture And Integration Constraints

New files, L1 (problem→solution) + archetype:

- `src/main.ts` — `boot — assemble renderer, game, and fixed-step frame loop`; service-provider.
- `src/game/Game.ts` — `coordinates — game frame lifecycle across player/world/creatures/systems`; coordinator (owns `update`/`render` + the accumulator loop).
- `src/game/GameState.ts` — `holds — mutable session state`; information-holder.
- `src/game/constants.ts` — `holds — tuning constants (timestep, camera, world scale)`; information-holder.
- `src/render/Renderer.ts` — `renders — a Three.js scene onto a WebGL canvas`; service-provider.

Constraints: Three.js `WebGLRenderer` (not a Canvas2D/React renderer); no React, no ECS (request §28); `Game.update(FIXED_DT)` is the single simulation seam (ARCHITECTURE.md).

## Forbidden Substitute Success

- A "build" that skips rendering (a Node-only build with no browser render).
- A frame tied to `requestAnimationFrame` timing rather than the fixed 1/60 s step.
- An empty scene claimed as "renders" without a real WebGL canvas at 1080p.

## Expected Project Knowledge Update

Record the chosen Node LTS version and the working `npm` build/dev/test commands in `agents/projects/hadal/BUILD.md`; add a short note if the Three.js version or any toolchain choice affects the build.

## Fresh-Session Handoff

Enter `item-implementer` mode for this exact work item. Read the task or story state from top to bottom, the project documentation, all passed gate artifacts, this work-item specification, and only then the listed source files.
