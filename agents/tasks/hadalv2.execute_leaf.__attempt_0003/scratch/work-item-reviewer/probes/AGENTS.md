# probe — reviewer-probes (WI-02a)

Bounded experiment: three adversarial checks against the real product modules
(senses, Creature, fixtures, constants) to verify the WI-02a creature runtime.
Evidence for `reviews/WI-02a-review.md`; not product code.

Run from the repo root:

```
npx vitest run -c agents/tasks/hadalv2.execute_leaf.__attempt_0003/scratch/work-item-reviewer/probes/vitest.config.mts
```

## Files

- `reviewer-probes.test.ts` — the probe. Three questions:
  1. `WorldSignalBus.perceive` decays with distance AND age and expires at
     `SIGNAL_LIFETIME` (a flat within-range percept would falsify the
     "nearby recent signals" contract);
  2. a bespoke controller can force a transition that is illegal in the
     generic table, and it is recorded for audio emission;
  3. a creature beyond `CREATURE_AI_RANGE` does not perceive a signal at its
     own position and does not tick.
- `vitest.config.mts` — minimal vitest config that includes this directory
  (the project config only includes `src/**/*.test.ts`); does not modify the
  project config or any product file.
