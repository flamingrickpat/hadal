# probes — work-item-reviewer (WI-01b)

Read-only adversarial probes I ran while reviewing WI-01b (creature roster).
Evidence for `../../reviews/WI-01b-review.md`; not product code, no
dependencies.

Run from the repo root:

```powershell
powershell -File agents/tasks/hadalv2.execute_leaf.__attempt_0004/scratch/work-item-reviewer/probes/verify.ps1
```

## Files

- `verify.ps1` — counts/reconciliation probes against the real deliverable
  `design_private/creature_candidates.md`:
  1. selected-ID set (Part 1) equals the rubric-block header set (Part 3) and
     both have 22 entries;
  2. per-rubric-block question count (expects 10 per block).
  (The one-shot checks for 32 concepts / six-axis scores in range / 22 selected
  / renderer-line count were run inline and are recorded in the review.)
