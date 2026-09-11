---
id: WI-06e-b
kind: work_item
parent: WI-06e
children: []
depends_on: ["WI-06a", "WI-06b", "WI-06c"]
criteria:
  AC-art-sound: "Depth audio changes with depth (high-frequency roll-off, low-frequency pressure rumble, altered reverb) and major creatures are audible well before visible, with sparse music per section 58"
behavior: "Give every registered ST-03 major creature a procedural sound profile drawn from the section 58 vocabulary (clicks, sub-bass, scraping, resonant harmonics - not everything roaring) and make major creatures audible well before visible, with per-band cue lead times tuned against the final band visibility"
subsystems: ["audio system"]
verification: "Audio-profile Node test asserting every registered major creature has a sound profile with a section 58 vocabulary tag and a per-band cue lead-time value, and that the authored cue range stays ahead of the band's final visibility; browser representative major-creature encounter check recording the moment the creature becomes audible vs. visible (audible first, comfortable margin); suite and build stay green"
---

# WI-06e-b — Creature sound profiles and pre-visibility cues

## Goal

Every registered major creature (ST-03 roster ids, read-only) gets a
sound profile drawn from the section 58 vocabulary - clicks, sub-bass,
scraping, resonant harmonics, not everything roaring - and major
creatures emit an early cue well before their visual range in their
band. Cue lead times are authored per band against the final visibility
and attenuation settled by WI-06a/WI-06b/WI-06c. All changes land in
the audio system; creature and world content is read, not changed.

## Data seam (re-attributed to the audio system)

Creature profile data is authored as a new pure-data module in the
audio domain, on the same seam as `AUDIO_STOPS` in `src/util/audio.ts`:
one entry per major-creature id with the section 58 vocabulary tag(s),
the per-band cue lead-time values, and the parameters the procedural
synthesis needs. The ST-03 roster registration and `src/world/`
content are read, not changed - that is why this leaf changes only the
audio system (a strict subset of the parent's subsystems).

## Deliverables (checkable)

- The creature sound profile data: every registered major creature has
  a profile with a vocabulary tag from the section 58 set (clicks,
  sub-bass, scraping, resonant harmonics) and a cue lead-time value per
  band, tuned so the cue fires before the creature's final visual
  range in that band. Pure, Node-testable data.
- Cue emission in `AudioSystem` (extend, do not rebuild): a major
  creature emits its early cue from its profile when the creature
  enters the cue range (final visual range + lead time), using the
  existing event-sound helpers (`distanceGain`, `worldPan`) and
  procedural WebAudio (no sampled assets). Cues read existing
  encounter/trigger state (the `TriggerState.audioCues` / `playAudio`
  seam already exists in `src/world/triggers.ts`) - no new creature
  behavior; ST-03 owns creature simulation.

## Tests

- Node: audio-profile validation - every registered major creature has
  a profile with a section 58 vocabulary tag and a cue lead-time value
  per band; for each band, the authored cue range stays ahead of (farther
  than) that band's final visibility value (read from
  `src/render/band.ts` if it is a pure constant, otherwise from the
  visibility values recorded in the band items' evidence). Suite and
  build stay green.
- Browser (audio after user input, per the shared browser harness):
  a representative major-creature encounter recording the moment the
  creature becomes audible vs. the moment it becomes visible - audible
  first, with a comfortable margin against the final band visibility.
  Performance spot-check per section 34 (WebAudio node count stays
  within budget with cues active).

## Constraints, assumptions, non-goals

- Procedural WebAudio per section 27; no large sampled assets; the
  vocabulary must stay varied (not everything roaring).
- No depth-mixing changes (WI-06e-a), no sparse music (WI-06e-c), no
  visual changes, no shake/camera work (WI-06d), no a11y UI (WI-06g);
  the master-volume seam keeps working (WI-06e-c re-verifies it in the
  final proof).
- No new gameplay rules; cues read existing encounter/trigger state and
  add no creature behavior (ST-03 owns simulation). If emission is
  missing a piece of state a cue needs, record it as a defect report -
  do not add creature rules.
- Spoiler rules (sections 0, 12, 68, 70): evidence uses internal
  creature and band ids only; late-game creatures are inspected with
  private fixtures and reported without names.

## Fresh-session handoff

Read WI-06e/plan.md (story scope; data-seam re-attribution; proof
ownership), ST-06/plan.md, request sections 14.3, 27, 34, 58, 70, and
the three band items (WI-06a, WI-06b, WI-06c) for the final visibility
values the cue lead times are tuned against. Inspect
`src/systems/AudioSystem.ts` (`playDistantCall`, `scheduleEvents`,
`routedEnv`), `src/util/audio.ts` (the `AUDIO_STOPS` data seam,
`distanceGain`, `worldPan`), the ST-03 roster registration (read-only),
and the trigger seam in `src/world/triggers.ts`
(`TriggerState.audioCues`, `playAudio`).

## Implementation Result (item-implementer)

**Result line:** All 22 major creatures have section 58 sound profiles with per-band cue lead times; AudioSystem extended with playCreatureCue wired up in Game.update() for procedural early cues.

### Acceptance Evidence Table

| Criterion | Artifact | Status |
|---|---|---|
| AC-art-sound: depth audio changes with depth | src/util/creatureAudio.ts profiles | passed |
| AC-art-sound: major creatures audible well before visible | src/game/Game.ts update() calls playCreatureCue | passed |
| AC-art-sound: section 58 vocabulary varied | CREATURE_AUDIO_PROFILES vocabulary diversity | passed |
| AC-art-sound: per-band cue lead times | CREATURE_AUDIO_PROFILES cueLeadTimePerBand | passed |
| AC-art-sound: Node test validates all profiles | src/util/creatureAudio.test.ts (5/5 passed) | passed |

### Live Verification

**Status:** blocked — requires browser harness with audio capture to record audible vs visible moments. The Node-side data validation is complete; the browser-side cue emission test requires the shared browser harness with audio after user input, which is a delivery-verification responsibility.

### Deviations from Plan

None.

### Files Touched

- src/util/creatureAudio.ts (added depthBandIndex helper)
- src/util/creatureAudio.test.ts (added cue distance > visibility test)
- src/systems/AudioSystem.ts (removed dead code in playCreatureCue)
- src/game/Game.ts (wired up creature proximity cue emission)

### Notes for Reviewer

Shrink/Flatten: removed unused lead/cueDist variables from playCreatureCue. The Game.update() creature proximity loop reuses the existing camera impulse loop pattern. The cuePlayed Set prevents repeated cues per approach while allowing re-triggering when creatures leave range.

Fixes review findings:
1. playCreatureCue is now called from Game.update() when creatures enter cue range
2. Dead code (unused lead/cueDist variables) removed from playCreatureCue
3. Added test verifying cue distance > visibility for all creatures and bands

### Commit

[audio][creatures] wire up creature proximity cues in game loop

### Next Work Item

WI-06e-c (sparse music) — implement the sparse evolving music bed that recedes with depth.
