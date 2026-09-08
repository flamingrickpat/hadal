{
  "parent_task_id": "hadalv2",
  "parent_phase": "plan_node",
  "configured_task_id": "hadalv2.plan_node",
  "input": {
    "selection": {
      "id": "WI-06d-b",
      "root_task_dir": "C:\\Temp\\hadal-v2\\agents\\tasks\\hadalv2",
      "path": "agents/tasks/hadalv2/stories/ST-WI-06d-b/plan.md",
      "specification": "---\nid: WI-06d-b\nkind: story\nparent: WI-06d\nchildren: [\"WI-06d-b1\", \"WI-06d-b2\", \"WI-06d-b3\", \"WI-06d-b4\", \"WI-06d-b5\", \"WI-06d-b6\"]\ndepends_on: [\"WI-06a\", \"WI-06b\", \"WI-06c\"]\ncriteria:\n  AC-art-geometry: \"Obvious debug geometry is replaced in all critical-path areas and the section 48 juice list (bubbles, silt, light sway, depth-record tick, distant-motion impulse, parting schools) is present\"\n  AC-art-palettes: \"Every depth band has a distinct palette family, particle profile, light attenuation, and background silhouette in the browser, with the section 14.1 graphic-novel/sonar/cut-paper hybrid reading at 1080p\"\nbehavior: \"Implement the six section 48 juice effects (bubbles, silt, light sway, depth-record tick, distant-motion impulse, parting schools) by extending the section 35 effects toolbox, and record the cross-band contrast walk proving every band is distinct\"\nsubsystems: [\"rendering - particle toolbox\", \"rendering - band lighting and postfx\", \"ui - hud cue\", \"rendering - camera nudge and impulse flag\", \"rendering - school render path\", \"rendering - verification and evidence\"]\nverification: \"Each juice effect triggered and recorded in the browser; cross-band contrast walk recording per band that palette family, particle profile, light attenuation and background silhouette are each distinct between adjacent bands (at least two identity factors) with the section 14.1 hybrid reading at 1080p; headless suite and build stay green; performance spot-check per section 34\"\n---\n\n# WI-06d-b — Section 48 juice effects and cross-band contrast walk (story)\n\n## Goal\n\nImplement the six section 48 juice effects by extending the existing\nsection 35 effects toolbox in `src/render/` (particles, postfx, sonar) —\ndo not rebuild it. The six effects: bubbles, silt, light sway,\ndepth-record tick, distant-motion impulse, and parting schools. After\nall six are in, record the cross-band contrast walk proving every band\nis distinct in at least two identity factors with the section 14.1\nhybrid reading at 1080p.\n\n## Why this shape (review split)\n\nThe review found seven independently testable behaviors bundled in one\nleaf, touching at least five distinct implementation responsibilities\n(particle toolbox, postfx path, `src/ui/hud.ts` cue seam, camera nudge\nplus the WI-06d-c impulse flag, school render-split path) — over the\nthree-responsibility limit. Each child below owns one behavior and\nchanges a strict subset of the parent's responsibilities:\n\n- WI-06d-b1: bubbles and silt juice particles on the particle toolbox.\n  Subsystems: rendering - particle toolbox.\n- WI-06d-b2: light sway in the section 35 band-lighting/postfx path.\n  Subsystems: rendering - band lighting and postfx.\n- WI-06d-b3: the depth-record tick HUD cue.\n  Subsystems: ui - hud cue.\n- WI-06d-b4: the distant-motion impulse (camera nudge + the\n  presentation flag WI-06d-c's shake path gates).\n  Subsystems: rendering - camera nudge and impulse flag.\n- WI-06d-b5: parting schools (render split only, no steering changes).\n  Subsystems: rendering - school render path.\n- WI-06d-b6: the cross-band contrast walk and the final browser proof.\n  Subsystems: rendering - verification and evidence.\n\n## Criteria assignment and proof ownership\n\nChildren retain the parent criteria verbatim; their union covers both:\n\n- AC-art-geometry (juice part only — the geometry part is owned by\n  WI-06d-a): all six children retain it. WI-06d-b1..b5 each carry\n  child-local criteria for their own effect plus their own local\n  browser clip. WI-06d-b6 is the final proof owner of the juice-part\n  browser union: after all six effects are in, it re-triggers and\n  records all six together, so \"the section 48 juice list is present\"\n  is proven once, end to end.\n- AC-art-palettes: retained by WI-06d-b6 only — the cross-band walk\n  (per band: palette family, particle profile, light attenuation,\n  background silhouette each distinct between adjacent bands, at least\n  two identity factors, section 14.1 hybrid reading at 1080p) is\n  recorded there. No other child re-asserts this union. The walk's\n  particle-profile factor depends on the per-band juice particles of\n  WI-06d-b1, which is why WI-06d-b6 depends on all effect children.\n- Child-local (WI-06d-b6): AC-perf-walk adds the section 34\n  performance spot-check (frame rate recorded during the cross-band\n  walk; no band drops below the section 34 budget) as focused\n  verification; it does not replace a parent criterion.\n\n## Dependency notes\n\n- The story depends on WI-06a, WI-06b, WI-06c: the juice must be tuned\n  against the settled band look, and the cross-band contrast walk needs\n  all three band passes complete.\n- WI-06d-b1..b5 inherit depends_on: [WI-06a, WI-06b, WI-06c] and are\n  parallel with respect to each other.\n- WI-06d-b6 additionally depends on WI-06d-b1..b5: it records the\n  union only after every juice effect exists.\n- The existing WI-06d-c dependency on WI-06d includes this story:\n  WI-06d-c's shake path gates the presentation flag WI-06d-b4 creates;\n  WI-06d-c's reduced-flashing toggle (from WI-06g) gates the impulse\n  sources implemented here. Integration proof of the flag->shake\n  interplay is owned by WI-06d-c, not by this story.\n- The existing WI-06g dependency on WI-06d includes this story: its\n  reduced-flashing toggle gates the impulse/cue sources WI-06d-b3 and\n  WI-06d-b4 implement.\n\n## Constraints and non-goals\n\n- Extend, do not rebuild: the section 35 toolbox (particles, postfx,\n  sonar) is the foundation. New effects are extensions, not rewrites.\n- Restraint: juice must not hurt readability at 1080p in motion\n  (section 14.3) or break the section 34 budgets.\n- No audio changes (WI-06e), no map (WI-06f), no a11y UI (WI-06g) —\n  only the presentation flag and HUD-adjacent cue seams they will\n  consume.\n- No new gameplay rules, no steering or balance changes, no new content.\n- The distant-motion impulse feeds the presentation flag WI-06d-c's\n  shake path reads; WI-06d-b4 implements the trigger and the nudge,\n  not the low-frequency gate or the amplitude budget (WI-06d-c).\n- Spoiler rules (sections 0, 12, 68, 70): late-game areas are recorded\n  with private fixtures and internal ids only.\n\n## Fresh-session handoff\n\nRead WI-06d/plan.md (story scope; criteria assignment; this story owns\nthe juice part of AC-art-geometry and the AC-art-palettes cross-band\nwalk), ST-06/plan.md, request sections 14.1, 14.3, 34, 35, 48, 70.\nInspect `src/render/` (particles, postfx, lighting, sonar) for the\nsection 35 toolbox extension points, `src/ui/hud.ts` for the\ndepth-record cue seam, and the school render path in the ST-02/ST-03\ncreature renderer for the parting-schools split. Read the three band\nitems (WI-06a, WI-06b, WI-06c) for the settled per-band look the juice\nmust complement.\n",
      "fingerprint": "126e2fbccde0e1a15b6bfeb2fee40933b0d30f4b9ab4c1938c0d5bcdb3b2524e",
      "base_rev": "be0859f5802af13b7d96864bd0f8bf640a6a56da",
      "children": [
        {
          "id": "WI-06d-b1",
          "path": "C:\\Temp\\hadal-v2\\agents\\tasks\\hadalv2\\stories\\ST-WI-06d-b\\workitems\\WI-06d-b1.md"
        },
        {
          "id": "WI-06d-b2",
          "path": "C:\\Temp\\hadal-v2\\agents\\tasks\\hadalv2\\stories\\ST-WI-06d-b\\workitems\\WI-06d-b2.md"
        },
        {
          "id": "WI-06d-b3",
          "path": "C:\\Temp\\hadal-v2\\agents\\tasks\\hadalv2\\stories\\ST-WI-06d-b\\workitems\\WI-06d-b3.md"
        },
        {
          "id": "WI-06d-b4",
          "path": "C:\\Temp\\hadal-v2\\agents\\tasks\\hadalv2\\stories\\ST-WI-06d-b\\workitems\\WI-06d-b4.md"
        },
        {
          "id": "WI-06d-b5",
          "path": "C:\\Temp\\hadal-v2\\agents\\tasks\\hadalv2\\stories\\ST-WI-06d-b\\workitems\\WI-06d-b5.md"
        },
        {
          "id": "WI-06d-b6",
          "path": "C:\\Temp\\hadal-v2\\agents\\tasks\\hadalv2\\stories\\ST-WI-06d-b\\workitems\\WI-06d-b6.md"
        }
      ],
      "review_path": "C:\\Temp\\hadal-v2\\agents\\tasks\\hadalv2\\planning\\reviews\\WI-06d-b.json"
    }
  },
  "context": {
    "inherit": false,
    "include": [],
    "exclude": []
  },
  "capabilities": {}
}