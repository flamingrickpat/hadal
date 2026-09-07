{
  "parent_task_id": "hadalv2",
  "parent_phase": "plan_node",
  "configured_task_id": "hadalv2.plan_node",
  "input": {
    "selection": {
      "id": "WI-01b",
      "root_task_dir": "C:\\Temp\\hadal-v2\\agents\\tasks\\hadalv2",
      "path": "agents/tasks/hadalv2/stories/ST-01/workitems/WI-01b.md",
      "specification": "---\nid: WI-01b\nkind: work_item\nparent: ST-01\nchildren: []\ndepends_on: [\"WI-01a\"]\ncriteria:\n  AC-cp-roster: \"design_private/ holds at least 30 scored rough creature concepts and a selected roster of 18-24 organisms, each major organism carrying private written answers to the 10-question section 11.3 rubric\"\n  AC-cp-spoiler: \"design_private/ stays out of the public surface, and no plan artifact, commit message, screenshot, or progress report names deep creatures, the lore truth, the MacGuffin, or the endings\"\nbehavior: \"Generate and score at least 30 rough creature concepts, select the 18-24 that form the secret roster, and enforce the distribution, anti-cliche, and diversity constraints\"\nsubsystems: [\"private design documentation\"]\nverification: \"Read design_private/creature_candidates.md; confirm 30+ scored concepts, a selected roster within 18-24, the section 11.1 minimums and distribution, per-organism rubric answers, and the section 47 principle coverage of at least eight\"\n---\n\n# WI-01b — Creature roster generation and selection\n\n## Goal\n\nWrite the roster privately. File: `design_private/creature_candidates.md`.\n\n## Deliverables (checkable)\n\n- At least 30 rough concepts, each scored 1-5 on: silhouette novelty,\n  ecological plausibility inside the selected world, gameplay distinction,\n  ease of procedural animation, surprise potential, cliché penalty.\n- The selected 18-24 with the section 11.1 distribution (ambient/schools,\n  useful/neutral, predators/territorial, huge set pieces, colossal\n  presences) and every listed minimum: two genuinely helpful species, one\n  dangerous-looking-but-safe, one harmless-with-a-second-behavior, one\n  non-chase predator, one wreck-repurposer, one living-landmark, one\n  never-fully-seen encounter, one presence felt through other fauna, one\n  exploitable ecosystem relationship, one scale-misread, one beautiful-not-\n  threatening, one architecture-bound lifecycle, at least one uncategorizable.\n- Written answers to the 10-question section 11.3 rubric for every major\n  organism (the implementer of ST-03 codes from these answers; weak answers\n  mean redesign, not patch).\n- Diversity gate: fewer than 25% of selected creatures may be summarized as a\n  swimming mouth that attacks the player; record the count.\n- Anti-cliche gate per section 11.2, including the ban on neon-blue\n  bioluminescence everywhere and on size-scaled normal fish.\n- Coverage record of at least eight section 47 principles.\n\n## Constraints, assumptions, non-goals\n\n- Depends on WI-01a: the roster must be ecologically plausible inside the\n  selected world; do not invent a second world to fit creatures.\n- Rendering feasibility: every selected organism must be drawable with the\n  section 13 toolbox (ShapeGeometry, spine renderer, rigid mesh hierarchies,\n  found-object attachment). Mark the intended renderer per organism.\n- No code. No names of selected organisms in the commit message; commit as\n  \"creative pass: roster (private)\".\n\n## Fresh-session handoff\n\nRead request sections 11, 13, 21, 46, 47, 52 and the selected world from\nWI-01a. The section 46 questions (shark-replacement test, \"just big\" test,\nfriendly-species test, evidence-before-explanation test) are the quality bar.\nReviewer checks counts, structure, and spoiler safety only.\n",
      "fingerprint": "e6d28bf589a27a096166969699a31ee0677302dbe9b6bd871ab0496d1391304e",
      "base_rev": "ac295155ac91dafb371029ecc0db7ec37ccf4b42",
      "children": [],
      "review_path": "C:\\Temp\\hadal-v2\\agents\\tasks\\hadalv2\\planning\\reviews\\WI-01b.json"
    }
  },
  "context": {
    "inherit": false,
    "include": [],
    "exclude": []
  },
  "capabilities": {}
}