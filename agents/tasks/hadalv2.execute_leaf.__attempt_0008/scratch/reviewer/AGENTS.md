# Reviewer scratch — WI-02c

Disposable reviewer probes for the WI-02c review (kept out of product code
and product tests).

- `vitest.review.config.ts` — vitest config rooted at this folder so the
  probes run without touching the product test rig.
- `ecology-adversarial.test.ts` — four independent causality/determinism
  probes against the production `Simulation` via the existing `Scenario`
  harness (scavenge with/without KILL_TAG, quiet-hold displacement, flee
  with/without predator, same-seed determinism). All four pass.
