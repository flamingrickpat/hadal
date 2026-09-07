---
id: WI-06e
kind: work_item
parent: ST-06
children: []
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

## Deliverables (checkable)

- Depth-based mixing in `AudioSystem.ts`: a per-band (or continuous
  depth-curve) set of mixing parameters - high-frequency roll-off amount,
  low-frequency pressure rumble gain, reverb character - expressed as
  content data so the bands' audio matches their visual identity from
  WI-06a/WI-06b/WI-06c.
- Creature sound profiles as world content data: every registered major
  creature (ST-03 roster ids) has a profile drawn from the section 58
  vocabulary (clicks, sub-bass, scraping, resonant harmonics), and major
  creatures emit an early cue well before their visual range in their
  band. Cue lead time is tuned per band against the final visibility
  from the band passes.
- Sparse music per section 58: few, well-placed musical moments tied to
  authored story/encounter moments (existing trigger flags); no
  90-second loop; silence is allowed and preferred.
- The section 43 master-volume seam from the baseline audio work
  (`save.settings.masterVolume`) keeps working through all of the above
  (the full a11y controls are WI-06g's job).

## Tests

- Node: audio-profile validation - every registered major creature has a
  sound profile with a vocabulary tag from the section 58 set and a cue
  lead-time value; the depth mixing curve is monotonic in depth for the
  roll-off and rumble parameters; suite and build stays green.
- Browser (audio after user input, per the shared browser harness):
  depth-ladder inspection recording the audible change at each band
  boundary; a representative major-creature encounter recording the
  moment the creature becomes audible vs. the moment it becomes visible
  (audible first, with a comfortable margin); a sparse-music pass
  recording placement and confirming no loop. Performance spot-check per
  section 34 (WebAudio node count stays within budget).

## Constraints, assumptions, non-goals

- Procedural WebAudio per section 27; no large sampled assets.
- No visual changes, no shake/camera work (WI-06d), no a11y UI (WI-06g)
  beyond keeping the existing master-volume seam intact.
- No new gameplay rules; creature audio cues read existing encounter/
  trigger state, they do not add new creature behavior (ST-03 owns
  creature simulation).
- Spoiler rules (sections 0, 12, 68, 70): evidence uses internal
  creature and band ids only; late-game audio is inspected with private
  fixtures and reported without names.

## Fresh-session handoff

Read ST-06/plan.md, request sections 14.3, 27, 58, and the three band
items (WI-06a, WI-06b, WI-06c) for the final visibility values the cue
lead times are tuned against. Inspect `src/systems/AudioSystem.ts`, the
world content data seam, and the trigger flag seam in
`src/world/triggers.ts`.
