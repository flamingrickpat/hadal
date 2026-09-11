# scratch/reviewer

Reviewer's bounded headless probe for WI-06b, separate from the implementer's
own tests. Evidence for `../../reviews/WI-06b-review.md`.

- `band_distinctness.mjs` — verifies each mid band differs from adjacent bands
  in ≥2 identity factors using the same test logic as `src/render/band.test.ts`.
  Run with `node band_distinctness.mjs` from this directory.