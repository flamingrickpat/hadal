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
  stories (ST-01, ST-02, ST-03, ST-04, ST-05, ST-06, ST-07, ST-08).
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
  `workitems/WI-06f.md` (section 26 bathymetry map overlay) and
  `workitems/WI-06g.md` (section 43 accessibility controls).
- `stories/ST-07/` — expanded after review split: `plan.md` (story node,
  id ST-07) plus `workitems/WI-07a.md` (section 71 balance telemetry and
  headless export), `workitems/WI-07b.md` (section 32 reachability validator
  and section 40 scarcity), `workitems/WI-07c.md` (numerical tuning toward
  the 90-120 / 55-75 target) and `workitems/WI-07d.md` (60 FPS verification
  and fix-forward).
- `stories/ST-08/` — expanded after review split: `plan.md` (story node,
  id ST-08) plus `workitems/WI-08a.md` (section 70 fresh-save end-to-end
  verification and final coverage checklist), `workitems/WI-08b.md` (spoiler
  audit, final gate) and `workitems/WI-08c.md` (section 69 README finish and
  section 68 handoff message).
- `stories/ST-WI-05c/` — WI-05c promoted from ST-05's work items to a story
  after review split: `plan.md` (story node, id WI-05c) plus
  `workitems/WI-05ca.md` (ending variants and full ending verification),
  `workitems/WI-05cb.md` (save-schema extension and endgame autosave
  milestones).
- `stories/ST-WI-06d/` — WI-06d promoted from ST-06's work items to a story
  after review split: `plan.md` (story node, id WI-06d) plus
  `workitems/WI-06d-a.md` (debug geometry replacement); WI-06d-b
  further promoted to `stories/ST-WI-06d-b/` and WI-06d-c further
  promoted to `stories/ST-WI-06d-c/`.
- `stories/ST-WI-06d-b/` — WI-06d-b promoted from ST-WI-06d's work items to a
  story after review split: `plan.md` (story node, id WI-06d-b; section 48
  juice effects and cross-band contrast walk) plus
  `workitems/WI-06d-b1.md` (bubbles and silt juice particles),
  `workitems/WI-06d-b2.md` (light sway), `workitems/WI-06d-b3.md`
  (depth-record tick HUD cue), `workitems/WI-06d-b4.md` (distant-motion
  impulse and shake-gate flag), `workitems/WI-06d-b5.md` (parting
  schools) and `workitems/WI-06d-b6.md` (cross-band contrast walk and
  final juice proof).
- `stories/ST-WI-06d-c/` — WI-06d-c promoted from ST-WI-06d's work items to a
  story after review split: `plan.md` (story node, id WI-06d-c; section 16
  shake rules and widescreen behavior) plus
  `workitems/WI-06d-c-a.md` (low-frequency shake rules: single flag-gated
  path, amplitude budget, presentation flag for WI-06g) and
  `workitems/WI-06d-c-b.md` (widescreen composition, no letterboxed dead
  zones).
- `stories/ST-WI-06e/` — WI-06e promoted from ST-06's work items to a story
  after review split: `plan.md` (story node, id WI-06e) plus
  `workitems/WI-06e-a.md` (depth-based mixing),
  `workitems/WI-06e-b.md` (creature sound profiles and pre-visibility
  cues), `workitems/WI-06e-c.md` (sparse music and final AC-art-sound
  proof).
- `stories/ST-WI-03b/` — WI-03b promoted from ST-03's work items to a story
  after review split: `plan.md` (story node, id WI-03b) plus
  `workitems/WI-03b1.md`, `workitems/WI-03b2.md`.
- `stories/ST-WI-03c/` — WI-03c promoted from ST-03's work items to a story
  after review split: `plan.md` (story node, id WI-03c) plus
  `workitems/WI-03c2.md`; WI-03c1 further promoted to
  `stories/ST-WI-03c1/`.
- `stories/ST-WI-03c1/` — WI-03c1 promoted from ST-WI-03c's work items to a
  story after review split: `plan.md` (story node, id WI-03c1) plus
  `workitems/WI-03c1a.md` (tier-3 CreatureDefs + section 10 damage model) and
  `workitems/WI-03c1b.md` (per-predator controllers incl. non-chase + final
  AC-roster-behavior proof).
- `stories/ST-WI-03d/` — WI-03d promoted from ST-03's work items to a story
  after review split: `plan.md` (story node, id WI-03d) plus
  `workitems/WI-03d1.md`, `workitems/WI-03d2.md`, `workitems/WI-03d3.md`.
- `planning/` — reality-check result (`reality.json`) and, later,
  per-node review receipts (`reviews/ID.json`) from the planning roles.
- other files and folders here are role artifacts. Each role adds
  its own and indexes any directory it creates.
