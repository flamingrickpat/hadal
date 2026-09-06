# Plan: hadal — build the complete HADAL underwater exploration game

## User Vision

- Actor: a human player in a desktop browser (16:9, tolerates 21:9), 1080p, keyboard + mouse.
- Observable outcome: a complete, browser-playable 2D side-scrolling underwater exploration game (HTML + TypeScript + Three.js) that a new player can play from a fresh browser profile start to an ending with no developer intervention, targeting a 90–120 minute blind first playthrough (request §0, §3, §45).
- Success examples: fresh profile boots with no console exceptions; the player dives, gathers, surfaces, crafts, and descends through five depth bands; at least 15 distinct creature types with 4+ materially different non-chase behaviors and 2+ beneficial/friendly species; at least 3 large-scale creature events; at least 5 authored "surprise" spectacle beats inside gameplay; the MacGuffin is reached and retrieved and retrieval changes the final sequence; death and save/load work via versioned `localStorage`; a near-blind playthrough finishes under 2.5 hours; the largest encounter stays smooth (~60 FPS at 1080p).
- Anti-examples: a rendering-only ocean with no completable arc; a greybox that never becomes atmospheric; creatures that are generic size-scaled fish; a MacGuffin that is "pick up glowing orb, fade to credits"; dev chatter, commit messages, screenshots, or progress reports that spoil the hidden lore, creature identities, MacGuffin nature, or endings (request §0, §68); an infinite procedural sandbox; survival-chore meters (hunger/thirst/temperature); a conventional arena boss for the leviathan.
- Non-substitutable capabilities: the private creative pass (hidden world / roster / reveal / MacGuffin / endings) is decided inside the repository and never leaked into chat, commits, screenshots, or reports (request §12, §68); creature roster quality, depth progression, sonar, atmosphere, the five spectacle beats, the final reveal, friendly fauna, and saves must not be cut (request §72).
- Non-goals (request §73, §28): base construction, farming, hunger/thirst, multiplayer, procedural infinite world, roguelike runs, deep dialogue trees, quest board, skill/XP, dozens of weapons, armor rarity, extra crafting stations, monetization, achievements, mobile controls, live service; no React unless the UI justifies it, no general-purpose ECS, no heavy physics engine.
- User-written acceptance criteria: request §45 (the full list is in `understanding.md`); these are the observable criteria every work item maps to.

## Story Mode

