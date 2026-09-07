# Task hadalv2

- `request.md` — the original request, as given.
- `state.md` — written by the controller. Read only; never edit,
  stage, or commit a change to it.
- `understanding.md` — what the task means in this codebase (understander
  artifact): current WI-07 baseline state, the remaining change seam, and
  grounded code citations.
- `plan.md` — root task plan (overview only; no frontmatter, not a
  planning node).
- `stories/ST-01/` … `stories/ST-08/` — one folder per story: `plan.md`
  (story node, YAML frontmatter) plus `workitems/WI-*.md` for the expanded
  stories (ST-01, ST-02, ST-03). ST-04..ST-08 are unexpanded expansion
  tasks.
- `stories/ST-WI-03b/` — WI-03b promoted from ST-03's work items to a story
  after review split: `plan.md` (story node, id WI-03b) plus
  `workitems/WI-03b1.md`, `workitems/WI-03b2.md`.
- `stories/ST-WI-03c/` — WI-03c promoted from ST-03's work items to a story
  after review split: `plan.md` (story node, id WI-03c) plus
  `workitems/WI-03c1.md`, `workitems/WI-03c2.md`.
- `planning/` — reality-check result (`reality.json`) and, later,
  per-node review receipts (`reviews/ID.json`) from the planning roles.
- other files and folders here are role artifacts. Each role adds
  its own and indexes any directory it creates.
