{
  "parent_task_id": "hadalv2",
  "parent_phase": "execute_leaf",
  "configured_task_id": "hadalv2.execute_leaf",
  "input": {
    "selection": {
      "id": "WI-02b",
      "root_task_dir": "C:\\Temp\\hadal-v2\\agents\\tasks\\hadalv2",
      "path": "agents/tasks/hadalv2/stories/ST-02/workitems/WI-02b.md",
      "specification": "---\nid: WI-02b\nkind: work_item\nparent: ST-02\nchildren: []\ndepends_on: [\"WI-02a\"]\ncriteria:\n  AC-cf-render: \"A reusable spine creature renderer plus small and rigid body renderers draw creature state from the simulation in the Three.js layer without changing gameplay rules\"\nbehavior: \"Implement the procedural 2.5D creature renderers (spine renderer, small-body renderer, rigid hierarchy renderer, found-object attachment hook, non-periodic animation) that draw simulation state in the Three.js layer\"\nsubsystems: [\"procedural creature rendering\"]\nverification: \"Focused browser check: a test organism from the WI-02a scenario renders, animates, and follows its simulated spine with no console errors; node test asserts renderer output derives only from sim state\"\n---\n\n# WI-02b — Procedural creature rendering\n\n## Goal\n\nMake creatures look richer than sprites with cheap geometry, without moving\nany gameplay rule into the render layer. New files under `src/render/`\n(`creatureRender.ts`, `spineRenderer.ts`) reading creature state that\n`src/game/Game.ts` already syncs each frame.\n\n## Deliverables (checkable)\n\n- Spine renderer per section 13.2: head driven by the simulated position,\n  constrained nodes at fixed segment distance, body geometry from left/right\n  normals, attachment points for fins, plates, tendrils, lights, carried\n  debris, secondary appendages.\n- Small-creature renderer per section 13.1 (ShapeGeometry, polygon meshes,\n  translucent fins, outline lines, CanvasTexture masks, 3-8 segments).\n- Rigid/semi-rigid hierarchy renderer per section 13.3 with parts on\n  different time scales and bodies that can exceed screen bounds.\n- Found-object attachment hook per section 13.4: a creature can carry pieces\n  from the same geometry library as world wreckage.\n- Animation principles per section 13.5: noise modulation, pauses,\n  breathing/pumping cycles, asymmetric appendage motion, alert posture\n  changes; no pure sine-wave everything.\n- Lighting interplay per section 15: silhouettes readable in and out of the\n  player beam; large bodies readable as separately illuminated pieces.\n\n## Constraints, assumptions, non-goals\n\n- Pure render adapter: it reads sim state, writes nothing back (section 30).\n  If a visual needs sim data that does not exist yet, record it as a defect\n  for WI-02a rather than computing gameplay in the renderer.\n- Performance per section 34: moderate segment counts, reused geometries and\n  materials, no per-frame allocation in the render loop.\n- No secret roster organisms; the two WI-02a fixtures are the test subjects.\n- No audio in this item.\n\n## Fresh-session handoff\n\nRead request sections 13, 15, 34; `understanding.md` for the Game.update\nsync seam (`src/game/Game.ts:97`). The art-direction palette work is ST-06's\njob; keep materials neutral here. Browser evidence uses the shared browser\nharness, kept short and directed.\n",
      "fingerprint": "ca848ed3d2d0264356c5621297e3e332ff23f39871db75a011b0424e454c4c34",
      "base_rev": "92b89e55240b451861ba8fd903a91349cbb49087",
      "children": [],
      "review_path": "C:\\Temp\\hadal-v2\\agents\\tasks\\hadalv2\\planning\\reviews\\WI-02b.json"
    }
  },
  "context": {
    "inherit": false,
    "include": [],
    "exclude": []
  },
  "capabilities": {}
}