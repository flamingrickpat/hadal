# This Repository Is Prepared For Controlled Workflow Runs

Automated work here is driven by a workflow contract that lives outside this
repository, in a central instruction base. Each step of a run dispatches one
role in a fresh session with one complete skill file, and a controller checks
the result against this repository before anything advances.

That means two things for a session started by hand in this directory:

- **You are not in a workflow run.** No role was selected for you, no checks
  will run on your output, and the task folders under `agents/tasks/` belong to
  runs that are being audited. Do not write into a task folder unless the user
  asks you to.
- **The project's own facts outrank your assumptions.** Read
  `PROJECT.md` in this directory for the `project_id`, then
  `agents/projects/<project_id>/` for `PROJECT.md`, `ARCHITECTURE.md`,
  `BUILD.md`, and `TEST.md`. Search `notes/` there before parsing source.

## Finding Code

This repository is indexed by codegraph, configured in `.mcp.json` and exposed
as MCP tools. For any structural question — where is X defined, who calls Y,
what breaks if I change Z — use codegraph rather than scanning the tree. Use
grep and find for literal text, or to read a file you have already located.

## What Lives Where

- `agents/projects/<project_id>/` — this project's identity, architecture, build
  and test facts, plus accumulated notes. Roles read and extend these.
- `agents/tasks/<task-id>/` — one folder per task: the request, the plan, work
  items, evidence, reviews, and a controller-written `state.md`. Never edit a
  `state.md`.
- `agents/templates/` — assets for generated architecture previews.

Workflows, skills, checks, invariants, and conventions are deliberately **not**
in this repository. A run reaches them read-only from the central base, so the
instructions an agent is judged against cannot be edited by the agent being
judged.
