# WI-01c — Reveal mapping, MacGuffin, endings, final spoiler audit (implementation result)

Role: item-implementer · Task: hadalv2.execute_leaf.__attempt_0007 · Date: 2026-09-09

## Result

**Done.** `design_private/encounter_beats.md` now holds the closed creative
pass: a 22-beat, 90-120 minute pacing grid (all beats 3-6 minutes, contiguous
numbering), the full selected roster mapped onto the grid, five spectacle
slots placed with staging intent, four recurring motifs with their contexts,
the MacGuffin decision meeting section 23, two ending variants meeting
section 24, and the four major late reveals each with its earlier traces
(section 51). `design_private/spoiler_map.md` is the containment ledger: ten
secret facts with their carrying artifacts, the public-surface ban list, and
the final audit record. The final spoiler audit (this work item is the final
proof owner for AC-cp-spoiler) passed.

## Acceptance evidence

| Criterion | Evidence | Status |
|---|---|---|
| AC-cp-mapping: design_private/ assigns creature reveals and lore clues to the 90-120 minute pacing timeline, defines 3-5 recurring motifs, and fixes the MacGuffin truth and at least two ending variants | `design_private/encounter_beats.md`: 22-beat grid (B01 0-6 min … B22 115-120 min, every beat 3-6 min); reveal-assignment table covering every one of the 22 selected roster codenames with beat + reveal type + staging intent; four motifs (M-1..M-4) each listing contexts, the final reveal connects two of them and leaves the others partly unexplained; MacGuffin section fixing the true nature against all six section 23 requirements; two ending variants in a table, each tagged modest-scope, one tagged as the section 72 cut candidate. Probe: all structural checks PASS. | passed |
| AC-cp-spoiler: design_private/ stays out of the public surface, and no plan artifact, commit message, screenshot, or progress report names the hidden content | Final audit (machine-run by the verify probe): `git check-ignore` confirms `design_private/` is ignored and `git ls-files design_private/` is empty; every `creative pass:` commit subject of the story scanned case-sensitively against the 30-forbidden-token manifest — clean; whole public tree scanned outside `design_private/` (minified vendor bundles skipped with the classification recorded in the audit section of `spoiler_map.md`) — leaks=0; this note, the probe, the indexes, and the project note scanned against ALL tokens including the 32 roster codenames (strictest tier) — leaks=0. No screenshots exist in this task. This commit's message is exactly the mandated bare subject. | passed |

Deliverable checks (work item "Deliverables (checkable)"):

- Pacing grid: 22 beats, all 3-6 minutes, contiguous numbering — probe
  `beats=22`, `bad=0`.
- Best ideas not all in the first half: the probe's late-half check finds 6
  selected-roster codenames revealed at minute 60 or later (requirement >= 3);
  the five spectacle slots sit at 15-20, 25-31, 66-72, 90-95, 95-100, and the
  file records that the two largest-scale presences land in the second half.
- Spectacle slots: exactly five tagged `[S1..S5 spectacle]` — probe
  `spectacles=5`; each carries a one-line staging intent in §11.4 grammar.
- Motifs: 4 (requirement 3-5), each with a `contexts:` list; the final reveal
  connects the fixed-point motif and the aligned-debris motif (and touches the
  material-drift motif) while leaving the lights motif deliberately
  unexplained — probe PASS.
- MacGuffin (section 23): visually memorable in simple rendering (stated);
  3 earlier environmental traces named against beats (requirement >= 2);
  retrieval changes the environment and the return journey (dormancy effects);
  forces one final decision (spatial, between two physical exits); final
  5-10 minutes mechanically different (compass-less, dark, silent ascent).
  Probe: all six MacGuffin checks PASS.
- Endings (section 24): two variants, decision + different final state/text/
  shot each, both tagged modest-scope, one tagged as the section 72 cut
  candidate; the probe explicitly rejects a glowing-orb fade-to-credits
  ending — PASS.
- Spoiler map: 10 secret facts (probe minimum 6), each with carrying artifact
  paths; ban list covers all four banned categories; final audit section
  covers gitignore state, commit messages, and the every-file-in-private-dir
  review.
- Lore clues: 4 major late reveals, 12 trace lines, every beat reference
  resolves to a real grid beat — probe `traces=12 unknown=`.

## Verification (test-first)

Red (before the two design files existed):

```powershell
node agents/tasks/hadalv2.execute_leaf.__attempt_0007/scratch/implementer/verify-wi01c/verify.mjs
# [FAIL] encounter_beats.md exists
# [FAIL] spoiler_map.md exists
# (+ 4 owned-artifact existence fails)
# === 6 CHECK(S) FAILED ===  (EXIT=1)
```

