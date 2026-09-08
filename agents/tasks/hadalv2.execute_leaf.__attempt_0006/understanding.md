# Understanding

This child implements one independently reviewed work item from C:\Temp\hadal-v2\agents\tasks\hadalv2.

---
id: WI-02b
kind: work_item
parent: ST-02
children: []
depends_on: ["WI-02a"]
criteria:
  AC-cf-render: "A reusable spine creature renderer plus small and rigid body renderers draw creature state from the simulation in the Three.js layer without changing gameplay rules"
behavior: "Implement the procedural 2.5D creature renderers (spine renderer, small-body renderer, rigid hierarchy renderer, found-object attachment hook, non-periodic animation) that draw simulation state in the Three.js layer"
subsystems: ["procedural creature rendering"]
verification: "Focused browser check: a test organism from the WI-02a scenario renders, animates, and follows its simulated spine with no console errors; node test asserts renderer output derives only from sim state"
---

# WI-02b — Procedural creature rendering

## Goal

Make creatures look richer than sprites with cheap geometry, without moving
any gameplay rule into the render layer. New files under `src/render/`
(`creatureRender.ts`, `spineRenderer.ts`) reading creature state that
`src/game/Game.ts` already syncs each frame.

## Deliverables (checkable)

- Spine renderer per section 13.2: head driven by the simulated position,
  constrained nodes at fixed segment distance, body geometry from left/right
  normals, attachment points for fins, plates, tendrils, lights, carried
  debris, secondary appendages.
- Small-creature renderer per section 13.1 (ShapeGeometry, polygon meshes,
  translucent fins, outline lines, CanvasTexture masks, 3-8 segments).
- Rigid/semi-rigid hierarchy renderer per section 13.3 with parts on
  different time scales and bodies that can exceed screen bounds.
- Found-object attachment hook per section 13.4: a creature can carry pieces
  from the same geometry library as world wreckage.
- Animation principles per section 13.5: noise modulation, pauses,
  breathing/pumping cycles, asymmetric appendage motion, alert posture
  changes; no pure sine-wave everything.
- Lighting interplay per section 15: silhouettes readable in and out of the
  player beam; large bodies readable as separately illuminated pieces.

## Constraints, assumptions, non-goals

- Pure render adapter: it reads sim state, writes nothing back (section 30).
  If a visual needs sim data that does not exist yet, record it as a defect
  for WI-02a rather than computing gameplay in the renderer.
- Performance per section 34: moderate segment counts, reused geometries and
  materials, no per-frame allocation in the render loop.
- No secret roster organisms; the two WI-02a fixtures are the test subjects.
- No audio in this item.

## Fresh-session handoff

Read request sections 13, 15, 34; `understanding.md` for the Game.update
sync seam (`src/game/Game.ts:97`). The art-direction palette work is ST-06's
job; keep materials neutral here. Browser evidence uses the shared browser
harness, kept short and directed.

