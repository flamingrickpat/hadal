{
  "parent_task_id": "hadalv2",
  "parent_phase": "plan_node",
  "configured_task_id": "hadalv2.plan_node",
  "input": {
    "selection": {
      "id": "WI-05c",
      "root_task_dir": "C:\\Temp\\hadal-v2\\agents\\tasks\\hadalv2",
      "path": "agents/tasks/hadalv2/stories/ST-WI-05c/plan.md",
      "specification": "---\nid: WI-05c\nkind: story\nparent: ST-05\nchildren: [\"WI-05ca\", \"WI-05cb\"]\ndepends_on: [\"WI-05b\"]\ncriteria:\n  AC-end-variants: \"At least 2 ending variants are reachable from a single player decision, each producing a different final state, text, or shot, with credits and restart working\"\nbehavior: \"Implement at least 2 ending variants branched from a single player decision inside the final sequence, the section-25 autosave schema extension (versioned migration, pre-descent and post-trigger points), and the full headless ending verification (one-shot trigger, save-reload at each milestone, restart, credits)\"\nsubsystems: [\"save system\", \"simulation rules\", \"headless scenario tests\"]\nverification: \"Full fresh-save headless scenario: reach the final site, retrieve the MacGuffin, observe the changed return journey, enter the final sequence, make the player decision, trigger each of the 2+ ending variants, assert each produces a different final state/text/shot, reload at each milestone and continue, verify duplicate-trigger prevention, verify credits and restart work\"\n---\n\n# WI-05c — Ending variants, save milestones, and ending verification\n\n## Why this shape (review split)\n\nThe review split this work item (two independently testable behaviors):\n(1) ending-variant simulation rules and (2) the save-schema extension.\nThe save migration is testable in isolation without any ending logic; the\nending branching is testable with in-memory state without the save system.\nThis story preserves the original scope and now decomposes it:\n\n- WI-05ca: ending-variant simulation rules (decision branches to 2+ endings,\n  one-shot trigger, credits flag, restart) and the full headless ending\n  verification as final proof owner. Subsystems: simulation rules, headless\n  scenario tests.\n- WI-05cb: save-schema extension (version bump, trivial migration,\n  pre-descent and post-trigger autosave points per section 25). Subsystems:\n  save system, headless scenario tests.\n\n## Criteria assignment and proof ownership\n\nAC-end-variants is the sole parent criterion. Both children carry it\nverbatim; WI-05ca is the named final proof owner (the full fresh-save\nending scenario with save-reload at each milestone).\n\n- WI-05ca: proves the decision branches to different final states, the\n  one-shot trigger, credits, and restart; consumes WI-05cb's autosave\n  points for the save-reload integration proof.\n- WI-05cb: proves the schema migration loads pre-extension saves correctly,\n  and that pre-descent/post-trigger autosave points persist and restore\n  endgame state.\n\n## Dependency notes\n\n- The story depends on WI-05b (the final sequence and win condition).\n- WI-05cb depends on WI-05b (the milestones bracket the final sequence).\n- WI-05ca depends on WI-05b (the decision point is inside the final\n  sequence) and on WI-05cb (the integration scenario uses the autosave\n  points for save-reload at each milestone).\n\n## Constraints and non-goals\n\n- No art/audio polish (ST-06). No balance tuning (ST-07).\n- The ending text content and shot specifics are private (WI-01c); the sim\n  stores text ids and shot ids, the browser renders them. Plan nodes and\n  commit messages never quote the ending content.\n- One ending variant is the section 72 cut candidate; both must be\n  implemented and tested, but one can be removed later without breaking\n  the other.\n- Spoiler rules (sections 0, 12, 68): commit style \"implemented two\n  ending variants and save milestones\" (no ending names, no mechanism\n  details).\n\n## Fresh-session handoff\n\nRead ST-05/plan.md, request sections 23, 24, 25, 39, 45, 70, WI-01c\n(private ending content, by id only), WI-05a (retrieval and post-retrieval\nstate), WI-05b (the final sequence and win condition), and `src/game/save.ts`\n(existing versioned save structure). The decision point is inside WI-05b's\nfinal sequence; the save extension wraps the sequence's milestones.\n",
      "fingerprint": "2b72d95fd5b71d47e5bca7d2e0353404e76293842b07176406b052f0e03b74f1",
      "base_rev": "ce58f5a50f40ca220395e18d838b3aaa537f079b",
      "children": [
        {
          "id": "WI-05ca",
          "path": "C:\\Temp\\hadal-v2\\agents\\tasks\\hadalv2\\stories\\ST-WI-05c\\workitems\\WI-05ca.md"
        },
        {
          "id": "WI-05cb",
          "path": "C:\\Temp\\hadal-v2\\agents\\tasks\\hadalv2\\stories\\ST-WI-05c\\workitems\\WI-05cb.md"
        }
      ],
      "review_path": "C:\\Temp\\hadal-v2\\agents\\tasks\\hadalv2\\planning\\reviews\\WI-05c.json"
    }
  },
  "context": {
    "inherit": false,
    "include": [],
    "exclude": []
  },
  "capabilities": {}
}