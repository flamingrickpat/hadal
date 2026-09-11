# WI-06e-b Implementation: Creature Sound Profiles and Pre-Visibility Cues

**Implemented by:** item-implementer
**Commit:** 0bd9dc9
**Date:** 2026-09-07

## What was implemented

Created a new pure-data module `src/util/creatureAudio.ts` (information-holder archetype) that provides creature sound profiles for all 22 major creatures in the ST-03 roster. Each profile has:

- A section 58 vocabulary tag (clicks, sub-bass, scraping, resonant harmonics, chittering, creaking, groaning, popping, ratcheting, snapping, squeaking, thumping, trilling, whooshing)
- Per-band cue lead-time values tuned against the final visibility values from `src/render/band.ts`

Extended `src/systems/AudioSystem.ts` with:
- `playCreatureCue(profile, worldX, playerX, distance, depthBand)` — emits an early cue when a major creature enters its band's cue range
- `playCreatureSynthesis(now, vocabulary, pan, level)` — procedural WebAudio synthesis based on the vocabulary tag (low-pulse sweeps for sub-bass, short noise bursts for clicks, etc.)

The module uses the existing `distanceGain` and `worldPan` helpers from `src/util/audio.ts` and the existing `routedEnv` plumbing in AudioSystem.

## Tests written and passed

**src/util/creatureAudio.test.ts** (4/4 passed):
- Every registered major creature has a sound profile
- Every profile has a valid section 58 vocabulary tag
- Every profile has per-band cue lead time values
- Vocabulary tags are varied (at least 4 distinct tags used)

## Browser verification

Requires the shared browser harness with audio capture to record audible vs visible moments. Node-side data validation is complete. The browser-side test should:
1. Boot the game with a representative major creature encounter
2. Record the moment the creature becomes audible vs the moment it becomes visible
3. Verify audible first, with a comfortable margin against the band's final visibility
4. Spot-check WebAudio node count per section 34

## Constraints respected

- Procedural WebAudio, no sampled assets
- Vocabulary is varied (not everything roaring)
- No changes to creature simulation or world content (read-only)
- No visual changes, no depth-mixing, no music changes
- Master-volume seam untouched
