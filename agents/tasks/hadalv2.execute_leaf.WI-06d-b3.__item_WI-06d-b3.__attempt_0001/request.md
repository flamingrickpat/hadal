{
  "parent_task_id": "hadalv2",
  "parent_phase": "execute_leaf",
  "configured_task_id": "hadalv2.execute_leaf.WI-06d-b3.__item_WI-06d-b3",
  "input": {
    "selection": {
      "id": "WI-06d-b3",
      "root_task_dir": "C:\\Temp\\hadal-v2\\agents\\tasks\\hadalv2",
      "parent": "WI-06d-b",
      "path": "agents/tasks/hadalv2/stories/ST-WI-06d-b/workitems/WI-06d-b3.md",
      "specification": "---\nid: WI-06d-b3\nkind: work_item\nparent: WI-06d-b\nchildren: []\ndepends_on: [\"WI-06a\", \"WI-06b\", \"WI-06c\"]\ncriteria:\n  AC-art-geometry: \"Obvious debug geometry is replaced in all critical-path areas and the section 48 juice list (bubbles, silt, light sway, depth-record tick, distant-motion impulse, parting schools) is present\"\n  AC-juice-depthtick: \"A HUD-adjacent cue in src/ui/hud.ts fires exactly when the player sets a new depth record, using only the depth comparison already in the sim\"\nbehavior: \"Add the depth-record tick: a HUD-adjacent one-shot cue firing when the player sets a new depth record\"\nsubsystems: [\"ui - hud cue\"]\nverification: \"Node/scenario test proves the cue fires exactly on a new depth record and not otherwise; browser clip or screenshot of the tick cue firing in-band; headless suite and build stay green\"\n---\n\n# WI-06d-b3 — Depth-record tick\n\n## Goal\n\nAdd the section 48 depth-record tick: a small HUD-adjacent cue (a\nvisual tick / blip on the depth readout) that fires when the player\nsets a new depth record. Presentation only — the depth comparison and\nrecord state already live in the simulation; this item only watches\nthat state and shows the cue.\n\n## Changed responsibilities (the only owners that change)\n\n1. `src/ui/hud.ts` — the depth readout area: a one-shot cue seam that\n   reads the sim's depth-record state each frame and fires the cue\n   exactly when a new record is set (no new gameplay logic, no new sim\n   rules).\n\nThat is the single implementation owner. Tests for it do not count as\nan additional responsibility. If the sim does not yet expose a\nreadable \"new record just set\" signal, add a read-only accessor in the\nsimulation — that accessor is the second allowed owner, and it must\nchange no behavior.\n\n## Deliverables (checkable)\n\n- Cue fires exactly once per new depth record, is restrained in size\n  and duration (HUD-adjacent, section 14.3 readability), and reads the\n  existing record state only.\n\n## Tests\n\n- Node/scenario: set a new depth record via the shared scenario\n  harness — the cue state flips once; swimming shallower or equal\n  depth does not re-fire.\n- Browser (local proof): clip or screenshot of the tick cue firing in\n  an early band (no spoiler exposure). The final proof owner of the\n  AC-art-geometry juice-part browser union is WI-06d-b6 — do not\n  re-assert the six-effect union here.\n\n## Constraints, assumptions, non-goals\n\n- No gameplay logic beyond the depth comparison already in the sim;\n  no new sim state, no new content.\n- No particle (WI-06d-b1), lighting (WI-06d-b2), camera\n  (WI-06d-b4) or school (WI-06d-b5) changes; no audio (WI-06e will\n  own any sound for this moment).\n- The a11y reduced-flashing toggle (WI-06g) will gate this cue\n  downstream; design the cue so a single boolean can suppress it.\n- Spoiler rules (sections 0, 12, 68, 70): record with early bands or\n  private fixtures and internal ids only.\n\n## Fresh-session handoff\n\nRead WI-06d-b/plan.md (story scope and proof ownership). Inspect\n`src/ui/hud.ts` for the depth readout and its sim access, and locate\nthe existing depth-record comparison/state in the simulation\n(`src/sim/`). Request sections: 14.3, 35, 48, 70.\n",
      "fingerprint": "0d0fae71c6641d636e86fe4fb3ed65852d3e5ea64b8803bbd9d17cf93e713ffa",
      "base_rev": "078a82bff9050b54db23dfd6b155790ed78ea422",
      "children": [],
      "review_path": "C:\\Temp\\hadal-v2\\agents\\tasks\\hadalv2\\planning\\reviews\\WI-06d-b3.json"
    }
  },
  "context": {
    "inherit": false,
    "include": [],
    "exclude": []
  },
  "capabilities": {}
}