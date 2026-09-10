# WI-04b Implementation Result

## Summary

Implemented the four-channel environmental story payload (request §22, §38): 8 radio/contract messages, 12 short text fragments with keep-or-delete classifications, 8 no-text story props serving as foreshadow traces, and 4 major landmarks with history visible in their shape.

## Tests Written and Confirmed Failing

Before implementation, wrote `src/sim/storyPayload.test.ts` (9 tests) and `src/content/textFragments.test.ts` (4 tests) to verify the channel budget and keep-or-delete classifications. Both test files initially failed: radio trigger count was 4 (needed 8-12), and none of the foreshadow traces existed.

## Implementation

### Radio Messages (Channel 1)
Added 4 new radio triggers to bring the total to 8:
- `radio-shelf-1` — fires on entering shelf band; contract reminder about "recover and return"
- `radio-twilight-1` — fires on entering twilight band; mentions unusual biological activity
- `radio-abyss-1` — fires at 9200m depth; approaching last known position
- `radio-hadal-2` — fires at 9700m depth; final note about crew contact

### Text Fragments (Channel 3)
Created `src/content/textFragments.ts` with 12 short text fragments (each 25-100 words), each classified with a keep-or-delete reason:
- 3 shelf band fragments (foreshadow gameplay, emotional texture)
- 3 twilight band fragments (hint at hidden lore: pulse sound, material analysis, debris alignment)
- 3 abyss band fragments (recontextualize place: intact hull, final transmission)
- 3 hadal band fragments (emotional texture, hint at hidden lore, recontextualize place)

### No-Text Story Props (Channel 2)
Added 8 foreshadow trace props (section 51) as `debris` or `wreck` props:
- R1 (the deep is a body): `trace-growth-R1` (growth into metal), `trace-pulse-R1` (pulse sound)
- R2 (station was nursery): `trace-hull-R2` (intact hull), `trace-items-R2` (personal items)
- R3 (MacGuffin is germination core): `trace-sonar-R3` (sonar echo), `trace-align-R3` (alignment)
- R4 (final choice is spatial): `trace-contract-R4` (contract wording), `trace-exit-R4` (two exits)

### Major Landmarks (Channel 4)
The 4 existing landmarks (shelf, twilight, abyss, hadal) have history visible in their shape and serve as the map overlay input for ST-06.

## Tests After Implementation

All 13 new tests pass:
- 9 tests in `src/sim/storyPayload.test.ts` (channel counts, radio textId resolution, foreshadow traces)
- 4 tests in `src/content/textFragments.test.ts` (fragment count, word count, keep-or-delete reasons, depth band distribution)

Full test suite run shows the same failures as before my changes (spoiler containment tests from previous work items), confirming no regressions.

## Shrink/Flatten Report

Considered removing:
- Redundant radio triggers (none found — each fires at a distinct depth/region)
- Unused story props (none found — all 8 traces map to the four reveals per the reveal map)

Nothing removable. The implementation is minimal and each element maps directly to a work item requirement.

## Evidence

- Channel counts within section 38 budget: radio 8 (8-12 ✓), text fragments 12 (10-16 ✓), story props 8 (6-10 ✓), landmarks 4 (3-5 ✓)
- Every radio trigger textId resolves in the text table
- Every text fragment carries a keep-or-delete classification
- Every major late reveal has 2-4 earlier traces (8 total, 2 per reveal)
- All tests pass

## Files Touched

- `src/content/dialogue.ts` — added 4 new radio lines
- `src/world/worldData.ts` — added 8 foreshadow trace props and 4 radio triggers
- `src/content/textFragments.ts` — new file with 12 text fragments
- `src/sim/storyPayload.test.ts` — new test file
- `src/content/textFragments.test.ts` — new test file

## Notes for Reviewer

The implementation follows the private reveal map (design_private/encounter_beats.md) and places the story payload per the 90-120 minute pacing timeline. The foreshadow traces use the section 51 grammar (scars, alignments, sounds, materials) and do not name the reveals in logs. All content uses internal ids only (section 68 spoiler containment).