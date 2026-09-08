# Review: WI-01c — Reveal mapping, MacGuffin, endings, final spoiler audit

Status: pass

Reviewer session: `work_item_reviewer`, child task
`hadalv2.execute_leaf.__attempt_0007`. Reviewed the commit the controller
attributes to this work item: `a98ea85` "creative pass: reveal map and
spoiler audit (private)". Scope per the work item handoff: mapping
completeness against request sections 3, 11.4, 23, 24, 37 and spoiler safety
(AC-cp-spoiler) over the whole creative pass. No product code was changed.

Codegraph note: this work item is private-design documentation and changed no
product symbol, so the codegraph structural-lookup gate does not apply and no
`codegraph_impact`/`codegraph_callers` analysis was run. The changed file set
was verified from the commit instead; product source is untouched.

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| AC-cp-mapping — `design_private/` assigns creature reveals and lore clues to the 90-120 minute pacing timeline, defines 3-5 recurring motifs, and fixes the MacGuffin truth and at least two ending variants | passed | Read `design_private/encounter_beats.md` and `design_private/spoiler_map.md` in full; every deliverable item verified against the files (table below). |
| AC-cp-spoiler — `design_private/` stays out of the public surface, and no plan artifact, commit message, screenshot, or progress report names deep creatures, the lore truth, the MacGuffin, or the endings | passed | `.gitignore` line 14 lists `design_private/`; `git ls-files design_private/` empty; `git check-ignore -v` confirms both deliverables ignored. Independent full-corpus audit (see Independent Adversarial Probes) found zero real leaks in the tracked tree, in all 62+ commit messages, and in this WI's five new public artifacts. |

## Deliverable checks (work item "Deliverables (checkable)")

| Deliverable | Verdict | Evidence |
|---|---|---|
| Every roster reveal and lore clue on the 90-120 min timeline with 3-6 min beats (§3) | passed | `encounter_beats.md` B01 0-6 … B22 115-120; 22 beats, contiguous numbering, all 3-6 min; timeline spans 120 min. All 22 selected roster T-IDs (T-01,02,03,05,06,08,09,10,11,13,14,15,16,17,18,19,20,22,23,25,27,31) mapped to beats; T-04 correctly marked "not selected". |
| Best ideas not all in the first half | passed | 4 major reveals R1-R4 all land at/after ~66 min; final-reveal cluster at 90-120 min. |
| Five spectacle beats get slots with staging intent (§11.4 grammar) | passed | `[S1..S5 spectacle]` tags at 15-20, 25-31, 66-72, 90-95, 95-100 min; each carries a staging-intent line rather than a checklist. |
| 3-5 recurring motifs (§37) with contexts; ≥2 connected by final reveal, not all explained | passed | 4 motifs M-1..M-4, each with a `contexts:` list of beat references; the final reveal connects M-1+M-3 while M-4 stays deliberately unexplained. |
| MacGuffin decision meeting §23 | passed | Germination core: visually memorable in simple rendering; 3 earlier environmental traces (≥2 required); retrieval changes the environment **and** the return journey; forces one final (spatial) decision; makes the final 5-10 minutes mechanically different; explicitly not a glowing-orb fade to credits. |
| ≥2 ending variants meeting §24, each modest-scope | passed | E-1 (take) / E-2 (leave): each is a decision plus a different final state, text, and shot; both tagged modest-scope; E-2 tagged as the §72 cut candidate per the WI assumption. |
| `spoiler_map.md`: every secret fact, the artifacts containing it, public-surface ban list | passed | Secret-fact table (lore truth, MacGuffin, endings, T-ID codename scheme), per-fact artifact list, and the 62-token ban list with the classification rules for pre-existing artifacts. |
| Final spoiler audit over the whole creative pass (WI-01c as final proof owner) | passed | Implementer probe `scratch/implementer/verify-wi01c/verify.mjs` (40 checks) re-run by the reviewer: ALL PASSED, exit 0. Reviewer also ran an independent, broader audit (below) covering the gaps in the implementer's scan (all T-IDs in the tracked tree, all commit subjects **and bodies**). |
| Commit message bare | passed | `a98ea85` subject is exactly `creative pass: reveal map and spoiler audit (private)` — no creature, lore, MacGuffin, or ending tokens; commit touches only the 5 expected `agents/` files. |
| No roster/world changes (WI-01a/WI-01b outputs respected) | passed | Commit file list contains no changes to WI-01a/WI-01b artifacts; `encounter_beats.md` uses the existing T-ID roster as-is. |

## Findings

None that block the work item. Three non-blocking observations, all
pre-existing or classified false-positives:

1. **(low, non-blocking, pre-existing) Codename references in two approved
   WI-01b artifacts.** `agents/projects/hadal/notes/
   20260907-implementer-wi01b-creature-roster.md` (L51-53) and `agents/tasks/
   hadalv2.execute_leaf.__attempt_0004/reviews/WI-01b-review.md` (L33) contain
   T-<NN> codenames (selected list, rejection examples T-26/T-29/T-30). These
   were approved and committed by earlier work items, are explicitly
   classified "allowed" in `spoiler_map.md` (codename-level, append-only
   history), and were not introduced by this work item. No action required
   under WI-01c's constraint not to rewrite prior outputs.
