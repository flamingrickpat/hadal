# Project Knowledge

<!-- include: ../conventions/knowledge-capture.md -->

The repository-root `PROJECT.md` names the project with a stable `project_id`.
The matching folder is:

```text
agents/projects/<project_id>/
  AGENTS.md
  PROJECT.md
  ARCHITECTURE.md
  BUILD.md
  TEST.md
  notes/
```

Every repository-aware role reads these files before source work and searches
`notes/` for relevant symbols and concepts.

Every repository-aware role creates a short new note when it learns reusable
facts that would otherwise require future source parsing. Existing notes are
not rewritten by another role.

Project documentation contains high-level product, architecture, execution,
test, and infrastructure knowledge. Task progress belongs in task artifacts,
not project notes.
