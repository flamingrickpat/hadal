{
  "parent_task_id": "hadalv2",
  "parent_phase": "execute_leaf",
  "configured_task_id": "hadalv2.execute_leaf.WI-04d.__item_WI-04d",
  "input": {
    "selection": {
      "id": "WI-04d",
      "root_task_dir": "C:\\Temp\\hadal-v2\\agents\\tasks\\hadalv2",
      "parent": "ST-04",
      "path": "agents/tasks/hadalv2/stories/ST-04/workitems/WI-04d.md",
      "specification": "---\nid: WI-04d\nkind: work_item\nparent: ST-04\nchildren: []\ndepends_on: []\ncriteria:\n  AC-enc-puzzles: \"3-5 environmental puzzle moments exist near the critical path and are completable headlessly through the scenario harness\"\nbehavior: \"Author 3-5 environmental puzzle moments near the critical path (section 66) as data-driven trigger and world-data compositions of existing simulation capabilities, each completable headlessly through the scenario harness and each setting a completion story flag consumed by WI-04c\"\nsubsystems: [\"trigger system\", \"world content data\", \"headless scenario tests\"]\nverification: \"One headless scenario per puzzle from a fresh save completing it through authored player inputs (interact, sonar, current riding, creature approach) and asserting the completion flag is set; puzzle-moment count check (3-5) and near-critical-path placement check; no abstract symbol panels (section 66); final proof owner of AC-enc-puzzles\"\n---\n\n# WI-04d — Environmental puzzle moments\n\n## Goal\n\nAuthor 3-5 environmental puzzle moments (section 66) near the critical\npath, placed per the private reveal map. Each puzzle is a composition of\nexisting simulation capabilities wired through the trigger system: sonar\nrevealing a hidden mechanism (`scanObject`), a current carrying an object\n(`CurrentSystem`), a restraint cut or two nodes connected via the existing\ninteract action, a path revealed or unlocked by sonar (`lockPath`), or a\ncreature lured by ST-03 behavior to touch the mechanism. No abstract\ncolored-symbol panels.\n\n## Deliverables (checkable)\n\n- 3-5 puzzle moments, each with: a physical approach on the critical path\n  (or its direct shoulder), a single readable environmental goal (no\n  tutorial text), and a completion that both changes the world (unlocked\n  path, moved object, altered state) and sets one completion story flag\n  (`setStoryFlag`) consumed by WI-04c.\n- Puzzle mechanics composed from existing sim capabilities; puzzle props\n  are world-data entries (objects, nodes, restraints, currents) - not new\n  renderer classes.\n- Completable blind (section 39 spirit): every required affordance is\n  visible in the scene; no hidden inputs, no guessing.\n\n## Tests (node, real simulation, no mocks of the rules)\n\n- One scenario per puzzle via `src/sim/scenario.ts` from a fresh save:\n  drive the authored inputs (thrust, interact, sonar, current riding)\n  headlessly, assert the puzzle state completes and the completion flag is\n  set; a no-solution control (inputs omitted) stays incomplete.\n- Count and placement check: 3-5 moments, each reachable near the\n  critical path per the scenario routes.\n\n## Constraints, assumptions, non-goals\n\n- Assumption: the reveal map's chosen puzzle types compose from existing\n  capabilities (sonar, currents, interact, `lockPath`, ST-03 creature\n  states). Falsified if a chosen type needs a new sim rule (e.g. physical\n  buoyancy after cutting a restraint): then report the gap through the\n  normal fix-planning route before touching the sim core - do not silently\n  add rules here.\n- No puzzle UI, no symbol logic, no colored panels (section 66).\n- No critical-gate or final-path randomization (section 61): a puzzle's\n  consequence (unlock, moved object) is authored and deterministic;\n  whether it gates a branch follows the reveal map.\n\n## Fresh-session handoff\n\nRead ST-04/plan.md, request sections 36, 39, 61, 66, 70, WI-01c's reveal\nmap (puzzle slots by id only) and the existing interaction surface\n(interact handling, `CurrentSystem`, `SonarSystem` in\n`src/sim/Simulation.ts`). WI-04c consumes the completion flag names this\nitem defines.\n",
      "fingerprint": "28c39bff2e3668402fab6096446c10a03c83efcce768fcf67a18672149c6038d",
      "base_rev": "5136cfa6e6183df3c375a4feade3025d86969fed",
      "children": [],
      "review_path": "C:\\Temp\\hadal-v2\\agents\\tasks\\hadalv2\\planning\\reviews\\WI-04d.json"
    }
  },
  "context": {
    "inherit": false,
    "include": [],
    "exclude": []
  },
  "capabilities": {}
}