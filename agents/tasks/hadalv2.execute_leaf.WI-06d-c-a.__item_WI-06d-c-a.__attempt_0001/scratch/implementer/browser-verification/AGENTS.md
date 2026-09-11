# Browser Verification for WI-06d-c-a

## Artifacts

- `probe.ts` — Node-based browser verification probe that exercises the full shake path: WI-06d-b4 impulse triggers shake, low-frequency gate filters high-frequency jitter, section 16 amplitude budget caps shake, and the presentation flag gates the entire path.

## How to Run

```bash
cd C:\Temp\hadal-v2
npx tsx agents/tasks/hadalv2.execute_leaf.WI-06d-c-a.__item_WI-06d-c-a.__attempt_0001/scratch/implementer/browser-verification/probe.ts
```

## Results

All 5 checks passed:
1. Impulse trigger conditions work
2. Flag on — shake present within budget
3. Flag off — no shake from any source
4. Low-frequency gate filters high-frequency jitter
5. Per-event amplitude capped at section 16 budget
