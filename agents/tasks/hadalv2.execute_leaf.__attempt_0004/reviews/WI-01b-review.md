# Review: WI-01b — Creature roster generation and selection

Status: pass

Reviewer session: `work_item_reviewer`, child task
`hadalv2.execute_leaf.__attempt_0004`. Reviewed the commit that the
controller attributes to this work item: `0bd25d1` "creative pass: roster
(private)". Scope per the work item handoff: **counts, structure, and spoiler
safety only** (no product code was changed).

Codegraph note: this work item is documentation-only and changed no product
symbol, so the codegraph structural-lookup gate does not apply and no
`codegraph_impact`/`codegraph_callers` analysis was run. I instead verified
the changed file set by the commit and confirmed product source is untouched.

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| AC-cp-roster — `design_private/` holds ≥30 scored rough concepts and a 18-24 selected roster, each major organism carrying private written answers to the 10-question §11.3 rubric | **passed** | `design_private/creature_candidates.md` (gitignored, on disk, read in full). Part 1: **32** concepts, each `scores [a,b,c,d,e,f]` on the six required axes; probe confirmed all values within 1-5. Part 2: **22** selected (within 18-24). Part 3: **22** `### T-<NN>` rubric blocks; question numbers 1-10 each appear exactly 22 times (= 22×10), so every selected organism has all 10 answers. |
| AC-cp-spoiler — `design_private/` out of the public surface; no plan artifact, commit message, screenshot, or progress report names deep creatures / the lore truth / the MacGuffin / the endings | **passed** | `git check-ignore -v design_private/creature_candidates.md` → `.gitignore:14:design_private/`; `git ls-files design_private/` → empty (untracked); `git show --name-status 0bd25d1` lists **no** `design_private/` path. The 7 tokens in `design_private/_spoiler_tokens.txt` are absent from every tracked file (`git grep`) and from the commit message; no creature proper codename appears in any tracked `agents/` file. Commit message is exactly `creative pass: roster (private)`. One borderline descriptor is noted as a non-blocking observation under Findings. |

## Deliverable checks (work item "Deliverables (checkable)")

| Deliverable | Verdict | Evidence |
|---|---|---|
| ≥30 concepts scored 1-5 on the six axes | passed | 32 concepts; probe `unscored=0`, all values 1-5. |
| 18-24 selected | passed | 22 selected. |
| §11.1 distribution | passed | 6 ambient / 6 useful-neutral / 5 predators / 3 set pieces / 2 colossal, matching the 5-7 / 4-6 / 4-6 / 2-4 / 2-3 bands; both colossal entries are "not simply hostile", satisfying the clause. |
| All 13 §11.1 minimums | passed | Part 2 lists all 13 (two helpful; dangerous-looking-but-safe; harmless-with-second-behavior; non-chase predator; wreck-repurposer; living landmark; never-fully-seen; presence-through-fauna; exploitable relationship; scale-misread; beautiful-not-threatening; architecture-bound life cycle; ≥1 uncategorizable), each mapped to at least one real organism. |
| 10-question §11.3 rubric for every major organism | passed | 22 rubric blocks, questions 1-10 each (22×10 verified). |
| Diversity gate <25% "swimming mouth", count recorded | passed | `Diversity gate: 0 of 22 ... 0%`. Independently re-checked the 5 selected predators: none is a chase-and-bite mouth; 0/22 is defensible. |
| Anti-cliche gate §11.2 (neon-blue-everywhere + size-scaled-fish bans) | passed | Part 2 documents both bans explicitly and shows the banned clichés were generated as scored candidates and rejected on the record (T-26 / T-29 / T-30), so the gate is demonstrably applied rather than asserted. |
| §47 principle coverage ≥8 | passed | Part 5 lists 15 principles (P01-P15); all 15 map to real §47 bullets. |
| Renderer per organism from the §13 toolbox | passed | 22 `Renderer:` lines; all four toolbox entries (ShapeGeometry, spine renderer, rigid mesh hierarchy, found-object attachment) are used. |
| Ecologically plausible inside the selected world (WI-01a dependency, no second world) | passed | The file's "World anchor" section matches `design_private/final_selected_world.md` (the selected colonial-body world; fixed-point pulse/heartbeat, dimming respiration, friendly maintenance species). No second world is invented. |
| No code | passed | Commit `0bd25d1` touches only `agents/` artifacts; no product source. |

## Findings

None that block the work item. One non-blocking spoiler-safety observation:

