# Understanding

This child implements one independently reviewed work item from C:\Temp\hadal-v2\agents\tasks\hadalv2.

---
id: WI-06e-a
kind: work_item
parent: WI-06e
children: []
depends_on: ["WI-06a", "WI-06b", "WI-06c"]
criteria:
  AC-art-sound: "Depth audio changes with depth (high-frequency roll-off, low-frequency pressure rumble, altered reverb) and major creatures are audible well before visible, with sparse music per section 58"
behavior: "Finalize the per-band depth-based audio mixing (high-frequency roll-off, low-frequency pressure rumble, altered reverb character) on the existing AudioSystem so the audible change at each band boundary matches the settled visual identity of WI-06a/WI-06b/WI-06c, expressed as authored audio-domain data"
subsystems: ["audio system"]
verification: "Browser depth-ladder inspection recording the audible change at each band boundary (roll-off, rumble level, reverb character); Node test asserting the depth mixing curve is monotonic in depth for the roll-off and rumble parameters and that interpolation resolves to the authored stops; the section 43 master-volume seam (save.settings.masterVolume) still applies through the mix; suite and build stay green"
---

# WI-06e-a — Depth-based mixing

## Goal

Make the audio change with depth per sections 27 and 58, on top of the
existing `src/systems/AudioSystem.ts` (extend, do not rebuild): as the
player descends, high-frequency content rolls off, low-frequency
pressure rumble rises, and the reverb/delay character shifts, with the
per-band values matching the settled visual identity of each band from
the band passes. The mixing parameters are authored content data owned
by the audio system: the depth -> AudioProfile stops
(`AUDIO_STOPS` / `audioProfileAtDepth` in `src/util/audio.ts`), which
already mirror the visual band stops in `src/render/band.ts`
(read-only).

## Deliverables (checkable)

- Finalized per-band mixing parameters in the audio system's authored
  stops - roll-off amount, low-frequency pressure rumble gain, reverb
  character, and the other `AudioProfile` parameters where the settled
  band identity requires it - one value set per band so the audio
  bands line up with the visual bands from
  WI-06a/WI-06b/WI-06c. The stops stay pure, Node-testable data;
  `src/render/band.ts` is read, not changed.
- `AudioSystem` applies the finalized profile per depth (the existing
  `applyProfile` ramping path), so crossing each band boundary produces
  an audible change in roll-off, rumble level, and reverb character.
- The section 43 master-volume seam (`save.settings.masterVolume`,
  `setMasterVolume`) keeps working through the finalized mix (the full
  a11y controls are WI-06g's job).

## Tests

- Node: the depth mixing curve is monotonic in depth - `highCutoff`
  strictly falls, and `lowRumble` and `reverb` strictly rise across
  `AUDIO_STOPS`; `audioProfileAtDepth` at each band stop resolves to
  the authored values (extend the existing `src/util/audio.test.ts`
  family). Suite and build stay green.
- Browser (audio after user input, per the shared browser harness):
  depth-ladder inspection recording the audible change at each band
  boundary (roll-off, rumble level, reverb character), reading the
  values via the existing `AudioSnapshot` seam (depth, highCutoff,
  lowRumble, reverb). Performance spot-check per section 34 (WebAudio
  node count stays within budget).

## Constraints, assumptions, non-goals

- Procedural WebAudio per section 27; no large sampled assets.
- No creature audio (WI-06e-b), no sparse music (WI-06e-c), no visual
  changes, no shake/camera work (WI-06d), no a11y UI (WI-06g) beyond
  keeping the existing master-volume seam intact.
- Band identity is set by WI-06a/b/c; this item tunes the audio to
  match the settled look, not to redefine it. If a settled band
  identity makes a parameter ambiguous, note the assumption and take
  the most conservative value.
- Section 34 budgets: the finalized mix must not materially change the
  WebAudio node count; spot-check while verifying.
- Spoiler rules (sections 0, 12, 68, 70): evidence uses internal band
  ids only; deep-band audio is inspected with private fixtures and
  reported without names.

## Fresh-session handoff

Read WI-06e/plan.md (story scope; data-seam re-attribution; proof
ownership), ST-06/plan.md, request sections 14.3, 27, 34, 58, 70, and
the three band items (WI-06a, WI-06b, WI-06c) for the settled band
identity. Inspect `src/util/audio.ts` (`AUDIO_STOPS`,
`audioProfileAtDepth`), `src/systems/AudioSystem.ts` (`applyProfile`,
`buildGraph`, `snapshot`), and `src/render/band.ts` (visual band
stops, read-only).

