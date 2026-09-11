---
tags: [wi-05a, macguffin, retrieval, hadal, trigger, collectItem]
symbols: [Simulation.handleMacguffinRetrieval, macguffin-retrieved, macguffin, hadal]
date: 2026-09-14
---

# WI-05a implementer note — MacGuffin retrieval interaction seams

## Summary

The MacGuffin retrieval is a two-part mechanic: (1) a dedicated interaction method in the simulation that detects when the player approaches the MacGuffin prop and presses interact, and (2) a data-driven §36 trigger that fires the post-retrieval environmental change when the MacGuffin item is "collected" (added to the player's equipment list). This pattern can be reused for other interactive objects that should fire trigger actions.

## Architecture

**World data** (`src/world/worldData.ts`):
- The MacGuffin is placed as a `facility` prop in the hadal zone's props array, inside the heart chamber (x=21400, y=-9600).
- A data-driven trigger (`macguffin-retrieved`) fires when `collectItem` is true and `itemId` is `macguffin`. Its actions: set story flag `macguffin-retrieved`, `alterAmbient` (dim, sound, current), `playAudio` (cueId `macguffin-retrieved`).

**Simulation** (`src/sim/Simulation.ts`):
- `macguffinPosition` field is initialized in the constructor by iterating over chunks to find the `macguffin` prop.
- `handleMacguffinRetrieval(input)` checks if the player is within INTERACT_RADIUS of the MacGuffin and pressed interact; if so, adds `macguffin` to `player.equipmentIds`, which triggers the `collectItem` condition in the trigger system.
- Called from `step()` after `handleHarvest`, before `handleCraft`.

**Key gotcha**: The `collectItem` trigger condition is evaluated by looking at the last added item in `player.equipmentIds`. Adding the MacGuffin to equipment IDs triggers the `collectItem` condition for `macguffin`. This is the same mechanism used for harvesting nodes (which adds `salvage` items).

## Foreshadow traces

The 2 R3 traces were placed by WI-04b:
- `trace-sonar-R3` (abyss, x=17500, y=-8500): sonar returns an echo far larger than any visible body
- `trace-align-R3` (twilight, x=14000, y=-6500): debris aligned facing the center

## Routing note

The hadal zone has a heart chamber interior (x 20300..22700, y -9800..-9400) with an entrance gap in the west wall (y -9700..-9600). Scenario tests that need to reach the MacGuffin must swim through this entrance. The beat scenario test's route goes to x=21800 (east end of the strip) but does not enter the heart chamber interior.