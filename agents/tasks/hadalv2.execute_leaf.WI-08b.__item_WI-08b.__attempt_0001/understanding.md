# Understanding

This child implements one independently reviewed work item from C:\Temp\hadal-v2\agents\tasks\hadalv2.

---
id: WI-08b
kind: work_item
parent: ST-08
children: []
depends_on: ["WI-08a", "WI-08c"]
criteria:
  AC-fin-mvp: "Every section 45 MVP acceptance criterion is evidenced at its assigned layer: headless for rules, reachability, and persistence; browser inspection for presentation, audio, performance, and usability"
  AC-fin-spoiler: "A final audit of commits, notes, screenshots, and the public README confirms no development artifact spoiled hidden content, and the README is spoiler-safe per section 69"
behavior: "Audit the full commit history, progress reports, task notes, screenshots, and agents/projects/hadal/ notes for leaked hidden content, confirm the final README is spoiler-safe per section 69, and write a spoiler-safe audit log listing every checked artifact, closing section 45's no-development-spoilers bullet"
subsystems: ["verification and handoff"]
verification: "A spoiler-safe audit log listing every checked commit, progress report, task note, screenshot, and agents/projects/hadal/ note (artifacts listed, never their hidden content) with a pass/fail verdict per artifact; a README diff against the section 69 include/exclude list confirming no creature list or story synopsis beyond the starting premise; a recorded statement that section 45's 'the user has not been spoiled by development chatter' bullet holds"
---

# WI-08b — Spoiler audit (final gate)

## Goal

Confirm nothing in the repository's development artifacts leaked hidden
content, and that the public README is spoiler-safe. This leaf is the final
gate of ST-08: it audits the full commit history, progress reports, task notes,
screenshots, and the `agents/projects/hadal/` notes for deep-creature names or
descriptions, lore truth, MacGuffin truth, final-encounter mechanics, ending
variants, and late-zone visuals, and it confirms the finished README (from
WI-08c) contains no creature list and no story synopsis beyond the starting
premise. It is the named final proof owner of AC-fin-spoiler and of
AC-fin-mvp's no-development-spoilers half (section 45's last bullet: "the user
has not been spoiled by development chatter"). It writes; it does not redesign -
a leaked artifact is remediated by removing/rewording that artifact, or by a
fresh work item if the leak is in product source; it never changes game
content.

## Deliverables (checkable)

- A spoiler-safe audit log: every checked commit (message + the diff of each
  planning and implementation artifact reachable from the baseline), progress
  report, task note, screenshot, and `agents/projects/hadal/` note, with a
  pass/fail verdict per artifact. The log lists artifacts checked and their
  verdict; it never reproduces any hidden content.
- A README diff against the section 69 include list (install, build, controls,
  browser requirements, expected playtime, save location, developer section) and
  exclude list (no creature list, no story synopsis beyond the starting
  premise).
- A recorded verdict that section 45's no-development-spoilers bullet holds,
  closing AC-fin-mvp's spoiler half.

## Tests

- Audit pass: walk `git log` from the baseline (every commit message and the
  diff of each reachable planning/implementation artifact), the task notes under
  `agents/tasks/hadalv2/` (private `design_private/` content is checked only for
  the fact that it stays gitignored), `agents/projects/hadal/` notes,
  screenshots/evidence artifacts, and the public `README.md`.
- README check: diff the finished README (WI-08c) against section 69; assert the
  include list is present and the exclude list is absent.
- Remediation (only if a leak is found): remove or reword the offending
  development artifact and re-audit it; if the leak is in product source, file a
  fresh work item through the fix-planning route - do not change game content
  here.

## Constraints, assumptions, non-goals

- Runs after WI-08a and WI-08c: it audits the E2E artifacts (including
  screenshots) and the finished README, so it is the last leaf of ST-08.
- No product code or game-content changes. The audit log is a normal
  (non-private) artifact and never contains hidden content.
- Spoiler rules are the subject of this leaf (sections 0, 12, 68, 70); the
  audit itself is reported in spoiler-safe terms.
- Does not run the E2E pass (WI-08a) or write the README (WI-08c); it audits
  their outputs.

## Fresh-session handoff

Read ST-08/plan.md (this is the final proof owner of AC-fin-spoiler and of
AC-fin-mvp's no-development-spoilers half), request sections 0, 12, 45 (last
bullet), 68, 69, and 70. Read WI-08a (the artifacts and screenshots it produced)
and WI-08c (the finished README). Run `git log` from the baseline and walk the
task/project notes, screenshots, and README; write the spoiler-safe audit log
and the section 69 README diff.

