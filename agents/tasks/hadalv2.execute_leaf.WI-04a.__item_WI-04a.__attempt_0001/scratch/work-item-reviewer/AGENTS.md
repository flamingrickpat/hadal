# work-item-reviewer scratch — WI-04a

Independent adversarial probes for the WI-04a review
(`../../reviews/WI-04a-review.md`). Both are disposable and were designed
independently of the implementer's tests.

- `wi04a-beats-live/` — live-page browser probe (Node + `playwright-core`)
  driving a real `npm run dev` page in a fresh browser profile; the browser
  half of the work item's verification that the implementer did not run.
  Result: 31/36 checks green — all five beats fire in sequence through the
  live trigger system with their presentation state present, no console
  errors; the 5 red checks are Finding 1 (flags orphaned on the live load
  path). See its `AGENTS.md`.
- `wi04a-flag-repro/` — two-test headless repro (product API, via a scratch
  vitest config) that the trigger-set story flags are visible on the fresh
  construction path but orphaned on the live `createSimulationFromSave`
  path. Red-stable for the implementer's fix. See its `AGENTS.md`.
