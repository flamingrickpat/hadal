# Implementer Verification Runs

Automated test probes written to verify WI-08c (public README finish and section 68
handoff message).

- `readme-check.test.mjs` — verifies README.md contains exactly the section 69 include list
  (install, build, controls, browser requirements, expected playtime, save location,
  developer/debug section) and none of the exclude list (no creature list, no story
  synopsis beyond the starting premise)
- `handoff-check.test.mjs` — verifies the section 68 handoff message covers systems
  completed, performance, bugs fixed, approximate content completeness, and whether
  the full playthrough works, with no hidden content
- `consistency-check.test.mjs` — verifies expected playtime, save location, and
  playthrough status are consistent with WI-08a's recorded results