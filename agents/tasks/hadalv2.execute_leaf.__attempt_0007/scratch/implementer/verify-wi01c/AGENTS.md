# Scratch — implementer / verify-wi01c

Bounded verification probe for WI-01c (creative-pass close-out: reveal
mapping, MacGuffin, endings, and the final spoiler audit).

- `verify.mjs` — structural validator for `design_private/encounter_beats.md`
  and `design_private/spoiler_map.md`, plus the final spoiler audit:
  gitignore state of `design_private/`, the story's creative-pass commit
  messages, the whole public tree, and this work item's own committed
  artifacts (strictest token tier).

Run:

```powershell
node agents/tasks/hadalv2.execute_leaf.__attempt_0007/scratch/implementer/verify-wi01c/verify.mjs
```

Exit code 0 = all checks pass; non-zero = at least one check failed.

This probe answers: does the pacing grid hold (22 beats of 3-6 minutes,
contiguous, 90-120 minute run)? Is every selected roster codename assigned to
a beat, with enough reveals in the second half? Are exactly five spectacle
slots tagged? Are 3-5 motifs listed with contexts and a final-reveal
connection that leaves something unexplained? Does the MacGuffin section meet
section 23 (memorable rendering, earlier traces, environment/return-journey
change, one final decision, mechanically different final minutes)? Are there
two modest-scope ending variants, one tagged as the section 72 cut candidate,
and no glowing-orb fade? Does the spoiler map list every secret fact with its
carrying artifacts and the ban list? And does the spoiler boundary hold — no
hidden token (per the private manifest) in any public artifact, commit
message, or gitignore gap?

The probe reads the working tree. `design_private/` is gitignored by design;
the probe reads those files from disk and asserts that the secret tokens do
NOT appear outside `design_private/`. The probe deliberately contains no
secret token literals: the manifest itself is private.
