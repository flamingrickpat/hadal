# implementer scratch — WI-03c1a

Bounded evidence for the pre-existing scenario-timeout investigation:

- `full-suite.log` — full `npx vitest run` output showing the
  `scenarios.test.ts` "blocked route" timeout (with item changes).
- `scenarios-1.log`, `scenarios-2.log` — the single file run twice with the
  item changes (reproducible timeout).
- `scenarios-mine.log` — the "blocked route" test alone with item changes
  (5601 ms > 5000 ms).
- `full-suite-final.log` — full suite after the one-test explicit-timeout
  repair: 223/223 passed.
- The base-commit reproduction (5610 ms, identical) ran after
  `git stash -u` and is recorded in
  `implementation/WI-03c1a-implementation.md` (its log write was lost with
  the stashed scratch directory; the timed-out run's console output is in
  the session shell log).
