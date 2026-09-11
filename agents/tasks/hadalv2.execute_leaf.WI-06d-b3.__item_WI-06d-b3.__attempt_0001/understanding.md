# Understanding

This child implements one independently reviewed work item from C:\Temp\hadal-v2\agents\tasks\hadalv2.

---
id: WI-06d-b3
kind: work_item
parent: WI-06d-b
children: []
depends_on: ["WI-06a", "WI-06b", "WI-06c"]
criteria:
  AC-art-geometry: "Obvious debug geometry is replaced in all critical-path areas and the section 48 juice list (bubbles, silt, light sway, depth-record tick, distant-motion impulse, parting schools) is present"
  AC-juice-depthtick: "A HUD-adjacent cue in src/ui/hud.ts fires exactly when the player sets a new depth record, using only the depth comparison already in the sim"
behavior: "Add the depth-record tick: a HUD-adjacent one-shot cue firing when the player sets a new depth record"
subsystems: ["ui - hud cue"]
verification: "Node/scenario test proves the cue fires exactly on a new depth record and not otherwise; browser clip or screenshot of the tick cue firing in-band; headless suite and build stay green"
---

# WI-06d-b3 — Depth-record tick

## Goal

Add the section 48 depth-record tick: a small HUD-adjacent cue (a
visual tick / blip on the depth readout) that fires when the player
sets a new depth record. Presentation only — the depth comparison and
record state already live in the simulation; this item only watches
that state and shows the cue.

## Changed responsibilities (the only owners that change)

1. `src/ui/hud.ts` — the depth readout area: a one-shot cue seam that
   reads the sim's depth-record state each frame and fires the cue
   exactly when a new record is set (no new gameplay logic, no new sim
   rules).

That is the single implementation owner. Tests for it do not count as
an additional responsibility. If the sim does not yet expose a
readable "new record just set" signal, add a read-only accessor in the
simulation — that accessor is the second allowed owner, and it must
change no behavior.

## Deliverables (checkable)

- Cue fires exactly once per new depth record, is restrained in size
  and duration (HUD-adjacent, section 14.3 readability), and reads the
  existing record state only.

## Tests

- Node/scenario: set a new depth record via the shared scenario
  harness — the cue state flips once; swimming shallower or equal
  depth does not re-fire.
- Browser (local proof): clip or screenshot of the tick cue firing in
  an early band (no spoiler exposure). The final proof owner of the
  AC-art-geometry juice-part browser union is WI-06d-b6 — do not
  re-assert the six-effect union here.

## Constraints, assumptions, non-goals

- No gameplay logic beyond the depth comparison already in the sim;
  no new sim state, no new content.
- No particle (WI-06d-b1), lighting (WI-06d-b2), camera
  (WI-06d-b4) or school (WI-06d-b5) changes; no audio (WI-06e will
  own any sound for this moment).
- The a11y reduced-flashing toggle (WI-06g) will gate this cue
  downstream; design the cue so a single boolean can suppress it.
- Spoiler rules (sections 0, 12, 68, 70): record with early bands or
  private fixtures and internal ids only.

## Fresh-session handoff

Read WI-06d-b/plan.md (story scope and proof ownership). Inspect
`src/ui/hud.ts` for the depth readout and its sim access, and locate
the existing depth-record comparison/state in the simulation
(`src/sim/`). Request sections: 14.3, 35, 48, 70.

