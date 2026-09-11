# Review: WI-06d-b2 — Light sway

Status: pass

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| AC-juice-lightsway | pass | Sway parameters in BandProfile (amplitude, period, phase) are per-band tuned; lighting.ts drives sway via slow animated clock; 9 sway-related Node tests pass |
| AC-art-geometry (juice part) | pass | Light sway is implemented in the section 35 lighting path; the six-effect union proof is owned by WI-06d-b6 (deferred per work item note) |

## Findings

None. The implementation is complete and correct.

## Impact Check

- `codegraph_explore` on BandProfile: 17 callers identified. All callers use the BandProfile as read-only data; the new sway fields are consumed only by `Lighting.update()` via the profile parameter. No callers need to be updated.
- `codegraph_explore` on `Lighting.update()`: 1 caller in `Game.ts` (`renderVisuals`). The caller was updated in the same commit to pass the frame `dt`. No other callers exist.
- `codegraph_explore` on `Lighting` class: 4 callers, all in `Game.ts`. The `update()` method signature change is the only breaking change, and it was handled in the same commit.

## Independent Adversarial Probes

1. **Sway parameter monotonicity probe**: Verified that sway amplitude decreases monotonically with depth (0.12 → 0.01) and sway period increases monotonically with depth (4.5s → 10s). This confirms the "deeper bands sway less and more slowly" design intent.
2. **Phase desync probe**: Verified that each band has a distinct phase offset (0, 1.2, 2.4, 3.6, 4.8 radians), ensuring bands do not sway in unison.
3. **Amplitude envelope probe**: Verified all sway amplitudes are within the low-amplitude envelope (≤ 0.15), ensuring the settled band palette remains recognizable in motion (≤ ±12% intensity modulation).
4. **Period probe**: Verified all sway periods are within the seconds-scale range (3–15s), ensuring the sway reads as living water, not flicker.
5. **Test execution probe**: Ran the full test suite (`npm test`), confirming all sway-related tests pass (6 in band.test.ts, 3 in lighting.test.ts). The 2 pre-existing failures in rosterFinalProof and tier3Scenario are unrelated to this work item.

## What I Could Not Verify

- Browser clip or screenshot showing the slow light movement in at least two bands: this is deferred to WI-06d-b6 per the work item specification. The Node tests cover the parameter data and behavior, but the visual proof of the effect in a browser is not in this work item's scope.
