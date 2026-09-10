---
title: hadal strip geometry and the authored beat descent route
role: item-implementer
created: 2026-09-14
tags: [hadal-strip, beat-scenarios, wi-04a, terrain-geometry, scenario-route, o2-budget]
symbols: [enc-beat-s1..s5, approachCreature, movedCreatures, beatScenario.test.ts]
files: [src/world/worldData.ts, src/world/triggers.ts, src/sim/Simulation.ts, src/sim/beatScenario.test.ts]
---

# hadal strip geometry and the authored beat descent route

## Summary

The hadal band (band 5) is a thin channel, not an open basin. Getting a
headless scenario into it — and back out — is the hard part of any deep
scenario. This note records the exact geometry so the next agent does not
re-derive it from coordinates.

## Key Facts

- **Slab convention:** `slab(id, x, y, w, h)` spans y..y+h; y is the shallow
  face, y+h the deep face (surface y=0, deeper = more negative). A "floor"
  slab's shallow face is its top.
- **Hadal band:** bounds x 18100..23500, y -10000..-9600 (depth 9600-10000).
  The water channel above the floor is only **depth 9600-9700** (100 units).
- **Hadal floor:** x 18500..23100, depth 9700-10000. Shallow face at depth 9700.
- **Hadal west wall:** x 18100..18500, depth 9600-10000. Solid — it blocks a
  west→east swim at strip depth.
- **Hadal east wall:** x 23100..23500, depth 9600-10000.
- **Pocket ledge:** x 18550..19000, depth 9560-9590. Overhangs the strip's west
  end — descending at x 18550-19000 strands the player above it.
- **Interior room:** x 20100..22700. West wall has a gap at depth 9600-9700
  (the strip passes through it); east wall (x 22500..22700) is solid.
- **Roster set-pieces (hadal):** T-20 (19100,-9650), T-23 (21400,-9650),
  T-25 (22900,-9650) — all at strip depth 9650, inside/beside the room.

## Navigation

The authored descent (used by `beatScenario.test.ts` ROUTE) threads this:

1. Coast→shelf notch (x 5000-6400)→ shelf (x 4600-14900)→ shelf floor gap
   (x 9000-10000)→ twilight→ twilight floor gap (x 14000-19000, the safe
   region at (14500,-7800)).
2. Abyss descent at x 15800 (clear of the abyss pocket wall x 14000-14900 and
   the abyss landmark x 19500-21900).
3. **East to x 19200 *above* the hadal west wall (depth 9500)** — this is the
   load-bearing move. Then drop straight into the strip at x 19200 (east of the
   wall, east of the pocket ledge). Descending at x < 18500 strands the player
   west of the wall; at x 18550-19000 it strands under the pocket ledge.
4. East along the strip (through the room's west gap) to the east end.

Escape is the reverse: rise at x 19200 (clear), then up through the abyss and
the twilight floor gap to the safe region.

## Gotchas

- **Steering tolerance vs depth lines:** `swimTo(target, 40)` stops within 40
  units; a `reachDepth` line exactly at the waypoint's depth can be missed by
  10-30 units (the player stopped at depth 9649.6 against a 9650 line). Put the
  waypoint deeper than the line (the floor caps the drop) or set the line 10
  units shallower.
- **Close depth lines overwrite each other:** two `reachDepth` beats within the
  same drop both fire; the later one's `camera`/`alterAmbient` overwrites the
  earlier. A per-beat scenario that asserts a camera state must stop *between*
  the two lines.
- **O2 budget:** base 180s + tank-1 (+65s) = 245s. The full coast→strip→coast
  route is well within it *if* the player banks at the surface (O2 refills
  within depth 100 of y=0) before each leg. The prep harvests salvage and banks
  at the base.
- **Coast escape is not a straight swim:** the shelf west wall (x 4600-5000,
  depth 2000-5200) blocks a direct west swim from the shelf; ascend through the
  seabed notch (x 5000-6400) first.

## Commands

```powershell
npx vitest run src/sim/beatScenario.test.ts --reporter=verbose
npx vitest run src/world/triggers.test.ts
```
