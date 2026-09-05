# Project: hadal

- `project_id`: `hadal`
- Purpose: build HADAL (working title; request §2 also allows `BENTHIC`
  / `LOW WATER`) — a complete, browser-playable 2D side-scrolling
  underwater exploration game. A contract salvage diver descends through
  five depth bands of a finite, authored ocean to retrieve a high-value
  object from a lost deep installation. Target: roughly a 90–120 minute
  blind first playthrough (request §0, §3).
- Primary users: a human player in a desktop browser, 16:9 (tolerates
  21:9), 1080p, keyboard + mouse (request §16, §28).
- Primary languages: TypeScript (Vite), HTML5, CSS (UI), Three.js
  `WebGLRenderer` for rendering, native WebAudio, `localStorage` for
  saves, Vitest for logic tests (request §28).
- Product maturity: greenfield. At revision 207a690 ("init repo") no
  product code exists: the repository holds only workflow scaffolding
  (`agents/`), five byte-identical root agent-doc copies, `project.md`,
  `.mcp.json`, `.gitignore`, and `.pi/search.json`. The complete
  specification is `agents/tasks/hadal/request.md` (75 sections).
- Canonical user entry points: none yet. Target per request §29/§69:
  `index.html` -> `src/main.ts`, served by `npm run dev`; production via
  `npm run build` + `npm run preview`.
- Non-goals (request §73): base construction, farming, hunger/thirst,
  multiplayer, procedural infinite world, roguelike runs, deep dialogue
  trees, quest board, skill/XP system, dozens of weapons, armor rarity,
  extra crafting stations, monetization, achievements as priority,
  mobile controls, live service. Also (request §28): no React unless the
  UI justifies it, no general-purpose ECS, no heavy physics engine.

## Reconnaissance Status

- Status: usable
- Documented against: 207a690ed0f3 ("init repo")
- Evidence: codegraph (index at `.codegraph/`; explore queries return no
  product symbols) plus `agents/tasks/hadal/request.md`, `project.md`,
  `.mcp.json`, `.gitignore`, `git ls-files`, and the root agent docs
