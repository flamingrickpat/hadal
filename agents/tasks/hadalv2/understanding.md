# Understanding: hadalv2

## Request As Stated

Build a complete, browser-playable, widescreen 2D side-scrolling underwater
exploration game in HTML + TypeScript + Three.js. Target a first blind
playthrough of roughly 90-120 minutes. Build the whole game around a single
headless TypeScript simulation (request section 30) that runs identically in
the browser and in Node tests; use unit tests for rules and headless
integration scenarios for gameplay; reserve browser tests for browser,
presentation, audio, and performance. Preserve the full scope, the visual
quality bar, and the spoiler-containment rules (sections 0, 12, 68).

Acceptance examples (from section 45, MVP): new game to ending playable with no
console commands; at least four meaningful depth transitions after the coast;
crafting gates depth/capability; at least 15 distinct creatures; at least 4
creature behaviors materially different from direct pursuit; at least 2
beneficial/friendly creatures; at least 3 large-scale creatures/events; at
least 5 authored "surprise" beats; the MacGuffin can be reached and retrieved
and retrieval changes the final sequence; death and save/load work; a
blind-ish run finishes under 2.5 hours without grind; the largest encounter
stays smooth; the user has not been spoiled by development chatter.

## Product Area

The entire product. The behavioral core is one headless simulation:
`src/sim/Simulation.ts` (request section 30 boundary - no browser globals,
advanced with `createSimulation(world, seed)` and `step(input, dt)`). The
browser host `src/game/Game.ts` (booted from `src/main.ts`) renders that
simulation through Three.js and forwards inputs. The authored map is the macro
world `src/world/worldData.ts` (`MACRO_WORLD`, five depth bands). The next
change seam is the creature/encounter/hidden-lore content, which attaches to
the perception seam `src/creatures/senses.ts` (`WorldSignalBus`, the section
63 world-signal bus) and to the trigger system `src/world/triggers.ts`.

## Current Behavior

At baseline `01066db` ("checkpoint: kernel baseline for hadalv2"), the
following is built and reviewed (git history shows WI-01..WI-07 completed
immediately below that checkpoint):

- Headless simulation core: inertial swim, circle-vs-segment collision,
  oxygen/health/suit-power/cargo meters, surface base with the five stations,
  crafting, versioned save, sonar, currents, soft equipment gates, and the
  fixed-timestep `step()` (request sections 6, 7, 30, 31, 42).
- The reusable headless scenario harness `src/sim/scenario.ts` plus a
  core-loop scenario test (request sections 30, 70).
- The full five-band macro world (coast + shelf + twilight + abyss + hadal)
  with chunk streaming, authored current fields, interiors, and triggers
  (request sections 4.1/4.2/17/36/64/65).
- Visual language (water gradient, flashlight, pooled particles, parallax,
  post-fx), a procedural WebAudio system, sonar visuals, and the section 63
  world-signal bus.
- HUD, crafting menu, hidden debug panel, and a versioned `localStorage` save.

Not yet built: the creature framework (`Creature`, steering, spine renderer,
behaviors) and the entire secret roster; the section 12 hidden creative pass
(`design_private/` does not exist) and `src/content/secret/`; there are zero
`creatureSpawns` in `worldData.ts`; the MacGuffin, the non-boss endgame and
ending variants, and the five authored spectacle beats are all unimplemented.
So today the player can dive, harvest, craft, and traverse all five bands, but
there is no fauna, no story payload, and no win condition.

## Requested Behavior

The remaining scope is the creative + encounter half of the request (phases
4-9) plus the win condition:

1. The section 12 hidden creative pass, written privately under
   `design_private/`: three competing world interpretations -> critique ->
   hybridize (not average) -> an 18-24 creature roster -> diversity and reveal
   mapping on the 90-120 minute timeline.
2. The creature framework (steering, sense subscription, generic + bespoke
   controllers, the spine renderer, schools, cross-species reactions) and the
   selected secret roster, attached to the `WorldSignalBus` seam.
3. At least five authored spectacle beats and the environmental story sequence
   via the trigger system (request sections 36, 47, 52).
4. The MacGuffin (retrieval must change the final sequence) and the
   non-arena endgame with at least two ending variants (request sections 23,
   24).
5. A full art/audio pass, a balance pass toward 90-120 minutes, and the
   spoiler-safe handoff README (request sections 44, 69).

The request fixes only the coast band and the core loop; all deep-zone
identity, creature designs, the lore truth, the MacGuffin's nature, and the
endings are deliberately left to be invented privately. Assumption recorded
below: "hadalv2" continues from the `01066db` baseline rather than rebuilding
WI-01..07.

## Code Located

- symbol: createSimulation @ src/sim/Simulation.ts:530 — the section 30 API used by the browser, the headless harness, and every test to build a simulation.
- symbol: Simulation @ src/sim/Simulation.ts:96 — the single behavioral core (movement, collision, meters, crafting, sonar, currents, triggers, save).
- symbol: step @ src/sim/Simulation.ts:177 — the fixed-timestep gameplay update (request section 30).
- symbol: makeSimWorld @ src/sim/Simulation.ts:77 — the production world factory (all five bands + surface base).
- symbol: Game.update @ src/game/Game.ts:97 — the browser->simulation boundary: sim.step then mesh/HUD/sonar/autosave sync.
- symbol: MACRO_WORLD @ src/world/worldData.ts:402 — the authored five-band macro map (coast + shelf + twilight + abyss + hadal).
- symbol: BASE @ src/world/worldData.ts:413 — the surface base with the five section 5 stations.
- symbol: WorldSignalBus @ src/creatures/senses.ts:66 — the section 63 perception seam future creatures subscribe to.
- symbol: Scenario @ src/sim/scenario.ts:29 — the reusable headless harness (step/stepFor/swimTo/assert/trace).
- symbol: serializeSave @ src/game/save.ts:70 — save serialization (request section 42).
- symbol: parseSave @ src/game/save.ts:78 — save parsing + malformed-save handling (request sections 42, 70).
- symbol: loadFromStorage @ src/game/save.ts:120 — the browser storage adapter at the `localStorage` boundary.

