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
  stories (ST-01, ST-02, ST-03, ST-04). ST-05..ST-08 are unexpanded
  expansion tasks.
- `stories/ST-04/` — expanded after review split: `plan.md` (story node,
  id ST-04) plus `workitems/WI-04a.md` (spectacle beats),
  `workitems/WI-04b.md` (four-channel story payload),
  `workitems/WI-04c.md` (flag-gated world reactions) and
  `workitems/WI-04d.md` (environmental puzzles).
- `stories/ST-WI-03b/` — WI-03b promoted from ST-03's work items to a story
  after review split: `plan.md` (story node, id WI-03b) plus
  `workitems/WI-03b1.md`, `workitems/WI-03b2.md`.
- `stories/ST-WI-03c/` — WI-03c promoted from ST-03's work items to a story
  after review split: `plan.md` (story node, id WI-03c) plus
  `workitems/WI-03c1.md`, `workitems/WI-03c2.md`.
- `stories/ST-WI-03d/` — WI-03d promoted from ST-03's work items to a story
  after review split: `plan.md` (story node, id WI-03d) plus
  `workitems/WI-03d1.md`, `workitems/WI-03d2.md`, `workitems/WI-03d3.md`.
- `planning/` — reality-check result (`reality.json`) and, later,
  per-node review receipts (`reviews/ID.json`) from the planning roles.
- other files and folders here are role artifacts. Each role adds
  its own and indexes any directory it creates.
