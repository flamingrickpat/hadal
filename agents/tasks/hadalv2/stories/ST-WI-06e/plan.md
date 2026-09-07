---
id: WI-06e
kind: story
parent: ST-06
children: ["WI-06e-a", "WI-06e-b", "WI-06e-c"]
depends_on: ["WI-06a", "WI-06b", "WI-06c"]
criteria:
  AC-art-sound: "Depth audio changes with depth (high-frequency roll-off, low-frequency pressure rumble, altered reverb) and major creatures are audible well before visible, with sparse music per section 58"
behavior: "Run the depth audio pass per sections 27 and 58 on the existing AudioSystem: depth-based mixing (high-frequency roll-off, low-frequency pressure rumble, altered reverb), the creature sound vocabulary (clicks, sub-bass, scraping, resonant harmonics - not everything roaring), major-creature pre-visibility cues, and sparse music with no 90-second loop"
subsystems: ["audio system", "world content data"]
verification: "Browser depth-ladder inspection recording the audible change at each band boundary (roll-off, rumble level, reverb character); representative major-creature encounter check recording the cue lead time against final band visibility (audible well before visible); sparse-music check recording placement and confirming no 90-second loop; audio-profile Node test asserting every registered major creature has a sound profile drawn from the section 58 vocabulary; suite and build stay green"
---

# WI-06e — Depth audio pass

## Goal

Make the audio change with depth per sections 27 and 58, on top of the
existing `src/systems/AudioSystem.ts` (extend, do not rebuild):
high-frequency roll-off with depth, low-frequency pressure rumble, and
altered reverb character per band; a creature sound vocabulary (clicks,
sub-bass, scraping, resonant harmonics - not everything roaring) so
major creatures are audible well before they are visible; and sparse
music with no 90-second loop. Runs after the three band passes so the
"audible well before visible" margin is measured against the final band
visibility and attenuation.

## Why this shape (review split)

The review found three independently testable, independently shippable
behaviors bundled in one leaf, each with its own browser scenario:
depth-based mixing, creature sound profiles with pre-visibility cues,
and sparse music. The split into three leaves:

- WI-06e-a: depth-based mixing. Subsystems: audio system. Browser
  depth-ladder inspection + monotonic-curve Node test.
- WI-06e-b: creature sound profiles from the section 58 vocabulary,
  with per-band pre-visibility cue lead times tuned against the final
  band visibility. Subsystems: audio system. Profile Node test +
  encounter lead-time browser check.
- WI-06e-c: sparse music (placement pass, no 90-second loop).
  Subsystems: audio system. Named final proof owner of the full
  AC-art-sound.

## Data-seam re-attribution (revision before the split)

As first inventoried, every leaf would change both named subsystems
(audio system + world content data), so no leaf could carry a strict
subset of this story's changed subsystems. This revision re-attributes
the three per-leaf data seams to the audio system, which already owns
authored audio data:

- Band mixing parameters: the authored depth -> AudioProfile stops
  (`AUDIO_STOPS` / `audioProfileAtDepth` in `src/util/audio.ts`) - the
  audio system's own pure-data seam, mirroring the visual band stops in
  `src/render/band.ts` (read, not changed).
- Creature profile data: per-creature sound profiles (section 58
  vocabulary tag + per-band cue lead times) as a new pure-data module
  in the audio domain on the same seam as `AUDIO_STOPS`. The ST-03
  roster ids are read, not changed; `src/world/` content is not
  changed.
- Music placement data: which existing trigger flags / story moments
  receive a musical moment, authored as audio-domain data. The trigger
  flags themselves are existing world content, read, not changed.

Consequently each leaf changes only the audio system - a strict subset
of this story's subsystems - and the parent "world content data" tag is
preserved here as the scope inventory for the data-driven shape of the
work (pure, Node-testable authored data), not as a changed subsystem of
any leaf.

## Criteria assignment and proof ownership

All children retain AC-art-sound verbatim; their union covers it.

- Depth part (audible change at each band boundary): WI-06e-a.
- Creature part (audible well before visible; section 58 vocabulary):
  WI-06e-b.
- Music part (sparse, no 90-second loop): WI-06e-c.
- Final proof owner of the full AC-art-sound: WI-06e-c - after
  WI-06e-a and WI-06e-b land, it runs the complete pass (depth ladder,
  creature encounter lead time, sparse-music placement, master-volume
  seam) and records the criterion's final evidence.

## Dependency notes

- This story depends on WI-06a, WI-06b, WI-06c: the cue lead times are
  measured against the final band visibility and attenuation the band
  passes settle, and the per-band mixing must match the settled band
  identity.
- WI-06e-a and WI-06e-b are parallel with respect to each other.
- WI-06e-c depends on WI-06e-a and WI-06e-b in addition to the band
  passes: its own sparse-music work needs only the band passes, but it
  owns the final full-criterion proof.
- No existing node depends on WI-06e; if one is added later, it means
  all three leaves.

## Constraints and non-goals

- Procedural WebAudio per section 27; no large sampled assets.
- No visual changes, no shake/camera work (WI-06d), no a11y UI (WI-06g)
  beyond keeping the existing master-volume seam
  (`save.settings.masterVolume`) intact.
- No new gameplay rules; creature audio cues read existing
  encounter/trigger state (the `TriggerState.audioCues` / `playAudio`
  seam already exists in `src/world/triggers.ts`) - they do not add new
  creature behavior (ST-03 owns creature simulation).
- Extend, do not rebuild, `AudioSystem` (its `AudioSnapshot` already
  exposes depth, masterVolume, highCutoff, lowRumble, reverb).
- Section 34 budgets apply to all leaves.
- Spoiler rules (sections 0, 12, 68, 70): evidence uses internal
  creature and band ids only; late-game audio is inspected with private
  fixtures and reported without names.

## Fresh-session handoff

Read ST-06/plan.md, request sections 14.3, 27, 34, 43, 58, 70, and the
three band items (WI-06a, WI-06b, WI-06c) for the final visibility
values the cue lead times are tuned against. Inspect
`src/systems/AudioSystem.ts`, `src/util/audio.ts` (`AUDIO_STOPS`,
`audioProfileAtDepth`, `distanceGain`, `worldPan`), the ST-03 roster
registration (read-only), and the trigger flag seam in
`src/world/triggers.ts`.
