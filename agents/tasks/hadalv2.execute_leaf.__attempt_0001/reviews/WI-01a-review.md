# Review: WI-01a

Status: pass

Work item: `agents/tasks/hadalv2.execute_leaf.__attempt_0001/workitems/WI-01a.md`
Reviewed commit: `986faeb` — "creative pass: world selection (private)"
Reviewer scope (per handoff): structure and spoiler safety only. This is a
documentation-only work item; no product code changed, so there is no
executable product behavior to run and no live integration to reach.

## What "done" meant before looking at the diff

- Three substantially different hidden-world interpretations that differ on
  the five section-12-A axes (what the deep actually is; why the installation
  failed; what the MacGuffin really is; how ecology ties to old
  infrastructure; the ending's emotional tone).
- A written step-B critique per candidate on the six section-12-B axes
  (genre clichés, exposition burden, whether the explanation erodes mystery,
  support for visually weird creatures, deliverability in two hours, whether
  the final reveal reinterprets earlier content).
- The weakest candidate explicitly named as rejected.
- The selected candidate plus exactly one mechanism stolen from a non-selected
  candidate — a transplant, not an average.
- A private lore truth: central event; official-record vs observed-reality
  contradictions (section 22); 2-4 earlier traces for each major late reveal
  (section 51); and a deliberately unanswered largest-scale implication
  (section 22 lore rule, falsified if a final exposition dump is required).
- Tone per section 57 (restrained, bureaucratic, increasingly uneasy); no
  creatures drafted (that is a later work item); commit message exactly
  "creative pass: world selection (private)".
- Spoiler boundary: `design_private/` gitignored; no public artifact, commit
  message, or progress report names the deep creatures, the lore truth, the
  MacGuffin, or the endings.

I compared the literal request sections 12 (A-C), 22, 51, 57, and 74 against
the work-item paraphrase before reading the produced files, to catch any
narrowing or substitution. No substitution found: the files address the real
section text, not just the work-item restatement.

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| AC-cp-world | passed | `design_private/world_candidates.md` holds three interpretations each stating all five section-12-A differentiation axes and a six-axis step-B critique; a rejection block names the weakest (Candidate C) and states nothing from it is carried forward. `design_private/final_selected_world.md` names the selected candidate (A), declares "take A whole / steal exactly ONE", and carries exactly one "Source candidate:" line naming the non-selected runner-up (B). `design_private/lore_truth.md` has a central event, a 4-row official-vs-observed contradiction table, and four reveals each planting 3 traces (within the 2-4 rule), plus an explicit unanswered largest-scale implication. |
| AC-cp-spoiler | passed | `.gitignore` line 14 is `design_private/`; `git check-ignore` confirms all three content files are ignored; the reviewed commit touches no `design_private/` path and no `state.md`. Whole-tree grep (all extensions, excluding `design_private/`, `.git`, `node_modules`, `dist`) reports every hidden proper noun and every candidate genre-frame name as clean outside `design_private/`. The commit message and every committed plan/implementation/project-note artifact stay at category level. No image/screenshot files are committed. |

## Findings

None. Both acceptance criteria are met with real, openable evidence.

## Impact Check

No product symbols changed: the reviewed commit contains 0 product files
(`git show --stat 986faeb` lists only `agents/**` artifacts, one project note,
and one committed verification script). There is therefore no changed symbol
for `codegraph_impact`/`codegraph_callers` to trace — codegraph is not
applicable to this documentation-only work item, and I did not fabricate a
codegraph query. The only cross-cutting effect to check was the spoiler
boundary, which I verified across the whole tree (below).

## Independent Adversarial Probes

The implementer ships a validator
(`scratch/implementer/verify-wi01a/verify.mjs`). I re-ran it
(`node .../verify.mjs` → `EXIT=0`, "ALL CHECKS PASSED") but did not rely on it
alone, because it greps only a hard-coded list of public artifacts. My
independent probes, each chosen to distinguish "the private content is truly
contained" from "the implementer simply picked the right artifact list":

1. Whole-tree token scan. I enumerated every hidden proper noun the private
   files define (from `design_private/_spoiler_tokens.txt`: seven tokens) plus
   the candidate genre-frame names and the stolen-mechanism/ending phrases, and
   searched every text file in the working tree, excluding only `design_private/`,
   `.git`, `node_modules`, and `dist`. All reported clean. The only non-clean
   hit in the whole tree for a shared generic word was the fixed, pre-existing
   "giant crab / warship as a shell" design principle (a generic public word,
   listed in the request and a creature-framework work item) — not any of the
   private proper nouns.
2. Committed-surface scan. `git grep` of the same tokens/frames against tracked
   files reports no hit, so the committed (handable-to-player) surface is clean,
   not just the working tree.
3. Gitignore + commit containment. `git check-ignore -v` on each content file
   resolves to `.gitignore:14:design_private/`; the commit's file list contains
   no `design_private/` path and no `state.md`. This is the mechanism that keeps
   the payload out of diffs a player could receive (section 12 / 68).
4. Structure-vs-paraphrase cross-check. I re-read request sections 12 (A-C), 22
   (lore rule + contradictions), 51 (2-4 traces), 57 (tone; explicit Lovecraft
   pastiche ban), and 74 (quiet return, not constant horror) and confirmed the
   produced files address the real section text: the contradiction table is
   framed as "an institution misunderstanding or hiding, not an unreliable
   narrator" (section 22 verbatim), each of four reveals plants 3 traces drawn
   from section 51's suggested kinds, the rejected weakest candidate is the one
   flagged as closest to the section-57 Lovecraft-pastiche ban, and the selected
   tone ends in a quiet return (section 74 endpoint) rather than sustained horror.

Interpretation note (not a finding): the deliverable says the selected candidate
"steals one mechanism from a rejected candidate," while a separate deliverable
names the weakest candidate (C) as "the rejected weakest" with nothing carried
forward. The design steals the single mechanism from the runner-up (B), which it
frames as a "rejected runner-up" (i.e., a non-selected candidate). I read "a
rejected candidate" (indefinite) as any non-selected candidate, which B
satisfies; the alternative reading (must be C, the explicitly-rejected weakest)
is not what the text says and would contradict the design's own "excellent
mechanism" framing. This is a defensible reading, documented here for the audit
trail.

## What I Could Not Verify

- No executable/live evidence exists for this work item by design (pure
  documentation). The "test" is the structural + spoiler validator, which I ran
  and which I independently re-derived. Nothing user-visible was claimed, so
  there is no live path to run.
- I did not re-read request sections 2 and 37 in depth (the fixed coast band /
  salvage premise and the encounter rules). They are fixed anchors outside the
  deliverable's scope, and the handoff limits this review to structure + spoiler
  safety. Nothing in the produced files contradicts treating them as fixed.
- I confirmed no image files are committed, so there is no screenshot to audit;
  the "no screenshot names hidden content" clause is satisfied vacuously.

## Assumptions

- "Rejected candidate" in the stolen-mechanism deliverable means a non-selected
  candidate (B), distinct from the uniquely "rejected weakest" (C). See the
  interpretation note above.
- The private payload belongs in gitignored `design_private/` (not
  `src/content/secret/`) because the environment exposes commits/diffs; this
  matches the implementer's stated, more-conservative reading and section 12.
