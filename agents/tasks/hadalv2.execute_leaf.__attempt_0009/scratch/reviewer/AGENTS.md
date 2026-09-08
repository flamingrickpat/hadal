# scratch/reviewer

Disposable reviewer probes for WI-03a review.

- `spoiler-scan.mjs` — case-sensitive word-boundary scan of `src/`, `tests/`,
  `index.html` for the private roster's creature names / secret-description
  phrases. Run with `node <path>`; prints CLEAN or the matches. Used for the
  AC-roster-tests spoiler check in `reviews/WI-03a-review.md`.
