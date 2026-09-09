---
tags: [review, scratch, probes, creatures, tier-3, pin-controller]
symbols: [pinRestExcept, T14, T16, T17, T18, CREATURE_STATES, Percept]
---

# Reviewing pin-controller changes (WI-03c1b attempt-2 review)

How to verify a rest-state pin controller change in `src/content/secret/
hiddenCreatures.ts` without a full scenario run:

- Controllers are module-private but reachable through the exported defs:
  `T14.behavior.controller` etc. (`hiddenCreatures.ts` exports `T01…T18`,
  `TIERn_CREATURES`). Invoke with a real `new Creature(def, vec2(0,0),
  new WorldSignalBus(), createRng(1))`, a minimal
  `Percept = { noise:0, light:0, sonar:0, injury:0 }` (from
  `src/creatures/senses.ts`), and `dt = 1/60`.
- The pin contract per organism: every state in the exported
  `CREATURE_STATES` (from `src/creatures/CreatureDef.ts`) except the armed
  state must pin to `state='idle'` + `target=null`; the armed state (T-14
  `alert`; T-16/T-17 `custom`) must be left untouched, target included.
- A de-duplication claim is checkable in the source text: the exact two-line
  pin body (`creature.state = 'idle';` + `creature.target = null;`) must
  occur exactly once; an inline `creature.state !== '<armed>'` comparison
  anywhere means a copy was re-introduced.
- The reviewer probe config at
  `agents/tasks/hadalv2.execute_leaf.__attempt_0015/scratch/reviewer/
  adversarial/vitest.config.ts` includes ALL `*.test.ts` under
  `scratch/reviewer/**` — drop a new probe file there and the same one-line
  command runs it; index the folder's `AGENTS.md`.
- Tier-2 controllers pin `forage` (six sites) — do not mistake those for
  tier-3 pin duplicates; T-13 has its own machine, T-15 is a no-op
  stand-down, T-18 has no controller.

Gotcha: the pin controllers mutate `creature.state`/`target` directly
(bypassing `setState`), so probing them needs no stepping at all — a single
synchronous call per state is sufficient and deterministic.