1. **(low, non-blocking) One functional descriptor in the public implementation
   note.** `agents/tasks/hadalv2.execute_leaf.__attempt_0004/implementation/
   WI-01b-implementation.md` (Assumptions, lines ~93-95) writes: "the buried
   ambush organism: its first read (inert rock) is harmless; the second
   behavior (expanding capture net) is the surprise." This names the
   *minimum category* (already public in request §11.1) but then describes one
   specific deep creature's mechanism in a committed progress-report artifact.
   It does **not** use a hidden proper noun, a §47/§12 secret token, or the
   T-<NN> codename, so it does not fail the literal "names deep creatures"
   clause under the project's recorded spoiler scope
   (`design_private/_spoiler_tokens.txt` + `final_selected_world.md`: "the
   hidden proper nouns ... are the only things that must never surface
   publicly"). It is, however, slightly more specific than the request §12
   Step G aggregate guidance ("Do not say what they are"). Suggested tightening,
   if the workflow wants zero ambiguity: reword to "one
   harmless-with-second-behavior archetype (inert first read, then a surprise
   behavior)". Not blocking; all hard secrets and all creature proper names are
   clean.

2. **(low, non-blocking, implementer-commit hygiene) A stray cross-task file
   was swept into the commit.** `0bd25d1` also staged
   `agents/tasks/hadalv2.execute_leaf.__attempt_0003/scratch/work-item-reviewer/
   probes/AGENTS.md` — an index for a **different** attempt's (attempt_0003)
   WI-02a reviewer probe. Its content is clean (no spoiler tokens, no creature
   names; it references only WI-02a runtime internals), and it is the
   implementer's commit, not mine, so it has no effect on this work item's
   acceptance. Flagged only so the stray untracked file is not mistaken for
   WI-01b scope.

## Impact Check

No product symbol changed; no `codegraph_impact`/`codegraph_callers` run.
Commit `0bd25d1` file list (verified with `git show --name-status 0bd25d1`):
`agents/projects/hadal/notes/20260907-implementer-wi01b-creature-roster.md`,
`agents/tasks/.../implementation/{AGENTS.md,WI-01b-implementation.md}`,
`agents/tasks/.../scratch/implementer/verify-wi01b/{AGENTS.md,verify.mjs}`, and
the stray attempt_0003 probe index above. No `src/` or product path, and no
`design_private/` path, is in the commit.

## Independent Adversarial Probes

All probes are read-only counts/regex against the real deliverable; none
reused the implementer's `verify.mjs`. Scratch probe committed at
`agents/tasks/hadalv2.execute_leaf.__attempt_0004/scratch/work-item-reviewer/
probes/verify.ps1`.

- **Concept/score integrity** (could falsify "30+ scored"): count `- C\d+`
  lines → 32; assert each has exactly 6 ints in `scores [..]` → 0 violations;
  assert every value is in 1-5 → all in range. Result: 32 concepts, 6-axis,
  1-5.
- **Selected/rejected reconciliation** (could falsify "18-24"): `· SELECTED$`
  on concept lines → 22; `· REJ` concept lines → 10 (the 11th `· REJ` match is
  the Part 1 legend line, not a concept); 22+10 = 32.
- **Rubric completeness** (could falsify "10-question per organism"): the
  selected-ID set from Part 1 (22) equals the Part 3 `### T-<NN>` header set
  (22) — `Compare-Object` empty; question-number lines `^<n>\. ` for n=1..10
  each appear exactly **22** times, so all 22 blocks carry all 10 questions.
- **Renderer coverage**: `^Renderer:` count = 22 (one per organism); all four
  §13 toolbox terms present.
- **Spoiler leak sweep** (could falsify AC-cp-spoiler): `git grep` for each of
  the 7 `_spoiler_tokens.txt` tokens across the tracked tree → none; commit
  messages → none; creature proper codenames across the tracked tree → only a
  false-positive `markers` inside `agents/templates/mermaid.min.js`.
- **World anchoring** (could falsify "no second world"): read
  `design_private/final_selected_world.md` and compared the roster's "World
  anchor" prose — it matches the selected colonial-body world, does not invent
  a second world.

## What I Could Not Verify

- The **creative quality** of the roster (surprise, §46 "holy shit" quota,
  conceptual range) — the work item hands off to the reviewer "counts,
  structure, and spoiler safety only," so I did not opine on aesthetic
  merit. The structural §46/§47 records are present and internally consistent.
- I could not run the deliverable through any executable, because the work
  item is explicitly "No code"; the observable artifact is the private design
  document, which I read in full and probed structurally.
- I did not read `design_private/lore_truth.md`, `world_candidates.md`, or
  `encounter_beats.md` beyond the two files needed to anchor and scan this
  work item's deliverable; the spoiler check for WI-01b does not depend on
  them.

## Verdict

`pass` — every objective criterion (counts, structure, gates, rubric
completeness, renderer coverage, distribution, §47 coverage, and spoiler
safety of the 7 hard tokens / creature proper names / commit message /
gitignore exclusion) is verified clean against the repository. The two low,
non-blocking observations above (one functional descriptor in the
implementation note; one stray cross-task index swept into the commit) do not
violate the work item's acceptance criteria under the project's recorded
spoiler scope.
