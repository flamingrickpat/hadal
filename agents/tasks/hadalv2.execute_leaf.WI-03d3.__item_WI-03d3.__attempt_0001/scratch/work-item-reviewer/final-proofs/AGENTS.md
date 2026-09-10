# scratch/work-item-reviewer/final-proofs (WI-03d3 review)

Reviewer scratch probes for the WI-03d3 review — disposable, independent of
the implementer's probes, each answering one falsifiable question about the
two roster-wide FINAL PROOFS. All run from the repo root with `node`.

## files

- `probe-geometry.mjs` — raw-source geometry check: are the five tier-4
  spawns in their roster band chunks, in bounds, and out of every closed
  slab? Result: pass (only the documented pre-existing `t03-twilight`
  slab-interior hit remains).
- `probe-commits.mjs` — full-git-history token scan, case-insensitive
  superset of the shipped audit's commit filter. Result: 384 commits,
  95 ST-03-related, 0 offenders; the 4 lowercase review commits the test's
  case-sensitive filter skips are each clean.
- `probe-repo.mjs` — every git-tracked product file (all extensions),
  token scan outside `design_private/` and `agents/`. Result: 102 files,
  0 offenders.
- `probe-tests.mjs` — per-species scenario content check: each of the 22
  roster ids has a non-empty per-species `describe` block (1-3 `it` cases)
  in a headless tier scenario file. Result: pass, 22/22.
