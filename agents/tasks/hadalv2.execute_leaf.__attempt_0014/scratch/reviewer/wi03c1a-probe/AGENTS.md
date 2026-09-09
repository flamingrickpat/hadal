# scratch/reviewer/wi03c1a-probe (WI-03c1a)

Reviewer's independent adversarial probe — one bounded experiment, separate
from the implementer's own tests, driving the real production `Simulation`
(no rule mocks) to check the WI-03c1a size-class damage model on its own.
Evidence for `../../reviews/WI-03c1a-review.md`.

## files

- `probe.test.ts` — five vitest probes, all passing:
  1. damage is keyed by SIZE CLASS, not the combat flag or an id — a medium
     non-attacker (T-18, which has no `combat`) dies on the 5th harpoon hit;
  2. a large creature with no prior hunt deters, never kills, and its deter
     refreshes (T-16 the boulder);
  3. the harpoon hits the NEAREST in-range creature, not an arbitrary one —
     two targets, the farther one survives;
  4. a whiff (nothing in range) is a no-op;
  5. no HP bar — every live tier-3 instance exposes no
     `hp`/`maxHp`/`health`/`hpMax`.
- `vitest.config.ts` — minimal vitest config that runs only this probe file
  (the project config only includes `src/**/*.test.ts`); touches no project
  or product file.

Run from the repo root:
`npx vitest run --config agents/tasks/hadalv2.execute_leaf.__attempt_0014/scratch/reviewer/wi03c1a-probe/vitest.config.ts`
