# Understanding

This child implements one independently reviewed work item from C:\Temp\hadal-v2\agents\tasks\hadalv2.

---
id: WI-06d-c-a
kind: work_item
parent: WI-06d-c
children: []
depends_on: ["WI-06a", "WI-06b", "WI-06c", "WI-06d-b4"]
criteria:
  AC-shake-rules: "Section 16 low-frequency shake rules are implemented through a single flag-gated path with the section 16 amplitude budget; the presentation flag that WI-06g's screen-shake toggle will consume is in place; flag off means no shake from any source"
behavior: "Land the section 16 low-frequency shake rules: all shake sources emit through one flag-gated low-frequency path with the section 16 amplitude budget, controlled by the presentation flag WI-06g's screen-shake toggle will flip"
subsystems: ["camera - low-frequency shake path"]
verification: "Node unit tests pass for the presentation-flag plumbing (flag on/off gates the path), the low-frequency gate (high-frequency jitter filtered) and the amplitude budget (per-event and accumulated); browser (final proof): with the WI-06d-b4 distant-motion impulse active, flag on = shake present, low-frequency, within the section 16 budget; flag off = no shake from any source; headless suite and build stay green"
---

# WI-06d-c-a — Section 16 low-frequency shake rules

## Goal

Land the section 16 shake rules: all shake sources emit through a
single low-frequency-gated path driven by one presentation flag, with
the section 16 amplitude budget. The presentation flag is the exact
seam WI-06g's screen-shake toggle will flip. This item builds the
shake infrastructure only — it adds no shake sources.

## Changed responsibilities (the only owners that change)

1. The shake path in the camera/render layer — a single gated
   emission point in the existing camera code (`src/render/`) that
   all shake sources (including the distant-motion impulse from
   WI-06d-b4) emit through. It applies the low-frequency gate (only
   low-frequency oscillations pass; high-frequency jitter is
   filtered) and the section 16 amplitude budget (no individual shake
   event or accumulated shake exceeds the section 16 limit).
2. The presentation flag — a simple boolean in the render/camera
   state that the shake path consults: flag off means no shake of any
   amplitude from any source. It is the seam WI-06g's screen-shake
   toggle will flip; no UI is built here.

Tests for these owners (unit tests for the gate, budget and flag
plumbing) do not count as additional responsibilities.

## Deliverables (checkable)

- A single gated shake path: every shake source emits through it; no
  source applies raw camera shake off-path.
- Low-frequency gate: only low-frequency oscillations pass;
  high-frequency jitter is filtered out.
- Section 16 amplitude budget: no individual shake event or
  accumulated shake exceeds the section 16 limit.
- Presentation flag: flag off = no shake of any amplitude from any
  source; flag on = the gated path applies. A plain boolean in the
  render/camera state, the exact seam for WI-06g's screen-shake
  toggle.

## Tests

- Node: unit tests for the flag plumbing (flag on/off gates the path
  correctly; flag off suppresses all sources), the low-frequency gate
  (low-frequency oscillation passes, high-frequency jitter is
  filtered) and the amplitude budget (per-event and accumulated
  shake capped at the section 16 limit). Suite and build stay green.
- Browser (final proof owner of AC-shake-rules): with the WI-06d-b4
  distant-motion impulse active as the shake source — flag on =
  shake present, observed to stay low-frequency (no high-frequency
  jitter), amplitude within the section 16 budget; flag off = no
  shake from any source. Record the flag on/off comparison.

## Constraints, assumptions, non-goals

- No new shake sources: this item consumes the WI-06d-b4
  distant-motion impulse (trigger and nudge implemented there; it
  emits through the path this item creates — hence the dependency on
  WI-06d-b4) and whatever shake sources already exist.
- No widescreen composition work (WI-06d-c-b), no juice effects
  (WI-06d-b), no geometry replacement (WI-06d-a).
- No settings UI (WI-06g owns it); no new gameplay rules, no steering
  or balance changes, no new content.
- Spoiler rules (sections 0, 12, 68, 70): late-game areas are
  recorded with private fixtures and internal ids only.

## Fresh-session handoff

Read WI-06d-c/plan.md (story scope, criteria assignment, proof
ownership), WI-06d/plan.md and ST-06/plan.md for context, and
request section 16 (low-frequency shake rules, amplitude budget).
Inspect the camera/render path in `src/render/` for where the shake
gate and presentation flag live. Read WI-06d-b4 for the distant-
motion impulse that feeds this item's shake path. Do not start before
WI-06a/b/c are accepted (the shake behavior must work in the settled
band scenes).

