{
  "parent_task_id": "hadalv2",
  "parent_phase": "plan_node",
  "configured_task_id": "hadalv2.plan_node",
  "input": {
    "selection": {
      "id": "WI-02a",
      "root_task_dir": "C:\\Temp\\hadal-v2\\agents\\tasks\\hadalv2",
      "path": "agents/tasks/hadalv2/stories/ST-02/workitems/WI-02a.md",
      "specification": "---\nid: WI-02a\nkind: work_item\nparent: ST-02\nchildren: []\ndepends_on: []\ncriteria:\n  AC-cf-core: \"A headless Creature runtime with steering, WorldSignalBus sense subscription, a generic state machine, and bespoke controller hooks advances inside the existing fixed-step simulation, with node unit tests covering senses, state transitions, and offscreen throttling\"\nbehavior: \"Implement the headless Creature runtime (definition schema, steering, sense subscription on the existing WorldSignalBus, generic state machine, bespoke controller hook) advanced by the fixed-step simulation, with unit tests\"\nsubsystems: [\"creature simulation\"]\nverification: \"Run the node unit tests for steering, sense channels, state transitions, and offscreen throttling; run a short node scenario where a test organism reacts to a bus signal\"\n---\n\n# WI-02a — Headless creature simulation core\n\n## Goal\n\nAdd the creature runtime to the simulation. New files under `src/creatures/`\n(`CreatureDef.ts`, `Creature.ts`, `steering.ts`, plus behavior extensions)\nwired into `src/sim/Simulation.ts` (`step`, line 177) so creatures advance on\nthe same fixed timestep as the player.\n\n## Deliverables (checkable)\n\n- `CreatureDef` schema per section 19 (id, body, movement, senses, behavior,\n  combat optional, ecology optional, audio) with audio as data the\n  simulation emits and the browser adapter consumes.\n- Sense primitives per section 19/63: distance vision, light, motion, noise,\n  sonar, line of sight, injury/blood events - creatures subscribe to\n  `WorldSignalBus` channels (`src/creatures/senses.ts:66`) and only evaluate\n  nearby recent signals, never reference the player directly.\n- Generic state machine (`idle`, `forage`, `wander`, `investigate`, `alert`,\n  `stalk`, `attack`, `flee`, `return`, `interact`, custom) plus a documented\n  hook for a bespoke per-species controller.\n- Movement in the simulation with drag model matching section 6; collision\n  via the existing `CollisionSystem` (circles; chain circles for long\n  bodies).\n- Offscreen throttling: AI deactivates beyond a world distance cap\n  (section 34), distance measured in world units, not screen edges\n  (section 16).\n- Two neutral placeholder organisms (a schooling type and a simple forager)\n  clearly marked as framework test fixtures.\n\n## Tests (node, real functions, no mocks of the rules)\n\n- Steering: desired-velocity vs drag behavior; boundary and terrain\n  avoidance through real collision.\n- Senses: each channel fires the right state transition for the right signal\n  strength/distance.\n- State machine: legal transitions; a bespoke controller can override.\n- Throttling: creatures beyond the cap do not tick; reactivation on\n  approach.\n\n## Constraints, assumptions, non-goals\n\n- No rendering in this item; the runtime is pure simulation state.\n- Assumption: the existing bus API is sufficient; if a signal type from\n  section 63 is missing, extend `senses.ts` rather than adding a parallel\n  bus. Falsified if the bus forces player-specific references.\n- No roster content; no creature audio synthesis (that is `AudioSystem`'s\n  existing job consuming sim events).\n\n## Fresh-session handoff\n\nRead request sections 6, 19, 28, 30, 31, 34, 63; `understanding.md` for the\nseam citations. Extend `src/sim/scenario.ts` usage for the reaction scenario\nrather than inventing a new harness.\n",
      "fingerprint": "c5b0d9ab445cb2edb2b7284012e58cf39781571b170aef1dfbeb0a457b1acc99",
      "base_rev": "4dd3ef1e41e9cc0c596e9a6599311b4ee96a6f5e",
      "children": [],
      "review_path": "C:\\Temp\\hadal-v2\\agents\\tasks\\hadalv2\\planning\\reviews\\WI-02a.json"
    }
  },
  "context": {
    "inherit": false,
    "include": [],
    "exclude": []
  },
  "capabilities": {}
}