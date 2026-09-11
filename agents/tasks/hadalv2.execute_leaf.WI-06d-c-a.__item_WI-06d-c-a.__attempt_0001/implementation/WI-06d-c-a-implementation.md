# WI-06d-c-a Implementation Result

**Work item:** WI-06d-c-a — Section 16 low-frequency shake rules
**Status:** Implemented

## Summary

Land the section 16 shake rules: all shake sources emit through a single low-frequency-gated path driven by one presentation flag, with the section 16 amplitude budget. The presentation flag is the seam WI-06g's screen-shake toggle will flip. This item builds the shake infrastructure only — it adds no shake sources.

## Implementation Approach

Created a single shake module (`src/render/shake.ts`) that provides:
- `emitShake(amplitude, frequency)` — the single entry point all shake sources use
- `setShakeEnabled(enabled)` — the presentation flag WI-06g will flip
- `updateShake(dt)` — applies low-pass filtering and decay each frame
- `getShakeOffset()` — returns the filtered, budget-capped camera offset

The low-pass filter uses a steep roll-off (order 8 Butterworth) to block high-frequency jitter while passing low-frequency oscillations. The amplitude budget is enforced both per-event and on the accumulated shake.

Updated `src/render/Renderer.ts` to:
- Route the WI-06d-b4 distant-motion impulse through the shake path (emits when impulse is active)
- Apply the shake offset in the render method
- Expose `setShakeEnabled()` for WI-06g's accessibility toggle

## Acceptance Evidence Table

| Criterion | Artifact | Status |
|-----------|----------|--------|
| AC-shake-rules | `src/render/shake.ts` — single flag-gated path with low-frequency gate and amplitude budget; `src/render/Renderer.ts` — all shake sources emit through the path; `setShakeEnabled()` presentation flag in place | Passed |

## Tests

| Test | Status | Notes |
|------|--------|-------|
| `src/render/shake.test.ts` (9 tests) | All passed | Presentation flag plumbing (3), low-frequency gate (3), amplitude budget (2), decay (1) |
| `src/render/impulse.test.ts` (14 tests) | All passed | Confirms existing impulse tests still pass |
| Full vitest suite | 2 failed | Pre-existing failures in tier2/3/4 scenario tests, unrelated to this change |
| TypeScript build | Pre-existing errors | Same errors as before this change (tier2/3/4 scenario tests), unrelated to this change |

## Live Verification

Not applicable for this work item — the shake infrastructure is verified through unit tests. The browser proof (WI-06g or final delivery verification) will exercise the end-to-end path with the WI-06d-b4 impulse active.

## Deviations from Plan

None.

## Files Touched

- `src/render/shake.ts` — new: shake path module (flag, low-pass filter, amplitude budget)
- `src/render/Renderer.ts` — modified: route impulse through shake path, apply shake offset, expose `setShakeEnabled()`
- `src/render/shake.test.ts` — new: tests for flag plumbing, low-frequency gate, amplitude budget, decay

## Notes for Reviewer

- The shake path is a pure state machine with bounded values; no external dependencies.
- The impulse from WI-06d-b4 now emits through the shake path with a low-frequency (2 Hz) profile that fits the section 16 budget. The shake will persist slightly longer than the impulse itself due to the shake's own decay, which is desirable for a natural fade.
- The `setShakeEnabled()` method is exposed on the Renderer so WI-06g's accessibility toggle can flip it. When disabled, no shake of any amplitude is applied regardless of active shake sources.
- The low-pass filter uses a steep roll-off to effectively block high-frequency jitter (10 Hz and above are attenuated to <1% of their original amplitude).

## Knowledge Notes Consulted/Written

None.