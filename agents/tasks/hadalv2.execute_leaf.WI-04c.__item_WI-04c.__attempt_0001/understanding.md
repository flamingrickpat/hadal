# Understanding

This child implements one independently reviewed work item from C:\Temp\hadal-v2\agents\tasks\hadalv2.

---
id: WI-04c
kind: work_item
parent: ST-04
children: []
depends_on: ["WI-04a", "WI-04d"]
criteria:
  AC-enc-reactions: "World-state reactions alter at least three earlier zones after major milestones through story flags and spawn-table changes"
behavior: "Add the section 60 flag-gated world-state reactions: after the authored milestones (beat completions from WI-04a, puzzle completions from WI-04d, return-through conditions), at least three earlier zones differ on return trips via story flags and spawn-table changes, kept cheap per section 60"
subsystems: ["trigger system", "world content data", "headless scenario tests"]
verification: "Fresh-save scenarios that reach an authored milestone, physically return to at least three earlier zones, and assert the flag-gated changes (spawn-table deltas, ambient/light changes, fauna presence/absence, audio) are present after the milestone and absent before it; save round-trip persistence of the flags; final proof owner of AC-enc-reactions"
---

# WI-04c — Flag-gated world-state reactions

## Goal

Make return trips different (section 60): after the authored milestones,
earlier zones change subtly and cheaply - a few flags and spawn-table
changes, no new systems. Reactions gate on the completion flags WI-04a
(beats) and WI-04d (puzzles) set, plus the existing `returnThrough`
condition, so every reaction is provable from a fresh save.

## Deliverables (checkable)

- At least three earlier zones (chosen so they sit on natural return
  routes per the pacing timeline) each altered by one or more reactions
  from the section 60 category list: new migration; fewer small animals;
  changed industrial lights; debris shifted; friendly organism appears
  near base; radio receives odd interference; deep sound audible in
  shallows.
- Each reaction is a trigger entry (story-flag gate, `spawnEntity` /
  `despawnEntity` / `alterAmbient` / `playAudio` effects) plus the
  corresponding spawn-table entry in the production world data; flags
  persist through the existing save round-trip (the simulation already
  shares `storyFlags` into the trigger state and the save).
- Cheap by construction: no new world systems and no per-frame work beyond
  the existing trigger evaluation - each reaction is data.

## Tests (node, real simulation)

- Per-reaction scenario from a fresh save: physical route to the authored
  milestone, then physical return to the affected zone; assert the
  changed state (spawn-table delta, ambient/light/audio change, fauna
  presence or absence) after the milestone and the unchanged state before
  it.
- Save round-trip: save after the milestone, load, flags and their effects
  persist.
- Count check: at least three distinct earlier zones are altered.

## Constraints, assumptions, non-goals

- No content authorship beyond the reaction data itself: the "radio
  receives odd interference" category is an audio/ambient cue here, not a
  new message (new messages live in WI-04b's section 38 budget).
- No balance changes (ST-07): reaction spawns stay within the section 34
  ambient caps.
- Depends on WI-04a and WI-04d for the milestone flags their scenarios
  must hit; if the reveal map assigns a reaction to a plain
  depth/return-through milestone, the dependencies still hold and the
  gate simply uses the existing condition.
- Section 61: reactions are flag-driven, never randomized.

## Fresh-session handoff

Read ST-04/plan.md, request sections 60, 61, 70, WI-04a and WI-04d (the
completion flag names they set), and the existing flag plumbing in
`src/world/triggers.ts` and `src/sim/Simulation.ts` (shared
`storyFlags`). Which zones react to which milestone comes from the
private reveal map, referenced by id only.

