# Review: WI-06d-c-a — Section 16 low-frequency shake rules

Status: pass

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| AC-shake-rules: Section 16 low-frequency shake rules are implemented through a single flag-gated path with the section 16 amplitude budget; the presentation flag that WI-06g's screen-shake toggle will consume is in place; flag off means no shake from any source | Passed | Unit tests, adversarial probe, code inspection |

## Findings

None.

## Impact Check

- **`emitShake` (src/render/shake.ts:64)** — 4 callers identified. All call sites go through the shake path as required. No off-path shake sources.
- **`updateShake` (src/render/shake.ts:77)** — 4 callers. Only called from `Renderer.render()` in production.
- **`getShakeOffset` (src/render/shake.ts:110)** — 4 callers. Only called from `Renderer.render()` in production.
- **`setShakeEnabled` (src/render/shake.ts:47)** — 4 callers. Exposed via `Renderer.setShakeEnabled()` for WI-06g's toggle.
- **`isImpulseActive` (src/render/impulseFlag.ts:78)** — used by the shake path to gate emission. The legacy `getImpulseOffset()` is no longer called by the Renderer (it's now replaced by the shake path), but the API remains available for tests and potential future use.

No other callers of these symbols exist. The shake path is truly a single emission point.

## Independent Adversarial Probes

**Probe 1: Impulse bypasses shake flag?**
- Question: Does the WI-06d-b4 distant-motion impulse produce camera offset when the shake flag is off?
- Method: Trigger the impulse, set the shake flag off, advance 60 frames, check for shake offset.
- Expected: No shake observed.
- Observed: No shake observed (PASS).
- Command: `npx tsx agents/tasks/hadalv2.execute_leaf.WI-06d-c-a.__item_WI-06d-c-a.__attempt_0001/scratch/reviewer/adversarial/impulse_bypasses_flag.ts`

**Probe 2: Full test suite regressions**
- Question: Did this change break existing functionality?
- Command: `npx vitest run`
- Observed: 453/455 tests pass. The 2 failures are in `src/sim/rosterFinalProof.test.ts` and `src/sim/tier3Scenario.test.ts` (both about T-17 spawn placement in the wrong depth band) — these are pre-existing failures unrelated to the shake path. Confirmed by comparing with previous commits.

**Probe 3: TypeScript build errors**
- Question: Did this change introduce type errors?
- Command: `npx tsc --noEmit`
- Observed: 52 type errors, all in test files (`lighting.test.ts`, `tier4Render.test.ts`, `depthRecord.test.ts`, `endgameSaveScenario.test.ts`, `finalDescentScenario.test.ts`, `rosterFinalProof.test.ts`, `tier2Scenario.test.ts`, `tier3Scenario.test.ts`, `tier4Scenario.test.ts`) and `Simulation.ts`. None in `src/render/shake.ts` or `src/render/Renderer.ts`. All pre-existing.

## Verification Evidence

| Verification step | Command | Result |
|---|---|---|
| Shake unit tests | `npx vitest run src/render/shake.test.ts` | 9/9 passed |
| Impulse unit tests | `npx vitest run src/render/impulse.test.ts` | 14/14 passed |
| Full test suite | `npx vitest run` | 453/455 passed (2 pre-existing failures) |
| TypeScript build | `npx tsc --noEmit` | Pre-existing errors only, none in changed files |
| Adversarial probe (flag off + impulse) | `npx tsx .../impulse_bypasses_flag.ts` | All 3 tests passed |
| Code inspection (single path) | `rg "camera.left" src/ --type ts` | Only `Renderer.ts` modifies camera boundaries |
| Code inspection (shake sources) | `rg "shake\|Shake" src/ --type ts` | Only `shake.ts`, `impulseFlag.ts`, `Renderer.ts` contain shake code |

## What I Could Not Verify

- **Browser (final proof) test**: The work item specification designates the browser test as "final proof owner of AC-shake-rules." The implementer claims this was run and recorded in `application_verification.md` and `scratch/implementer/browser-verification/probe.ts`. I inspected the browser probe script and it appears sound (it simulates the frame loop and measures shake offset across frames). However, I did not run it in a real browser myself — I ran a Node.js-based adversarial probe that covers the same behavior. The implementer's browser probe ran successfully according to their report.
- **Actual game behavior in a real browser**: I verified the simulation logic, but the visual appearance of the shake in a real browser (whether it's "low-frequency" and "within budget" visually) is a judgment call that requires a human in a real browser.

## Conclusion

The implementation satisfies AC-shake-rules:

1. **Single gated shake path**: All shake sources emit through `emitShake()` in `src/render/shake.ts`. The `Renderer.render()` method applies the shake offset at one point (lines 180-184). No off-path camera modifications exist.

2. **Low-frequency gate**: The `applyFilter()` function in `shake.ts` implements an 8th-order Butterworth low-pass filter with a cutoff at 3 Hz. High-frequency jitter (e.g., 15 Hz) is attenuated to <1% of its original amplitude.

3. **Section 16 amplitude budget**: `SHAKE_AMPLITUDE_BUDGET = 20` is enforced both per-event (in `emitShake`) and on the filtered result (in `applyFilter`).

4. **Presentation flag**: `setShakeEnabled()` sets a boolean that suppresses all shake when off. When `!shakeEnabled`, `getShakeOffset()` returns `vec2(0, 0)` regardless of any emitted events. The flag is exposed on the `Renderer` via `setShakeEnabled()` for WI-06g's toggle.

The implementation is focused, with no scope creep beyond the shake infrastructure. The dependency on WI-06d-b4 is satisfied (the distant-motion impulse is already in place and is now routed through the shake path). No new shake sources were added.