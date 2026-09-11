# reviewer scratch — WI-06d-b4

Independent, disposable adversarial probe the work-item-reviewer designed and
ran against the production impulse flag implementation (no mocks). Separate
from the implementer's own tests so the review is not just a re-run of them.

- `probe.ts` — 9 edge-case probes verifying trigger thresholds, distance band,
  decay behavior, amplitude cap, and near/distant motion exclusions for the
  impulse flag system. All probes assert expected outcomes against the
  implementation constants (IMPULSE_TRIGGER_DISTANCE=2000,
  IMPULSE_MOTION_THRESHOLD=10000, IMPULSE_NUDGE_AMPLITUDE=30,
  IMPULSE_DECAY_TIME=0.4).

Run: `npx tsx probe.ts`