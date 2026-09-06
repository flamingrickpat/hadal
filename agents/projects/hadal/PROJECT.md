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
- Product maturity: skeleton + player core (built in 184d348 / 6a21844,
  approved at 7aa2435). A buildable Vite + TS + Three.js game boots
  (`index.html` -> `src/main.ts`), the player swims inertially with
  O2/HP/depth meters, collides with a small greybox world, shows a
  minimal HUD, and has a hidden debug teleport panel (work items WI-01
  and WI-02, both reviewed and approved). The rest of the 75-section
  game — save system, surface base/crafting, visual and audio language,
  sonar + signal bus, the full 5-band macro world, the creature
  framework and hidden roster, authored encounters, MacGuffin/ending,
  balance pass, and the spoiler-safe handoff — is not yet built. The
  complete specification is `agents/tasks/hadal/request.md` (75
  sections).
- Canonical user entry points: `index.html` -> `src/main.ts`, served by
  `npm run dev` (dev port 5173); production via `npm run build` +
  `npm run preview` (request §29/§69). The boot loop is
  `Game.start()` -> `requestAnimationFrame` -> fixed 1/60 s steps of
  `Game.update(FIXED_DT)` (request §30).
- Non-goals (request §73): base construction, farming, hunger/thirst,
  multiplayer, procedural infinite world, roguelike runs, deep dialogue
  trees, quest board, skill/XP system, dozens of weapons, armor rarity,
  extra crafting stations, monetization, achievements as priority,
  mobile controls, live service. Also (request §28): no React unless the
  UI justifies it, no general-purpose ECS, no heavy physics engine.

## Reconnaissance Status

- Status: usable
- Documented against: 7aa2435a2ee1 ("[review] approve WI-02 player swim,
  terrain collision, meters, HUD, debug teleport")
- Evidence: direct reads of the current `src/` tree, the project notes
  under `agents/projects/hadal/notes/`, `package.json` + configs, the
  test suite (`npx vitest run` = 4 files / 31 tests, all passing at this
  revision), `npm run build` (exit 0), and
  `agents/tasks/hadal/request.md`. The codegraph index at `.codegraph/`
  is stale for product symbols (see the WI-01 reviewer note), so
  structural facts rest on direct file reads, not codegraph queries.
