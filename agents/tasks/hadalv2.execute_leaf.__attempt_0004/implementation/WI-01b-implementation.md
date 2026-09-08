# WI-01b — Creature roster generation and selection (implementation result)

Role: item-implementer · Task: hadalv2.execute_leaf.__attempt_0004 · Date: 2026-09-07

## Result

**Done.** `design_private/creature_candidates.md` now holds the full private
roster pass: 32 scored rough concepts, a selected roster of 22 organisms,
per-organism section 11.3 rubric answers with a named §13 renderer each, the
section 11.1 distribution and all minimums, both gates (diversity, anti-cliche),
the four section 46 quality-bar questions applied per major species, and 15
section 47 principles covered (requirement: ≥8).

## Acceptance evidence

| Criterion | Evidence | Status |
|---|---|---|
| AC-cp-roster: 30+ scored concepts, 18-24 selected, each major organism carries private written answers to the 10-question §11.3 rubric | `design_private/creature_candidates.md`: Part 1 lists 32 concepts, each with `scores [a,b,c,d,e,f]` on the six required axes (silhouette novelty, ecological plausibility, gameplay distinction, ease of procedural animation, surprise potential, cliché-freedom); Part 2 selects 22; Part 3 holds 22 rubric blocks each answering all 10 §11.3 questions and naming the intended §13 renderer (ShapeGeometry / spine renderer / rigid mesh hierarchy / found-object attachment). Verified by the probe (concepts=32, selected=22, blocks=22, bad=0). | passed |
| AC-cp-spoiler: design_private/ out of the public surface; no artifact/commit/report names the hidden content | `design_private/` is gitignored (verified via `git check-ignore -v` in the prior session). The probe scans every committed file in the repo (excluding `design_private/`) against the private token manifest and reports leaks=0. This report, the scratch probe, the project note, and the commit message contain no hidden proper nouns and no selected-organism names — the commit message is exactly `creative pass: roster (private)`. | passed |

Deliverable checks (work item "Deliverables (checkable)"):

- 32 concepts ≥ 30, each scored 1-5 on all six axes — probe: `unscored=0`.
- Selected roster = 22, within 18-24 — probe: `selected=22`.
- §11.1 distribution: 6 ambient, 6 useful/neutral, 5 predators/territorial,
  3 huge set pieces, 2 colossal presences (both colossal entries are not simply
  hostile), matching the 5-7/4-6/4-6/2-4/2-3 bands.
- All 13 §11.1 minimums covered and named (two helpful, dangerous-looking-but-
  safe, harmless-with-second-behavior, non-chase predator, wreck-repurposer,
  living landmark, never-fully-seen, presence-through-fauna, exploitable
  relationship, scale-misread, beautiful-not-threatening, architecture-bound
  life cycle, ≥1 uncategorizable) — probe: 13/13 PASS.
- Diversity gate recorded: 0 of 22 can be summarized as a swimming mouth that
  attacks the player (0% < 25%).
- Anti-cliche gate: neon-blue-everywhere ban and size-scaled-normal-fish ban
  explicitly addressed; the banned clichés were generated as scored candidates
  and rejected on the record so the gate is demonstrably applied.
- §47 coverage: 15 principles (≥8 required), each mapped to organisms.
- §46 quality bar: shark-replacement, "just big", friendly-species, and
  evidence-before-explanation questions applied per major species in Part 4.

## Verification (test-first)

Red (before the design file existed):

```powershell
node agents/tasks/hadalv2.execute_leaf.__attempt_0004/scratch/implementer/verify-wi01b/verify.mjs
# [FAIL] creature_candidates.md exists
# === 1 CHECK(S) FAILED ===  (EXIT=1)
```

Green (after the file was written):

```powershell
node agents/tasks/hadalv2.execute_leaf.__attempt_0004/scratch/implementer/verify-wi01b/verify.mjs
# [PASS] ... all structural checks ...
# [PASS] whole tree is spoiler-free outside design_private/ — leaks=0
# === ALL CHECKS PASSED ===  (EXIT=0)
```

One mid-run probe fix: the "harmless-with-a-second-behavior" check regex was
stricter than the work item's wording; the roster file was reworded to state
the minimum explicitly ("appears harmless, then a second behavior"), and the
selected-count probe was tightened to count only concept lines (the legend line
mentions the marker word). Both changes make the probe match the work-item
contract more closely; neither weakened a check.

## Live verification

Not applicable — no executable code in this work item ("No code"). The
observable artifact is the private design document, verified by the structural
probe above.

## Files touched

- `design_private/creature_candidates.md` (new, gitignored — the deliverable)
- `agents/tasks/hadalv2.execute_leaf.__attempt_0004/scratch/implementer/verify-wi01b/verify.mjs` (new probe)
- `agents/tasks/hadalv2.execute_leaf.__attempt_0004/scratch/implementer/verify-wi01b/AGENTS.md` (new index)
- `agents/tasks/hadalv2.execute_leaf.__attempt_0004/implementation/AGENTS.md` (new index)
- this file (new)
- `agents/projects/hadal/notes/20260907-implementer-wi01b-creature-roster.md` (new note)

Product source: untouched. No product tests added (none exist for a
documentation deliverable).

## Assumptions

- The "10-question section 11.3 rubric" is the §11.3 concept rubric (the only
  10-question list in the request). Recorded so the ST-03 implementer knows the
  answers to code from.
- "Major organism" = every selected organism (22), giving ST-03 a rubric for
  the whole roster rather than only the set pieces.
- The §11.1 minimum "one harmless with a second behavior" is assigned to the
  buried ambush organism: its first read (inert rock) is harmless; the second
  behavior (expanding capture net) is the surprise.
- Roster size 22 was chosen inside 18-24 to keep every distribution band
  within its suggested range while still covering all 13 minimums with some
  organisms doubling for two minimums.
- The private token manifest (`design_private/_spoiler_tokens.txt`, created by
  the WI-01a implementer) is the authority for the spoiler scan; the probe
  reads it and contains no token literals itself, so the committed probe is
  also spoiler-safe by construction.

## Deviations / blockers

None. No assumption ledger row in plan.md was falsified; no divergence
tripwire fired (documentation-only pass extending the existing
`design_private/` seam from WI-01a, no parallel structures created).

## Shrink/Flatten report

- The first draft of the probe counted "· SELECTED" over the whole file, which
  would have miscounted if the legend wording ever changed; tightened to count
  only concept lines. No other abstractions, wrappers, or files existed to
  remove — the deliverable is one document plus one small probe, the minimum
  shape for this work item.

## Notes for reviewer

- Reviewer checks counts, structure, and spoiler safety only (per the work
  item handoff). The probe is the fastest way: run the command in the scratch
  AGENTS.md; exit 0 = all structural and spoiler checks pass.
- `design_private/` content is deliberately absent from this report and from
  the commit; the reviewer's spoiler check should confirm the same from git
  (`git show --stat` on the creative commit must not list `design_private/`).
- The rejected-cliché candidates are kept in Part 1 (scored, marked REJ) on
  purpose: they evidence that the §11.2 anti-cliche gate was applied, not
  asserted.
