# reviewer scratch — WI-03c1a

Independent, disposable adversarial probes the work-item-reviewer designed and
ran against the real production `Simulation` (no mocks of the rules). Separate
from the implementer's own tests so the review is not just a re-run of them.

- `wi03c1a-probe/vitest.config.ts` — config that runs only the probe file.
- `wi03c1a-probe/probe.test.ts` — 5 probes, all passing:
  - damage model keyed by size class (a medium *non-attacker* T-18 still dies
    on the 5th hit — not the combat flag or an id),
  - large deter on the *other* large organism (T-16, never kills, deter
    refreshes),
  - harpoon hits the NEAREST creature in a two-target case,
  - an out-of-range whiff is a no-op,
  - no HP bar on any live tier-3 instance.

Run: `npx vitest run --config agents/tasks/hadalv2.execute_leaf.__attempt_0014/scratch/reviewer/wi03c1a-probe/vitest.config.ts`
