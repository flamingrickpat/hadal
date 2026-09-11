{
  "parent_task_id": "hadalv2",
  "parent_phase": "execute_leaf",
  "configured_task_id": "hadalv2.execute_leaf.WI-06d-c-b.__item_WI-06d-c-b",
  "input": {
    "selection": {
      "id": "WI-06d-c-b",
      "root_task_dir": "C:\\Temp\\hadal-v2\\agents\\tasks\\hadalv2",
      "parent": "WI-06d-c",
      "path": "agents/tasks/hadalv2/stories/ST-WI-06d-c/workitems/WI-06d-c-b.md",
      "specification": "---\nid: WI-06d-c-b\nkind: work_item\nparent: WI-06d-c\nchildren: []\ndepends_on: [\"WI-06a\", \"WI-06b\", \"WI-06c\"]\ncriteria:\n  AC-widescreen: \"Widescreen composition holds on widescreen aspect ratios without letterboxed dead zones per section 16\"\nbehavior: \"Land the section 16 widescreen composition: the scene composition adapts to widescreen aspect ratios (e.g. 21:9, 32:9) without letterboxed dead zones\"\nsubsystems: [\"camera - widescreen composition\"]\nverification: \"Node unit tests pass for the widescreen layout params (aspect ratio breakpoints, composition offsets); browser (final proof): at a wide aspect ratio (e.g. 21:9) the composition holds — no letterboxed dead zones, the scene fully visible and correctly framed; headless suite and build stay green\"\n---\n\n# WI-06d-c-b — Section 16 widescreen composition\n\n## Goal\n\nLand the section 16 widescreen behavior: composition holds on\nwidescreen aspect ratios (e.g. 21:9, 32:9) without letterboxed dead\nzones — the scene composition adapts rather than pillarboxing. This\nis a composition/framing behavior of the 3D scene, not a UI layout\ntask.\n\n## Changed responsibilities (the only owners that change)\n\n1. The widescreen layout params — a pure-data module (aspect ratio\n   breakpoints and composition offsets per breakpoint) next to the\n   camera/render data in `src/render/`, Node-testable without a\n   browser.\n2. The camera transform's widescreen seam — the existing camera\n   transform code (`src/render/`) applies the composition offsets so\n   the scene frames correctly at each widescreen breakpoint instead\n   of pillarboxing.\n\nTests for these owners (unit tests for the layout params) do not\ncount as additional responsibilities.\n\n## Deliverables (checkable)\n\n- Widescreen layout params: aspect ratio breakpoints (e.g. 21:9,\n  32:9) and the composition offsets for each, as pure data.\n- The camera transform applies them: at wide aspect ratios the scene\n  composition adapts — no letterboxed dead zones, the scene is fully\n  visible and correctly framed.\n- Baseline aspect ratios keep their current framing behavior.\n\n## Tests\n\n- Node: unit tests for the widescreen layout params (breakpoints\n  resolve to the expected composition offsets; baseline aspects\n  unchanged). Suite and build stay green.\n- Browser (final proof owner of AC-widescreen): widescreen check at\n  a wide aspect ratio (e.g. 21:9) in a settled band scene —\n  composition holds, no letterboxed dead zones, the scene is fully\n  visible and correctly framed. Record the wide-aspect capture.\n\n## Constraints, assumptions, non-goals\n\n- Composition/framing only: the HUD and overlays adapt via the\n  existing responsive patterns; this item ensures the 3D scene\n  composition holds.\n- No shake work (WI-06d-c-a), no juice effects (WI-06d-b), no\n  geometry replacement (WI-06d-a).\n- No new gameplay rules, no steering or balance changes, no new content.\n- Spoiler rules (sections 0, 12, 68, 70): late-game areas are\n  recorded with private fixtures and internal ids only.\n\n## Fresh-session handoff\n\nRead WI-06d-c/plan.md (story scope, criteria assignment, proof\nownership), WI-06d/plan.md and ST-06/plan.md for context, and\nrequest section 16 (widescreen behavior). Inspect the existing camera\ntransform code in `src/render/` for the widescreen composition seam.\nDo not start before WI-06a/b/c are accepted (the widescreen behavior\nmust work in the settled band scenes).\n",
      "fingerprint": "00fa5227b3744a619684c53282c12e42bdeec6e171c9ee6219b625c8318b21f9",
      "base_rev": "fa991bfbe9c4159ec38133b857de2f9f344f5795",
      "children": [],
      "review_path": "C:\\Temp\\hadal-v2\\agents\\tasks\\hadalv2\\planning\\reviews\\WI-06d-c-b.json"
    }
  },
  "context": {
    "inherit": false,
    "include": [],
    "exclude": []
  },
  "capabilities": {}
}