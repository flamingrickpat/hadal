---
tags: [wi-01c, reveal-mapping, spoiler-audit, design_private, verify-probe]
symbols: [design_private/encounter_beats.md, design_private/spoiler_map.md, _spoiler_tokens.txt]
date: 2026-09-09
---

# WI-01c implementer note — encounter_beats file shape and the final spoiler audit

## Summary

`design_private/encounter_beats.md` (gitignored) closes the creative pass.
It has a fixed seven-part shape that the WI-01c verify probe and any future
reviewer can rely on:

1. **Timeline** — one line per beat, exact form
   `- B<NN> · <a>-<b> min — <content>`, 22 beats covering the 90-120 minute
   run, every beat 3-6 minutes, numbering contiguous from B01. Spectacle
   slots are inline tags `[S1 spectacle]` … `[S5 spectacle]` on the beat line
   (the probe counts exactly five).
2. **Reveal assignment** — a markdown table, one row per selected roster
   codename (`T-<NN>`), columns: roster / reveal beat / reveal type /
   staging intent. Every codename must appear in the file (probe checks
   each roster id from `creature_candidates.md`).
3. **Lore clues** — four `### R<n>` blocks (R1..R4), each listing its earlier
   traces as `- trace: … (beat B<NN>…)` lines; the probe verifies every beat
   reference resolves to a real grid beat.
4. **MacGuffin** — one section fixing the true nature and the six section 23
   design points, with `  - Trace:` (indented, capital T) lines for the
   earlier environmental traces (the probe requires >= 2).
5. **Motifs** — `### M-<n>` blocks (3-5 allowed), each with a `contexts:`
   line naming the beats, and a "final reveal" line stating which motifs get
   connected; at least one motif must be left unexplained.
6. **Endings** — a markdown table, rows start `| E-1 ` and `| E-2 ` (probe
   regex), columns variant/decision/final state/final text/final shot/scope;
   each row must contain "modest-scope" and exactly one row "cut candidate".
   The probe rejects "glowing orb" / "fade to credits".
7. **Distribution note** — prose stating where the spectacle slots fall, so a
   reviewer can see the best ideas are not all in the first half.

`design_private/spoiler_map.md` is the containment ledger: a secret-facts
table (rows start `| S-<n> `, minimum 6; WI-01c records 10), a public-surface
ban list (must name the four categories: deep creatures, lore truth,
MacGuffin, endings), and the final audit section (must cover gitignore,
commit messages, and the every-file-in-private-dir review).

## Probe

`agents/tasks/hadalv2.execute_leaf.__attempt_0007/scratch/implementer/verify-
wi01c/verify.mjs` (Node, no deps) checks all of the above and then runs the
final spoiler audit. Run from the repo root:

```powershell
node agents/tasks/hadalv2.execute_leaf.__attempt_0007/scratch/implementer/verify-wi01c/verify.mjs
```

## Gotchas

- The probe reads its token list from `design_private/_spoiler_tokens.txt`
  (created by WI-01a, extended by WI-01c with the 32 roster codenames plus
  creature names and the ending-tone phrases). The probe itself contains no
  token literals, so committing it cannot leak anything.
- The whole-tree scan skips `*.min.*` vendor bundles: one-word namespace
  collisions in third-party minified code are not spoiler leaks; the
  classification is recorded in the audit section of `spoiler_map.md`.
- This work item's own committed artifacts (implementation note, probe,
  indexes, this note) are scanned against ALL tokens including the roster
  codenames — the strictest tier. Use category-level language in them
  ("selected roster codenames", "the MacGuffin", "two ending variants"),
  never the actual names.
- Pre-existing public codename mentions in the approved WI-01b note/review
  (three rejected anti-cliche codenames) are allowed and must not be
  rewritten (append-only rule); they are classified in the ban-list section.
- Creative-pass commits stay bare: `creative pass: <what> (private)` with no
  body and no trailers (precedent: the WI-01a commit); `design_private/`
  never appears in the diff because it is gitignored.
- Beat ranges at the top of the run use 2-digit minutes, at the end 3-digit
  (the run is 120 min) — the probe regex allows both; keep the exact
  `· <a>-<b> min` shape when editing beats.
- The zone and creature implementation stories code from the staging-intent
  column of the reveal-assignment table; a redesign means editing Part 3
  here, not patching code around a weak staging intent.
