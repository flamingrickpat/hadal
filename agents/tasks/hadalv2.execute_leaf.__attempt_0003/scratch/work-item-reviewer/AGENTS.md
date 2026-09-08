# scratch — work-item-reviewer probes

Disposable review probes for WI-02a (headless creature simulation core).
These run against the real product modules via the repo's vitest runner;
they are evidence for `reviews/WI-02a-review.md`, not product code.

Run from the repo root:

```
npx vitest run -c agents/tasks/hadalv2.execute_leaf.__attempt_0003/scratch/work-item-reviewer/probes/vitest.config.mts
```

## probes/

- `reviewer-probes.test.ts` — three adversarial checks:
  1. `WorldSignalBus` perception decays with distance AND age and expires
     at `SIGNAL_LIFETIME` (falsifies a flat within-range percept);
  2. a bespoke controller can force a transition that is illegal in
     `DEFAULT_TRANSITIONS`, and it is recorded for audio emission;
  3. a creature beyond `CREATURE_AI_RANGE` does not perceive a signal at
     its own position and does not tick.
- `vitest.config.mts` — minimal vitest config that includes this directory
  (the project config only includes `src/**/*.test.ts`); does not modify
  the project config or any product file.
