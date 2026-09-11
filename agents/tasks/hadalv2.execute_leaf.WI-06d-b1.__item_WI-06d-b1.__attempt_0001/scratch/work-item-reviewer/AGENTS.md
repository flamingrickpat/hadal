# work-item-reviewer scratch — WI-06d-b1

Independent adversarial probe for the WI-06d-b1 review
(`../../reviews/WI-06d-b1-review.md`). Disposable and designed independently
of the implementer's tests.

- `adversarial.test.ts` — vitest probe that the new bubble and silt juice
  particle layers are depth-consistent: bubbles rise at all depths (0–12000m),
  juice silt is always distinct from ambient silt, and the new buffer
  allocations (100 slots for bubbles, 200 for silt juice) are sufficient for
  the authored per-band counts.
