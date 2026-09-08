# Scratch — implementer / verify-wi01a

Bounded verification probe for WI-01a (private creative pass, steps A-C).

- `verify.mjs` — structural validator for the three `design_private/` files plus a
  spoiler-safety scan of every public (committed) artifact.

Run:

```powershell
node agents/tasks/hadalv2.execute_leaf.__attempt_0001/scratch/implementer/verify-wi01a/verify.mjs
```

Exit code 0 = all checks pass; non-zero = at least one check failed.

This probe answers: do the private design files contain the required structure
(three distinct worlds, per-candidate step-B critique, an explicit weakest
rejection, a named selection with exactly one stolen mechanism, and a lore truth
with a central event, official/observed contradictions, and per-reveal
foreshadow traces)? And does the spoiler boundary hold (no hidden proper noun
in any committed artifact or in the commit message)?

The probe reads the working tree. `design_private/` is gitignored by design
(request section 12); the probe reads those files from disk and asserts that the
secret proper nouns they define do NOT appear in any committed public artifact.
