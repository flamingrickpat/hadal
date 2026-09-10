{
  "parent_task_id": "hadalv2",
  "parent_phase": "execute_leaf",
  "configured_task_id": "hadalv2.execute_leaf.WI-04c.__item_WI-04c",
  "input": {
    "selection": {
      "id": "WI-04c",
      "root_task_dir": "C:\\Temp\\hadal-v2\\agents\\tasks\\hadalv2",
      "parent": "ST-04",
      "path": "agents/tasks/hadalv2/stories/ST-04/workitems/WI-04c.md",
      "specification": "---\nid: WI-04c\nkind: work_item\nparent: ST-04\nchildren: []\ndepends_on: [\"WI-04a\", \"WI-04d\"]\ncriteria:\n  AC-enc-reactions: \"World-state reactions alter at least three earlier zones after major milestones through story flags and spawn-table changes\"\nbehavior: \"Add the section 60 flag-gated world-state reactions: after the authored milestones (beat completions from WI-04a, puzzle completions from WI-04d, return-through conditions), at least three earlier zones differ on return trips via story flags and spawn-table changes, kept cheap per section 60\"\nsubsystems: [\"trigger system\", \"world content data\", \"headless scenario tests\"]\nverification: \"Fresh-save scenarios that reach an authored milestone, physically return to at least three earlier zones, and assert the flag-gated changes (spawn-table deltas, ambient/light changes, fauna presence/absence, audio) are present after the milestone and absent before it; save round-trip persistence of the flags; final proof owner of AC-enc-reactions\"\n---\n\n# WI-04c — Flag-gated world-state reactions\n\n## Goal\n\nMake return trips different (section 60): after the authored milestones,\nearlier zones change subtly and cheaply - a few flags and spawn-table\nchanges, no new systems. Reactions gate on the completion flags WI-04a\n(beats) and WI-04d (puzzles) set, plus the existing `returnThrough`\ncondition, so every reaction is provable from a fresh save.\n\n## Deliverables (checkable)\n\n- At least three earlier zones (chosen so they sit on natural return\n  routes per the pacing timeline) each altered by one or more reactions\n  from the section 60 category list: new migration; fewer small animals;\n  changed industrial lights; debris shifted; friendly organism appears\n  near base; radio receives odd interference; deep sound audible in\n  shallows.\n- Each reaction is a trigger entry (story-flag gate, `spawnEntity` /\n  `despawnEntity` / `alterAmbient` / `playAudio` effects) plus the\n  corresponding spawn-table entry in the production world data; flags\n  persist through the existing save round-trip (the simulation already\n  shares `storyFlags` into the trigger state and the save).\n- Cheap by construction: no new world systems and no per-frame work beyond\n  the existing trigger evaluation - each reaction is data.\n\n## Tests (node, real simulation)\n\n- Per-reaction scenario from a fresh save: physical route to the authored\n  milestone, then physical return to the affected zone; assert the\n  changed state (spawn-table delta, ambient/light/audio change, fauna\n  presence or absence) after the milestone and the unchanged state before\n  it.\n- Save round-trip: save after the milestone, load, flags and their effects\n  persist.\n- Count check: at least three distinct earlier zones are altered.\n\n## Constraints, assumptions, non-goals\n\n- No content authorship beyond the reaction data itself: the \"radio\n  receives odd interference\" category is an audio/ambient cue here, not a\n  new message (new messages live in WI-04b's section 38 budget).\n- No balance changes (ST-07): reaction spawns stay within the section 34\n  ambient caps.\n- Depends on WI-04a and WI-04d for the milestone flags their scenarios\n  must hit; if the reveal map assigns a reaction to a plain\n  depth/return-through milestone, the dependencies still hold and the\n  gate simply uses the existing condition.\n- Section 61: reactions are flag-driven, never randomized.\n\n## Fresh-session handoff\n\nRead ST-04/plan.md, request sections 60, 61, 70, WI-04a and WI-04d (the\ncompletion flag names they set), and the existing flag plumbing in\n`src/world/triggers.ts` and `src/sim/Simulation.ts` (shared\n`storyFlags`). Which zones react to which milestone comes from the\nprivate reveal map, referenced by id only.\n",
      "fingerprint": "179b4daca851432f07cf1d6294ce53b1a00cc064b64a337f4946509b83e2f5e7",
      "base_rev": "45f04b8bd345ba8f4a7f6abd8cafc99972f1f076",
      "children": [],
      "review_path": "C:\\Temp\\hadal-v2\\agents\\tasks\\hadalv2\\planning\\reviews\\WI-04c.json"
    }
  },
  "context": {
    "inherit": false,
    "include": [],
    "exclude": []
  },
  "capabilities": {}
}