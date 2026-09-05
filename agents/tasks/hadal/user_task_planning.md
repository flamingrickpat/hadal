# User Task Planning — hadal

Raw planning input excerpts from `request.md` (the sole product specification) and the
decisions made while decomposing the task into 17 work items.

## Excerpts relied on

- §45 MVP acceptance criteria — the source of every observable work-item criterion:
  playable start-to-ending without console commands; ≥4 depth transitions after the coast;
  crafting gates depth/capabilities; ≥15 creature types, ≥4 non-chase behaviors, ≥2
  beneficial/friendly, ≥3 large-scale events; ≥5 authored surprise beats; MacGuffin reached
  and retrieved and retrieval changes the final sequence; death + save/load work;
  blind playthrough under 2.5 h targeting 90–120 min; smooth performance in the largest
  encounter; the user is not spoiled by development chatter.
- §44 implementation phases 1–9 — the natural work-item backbone (skeleton → visual
  language → progression backbone → private creative pass → creature framework + roster →
  authored encounters → full art/audio → balance → spoiler-safe handoff).
- §73 things explicitly NOT to build — non-goals (base construction, farming, hunger/thirst,
  multiplayer, infinite procedural world, roguelike, deep dialogue trees, quest board,
  skill/XP, dozens of weapons, armor rarity, extra crafting stations, monetization,
  achievements, mobile controls, live service).
- §28 technology stack — HTML5 + TypeScript + Vite + Three.js (`WebGLRenderer`) + native
  WebAudio + Vitest; no React unless justified, no general-purpose ECS, no heavy physics.
- §72 scope-cut order — the safety valve; the never-cut list (creature quality, depth
  progression, sonar, atmosphere, the five spectacle beats, the final reveal, friendly
  fauna, saves) is enforced as a hard constraint.
- §75 final instruction — decide independently; make strong creative decisions; do not ask
  the user to choose among monster/lore/palette/ending options (it would destroy the
  surprise the user explicitly requested).

## Decisions made (recorded in `plan.md` under Assumptions / Assumption Ledger)

- The request is the sole complete spec; where silent, follow §75's decision rules.
- As planner I create no product files (not even scaffolding) — implementer work.
- The working title stays `HADAL`; numeric tuning values are defaults, not sacred.
- Creative content (world/roster/reveals/MacGuffin/endings) is decided by the implementer
  during the private creative pass (WI-09) and recorded in `design_private/`; the plan and
  every work item describe the *process and criteria*, never the *content*, so nothing
  spoils the player (§0, §12, §68).
- Desktop browser only, keyboard + mouse; gamepad optional (first cut).
- The nine §44 phases are decomposed into 17 work items (a granularity decision, not a
  scope change); each is independently committable and reviewable, ordered by dependency.
- The small greybox world (WI-02/03) is refactored into the full authored chunk model
  (WI-07) as a preparatory refactor, preserving behaviour.

## Decomposition rationale

- Group by subsystem/phase so each work item is one independently committable, reviewable
  behavior a single implementer session can finish: the skeleton is split into three
  (scaffold, player/terrain/oxygen, base/craft/save) because each has distinct acceptance
  criteria; the creature framework (WI-10) is kept content-neutral and separate from the
  hidden roster (WI-11) so the spoiler-sensitive content is isolated; the creative pass
  (WI-09) precedes the roster/encounters/MacGuffin that consume it.
- The last work item (WI-17) is reserved for real-user-path delivery verification: it
  executes the request §70 checklist end-to-end in a real desktop browser and records
  `application_verification.md` with in-seam remediation (no automation exists in this
  checkout, so the evidence is manual observation).