Green (after both files were written and the probe's four regex bugs were
fixed):

```powershell
node agents/tasks/hadalv2.execute_leaf.__attempt_0007/scratch/implementer/verify-wi01c/verify.mjs
# [PASS] ... all 40 structural + audit checks ...
# === ALL CHECKS PASSED ===  (EXIT=0)
```

Probe fixes made after the red run (all tighten/repair the probe to match the
work-item contract; none weakened a check):

- roster regex gained the `m` flag (`^` did not match line starts);
- the MacGuffin trace regex allows indentation;
- beat references inside lore-clue trace lines match bare `B<NN>` tokens, not
  only the "beat B<NN>" phrasing;
- the minute range in the beat regex allows 3-digit minutes (the run is
  120 min, so beats at 100-120 had 3-digit endpoints);
- the ending-variant check reads the full table row (the old match captured
  only the row prefix, so the modest-scope tag was never seen).

## Live verification

Not applicable — no executable code in this work item ("No code"). The
observable artifact is the private design document, verified by the structural
probe above, plus the machine-run final spoiler audit the probe closes with.

## Files touched

- `design_private/encounter_beats.md` (new, gitignored — the deliverable)
- `design_private/spoiler_map.md` (new, gitignored — the deliverable)
- `design_private/_spoiler_tokens.txt` (appended: 30 new forbidden tokens,
  gitignored; the pre-existing 7 tokens are unchanged)
- `agents/tasks/hadalv2.execute_leaf.__attempt_0007/scratch/implementer/verify-wi01c/verify.mjs` (new probe)
- `agents/tasks/hadalv2.execute_leaf.__attempt_0007/scratch/implementer/verify-wi01c/AGENTS.md` (new index)
- `agents/tasks/hadalv2.execute_leaf.__attempt_0007/implementation/AGENTS.md` (new index)
- this file (new)
- `agents/projects/hadal/notes/20260909-implementer-wi01c-reveal-mapping.md` (new note)

Product source: untouched. No product tests added (none exist for a
documentation deliverable).

## Assumptions

- "3-5 recurring motifs" → 4 chosen: two are tightly connected by the final
  reveal (required minimum of two), a third is partly connected, and one is
  deliberately left unexplained to keep doing quiet work at the ending.
- "At least two earlier environmental traces" for the MacGuffin → 3 recorded,
  each planted in a named early beat, so the requirement has margin.
- Beat count 22 (a 5-10 minute stretch at the top would have compressed the
  first two loops; 22 beats of 3-6 min covers 120 min exactly at average 5.5).
- The spatial decision (two physical exits, the second opening only with the
  MacGuffin in hand) is how "forces one final decision" and "mechanically
  different final minutes" are both satisfied without a dialogue tree — the
  request's section 24 explicitly allows a decision plus a different final
  state, text, or shot.
- E-2 (leave the MacGuffin) is tagged as the section 72 cut candidate per the
  work item's stated assumption; both variants remain planned and both are
  modest-scope.
- Nothing in the selected roster failed to map onto the grid; no defects to
  record for the reviewer. The roster and world were not changed here.

## Notes for reviewer

- The two private deliverables are the only files that may contain hidden
  content; everything else in this commit is category-level language. The
  probe's strictest tier checks that this note, the probe itself, both
  AGENTS.md indexes, and the project note contain none of the 62 tokens
  (30 forbidden + 32 roster codenames).
- The whole-tree scan skips `*.min.*` vendor bundles; the classification
  (one-word namespace collisions in third-party minified code are not spoiler
  leaks) is recorded in the audit section of `spoiler_map.md`.
- Pre-existing public codename mentions in the approved WI-01b note/review are
  intentionally not rewritten (append-only rule); they are classified as
  allowed in the ban-list section.

## Shrink/Flatten

No code was written, so there are no abstractions to remove. The probe is a
single 240-line script with no helper files; during the pass I removed the
only duplication I introduced (the two ending-variant match lines became one
row-filter) and kept the audit in one place (the probe) rather than
duplicating it in the note. Nothing else was removable.

## Knowledge notes

- Consulted: `agents/projects/hadal/notes/20260908-implementer-wi01a-spoiler-
  boundary.md` (token manifest and gitignore convention),
  `20260907-implementer-wi01b-creature-roster.md` (roster file shape,
  token manifest convention, bare creative-pass commit precedent).
- Written: `agents/projects/hadal/notes/20260909-implementer-wi01c-reveal-
  mapping.md` (encounter_beats file shape, spoiler_map file shape, probe
  location, gotchas).

## Result line

WI-01c implemented: reveal/motif/MacGuffin/ending mapping closed in
`design_private/`, final spoiler audit passed, probe green, one bare commit.
