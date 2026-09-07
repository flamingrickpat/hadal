---
id: ST-05
kind: story
parent: null
children: []
depends_on: ["ST-03", "ST-04"]
criteria:
  AC-end-mac: "The MacGuffin is visually memorable in simple rendering, tied to at least 2 earlier environmental traces, retrievable through gameplay from a fresh save, and its retrieval changes the environment, creature behavior, or return journey"
  AC-end-seq: "The final 5-10 minutes are mechanically different from the approach, the finale is not a conventional arena boss, and a headless scenario proves the ending trigger fires exactly once and the final sequence survives a save reload"
  AC-end-variants: "At least 2 ending variants are reachable from a single player decision, each producing a different final state, text, or shot, with credits and restart working"
behavior: "Implement the MacGuffin and the non-arena endgame (request sections 23, 24) with the win condition, ending variants, and headless ending verification"
subsystems: ["simulation rules", "world content data", "save system", "headless scenario tests"]
verification: "Headless scenario from fresh save: reach the final site, retrieve, observe the changed return journey, trigger each ending variant, reload at each milestone and continue; duplicate-trigger and restart checks per section 70"
---

# ST-05 — MacGuffin and endgame (UNEXPANDED)

## Status

Explicit expansion task. Split in a future planning session; natural split:
(1) MacGuffin content and retrieval mechanics in the simulation; (2) the
final descent sequence (altered rules, instruments, escape) as its own item;
(3) ending variants plus save-continuity and one-shot trigger verification.

## Scope inventory (honest)

- MacGuffin per section 23: true nature comes from the private creative
  pass; retrieval must change the environment, creature behavior, player
  perception, or the return journey; no glowing-orb fade to credits.
- Endgame per section 24: pick from the listed structures (extraction under
  altered ecology, stealth passage, unreliable instruments, structural
  collapse, help from a well-treated species - the exact mechanism is
  secret and decided privately, consistent with WI-01c).
- The win condition is new simulation state: the game must be completable
  without console commands (section 45 first criterion), which lands here.
- Save milestones per section 25: before final descent, after key story
  triggers; autosave schema extends the existing versioned save
  (`src/game/save.ts`) with trivial migration.
- Ending variants: a decision plus different final state/text/shot is
  enough; one variant is the section 72 cut candidate.

## Dependencies and boundaries

- Depends on ST-03 (final-zone fauna and the species that may help or
  hinder) and ST-04 (final-zone approach content, last foreshadow traces,
  trigger wiring).
- ST-06 needs the endgame in place before the full art pass; ST-07 tunes the
  finale's difficulty (altered context, not maxed damage - section 39).

## Constraints and non-goals

- No HP-bar leviathan, no conventional boss arena (sections 1.5, 24).
- The final challenge comes from altered rules/context (section 39).
- Ending logic stays in the simulation; the browser only presents the final
  state/shot/text.
- Plan nodes never describe the mechanism; the private files are the source
  of truth and stay out of these artifacts (sections 0, 12, 68).

## Fresh-session handoff for the expander

Read request sections 1.5, 22, 23, 24, 25, 39, 45, 70 (Ending checklist) and
ST-03/ST-04 bodies. The expander reads the private MacGuffin decision from
the creative pass and keeps it referenced by id only.
