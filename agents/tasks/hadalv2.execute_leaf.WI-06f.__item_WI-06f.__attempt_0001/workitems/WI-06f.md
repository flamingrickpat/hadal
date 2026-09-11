---
id: WI-06f
kind: work_item
parent: ST-06
children: []
depends_on: ["WI-04b"]
criteria:
  AC-art-map: "The section 26 bathymetry map opens on Tab and pauses the game; it shows the player position, explored chunk silhouettes from the tracked discoveredChunks state, the base, discovered major landmarks, and a death beacon only if one is tracked, and it never shows creature locations; verified in the browser"
behavior: "Build the section 26 bathymetry map overlay: Tab-bound, pauses the game, shows player position, explored chunk silhouettes from the existing discoveredChunks state, the base, discovered major landmarks from WI-04b, and a death beacon only if one is tracked - never creature locations - reading existing state only, with no new gameplay rules"
subsystems: ["UI overlays and settings"]
verification: "Browser checks: Tab opens and closes the overlay and the simulation is paused while open (asserted via the shared browser harness); the overlay shows the player position, the explored chunk silhouettes from save.world.discoveredChunks, the base, and the discovered major landmarks from WI-04b; a fixture with creatures present asserts no creature markers appear; the death beacon is absent unless beacon tracking state exists; the stale (WI-15) comment in src/ui/hud.ts is gone; suite and build stay green"
---

# WI-06f — Section 26 bathymetry map overlay

## Goal

Build the section 26 bathymetry map: a rough chart of explored space
(not a GPS chart). It opens on Tab and pauses the game while open. It
shows the player position, the silhouettes of explored chunks from the
already-tracked `discoveredChunks` state (`Simulation.ts`, saved in
`save.world.discoveredChunks`), the base, the discovered major landmarks
(WI-04b's landmark data, consumed by id), and a death beacon only if a
story (section 25) adds beacon tracking - otherwise no beacon. It never
shows creature locations. This item reads and displays existing state
only (the same pattern as `discoveredChunks`); it adds no new gameplay
rules.

## Deliverables (checkable)

- The overlay UI in `src/ui/` (next to the HUD/menu code; the stale
  "(WI-15)" comment in `src/ui/hud.ts` names this unbuilt overlay and is
  removed when the overlay lands): Tab opens/closes, the game is paused
  while open, and it renders the rough explored-space silhouettes,
  player position, base marker, and discovered-landmark markers in the
  section 26 style (bathymetric, silhouette-based, not a precise chart).
- Landmark markers driven by WI-04b's major-landmark ids and their
  discovery state; undiscovered landmarks are not shown.
- Death-beacon marker that renders only when beacon tracking state
  exists in the simulation/save; when no story adds section 25 beacon
  tracking, the code path is present but never fires (no placeholder
  beacon).
- A Node test that the overlay's data view (the read-only model it
  renders) exposes exactly the allowed fields: player position, explored
  chunk silhouettes, base, discovered landmarks, optional beacon - and
  exposes no creature data (the "never shows creature locations" rule
  is enforced structurally, not just visually).

## Tests

- Node: the read-only map model is built from a fixture simulation state
  and asserted to contain no creature positions; beacon field absent
  when no beacon state exists; suite and build stay green.
- Browser (final proof owner of AC-art-map): Tab toggles the overlay and
  the simulation is paused while it is open; contents verified against a
  fixture save (position, chunk silhouettes, base, discovered
  landmarks); a fixture with creatures present in explored chunks shows
  no creature markers; beacon absence verified unless a tracked beacon
  fixture exists.

## Constraints, assumptions, non-goals

- Read-only presentation state; no new simulation rules, no save-schema
  change (all inputs already exist or come from WI-04b).
- No styling work beyond section 26's bathymetric language; consistency
  with the existing UI from the WI-07 baseline.
- No creature tracking of any kind, no minimap, no radar (sonar is the
  existing in-world system and stays untouched).
- Spoiler rules (sections 0, 12, 68, 70): landmark markers use WI-04b's
  ids; evidence screenshots avoid revealing late-game names.

## Fresh-session handoff

Read ST-06/plan.md, request section 26, WI-04b (landmark ids and
discovery state), and `understanding.md` for the `discoveredChunks`
seam. Inspect `src/ui/hud.ts` (the stale "(WI-15)" comment),
`src/ui/menu.ts`, `src/sim/Simulation.ts`, and `src/game/save.ts`.
