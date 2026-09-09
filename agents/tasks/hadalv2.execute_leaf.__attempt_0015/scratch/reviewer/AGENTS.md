# scratch/reviewer

Reviewer's bounded headless probes for WI-03c1b, separate from the
implementer's own tests, driving the real production `Simulation` (no rule
mocks). Evidence for `../../reviews/WI-03c1b-review.md`.

- `adversarial/` — independent per-organism probes (T-14 re-arm / non-lethal
  snap, T-15 silent-vs-loud corner, T-18 drive / non-hostile / harvest).

Run from the repository root:
`npx vitest run --config agents/tasks/hadalv2.execute_leaf.__attempt_0015/scratch/reviewer/adversarial/vitest.config.ts`
