---
title: Player, terrain, and greybox world seams after WI-02
role: item-implementer
created: 2026-09-05
tags: [player, terrain, collision, hud, greybox, camera-follow, debug, oxygen]
symbols: [Player, PlayerController, buildTerrain, resolveCircle, GREYBOX_WORLD, CollisionSystem, Hud, enableDebugPanel, worldBounds]
files: [src/player/Player.ts, src/player/PlayerController.ts, src/player/equipment.ts, src/player/inventory.ts, src/world/terrain.ts, src/world/worldData.ts, src/world/World.ts, src/systems/CollisionSystem.ts, src/ui/hud.ts, src/util/debug.ts, src/util/math.ts, src/game/Game.ts, src/render/Renderer.ts, src/main.ts]
---

# Player, Terrain, And Greybox World (After WI-02)

## Summary

The player now swims with the request §6 inertial model and collides
with a small greybox world (seabed + central wall + east shelf) via
circle-vs-segment resolution. Oxygen/health/depth meters and a minimal
HUD are live, and the hidden debug panel can teleport the player.

## Key Facts

- Simulation order inside `Game.update` (the single seam): controller
  (integrate + meters + facing) -> `CollisionSystem.update` (resolve
  position + strip inward velocity) -> mesh sync -> `hud.update`.
  Nothing else ticks.
- Movement model (`PlayerController.update`): `v += a·dt` (separate
  `PLAYER_ACCEL_H` 600 / `PLAYER_ACCEL_V` 560), `v *= e^(-drag·dt)`
  (`PLAYER_DRAG_RATE` 2/s → terminal ≈ 300/280 u/s), `p += v·dt`.
  Boost (capability-gated): accel ×2.2, drag ×0.55. Pinned by
  `src/player/PlayerController.test.ts`.
- Meters (`updateMeters`): O2 1/s, ×1.75 boosting, ×1.5 injured
  (health < 25); zero O2 drains health 5/s (7.5/s injured); within
  `SURFACE_REFILL_DEPTH` 100 of y = 0 both refill; `depth = max(0, -y)`.
- Coordinates: y = 0 is the surface, negative is deeper (request
  §4.1). The greybox water column is a closed collision polygon whose
  top edge at y = 0 acts as a surface ceiling until WI-03 adds the
  platform.
- Terrain (`src/world/terrain.ts`): `buildTerrain` precomputes
  segments from closed/open polylines; `resolveCircle` pushes the
  circle to one radius along the nearest segment normal and removes
  the inward velocity component (tangential kept — the player slides
  along slopes). A d = 0 case pushes along the segment normal away
  from the shape's centroid. `visual` points may differ from
  collision points (request §31); `World` renders `visual ?? points`.
- Greybox (`src/world/worldData.ts`): `GREYBOX_WORLD` = seabed
  (x −3000…5600, floor −1200…−1550), wall (x 2350–2650, top −520),
  east shelf (x 4200–5300, top −1100); `PLAYER_START` (1300, −100);
  `worldBounds` derives the camera clamp rect. This data is the
  WI-07 refactor target (full §17 chunk fields).
- Camera: `Renderer.follow` smooth-lags (~`CAMERA_LAG_SEC` 0.15 s)
  toward the player and clamps to world bounds; `screenToWorld`
  converts the mouse for aim. Full rig (aim lead, zoom) is WI-14.
- HUD (`src/ui/hud.ts`): a handful of fixed DOM nodes (O2 bar, HP bar,
  depth, tool) updated in place; rows fade to 0.25 opacity when full;
  `setPaused` shows the pause overlay.
- Debug (`src/util/debug.ts`): panel on `?debug=1` or Backquote+F2
  (F2 within 2 s of the backtick); x/depth inputs + Apply call
  `Game.debugTeleport`; 4 Hz readout (x, depth, o2, hp, wrapped
  facing, aim). The rest of request §33 lands in WI-03 in this same
  file.
- Z layers: terrain at z = 0, player + aim line at z = 10.

## Gotchas

- Thrust keys map with W = up (+y), S = down (−y) — the y-down
  depth convention inverts the usual screen mapping; the mapping
  lives in `PlayerController.bindToWindow`.
- Holding thrust into sloped terrain slides the player tangentially
  (intended physics; the east slope funnels to the flat floor at
  x ≈ 2630).
- `Game.debugReadout` wraps facing into [−π, π] and appends the aim
  point — the WI-02 browser probe parses that format.

## Commands

- `npx vitest run` — 31/31 including the movement, meter, and
  terrain suites.
- `npm run build` — exit 0 (the >500 kB chunk warning is the
  three.js bundle; expected at this stage).
- Live probe: `agents/tasks/hadal/scratch/item-implementer/WI-02/`
  (`node probe.mjs` or `run.ps1`; dev port 5197).
