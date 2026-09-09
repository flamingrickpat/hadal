---
title: Tier-3 production spawns + renderer commit-posture verification
role: implementer
created: 20260913
tags: [creatures, tier-3, world-data, spawns, render, commit, telegraph, section-39, section-48]
symbols: [TIER3_BANDS, TIER3_IDS, MACRO_WORLD, creatureSpawns, CreatureRenderer, finSwingRange, tier3Render.test.ts]
files: [src/world/worldData.ts, src/render/tier3Render.test.ts, src/sim/tier3Scenario.test.ts, src/content/secret/hiddenCreatures.ts]
---

# Tier-3 production spawns + renderer commit-posture verification (WI-03c2)

Where the tier-3 predators live in the production world and how the §48
"predators visibly commit before contact" bar is met and verified.

## Summary

WI-03c2 lands the five tier-3 ids (T-14…T-18) as production spawns in
`worldData.ts`, on the §39 deep bands (`TIER3_BANDS`: T-14/T-16/T-18 band 4,
T-15 bands 3+4, T-17 band 3). The silhouettes are the `def.body.chainCircles`
WI-03c1 landed; the renderer already draws them and already widens the body
(posture 1.15) and spreads the fins (1.4x) for the commit states.

## Key Facts

- Spawn placement (open water, verified against closed-slab containment):
  - band 3 (twilight): T-15 at (9500, -6100), T-17 at (13400, -6600) (west and
    east of the facility interior, which caps x 10500–13000 y -7000..-6000).
  - band 4 (abyss): T-14 at (22600, -8300) (off the landmark), T-15 at
    (22500, -7900), T-16 at (15500, -9560) (in the open floor), T-18 at
    (16200, -8100) (near the T-03 school at (15500, -8000)).
- The renderer's commit posture (`creatureRender.ts` `stepVisual`):
  `posture = alert ? 1.15 : fleeing ? 1.05 : 1` scales `frame.widths[i]`, and
  the fin rotation is `* (alert ? 1.4 : 1)`. `alert` covers `alert`/`stalk`/
  `attack`. So T-14 (alert) and T-15 (attack) telegraph; T-16/T-17 (their
  strike is the non-alert `custom` state) deliberately do NOT posture — their
  roster tells are silence (boulder) and the visible silk frame, so a posture
  on `custom` would contradict the design. Do not add a "commit state" def
  field for this tier; the hardcoded set is exactly right.

## Navigation

- `src/render/tier3Render.test.ts` — the tier-3 render verification: five
  distinct spines (silhouette) + the commit posture (body widen + fin spread).
- `src/sim/tier3Scenario.test.ts` — the `tier-3 production world data
  (WI-03c2: spawns on the §39 bands)` block (band containment + slab clearance
  + §34 cap) and the extended tier-3 spoiler sweep (now scans `worldData.ts`,
  `tier3Render.test.ts`, and the attempt-14/15/16 implementation dirs).

## Gotchas

- Measuring the commit body width is UNRELIABLE over a time window: the body
  ribbon offset `off = undAmp * n1(...) * 0.6` (undAmp = min(0.5*bodyLen, 6+
  speed*0.16)) varies with time and dominates the width for a long body.
  Measure the body span at ONE fixed time (so `off` is identical across the
  two reads) OR use a single fin's swing range over the window (the fin's fixed
  base angle is constant, isolating the 1.4x commit multiplier).
- The per-creature max-min fin range across ALL fins is dominated by the
  fixed per-fin base angles, not the swing — use one fin's range, not all fins.
- The headless render test warns `THREE.Material: parameter 'alphaMap' has
  value of undefined` — the documented node-env fin-material fallback (the
  browser check runs the real CanvasTexture path). It is a warning, not an error.

## Commands

```
npx vitest run src/render/tier3Render.test.ts
npx vitest run src/sim/tier3Scenario.test.ts
npx vitest run
npm run build
node agents/tasks/hadalv2.execute_leaf.__attempt_0016/scratch/implementer/tier3-spot-check/probe.mjs
```
