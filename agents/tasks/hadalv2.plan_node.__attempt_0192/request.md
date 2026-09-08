{
  "parent_task_id": "hadalv2",
  "parent_phase": "plan_node",
  "configured_task_id": "hadalv2.plan_node",
  "input": {
    "selection": {
      "id": "ST-02",
      "root_task_dir": "C:\\Temp\\hadal-v2\\agents\\tasks\\hadalv2",
      "path": "agents/tasks/hadalv2/stories/ST-02/plan.md",
      "specification": "---\nid: ST-02\nkind: story\nparent: null\nchildren: [\"WI-02a\", \"WI-02b\", \"WI-02c\"]\ndepends_on: []\ncriteria:\n  AC-cf-core: \"A headless Creature runtime with steering, WorldSignalBus sense subscription, a generic state machine, and bespoke controller hooks advances inside the existing fixed-step simulation, with node unit tests covering senses, state transitions, and offscreen throttling\"\n  AC-cf-render: \"A reusable spine creature renderer plus small and rigid body renderers draw creature state from the simulation in the Three.js layer without changing gameplay rules\"\n  AC-cf-ecology: \"School behavior and cross-species reactions run headlessly through the world-signal bus and are verified by a node scenario\"\nbehavior: \"Build the data-driven creature framework (request sections 13, 19, 20, 63) as one behavior in the simulation and one rendering pass, attached to the existing WorldSignalBus seam rather than a parallel island\"\nsubsystems: [\"creature simulation\", \"procedural creature rendering\", \"world signal bus\", \"headless scenario tests\"]\nverification: \"Node unit tests for the runtime, a node scenario for schools and cross-species reactions, and a focused browser check that a test organism renders and animates without console errors\"\n---\n\n# ST-02 — Creature framework (request sections 13, 19, 20, 63)\n\n## Goal\n\nProvide the machinery ST-03 implements the secret roster on: a headless\ncreature runtime in the simulation, the procedural 2.5D renderers, and the\necology illusion. No secret species exist yet; this story ships with neutral\ntest organisms (a schooling organism and one simple forager) sufficient to\nprove the pipeline. Those placeholders are public-safe and may be reused or\nreplaced by ST-03.\n\n## Why this shape\n\nThe framework is three independently testable responsibilities: simulation\nbehavior (headless), rendering (browser), and the cross-species behavior\nlayer (headless, needs both to be visually meaningful). Splitting further\nwould fragment one behavior; this is the smallest useful decomposition.\n\n## Decomposition (already applied)\n\n- WI-02a: simulation core — Creature runtime, steering, senses via\n  `WorldSignalBus` (`src/creatures/senses.ts:66`), generic state machine,\n  bespoke controller hook, offscreen throttling.\n- WI-02b: rendering — spine renderer (section 13.2), small-creature and\n  rigid-hierarchy renderers (13.1/13.3), animation principles (13.5),\n  found-object attachment hook (13.4).\n- WI-02c: ecology illusion — schools, flee/scavenge/hide reactions,\n  zone-quiet-before-events, cross-species events driven by the bus\n  (section 20).\n\n## Dependency notes\n\nWI-02b depends on WI-02a (renders sim state). WI-02c depends on both\n(behavior is sim-side, proof is a scenario plus visible schools). ST-03\ndepends on this whole story.\n\n## Constraints and non-goals\n\n- No ECS framework, no general-purpose engine (section 28). A class plus\n  state machine, with 120-line bespoke controllers allowed where clearer\n  (section 19).\n- Keep gameplay rules (collision, senses, states, throttling) in the\n  simulation per section 30; the renderer only reads state.\n- No secret roster content; no names from the creative pass may appear in\n  code identifiers visible outside `src/content/secret/` (internal IDs are\n  fine per section 33).\n- Performance rules from section 34 apply from the first commit: pooled\n  particles, capped counts, no per-frame vector allocation in hot loops.\n\n## Fresh-session handoff\n\nRead request sections 13, 19, 20, 28, 30, 31, 34, 63 and\n`understanding.md` for the `WorldSignalBus` seam. Collision primitives exist\nin `src/systems/CollisionSystem.ts`; creatures use circles/capsule circle\nchains there. Reviewers check the three criteria; the placeholder organisms\nare explicitly labeled as fixtures in any scenario.\n",
      "fingerprint": "c86201954b72f96fca972c03bf93205d2754a3e3588203a6d658858599c0d15b",
      "base_rev": "e9ca525de94bf079b892bfd5a3469b5a1b93dc6e",
      "children": [
        {
          "id": "WI-02a",
          "path": "C:\\Temp\\hadal-v2\\agents\\tasks\\hadalv2\\stories\\ST-02\\workitems\\WI-02a.md"
        },
        {
          "id": "WI-02b",
          "path": "C:\\Temp\\hadal-v2\\agents\\tasks\\hadalv2\\stories\\ST-02\\workitems\\WI-02b.md"
        },
        {
          "id": "WI-02c",
          "path": "C:\\Temp\\hadal-v2\\agents\\tasks\\hadalv2\\stories\\ST-02\\workitems\\WI-02c.md"
        }
      ],
      "review_path": "C:\\Temp\\hadal-v2\\agents\\tasks\\hadalv2\\planning\\reviews\\ST-02.json"
    }
  },
  "context": {
    "inherit": false,
    "include": [],
    "exclude": []
  },
  "capabilities": {}
}