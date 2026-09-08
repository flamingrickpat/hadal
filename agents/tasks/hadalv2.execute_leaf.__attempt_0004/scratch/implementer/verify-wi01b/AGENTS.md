# Scratch — implementer / verify-wi01b

Bounded verification probe for WI-01b (private creature roster pass).

- `verify.mjs` — structural validator for `design_private/creature_candidates.md`
  plus a spoiler-safety scan of every committed (non-`design_private/`) file in
  the repository.

Run:

```powershell
node agents/tasks/hadalv2.execute_leaf.__attempt_0004/scratch/implementer/verify-wi01b/verify.mjs
```

Exit code 0 = all checks pass; non-zero = at least one check failed.

This probe answers: does the private roster file contain the required structure
(30+ rough concepts each with a 6-axis 1-5 score, a selected roster within
18-24, every section 11.1 minimum named, a recorded diversity gate under 25%,
the anti-cliche gates, a per-organism 10-question section 11.3 rubric with a
named §13 renderer, the four section 46 quality-bar questions applied, and at
least eight section 47 principles covered)? And does the spoiler boundary hold
— no hidden proper noun (per the private token manifest) in any committed
public artifact?

The probe reads the working tree. `design_private/` is gitignored by design;
the probe reads those files from disk and asserts that the secret proper nouns
do NOT appear outside `design_private/`. The probe deliberately contains no
secret token literals: the manifest itself is private.
