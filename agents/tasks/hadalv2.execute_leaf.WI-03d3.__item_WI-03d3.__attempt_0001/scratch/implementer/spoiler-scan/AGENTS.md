# scratch/implementer/spoiler-scan (WI-03d3)

Bounded read-only probe for WI-03d3 (the roster-wide spoiler audit,
AC-roster-tests). Question: does any ST-03 commit message carry a
creature name or secret description from
`design_private/_spoiler_tokens.txt`? Ground truth for the audit's
commit-message scope before the test encoded it.

The probe reads the private token manifest (T-IDs excluded, the "The X"
prefix stripped, the per-tier case-insensitive whole-word rule) and scans
every commit that references the ST-03 story or a WI-03[a-d] item. It
prints hits only; the token list is never written to output or committed,
so this file cannot leak a name.

Result at run time (2026-09-08): 30 name/description tokens, **0 offender
hits** across all ST-03 commits — the commit history is spoiler-clean.

## files

- `scan-commits.ps1` — the probe (PowerShell, git log + token manifest).

Run from the repo root:
`powershell -NoProfile -ExecutionPolicy Bypass -File agents/tasks/hadalv2.execute_leaf.WI-03d3.__item_WI-03d3.__attempt_0001/scratch/implementer/spoiler-scan/scan-commits.ps1`
