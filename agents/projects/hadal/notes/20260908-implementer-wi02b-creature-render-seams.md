---
tags: [wi-02b, creature-render, three, spine, render-adapter]
symbols: [CreatureRenderer, solveSpine, buildSpineDef, makeSpineFrame, SpineDef, SpineFrame, makeFoundPanel, CreatureVisual, FoundAttachment]
---

# WI-02b — creature render seams

## Summary

The render layer now draws creatures procedurally. `CreatureRenderer`
(`src/render/creatureRender.ts`) is a pure render adapter: it reads
`Simulation.creatures` (position, active, def) and writes nothing back
(request §30). The spine math lives in `src/render/spineRenderer.ts`, which
is Three.js-free and therefore unit-testable in node.

## The seams

- **Per-frame seam**: `Game.renderVisuals` (src/game/Game.ts, the
  visual-update method) calls
  `this.creatureRenderer.update(this.sim.creatures, this.sim.state.timeSec,
  profile)` after particles, before sonar visuals. `timeSec` is the animation
  clock — the render layer never keeps its own time.
- **Spine solver**: `solveSpine(spine, frame, head, heading)` pins the trunk
  node at the creature's simulated position, then does a taut forward
  pass (nodes after the pin) and a taut backward pass (nodes before the pin)
  at the spine's fixed `segDist`, using pre-rotated rest directions. It fills
  the pre-allocated `SpineFrame` (points, angles, widths, unit left-normals).
  No allocation per call.
- **Visual kinds**: `buildSpineDef` returns a spine whose nodes are the
  chain circles sorted by x plus a trunk node. A def with no `chainCircles`
  gets a synthetic 3-8 node tapered trail (the §13.1 small-body polygon).
  The renderer dispatches on `def.body.chainCircles.length > 0` → `'spine'`
  vs `'small'`.
- **Animation**: `n1(t, phase)` is a two-partial wave (0.62·sin(1.31t) +
  0.38·sin(2.17t·1.7)) — deliberately not a pure sine. `flapEnvelope` adds a
  held pause plateau (14% duty). Fin phases are per-fin asymmetric. Rigid
  parts use `rate = 1/(1+0.5·i)`. `alert` widens fin swing 1.4×.
- **Found objects**: `attachFoundObject(creature, object, {node, side,
  distance})` rides a spine node; `makeFoundPanel(w, h)` builds a
  PlaneGeometry+LineLoop from the world-silhouette vocabulary (request §13.4).

## Gotchas

- `document` is not available in node (vitest), so the fin `CanvasTexture`
  is guarded by `typeof document === 'undefined'` and the fin material falls
  back to a flat opacity. The browser check runs the real CanvasTexture path.
- The body ribbon and the outline `LineLoop` share the same position
  `BufferAttribute`; the outline adds an index that walks the left edge then
  the right edge in reverse (a plain `LineLoop` over the interleaved buffer
  would zigzag).
- `Game` exposes `window.__HADAL_GAME__` only under `?debug=1` (same pattern
  as `__HADAL_AUDIO__`). The focused browser check uses it to inject the two
  WI-02a fixtures into the running `Simulation.creatures`.
- Deactivated creatures (`active === false`, the §34 offscreen cap) are hidden
  (`group.visible = false`), not stepped — matching the sim's "deactivated
  does not tick."
