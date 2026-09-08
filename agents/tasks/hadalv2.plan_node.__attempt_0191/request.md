{
  "parent_task_id": "hadalv2",
  "parent_phase": "plan_node",
  "configured_task_id": "hadalv2.plan_node",
  "input": {
    "selection": {
      "id": "ST-01",
      "root_task_dir": "C:\\Temp\\hadal-v2\\agents\\tasks\\hadalv2",
      "path": "agents/tasks/hadalv2/stories/ST-01/plan.md",
      "specification": "---\nid: ST-01\nkind: story\nparent: null\nchildren: [\"WI-01a\", \"WI-01b\", \"WI-01c\"]\ndepends_on: []\ncriteria:\n  AC-cp-world: \"design_private/ holds three substantially different hidden-world interpretations, a written critique of each against the section 12 step B axes, and one selected world that hybridizes a single mechanism from a rejected candidate\"\n  AC-cp-roster: \"design_private/ holds at least 30 scored rough creature concepts and a selected roster of 18-24 organisms, each major organism carrying private written answers to the 10-question section 11.3 rubric\"\n  AC-cp-mapping: \"design_private/ assigns creature reveals and lore clues to the 90-120 minute pacing timeline, defines 3-5 recurring motifs, and fixes the MacGuffin truth and at least two ending variants\"\n  AC-cp-spoiler: \"design_private/ stays out of the public surface, and no plan artifact, commit message, screenshot, or progress report names deep creatures, the lore truth, the MacGuffin, or the endings\"\nbehavior: \"Private section 12 creative pass: invent the hidden world, the creature roster, the reveal mapping, the motifs, the MacGuffin, and the endings inside the repository without exposing them in any public surface\"\nsubsystems: [\"private design documentation\"]\nverification: \"A review session reads the design_private/ files against the section 12 steps A through G and confirms the spoiler boundary holds across commits and artifacts\"\n---\n\n# ST-01 — Private creative pass (request section 12)\n\n## Goal\n\nProduce the hidden design payload every later story consumes: the selected\nworld, the scored roster, the reveal/encounter map, the motifs, and the\nMacGuffin plus ending decisions. Output lives in `design_private/`\n(`world_candidates.md`, `creature_candidates.md`, `final_selected_world.md`,\n`encounter_beats.md`, `lore_truth.md`, `spoiler_map.md`) or, if gitignored\nfiles are inconvenient, in `src/content/secret/` under the same rules.\n\n## Why this shape\n\nSection 12 prescribes three sequential steps (worlds -> roster -> mapping),\nso the story is already split. Each child is a documentation behavior,\nindependently checkable, with no code. Spoiler containment is a shared\ncriterion across all three children; WI-01c is the named final proof owner for\nAC-cp-spoiler (it audits the whole folder at the end of the pass).\n\n## Decomposition (already applied)\n\n- WI-01a: three competing worlds, critique, hybridized selection (steps A-C).\n- WI-01b: 30+ rough creature concepts, scored, 18-24 selected, diversity\n  enforced (steps D-E).\n- WI-01c: reveal mapping on the pacing timeline, motifs, MacGuffin truth,\n  endings, final spoiler audit (steps F-G).\n\n## Constraints and non-goals\n\n- No product code, no rendering, no simulation changes in this story.\n- Nothing in these files, their commits, or reports may expose hidden content\n  (request sections 0, 12, 68). Keep this story's artifacts generic by design.\n- Do not write creatures into `worldData.ts`; that is ST-03's job.\n\n## Fresh-session handoff\n\nRead request sections 1, 2, 12, 37, 47, 51, 57, 74 for tone and rules. Read\n`understanding.md` for the baseline state. Work only inside\n`design_private/` (plus the `.gitignore` entry). Deliver the files named in\nthe children's bodies; reviewers will check structure and spoiler safety, not\ntaste.\n",
      "fingerprint": "a6ab592a2df77c916acf36ddbc12a49dc7892cd0baa10a3b78e5fd41d1c5ac2a",
      "base_rev": "52d884a9d6ba552224a799a2f44d68d162b0df59",
      "children": [
        {
          "id": "WI-01a",
          "path": "C:\\Temp\\hadal-v2\\agents\\tasks\\hadalv2\\stories\\ST-01\\workitems\\WI-01a.md"
        },
        {
          "id": "WI-01b",
          "path": "C:\\Temp\\hadal-v2\\agents\\tasks\\hadalv2\\stories\\ST-01\\workitems\\WI-01b.md"
        },
        {
          "id": "WI-01c",
          "path": "C:\\Temp\\hadal-v2\\agents\\tasks\\hadalv2\\stories\\ST-01\\workitems\\WI-01c.md"
        }
      ],
      "review_path": "C:\\Temp\\hadal-v2\\agents\\tasks\\hadalv2\\planning\\reviews\\ST-01.json"
    }
  },
  "context": {
    "inherit": false,
    "include": [],
    "exclude": []
  },
  "capabilities": {}
}