- Selected mode: `implicit`.
- Why this mode fits: this is one large greenfield build with no existing story structure; the nine implementation phases of request §44 are the natural backbone. This workflow has no story mode and no user to confirm one, so work items go directly under `workitems/` (no story folders).
- User confirmation artifact: none (unattended; the request's §44 phases and §45 acceptance criteria are the authoritative structure).

## Existing Seam And Data Origins

- Entry point: none exists. Target per request §29/§69: `index.html` -> `src/main.ts`, served by `npm run dev`; production via `npm run build` + `npm run preview`.
- Existing owner: none (greenfield). The sole existing design authority is `agents/tasks/hadal/request.md` (75 sections); the project docs under `agents/projects/hadal/` record the target state.
- Extension seam: the request's own section structure is the seam map. All behavior attaches to the spec-defined seams rather than inventing parallel ones: tech stack §28, repository layout §29, fixed-step main loop §30, upgrade data model `EquipmentDef` + `Capability` §62, world chunk data `WorldChunkDef` §17, creature AI `CreatureDef` §19, save schema `SaveGameV1` §42, world-signal bus §63, current fields §64, encounter triggers §36, scanner entries §56.
- True data producers: all game data is authored in-repository (world/chunk data, material families, recipes, resources, dialogue/radio, landmarks, and the private creative content under `design_private/` + `src/content/secret/`). There is no database, network, or external data producer. The only runtime-persisted data is the versioned `localStorage` save (§42).
- External systems and required infrastructure: none (fully client-side). Browser APIs: WebGL (Three.js `WebGLRenderer`), `AudioContext` (initialized after first input, §27), `localStorage`. Node/npm for build. A real desktop browser is required for visual/audio/performance verification; no browser-automation tool exists in this checkout (see BUILD.md "Delivery Verification Capabilities").

### Reconnaissance (Phase 1.5)

- **Seam.** Greenfield: there is no existing code to extend. The feature plugs into the spec-defined seams above. No silo: every behavior flows through the single `Game.update(FIXED_DT)` tick (request §30, §36) and the world-signal bus (request §63), per ARCHITECTURE.md "Integration Seams". Building parallel subsystems (the Case-D failure mode) is explicitly forbidden by request §28 (no general ECS) and §75 (prefer bespoke small solutions).
- **Data provenance.** Every value the game reads is authored, not fetched: player meters from the player controller (§6/§7), depth from position.y, resources from chunk `resourceNodes` (§17), capability/depth ratings from `EquipmentDef` (§62), gate state from capability queries (§4.3/§62), creature state from `CreatureDef` (§19), save from `localStorage` (§42). Nothing requires a load path across a boundary; the "invisible floor" risk is that authored content (recipes, resources, triggers, creature IDs) must all resolve — guarded by `validateWorld()` (request §32).
- **Diff shape.** All product files are new (greenfield): `package.json`, `index.html`, `vite.config.ts`, `tsconfig.json`, `README.md`, the `src/` tree per §29, plus `design_private/` and a `.gitignore` edit (add `design_private/`). Nothing is deleted; nothing is refactored. This is expected and correct for a from-scratch build, not the "adds files, deletes nothing" red flag that applies to feature integrations.
- **Domain concepts reused vs cloned.** No concepts exist yet; the spec defines the canonical ones that implementers must reuse and never clone: `EquipmentDef`/`Capability` (§62), `WorldChunkDef`/`ExitDef`/`ResourceSpawnDef`/`CreatureSpawnDef`/`PropDef`/`TriggerDef`/`AmbientDef` (§17), `CreatureDef`/`MovementDef`/`SenseDef`/`BehaviorDef`/`CombatDef`/`EcologyDef`/`CreatureAudioDef` (§19), `SaveGameV1` (§42), `WorldSignal` (§63), `CurrentField` (§64), `EncounterTrigger`/`TriggerCondition`/`TriggerAction` (§36), `ScanEntry` (§56). Gates query capabilities/depth rating, not hardcoded recipe IDs (§62).

### Integration question taxonomy

- **Data provenance.** All values are authored in-repository (world/recipe/resource/dialogue/hidden content); nothing is fetched across a boundary. The one load path that could silently return "empty" is authored-content ID resolution (recipe/creature/trigger/prop IDs), guarded by `validateWorld()` (request §32). Covered above.
- **Seam vs silo.** One simulation seam (`Game.update(FIXED_DT)`, request §30) and one perception seam (the §63 world-signal bus) own all behavior; no parallel islands (the Case-D failure mode is explicitly forbidden by §28/§75). Covered above.
- **Domain reuse.** The §62/§17/§19/§42/§63/§64/§36/§56 types are the canonical domain concepts; implementers reuse them and never clone them. Covered above.
- **Cross-layer.** Does not apply: the whole game is client-side TypeScript running in the browser (request §28); there is no database, network, or native boundary to cross. The only persistence boundary is `localStorage`, owned by `src/game/save.ts` (§42).
- **Concurrency and UI marshaling.** Does not apply: a single-threaded browser driven by one fixed 1/60 s step (request §30); there are no off-thread callbacks to marshal back. The UI is a small set of DOM nodes updated on the step (request §34).
- **Persistence and versioning.** The save is a versioned `SaveGameV1` from the start (request §42); a schema change must keep migration trivial and a malformed save must reset or back up gracefully (request §70) — carried as a hard constraint.
- **Localization.** Does not apply: no i18n. All in-game text is authored English content (request §22, §38, §57); display strings are plain authored strings.

## Approach

Build in the nine phases of request §44, each as independently committable, independently reviewable work items, in dependency order:

1. **Skeleton (Phase 1, WI-01..03):** Vite+TS+Three.js+Vitest scaffold and boot loop → inertial swim + 2D terrain collision + oxygen/depth + greybox world → surface base + one resource + one craft + versioned save + death/respawn + debug panel. End: the player can dive, gather, surface, craft, and go farther.
2. **Visual language (Phase 2, WI-04..06):** water gradient / particles / flashlight / parallax / grain → procedural WebAudio system → sonar + world-signal bus. End: one screen looks genuinely atmospheric, and perception (sonar + signal bus) is a real system.
3. **Progression backbone (Phase 3, WI-07..08):** full macro world (5 depth bands, chunk streaming, currents, interiors, triggers) → material families + upgrades + soft gates + `validateWorld()`/`simulateCriticalPath()`. End: the game is completable as boxes and circles with a proven critical path.
4. **Hidden creative pass (Phase 4, WI-09):** private design pass per §12 producing `design_private/`; the world, roster, reveals, MacGuffin, and endings are selected here and never leaked into chat/commits/reports.
5. **Creature framework + roster (Phase 5, WI-10..11):** reusable steering/senses/spine/schools/predator/cross-species framework → the selected 18–24-organism secret roster in `src/content/secret/`.
6. **Authored encounters (Phase 6, WI-12):** the 5+ spectacle beats, environmental story, motifs, foreshadowing, puzzles.
7. **MacGuffin + endgame + endings (Phase 6/7, WI-13):** the retrieval mechanic, non-boss endgame, ≥2 ending variants.
8. **Full art/audio + camera + juice (Phase 7, WI-14..15):** replace debug geometry, camera scale-reveals, effects/juice, UI/UX + accessibility.
9. **Balance (Phase 8, WI-16):** full playthroughs with debug telemetry tuned toward 90–120 min blind.
10. **Spoiler-safe handoff + delivery verification (Phase 9, WI-17):** spoiler-safe README, final spoiler audit, and the real-user-path §70 checklist recorded in `application_verification.md` with in-seam remediation.

Spoiler containment is a cross-cutting constraint on every work item: hidden content lives only in `design_private/` and `src/content/secret/`, and no work item, commit message, screenshot, or progress report names deep creatures, late-zone visuals, the lore truth, the MacGuffin nature, the final-encounter mechanics, or the ending variants (request §0, §12, §68).

## Work-Item Sequence

| # | Work item | Request phase | Depends on |
|---|---|---|---|
| WI-01 | Scaffold project (Vite+TS+Three.js+Vitest, boot loop, ortho camera, minimal scene) | 1 | — |
| WI-02 | Player swim + 2D terrain collision + oxygen + depth + greybox world | 1 | WI-01 |
| WI-03 | Surface base + resource + crafting + versioned save + death/respawn + debug | 1 | WI-02 |
| WI-04 | Visual language (water, particles, flashlight, parallax, grain, per-band profiles) | 2 | WI-03 |
| WI-05 | Procedural WebAudio system (helpers, per-band layers, depth audio) | 2 | WI-01 |
| WI-06 | Sonar system + world-signal bus | 2 | WI-04, WI-05 |
| WI-07 | Macro world (5 bands, chunk streaming, currents, interiors, triggers) | 3 | WI-03 |
| WI-08 | Material families + upgrades + soft gates + critical-path validator | 3 | WI-07 |
| WI-09 | Hidden creative design pass (`design_private/`) | 4 | WI-08 |
| WI-10 | Creature framework (steering, senses, spine, schools, predators, cross-species) | 5 | WI-06, WI-07 |
| WI-11 | Hidden creature roster (18–24 organisms in `src/content/secret/`) | 5 | WI-09, WI-10 |
| WI-12 | Authored encounters + environmental story + motifs + foreshadowing + puzzles | 6 | WI-11, WI-07 |
| WI-13 | MacGuffin + endgame + ending variants | 6/7 | WI-12, WI-11 |
| WI-14 | Camera + effects + juice + post-processing | 7 | WI-12 |
| WI-15 | UI/UX + accessibility + full art/audio polish | 7 | WI-14 |
| WI-16 | Balance pass toward 90–120 min blind (telemetry) | 8 | WI-13, WI-15 |
| WI-17 | Spoiler-safe handoff + README + real-user-path delivery verification | 9 | WI-16 |

If a scenario spans work items, the final proof is assigned to WI-17: the real-user-path delivery verification executes the request §70 checklist end-to-end (title → dive → harvest → craft → deeper → MacGuffin → ending).

## Verification Plan

- Focused tests: Vitest (`npx vitest run`) for deterministic logic only: `validateWorld()`, `simulateCriticalPath()`, recipe/gate/creature/trigger ID resolution, seeded-RNG determinism (request §61), collision resolution, oxygen/cargo/health math, save serialize/deserialize round-trip + migration + malformed-save reset (request §42, §70). No unit tests for rendering or audio (not automatable in this checkout).
- Workflow tests: each work item's acceptance table (in the work item) is verified by the work-item-reviewer against the committed diff.
- Live/external checks: the request §70 checklist (boot, core loop, progression, creatures, save, ending) and the §34/§14.3 visual + performance assertions, all observed manually in a real desktop browser (no automation exists in this checkout). The in-engine debug panel (§33) and balance telemetry (§71) are the measurement channels.
- User manual checks: a timed near-blind playthrough toward 90–120 minutes (request §71, §44 phase 8); per-band palette / particle / lighting / creature-reveal observation at 1920×1080 (request §14).
- Final delivery verification work item: WI-17.
  - Public start/readiness: `npm run dev` (or `npm run build` + `npm run preview`) in a fresh browser profile boots with no console exceptions; audio unlocks after first input (request §70).
  - Primary user flow: title → surface platform → dive → harvest → surface → craft → deeper (request §53), through MacGuffin retrieval and the ending beat (request §23, §24, §45).
  - State/restart/external boundary: reload after base return, after each major tier, after death; malformed `localStorage` save resets or backs up gracefully (request §25, §42); MacGuffin trigger cannot fire twice (request §70).
  - Visible-output check: largest encounter holds ~60 FPS at 1080p; depth bands visually and aurally distinct (request §14.3, §34).
  - Tool or MCP capability: none — manual observation in a real browser, supported by the debug panel (§33) and telemetry (§71).
  - Required artifact: `application_verification.md`.

## Infrastructure Contract

- Build command: `npm install` then `npm run build` (Vite).
- Test command: `npx vitest run` (once Vitest is configured in WI-01).
- Start command: `npm run dev`.
- Restart command: re-run the same command; state persists in `localStorage`, so a restart resumes the last save.
- Health command: the browser page boots with no console exceptions; audio unlocks after first input (request §70).
- Required runtimes: Node.js (LTS; version recorded in `agents/projects/hadal/BUILD.md` when WI-01 lands) + npm; a real desktop browser with WebGL at 1080p/16:9.
- Required services, endpoints, MCPs, credentials, and fixtures: none. Fully client-side; no backend, no network. Only the codegraph MCP (`.mcp.json`) and a web-search backend (`.pi/search.json`, unrelated to the game) exist in the checkout.

## Reality Check

Implementable as understood: the seams exist (spec-defined, to be created per §29); all data the feature needs is authored in-repository (no external dependency); and no acceptance criterion depends on access or infrastructure I lack. The one real constraint is verification: the §34/§14.3 visual and performance assertions and the §70 checklist cannot be automated in this checkout (no browser-automation tool) and must be observed manually in a real desktop browser. That is a verification-method constraint, not an implementation blocker; it is captured in WI-17 and in TEST.md "Delivery Verification". The scope is large (75 sections) but request §72's cut order is the safety valve, and the never-cut list (creature quality, depth progression, sonar, atmosphere, the five spectacle beats, the final reveal, friendly fauna, saves) is enforced as a hard constraint. No work item depends on a user decision: request §75 delegates creative decisions to the coding agent and forbids asking the user, and the §44 phases provide the structure. Verdict: **proceed**.

## Assumptions

Decisions made about the request, recorded here so the reviewer can audit them:

- **A-R1 (sole spec).** `request.md` is the sole, complete product specification. Where it is silent, I follow its own decision rules (§75: decide independently, prefer the more memorable experience, prefer bespoke small solutions, prefer finishing the 2-hour arc over adding systems). Rejected alternative: waiting on user choices — unavailable in this unattended workflow and explicitly forbidden by §75 for creative decisions.
- **A-R2 (no product code this role).** As planner I create no product files — not even `index.html` or `package.json`. Scaffolding is implementer work (WI-01). Pre-creating it here would blur role boundaries and move the baseline the next gate checks against.
- **A-R3 (title).** The working title stays `HADAL`; §2 allows alternatives and says not to spend time on naming. No decision is forced.
- **A-R4 (numeric defaults).** All numeric tuning values in §4.1 (world size, camera framing, player width) and elsewhere are tuning defaults, not sacred; implementers tune them during the balance pass (WI-16).
- **A-R5 (spoiler-safe planning).** Creative content (world, roster, reveals, MacGuffin, endings) is decided by the implementer during the hidden creative pass (WI-09) and recorded in `design_private/`. This plan and every work item describe the *process and criteria* of that pass, never the *content*, so no artifact spoils the player (request §0, §12, §68). Rejected alternative: pre-specifying creature/lore content in the plan, which would leak it.
- **A-R6 (platform).** Desktop browser only, keyboard + mouse; gamepad support is optional and first in the cut order (request §6, §72). Remappable controls optional, not MVP-blocking (§43).
- **A-R7 (phase backbone).** The nine phases of request §44 are the natural work-item backbone. I decompose them into 17 work items; each is independently committable and reviewable. This is a granularity decision, not a scope change.
- **A-R8 (greybox→authored world).** The small greybox world built in WI-02/03 is refactored into the full authored chunk model in WI-07 (preparatory refactor per "Integrate at Existing Seams"). Expected for a from-scratch build; noted in WI-07.

## Assumption Ledger

Assumptions about the (greenfield) codebase, each with what falsifies it:

| ID | Assumption | Evidence | Falsified by | Required response |
|---|---|---|---|---|
| A-C1 | No product code exists; the whole build is new | codegraph explore (this session) returns "No relevant code found"; `git ls-files` = 39 scaffolding files | a product file exists that I must integrate with | route to planner; re-plan seams against the real code |
| A-C2 | The §29 layout is viable as-is | §29 is the spec's own recommended tree; ARCHITECTURE.md records it as target | a §29 path is wrong/unbuildable | route to planner; adjust target paths |
| A-C3 | Node LTS + npm can scaffold Vite/TS/Three.js/Vitest | request §69 assumes plain `npm install`; BUILD.md target commands | `npm install`/`npm run build` fail on the chosen toolchain | route to planner; record a working Node version in BUILD.md |
| A-C4 | `design_private/` can be git-ignored to contain spoilers | `.gitignore` currently ignores only `.codegraph/` and `state.md`; request §12 | ignoring is rejected or the env exposes ignored files | store private content in `src/content/secret/` only; never quote it in chat |
| A-C5 | No browser automation exists; §70/§34/§14.3 are manual | BUILD.md "Delivery Verification Capabilities" lists none; only codegraph MCP | a browser-automation tool becomes available | switch WI-17 to automated end-to-end verification |
| A-C6 | The spec's data model (§62/§17/§19/§42/§63/§64/§36/§56) is complete enough to build from | the spec defines each type's fields | a type is missing a field the feature needs | route to planner; add the field to that spec section's work item |
| A-C7 | A single 1/60 s fixed-step loop (§30) is sufficient for all systems | §30 pseudo-code; §30 "avoid tying movement to frame rate" | a system needs a different cadence | route to planner; add a sub-step or decoupled system |

## Constraints

- Spoiler containment is non-negotiable on every artifact, commit, screenshot, and report (request §0, §12, §68).
- 60 FPS at 1080p on an ordinary desktop browser; pool particles, throttle offscreen AI, cap ambient counts, reuse geometry/materials, no per-frame allocations in hot loops, few DOM nodes (request §34).
- Widescreen-first: design 16:9, tolerate 21:9 by widening horizontal visibility (not stretching UI); aggro by world distance, not screen edge (request §16).
- Deterministic seeded randomness for schools/particles/ambient scatter/idle variation only; never for gates, critical resources, major reveals, lore order, or final-path viability (request §61, §4.4).
- Critical resources are deterministic; the validator proves the critical path is reachable before each gate (request §4.4, §40, §32).
- No React, no general-purpose ECS, no heavy physics engine (request §28).
- Versioned `SaveGameV1` from the start; keep migration trivial; malformed save resets or backs up gracefully (request §42, §70).
- Scope-cut order if development balloons (request §72): gamepad, settings UI, codex, cosmetic upgrades, side caves, creature-vs-creature combat, second ending, post-processing. Never cut: creature quality, depth progression, sonar, atmosphere, the five spectacle beats, the final reveal, friendly fauna, saves.

## Out Of Scope

- Everything in request §73 (base construction, farming, hunger/thirst, multiplayer, procedural infinite world, roguelike runs, deep dialogue trees, quest board, skill/XP, dozens of weapons, armor rarity, extra crafting stations, monetization, achievements, mobile controls, live service).
- React, general-purpose ECS, heavy physics engine (request §28).
- Gamepad support (optional; first cut, request §72).
- A full Pokémon-style codex (optional fragmentary scanner only, request §56).

## Resolved User Decisions

There is no user to ask (unattended). The decisions above (A-R1..A-R8) are made per request §75's delegation. No request decision is left open: creative content is delegated to the implementer (A-R5), the platform is fixed (A-R6), the phases provide structure (A-R7), and tuning values are defaults (A-R4).

## Handoff

No implementer handoff is written yet (per plan mode). Each work item carries its own Fresh-Session Handoff section; the work-item sequence above is the dispatch order.

## Revision — re-plan at 3b12fa7 (2026-09-06)

Dated revision of the plan above. It does not rewrite the 17-work-item
decomposition (which remains the authoritative decomposition); it records the
current state, supersedes the now-stale greenfield framing, and closes two
verification-architecture gaps with append-only addenda to existing work items.

### Current state

- The 17 work items (WI-01..WI-17) remain the full decomposition of the
  understood task and cover every request §45 acceptance criterion. The
  "Work-Item Sequence" table and dependency order are unchanged. No work item was
  added, removed, or renumbered (work-item numbers are never reused).
- WI-01 (scaffold, 184d348) and WI-02 (player swim / terrain / meters / HUD /
  debug, 6a21844) are implemented, reviewed, and approved at 7aa2435. The
  current queue is WI-03..WI-17.
- The game boots (`index.html` → `src/main.ts` → `Game`), runs a fixed 1/60 s
  loop with the single `Game.update(FIXED_DT)` seam
  (`src/game/Game.ts:85`), has the inertial player + O2/HP/depth meters,
  circle-vs-segment terrain collision over `GREYBOX_WORLD`, a minimal HUD, and
  the `?debug=1` teleport panel. Four Vitest suites (31 tests) cover the
  movement integrator, meter math, terrain resolution, and seeded RNG;
  `npm run build` exits 0.

### Superseded greenfield framing

"Existing Seam And Data Origins" and Assumption-Ledger row A-C1 were written
when the project was greenfield. A-C1's falsification condition ("a product file
exists that I must integrate with") has now been met: the skeleton (WI-01) and
player core (WI-02) exist. The required response — re-plan the seams against the
real code — has been taken: the refreshed `understanding.md` and each later work
item attach to the existing seams (`Game.update` tick, `EquipmentDef`/
`Capability`, `GREYBOX_WORLD`, `createRng`, `enableDebugPanel`, `Renderer`)
rather than inventing parallel ones. A-C1's conclusion ("route to planner;
re-plan") is recorded here as resolved; the row itself is retained unchanged as
history.

### Verification-architecture gap (closed this revision)

Request §0 (executive directive) and §30/§70 require a headless TypeScript
simulation shared by the browser and Node tests, exposed as a small
`createSimulation(world, seed)` / `step(state, input, dt)` API, with a reusable
Node scenario harness that advances the production simulation with normal player
actions over production world data and the actual spawn. Confirmed not yet in the
codebase at 3b12fa7: there is no `createSimulation`/`step` API and no scenario
harness — WI-02's tests are per-function unit tests (integrator, meters,
terrain) that are already Node-importable, which is the correct start but not the
unified boundary. This is the primary way every later gameplay feature is verified
(`understanding.md` "Open Questions And Risks"), so it is made explicit and
testable here:

- The §30 simulation boundary + §70 reusable scenario harness + the §70 9-step
  continuous core-loop scenario (spawn → first resource → collect → return to
  base → craft → verify capability → leave base → serialize + load → verify) +
  separate headless vs. browser test commands are assigned to **WI-03**
  (append-only addendum), the item that delivers the first full headless core
  loop (base + resource + crafting + save).
- The §70/§32 physical route scenarios (required gates / shortcuts / progression
  materials, verified against production collision geometry at the capability
  stage then available, paired with `simulateCriticalPath()`) are assigned to
  **WI-08** (append-only addendum), the item that owns the critical-path
  validator.

No acceptance criterion from request §45 is left uncovered by the 17 work items
plus these two addenda. The project note
`agents/projects/hadal/notes/20260906-planner-replan-sim-boundary.md` records the
exact seam for the WI-03 simulation core.
