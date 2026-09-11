# Understanding

This child implements one independently reviewed work item from C:\Temp\hadal-v2\agents\tasks\hadalv2.

---
id: WI-08c
kind: work_item
parent: ST-08
children: []
depends_on: ["WI-08a"]
criteria:
  AC-fin-spoiler: "A final audit of commits, notes, screenshots, and the public README confirms no development artifact spoiled hidden content, and the README is spoiler-safe per section 69"
behavior: "Finish the public README per section 69 (install, build, controls, browser requirements, expected playtime, save location, clearly separated developer section) and write the section 68 handoff message to the human, both spoiler-safe, reflecting the final verified state from WI-08a"
subsystems: ["verification and handoff"]
verification: "A README.md containing exactly the section 69 include list (install, build, controls, browser requirements, expected playtime, save location localStorage, developer/debug section) and none of the exclude list (no creature list, no story synopsis beyond the starting premise); a section 68 handoff message covering systems completed, performance, bugs fixed, approximate content completeness, and whether the full playthrough works, with no hidden content; both consistent with WI-08a's recorded results"
---

# WI-08c — Public README finish and section 68 handoff message

## Goal

Produce the two user-facing deliverables of the handoff: the public README
(section 69) and the handoff message to the human (section 68). The README
documents install, build, controls, browser requirements, expected playtime,
save location, and a clearly separated developer/debug section, with no creature
list and no story synopsis beyond the starting premise. The handoff message
reports systems completed, performance, bugs fixed, approximate content
completeness, and whether the full playthrough works - both drawn from the final
verified state WI-08a recorded. This leaf edits only the public README and the
handoff message; it does not run the E2E pass (WI-08a) and it is not the final
proof owner of AC-fin-spoiler - WI-08b audits the finished README. It
contributes to AC-fin-spoiler by making the README spoiler-safe.

## Deliverables (checkable)

- `README.md` matching section 69 exactly:
  - install: `npm install`, `npm run dev`;
  - production build: `npm run build`, `npm run preview`;
  - controls;
  - browser requirements;
  - expected playtime;
  - save location (`localStorage`);
  - a clearly separated developer/debug section.
- No creature list and no story synopsis beyond the starting premise.
- A section 68 handoff message: systems completed, performance, bugs fixed,
  approximate content completeness, and whether the full playthrough works -
  nothing that spoils hidden content.

## Tests

- README checklist: verify each section 69 include item is present and each
  exclude item is absent (no creature list, no story synopsis beyond the
  starting premise). The commands match the real package scripts in
  `package.json`.
- Handoff message: verify it covers the five section 68 fields and contains no
  deep-creature names/descriptions, lore truth, MacGuffin truth, final-encounter
  mechanics, ending variants, or late-zone visuals; any screenshot referenced
  uses early-game coast or generic debug areas.
- Consistency: expected playtime, save location, and "whether the full
  playthrough works" match WI-08a's recorded results.

## Constraints, assumptions, non-goals

- Edits only the public README and the handoff message. No product code.
- Runs after WI-08a: the handoff message states whether the full playthrough
  works and the save status, which WI-08a establishes.
- Not the final proof owner of AC-fin-spoiler (that is WI-08b); this leaf makes
  the README spoiler-safe but does not audit the whole history.
- Spoiler rules (sections 0, 12, 68, 69, 70) are binding on both deliverables.

## Fresh-session handoff

Read ST-08/plan.md (this is the README/handoff leaf; WI-08b is the final proof
owner of AC-fin-spoiler), request section 69 (README) and section 68 (progress
reporting to the human), and section 45 for the expected-playtime bound. Read
WI-08a (the recorded E2E results the handoff message reflects). Write
`README.md` and the handoff message spoiler-safely; WI-08b will audit both.