## Project Knowledge Consulted

- project-doc: agents/projects/hadal/PROJECT.md — project_id `hadal`, purpose, non-goals, and the Reconnaissance Status (Status: usable).
- project-doc: agents/projects/hadal/ARCHITECTURE.md — the component map, the single simulation seam (Game.update -> sim.step), the perception seam (WorldSignalBus), and the save/content seams; status labels predate WI-07.
- project-doc: agents/projects/hadal/BUILD.md — the exact build/run commands (npm run dev / build / preview) and the headless-vs-browser test split.
- project-doc: agents/projects/hadal/TEST.md — the Vitest node suite and the section 70 evidence layers; test files carry inline fixtures.
- repo-doc: README.md — the public, spoiler-safe install/controls/run surface (request section 69).
- repo-doc: agents/projects/hadal/notes/20260908-implementer-wi07-macro-world-chunks.md — the WI-07 macro-world facts (chunk model, currents, triggers, gates) the requested creature/encounter work builds on.

## Knowledge Cross-Check

Confirmed: the section 30 simulation boundary (`createSimulation` / `step`) and
the section 63 world-signal bus are exactly as `ARCHITECTURE.md` describes, and
the five-band macro world and the versioned save are built as the WI-07 and
WI-03 notes describe. Refined: the four project files were last refreshed at
WI-02 (`7aa2435`) and still mark save and the macro world as "target" /
"not implemented"; at baseline `01066db` those are done, and the codegraph
index is fresh (it returned verbatim current source for `Simulation.ts`,
`Game.ts`, and `scenario.ts`), so the structural facts above rest on codegraph
plus direct reads. Not covered: none of the four files describes the
creature/encounter/MacGuffin/ending state, because none of it is built yet -
that is precisely the remaining request scope.

## Open Questions And Risks

- The creature framework is the largest unbuilt system; the section 63
  `WorldSignalBus` is the intended attach point, but no `Creature` / steering /
  spine renderer exists yet. The first creature work item must build that
  framework and attach to the seam, not grow a parallel island (request
  section 19).
- The section 12 hidden creative pass (`design_private/`) must precede
  creature implementation. The roster, reveals, MacGuffin, and endings are
  secret and must stay out of progress reports, commit summaries, and this
  artifact; this understanding deliberately keeps spoiler content out.
- Physical route reachability through all five bands is only guaranteed by the
  section 32 validators plus headless movement scenarios, not by chunk
  adjacency; a later work item must pair `simulateCriticalPath()` with route
  scenarios.
- The section 44 phase 8 balance target (90-120 minutes) and the section 34
  60-FPS target in the largest encounter require live browser observation,
  which headless tests do not establish.
- Spoiler containment: this understanding must not name deep creatures, the
  lore truth, the MacGuffin's nature, or the endings; those live only in
  `design_private/` and `src/content/secret/` (request sections 0, 12, 68).

## Assumptions

- "hadalv2" continues from the committed baseline `01066db`
  ("checkpoint: kernel baseline for hadalv2"), where WI-01..WI-07 are already
  built and reviewed, rather than rebuilding the skeleton. Rationale: the git
  history shows WI-01..07 completed immediately below that checkpoint and the
  task folder is fresh (only `request.md` and `state.md`). Rejected alternative:
  a greenfield rebuild - rejected because the request says build around the
  existing headless sim and the baseline already honors sections 30/70. This
  would only be wrong if the controller intended a from-scratch build in a clean
  repo, but the repo and its notes clearly show a continuation.
- I interpret "understanding" as mapping the full-game request onto the current
  baseline and naming the remaining change seam (creature/encounter/hidden-lore
  content + win condition), not as re-planning the work items, which is the
  planner's role.

## Codegraph Queries Run

- codegraph_codegraph_explore(query="Game update loop Simulation step createSimulation step player movement collision world spawn main entry", projectPath="C:\\Temp\\hadal-v2") - first structural lookup; located the Game host (`update` at Game.ts:97, `renderVisuals` at :123), `createSimulation` / `makeSimWorld` / `toSave` / `loadFromSave` in Simulation.ts, and the `Scenario` harness in scenario.ts, verbatim from disk.
- Blast radius from that query: `update` (PlayerController.ts:75, 2 callers), `update` (Game.ts:97), `createSimulation` (Simulation.ts:530, 7 callers incl. scenarios.test.ts, CraftingSystem.test.ts, CurrentSystem.test.ts).
- Non-existence confirmed via direct reads/grep of the codegraph-located areas: `src/creatures/` holds only `senses.ts` (the section 63 bus) - no Creature/steering/spineRenderer; `src/content/` has no `secret/`; `design_private/` is absent but gitignored; `worldData.ts` has zero `creatureSpawns`.
