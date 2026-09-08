---
title: Spoiler boundary for the private creative pass
role: implementer
created: 2026-09-08
tags: [creative-pass, spoiler-safety, design_private, gitignore, section-12]
symbols: [design_private, _spoiler_tokens.txt, verify.mjs]
files: [design_private/, .gitignore]
---

# Spoiler boundary for the private creative pass

## Summary

How the section-12 private creative pass keeps its hidden content (the selected
world, creatures, MacGuffin truth, endings) out of every committed public
surface. Established while implementing WI-01a (world candidates + selection).
Reuse the same containment in the later creative-pass work items (roster, then
reveal mapping).

## Key Facts

- The private payload lives in `design_private/`, which is **already
  gitignored** (`.gitignore` line 14: `design_private/`). Files there exist in
  the working tree only; reviewers read them from disk, not from git.
- The creative pass does NOT commit the private content. Committed artifacts
  (implementation notes, project notes, probes, commit messages, progress
  reports) describe structure at **category level** only — e.g. "three
  candidate world frames, one rejected as weakest, one selected with one stolen
  mechanism" — and never name the deep creatures, the lore truth, the MacGuffin,
  or the endings.
- `src/content/secret/` (section 29 layout) is the later *runtime* location for
  the hidden content the game actually loads; it is separate from the
  gitignored `design_private/` working folder.
- Section 12 step order: A (worlds) -> B (critique) -> C (hybridize, don't
  average) -> D-E (roster) -> F (mapping) -> G (never reveal in progress
  reporting). WI-01a covers A-C only; creatures and motifs belong to later
  items and must not be drafted in the world-selection files.

## Navigation

- Private files (working tree, gitignored): `design_private/world_candidates.md`,
  `final_selected_world.md`, `lore_truth.md`, `_spoiler_tokens.txt`.
- Reusable spoiler-safety probe: the task's `scratch/implementer/verify-*/
  verify.mjs`. It reads the hidden proper-noun list from
  `design_private/_spoiler_tokens.txt` (so the committed probe contains no
  secrets), asserts the required document structure, and greps every public
  artifact for the tokens.

## Gotchas

- Do NOT hardcode the hidden proper nouns in a committed probe or note — the
  probe instead reads them from the gitignored `_spoiler_tokens.txt`. A committed
  file that lists the secrets is itself a spoiler leak.
- The whole-tree grep must exclude `design_private/` and report every token as
  clean; any hit outside `design_private/` is a containment failure.
- This is a documentation-only work item: there is no executable product
  behavior, so the "test" is the structural + spoiler validator run red-then-
  green, not a unit test.

## Commands

```powershell
# confirm the folder is ignored
git check-ignore -v design_private/world_candidates.md
# run the spoiler + structure validator for a creative-pass work item
node <task>/scratch/implementer/verify-wiNNN/verify.mjs
```
