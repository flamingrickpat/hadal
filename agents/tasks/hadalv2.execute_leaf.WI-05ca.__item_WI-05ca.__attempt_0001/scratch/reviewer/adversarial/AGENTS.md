# WI-05ca Adversarial Probes (work-item-reviewer scratch)

Independent verification of ending-variant invariants directly from the
simulation world data, outside the implementer's test suite.

- `ending-invariants.ts` — verifies that two ending triggers exist in
  the world data at different coordinates, both set the
  `ending-triggered` flag and their own variant-specific story flag,
  both are `once: true` (one-shot), and both produce different radio
  text. Run with `npx tsx ending-invariants.ts`.

Evidence: all invariant checks passed (see `ending-invariants.ts` output).
