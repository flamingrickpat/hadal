# Understanding: hadal

## Request As Stated

Build HADAL — a complete, browser-playable 2D side-scrolling underwater
exploration game in HTML + TypeScript + Three.js (request §0, §28). A
contract salvage diver descends from a small surface platform through
five depth bands of a finite, authored world (~18,000–28,000 units
wide, deepest point ~-9,000 to -12,000, request §4.1) and retrieves a
high-value object from a lost deep installation. The hidden creative
content — lore, creature roster, MacGuffin, final reveal, endings — is
to be generated privately inside the repository and must never leak into
chat, commit summaries, screenshots, or progress reports (request §0,
§12, §68).

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

## Product Area

The entire repository: this is a from-scratch build. No existing
product component is extended; every requested behavior (game loop,
player movement, world/chunks, terrain, creatures/AI/sonar, crafting,
audio, save system, hidden content pass, debug panel) is new. The
planned public entry point is `index.html` -> `src/main.ts`
(request §29, §69), which does not exist yet. Why: the only product
authority in this repository is `agents/tasks/hadal/request.md`, and
the repository contains no other product code to integrate with.

## Current Behavior

This checkout does nothing as a product. It is a greenfield,
workflow-controlled scaffold: 39 tracked files consisting of root agent
docs (five byte-identical copies), `project.md`, `.mcp.json`
(codegraph MCP), `.gitignore`, `.pi/search.json` (web-search backends),
and the `agents/` scaffolding — project knowledge templates
(`agents/projects/hadal/`), task templates (`agents/tasks/_template/`),
the current task folder (`agents/tasks/hadal/` with `request.md` and
the controller's `state.md`), and preview templates
(`agents/templates/`). There is no `package.json`, no `index.html`, no
`src/`, no test config, and no README. The codegraph index at
`.codegraph/` contains no product symbols. `state.md` records phase
`understand`, accepted revision 207a690, and two reverted
understanding attempts (citation-format failures).

## Requested Behavior

Create the whole game per the 75-section request, in the nine
implementation phases of request §44: (1) playable greybox skeleton
(swim, collision, oxygen, base, one resource, one craft, save, debug
teleport); (2) visual language (water, particles, flashlight, parallax,
procedural creature renderer, audio, sonar); (3) progression backbone
(material families, upgrades, pressure/current gates, macro world
graph, critical-path validator); (4) the private creative design pass
(`design_private/`, request §12); (5) creature framework (steering,
senses, spine renderer, schools, predators, cross-species events) plus
the hidden roster (18–24 organisms, request §11.1); (6) authored
encounters (5+ spectacle beats, environmental story); (7) full art and
audio pass; (8) balance pass toward 90–120 minutes using debug
telemetry (request §71); (9) spoiler-safe handoff (request §68, §69).

Ambiguities and their resolution (see Assumptions): the title may stay
`HADAL`; all numeric tuning values are defaults, not sacred
(request §4.1); hidden content decisions are delegated to the coding
agent by request §75; the stack is fixed (request §28); desktop
browser only, no gamepad/MVP-blocking scope (request §6, §72).

## Code Located

No product code exists in this repository, so every requested behavior
maps to the specification sections below (the only existing seams) and
to target paths the implementer will create per request §29. All cited
files exist at 207a690:

- symbol: project_id @ project.md:3 — stable project identity ("hadal"); selects `agents/projects/hadal/` as the knowledge folder for this repository
- symbol: Request @ agents/tasks/hadal/request.md:1 — the full 75-section HADAL handoff; the sole product specification, and the seam every new behavior will attach to
- symbol: TechStack @ agents/tasks/hadal/request.md:1215 — §28 mandates HTML5 + TypeScript + Vite + Three.js + native WebAudio + Vitest, and forbids React, general-purpose ECS, and heavy physics engines
- symbol: RepoLayout @ agents/tasks/hadal/request.md:1239 — §29's recommended `src/` tree (`main.ts`, `game/`, `world/`, `creatures/`, `systems/`, `content/secret/`, `ui/`, `util/`, `design_private/`); none of these paths exist yet
- symbol: WorldChunkDef @ agents/tasks/hadal/request.md:857 — §17's authored chunk data shape (bounds, terrain, exits, resource/creature spawns, props, triggers, ambient) that the world layer must implement
- symbol: SaveGameV1 @ agents/tasks/hadal/request.md:1623 — §42's versioned `localStorage` save schema; no persistence code exists yet
- symbol: MainLoop @ agents/tasks/hadal/request.md:1319 — §30's fixed 1/60 s timestep loop pseudo-code that the future `src/main.ts` boot must implement
- symbol: mcpServers @ .mcp.json:2 — the only configured MCP server (codegraph, stdio `codegraph serve --mcp`); the structural lookup channel for this repository
- symbol: WorkflowRules @ AGENTS.md:1 — repository session rules: codegraph for structural questions, task-folder artifact ownership, `state.md` read-only

Nearest existing seams for behaviors with no file yet: the boot and
fixed-step loop have no `src/main.ts` (target: `src/main.ts`, request
§29/§30); persistence has no `src/game/save.ts` (target per request
§42); the world/chunk layer has no `src/world/` (target per request
§17/§29); creature rendering and the signal bus have no
`src/creatures/` (target per request §13.2/§63); hidden content has no
`src/content/secret/` or `design_private/` (target per request §12/§29,
and `.gitignore` does not yet cover `design_private/`).

## Project Knowledge Consulted

- project-doc: agents/projects/hadal/PROJECT.md — established project_id "hadal", greenfield maturity at 207a690, the target entry points (`index.html` + `src/main.ts`), and the non-goals from request §73
- project-doc: agents/projects/hadal/ARCHITECTURE.md — established the target component map (`src/game`, `src/world`, `src/creatures`, `src/systems`, `src/content/secret`), the main-loop and world-signal-bus seams, and that no code exists in this revision
- project-doc: agents/projects/hadal/BUILD.md — established the target `npm install` / `npm run dev` / `npm run build` / `npm run preview` commands (request §69) and that none are runnable yet because no `package.json` exists
- project-doc: agents/projects/hadal/TEST.md — established Vitest as the target logic-test framework, the request §70 in-browser integration checklist, and the `validateWorld()` / `simulateCriticalPath()` validators (request §32)
- repo-doc: agents/tasks/hadal/request.md — the authoritative handoff: all 75 sections, the MVP acceptance criteria (§45), implementation phases (§44), scope-cut order (§72), and explicit non-goals (§73)
- repo-doc: .mcp.json — codegraph is the only configured MCP server (stdio, `codegraph serve --mcp`)
- repo-doc: .gitignore — ignores only `.codegraph/` and `agents/tasks/*/state.md`; `design_private/` (request §12) is not ignored yet
- repo-doc: agents/tasks/hadal/state.md — controller run state: phase "understand", accepted revision 207a690, attempts 1–2 reverted for `Code Located` citation failures (gitignored, read-only)

## Knowledge Cross-Check

Confirmed by evidence: the greenfield state — `git ls-files` lists 39
tracked files, all workflow scaffolding and docs; `git log` shows two
init commits; the four project-knowledge files contained only blank
template fields; codegraph explore over `C:\Temp\hadal` returned "No
relevant code found" for both product and scaffolding queries.
Refined: `CONTEXT.md`/`AGENTS.md` refer to a root `PROJECT.md`, but the
tracked identity file is lowercase `project.md` — a case-only
discrepancy that resolves identically on this Windows host; citations
use the actual filename. The five root agent docs
(`AGENTS.md`, `CLAUDE.md`, `CODEX.md`, `QWEN.md`, `CONTEXT.md`) are
byte-identical copies of the same 1975-char workflow-rules text — no
project-specific facts live there. Not covered: no human-facing
documentation exists (no `README.md` yet; request §69 requires one at
completion), and nothing in the repository describes the game's stack,
architecture, or tests — all of that enters from `request.md`, which
the project files now record as *target* facts. The codegraph index
also does not surface markdown/JSON scaffolding symbols, so tree
listing (`git ls-files`) was the fallback for scaffolding evidence.

## Open Questions And Risks

- Node/npm version is unpinned (no `package.json`); the implementer
  must choose a current LTS — low risk, but the choice should be
  recorded in BUILD.md when scaffolding lands.
- `.gitignore` does not cover `design_private/` (request §12 asks to
  add it if commits/diffs reach the player); deciding and editing
  `.gitignore` is implementer work, not understander work.
- Spoiler containment is a cross-cutting risk for every later role:
  artifacts, commit messages, screenshots, and progress reports must
  avoid hidden-content vocabulary (request §0, §68).
- Verification boundary: no browser-automation tool exists in this
  checkout (see BUILD.md); every request §45/§70 acceptance criterion
  is manual in a real desktop browser, and the 60 FPS performance claim
  (request §34) needs real observation.
- Scope risk: the request is large (75 sections). Request §72's cut
  order is the safety valve; creature roster quality, depth
  progression, sonar, atmosphere, the five spectacle beats, the final
  reveal, friendly fauna, and saves must not be cut.
- Determinism risk: seeded RNG must never touch critical gates,
  critical resources, major reveals, or final-path viability
  (request §61, §4.4).
- Save schema must be versioned from the start so later migrations stay
  trivial (request §42, §70).

## Codegraph Queries Run

1. First (mandatory gate) query: `codegraph_explore`
   "Game main entry point boot loop Vite Three.js player rendering".
   The first call failed with "No CodeGraph project is loaded for this
   session" (server root `C:\source\pm\pm-workflows`); the retry with
   `projectPath: C:\Temp\hadal` returned "No relevant code found" — the
   index exists at `.codegraph/` but contains no product symbols,
   consistent with the greenfield checkout.
2. `codegraph_explore` "project hadal request index mcpServers
   configuration" (projectPath `C:\Temp\hadal`) — again "No relevant
   code found"; the index does not even surface scaffolding
   markdown/JSON symbols. Structural conclusions therefore rest on
   `git ls-files` (39 tracked files, no product code) plus direct
   reads of `request.md`, `project.md`, `.mcp.json`, `.gitignore`, and
   the root docs.

## Assumptions

- `request.md` is the sole, complete product specification; where it is
  silent, follow its own decision rules (request §75: decide
  independently, prefer the more memorable experience, prefer bespoke
  small solutions). Rejected alternative: waiting on user choices,
  which this unattended workflow does not allow and which request §75
  explicitly forbids for creative decisions.
- "Change no product code" for this role means creating no product
  files at all — not even `index.html` or `package.json` scaffolding.
  Scaffolding is implementer work; pre-creating it here would blur role
  boundaries and the next gate's baseline.
- In a greenfield repository, `Code Located` must cite files that
  actually exist (the `understanding_grounded` gate rejected attempts
  1–2 for citing target paths like `src/game/Game.ts`); therefore the
  bullets cite the spec sections and scaffolding files that exist, and
  target paths are named in prose instead.
- The working title remains `HADAL` (request §2 permits alternatives;
  no decision is required now).
- The four project files are written as target-state documents (stack,
  commands, layout all sourced from `request.md` sections) and are
  labeled "target" throughout, because no code or manifest exists to
  document as current fact; the current state is recorded as
  greenfield.
