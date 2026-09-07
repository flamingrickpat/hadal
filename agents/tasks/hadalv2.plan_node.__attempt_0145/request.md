{
  "parent_task_id": "hadalv2",
  "parent_phase": "plan_node",
  "configured_task_id": "hadalv2.plan_node",
  "input": {
    "selection": {
      "id": "ST-05",
      "root_task_dir": "C:\\Temp\\hadal-v2\\agents\\tasks\\hadalv2",
      "path": "agents/tasks/hadalv2/stories/ST-05/plan.md",
      "specification": "---\nid: ST-05\nkind: story\nparent: null\nchildren: []\ndepends_on: [\"ST-03\", \"ST-04\"]\ncriteria:\n  AC-end-mac: \"The MacGuffin is visually memorable in simple rendering, tied to at least 2 earlier environmental traces, retrievable through gameplay from a fresh save, and its retrieval changes the environment, creature behavior, or return journey\"\n  AC-end-seq: \"The final 5-10 minutes are mechanically different from the approach, the finale is not a conventional arena boss, and a headless scenario proves the ending trigger fires exactly once and the final sequence survives a save reload\"\n  AC-end-variants: \"At least 2 ending variants are reachable from a single player decision, each producing a different final state, text, or shot, with credits and restart working\"\nbehavior: \"Implement the MacGuffin and the non-arena endgame (request sections 23, 24) with the win condition, ending variants, and headless ending verification\"\nsubsystems: [\"simulation rules\", \"world content data\", \"save system\", \"headless scenario tests\"]\nverification: \"Headless scenario from fresh save: reach the final site, retrieve, observe the changed return journey, trigger each ending variant, reload at each milestone and continue; duplicate-trigger and restart checks per section 70\"\n---\n\n# ST-05 — MacGuffin and endgame (UNEXPANDED)\n\n## Status\n\nExplicit expansion task. Split in a future planning session; natural split:\n(1) MacGuffin content and retrieval mechanics in the simulation; (2) the\nfinal descent sequence (altered rules, instruments, escape) as its own item;\n(3) ending variants plus save-continuity and one-shot trigger verification.\n\n## Scope inventory (honest)\n\n- MacGuffin per section 23: true nature comes from the private creative\n  pass; retrieval must change the environment, creature behavior, player\n  perception, or the return journey; no glowing-orb fade to credits.\n- Endgame per section 24: pick from the listed structures (extraction under\n  altered ecology, stealth passage, unreliable instruments, structural\n  collapse, help from a well-treated species - the exact mechanism is\n  secret and decided privately, consistent with WI-01c).\n- The win condition is new simulation state: the game must be completable\n  without console commands (section 45 first criterion), which lands here.\n- Save milestones per section 25: before final descent, after key story\n  triggers; autosave schema extends the existing versioned save\n  (`src/game/save.ts`) with trivial migration.\n- Ending variants: a decision plus different final state/text/shot is\n  enough; one variant is the section 72 cut candidate.\n\n## Dependencies and boundaries\n\n- Depends on ST-03 (final-zone fauna and the species that may help or\n  hinder) and ST-04 (final-zone approach content, last foreshadow traces,\n  trigger wiring).\n- ST-06 needs the endgame in place before the full art pass; ST-07 tunes the\n  finale's difficulty (altered context, not maxed damage - section 39).\n\n## Constraints and non-goals\n\n- No HP-bar leviathan, no conventional boss arena (sections 1.5, 24).\n- The final challenge comes from altered rules/context (section 39).\n- Ending logic stays in the simulation; the browser only presents the final\n  state/shot/text.\n- Plan nodes never describe the mechanism; the private files are the source\n  of truth and stay out of these artifacts (sections 0, 12, 68).\n\n## Fresh-session handoff for the expander\n\nRead request sections 1.5, 22, 23, 24, 25, 39, 45, 70 (Ending checklist) and\nST-03/ST-04 bodies. The expander reads the private MacGuffin decision from\nthe creative pass and keeps it referenced by id only.\n",
      "fingerprint": "c9934afaa3f0724baec9d53c0e033c6f472692a7b0a6460bbecea7e7f4b9656d",
      "base_rev": "894c5396cebeba12ba5af80918e0e6cee5ea145a",
      "children": [],
      "review_path": "C:\\Temp\\hadal-v2\\agents\\tasks\\hadalv2\\planning\\reviews\\ST-05.json"
    }
  },
  "context": {
    "inherit": false,
    "include": [],
    "exclude": []
  },
  "capabilities": {}
}