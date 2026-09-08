# scratch/reviewer/audit-wi01c

Independent spoiler-safety audit for the WI-01c review (work-item-reviewer).

- `audit.mjs` — read-only Node script. Scans (case-sensitive, token manifest
  from the private file, which the script reads but never prints):
  1. every git-tracked file outside `design_private/` against ALL 62 tokens
     (including the 32 T-IDs the implementer's probe excluded from the tree);
  2. every commit message (subject + body, `git log --all --pretty=%B`)
     against all 62 tokens (the implementer's probe only scanned
     `creative pass:` subjects);
  3. the five public artifacts newly committed by this work item against
     all 62 tokens;
  4. all image files in the working tree (screenshot inventory);
  5. case-insensitive spot-checks for a few high-signal terms.
  Exit 0 = no leaks found; prints every hit with file:line.

Committed because the audit output informed the review verdict.
