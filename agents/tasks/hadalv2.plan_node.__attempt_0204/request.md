{
  "parent_task_id": "hadalv2",
  "parent_phase": "plan_node",
  "configured_task_id": "hadalv2.plan_node",
  "input": {
    "selection": {
      "id": "ST-05",
      "root_task_dir": "C:\\Temp\\hadal-v2\\agents\\tasks\\hadalv2",
      "path": "agents/tasks/hadalv2/stories/ST-05/plan.md",
      "specification": "---\nid: ST-05\nkind: story\nparent: null\nchildren: [\"WI-05a\", \"WI-05b\", \"WI-05c\"]\ndepends_on: [\"ST-03\", \"ST-04\"]\ncriteria:\n  AC-end-mac: \"The MacGuffin is visually memorable in simple rendering, tied to at least 2 earlier environmental traces, retrievable through gameplay from a fresh save, and its retrieval changes the environment, creature behavior, or return journey\"\n  AC-end-seq: \"The final 5-10 minutes are mechanically different from the approach, the finale is not a conventional arena boss, and a headless scenario proves the ending trigger fires exactly once and the final sequence survives a save reload\"\n  AC-end-variants: \"At least 2 ending variants are reachable from a single player decision, each producing a different final state, text, or shot, with credits and restart working\"\nbehavior: \"Implement the MacGuffin and the non-arena endgame (request sections 23, 24) with the win condition, ending variants, and headless ending verification\"\nsubsystems: [\"simulation rules\", \"world content data\", \"save system\", \"headless scenario tests\"]\nverification: \"Headless scenario from fresh save: reach the final site, retrieve, observe the changed return journey, trigger each ending variant, reload at each milestone and continue; duplicate-trigger and restart checks per section 70\"\n---\n\n# ST-05 — MacGuffin and endgame\n\n## Goal\n\nDeliver the MacGuffin, the non-arena endgame sequence, and the ending\nvariants: the game becomes completable (section 45 first criterion) without\nconsole commands. The MacGuffin's true nature and the exact final mechanism\nare private (sections 0, 12, 68); plan nodes and code reference them by id\nonly. The final 5-10 minutes are mechanically different from the approach\n(section 23); the challenge comes from altered rules/context, not maxed\nnumerical damage (section 39).\n\n## Why this shape (review split)\n\nThe review split this empty story (7 distinct deliverable behaviors). Each\nchild carries exactly one parent criterion and at most three named changed\nresponsibilities:\n\n- WI-05a: MacGuffin content and retrieval mechanics in the simulation.\n  Ties to at least 2 earlier environmental traces from WI-04b's delivered\n  foreshadow work; retrieval changes environment/creature behavior/return\n  journey.\n- WI-05b: the final descent sequence (altered rules, instruments, escape)\n  with the section-45 win condition. Not a conventional arena boss; the\n  no-arena/no-HP-bar constraint is owned here.\n- WI-05c: at least 2 ending variants from a single player decision, the\n  section-25 save milestones (autosave schema extension, pre-descent and\n  post-trigger points), and the one-shot trigger + restart verification.\n\n## Criteria assignment and proof ownership\n\nChildren carry parent criteria verbatim; the union covers all three.\n\n- AC-end-mac: WI-05a alone. Final proof owner: WI-05a — headless scenario\n  from fresh save: reach the MacGuffin, retrieve it, assert the\n  environmental/creature/return-journey change is present in sim state;\n  assert at least 2 earlier traces (from WI-04b) reference the MacGuffin.\n- AC-end-seq: WI-05b alone. Final proof owner: WI-05b — headless scenario\n  enters the final sequence, proves mechanical difference from the approach,\n  asserts the ending trigger fires exactly once, per-step save reload\n  continues correctly.\n- AC-end-variants: WI-05c alone. Final proof owner: WI-05c — full\n  fresh-save scenario (reach, retrieve, changed return, both variants,\n  reload at each milestone, restart); section 70 duplicate-trigger and\n  restart checks.\n\n## Dependency notes\n\n- The story depends on ST-03 (final-zone fauna and the species that may help\n  or hinder) and ST-04 (final-zone approach content, last foreshadow traces,\n  trigger wiring).\n- WI-05a is independent of the other ST-05 children; it needs only ST-03 and\n  ST-04 delivered.\n- WI-05b depends on WI-05a: the final sequence is gated on the MacGuffin\n  having been retrieved (the retrieval triggers the altered context).\n- WI-05c depends on WI-05b: the ending variants branch from a decision\n  inside the final sequence; the save milestones bracket the sequence.\n- ST-06 needs the endgame in place before the full art pass; ST-07 tunes\n  the finale's difficulty (altered context, not maxed damage - section 39).\n  Both depend on ST-05, which now means all three leaves.\n\n## Constraints and non-goals\n\n- No HP-bar leviathan, no conventional boss arena (sections 1.5, 24).\n- The final challenge comes from altered rules/context (section 39).\n- Ending logic stays in the simulation; the browser only presents the final\n  state/shot/text.\n- Plan nodes never describe the mechanism; the private files are the source\n  of truth and stay out of these artifacts (sections 0, 12, 68).\n- The MacGuffin's nature comes from the private creative pass (WI-01c);\n  referenced by id only.\n- One variant is the section 72 cut candidate; the other is retained.\n\n## Fresh-session handoff (for reviewers of the children)\n\nEach child stands alone with its frontmatter plus this story. Read request\nsections 1.5, 22, 23, 24, 25, 39, 45, 70 (Ending checklist) and ST-03/ST-04\nbodies. The private MacGuffin decision and endgame mechanism come from WI-01c\nand are referenced by id only.\n",
      "fingerprint": "6a8550deebf82f83f6aadf2ee3d70a2fbc8aa02e5a2e74fe93e7d000b08442b1",
      "base_rev": "55e0364d8063f6c3a75c1bc1089c2d3535fec4ed",
      "children": [
        {
          "id": "WI-05a",
          "path": "C:\\Temp\\hadal-v2\\agents\\tasks\\hadalv2\\stories\\ST-05\\workitems\\WI-05a.md"
        },
        {
          "id": "WI-05b",
          "path": "C:\\Temp\\hadal-v2\\agents\\tasks\\hadalv2\\stories\\ST-05\\workitems\\WI-05b.md"
        },
        {
          "id": "WI-05c",
          "path": "C:\\Temp\\hadal-v2\\agents\\tasks\\hadalv2\\stories\\ST-WI-05c\\plan.md"
        }
      ],
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