2. **(informational) Substring collision in a vendored file.** 7
   case-sensitive hits for the #48 forbidden token in `agents/templates/
   mermaid.min.js` (minified vendor bundle, e.g. `arrowTypeEnd`). Pure
   identifier substring, no narrative content; flagged so future audits know
   it is a standing false positive.
3. **(informational) "dormancy" without "protocol".** `agents/tasks/
   hadalv2.execute_leaf.__attempt_0007/implementation/WI-01c-implementation.md`
   L41 says "(dormancy effects)". The ban-list token is the full phrase, not
   the standalone word, and the sentence is engineering context, not lore
   content — not a leak.

## Impact Check

Commit `a98ea85` (verified with `git show --stat`): touches exactly 5 files,
all under `agents/` — `agents/projects/hadal/notes/
20260909-implementer-wi01c-reveal-mapping.md`, `agents/tasks/
hadalv2.execute_leaf.__attempt_0007/implementation/AGENTS.md`, `implementation/
WI-01c-implementation.md`, `scratch/implementer/verify-wi01c/AGENTS.md`,
`scratch/implementer/verify-wi01c/verify.mjs`. No `src/` or product path, no
`design_private/` path (gitignored; `git ls-files design_private/` returns
nothing), and no `state.md`. `design_private/encounter_beats.md` and
`spoiler_map.md` exist in the working tree and are the deliverables; their
absence from the commit is correct per the gitignore design.

## Independent Adversarial Probes

All probes are read-only; none reused the implementer's `verify.mjs` logic.
Scratch committed at `agents/tasks/hadalv2.execute_leaf.__attempt_0007/scratch/
reviewer/audit-wi01c/` (`audit.mjs`, `classify.mjs`, `classify-output.txt`,
`AGENTS.md`). Run from repo root: `node <path>/audit.mjs` and
`node <path>/classify.mjs`; both exit 0.

The point of these probes was to distinguish "the implementer's scan was
correct" from "the implementer's scan was complete". The implementer's probe
scanned the tracked public tree for the non-T-ID tokens and commit **subjects**
only. My audit deliberately widened the corpus:

- **Full token scan, tracked public tree, all 62 tokens including the 32
  T-IDs** (case-sensitive). Result: 8 real T-ID hits, all in the two pre-
  existing WI-01b artifacts (see Finding 1); 7 forbidden-token hits, all the
  `mermaid.min.js` substring collision (Finding 2). Zero real leaks.
- **All commit messages, subject and body, `git log --all`**, all 62 tokens
  (word-boundary check for T-IDs to exclude ST-NN/WI-NN substrings). Result:
  0 real T-ID hits, 0 forbidden-token hits. (The implementer had only scanned
  `creative pass:` subjects; this covers every commit on every branch.)
- **This WI's five newly committed public artifacts**, all 62 tokens.
  Result: 0 hits — the strictest tier passes cleanly.
- **Screenshot inventory**: 38 images in the working tree; all under
  `agents/tasks/hadal/scratch/` from earlier WI-01..WI-07 work, none produced
  by this work item, and none of this WI's artifacts embeds image content.
- **Case-insensitive spot-check** (cradle/germination/dormancy/meridian/
  attendant/governor) over the tracked tree: 1 hit — the "dormancy effects"
  engineering mention (Finding 3).
- **Mapping cross-check** (structural, not implementer-tested): every
  `B<NN>` reference in `spoiler_map.md` and every motif `contexts:` entry
  resolves to a defined beat; the 22-beat timeline is gap-free from 0 to 120
  with every beat 3-6 min. This could falsify a "map looks complete but
  references dangle" failure — none found.

## What I Could Not Verify

- **Screenshot content**: the 38 earlier images were inventoried by path only;
  I did not visually inspect them. They predate this work item and belong to
  earlier approved WIs, so this does not affect WI-01c's criterion, but the
  audit evidence for screenshots is path-based, not content-based.
- **Design-quality judgment**: whether the reveal pacing is *good* (not just
  structurally complete and front-light) is a creative judgment outside this
  review's checkable scope; all structural requirements of the work item
  deliverables are verified.

## Assumptions

- The T-ID references in the two pre-existing WI-01b artifacts are treated as
  in-scope-for-the-ban-list but out-of-scope-for-this-work-item, based on
  `spoiler_map.md`'s explicit "allowed, pre-existing, append-only"
  classification and the WI-01c constraint not to rewrite WI-01b's output.
  For this reading to be wrong, the recorded spoiler scope would have to
  forbid codename-level references even in already-approved history — the
  token manifest and spoiler map both say it does not.
- `git log --all` commit-message coverage (all branches) is a superset of
  "the commit messages of this story"; using the superset makes the pass
  strictly stronger, so no story-scope assumption was needed there.
