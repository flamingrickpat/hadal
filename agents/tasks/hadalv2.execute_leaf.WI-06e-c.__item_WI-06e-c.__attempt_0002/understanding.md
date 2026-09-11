# Understanding

This child implements one independently reviewed work item from C:\Temp\hadal-v2\agents\tasks\hadalv2.

---
id: WI-06e-c
kind: work_item
parent: WI-06e
children: []
depends_on: ["WI-06a", "WI-06b", "WI-06c", "WI-06e-a", "WI-06e-b"]
criteria:
  AC-art-sound: "Depth audio changes with depth (high-frequency roll-off, low-frequency pressure rumble, altered reverb) and major creatures are audible well before visible, with sparse music per section 58"
behavior: "Add sparse music per section 58 - few, well-placed procedural musical moments tied to existing authored story/encounter trigger flags, with no 90-second loop and silence preferred - and run the final full AC-art-sound proof (depth ladder, creature encounter lead time, sparse-music placement, master-volume seam)"
subsystems: ["audio system"]
verification: "Browser sparse-music pass recording the placement of every musical moment and confirming no 90-second loop (silence between moments allowed and preferred); final full AC-art-sound proof: depth-ladder inspection at each band boundary, representative major-creature encounter lead-time check against final band visibility, sparse-music placement, and the master-volume seam (save.settings.masterVolume) applied through all layers; performance spot-check per section 34; suite and build stay green"
---

# WI-06e-c — Sparse music and final audio proof

## Goal

Land the sparse music per section 58 on the existing
`src/systems/AudioSystem.ts` (extend, do not rebuild): few,
well-placed musical moments tied to the authored story/encounter
moments (existing trigger flags), no 90-second loop, silence allowed
and preferred. Then, as the named final proof owner of AC-art-sound,
run the complete depth-audio acceptance pass and record the
criterion's final evidence.

## Data seam (re-attributed to the audio system)

Music placement data is authored as audio-domain data on the
`AUDIO_STOPS` seam in `src/util/audio.ts`: which existing trigger
flags / story moments receive a musical moment and the moment's
parameters. The trigger flags themselves are existing world content,
read, not changed - so this leaf changes only the audio system (a
strict subset of the parent's subsystems).

## Deliverables (checkable)

- Sparse musical moments in `AudioSystem`: procedural WebAudio (no
  large sampled assets), fired from the placement data when the tied
  existing trigger flags / story moments occur, layered into the
  existing drone/music-bed path so the music recedes with depth like
  the rest of the mix. No 90-second loop; silence between moments is
  allowed and preferred.
- Final proof of AC-art-sound (named final proof owner): the complete
  pass below, recorded as the criterion's final evidence.

## Tests

- Browser (audio after user input, per the shared browser harness):
  sparse-music pass recording the placement of every musical moment
  (internal ids only) and confirming no 90-second loop; the
  master-volume seam (`save.settings.masterVolume`) applies through
  music, creature cues, and ambient (the full a11y controls are
  WI-06g's job).
- Final full AC-art-sound proof (re-runs the siblings' scenarios and
  records the combined evidence): depth-ladder inspection at each band
  boundary (roll-off, rumble level, reverb character); representative
  major-creature encounter lead-time check (audible well before visible
  against the final band visibility); sparse-music placement;
  performance spot-check per section 34 (WebAudio node count within
  budget).
- Node: suite and build stay green.

## Constraints, assumptions, non-goals

- Procedural WebAudio per section 27; no large sampled assets; no
  90-second loop.
- No depth-mixing changes (WI-06e-a), no creature profile changes
  (WI-06e-b), no visual changes, no shake/camera work (WI-06d), no
  a11y UI (WI-06g) beyond keeping the existing master-volume seam
  intact.
- No new gameplay rules; moments read existing trigger flags and add
  no new behavior.
- Spoiler rules (sections 0, 12, 68, 70): evidence uses internal ids
  only; late-game audio is inspected with private fixtures and reported
  without names.

## Fresh-session handoff

Read WI-06e/plan.md (story scope; data-seam re-attribution; proof
ownership), WI-06e-a and WI-06e-b (their recorded evidence),
ST-06/plan.md, request sections 14.3, 27, 34, 43, 58, 70, and the
three band items (WI-06a, WI-06b, WI-06c). Inspect
`src/systems/AudioSystem.ts` (drone bed, `playDepthMotif`,
`scheduleEvents`, `setMasterVolume`), `src/util/audio.ts` (the
`AUDIO_STOPS` data seam, the `drone` profile parameter), and the
trigger flag seam in `src/world/triggers.ts`.

