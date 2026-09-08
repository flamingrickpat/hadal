---
tags: [wi-01b, creature-roster, design_private, spoiler-safety, verify-probe]
symbols: [design_private/creature_candidates.md, _spoiler_tokens.txt]
date: 2026-09-07
---

# WI-01b implementer note — creature roster file shape and the roster probe

## Summary

`design_private/creature_candidates.md` (gitignored) is the private creature
roster for the selected world. It has a fixed five-part shape that the WI-01b
verify probe and any future reviewer can rely on:

1. **Part 1** — 32 rough concepts, one per line, starting `- C<NN> · T-<NN>
   <name> (<role>). … scores [a,b,c,d,e,f] · SELECTED|REJ <reason>`. Six score
   axes: silhouette novelty, ecological plausibility, gameplay distinction,
   ease of procedural animation, surprise potential, cliché-freedom (higher is
   better on all six). `T-` ids are the stable internal codenames the rest of
   the file uses; `C-` ids are the generation order.
2. **Part 2** — distribution table (counts per §11.1 role band), the 13 §11.1
   minimums with the organisms that cover each, the diversity-gate line in the
   exact form `Diversity gate: N of M`, and the anti-cliche gate record.
3. **Part 3** — one `### T-<NN> <name>` block per selected organism: a
   `Renderer:` line naming the §13 toolbox entry (ShapeGeometry, spine
   renderer, rigid mesh hierarchy, found-object attachment), then the 10
   §11.3 rubric questions answered as numbered lines `1.`…`10.`.
4. **Part 4** — the four §46 quality-bar questions (shark-replacement, "just
   big", friendly-species, evidence-before-explanation) applied per major
   species.
5. **Part 5** — §47 principle coverage, one line per principle in the exact
   form `- P<NN> · <principle text> — <organism ids>`.

## Probe

`agents/tasks/hadalv2.execute_leaf.__attempt_0004/scratch/implementer/verify-
wi01b/verify.mjs` (Node, no deps) checks all of the above plus a whole-tree
spoiler scan. Run from the repo root:

```powershell
node agents/tasks/hadalv2.execute_leaf.__attempt_0004/scratch/implementer/verify-wi01b/verify.mjs
```

## Gotchas

- The probe reads its secret-token list from `design_private/_spoiler_tokens.txt`
  (created by WI-01a, also gitignored) — the probe itself contains no token
  literals, so committing the probe cannot leak a token.
- The "· SELECTED" count must be taken from concept lines only
  (`^- C\d{2} · …`); the Part 1 legend line also mentions the marker word.
- The selected roster is 22 (T-01,02,03,05,06,08,09,10,11,13,14,15,16,17,18,
  19,20,22,23,25,27,31); T-04,07,12,21,24,26,28,29,30,32 are the recorded
  rejections (including the deliberate anti-cliche rejects T-26/T-29/T-30).
- Creative-pass commits are bare: `creative pass: <what> (private)` with no
  body and no trailers (precedent: the WI-01a commit `986faeb`); `design_
  private/` never appears in the diff because it is gitignored.
- ST-03 (creature implementation) codes from the Part 3 rubric answers; a
  redesign means editing Part 3 here, not patching code around a weak answer.
