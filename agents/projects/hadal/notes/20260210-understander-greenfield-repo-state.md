---
title: Greenfield repo state and citation grounding
role: understander
created: 2026-02-10
tags: [greenfield, workflow, codegraph, citations, spoilers]
symbols: [project_id, SaveGameV1, WorldChunkDef, validateWorld, simulateCriticalPath]
files: [agents/tasks/hadal/request.md, project.md, .mcp.json, AGENTS.md]
---

# Greenfield Repo State And Citation Grounding

## Summary

As of 207a690 ("init repo") the hadal repository contains no product
code at all: no `package.json`, `index.html`, `src/`, or
`design_private/`. The entire product specification is
`agents/tasks/hadal/request.md` (2512 lines, 75 sections). All game code
will be created by the implementer per request §29.

## Key Facts

- `project.md` line 3 carries the identity: `project_id: hadal`, which
  selects `agents/projects/hadal/` as the knowledge folder.
- Root docs `AGENTS.md`, `CLAUDE.md`, `CODEX.md`, `QWEN.md`,
  `CONTEXT.md` are byte-identical copies (1975 chars each) of the same
  workflow rules. There is no `README.md` at root yet (request §69
  requires one at completion).
- `.mcp.json` configures only the codegraph MCP server (stdio,
  `codegraph serve --mcp`). `.pi/search.json` configures web-search
  backends (duckduckgo, marginalia) — unrelated to the game.
- `.gitignore` ignores `.codegraph/` and `agents/tasks/*/state.md`
  only; `design_private/` (request §12) is not ignored yet.
- The codegraph index exists (`.codegraph/`) but has no product
  symbols: explore queries return "No relevant code found".

## Navigation

Useful `request.md` section line numbers (verified at 207a690):

- §12 private creative pass — line 591
- §17 chunk model (`WorldChunkDef`) — line 857
- §19 creature AI (`CreatureDef`, states) — line 921
- §28 technology stack — line 1215
- §29 suggested repository layout — line 1239
- §30 main loop (fixed 1/60 s) — line 1319
- §32 `validateWorld()` / `simulateCriticalPath()` — line 1369
- §42 `SaveGameV1` save schema — line 1623
- §44 implementation phases 1–9 — line 1673
- §45 MVP acceptance criteria — line 1782
- §70 testing checklist — line 2352
- §73 things explicitly NOT to build — line 2449

## Gotchas

- The `understanding_grounded` gate rejects `Code Located` bullets that
  cite files absent from the repository (attempts 1 and 2 were reverted
  for citing target paths such as `src/game/Game.ts`). In this
  greenfield repo, cite files that actually exist — `request.md`
  sections, `project.md`, `.mcp.json`, `AGENTS.md` — and describe
  target paths in prose instead.
- `state.md` is gitignored; never stage or commit it.
- Spoiler containment (request §0, §68): do not quote hidden content
  (creature names, lore truth, MacGuffin nature, ending variants) into
  artifacts, commit summaries, screenshots, or progress reports.

## Commands

- `git ls-files` — confirm greenfield (39 tracked files, all
  scaffolding/docs).
- codegraph explore with `projectPath: C:\Temp\hadal` — returns no
  product symbols until code exists.
