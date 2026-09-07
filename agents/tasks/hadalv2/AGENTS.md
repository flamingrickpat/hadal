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
  stories (ST-01, ST-02, ST-03, ST-04, ST-05, ST-06). ST-07 and ST-08 are
  unexpanded expansion tasks.
- `stories/ST-04/` — expanded after review split: `plan.md` (story node,
  id ST-04) plus `workitems/WI-04a.md` (spectacle beats),
  `workitems/WI-04b.md` (four-channel story payload),
  `workitems/WI-04c.md` (flag-gated world reactions) and
  `workitems/WI-04d.md` (environmental puzzles).
- `stories/ST-05/` — expanded after review split: `plan.md` (story node,
  id ST-05) plus `workitems/WI-05a.md` (MacGuffin content and retrieval)
  and `workitems/WI-05b.md` (final descent sequence and win condition).
- `stories/ST-06/` — expanded after review split: `plan.md` (story node,
  id ST-06) plus `workitems/WI-06a.md` (surface + coast band art pass),
  `workitems/WI-06b.md` (mid bands art pass), `workitems/WI-06c.md`
  (deep bands + final zone art pass), `workitems/WI-06d.md`
  (debug-geometry replacement, section 48 juice, section 16 camera feel),
  `workitems/WI-06e.md` (depth audio pass), `workitems/WI-06f.md`
  (section 26 bathymetry map overlay) and `workitems/WI-06g.md`
  (section 43 accessibility controls).
- `stories/ST-WI-05c/` — WI-05c promoted from ST-05's work items to a story
  after review split: `plan.md` (story node, id WI-05c) plus
  `workitems/WI-05ca.md` (ending variants and full ending verification),
  `workitems/WI-05cb.md` (save-schema extension and endgame autosave
  milestones).
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
